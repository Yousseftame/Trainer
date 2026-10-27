export const ROLES = ["head_coach", "assistant", "subscriber"] as const

export type Role = (typeof ROLES)[number]

export function isAdminRole(role: Role | null | undefined): boolean {
  return role === "head_coach" || role === "assistant"
}

export function isSubscriberRole(role: Role | null | undefined): boolean {
  return role === "subscriber"
}
