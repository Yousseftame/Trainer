import {HttpsError, onCall} from "firebase-functions/v2/https";
import {COLLECTIONS} from "../config/collections.js";
import {db, storage} from "../config/firebase.js";
import {assertSubscriberCaller} from "../lib/authz.js";
import {stripUndefined} from "../lib/utils.js";
import {
  normalizeEntitlements,
  resolveEffectiveSubscriptionStatus,
  type PackageEntitlements,
} from "../shared/contentAccess.js";

type Pose = "front" | "side" | "back";

function asOptionalString(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed || undefined;
}

function asOptionalNumber(value: unknown): number | undefined {
  if (value === undefined || value === null || value === "") return undefined;
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n)) return undefined;
  return n;
}

function asIsoDate(value: unknown, fallback: string): string {
  if (typeof value === "string" && value.trim()) {
    const d = new Date(value);
    if (!Number.isNaN(d.getTime())) return d.toISOString();
  }
  return fallback;
}

function asPose(value: unknown): Pose {
  return value === "side" || value === "back" ? value : "front";
}

async function resolveProgressEntitlement(uid: string): Promise<{
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
    allowed:
      effectiveStatus === "active" && Boolean(entitlements.progressTracking),
    entitlements,
  };
}

async function assertActiveSubscriber(uid: string): Promise<void> {
  const subscriberSnap = await db.collection(COLLECTIONS.subscribers).doc(uid).get();
  if (!subscriberSnap.exists) {
    throw new HttpsError("not-found", "Subscriber profile not found.");
  }
  const subscriberStatus = String(subscriberSnap.data()?.status ?? "pending");
  if (subscriberStatus !== "active") {
    throw new HttpsError("permission-denied", "Subscriber account is not active.");
  }

  const entitlement = await resolveProgressEntitlement(uid);
  if (!entitlement.allowed) {
    throw new HttpsError(
      "permission-denied",
      "Progress tracking is not included in the current package.",
    );
  }
}

