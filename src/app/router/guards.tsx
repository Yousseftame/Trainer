import { Navigate, Outlet, useLocation } from "react-router-dom"
import { useAuth } from "@/features/auth/auth-context"
import { FullPageSpinner } from "@/components/feedback/FullPageSpinner"
import { APP_ROUTES } from "@/config/constants"
import type { Permission } from "@/lib/permissions/permissions"

export function RequireAuth() {
  const { status, user } = useAuth()
  const location = useLocation()

  if (status === "loading" || status === "idle") {
    return <FullPageSpinner />
  }

  // Firebase session exists but profile/claims not hydrated yet
  if (status === "authenticated" && !user) {
    return <FullPageSpinner />
  }

  if (status !== "authenticated" || !user) {
    return <Navigate to={APP_ROUTES.public.login} replace state={{ from: location }} />
  }

  return <Outlet />
}

type RequireRoleProps = {
  allowed: Array<"admin" | "subscriber">
}

export function RequireRole({ allowed }: RequireRoleProps) {
  const { isAdmin, isSubscriber, user } = useAuth()

  const ok =
    (allowed.includes("admin") && isAdmin) || (allowed.includes("subscriber") && isSubscriber)

  if (!ok || !user) {
    return <Navigate to={APP_ROUTES.errors.unauthorized} replace />
  }

  return <Outlet />
}

type RequirePermissionProps = {
  permission: Permission
}

export function RequirePermission({ permission }: RequirePermissionProps) {
  const { hasPermission } = useAuth()

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
  const { isAdmin, hasActiveSubscription } = useAuth()

  if (isAdmin) {
    return <Outlet />
  }

  if (!hasActiveSubscription) {
    return <Navigate to={APP_ROUTES.errors.subscriptionExpired} replace />
  }

  return <Outlet />
}
