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
import {enqueueNotice} from "../shared/notices.js";

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
  };
}

type MealCheck = {
  slotId: string;
  slotTitle: string;
  completed: boolean;
  updatedAt: string;
};

type MealPhoto = {
  slotId: string;
  slotTitle: string;
  photoUrl: string;
  storagePath?: string;
  note?: string;
  uploadedAt: string;
};

function parseMealChecks(raw: unknown): MealCheck[] {
  if (!Array.isArray(raw)) return [];
  const out: MealCheck[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Record<string, unknown>;
    const slotId = asOptionalString(row.slotId);
    const slotTitle = asOptionalString(row.slotTitle) || slotId;
    if (!slotId || !slotTitle) continue;
    out.push({
      slotId,
      slotTitle,
      completed: Boolean(row.completed),
      updatedAt:
        asOptionalString(row.updatedAt) || new Date().toISOString(),
    });
  }
  return out;
}

function parseMealPhotos(raw: unknown): MealPhoto[] {
  if (!Array.isArray(raw)) return [];
  const out: MealPhoto[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Record<string, unknown>;
    const slotId = asOptionalString(row.slotId);
    const slotTitle = asOptionalString(row.slotTitle) || slotId;
    const photoUrl = asOptionalString(row.photoUrl);
    if (!slotId || !slotTitle || !photoUrl) continue;
    out.push(
      stripUndefined({
        slotId,
        slotTitle,
        photoUrl,
        storagePath: asOptionalString(row.storagePath),
        note: asOptionalString(row.note),
        uploadedAt:
          asOptionalString(row.uploadedAt) || new Date().toISOString(),
      }) as MealPhoto,
    );
  }
  return out;
}

/**
 * Subscriber upserts per-meal checkmarks / verification photos into today's
 * nutrition log without bumping day adherence (unless a day status already exists).
 * Meal photos alarm staff; silent meal checks do not.
 */
