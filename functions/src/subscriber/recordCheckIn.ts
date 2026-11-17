import {HttpsError, onCall} from "firebase-functions/v2/https";
import {COLLECTIONS} from "../config/collections.js";
import {db} from "../config/firebase.js";
import {assertSubscriberCaller} from "../lib/authz.js";

/**
 * Subscriber-only: stamp lastCheckInAt on own profile when they sign in.
 * Safe to call repeatedly — always advances to "now".
 */
export const recordSubscriberCheckIn = onCall(async (request) => {
  const {uid} = assertSubscriberCaller(request.auth);

  const ref = db.collection(COLLECTIONS.subscribers).doc(uid);
  const snap = await ref.get();
  if (!snap.exists) {
    throw new HttpsError("not-found", "Subscriber profile not found.");
  }

  const existing = snap.data() as Record<string, unknown>;
  const accountStatus = String(existing.status ?? "pending");
  if (accountStatus !== "active") {
    throw new HttpsError(
      "permission-denied",
      "Only active subscriber accounts can record a check-in.",
    );
  }

  const now = new Date().toISOString();
  await ref.set(
    {
      lastCheckInAt: now,
      updatedAt: now,
    },
    {merge: true},
  );

  return {ok: true, lastCheckInAt: now};
});
