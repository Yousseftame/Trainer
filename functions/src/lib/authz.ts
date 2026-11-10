import {HttpsError} from "firebase-functions/v2/https";
import type {CallerClaims} from "./types.js";
import {STAFF_ROLES} from "./types.js";

type AuthContext = {
  uid: string;
  token: Record<string, unknown>;
};

function readClaims(token: Record<string, unknown>): CallerClaims {
  return {
    role: typeof token.role === "string" ? token.role : undefined,
    status: typeof token.status === "string" ? token.status : undefined,
    permissions: Array.isArray(token.permissions)
      ? (token.permissions as string[])
      : undefined,
  };
}

/** Admin / staff callables — requires role + optional permission claim. */
export function assertStaffCaller(
  authContext: AuthContext | undefined,
  permission?: string,
): {uid: string; claims: CallerClaims} {
  if (!authContext?.uid) {
    throw new HttpsError("unauthenticated", "Sign in required.");
  }

  const claims = readClaims(authContext.token);

  if (claims.status === "suspended") {
    throw new HttpsError("permission-denied", "Account is suspended.");
  }

  if (!claims.role || !STAFF_ROLES.has(claims.role)) {
    throw new HttpsError("permission-denied", "Staff access required.");
  }

  if (permission && claims.role !== "head_coach") {
    const perms = claims.permissions ?? [];
    if (!perms.includes(permission)) {
      throw new HttpsError("permission-denied", `Missing permission: ${permission}`);
    }
  }

  return {uid: authContext.uid, claims};
}

/**
 * Subscriber-panel callables.
 * Requires an explicit subscriber role claim — missing/forged roles are denied
 * so DevTools cannot invoke these as a bare Auth user or as staff.
 */
export function assertSubscriberCaller(
  authContext: AuthContext | undefined,
): {uid: string; claims: CallerClaims} {
  if (!authContext?.uid) {
    throw new HttpsError("unauthenticated", "Sign in required.");
  }

  const claims = readClaims(authContext.token);

  if (claims.status === "suspended" || claims.status === "rejected") {
    throw new HttpsError("permission-denied", "Account is suspended.");
  }

  if (claims.role !== "subscriber") {
    throw new HttpsError("permission-denied", "Subscriber access required.");
  }

  return {uid: authContext.uid, claims};
}
