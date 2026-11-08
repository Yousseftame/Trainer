import {HttpsError, onCall} from "firebase-functions/v2/https";
import {auth, db} from "../../config/firebase.js";
import {COLLECTIONS} from "../../config/collections.js";
import {assertStaffCaller} from "../../lib/authz.js";

/**
 * Secure Auth-side updates for an existing subscriber (password / displayName).
 * Profile fields continue to update via Firestore client rules.
 */
export const updateSubscriberAccount = onCall(async (request) => {
  assertStaffCaller(request.auth, "subscribers:write");
  const data = (request.data ?? {}) as Record<string, unknown>;

  const subscriberId = String(data.subscriberId ?? "").trim();
  if (!subscriberId) {
    throw new HttpsError("invalid-argument", "subscriberId is required.");
  }

  const snap = await db.collection(COLLECTIONS.subscribers).doc(subscriberId).get();
  if (!snap.exists) {
    throw new HttpsError("not-found", "Subscriber not found.");
  }

  const password = String(data.password ?? "").trim();
  const displayName = String(data.displayName ?? "").trim();

  const authPatch: {password?: string; displayName?: string} = {};
  if (password) {
    if (password.length < 6) {
      throw new HttpsError(
        "invalid-argument",
        "Password must be at least 6 characters.",
      );
    }
    authPatch.password = password;
  }
  if (displayName) {
    authPatch.displayName = displayName;
  }

  if (Object.keys(authPatch).length > 0) {
    try {
      await auth.updateUser(subscriberId, authPatch);
    } catch (err) {
      const code = (err as {code?: string})?.code;
      if (code === "auth/user-not-found") {
        throw new HttpsError("not-found", "Auth user not found for subscriber.");
      }
      throw err;
    }
  }

  return {ok: true, subscriberId};
});
