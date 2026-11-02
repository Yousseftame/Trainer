import type { User } from "firebase/auth"
import { PERMISSIONS, type Permission } from "@/lib/permissions/permissions"
import type { Role } from "@/lib/permissions/roles"
import { DEMO_STAFF_MEMBERS } from "@/features/staff/demo"
import {
  getSubscriberByEmail,
  getSubscriberById,
  type DemoSubscriber,
} from "@/features/subscribers/demo"
import type { StaffMember } from "@/types/staff"
import type { AppUser, UserStatus } from "@/types/user"

function localeFromDocument(): AppUser["locale"] {
  if (typeof document === "undefined") return "en"
  return document.documentElement.lang === "ar" ? "ar" : "en"
}

export type UserIdentityInput = {
  uid: string
  email: string
  displayName?: string | null
  photoURL?: string | null
  createdAt?: string
  updatedAt?: string
}

export function mapUserIdentity(identity: UserIdentityInput): AppUser {
  const now = new Date().toISOString()
  const createdAt = identity.createdAt || now
  const updatedAt = identity.updatedAt || now
  const email = (identity.email || "").trim().toLowerCase()

  // 1. Check Staff members (Cached in localStorage first, then DEMO fallback)
  let staffMember: StaffMember | undefined
  if (typeof window !== "undefined" && window.localStorage) {
    try {
      const cached = window.localStorage.getItem("derpyfit_staff_cache")
      if (cached) {
        const parsed = JSON.parse(cached) as StaffMember[]
        staffMember = parsed.find(
          (s) => (s.email || "").trim().toLowerCase() === email,
        )
      }
    } catch (e) {
      console.warn("Could not parse staff cache:", e)
    }
  }
  if (!staffMember) {
    staffMember = DEMO_STAFF_MEMBERS.find(
      (s) => (s.email || "").trim().toLowerCase() === email,
    )
  }

  if (staffMember) {
    return {
      uid: identity.uid,
      email: identity.email,
      displayName: staffMember.displayName || identity.displayName?.trim() || "Staff",
      photoURL: identity.photoURL ?? staffMember.avatarUrl ?? undefined,
      role: staffMember.role,
      permissions:
        staffMember.role === "head_coach"
          ? [...PERMISSIONS]
          : ([...staffMember.permissions] as Permission[]),
      status: staffMember.status as UserStatus,
      locale: localeFromDocument(),
      createdAt,
      updatedAt,
    }
  }

  // 2. Check Subscribers (checks memory + localStorage: derpyfit_subscribers_v1 & cache)
  let subscriber: DemoSubscriber | undefined =
    getSubscriberById(identity.uid) ?? getSubscriberByEmail(email)

  if (!subscriber && typeof window !== "undefined" && window.localStorage) {
    try {
      const raw =
        window.localStorage.getItem("derpyfit_subscribers_v1") ||
        window.localStorage.getItem("derpyfit_subscribers_cache")
      if (raw) {
        const parsed = JSON.parse(raw) as DemoSubscriber[]
        subscriber = parsed.find(
          (s) =>
            s.id === identity.uid ||
            (s.email || "").trim().toLowerCase() === email,
        )
      }
    } catch (e) {
      console.warn("Could not parse subscriber cache:", e)
    }
  }

  if (subscriber) {
    return {
      uid: identity.uid,
      email: identity.email,
      displayName: subscriber.displayName || identity.displayName?.trim() || "Subscriber",
      photoURL: identity.photoURL ?? undefined,
      role: "subscriber",
      permissions: [],
      status: subscriber.status || "active",
      locale: subscriber.locale || localeFromDocument(),
      createdAt,
      updatedAt,
    }
  }

  // 3. Fallback: Only explicit trainer/head coach accounts get head_coach role
  const isPrimaryCoach =
    email === "coach@derpyfit.com" ||
    email === "admin@derpyfit.com" ||
    email === "omar@derpyfit.com"

  const role: Role = isPrimaryCoach ? "head_coach" : "subscriber"
  const permissions: Permission[] = isPrimaryCoach ? [...PERMISSIONS] : []

  return {
    uid: identity.uid,
    email: identity.email,
    displayName:
      identity.displayName?.trim() ||
      (isPrimaryCoach ? "Coach Omar" : identity.email?.split("@")[0] || "Subscriber"),
    photoURL: identity.photoURL ?? undefined,
    role,
    permissions,
    status: "active",
    locale: localeFromDocument(),
    createdAt,
    updatedAt,
  }
}

export function mapFirebaseUser(user: User): AppUser {
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
  })
}
