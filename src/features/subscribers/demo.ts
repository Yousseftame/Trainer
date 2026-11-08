/**
 * Compatibility shim — demo subscriber seed data removed.
 * Prefer `@/features/subscribers/types` and live Firestore queries.
 */
export type {
  Subscriber as DemoSubscriber,
  SubscriberRow,
} from "@/features/subscribers/types"
export {
  subscriberDisplayName,
  isFirebaseAuthUid,
} from "@/features/subscribers/types"
export { buildSubscriberRow as subscriberRow } from "@/features/subscribers/service"
export {
  fetchSubscriberById,
  fetchSubscriberByEmail,
} from "@/features/subscribers/service"

import type { Subscriber } from "@/features/subscribers/types"

/** @deprecated Empty — use useSubscribersQuery / fetchSubscribers */
export const DEMO_SUBSCRIBERS: Subscriber[] = []

/** @deprecated Use fetchSubscriberById (async) */
export function getSubscriberById(_id: string): Subscriber | undefined {
  return undefined
}

/** @deprecated Use fetchSubscriberByEmail (async) */
export function getSubscriberByEmail(_email: string): Subscriber | undefined {
  return undefined
}
