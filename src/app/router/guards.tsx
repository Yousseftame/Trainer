import { useMemo } from "react"
import { Navigate, Outlet, useLocation } from "react-router-dom"
import { useAuth } from "@/features/auth/auth-context"
import { hasLiveFirebaseSession } from "@/features/auth/session"
import {
  usePackageByIdQuery,
  useSubscriberSubscriptionsQuery,
} from "@/features/subscriptions/hooks"
import { canAccessPackageEntitlement } from "@/features/subscriptions/entitlements"
import { FullPageSpinner } from "@/components/feedback/FullPageSpinner"
import { APP_ROUTES } from "@/config/constants"
import {
  resolveAdminHomePath,
  resolveAdminLandingPath,
} from "@/lib/permissions/can"
import type { Permission } from "@/lib/permissions/permissions"
import type {
  PackageEntitlementKey,
  SubscriberSubscription,
} from "@/types/subscription"

function pickCurrentSubscription(
  list: SubscriberSubscription[] | undefined,
): SubscriberSubscription | null {
  if (!list?.length) return null
  return (
    list.find((item) => item.status === "active" || item.status === "suspended") ??
    list[0] ??
    null
  )
}

export function RequireAuth() {
  const { status, user } = useAuth()
  const location = useLocation()
  const live = hasLiveFirebaseSession()

  if (status === "loading" || status === "idle") {
    return <FullPageSpinner />
  }

  if (status !== "authenticated" || !user || !live) {
    return <Navigate to={APP_ROUTES.public.login} replace state={{ from: location }} />
  }

  return <Outlet />
}

type RequireRoleProps = {
  allowed: Array<"admin" | "subscriber">
}

export function RequireRole({ allowed }: RequireRoleProps) {
  const { isAdmin, isSubscriber, user, status } = useAuth()
  const live = hasLiveFirebaseSession()

  if (status === "loading" || status === "idle") {
    return <FullPageSpinner />
  }

  if (!live || !user || status !== "authenticated") {
    return <Navigate to={APP_ROUTES.public.login} replace />
  }

  // Strict panel isolation: admin ↔ subscriber never share routes
  const ok =
    (allowed.includes("admin") && isAdmin) ||
    (allowed.includes("subscriber") && isSubscriber)

  if (!ok) {
    if (isAdmin) {
      return <Navigate to={resolveAdminLandingPath(user)} replace />
    }
    if (isSubscriber) {
      return <Navigate to={APP_ROUTES.subscriber.root} replace />
    }
    return <Navigate to={APP_ROUTES.public.login} replace />
  }

  return <Outlet />
}

/** Login / forgot-password: signed-in users go to their appropriate panel based on role. */
export function RequireGuest() {
  const { status, user, isAdmin, isSubscriber } = useAuth()
  const live = hasLiveFirebaseSession()

  if (status === "loading" || status === "idle") {
    return <FullPageSpinner />
  }

  if (status === "authenticated" && user && live) {
    if (isSubscriber && !isAdmin) {
      return <Navigate to={APP_ROUTES.subscriber.root} replace />
    }
    return <Navigate to={resolveAdminLandingPath(user)} replace />
  }

  return <Outlet />
}

type RequirePermissionProps = {
  permission: Permission
}

export function RequirePermission({ permission }: RequirePermissionProps) {
  const { hasPermission, isSubscriber, isAdmin, status, user } = useAuth()
  const location = useLocation()

  // Wait for claims — avoid flashing a page then bouncing away.
  if (status === "loading" || status === "idle") {
    return <FullPageSpinner />
  }

  if (!hasLiveFirebaseSession()) {
    return <Navigate to={APP_ROUTES.public.login} replace />
  }

  // Subscribers never belong on /admin
  if (isSubscriber) {
    return <Navigate to={APP_ROUTES.subscriber.root} replace />
  }

  // Non-admin identities should not linger on admin permission gates
  if (!isAdmin) {
    return <Navigate to={APP_ROUTES.public.login} replace />
  }

  if (!hasPermission(permission)) {
    const home = resolveAdminHomePath(user)
    const fallback = APP_ROUTES.admin.root
    const target = home && home !== location.pathname ? home : fallback
    // Stay inside the admin shell — never dump staff on /unauthorized.
    if (target === location.pathname) {
      return <Navigate to={fallback} replace />
    }
    return <Navigate to={target} replace />
  }

  return <Outlet />
}

/**
 * Entitlement gate for subscriber content areas.
 * Authentication and role checks remain separate upstream.
 */
export function RequireActiveSubscription() {
  const { hasActiveSubscription, isAdmin, user, subscriptionLoading } =
    useAuth()

  // Admins never belong on /app — bounce them home
  if (isAdmin) {
    return <Navigate to={resolveAdminLandingPath(user)} replace />
  }

  if (subscriptionLoading) {
    return <FullPageSpinner />
  }

  if (!hasActiveSubscription) {
    return <Navigate to={APP_ROUTES.errors.subscriptionExpired} replace />
  }

  return <Outlet />
}

/**
 * Package-level content access gate.
 * Uses live Firestore subscription + package data (never the empty in-memory cache).
 */
export function RequirePackageEntitlement({
  entitlement,
}: {
  entitlement: PackageEntitlementKey | PackageEntitlementKey[]
}) {
  const {
    isAdmin,
    user,
    hasActiveSubscription,
    status,
    subscriptionLoading,
  } = useAuth()
  const subscriberId = user?.uid

  const {
    data: subscriptions,
    isPending: subscriptionsPending,
    isError: subscriptionsError,
  } = useSubscriberSubscriptionsQuery(
    !isAdmin && status === "authenticated" ? subscriberId : undefined,
  )

  const sub = useMemo(
    () => pickCurrentSubscription(subscriptions),
    [subscriptions],
  )

  const { data: pkg, isPending: packagePending } = usePackageByIdQuery(
    sub?.packageId,
  )

  if (status === "loading" || status === "idle") {
    return <FullPageSpinner />
  }

  if (isAdmin) {
    return <Navigate to={resolveAdminLandingPath(user)} replace />
  }

  if (subscriptionLoading || subscriptionsPending) {
    return <FullPageSpinner />
  }

  if (!hasActiveSubscription || !user) {
    return <Navigate to={APP_ROUTES.errors.subscriptionExpired} replace />
  }

  // Wait for package doc when the subscription references one.
  if (sub?.packageId && packagePending && !pkg) {
    return <FullPageSpinner />
  }

  if (subscriptionsError) {
    return <Navigate to={APP_ROUTES.subscriber.subscription} replace />
  }

  const keys = Array.isArray(entitlement) ? entitlement : [entitlement]
  // Prefer package entitlements; fall back to subscription snapshot / defaults.
  const hasAny = keys.some((k) =>
    canAccessPackageEntitlement(sub, pkg ?? undefined, k),
  )

  if (!hasAny) {
    return <Navigate to={APP_ROUTES.subscriber.subscription} replace />
  }

  return <Outlet />
}
