import { useCallback, useMemo } from "react"
import { useAuth } from "@/features/auth/auth-context"
import {
  canAccessAnyPackageEntitlement,
  filterNavByEntitlement,
  pickCurrentSubscription,
} from "@/features/subscriptions/entitlements"
import {
  usePackageByIdQuery,
  useSubscriberSubscriptionsQuery,
} from "@/features/subscriptions/hooks"
import { subscriberNav, type NavItem } from "@/config/navigation"
import type { PackageEntitlementKey } from "@/types/subscription"

/**
 * Live package entitlement access for the signed-in subscriber.
 * Same data path as RequirePackageEntitlement route guards.
 *
 * Until subscription + package entitlements are resolved, gated modules stay
 * hidden (fail closed) so the sidebar never flashes ungated items.
 */
export function useSubscriberEntitlementAccess() {
  const { user, isAdmin, status } = useAuth()
  const subscriberId = user?.uid

  const { data: subscriptions, isPending: subscriptionsPending } =
    useSubscriberSubscriptionsQuery(
      !isAdmin && status === "authenticated" ? subscriberId : undefined,
    )

  const sub = useMemo(
    () => pickCurrentSubscription(subscriptions),
    [subscriptions],
  )

  const { data: pkg, isPending: packagePending } = usePackageByIdQuery(
    sub?.packageId,
  )

  const ready =
    isAdmin ||
    status !== "authenticated" ||
    (!subscriptionsPending && !(sub?.packageId && packagePending && !pkg))

  const navItems: NavItem[] = useMemo(() => {
    if (isAdmin) return subscriberNav
    // Fail closed while loading: treat as no subscription so entitlement-tagged
    // items stay hidden until the live package rules are known.
    if (!ready) {
      return filterNavByEntitlement(subscriberNav, null, undefined)
    }
    return filterNavByEntitlement(subscriberNav, sub, pkg ?? undefined)
  }, [isAdmin, ready, sub, pkg])

  const canAccess = useCallback(
    (key: PackageEntitlementKey | PackageEntitlementKey[]): boolean => {
      if (isAdmin) return true
      if (!ready) return false
      return canAccessAnyPackageEntitlement(sub, pkg ?? undefined, key)
    },
    [isAdmin, ready, sub, pkg],
  )

  return {
    ready,
    subscription: sub,
    pkg: pkg ?? null,
    navItems,
    canAccess,
  }
}
