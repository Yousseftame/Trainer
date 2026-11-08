import type {
  SubscriberSubscription,
  SubscriptionPackage,
} from "@/types/subscription"

/** In-memory catalog mirror filled by Firestore fetches (not demo seed). */
let packagesCache: SubscriptionPackage[] = []
let subscriptionsCache: SubscriberSubscription[] = []

export function setPackagesCache(next: SubscriptionPackage[]) {
  packagesCache = [...next].sort((a, b) => a.sortOrder - b.sortOrder)
  return packagesCache
}

export function getPackagesCache() {
  return packagesCache
}

export function setSubscriptionsCache(next: SubscriberSubscription[]) {
  subscriptionsCache = [...next].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  )
  return subscriptionsCache
}

export function getSubscriptionsCache() {
  return subscriptionsCache
}

export function getPackageById(id: string | null | undefined) {
  if (!id) return undefined
  return packagesCache.find((item) => item.id === id)
}

export function activeSubscribersForPackage(packageId: string) {
  return subscriptionsCache.filter(
    (item) => item.packageId === packageId && item.status === "active",
  ).length
}

export function subscriptionsFor(
  subscriberIdOrEmail: string,
): SubscriberSubscription[] {
  const normalized = (subscriberIdOrEmail || "").trim().toLowerCase()
  if (!normalized) return []

  return subscriptionsCache
    .filter(
      (item) =>
        item.subscriberId === subscriberIdOrEmail ||
        (item.subscriberEmail &&
          item.subscriberEmail.trim().toLowerCase() === normalized),
    )
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    )
}

export function currentSubscriptionFor(
  subscriberIdOrEmail: string,
): SubscriberSubscription | null {
  const list = subscriptionsFor(subscriberIdOrEmail)
  return (
    list.find(
      (item) => item.status === "active" || item.status === "suspended",
    ) ??
    list[0] ??
    null
  )
}

export const getActiveSubscriptionFor = currentSubscriptionFor