export const upsertNutritionMealProgress = onCall(async (request) => {
  const {uid} = assertSubscriberCaller(request.auth);
  const data = (request.data ?? {}) as Record<string, unknown>;

  const programId = asOptionalString(data.programId);
  if (!programId) {
    throw new HttpsError("invalid-argument", "programId is required.");
  }

  const mealCheckRaw =
    data.mealCheck && typeof data.mealCheck === "object"
      ? (data.mealCheck as Record<string, unknown>)
      : null;
  const mealChecksBulk = Array.isArray(data.mealChecks)
    ? parseMealChecks(data.mealChecks)
    : [];
  const mealPhotoRaw =
    data.mealPhoto && typeof data.mealPhoto === "object"
      ? (data.mealPhoto as Record<string, unknown>)
      : null;

  if (!mealCheckRaw && mealChecksBulk.length === 0 && !mealPhotoRaw) {
    throw new HttpsError(
      "invalid-argument",
      "mealCheck, mealChecks, or mealPhoto is required.",
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
      "Only the active assigned nutrition plan can receive meal progress.",
    );
  }

  const now = new Date();
  const loggedAt = now.toISOString();
  const date = asOptionalString(data.date) || loggedAt.slice(0, 10);
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

  const existingSnap = await db
    .collection(COLLECTIONS.nutritionLogs)
    .where("subscriberId", "==", uid)
    .where("date", "==", date)
    .get();
  const existingDoc = existingSnap.docs.find(
    (docSnap) => String(docSnap.data().programId ?? "") === programId,
  );
  const existing = existingDoc
    ? (existingDoc.data() as Record<string, unknown>)
    : null;

  let mealChecks = parseMealChecks(existing?.mealChecks);
  let mealPhotos = parseMealPhotos(existing?.mealPhotos);
  let photoNotice: MealPhoto | null = null;

  if (mealChecksBulk.length > 0) {
    const byId = new Map(mealChecks.map((c) => [c.slotId, c]));
    for (const check of mealChecksBulk) {
      byId.set(check.slotId, {...check, updatedAt: loggedAt});
    }
    mealChecks = Array.from(byId.values());
  }

  if (mealCheckRaw) {
    const slotId = asOptionalString(mealCheckRaw.slotId);
    const slotTitle =
      asOptionalString(mealCheckRaw.slotTitle) || slotId;
    if (!slotId || !slotTitle) {
      throw new HttpsError(
        "invalid-argument",
        "mealCheck.slotId and slotTitle are required.",
      );
    }
    const check: MealCheck = {
      slotId,
      slotTitle,
      completed: Boolean(mealCheckRaw.completed),
      updatedAt: loggedAt,
    };
    mealChecks = [
      ...mealChecks.filter((c) => c.slotId !== slotId),
      check,
    ];
  }

  if (mealPhotoRaw) {
    const slotId = asOptionalString(mealPhotoRaw.slotId);
    const slotTitle =
      asOptionalString(mealPhotoRaw.slotTitle) || slotId;
    const photoUrl = asOptionalString(mealPhotoRaw.photoUrl);
    if (!slotId || !slotTitle || !photoUrl) {
      throw new HttpsError(
        "invalid-argument",
        "mealPhoto.slotId, slotTitle, and photoUrl are required.",
      );
    }
    if (
      !photoUrl.startsWith("https://") &&
      !photoUrl.startsWith("http://")
    ) {
      throw new HttpsError(
        "invalid-argument",
        "mealPhoto.photoUrl must be a hosted URL.",
      );
    }
    const photo: MealPhoto = stripUndefined({
      slotId,
      slotTitle,
      photoUrl,
      storagePath: asOptionalString(mealPhotoRaw.storagePath),
      note: asOptionalString(mealPhotoRaw.note),
      uploadedAt: loggedAt,
    }) as MealPhoto;
    mealPhotos = [
      ...mealPhotos.filter((p) => p.slotId !== slotId),
      photo,
    ];
    photoNotice = photo;
  }

  const existingStatus = asOptionalString(existing?.status) as
    | AdherenceStatus
    | undefined;
  const status: AdherenceStatus =
    existingStatus === "adhered" ||
    existingStatus === "mostly" ||
    existingStatus === "deviated" ||
    existingStatus === "skipped"
      ? existingStatus
      : "skipped";

  const record = stripUndefined({
    id: existingDoc?.id,
    subscriberId: uid,
    programId,
    date,
    dayId: dayId || asOptionalString(existing?.dayId),
    weekday:
      weekdayRaw === undefined || weekdayRaw === null
        ? existing?.weekday === undefined || existing?.weekday === null
          ? undefined
          : Math.max(0, Math.min(6, asFiniteNumber(existing.weekday, 0)))
        : Math.max(0, Math.min(6, asFiniteNumber(weekdayRaw, 0))),
    status,
    caloriesActual:
      existing?.caloriesActual === undefined || existing?.caloriesActual === null
        ? undefined
        : Math.max(0, asFiniteNumber(existing.caloriesActual, 0)),
    waterLitersActual:
      existing?.waterLitersActual === undefined ||
      existing?.waterLitersActual === null
        ? undefined
        : Math.max(0, asFiniteNumber(existing.waterLitersActual, 0)),
    notes: asOptionalString(existing?.notes),
    mealChecks,
    mealPhotos,
    loggedAt,
  });

  let logId: string;
  if (existingDoc) {
    logId = existingDoc.id;
    await existingDoc.ref.set(
      stripUndefined({...record, id: logId}),
      {merge: true},
    );
  } else {
    const logRef = db.collection(COLLECTIONS.nutritionLogs).doc();
    logId = logRef.id;
    await logRef.set(stripUndefined({...record, id: logId}));
  }

  await programRef.set({updatedAt: loggedAt}, {merge: true});

  if (photoNotice) {
    try {
      const subData = (subscriberSnap.data() ?? {}) as Record<string, unknown>;
      const subscriberName =
        asOptionalString(subData.displayName) ||
        (typeof request.auth?.token?.name === "string"
          ? request.auth.token.name
          : undefined) ||
        (typeof request.auth?.token?.email === "string"
          ? request.auth.token.email
          : undefined) ||
        uid;
      const subscriberEmail =
        asOptionalString(subData.email) ||
        (typeof request.auth?.token?.email === "string"
          ? request.auth.token.email
          : undefined);

      const staffEn = [
        `${subscriberName} uploaded a meal photo for "${photoNotice.slotTitle}" (${date}).`,
      ];
      if (photoNotice.note) staffEn.push(`Note: ${photoNotice.note}`);
      staffEn.push("Open Nutrition to review the verification photo.");

      const staffAr = [
        `${subscriberName} رفع صورة وجبة "${photoNotice.slotTitle}" بتاريخ ${date}.`,
      ];
      if (photoNotice.note) staffAr.push(`ملاحظة: ${photoNotice.note}`);
      staffAr.push("افتح التغذية لمراجعة صورة التحقق.");

      await enqueueNotice({
        kind: "nutrition_adherence",
        toEmail: subscriberEmail || "ops@local",
        toName: subscriberName,
        subscriberId: uid,
        requestId: logId,
        dedupeKey: `meal_photo:${logId}:${photoNotice.slotId}:${loggedAt}`,
        channel: "push",
        alarmStaff: true,
        actionUrl: `/admin/nutrition?log=${encodeURIComponent(logId)}&subscriber=${encodeURIComponent(uid)}`,
        subject: {
          en: `Meal photo saved — ${photoNotice.slotTitle}`,
          ar: `تم حفظ صورة الوجبة — ${photoNotice.slotTitle}`,
        },
        detail: {
          en: `Your meal verification photo for ${photoNotice.slotTitle} was saved.`,
          ar: `تم حفظ صورة توثيق وجبة ${photoNotice.slotTitle}.`,
        },
        staffSubject: {
          en: `Meal photo — ${subscriberName}`,
          ar: `صورة وجبة — ${subscriberName}`,
        },
        staffDetail: {
          en: staffEn.join(" "),
          ar: staffAr.join(" "),
        },
      });
    } catch (err) {
      console.warn(
        "[upsertNutritionMealProgress] Failed to enqueue staff notice:",
        err,
      );
    }
  }

  return {
    ok: true,
    log: {...record, id: logId},
  };
});
