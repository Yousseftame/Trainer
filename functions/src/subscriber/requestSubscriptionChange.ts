import {HttpsError, onCall} from "firebase-functions/v2/https";
import {COLLECTIONS} from "../config/collections.js";
import {db} from "../config/firebase.js";
import {assertSubscriberCaller} from "../lib/authz.js";
import {stripUndefined} from "../lib/utils.js";
import {enqueueNotice} from "../shared/notices.js";

function asOptionalString(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed || undefined;
}

/**
 * Subscriber-only: request a package change / upgrade.
 * Does NOT create Auth users or mutate subscriptions — staff assign manually.
 */
export const requestSubscriptionChange = onCall(async (request) => {
  const {uid} = assertSubscriberCaller(request.auth);
  const packageId = asOptionalString(request.data?.packageId);
  if (!packageId) {
    throw new HttpsError("invalid-argument", "packageId is required.");
  }

  const noteAr = asOptionalString(request.data?.noteAr);
  const noteEn = asOptionalString(request.data?.noteEn);
  const note = asOptionalString(request.data?.note);

  const pkgSnap = await db.collection(COLLECTIONS.packages).doc(packageId).get();
  if (!pkgSnap.exists) {
    throw new HttpsError("not-found", "Package not found.");
  }
  const pkg = pkgSnap.data() as Record<string, unknown>;
  if (pkg.isActive === false) {
    throw new HttpsError("failed-precondition", "Package is not available.");
  }

  const pendingSnap = await db
    .collection(COLLECTIONS.subscriptionChangeRequests)
    .where("subscriberId", "==", uid)
    .where("status", "==", "pending")
    .limit(1)
    .get();
  if (!pendingSnap.empty) {
    throw new HttpsError(
      "already-exists",
      "You already have a pending package change request.",
    );
  }

  const subSnap = await db.collection(COLLECTIONS.subscribers).doc(uid).get();
  if (!subSnap.exists) {
    throw new HttpsError("not-found", "Subscriber profile not found.");
  }
  const subData = (subSnap.data() ?? {}) as Record<string, unknown>;
  if (String(subData.status ?? "pending") !== "active") {
    throw new HttpsError(
      "permission-denied",
      "Only active subscriber accounts can request a package change.",
    );
  }
  const authEmail =
    typeof request.auth?.token?.email === "string"
      ? request.auth.token.email
      : undefined;
  const authName =
    typeof request.auth?.token?.name === "string"
      ? request.auth.token.name
      : undefined;

  const now = new Date().toISOString();
  const id = db.collection(COLLECTIONS.subscriptionChangeRequests).doc().id;

  const record = stripUndefined({
    id,
    subscriberId: uid,
    subscriberName:
      asOptionalString(subData.displayName) || authName || authEmail || uid,
    subscriberEmail:
      asOptionalString(subData.email) || authEmail || undefined,
    packageId,
    packageName: pkg.name ?? {en: packageId, ar: packageId},
    currentPackageId: asOptionalString(request.data?.currentPackageId),
    note: note || noteEn || noteAr,
    noteLocalized:
      noteAr || noteEn || note
        ? {
            ar: noteAr || note || noteEn || "",
            en: noteEn || note || noteAr || "",
          }
        : undefined,
    status: "pending",
    createdAt: now,
    updatedAt: now,
  });

  await db
    .collection(COLLECTIONS.subscriptionChangeRequests)
    .doc(id)
    .set(record);

  const subscriberName = String(record.subscriberName ?? "Subscriber");
  const subscriberEmail = String(record.subscriberEmail ?? authEmail ?? "");
  const packageName = pkg.name as {en?: string; ar?: string} | undefined;
  const pkgEn = String(packageName?.en ?? packageId);
  const pkgAr = String(packageName?.ar ?? packageName?.en ?? packageId);
  const noteText =
    asOptionalString(record.note) ||
    asOptionalString(
      (record.noteLocalized as {en?: string} | undefined)?.en,
    );

  try {
    await enqueueNotice({
      kind: "subscription_change",
      toEmail: subscriberEmail || "ops@local",
      toName: subscriberName,
      subscriberId: uid,
      requestId: id,
      packageId,
      dedupeKey: `subscription_change:${id}`,
      channel: subscriberEmail ? "email+push" : "push",
      alarmStaff: true,
      actionUrl: `/admin/subscriptions?request=${encodeURIComponent(id)}`,
      subject: {
        en: `We received your request for ${pkgEn}`,
        ar: `استلمنا طلبك لباقة ${pkgAr}`,
      },
      detail: {
        en: noteText
          ? `Your coach received your package change request for ${pkgEn}. Note: ${noteText}`
          : `Your coach received your package change request for ${pkgEn}. They will review and update your subscription.`,
        ar: noteText
          ? `استلم المدرب طلب تغيير الباقة إلى ${pkgAr}. ملاحظة: ${noteText}`
          : `استلم المدرب طلب تغيير الباقة إلى ${pkgAr}. سيتم مراجعته وتحديث اشتراكك.`,
      },
      staffSubject: {
        en: `Package change request — ${subscriberName}`,
        ar: `طلب تغيير باقة — ${subscriberName}`,
      },
      staffDetail: {
        en: noteText
          ? `${subscriberName} requested ${pkgEn}. Note: ${noteText}`
          : `${subscriberName} requested an upgrade/change to ${pkgEn}. Open Subscriptions to approve or reject.`,
        ar: noteText
          ? `${subscriberName} طلب باقة ${pkgAr}. ملاحظة: ${noteText}`
          : `${subscriberName} طلب ترقية/تغيير إلى باقة ${pkgAr}. افتح الاشتراكات للموافقة أو الرفض.`,
      },
    });
  } catch (err) {
    console.warn(
      "[requestSubscriptionChange] Failed to enqueue staff notice:",
      err,
    );
  }

  return {ok: true, request: record};
});
