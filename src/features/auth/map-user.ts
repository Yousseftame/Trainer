import type { User } from "firebase/auth"
import { PERMISSIONS, type Permission } from "@/lib/permissions/permissions"
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

function readStaffCacheByEmail(email: string) {
  if (typeof window === "undefined" || !window.localStorage) return null
  try {
    const cached = window.localStorage.getItem("derpyfit_staff_cache")
    if (!cached) return null
    const parsed = JSON.parse(cached) as Array<{
      id: string
      email: string
      displayName?: string
      role?: Role
      status?: UserStatus
      permissions?: Permission[]
      avatarUrl?: string
      phone?: string
    }>
    return (
      parsed.find((s) => (s.email || "").trim().toLowerCase() === email) ?? null
    )
  } catch {
    return null
  }
}

/**
 * Maps identity → AppUser.
 * Prefer Auth custom claims (role / status / permissions). Staff cache is only a
 * temporary bridge until bootstrapStaffClaims runs; demo subscriber lists are not used.
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
          : [...(identity.permissions ?? [])],
      status: identity.status ?? "active",
      locale: localeFromDocument(),
      createdAt,
      updatedAt,
    }
  }

  const staffMember = readStaffCacheByEmail(email)
  if (staffMember) {
    return {
      uid: identity.uid,
      email: identity.email,
      displayName:
        staffMember.displayName ||
        identity.displayName?.trim() ||
        "Staff",
      photoURL: identity.photoURL ?? staffMember.avatarUrl ?? undefined,
      phone: staffMember.phone,
      role: staffMember.role ?? "assistant",
      permissions:
        staffMember.role === "head_coach"
          ? [...PERMISSIONS]
          : ([...(staffMember.permissions ?? [])] as Permission[]),
      status: staffMember.status ?? "active",
      locale: localeFromDocument(),
      createdAt,
      updatedAt,
    }
  }

  const allowlistCoach =
    email === "coach@derpyfit.com" ||
    email === "admin@derpyfit.com" ||
    email === "omar@derpyfit.com"

  if (allowlistCoach) {
    return {
      uid: identity.uid,
      email: identity.email,
      displayName: identity.displayName?.trim() || "Coach Omar",
      photoURL: identity.photoURL ?? undefined,
      role: "head_coach",
      permissions: [...PERMISSIONS],
      status: "active",
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
