import {HttpsError, onCall} from "firebase-functions/v2/https";
import {auth, db} from "../../config/firebase.js";
import {COLLECTIONS} from "../../config/collections.js";
import {ALL_STAFF_PERMISSIONS} from "../../lib/types.js";
import {stripUndefined} from "../../lib/utils.js";
import {
  parseStaffRole,
  parseStaffStatus,
  sanitizePermissions,
} from "../../shared/staff.js";

const BOOTSTRAP_ALLOWLIST = new Set([
  "coach@derpyfit.com",
  "admin@derpyfit.com",
  "omar@derpyfit.com",
]);

/**
 * Syncs Auth custom claims from the staff directory (source of truth).
 * Allowlist minting is first-run only (empty staff collection) — never a standing
 * privilege escalation path once a staff directory exists.
 * Never invents extra permissions beyond the staff profile.
 */
export const bootstrapStaffClaims = onCall(async (request) => {
  if (!request.auth?.uid) {
    throw new HttpsError("unauthenticated", "Sign in required.");
  }

  const uid = request.auth.uid;
  const email =
    (request.auth.token.email as string | undefined)?.toLowerCase() ?? "";

  const staffSnap = await db.collection(COLLECTIONS.staff).doc(uid).get();
  let role = parseStaffRole("assistant");
  let status = parseStaffStatus("active");
  let permissions: string[] = [];

  if (staffSnap.exists) {
    const data = staffSnap.data() ?? {};
    role = parseStaffRole(data.role, "assistant");
    status = parseStaffStatus(data.status, "active");
    permissions = sanitizePermissions(data.permissions, role);
  } else {
    const byEmail = await db
      .collection(COLLECTIONS.staff)
      .where("email", "==", email)
      .limit(1)
      .get();

    if (!byEmail.empty) {
      const data = byEmail.docs[0].data();
      role = parseStaffRole(data.role, "assistant");
      status = parseStaffStatus(data.status, "active");
      permissions = sanitizePermissions(data.permissions, role);
      if (byEmail.docs[0].id !== uid) {
        // Relink profile to the live Auth uid — never trust client-writable fields.
        await db.collection(COLLECTIONS.staff).doc(uid).set(
          stripUndefined({
            ...data,
            id: uid,
            role,
            status,
            permissions,
            updatedAt: new Date().toISOString(),
          }),
          {merge: true},
        );
      }
    } else {
      if (!BOOTSTRAP_ALLOWLIST.has(email)) {
        throw new HttpsError(
          "permission-denied",
          "No staff profile found for this account.",
        );
      }

      const existingStaff = await db.collection(COLLECTIONS.staff).limit(1).get();
      if (!existingStaff.empty) {
        throw new HttpsError(
          "permission-denied",
          "Staff directory already initialized. Ask a head coach to add this account.",
        );
      }

      role = "head_coach";
      status = "active";
      permissions = [...ALL_STAFF_PERMISSIONS];
      await db.collection(COLLECTIONS.staff).doc(uid).set(
        stripUndefined({
          id: uid,
          displayName: request.auth.token.name || "Head Coach",
          email,
          role,
          status,
          permissions,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }),
        {merge: true},
      );
    }
  }

  if (status === "suspended") {
    throw new HttpsError(
      "permission-denied",
      "Account is suspended.",
    );
  }

  // Claims mirror the staff document exactly (head coach → full set via sanitize).
  permissions = sanitizePermissions(permissions, role);

  await auth.setCustomUserClaims(uid, {role, status, permissions});
  return {ok: true, role, status, permissions};
});