import type { Permission } from "@/lib/permissions/permissions"
import type { Role } from "@/lib/permissions/roles"

export type UserStatus = "pending" | "active" | "suspended" | "rejected"

export type AppUser = {
  uid: string
  email: string
  displayName: string
  phone?: string
  photoURL?: string
  role: Role
  permissions: Permission[]
  status: UserStatus
  locale: "en" | "ar"
  createdAt: string
  updatedAt: string
}

export type AuthSession = {
  user: AppUser | null
  firebaseUid: string | null
  isAuthenticated: boolean
  isAdmin: boolean
  isSubscriber: boolean
}