function formatBytesLabel(bytes?: number): string | undefined {
  if (!bytes || bytes <= 0) return undefined;
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${Math.round(kb)} KB`;
  return `${(kb / 1024).toFixed(1)} MB`;
}

/**
 * Subscriber body measurement upsert — forces uid ownership + entitlement.
 */
export const logProgressMeasurement = onCall(async (request) => {
  const {uid} = assertSubscriberCaller(request.auth);
  await assertActiveSubscriber(uid);

  const data = (request.data ?? {}) as Record<string, unknown>;
  const now = new Date().toISOString();
  const recordedAt = asIsoDate(data.recordedAt, now);

  const weightKg = asOptionalNumber(data.weightKg);
  const chestCm = asOptionalNumber(data.chestCm);
  const waistCm = asOptionalNumber(data.waistCm);
  const hipsCm = asOptionalNumber(data.hipsCm);
  const armsCm = asOptionalNumber(data.armsCm);
  const thighsCm = asOptionalNumber(data.thighsCm);
  const notes = asOptionalString(data.notes);

  if (
    weightKg === undefined &&
    chestCm === undefined &&
    waistCm === undefined &&
    hipsCm === undefined &&
    armsCm === undefined &&
    thighsCm === undefined
  ) {
    throw new HttpsError(
      "invalid-argument",
      "At least one measurement value is required.",
    );
  }

  const existingId = asOptionalString(data.id);
  let ref = existingId
    ? db.collection(COLLECTIONS.progressMeasurements).doc(existingId)
    : db.collection(COLLECTIONS.progressMeasurements).doc();

  let createdAt = now;
  let createdBy: string | undefined = uid;

  if (existingId) {
    const snap = await ref.get();
    if (!snap.exists) {
      throw new HttpsError("not-found", "Measurement not found.");
    }
    const raw = snap.data() ?? {};
    if (String(raw.subscriberId ?? "") !== uid) {
      throw new HttpsError("permission-denied", "Not your measurement.");
    }
    createdAt =
      typeof raw.createdAt === "string" ? raw.createdAt : now;
    createdBy =
      typeof raw.createdBy === "string" ? raw.createdBy : uid;
  }

  const record = stripUndefined({
    id: ref.id,
    subscriberId: uid,
    recordedAt,
    weightKg,
    chestCm,
    waistCm,
    hipsCm,
    armsCm,
    thighsCm,
    notes,
    createdAt,
    updatedAt: now,
    createdBy,
  });

  await ref.set(record, {merge: false});
  return {ok: true, measurement: record};
});

export const deleteProgressMeasurement = onCall(async (request) => {
  const {uid} = assertSubscriberCaller(request.auth);
  await assertActiveSubscriber(uid);

  const id = asOptionalString((request.data ?? {}).id);
  if (!id) throw new HttpsError("invalid-argument", "id is required.");

  const ref = db.collection(COLLECTIONS.progressMeasurements).doc(id);
  const snap = await ref.get();
  if (!snap.exists) throw new HttpsError("not-found", "Measurement not found.");
  if (String(snap.data()?.subscriberId ?? "") !== uid) {
    throw new HttpsError("permission-denied", "Not your measurement.");
  }
  await ref.delete();
  return {ok: true, deletedId: id};
});

/**
 * Athletic performance log (lift / metric).
 */
export const logProgressPerformance = onCall(async (request) => {
  const {uid} = assertSubscriberCaller(request.auth);
  await assertActiveSubscriber(uid);

  const data = (request.data ?? {}) as Record<string, unknown>;
  const now = new Date().toISOString();
  const name = asOptionalString(data.name);
  const value = asOptionalNumber(data.value);
  if (!name) throw new HttpsError("invalid-argument", "name is required.");
  if (value === undefined) {
    throw new HttpsError("invalid-argument", "value is required.");
  }

  const unit = data.unit === "reps" ? "reps" : "kg";
  const recordedAt = asIsoDate(data.recordedAt, now);
  const notes = asOptionalString(data.notes);
  const programId = asOptionalString(data.programId);
  const exerciseId = asOptionalString(data.exerciseId);
  const existingId = asOptionalString(data.id);

  let ref = existingId
    ? db.collection(COLLECTIONS.progressPerformance).doc(existingId)
    : db.collection(COLLECTIONS.progressPerformance).doc();

  let createdAt = now;
  let createdBy: string | undefined = uid;

  if (existingId) {
    const snap = await ref.get();
    if (!snap.exists) {
      throw new HttpsError("not-found", "Performance record not found.");
    }
    const raw = snap.data() ?? {};
    if (String(raw.subscriberId ?? "") !== uid) {
      throw new HttpsError("permission-denied", "Not your performance record.");
    }
    createdAt =
      typeof raw.createdAt === "string" ? raw.createdAt : now;
    createdBy =
      typeof raw.createdBy === "string" ? raw.createdBy : uid;
  }

  const record = stripUndefined({
    id: ref.id,
    subscriberId: uid,
    recordedAt,
    name,
    value,
    unit,
    notes,
    programId,
    exerciseId,
    createdAt,
    updatedAt: now,
    createdBy,
  });

  await ref.set(record, {merge: false});
  return {ok: true, performance: record};
});

export const deleteProgressPerformance = onCall(async (request) => {
  const {uid} = assertSubscriberCaller(request.auth);
  await assertActiveSubscriber(uid);

  const id = asOptionalString((request.data ?? {}).id);
  if (!id) throw new HttpsError("invalid-argument", "id is required.");

  const ref = db.collection(COLLECTIONS.progressPerformance).doc(id);
  const snap = await ref.get();
  if (!snap.exists) {
    throw new HttpsError("not-found", "Performance record not found.");
  }
  if (String(snap.data()?.subscriberId ?? "") !== uid) {
    throw new HttpsError("permission-denied", "Not your performance record.");
  }
  await ref.delete();
  return {ok: true, deletedId: id};
});

/**
 * Register a progress photo after the client uploaded to Storage under their uid path.
 * Validates path ownership + entitlement; never trusts client downloadUrl alone.
 */
export const saveProgressPhotoMeta = onCall(async (request) => {
  const {uid} = assertSubscriberCaller(request.auth);
  await assertActiveSubscriber(uid);

  const data = (request.data ?? {}) as Record<string, unknown>;
  const now = new Date().toISOString();
  const storagePath = asOptionalString(data.storagePath);
  if (!storagePath || !storagePath.startsWith(`progress/photos/${uid}/`)) {
    throw new HttpsError(
      "invalid-argument",
      "storagePath must be under your private progress photo folder.",
    );
  }

  const existingId = asOptionalString(data.id);
  // Prefer client-reserved id (matches Storage object path uploaded first).
  const ref = existingId
    ? db.collection(COLLECTIONS.progressPhotos).doc(existingId)
    : db.collection(COLLECTIONS.progressPhotos).doc();

  let createdAt = now;
  let uploadedBy: string | undefined = uid;
  let previousPath: string | undefined;

  const snap = await ref.get();
  if (snap.exists) {
    const raw = snap.data() ?? {};
    if (String(raw.subscriberId ?? "") !== uid) {
      throw new HttpsError("permission-denied", "Not your progress photo.");
    }
    createdAt = typeof raw.createdAt === "string" ? raw.createdAt : now;
    uploadedBy =
      typeof raw.uploadedBy === "string" ? raw.uploadedBy : uid;
    previousPath =
      typeof raw.storagePath === "string" ? raw.storagePath : undefined;
  }

  let downloadUrl: string | undefined;
  try {
    const [url] = await storage.bucket().file(storagePath).getSignedUrl({
      action: "read",
      expires: Date.now() + 7 * 24 * 60 * 60 * 1000,
    });
    downloadUrl = url;
  } catch {
    downloadUrl = asOptionalString(data.downloadUrl);
  }

  const sizeBytes = asOptionalNumber(data.sizeBytes);
  const record = stripUndefined({
    id: ref.id,
    subscriberId: uid,
    storagePath,
    downloadUrl,
    takenAt: asIsoDate(data.takenAt, now),
    pose: asPose(data.pose),
    caption: asOptionalString(data.caption),
    mimeType: asOptionalString(data.mimeType) || "image/jpeg",
    sizeBytes,
    sizeLabel: formatBytesLabel(sizeBytes),
    uploadedBy,
    createdAt,
    updatedAt: now,
  });

  await ref.set(record, {merge: false});

  if (
    previousPath &&
    previousPath !== storagePath &&
    previousPath.startsWith(`progress/photos/${uid}/`)
  ) {
    try {
      await storage.bucket().file(previousPath).delete({ignoreNotFound: true});
    } catch {
      // best-effort cleanup
    }
  }

  return {ok: true, photo: record};
});

export const deleteProgressPhoto = onCall(async (request) => {
  const {uid} = assertSubscriberCaller(request.auth);
  await assertActiveSubscriber(uid);

  const id = asOptionalString((request.data ?? {}).id);
  if (!id) throw new HttpsError("invalid-argument", "id is required.");

  const ref = db.collection(COLLECTIONS.progressPhotos).doc(id);
  const snap = await ref.get();
  if (!snap.exists) throw new HttpsError("not-found", "Photo not found.");
  const raw = snap.data() ?? {};
  if (String(raw.subscriberId ?? "") !== uid) {
    throw new HttpsError("permission-denied", "Not your progress photo.");
  }

  const storagePath =
    typeof raw.storagePath === "string" ? raw.storagePath : undefined;
  await ref.delete();

  if (storagePath && storagePath.startsWith(`progress/photos/${uid}/`)) {
    try {
      await storage.bucket().file(storagePath).delete({ignoreNotFound: true});
    } catch {
      // ignore
    }
  }

  return {ok: true, deletedId: id};
});
