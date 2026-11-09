import {HttpsError, onCall} from "firebase-functions/v2/https";
import {auth, db} from "../../config/firebase.js";
import {COLLECTIONS} from "../../config/collections.js";
import {assertStaffCaller} from "../../lib/authz.js";
import {normalizeBilingual} from "../../lib/utils.js";
import {
  assertAssignablePermissions,
  assertCanManageStaff,
  assertPrivilegedStaffAssignment,
  buildStaffRecord,
  countHeadCoaches,
  parseStaffRole,
  parseStaffStatus,
  sanitizePermissions,
  setStaffClaims,
} from "../../shared/staff.js";

export const createStaffMember = onCall(async (request) => {
  const caller = assertStaffCaller(request.auth, "staff:manage");
  assertCanManageStaff(caller.claims);

  const data = (request.data ?? {}) as Record<string, unknown>;
  const email = String(data.email ?? "").trim().toLowerCase();
  const displayName = String(data.displayName ?? "").trim();
  const password = String(data.password ?? "").trim();
  const phone = String(data.phone ?? "").trim();
  const role = parseStaffRole(data.role, "assistant");
  const status = parseStaffStatus(data.status, "active");
  const permissions = sanitizePermissions(data.permissions, role);
  const notes =
    typeof data.notes === "string" ? data.notes.trim() : undefined;
  const customTitle = normalizeBilingual(data.customTitle);

  if (!email || !displayName) {
    throw new HttpsError("invalid-argument", "Email and display name are required.");
  }
  if (password.length < 6) {
    throw new HttpsError(
      "invalid-argument",
      "Password must be at least 6 characters.",
    );
  }

  assertPrivilegedStaffAssignment(caller.claims, role, permissions);
  assertAssignablePermissions(caller.claims, permissions);

  if (role === "head_coach") {
    const existingHeads = await countHeadCoaches();
    if (existingHeads > 0) {
      throw new HttpsError(
        "failed-precondition",
        "A head coach account already exists.",
      );
    }
  }

  const subscriberClash = await db
    .collection(COLLECTIONS.subscribers)
    .where("email", "==", email)
    .limit(1)
    .get();
  if (!subscriberClash.empty) {
    throw new HttpsError(
      "already-exists",
      "This email already belongs to a subscriber account.",
    );
  }

  const staffClash = await db
    .collection(COLLECTIONS.staff)
    .where("email", "==", email)
    .limit(1)
    .get();
  if (!staffClash.empty) {
    throw new HttpsError(
      "already-exists",
      "A staff account with this email already exists.",
    );
  }

  let userRecord;
  try {
    userRecord = await auth.createUser({
      email,
      password,
      displayName,
      disabled: status === "suspended",
    });
  } catch (err) {
    const code = (err as {code?: string})?.code;
    if (code === "auth/email-already-exists") {
      throw new HttpsError(
        "already-exists",
        "An Auth account with this email already exists.",
      );
    }
    throw err;
  }

  const uid = userRecord.uid;
  const now = new Date().toISOString();
  const record = buildStaffRecord({
    id: uid,
    displayName,
    email,
    phone: phone || undefined,
    role,
    status: role === "head_coach" ? "active" : status,
    permissions,
    customTitle: customTitle
      ? {en: customTitle.en, ar: customTitle.ar}
      : undefined,
    notes,
    createdAt: now,
    updatedAt: now,
  });

  try {
    await db.collection(COLLECTIONS.staff).doc(uid).set(record);
    await setStaffClaims(uid, {
      role,
      status: (record.status as "active" | "suspended") || "active",
      permissions: (record.permissions as string[]) || permissions,
    });
  } catch (err) {
    await auth.deleteUser(uid).catch(() => undefined);
    throw err;
  }

  return {ok: true, staff: record};
});
