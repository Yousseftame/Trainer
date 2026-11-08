import {HttpsError, onCall} from "firebase-functions/v2/https";
import {db} from "../../config/firebase.js";
import {COLLECTIONS} from "../../config/collections.js";
import {assertStaffCaller} from "../../lib/authz.js";
import type {UserStatus} from "../../lib/types.js";
import {isFirebaseUid} from "../../lib/utils.js";
import {applyAuthAccess} from "../../shared/subscribers.js";
import {syncSubscriptionForStatus} from "../../shared/subscriptions.js";

export const setSubscriberAccountStatus = onCall(async (request) => {
  const caller = assertStaffCaller(request.auth, "subscribers:write");
  const data = (request.data ?? {}) as Record<string, unknown>;
  const subscriberId = String(data.subscriberId ?? "").trim();
  const status = String(data.status ?? "").trim() as UserStatus;
  const syncSubscription = data.syncSubscription !== false;
  const adminName = String(data.adminName ?? "Head Coach");
  const notes = typeof data.notes === "string" ? data.notes : undefined;

  if (!subscriberId || !isFirebaseUid(subscriberId)) {
    throw new HttpsError(
      "invalid-argument",
      "Valid subscriber Auth UID is required.",
    );
  }
  if (!["pending", "active", "suspended", "rejected"].includes(status)) {
    throw new HttpsError("invalid-argument", "Invalid status.");
  }

  const ref = db.collection(COLLECTIONS.subscribers).doc(subscriberId);
  const snap = await ref.get();
  if (!snap.exists) {
    throw new HttpsError("not-found", "Subscriber not found.");
  }

  await applyAuthAccess(subscriberId, status);
  const now = new Date().toISOString();
  await ref.update({status, updatedAt: now});

  if (syncSubscription) {
    await syncSubscriptionForStatus(subscriberId, status, adminName, notes);
  }

  const updated = {
    ...(snap.data() ?? {}),
    status,
    updatedAt: now,
    id: subscriberId,
  };
  return {subscriber: updated, updatedBy: caller.uid};
});
