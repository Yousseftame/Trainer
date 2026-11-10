import {HttpsError, onCall} from "firebase-functions/v2/https";
import {COLLECTIONS} from "../config/collections.js";
import {db} from "../config/firebase.js";
import {assertSubscriberCaller} from "../lib/authz.js";
import {stripUndefined} from "../lib/utils.js";
import {
  normalizeEntitlements,
  resolveEffectiveSubscriptionStatus,
  type PackageEntitlements,
} from "../shared/contentAccess.js";

type EnergyLevel = "great" | "good" | "tired" | "exhausted";

type CompletedExerciseInput = {
  exerciseId?: unknown;
  name?: unknown;
  targetSets?: unknown;
  completedSets?: unknown;
  weightKg?: unknown;
  repsDone?: unknown;
  durationSeconds?: unknown;
  restSeconds?: unknown;
  notes?: unknown;
  wasSubstituted?: unknown;
  substituteName?: unknown;
};

function asFiniteNumber(value: unknown, fallback = 0): number {
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function asOptionalString(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed || undefined;
}

function normalizeExercisesCompleted(
  raw: unknown,
): Record<string, unknown>[] | undefined {
  if (!Array.isArray(raw)) return undefined;
  const rows: Record<string, unknown>[] = [];
  for (const item of raw.slice(0, 80)) {
    if (!item || typeof item !== "object") continue;
    const row = item as CompletedExerciseInput;
    const exerciseId = asOptionalString(row.exerciseId);
    const name = asOptionalString(row.name);
    if (!exerciseId || !name) continue;
    rows.push(
      stripUndefined({
        exerciseId,
        name,
        targetSets:
          row.targetSets === undefined || row.targetSets === null
            ? undefined
            : Math.max(0, asFiniteNumber(row.targetSets, 0)),
        completedSets: Math.max(0, asFiniteNumber(row.completedSets, 0)),
        weightKg:
          row.weightKg === undefined || row.weightKg === null
            ? undefined
            : asFiniteNumber(row.weightKg, 0),
        repsDone:
          typeof row.repsDone === "string" || typeof row.repsDone === "number"
            ? row.repsDone
            : undefined,
        durationSeconds:
          row.durationSeconds === undefined || row.durationSeconds === null
            ? undefined
            : Math.max(0, asFiniteNumber(row.durationSeconds, 0)),
        restSeconds:
          row.restSeconds === undefined || row.restSeconds === null
            ? undefined
            : Math.max(0, asFiniteNumber(row.restSeconds, 0)),
        notes: asOptionalString(row.notes),
        wasSubstituted: Boolean(row.wasSubstituted) || undefined,
        substituteName: asOptionalString(row.substituteName),
      }),
    );
  }
  return rows.length ? rows : undefined;
}

async function resolveWorkoutEntitlement(uid: string): Promise<{
  allowed: boolean;
  entitlements: PackageEntitlements;
}> {
  const subsSnap = await db
    .collection(COLLECTIONS.subscriptions)
    .where("subscriberId", "==", uid)
    .get();

  let bestSubData: Record<string, unknown> | null = null;
  for (const docSnap of subsSnap.docs) {
    const data = docSnap.data() as Record<string, unknown>;
    const status = String(data.status ?? "");
    if (status === "active" || status === "suspended") {
      bestSubData = data;
      if (status === "active") break;
    }
    if (!bestSubData) bestSubData = data;
  }

  const packageId = bestSubData ? String(bestSubData.packageId ?? "") : "";
  const effectiveStatus = resolveEffectiveSubscriptionStatus(
    bestSubData ? String(bestSubData.status ?? "") : undefined,
    bestSubData?.endsAt ? String(bestSubData.endsAt) : null,
  );

  let entitlements = normalizeEntitlements(
    (bestSubData?.entitlementsSnapshot as Partial<PackageEntitlements> | undefined) ??
      null,
  );

  if (packageId) {
    const pkgSnap = await db.collection(COLLECTIONS.packages).doc(packageId).get();
    if (pkgSnap.exists) {
      const pkg = pkgSnap.data() ?? {};
      entitlements = normalizeEntitlements(
        (pkg.entitlements as Partial<PackageEntitlements> | undefined) ??
          (bestSubData?.entitlementsSnapshot as
            | Partial<PackageEntitlements>
            | undefined) ??
          null,
      );
    }
  }

  return {
    allowed: effectiveStatus === "active" && Boolean(entitlements.workoutProgram),
    entitlements,
  };
}

/**
 * Subscriber logs a completed workout session.
 * Forces uid ownership, validates assigned program/day, bumps completion.
 * Client SDK cannot create workout_logs or update workout_programs.
 */
export const logWorkoutSession = onCall(async (request) => {
  const {uid} = assertSubscriberCaller(request.auth);
  const data = (request.data ?? {}) as Record<string, unknown>;

  const programId = asOptionalString(data.programId);
  const dayId = asOptionalString(data.dayId);
  if (!programId || !dayId) {
    throw new HttpsError("invalid-argument", "programId and dayId are required.");
  }

  // Ignore any client-supplied subscriberId — always bind to auth uid.
  const subscriberSnap = await db.collection(COLLECTIONS.subscribers).doc(uid).get();
  if (!subscriberSnap.exists) {
    throw new HttpsError("not-found", "Subscriber profile not found.");
  }
  const subscriberStatus = String(subscriberSnap.data()?.status ?? "pending");
  if (subscriberStatus !== "active") {
    throw new HttpsError("permission-denied", "Subscriber account is not active.");
  }

  const entitlement = await resolveWorkoutEntitlement(uid);
  if (!entitlement.allowed) {
    throw new HttpsError(
      "permission-denied",
      "Active subscription with workoutProgram entitlement required.",
    );
  }

  const programRef = db.collection(COLLECTIONS.workoutPrograms).doc(programId);
  const programSnap = await programRef.get();
  if (!programSnap.exists) {
    throw new HttpsError("not-found", "Workout program not found.");
  }

  const program = programSnap.data() ?? {};
  if (String(program.subscriberId ?? "") !== uid) {
    throw new HttpsError(
      "permission-denied",
      "Program is not assigned to this subscriber.",
    );
  }
  if (String(program.status ?? "") !== "active") {
    throw new HttpsError(
      "failed-precondition",
      "Only the active assigned program can receive new session logs.",
    );
  }

  const days = Array.isArray(program.days) ? program.days : [];
  const day = days.find(
    (item) => item && typeof item === "object" && String((item as {id?: unknown}).id ?? "") === dayId,
  ) as {id?: string; weekday?: number; isRest?: boolean; label?: unknown} | undefined;

  if (!day) {
    throw new HttpsError("invalid-argument", "dayId does not belong to this program.");
  }
  if (day.isRest) {
    throw new HttpsError("failed-precondition", "Cannot log a rest day as a workout session.");
  }

  const weekday = Math.max(0, Math.min(6, asFiniteNumber(data.weekday, Number(day.weekday ?? 0))));
  const now = new Date();
  const date =
    asOptionalString(data.date) ||
    now.toISOString().slice(0, 10);

  const energyRaw = asOptionalString(data.energyLevel);
  const energyLevel: EnergyLevel | undefined =
    energyRaw === "great" ||
    energyRaw === "good" ||
    energyRaw === "tired" ||
    energyRaw === "exhausted"
      ? energyRaw
      : undefined;

  const perceivedEffortRaw = data.perceivedEffort;
  const perceivedEffort =
    perceivedEffortRaw === undefined || perceivedEffortRaw === null
      ? undefined
      : Math.max(1, Math.min(10, asFiniteNumber(perceivedEffortRaw, 5)));

  const logRef = db.collection(COLLECTIONS.workoutLogs).doc();
  const completedAt = now.toISOString();

  const record = stripUndefined({
    id: logRef.id,
    subscriberId: uid,
    programId,
    dayId,
    weekday,
    date,
    workoutTitle: asOptionalString(data.workoutTitle),
    durationMinutes: Math.max(0, asFiniteNumber(data.durationMinutes, 0)),
    activeMinutes: Math.max(0, asFiniteNumber(data.activeMinutes, 0)),
    restMinutes: Math.max(0, asFiniteNumber(data.restMinutes, 0)),
    totalVolumeKg: Math.max(0, asFiniteNumber(data.totalVolumeKg, 0)),
    perceivedEffort,
    energyLevel,
    exercisesCompleted: normalizeExercisesCompleted(data.exercisesCompleted),
    notes: asOptionalString(data.notes),
    completedAt,
  });

  const batch = db.batch();
  batch.set(logRef, record);

  const completion = (program.completion ?? null) as {
    done?: unknown;
    total?: unknown;
  } | null;
  const total = Math.max(0, asFiniteNumber(completion?.total, 0));
  const done = Math.max(0, asFiniteNumber(completion?.done, 0));

  if (total > 0) {
    batch.set(
      programRef,
      {
        completion: {
          total,
          done: Math.min(total, done + 1),
        },
        updatedAt: completedAt,
      },
      {merge: true},
    );
  } else {
    batch.set(programRef, {updatedAt: completedAt}, {merge: true});
  }

  await batch.commit();

  return {ok: true, log: record};
});
