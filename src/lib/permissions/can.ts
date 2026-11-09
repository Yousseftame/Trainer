import type { AppUser } from "@/types/user"
import type { Permission } from "@/lib/permissions/permissions"
import { ROLE_PERMISSIONS } from "@/lib/permissions/permissions"
import type { Role } from "@/lib/permissions/roles"
import { adminNav, flattenNavItems } from "@/config/navigation"
import { APP_ROUTES } from "@/config/constants"

type PermissionSubject = Pick<AppUser, "role" | "permissions"> | null | undefined

type PermissibleItem<T> = T & {
  permission?: Permission
  children?: PermissibleItem<T>[]
}

function resolvePermissions(subject: PermissionSubject): readonly Permission[] {
  if (!subject) return []
  // Explicit array (including empty) wins — never invent role defaults for
  // staff who were intentionally granted zero module permissions.
  if (Array.isArray(subject.permissions)) return subject.permissions
  return ROLE_PERMISSIONS[subject.role as Role] ?? []
}

export function can(subject: PermissionSubject, permission: Permission): boolean {
  if (!subject) return false
  if (subject.role === "head_coach") return true
  return resolvePermissions(subject).includes(permission)
}

export function canAny(subject: PermissionSubject, permissions: Permission[]): boolean {
  return permissions.some((permission) => can(subject, permission))
}

export function canAll(subject: PermissionSubject, permissions: Permission[]): boolean {
  return permissions.every((permission) => can(subject, permission))
}

export function filterByPermission<T extends { permission?: Permission; children?: T[] }>(
  subject: PermissionSubject,
  items: T[],
): T[] {
  return items
    .map((item) => {
      if (!item.children?.length) return item

      const children = filterByPermission(subject, item.children)
      return { ...item, children }
    })
    .filter((item) => {
      if (item.children) {
        return item.children.length > 0
      }
      return !item.permission || can(subject, item.permission)
    }) as PermissibleItem<T>[]
}

/**
 * First admin module the user may open (sidebar order).
 * Returns null when the account has no module permissions at all.
 */
export function resolveAdminHomePath(
  subject: PermissionSubject,
): string | null {
  const leaves = flattenNavItems(adminNav)
  for (const item of leaves) {
    if (!item.permission || can(subject, item.permission)) {
      return item.to
    }
  }
  return null
}

/** Safe landing for staff after login / denied module — never /unauthorized. */
export function resolveAdminLandingPath(subject: PermissionSubject): string {
  return resolveAdminHomePath(subject) ?? APP_ROUTES.admin.root
}
