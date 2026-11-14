import {HttpsError} from "firebase-functions/v2/https";
import type {CallerClaims} from "./types.js";
import {ALL_STAFF_PERMISSIONS, STAFF_ROLES} from "./types.js";

type AuthContext = {
  uid: string;
  token: Record<string, unknown>;
};

const PERMISSION_REQUIRES: Record<string, readonly string[]> = {
  "subscribers:write": ["subscribers:read"],
  "subscribers:approve": ["subscribers:read"],
  "workouts:manage": ["workouts:read"],
  "nutrition:manage": ["nutrition:read"],
  "content:manage": ["content:read"],
  "progress:write": ["progress:read"],
  "physicalTherapy:manage": ["physicalTherapy:read"],
  "reports:export": ["reports:read"],
  "subscriptions:manage": ["subscribers:read"],
};

function expandPermissions(permissions: readonly string[]): string[] {
  const allowed = new Set<string>(ALL_STAFF_PERMISSIONS);
  const next = new Set(permissions.filter((perm) => allowed.has(perm)));
  let changed = true;
  while (changed) {
    changed = false;
    for (const perm of [...next]) {
      const requires = PERMISSION_REQUIRES[perm];
      if (!requires) continue;
      for (const required of requires) {
        if (allowed.has(required) && !next.has(required)) {
          next.add(required);
          changed = true;
        }
      }
    }
  }
  return ALL_STAFF_PERMISSIONS.filter((perm) => next.has(perm));
}

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
    const perms = expandPermissions(claims.permissions ?? []);
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
