import {HttpsError, onCall} from "firebase-functions/v2/https";
import {auth, db} from "../../config/firebase.js";
import {COLLECTIONS} from "../../config/collections.js";
import {ALL_STAFF_PERMISSIONS, type UserStatus} from "../../lib/types.js";
import {stripUndefined} from "../../lib/utils.js";

/** Ensures signed-in staff have custom claims used by rules + callables. */
export const bootstrapStaffClaims = onCall(async (request) => {
  if (!request.auth?.uid) {
    throw new HttpsError("unauthenticated", "Sign in required.");
  }

  const uid = request.auth.uid;
  const email =
    (request.auth.token.email as string | undefined)?.toLowerCase() ?? "";

  const staffSnap = await db.collection(COLLECTIONS.staff).doc(uid).get();
  let role = "head_coach";
  let status: UserStatus = "active";
  let permissions: string[] = [];

  if (staffSnap.exists) {
    const data = staffSnap.data() ?? {};
    role = String(data.role ?? "assistant");
    status = (String(data.status ?? "active") as UserStatus) || "active";
    permissions = Array.isArray(data.permissions)
      ? (data.permissions as string[])
      : [];
  } else {
    const byEmail = await db
      .collection(COLLECTIONS.staff)
      .where("email", "==", email)
      .limit(1)
      .get();

    if (!byEmail.empty) {
      const data = byEmail.docs[0].data();
      role = String(data.role ?? "assistant");
      status = (String(data.status ?? "active") as UserStatus) || "active";
      permissions = Array.isArray(data.permissions)
        ? (data.permissions as string[])
        : [];
      if (byEmail.docs[0].id !== uid) {
        await db.collection(COLLECTIONS.staff).doc(uid).set(
          stripUndefined({
            ...data,
            id: uid,
            updatedAt: new Date().toISOString(),
          }),
          {merge: true},
        );
      }
    } else {
      const allowlist = new Set([
        "coach@derpyfit.com",
        "admin@derpyfit.com",
        "omar@derpyfit.com",
      ]);
      if (!allowlist.has(email)) {
        throw new HttpsError(
          "permission-denied",
          "No staff profile found for this account.",
        );
      }
      permissions = [...ALL_STAFF_PERMISSIONS];
      await db.collection(COLLECTIONS.staff).doc(uid).set(
        stripUndefined({
          id: uid,
          displayName: request.auth.token.name || "Head Coach",
          email,
          role: "head_coach",
          status: "active",
          permissions,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }),
        {merge: true},
      );
    }
  }

  if (role === "head_coach") {
    permissions = [...ALL_STAFF_PERMISSIONS];
  }

  await auth.setCustomUserClaims(uid, {role, status, permissions});
  return {ok: true, role, status, permissions};
});
