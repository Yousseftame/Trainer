export type PriorityKind = "request" | "expiring" | "expired" | "stale"

export type PriorityItem = {
  id: string
  kind: PriorityKind
  name: string
  href: string
  packageName?: { en: string; ar: string }
  createdAt?: string
  daysLeft?: number
  days?: number
}
