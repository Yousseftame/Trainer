import { Navigate, Outlet, useLocation } from "react-router-dom"
import { useAuth } from "@/features/auth/auth-context"
import { hasLiveFirebaseSession } from "@/features/auth/session"
import { currentSubscriptionFor, getPackageById } from "@/features/subscriptions/demo"
import { canAccessPackageEntitlement } from "@/features/subscriptions/entitlements"
import { FullPageSpinner } from "@/components/feedback/FullPageSpinner"
import { APP_ROUTES } from "@/config/constants"
import type { Permission } from "@/lib/permissions/permissions"
import type { PackageEntitlementKey } from "@/types/subscription"

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
      return <Navigate to={APP_ROUTES.admin.root} replace />
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
    return <Navigate to={APP_ROUTES.admin.root} replace />
  }

  return <Outlet />
}

type RequirePermissionProps = {
  permission: Permission
}

export function RequirePermission({ permission }: RequirePermissionProps) {
  const { hasPermission, isSubscriber, isAdmin } = useAuth()
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
    return <Navigate to={APP_ROUTES.errors.unauthorized} replace />
  }

  return <Outlet />
}

/**
 * Entitlement gate for subscriber content areas.
 * Authentication and role checks remain separate upstream.
 */
export function RequireActiveSubscription() {
  const { hasActiveSubscription, isAdmin } = useAuth()

  // Admins never belong on /app — bounce them home
  if (isAdmin) {
    return <Navigate to={APP_ROUTES.admin.root} replace />
  }

  if (!hasActiveSubscription) {
    return <Navigate to={APP_ROUTES.errors.subscriptionExpired} replace />
  }

  return <Outlet />
}

/**
 * Package-level content access gate.
 * Enforces that the subscriber's active package grants the required content entitlement.
 */
export function RequirePackageEntitlement({
  entitlement,
}: {
  entitlement: PackageEntitlementKey | PackageEntitlementKey[]
}) {
  const { isAdmin, user, hasActiveSubscription } = useAuth()

  if (isAdmin) {
    return <Navigate to={APP_ROUTES.admin.root} replace />
  }

  if (!hasActiveSubscription || !user) {
    return <Navigate to={APP_ROUTES.errors.subscriptionExpired} replace />
  }

  const sub =
    currentSubscriptionFor(user.uid) ||
    (user.email ? currentSubscriptionFor(user.email) : null)
  const pkg = getPackageById(sub?.packageId)

  const keys = Array.isArray(entitlement) ? entitlement : [entitlement]
  const hasAny = keys.some((k) => canAccessPackageEntitlement(sub, pkg, k))

  if (!hasAny) {
    return <Navigate to={APP_ROUTES.subscriber.subscription} replace />
  }

  return <Outlet />
}
