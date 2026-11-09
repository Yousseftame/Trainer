import {HttpsError, onCall} from "firebase-functions/v2/https";
import {auth, db} from "../../config/firebase.js";
import {COLLECTIONS} from "../../config/collections.js";
import {assertStaffCaller} from "../../lib/authz.js";
import {
  assertCanEditTargetStaff,
  assertCanManageStaff,
  parseStaffRole,
  parseStaffStatus,
  sanitizePermissions,
  setStaffClaims,
} from "../../shared/staff.js";

export const setStaffAccountStatus = onCall(async (request) => {
  const caller = assertStaffCaller(request.auth, "staff:manage");
  assertCanManageStaff(caller.claims);

  const data = (request.data ?? {}) as Record<string, unknown>;
  const staffId = String(data.staffId ?? data.id ?? "").trim();
  const status = parseStaffStatus(data.status, "active");

  if (!staffId) {
    throw new HttpsError("invalid-argument", "staffId is required.");
  }
  if (staffId === caller.uid) {
    throw new HttpsError(
      "failed-precondition",
      "You cannot change the status of your own account.",
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
    throw new HttpsError(
      "failed-precondition",
      "The head coach account cannot be suspended.",
    );
  }

  const permissions = sanitizePermissions(existing.permissions, role);
  const now = new Date().toISOString();

  await auth.updateUser(staffId, {disabled: status === "suspended"});
  await ref.set(
    {
      status,
      updatedAt: now,
    },
    {merge: true},
  );
  await setStaffClaims(staffId, {role, status, permissions});

  const next = {...existing, status, updatedAt: now, id: staffId};
  return {ok: true, staff: next};
});
