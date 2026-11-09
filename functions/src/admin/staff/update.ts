import {HttpsError, onCall} from "firebase-functions/v2/https";
import {auth, db} from "../../config/firebase.js";
import {COLLECTIONS} from "../../config/collections.js";
import {assertStaffCaller} from "../../lib/authz.js";
import {normalizeBilingual} from "../../lib/utils.js";
import {
  assertAssignablePermissions,
  assertCanEditTargetStaff,
  assertCanManageStaff,
  assertNoSelfPrivilegeEscalation,
  assertPrivilegedStaffAssignment,
  buildStaffRecord,
  countHeadCoaches,
  parseStaffRole,
  parseStaffStatus,
  sanitizePermissions,
  setStaffClaims,
  type StaffRole,
} from "../../shared/staff.js";

export const updateStaffMember = onCall(async (request) => {
  const caller = assertStaffCaller(request.auth, "staff:manage");
  assertCanManageStaff(caller.claims);

  const data = (request.data ?? {}) as Record<string, unknown>;
  const staffId = String(data.staffId ?? data.id ?? "").trim();
  if (!staffId) {
    throw new HttpsError("invalid-argument", "staffId is required.");
  }

  const ref = db.collection(COLLECTIONS.staff).doc(staffId);
  const snap = await ref.get();
  if (!snap.exists) {
    throw new HttpsError("not-found", "Staff member not found.");
  }

  const existing = snap.data() ?? {};
  const prevRole = parseStaffRole(existing.role, "assistant");
  assertCanEditTargetStaff(caller.claims, prevRole);

  const nextRole = data.role !== undefined
    ? parseStaffRole(data.role, prevRole)
    : prevRole;
  const prevStatus = parseStaffStatus(existing.status, "active");
  const nextStatus = data.status !== undefined
    ? parseStaffStatus(data.status, prevStatus)
    : prevStatus;

  const displayName =
    data.displayName !== undefined
      ? String(data.displayName).trim()
      : String(existing.displayName ?? "");
  const phone =
    data.phone !== undefined
      ? String(data.phone).trim()
      : String(existing.phone ?? "");
  const notes =
    data.notes !== undefined
      ? String(data.notes ?? "").trim() || undefined
      : typeof existing.notes === "string"
        ? existing.notes
        : undefined;
  const customTitle =
    data.customTitle !== undefined
      ? normalizeBilingual(data.customTitle)
      : normalizeBilingual(existing.customTitle);

  const prevPermissions = sanitizePermissions(existing.permissions, prevRole);
  const permissions = sanitizePermissions(
    data.permissions !== undefined ? data.permissions : existing.permissions,
    nextRole,
  );

  if (!displayName) {
    throw new HttpsError("invalid-argument", "Display name is required.");
  }

  // Email is identity-locked — change only via recreate.
  const email = String(existing.email ?? "").trim().toLowerCase();

  assertNoSelfPrivilegeEscalation({
    callerUid: caller.uid,
    targetId: staffId,
    prevRole,
    nextRole,
    prevStatus,
    nextStatus,
    prevPermissions,
    nextPermissions: permissions,
  });

  assertPrivilegedStaffAssignment(caller.claims, nextRole, permissions);
  assertAssignablePermissions(caller.claims, permissions);
  assertCanEditTargetStaff(caller.claims, nextRole);

  if (prevRole === "head_coach" && nextRole !== "head_coach") {
    const otherHeads = await countHeadCoaches(staffId);
    if (otherHeads === 0) {
      throw new HttpsError(
        "failed-precondition",
        "Cannot demote the only head coach account.",
      );
    }
  }

  if (prevRole !== "head_coach" && nextRole === "head_coach") {
    const existingHeads = await countHeadCoaches(staffId);
    if (existingHeads > 0) {
      throw new HttpsError(
        "failed-precondition",
        "A head coach account already exists.",
      );
    }
  }

  if (nextRole === "head_coach" && nextStatus === "suspended") {
    throw new HttpsError(
      "failed-precondition",
      "The head coach account cannot be suspended.",
    );
  }

  const password =
    typeof data.password === "string" ? data.password.trim() : "";
  if (password && password.length < 6) {
    throw new HttpsError(
      "invalid-argument",
      "Password must be at least 6 characters.",
    );
  }

  const now = new Date().toISOString();
  const record = buildStaffRecord({
    id: staffId,
    displayName,
    email,
    phone: phone || undefined,
    role: nextRole as StaffRole,
    status: nextRole === "head_coach" ? "active" : nextStatus,
    permissions,
    customTitle: customTitle
      ? {en: customTitle.en, ar: customTitle.ar}
      : undefined,
    notes,
    avatarUrl:
      typeof existing.avatarUrl === "string" ? existing.avatarUrl : undefined,
    lastLoginAt:
      typeof existing.lastLoginAt === "string" ? existing.lastLoginAt : null,
    createdAt:
      typeof existing.createdAt === "string" ? existing.createdAt : now,
    updatedAt: now,
  });

  const authUpdate: {
    displayName: string;
    disabled?: boolean;
    password?: string;
  } = {
    displayName,
    disabled: record.status === "suspended",
  };
  if (password) authUpdate.password = password;

  await auth.updateUser(staffId, authUpdate);
  await ref.set(record, {merge: false});
  await setStaffClaims(staffId, {
    role: nextRole,
    status: (record.status as "active" | "suspended") || "active",
    permissions: (record.permissions as string[]) || permissions,
  });

  return {ok: true, staff: record};
});
