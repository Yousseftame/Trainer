import type { Role } from "@/lib/permissions/roles"

/**
 * Capability-based permissions for the single admin dashboard.
 * Head coach receives all permissions; assistants receive a subset via custom claims / profile.
 */
export const PERMISSIONS = [
  "overview:read",
  "subscribers:read",
  "subscribers:write",
  "subscribers:approve",
  "packages:manage",
  "subscriptions:manage",
  "workouts:read",
  "workouts:manage",
  "nutrition:read",
  "nutrition:manage",
  "content:read",
  "content:manage",
  "progress:read",
  "progress:write",
  "physicalTherapy:read",
  "physicalTherapy:manage",
  "reports:read",
  "reports:export",
  "staff:manage",
  "notifications:send",
] as const

export type Permission = (typeof PERMISSIONS)[number]

/**
 * Write / manage / approve / export always imply the module view permission.
 * Enabling a dependent permission must also enable its prerequisites.
 */
export const PERMISSION_REQUIRES: Partial<
  Record<Permission, readonly Permission[]>
> = {
  "subscribers:write": ["subscribers:read"],
  "subscribers:approve": ["subscribers:read"],
  "workouts:manage": ["workouts:read"],
  "nutrition:manage": ["nutrition:read"],
  "content:manage": ["content:read"],
  "progress:write": ["progress:read"],
  "physicalTherapy:manage": ["physicalTherapy:read"],
  "reports:export": ["reports:read"],
  // Subscriptions UI needs the people directory to assign seats meaningfully.
  "subscriptions:manage": ["subscribers:read"],
}

/** Expand a permission set so every write/manage also includes its required view. */
export function withRequiredPermissions(
  permissions: readonly Permission[],
): Permission[] {
  const next = new Set<Permission>(permissions)
  let changed = true
  while (changed) {
    changed = false
    for (const perm of [...next]) {
      const requires = PERMISSION_REQUIRES[perm]
      if (!requires) continue
      for (const required of requires) {
        if (!next.has(required)) {
          next.add(required)
          changed = true
        }
      }
    }
  }
  return PERMISSIONS.filter((perm) => next.has(perm))
}

/**
 * When removing a view permission, also drop dependents that required it.
 * Example: clearing subscribers:read also clears write + approve.
 */
export function withoutPermissionDependents(
  permissions: readonly Permission[],
  removed: Permission,
): Permission[] {
  const next = new Set<Permission>(permissions)
  next.delete(removed)

  let changed = true
  while (changed) {
    changed = false
    for (const [perm, requires] of Object.entries(PERMISSION_REQUIRES) as Array<
      [Permission, readonly Permission[]]
    >) {
      if (!next.has(perm)) continue
      if (requires.some((req) => !next.has(req))) {
        next.delete(perm)
        changed = true
      }
    }
  }

  return PERMISSIONS.filter((perm) => next.has(perm))
}

/** Default permission sets — server/custom claims remain source of truth. */
export const ROLE_PERMISSIONS: Record<Role, readonly Permission[]> = {
  head_coach: PERMISSIONS,
  assistant: [
    "overview:read",
    "subscribers:read",
    "subscribers:write",
    "subscribers:approve",
    "packages:manage",
    "subscriptions:manage",
    "workouts:read",
    "workouts:manage",
    "nutrition:read",
    "nutrition:manage",
    "content:read",
    "content:manage",
    "progress:read",
    "progress:write",
    "physicalTherapy:read",
    "physicalTherapy:manage",
    "reports:read",
  ],
  trainer: [
    "overview:read",
    "subscribers:read",
    "workouts:read",
    "workouts:manage",
    "content:read",
    "content:manage",
    "progress:read",
    "progress:write",
    "reports:read",
  ],
  nutritionist: [
    "overview:read",
    "subscribers:read",
    "nutrition:read",
    "nutrition:manage",
    "progress:read",
    "progress:write",
    "reports:read",
  ],
  physiotherapist: [
    "overview:read",
    "subscribers:read",
    "physicalTherapy:read",
    "physicalTherapy:manage",
    "workouts:read",
    "workouts:manage",
    "progress:read",
    "progress:write",
  ],
  subscriber: [],
}
