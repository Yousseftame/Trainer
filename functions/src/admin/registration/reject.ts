import {HttpsError, onCall} from "firebase-functions/v2/https";
import {db} from "../../config/firebase.js";
import {COLLECTIONS} from "../../config/collections.js";
import {assertStaffCaller} from "../../lib/authz.js";
import {isFirebaseUid, stripUndefined} from "../../lib/utils.js";
import {
  applyAuthAccess,
  normalizeBilingual,
} from "../../shared/subscribers.js";
import {enqueueNotice} from "../../shared/notices.js";

export const rejectRegistrationRequest = onCall(async (request) => {
  const caller = assertStaffCaller(request.auth, "subscribers:approve");
  const data = (request.data ?? {}) as Record<string, unknown>;
  const requestId = String(data.requestId ?? "").trim();
  if (!requestId) {
    throw new HttpsError("invalid-argument", "requestId is required.");
  }

  const reqRef = db.collection(COLLECTIONS.registrationRequests).doc(requestId);
  const reqSnap = await reqRef.get();
  if (!reqSnap.exists) {
    throw new HttpsError("not-found", "Registration request not found.");
  }
  const existing = reqSnap.data() ?? {};
  if (String(existing.status) !== "pending") {
    throw new HttpsError("failed-precondition", "Request already reviewed.");
  }

  const now = new Date().toISOString();
  const reviewNotesLocalized = normalizeBilingual(
    data.reviewNotesLocalized ?? data.reviewNotes,
  );
  let subscriberId =
    typeof existing.subscriberId === "string" ? existing.subscriberId : undefined;

  if (subscriberId && isFirebaseUid(subscriberId)) {
    const subRef = db.collection(COLLECTIONS.subscribers).doc(subscriberId);
    const subSnap = await subRef.get();
    if (subSnap.exists && String(subSnap.data()?.status) === "pending") {
      await applyAuthAccess(subscriberId, "rejected");
      await subRef.update({status: "rejected", updatedAt: now});
    }
  } else {
    const email = String(existing.email ?? "").trim().toLowerCase();
    if (email) {
      const match = await db
        .collection(COLLECTIONS.subscribers)
        .where("email", "==", email)
        .limit(1)
        .get();
      if (!match.empty) {
        const docSnap = match.docs[0];
        subscriberId = docSnap.id;
        if (String(docSnap.data().status) === "pending") {
          if (isFirebaseUid(docSnap.id)) {
            await applyAuthAccess(docSnap.id, "rejected");
          }
          await docSnap.ref.update({status: "rejected", updatedAt: now});
        }
      }
    }
  }

  const updatedReq = stripUndefined({
    ...existing,
    id: requestId,
    status: "rejected",
    subscriberId,
    reviewedBy: String(data.reviewedBy ?? "Head Coach"),
    reviewNotes: reviewNotesLocalized?.en,
    reviewNotesLocalized,
    reviewedAt: now,
  });

  await reqRef.set(updatedReq);

  const email = String(existing.email ?? "").trim().toLowerCase();
  const displayName = String(existing.displayName ?? email);
  if (email) {
    await enqueueNotice({
      kind: "approval",
      toEmail: email,
      toName: displayName,
      subscriberId,
      requestId,
      dedupeKey: `rejection:${requestId}`,
      subject: {
        en: `${displayName}'s request was not approved`,
        ar: `لم يُقبل طلب ${displayName}`,
      },
      detail: {
        en:
          reviewNotesLocalized?.en ||
          "Your registration request was not approved at this time.",
        ar:
          reviewNotesLocalized?.ar ||
          "لم تتم الموافقة على طلب التسجيل في الوقت الحالي.",
      },
      alarmStaff: false,
    });
  }

  return {request: updatedReq, rejectedBy: caller.uid};
});
