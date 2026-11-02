export const ROLES = [
  "head_coach",
  "assistant",
  "trainer",
  "nutritionist",
  "physiotherapist",
  "subscriber",
] as const

export type Role = (typeof ROLES)[number]

export function isAdminRole(role: Role | null | undefined): boolean {
  return (
    role === "head_coach" ||
    role === "assistant" ||
    role === "trainer" ||
    role === "nutritionist" ||
    role === "physiotherapist"
  )
}

export function isSubscriberRole(role: Role | null | undefined): boolean {
  return role === "subscriber"
}

