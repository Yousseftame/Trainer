/**
 * Compatibility shim — demo package/subscription seed data removed.
 * Prefer Firestore services + `@/features/subscriptions/cache` helpers.
 */
export type { PackageTone } from "@/types/subscription"
export type { CatalogPackage, DemoPackage } from "@/features/subscriptions/types"
export {
  getPackageById,
  subscriptionsFor,
  currentSubscriptionFor,
  activeSubscribersForPackage,
  getActiveSubscriptionFor,
} from "@/features/subscriptions/cache"

/** @deprecated Empty — live data comes from Firestore */
export const DEMO_PACKAGES: import("@/features/subscriptions/types").CatalogPackage[] =
  []

/** @deprecated Empty — live data comes from Firestore */
export const DEMO_SUBSCRIPTIONS: import("@/types/subscription").SubscriberSubscription[] =
  []
