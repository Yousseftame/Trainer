import {
  DEFAULT_PACKAGE_ENTITLEMENTS,
  type PackageEntitlementKey,
  type PackageEntitlements,
  type SubscriberSubscription,
  type SubscriptionPackage,
  type SubscriptionStatus,
} from "@/types/subscription"

export const ENTITLEMENT_KEYS: PackageEntitlementKey[] = [
  "workoutProgram",
  "nutritionProgram",
  "exerciseVideos",
  "pdfDocuments",
  "progressTracking",
]

export function normalizeEntitlements(
  input?: Partial<PackageEntitlements> | null,
): PackageEntitlements {
  return {
    workoutProgram: input?.workoutProgram ?? DEFAULT_PACKAGE_ENTITLEMENTS.workoutProgram,
    nutritionProgram: input?.nutritionProgram ?? DEFAULT_PACKAGE_ENTITLEMENTS.nutritionProgram,
    exerciseVideos: input?.exerciseVideos ?? DEFAULT_PACKAGE_ENTITLEMENTS.exerciseVideos,
    pdfDocuments: input?.pdfDocuments ?? DEFAULT_PACKAGE_ENTITLEMENTS.pdfDocuments,
    progressTracking: input?.progressTracking ?? DEFAULT_PACKAGE_ENTITLEMENTS.progressTracking,
  }
}

/**
 * Evaluates effective subscription status by checking expiration timestamp.
 * If a subscription is marked `active` but its `endsAt` date has already passed,
 * it is treated as `expired` for access enforcement.
 */
export function resolveEffectiveSubscriptionStatus(
  subscription: Pick<SubscriberSubscription, "status" | "startsAt" | "endsAt"> | null | undefined,
  now: Date = new Date(),
): SubscriptionStatus | null {
  if (!subscription) return null
  // Legacy Functions wrote "terminated" — treat as cancelled.
  const rawStatus = String(subscription.status)
  const status: SubscriptionStatus =
    rawStatus === "terminated" ? "cancelled" : subscription.status
  if (status === "active" && subscription.endsAt) {
    const endMs = new Date(subscription.endsAt).getTime()
    if (!Number.isNaN(endMs) && endMs < now.getTime()) {
      return "expired"
    }
  }
  return status
}

/**
 * Whole days left until `endsAt` (negative if already past).
 * Driven by the seat window — never by package catalog `durationDays`.
 */
export function subscriptionDaysRemaining(
  endsAt: string | null | undefined,
  now: Date = new Date(),
): number | null {
  if (!endsAt) return null
  const endMs = new Date(endsAt).getTime()
  if (Number.isNaN(endMs)) return null
  return Math.ceil((endMs - now.getTime()) / 86_400_000)
}

/** Elapsed progress 0–100 across startsAt → endsAt (min visual 4%). */
export function subscriptionProgressPercent(
  startsAt: string | null | undefined,
  endsAt: string | null | undefined,
  now: Date = new Date(),
): number {
  if (!startsAt || !endsAt) return 4
  const startMs = new Date(startsAt).getTime()
  const endMs = new Date(endsAt).getTime()
  if (Number.isNaN(startMs) || Number.isNaN(endMs) || endMs <= startMs) return 4
  const elapsed = Math.min(Math.max(0, now.getTime() - startMs), endMs - startMs)
  return Math.min(100, Math.max(4, Math.round((elapsed / (endMs - startMs)) * 100)))
}

/**
 * Prefer effectively-active → suspended → pending → latest by updatedAt.
 * Honors past `endsAt` even when Firestore still says `active`.
 */
export function pickCurrentSubscription(
  items: SubscriberSubscription[] | undefined | null,
  now: Date = new Date(),
): SubscriberSubscription | null {
  if (!items?.length) return null
  const ranked = [...items].sort(
    (a, b) =>
      new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
  )
  const scored = ranked.map((s) => ({
    s,
    effective: resolveEffectiveSubscriptionStatus(s, now),
  }))
  return (
    scored.find((row) => row.effective === "active")?.s ??
    scored.find((row) => row.effective === "suspended")?.s ??
    scored.find((row) => row.effective === "pending")?.s ??
    ranked[0]
  )
}

/**
 * Checks whether a subscriber is allowed to access a specific content area
 * based on their current subscription status, date window, and package entitlements.
 */
export function canAccessPackageEntitlement(
  subscription: SubscriberSubscription | null | undefined,
  pkg: SubscriptionPackage | null | undefined,
  key: PackageEntitlementKey,
  now: Date = new Date(),
): boolean {
  const effectiveStatus = resolveEffectiveSubscriptionStatus(subscription, now)
  if (effectiveStatus !== "active") return false

  if (subscription?.startsAt) {
    const startMs = new Date(subscription.startsAt).getTime()
    if (!Number.isNaN(startMs) && startMs > now.getTime()) {
      return false
    }
  }

  const entitlements = normalizeEntitlements(
    pkg?.entitlements ?? subscription?.entitlementsSnapshot,
  )
  return Boolean(entitlements[key])
}

/** True when the subscriber may access ANY of the given entitlement keys. */
export function canAccessAnyPackageEntitlement(
  subscription: SubscriberSubscription | null | undefined,
  pkg: SubscriptionPackage | null | undefined,
  keys: PackageEntitlementKey | PackageEntitlementKey[],
  now: Date = new Date(),
): boolean {
  const list = Array.isArray(keys) ? keys : [keys]
  return list.some((key) =>
    canAccessPackageEntitlement(subscription, pkg, key, now),
  )
}

/**
 * Filter subscriber nav by package entitlements.
 * Untagged items always stay visible; groups hide when all children are gated out.
 */
export function filterNavByEntitlement<
  T extends {
    entitlement?: PackageEntitlementKey | PackageEntitlementKey[]
    children?: T[]
    kind?: string
  },
>(
  items: T[],
  subscription: SubscriberSubscription | null | undefined,
  pkg: SubscriptionPackage | null | undefined,
): T[] {
  return items
    .map((item) => {
      if (item.kind === "divider") return item
      if (!item.children?.length) return item
      return {
        ...item,
        children: filterNavByEntitlement(item.children, subscription, pkg),
      }
    })
    .filter((item) => {
      if (item.kind === "divider") return true
      if (item.children) return item.children.length > 0
      if (!item.entitlement) return true
      return canAccessAnyPackageEntitlement(subscription, pkg, item.entitlement)
    })
}

/**
 * Computes an ISO end date given a start date and package duration in days.
 */
export function computeEndsAtIso(startsAtIso: string, durationDays: number): string {
  const start = new Date(startsAtIso)
  const base = Number.isNaN(start.getTime()) ? new Date() : start
  const end = new Date(base.getTime() + Math.max(1, durationDays) * 86_400_000)
  return end.toISOString()
}

