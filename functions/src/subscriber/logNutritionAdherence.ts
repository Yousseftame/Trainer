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

type AdherenceStatus = "adhered" | "mostly" | "deviated" | "skipped";

function asFiniteNumber(value: unknown, fallback = 0): number {
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function asOptionalString(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed || undefined;
}

async function resolveNutritionEntitlement(uid: string): Promise<{
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
    allowed: effectiveStatus === "active" && Boolean(entitlements.nutritionProgram),
    entitlements,
  };
}

/**
 * Subscriber logs daily nutrition adherence.
 * Forces auth uid, validates assigned active program, upserts same-day row,
 * bumps program.adherence for adhered/mostly.
 */
export const logNutritionAdherence = onCall(async (request) => {
  const {uid} = assertSubscriberCaller(request.auth);
  const data = (request.data ?? {}) as Record<string, unknown>;

  const programId = asOptionalString(data.programId);
  if (!programId) {
    throw new HttpsError("invalid-argument", "programId is required.");
  }

  const statusRaw = asOptionalString(data.status);
  const status: AdherenceStatus | undefined =
    statusRaw === "adhered" ||
    statusRaw === "mostly" ||
    statusRaw === "deviated" ||
    statusRaw === "skipped"
      ? statusRaw
      : undefined;
  if (!status) {
    throw new HttpsError(
      "invalid-argument",
      "status must be adhered | mostly | deviated | skipped.",
    );
  }

  const subscriberSnap = await db.collection(COLLECTIONS.subscribers).doc(uid).get();
  if (!subscriberSnap.exists) {
    throw new HttpsError("not-found", "Subscriber profile not found.");
  }
  const subscriberStatus = String(subscriberSnap.data()?.status ?? "pending");
  if (subscriberStatus !== "active") {
    throw new HttpsError("permission-denied", "Subscriber account is not active.");
  }

  const entitlement = await resolveNutritionEntitlement(uid);
  if (!entitlement.allowed) {
    throw new HttpsError(
      "permission-denied",
      "Active subscription with nutritionProgram entitlement required.",
    );
  }

  const programRef = db.collection(COLLECTIONS.nutritionPrograms).doc(programId);
  const programSnap = await programRef.get();
  if (!programSnap.exists) {
    throw new HttpsError("not-found", "Nutrition program not found.");
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
      "Only the active assigned nutrition plan can receive new adherence logs.",
    );
  }

  const now = new Date();
  const date = asOptionalString(data.date) || now.toISOString().slice(0, 10);
  const dayId = asOptionalString(data.dayId);
  const weekdayRaw = data.weekday;

  if (dayId) {
    const days = Array.isArray(program.days) ? program.days : [];
    const day = days.find(
      (item) =>
        item &&
        typeof item === "object" &&
        String((item as {id?: unknown}).id ?? "") === dayId,
    );
    if (!day) {
      throw new HttpsError(
        "invalid-argument",
        "dayId does not belong to this nutrition program.",
      );
    }
  }

  // One adherence row per program per calendar day (upsert).
  const existingSnap = await db
    .collection(COLLECTIONS.nutritionLogs)
    .where("subscriberId", "==", uid)
    .where("date", "==", date)
    .get();
  const existingDoc = existingSnap.docs.find(
    (docSnap) => String(docSnap.data().programId ?? "") === programId,
  );

  const loggedAt = now.toISOString();
  const previousStatus = existingDoc
    ? String(existingDoc.data().status ?? "")
    : null;

  const record = stripUndefined({
    id: existingDoc?.id,
    subscriberId: uid,
    programId,
    date,
    dayId,
    weekday:
      weekdayRaw === undefined || weekdayRaw === null
        ? undefined
        : Math.max(0, Math.min(6, asFiniteNumber(weekdayRaw, 0))),
    status,
    caloriesActual:
      data.caloriesActual === undefined || data.caloriesActual === null
        ? undefined
        : Math.max(0, asFiniteNumber(data.caloriesActual, 0)),
    waterLitersActual:
      data.waterLitersActual === undefined || data.waterLitersActual === null
        ? undefined
        : Math.max(0, asFiniteNumber(data.waterLitersActual, 0)),
    notes: asOptionalString(data.notes),
    loggedAt,
  });

  const batch = db.batch();
  let logId: string;

  if (existingDoc) {
    logId = existingDoc.id;
    batch.set(
      existingDoc.ref,
      stripUndefined({...record, id: logId}),
      {merge: true},
    );
  } else {
    const logRef = db.collection(COLLECTIONS.nutritionLogs).doc();
    logId = logRef.id;
    batch.set(logRef, stripUndefined({...record, id: logId}));
  }

  const countsTowardAdherence = status === "adhered" || status === "mostly";
  const previousCounted =
    previousStatus === "adhered" || previousStatus === "mostly";

  const adherence = (program.adherence ?? null) as {
    done?: unknown;
    total?: unknown;
  } | null;
  const total = Math.max(0, asFiniteNumber(adherence?.total, 0));
  let done = Math.max(0, asFiniteNumber(adherence?.done, 0));

  if (total > 0) {
    if (!previousCounted && countsTowardAdherence) {
      done = Math.min(total, done + 1);
    } else if (previousCounted && !countsTowardAdherence) {
      done = Math.max(0, done - 1);
    }
    batch.set(
      programRef,
      {
        adherence: {total, done},
        updatedAt: loggedAt,
      },
      {merge: true},
    );
  } else {
    batch.set(programRef, {updatedAt: loggedAt}, {merge: true});
  }

  await batch.commit();

  return {
    ok: true,
    log: {...record, id: logId},
  };
});
