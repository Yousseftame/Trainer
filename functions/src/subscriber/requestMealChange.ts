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
 * Subscriber-only: request a coach review / food substitute for a meal item.
 */
export const requestMealChange = onCall(async (request) => {
  const {uid} = assertSubscriberCaller(request.auth);

  const mealItemId = asOptionalString(request.data?.mealItemId);
  const mealItemName = asOptionalString(request.data?.mealItemName);
  const reason = asOptionalString(request.data?.reason);
  if (!mealItemId || !mealItemName || !reason) {
    throw new HttpsError(
      "invalid-argument",
      "mealItemId, mealItemName, and reason are required.",
    );
  }

  const notes = asOptionalString(request.data?.notes);
  const programId = asOptionalString(request.data?.programId);
  const dayId = asOptionalString(request.data?.dayId);
  const programTitle = asOptionalString(request.data?.programTitle);
  const dayLabel = asOptionalString(request.data?.dayLabel);
  const mealSlotId = asOptionalString(request.data?.mealSlotId);
  const mealSlotTitle = asOptionalString(request.data?.mealSlotTitle);
  const substituteName = asOptionalString(request.data?.substituteName);
  const substituteId = asOptionalString(request.data?.substituteId);

  const subSnap = await db.collection(COLLECTIONS.subscribers).doc(uid).get();
  if (!subSnap.exists) {
    throw new HttpsError("not-found", "Subscriber profile not found.");
  }
  const subData = (subSnap.data() ?? {}) as Record<string, unknown>;
  if (String(subData.status ?? "pending") !== "active") {
    throw new HttpsError(
      "permission-denied",
      "Only active subscriber accounts can request meal changes.",
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
  const id = db.collection(COLLECTIONS.mealChangeRequests).doc().id;

  const subscriberName =
    asOptionalString(subData.displayName) || authName || authEmail || uid;
  const subscriberEmail =
    asOptionalString(subData.email) || authEmail || undefined;

  const record = stripUndefined({
    id,
    subscriberId: uid,
    subscriberName,
    subscriberEmail,
    programId,
    dayId,
    programTitle,
    dayLabel,
    mealSlotId,
    mealSlotTitle,
    mealItemId,
    mealItemName,
    substituteId,
    substituteName,
    reason,
    notes,
    status: "pending",
    createdAt: now,
    updatedAt: now,
  });

  await db.collection(COLLECTIONS.mealChangeRequests).doc(id).set(record);

  const detailEnParts = [
    `${subscriberName} requested a food change for "${mealItemName}".`,
    `Reason: ${reason}.`,
  ];
  if (mealSlotTitle) detailEnParts.push(`Meal: ${mealSlotTitle}.`);
  if (substituteName) {
    detailEnParts.push(`Preferred substitute: ${substituteName}.`);
  }
  if (notes) detailEnParts.push(`Notes: ${notes}`);
  if (programTitle) detailEnParts.push(`Plan: ${programTitle}.`);

  const detailArParts = [
    `${subscriberName} طلب تغيير الصنف "${mealItemName}".`,
    `السبب: ${reason}.`,
  ];
  if (mealSlotTitle) detailArParts.push(`الوجبة: ${mealSlotTitle}.`);
  if (substituteName) {
    detailArParts.push(`البديل المفضل: ${substituteName}.`);
  }
  if (notes) detailArParts.push(`ملاحظات: ${notes}`);
  if (programTitle) detailArParts.push(`الخطة: ${programTitle}.`);

  try {
    await enqueueNotice({
      kind: "meal_change",
      toEmail: subscriberEmail || "ops@local",
      toName: subscriberName,
      subscriberId: uid,
      requestId: id,
      dedupeKey: `meal_change:${id}`,
      channel: subscriberEmail ? "email+push" : "push",
      alarmStaff: true,
      actionUrl: `/admin/nutrition?request=${encodeURIComponent(id)}`,
      subject: {
        en: `We received your meal change request`,
        ar: `استلمنا طلب تغيير الوجبة`,
      },
      detail: {
        en: `Your coach received your request to change "${mealItemName}".`,
        ar: `استلم المدرب طلبك لتغيير "${mealItemName}".`,
      },
      staffSubject: {
        en: `Meal change — ${subscriberName}`,
        ar: `طلب تغيير وجبة — ${subscriberName}`,
      },
      staffDetail: {
        en: detailEnParts.join(" "),
        ar: detailArParts.join(" "),
      },
    });
  } catch (err) {
    console.warn("[requestMealChange] Failed to enqueue staff notice:", err);
  }

  return {ok: true, request: record};
});
