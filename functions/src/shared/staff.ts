import {HttpsError} from "firebase-functions/v2/https";
import {auth, db} from "../config/firebase.js";
import {COLLECTIONS} from "../config/collections.js";
import {
  ALL_STAFF_PERMISSIONS,
  STAFF_ROLES,
  type CallerClaims,
  type UserStatus,
} from "../lib/types.js";
import {stripUndefined} from "../lib/utils.js";

export type StaffRole =
  | "head_coach"
  | "assistant"
  | "trainer"
  | "nutritionist"
  | "physiotherapist";

export type StaffStatus = "active" | "suspended";

const PERMISSION_SET = new Set<string>(ALL_STAFF_PERMISSIONS);

/** Write/manage/approve/export always imply the module view permission. */
const PERMISSION_REQUIRES: Record<string, readonly string[]> = {
  "subscribers:write": ["subscribers:read"],
  "subscribers:approve": ["subscribers:read"],
  "progress:write": ["progress:read"],
  "physicalTherapy:manage": ["physicalTherapy:read"],
  "reports:export": ["reports:read"],
  "subscriptions:manage": ["subscribers:read"],
};

function withRequiredPermissions(permissions: string[]): string[] {
  const next = new Set(permissions);
  let changed = true;
  while (changed) {
    changed = false;
    for (const perm of [...next]) {
      const requires = PERMISSION_REQUIRES[perm];
      if (!requires) continue;
      for (const required of requires) {
        if (PERMISSION_SET.has(required) && !next.has(required)) {
          next.add(required);
          changed = true;
        }
      }
    }
  }
  return ALL_STAFF_PERMISSIONS.filter((perm) => next.has(perm));
}

export function parseStaffRole(raw: unknown, fallback: StaffRole = "assistant"): StaffRole {
  const value = String(raw ?? "").trim();
  if (STAFF_ROLES.has(value) && value !== "subscriber") {
    return value as StaffRole;
  }
  return fallback;
}

export function parseStaffStatus(
  raw: unknown,
  fallback: StaffStatus = "active",
): StaffStatus {
  if (raw === "suspended" || raw === "active") return raw;
  return fallback;
}

export function sanitizePermissions(
  raw: unknown,
  role: StaffRole,
): string[] {
  if (role === "head_coach") {
    return [...ALL_STAFF_PERMISSIONS];
  }
  const list = Array.isArray(raw) ? raw.map((item) => String(item)) : [];
  const unique = [...new Set(list.filter((item) => PERMISSION_SET.has(item)))];
  return withRequiredPermissions(unique);
}

export function assertCanManageStaff(claims: CallerClaims) {
  if (claims.role === "head_coach") return;
  const perms = claims.permissions ?? [];
  if (!perms.includes("staff:manage")) {
    throw new HttpsError("permission-denied", "Missing permission: staff:manage");
  }
}

function callerPermissionSet(claims: CallerClaims): Set<string> {
  if (claims.role === "head_coach") {
    return new Set(ALL_STAFF_PERMISSIONS);
  }
  return new Set(claims.permissions ?? []);
}

/** Only a head coach may mint staff:manage or another head_coach. */
export function assertPrivilegedStaffAssignment(
  caller: CallerClaims,
  role: StaffRole,
  permissions: string[],
) {
  const grantsStaffManage = permissions.includes("staff:manage");
  if (role === "head_coach" || grantsStaffManage) {
    if (caller.role !== "head_coach") {
      throw new HttpsError(
        "permission-denied",
        "Only the head coach can assign head-coach role or staff:manage.",
      );
    }
  }
}

/**
 * Non–head-coach managers may only assign permissions they already hold.
 * Prevents DevTools callers from minting powers they do not have.
 */
export function assertAssignablePermissions(
  caller: CallerClaims,
  permissions: string[],
) {
  if (caller.role === "head_coach") return;
  const held = callerPermissionSet(caller);
  const illegal = permissions.filter((perm) => !held.has(perm));
  if (illegal.length) {
    throw new HttpsError(
      "permission-denied",
      `Cannot assign permissions you do not hold: ${illegal.join(", ")}`,
    );
  }
}

/** Head-coach profiles are editable only by a head coach. */
export function assertCanEditTargetStaff(
  caller: CallerClaims,
  targetRole: StaffRole,
) {
  if (targetRole === "head_coach" && caller.role !== "head_coach") {
    throw new HttpsError(
      "permission-denied",
      "Only a head coach can modify a head coach account.",
    );
  }
}

/**
 * Nobody may change their own role / permissions / status through staff APIs.
 * Soft profile fields (name, phone, notes, password) may still be updated.
 */
export function assertNoSelfPrivilegeEscalation(input: {
  callerUid: string;
  targetId: string;
  prevRole: StaffRole;
  nextRole: StaffRole;
  prevStatus: StaffStatus;
  nextStatus: StaffStatus;
  prevPermissions: string[];
  nextPermissions: string[];
}) {
  if (input.callerUid !== input.targetId) return;

  const sameRole = input.prevRole === input.nextRole;
  const sameStatus = input.prevStatus === input.nextStatus;
  const prevSet = [...input.prevPermissions].sort().join("\0");
  const nextSet = [...input.nextPermissions].sort().join("\0");
  const samePerms = prevSet === nextSet;

  if (!sameRole || !sameStatus || !samePerms) {
    throw new HttpsError(
      "failed-precondition",
      "You cannot change your own role, permissions, or account status.",
    );
  }
}

export async function countHeadCoaches(excludeId?: string): Promise<number> {
  const snap = await db
    .collection(COLLECTIONS.staff)
    .where("role", "==", "head_coach")
    .get();
  return snap.docs.filter((docSnap) => docSnap.id !== excludeId).length;
}

export async function setStaffClaims(
  uid: string,
  input: {role: StaffRole; status: StaffStatus; permissions: string[]},
) {
  const permissions =
    input.role === "head_coach"
      ? [...ALL_STAFF_PERMISSIONS]
      : [...input.permissions];

  await auth.setCustomUserClaims(uid, {
    role: input.role,
    status: input.status as UserStatus,
    permissions,
  });
}

export function buildStaffRecord(input: {
  id: string;
  displayName: string;
  email: string;
  phone?: string;
  role: StaffRole;
  status: StaffStatus;
  permissions: string[];
  customTitle?: {en: string; ar: string};
  notes?: string;
  avatarUrl?: string;
  lastLoginAt?: string | null;
  createdAt: string;
  updatedAt: string;
}) {
  const permissions =
    input.role === "head_coach"
      ? [...ALL_STAFF_PERMISSIONS]
      : [...input.permissions];

  return stripUndefined({
    id: input.id,
    displayName: input.displayName.trim(),
    email: input.email.trim().toLowerCase(),
    phone: input.phone?.trim() || undefined,
    role: input.role,
    status: input.role === "head_coach" ? "active" : input.status,
    permissions,
    customTitle: input.customTitle,
    notes: input.notes?.trim() || undefined,
    avatarUrl: input.avatarUrl,
    lastLoginAt: input.lastLoginAt ?? null,
    createdAt: input.createdAt,
    updatedAt: input.updatedAt,
  });
}

export async function deleteStaffFcmTokens(uid: string) {
  const snap = await db
    .collection(COLLECTIONS.fcmTokens)
    .where("uid", "==", uid)
    .get();
  if (snap.empty) return;
  const batch = db.batch();
  for (const docSnap of snap.docs) {
    batch.delete(docSnap.ref);
  }
  await batch.commit();
}
