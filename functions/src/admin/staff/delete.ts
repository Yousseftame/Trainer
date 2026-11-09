import {HttpsError, onCall} from "firebase-functions/v2/https";
import {auth, db} from "../../config/firebase.js";
import {COLLECTIONS} from "../../config/collections.js";
import {assertStaffCaller} from "../../lib/authz.js";
import {
  assertCanEditTargetStaff,
  assertCanManageStaff,
  countHeadCoaches,
  deleteStaffFcmTokens,
  parseStaffRole,
} from "../../shared/staff.js";

export const deleteStaffMember = onCall(async (request) => {
  const caller = assertStaffCaller(request.auth, "staff:manage");
  assertCanManageStaff(caller.claims);

  const data = (request.data ?? {}) as Record<string, unknown>;
  const staffId = String(data.staffId ?? data.id ?? "").trim();
  if (!staffId) {
    throw new HttpsError("invalid-argument", "staffId is required.");
  }
  if (staffId === caller.uid) {
    throw new HttpsError(
      "failed-precondition",
      "You cannot delete your own account.",
    );
  }

  const ref = db.collection(COLLECTIONS.staff).doc(staffId);
  const snap = await ref.get();
  if (!snap.exists) {
    throw new HttpsError("not-found", "Staff member not found.");
  }

  const existing = snap.data() ?? {};
  const role = parseStaffRole(existing.role, "assistant");
  assertCanEditTargetStaff(caller.claims, role);
  if (role === "head_coach") {
    const otherHeads = await countHeadCoaches(staffId);
    if (otherHeads === 0) {
      throw new HttpsError(
        "failed-precondition",
        "The head coach account cannot be deleted.",
      );
    }
  }

  await deleteStaffFcmTokens(staffId);
  await ref.delete();

  try {
    await auth.deleteUser(staffId);
  } catch (err) {
    const code = (err as {code?: string})?.code;
    if (code !== "auth/user-not-found") {
      // Doc already removed — surface Auth failure so ops can reconcile.
      throw new HttpsError(
        "internal",
        `Staff profile removed but Auth delete failed: ${code || "unknown"}`,
      );
    }
  }

  return {ok: true, deletedId: staffId};
});
