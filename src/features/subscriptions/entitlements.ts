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
  if (subscription.status === "active" && subscription.endsAt) {
    const endMs = new Date(subscription.endsAt).getTime()
    if (!Number.isNaN(endMs) && endMs < now.getTime()) {
      return "expired"
    }
  }
  return subscription.status
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

/**
 * Computes an ISO end date given a start date and package duration in days.
 */
export function computeEndsAtIso(startsAtIso: string, durationDays: number): string {
  const start = new Date(startsAtIso)
  const base = Number.isNaN(start.getTime()) ? new Date() : start
  const end = new Date(base.getTime() + Math.max(1, durationDays) * 86_400_000)
  return end.toISOString()
}

