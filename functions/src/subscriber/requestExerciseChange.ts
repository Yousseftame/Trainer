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
 * Subscriber-only: request a coach review / substitute for an exercise.
 * Persists to exercise_change_requests and alarms staff via notices inbox.
 */
export const requestExerciseChange = onCall(async (request) => {
  const {uid} = assertSubscriberCaller(request.auth);

  const exerciseId = asOptionalString(request.data?.exerciseId);
  const exerciseName = asOptionalString(request.data?.exerciseName);
  const reason = asOptionalString(request.data?.reason);
  if (!exerciseId || !exerciseName || !reason) {
    throw new HttpsError(
      "invalid-argument",
      "exerciseId, exerciseName, and reason are required.",
    );
  }

  const notes = asOptionalString(request.data?.notes);
  const programId = asOptionalString(request.data?.programId);
  const dayId = asOptionalString(request.data?.dayId);
  const programTitle = asOptionalString(request.data?.programTitle);
  const dayLabel = asOptionalString(request.data?.dayLabel);
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
      "Only active subscriber accounts can request exercise changes.",
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
  const id = db.collection(COLLECTIONS.exerciseChangeRequests).doc().id;

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
    exerciseId,
    exerciseName,
    substituteId,
    substituteName,
    reason,
    notes,
    status: "pending",
    createdAt: now,
    updatedAt: now,
  });

  await db.collection(COLLECTIONS.exerciseChangeRequests).doc(id).set(record);

  const detailEnParts = [
    `${subscriberName} requested a change for "${exerciseName}".`,
    `Reason: ${reason}.`,
  ];
  if (substituteName) {
    detailEnParts.push(`Preferred substitute: ${substituteName}.`);
  }
  if (notes) detailEnParts.push(`Notes: ${notes}`);
  if (programTitle) detailEnParts.push(`Program: ${programTitle}.`);
  if (dayLabel) detailEnParts.push(`Day: ${dayLabel}.`);

  const detailArParts = [
    `${subscriberName} طلب استبدال التمرين "${exerciseName}".`,
    `السبب: ${reason}.`,
  ];
  if (substituteName) {
    detailArParts.push(`البديل المفضل: ${substituteName}.`);
  }
  if (notes) detailArParts.push(`ملاحظات: ${notes}`);
  if (programTitle) detailArParts.push(`البرنامج: ${programTitle}.`);
  if (dayLabel) detailArParts.push(`اليوم: ${dayLabel}.`);

  try {
    await enqueueNotice({
      kind: "exercise_change",
      toEmail: subscriberEmail || "ops@local",
      toName: subscriberName,
      subscriberId: uid,
      requestId: id,
      dedupeKey: `exercise_change:${id}`,
      channel: subscriberEmail ? "email+push" : "push",
      alarmStaff: true,
      actionUrl: `/admin/workouts?request=${encodeURIComponent(id)}`,
      subject: {
        en: `We received your exercise change request`,
        ar: `استلمنا طلب استبدال التمرين`,
      },
      detail: {
        en: `Your coach received your request to change "${exerciseName}". They will review it shortly.`,
        ar: `استلم المدرب طلبك لاستبدال "${exerciseName}". سيتم مراجعته قريباً.`,
      },
      staffSubject: {
        en: `Exercise change — ${subscriberName}`,
        ar: `طلب استبدال تمرين — ${subscriberName}`,
      },
      staffDetail: {
        en: detailEnParts.join(" "),
        ar: detailArParts.join(" "),
      },
    });
  } catch (err) {
    console.warn(
      "[requestExerciseChange] Failed to enqueue staff notice:",
      err,
    );
  }

  return {ok: true, request: record};
});
