import type { User } from "firebase/auth"
import {
  PERMISSIONS,
  withRequiredPermissions,
  type Permission,
} from "@/lib/permissions/permissions"
import type { Role } from "@/lib/permissions/roles"
import type { AppUser, UserStatus } from "@/types/user"

function localeFromDocument(): AppUser["locale"] {
  if (typeof document === "undefined") return "en"
  return document.documentElement.lang === "ar" ? "ar" : "en"
}

function isRole(value: unknown): value is Role {
  return (
    value === "head_coach" ||
    value === "assistant" ||
    value === "trainer" ||
    value === "nutritionist" ||
    value === "physiotherapist" ||
    value === "subscriber"
  )
}

function isUserStatus(value: unknown): value is UserStatus {
  return (
    value === "pending" ||
    value === "active" ||
    value === "suspended" ||
    value === "rejected"
  )
}

export type UserIdentityInput = {
  uid: string
  email: string
  displayName?: string | null
  photoURL?: string | null
  createdAt?: string
  updatedAt?: string
  role?: Role
  permissions?: Permission[]
  status?: UserStatus
  phone?: string
}

/**
 * Maps identity → AppUser.
 * Auth custom claims (bootstrapStaffClaims / Admin SDK) are the only privilege source.
 */
export function mapUserIdentity(identity: UserIdentityInput): AppUser {
  const now = new Date().toISOString()
  const createdAt = identity.createdAt || now
  const updatedAt = identity.updatedAt || now
  const email = (identity.email || "").trim().toLowerCase()

  if (identity.role) {
    return {
      uid: identity.uid,
      email: identity.email,
      displayName:
        identity.displayName?.trim() || email.split("@")[0] || "User",
      photoURL: identity.photoURL ?? undefined,
      phone: identity.phone,
      role: identity.role,
      permissions:
        identity.role === "head_coach"
          ? [...PERMISSIONS]
          : withRequiredPermissions(
              (identity.permissions ?? []).filter(
                (item): item is Permission =>
                  typeof item === "string" &&
                  (PERMISSIONS as readonly string[]).includes(item),
              ),
            ),
      status: identity.status ?? "active",
      locale: localeFromDocument(),
      createdAt,
      updatedAt,
    }
  }

  return {
    uid: identity.uid,
    email: identity.email,
    displayName:
      identity.displayName?.trim() || email.split("@")[0] || "Subscriber",
    photoURL: identity.photoURL ?? undefined,
    role: "subscriber",
    permissions: [],
    status: "active",
    locale: localeFromDocument(),
    createdAt,
    updatedAt,
  }
}

export function mapFirebaseUser(user: User): AppUser {
  const token = user as User & {
    accessToken?: string
  }
  void token

  // Synchronous claim read from parsed token result if already cached on user
  // Prefer getIdTokenResult when available via optional cached claims on reload.
  const claims =
    (
      user as User & {
        reloadUserInfo?: { customAttributes?: string }
      }
    ).reloadUserInfo?.customAttributes

  let role: Role | undefined
  let status: UserStatus | undefined
  let permissions: Permission[] | undefined

  if (claims) {
    try {
      const parsed = JSON.parse(claims) as Record<string, unknown>
      if (isRole(parsed.role)) role = parsed.role
      if (isUserStatus(parsed.status)) status = parsed.status
      if (Array.isArray(parsed.permissions)) {
        permissions = parsed.permissions as Permission[]
      }
    } catch {
      // ignore malformed claims JSON
    }
  }

  return mapUserIdentity({
    uid: user.uid,
    email: user.email ?? "",
    displayName: user.displayName,
    photoURL: user.photoURL,
    createdAt: user.metadata.creationTime
      ? new Date(user.metadata.creationTime).toISOString()
      : undefined,
    updatedAt: user.metadata.lastSignInTime
      ? new Date(user.metadata.lastSignInTime).toISOString()
      : undefined,
    role,
    status,
    permissions,
  })
}

/** Async mapping with fresh ID token claims (preferred after login / bootstrap). */
export async function mapFirebaseUserWithClaims(user: User): Promise<AppUser> {
  const tokenResult = await user.getIdTokenResult(true)
  const claims = tokenResult.claims
  const role = isRole(claims.role) ? claims.role : undefined
  const status = isUserStatus(claims.status) ? claims.status : undefined
  const permissions = Array.isArray(claims.permissions)
    ? (claims.permissions as Permission[])
    : undefined

  return mapUserIdentity({
    uid: user.uid,
    email: user.email ?? "",
    displayName: user.displayName,
    photoURL: user.photoURL,
    createdAt: user.metadata.creationTime
      ? new Date(user.metadata.creationTime).toISOString()
      : undefined,
    updatedAt: user.metadata.lastSignInTime
      ? new Date(user.metadata.lastSignInTime).toISOString()
      : undefined,
    role,
    status,
    permissions,
  })
}
