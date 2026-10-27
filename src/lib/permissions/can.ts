import type { AppUser } from "@/types/user"
import type { Permission } from "@/lib/permissions/permissions"
import { ROLE_PERMISSIONS } from "@/lib/permissions/permissions"
import type { Role } from "@/lib/permissions/roles"

type PermissionSubject = Pick<AppUser, "role" | "permissions"> | null | undefined

function resolvePermissions(subject: PermissionSubject): readonly Permission[] {
  if (!subject) return []
  if (subject.permissions?.length) return subject.permissions
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

export function filterByPermission<T extends { permission?: Permission }>(
  subject: PermissionSubject,
  items: T[],
): T[] {
  return items.filter((item) => !item.permission || can(subject, item.permission))
}
