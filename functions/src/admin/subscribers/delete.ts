import {FieldValue} from "firebase-admin/firestore";
import {HttpsError, onCall} from "firebase-functions/v2/https";
import {auth, db} from "../../config/firebase.js";
import {COLLECTIONS} from "../../config/collections.js";
import {assertStaffCaller} from "../../lib/authz.js";
import {isFirebaseUid} from "../../lib/utils.js";

export const deleteSubscriberAccount = onCall(async (request) => {
  assertStaffCaller(request.auth, "subscribers:write");
  const subscriberId = String(
    (request.data as {subscriberId?: string})?.subscriberId ?? "",
  ).trim();

  if (!subscriberId || !isFirebaseUid(subscriberId)) {
    throw new HttpsError(
      "invalid-argument",
      "Valid subscriber Auth UID is required.",
    );
  }

  const ref = db.collection(COLLECTIONS.subscribers).doc(subscriberId);
  const snap = await ref.get();
  if (!snap.exists) {
    throw new HttpsError("not-found", "Subscriber not found.");
  }

  try {
    await auth.deleteUser(subscriberId);
  } catch (err) {
    const code = (err as {code?: string})?.code;
    if (code !== "auth/user-not-found") throw err;
  }

  const now = new Date().toISOString();
  const batch = db.batch();
  batch.delete(ref);

  const reqs = await db
    .collection(COLLECTIONS.registrationRequests)
    .where("subscriberId", "==", subscriberId)
    .get();
  for (const docSnap of reqs.docs) {
    batch.update(docSnap.ref, {
      subscriberId: FieldValue.delete(),
      updatedAt: now,
    });
  }

  const subs = await db
    .collection(COLLECTIONS.subscriptions)
    .where("subscriberId", "==", subscriberId)
    .get();
  for (const docSnap of subs.docs) {
    const st = String(docSnap.data().status ?? "");
    if (st === "active" || st === "pending" || st === "suspended") {
      batch.update(docSnap.ref, {
        status: "cancelled",
        updatedAt: now,
        notes: "Subscriber account deleted",
      });
    }
  }

  await batch.commit();
  return {ok: true, deletedId: subscriberId};
});
