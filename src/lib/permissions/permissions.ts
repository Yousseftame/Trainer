import type { Role } from "@/lib/permissions/roles"

/**
 * Capability-based permissions for the single admin dashboard.
 * Head coach receives all permissions; assistants receive a subset via custom claims / profile.
 */
export const PERMISSIONS = [
  "subscribers:read",
  "subscribers:write",
  "subscribers:approve",
  "packages:manage",
  "subscriptions:manage",
  "workouts:manage",
  "nutrition:manage",
  "content:manage",
  "progress:read",
  "reports:read",
  "reports:export",
  "staff:manage",
  "notifications:send",
] as const

export type Permission = (typeof PERMISSIONS)[number]

/** Default permission sets — server/custom claims remain source of truth. */
export const ROLE_PERMISSIONS: Record<Role, readonly Permission[]> = {
  head_coach: PERMISSIONS,
  assistant: [
    "subscribers:read",
    "subscribers:write",
    "subscribers:approve",
    "packages:manage",
    "subscriptions:manage",
    "workouts:manage",
    "nutrition:manage",
    "content:manage",
    "progress:read",
    "reports:read",
  ],
  subscriber: [],
}
