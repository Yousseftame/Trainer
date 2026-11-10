import { useMemo } from "react"
import { DashboardShell } from "@/components/dashboard/DashboardShell"
import { adminNav } from "@/config/navigation"
import { APP_ROUTES } from "@/config/constants"
import { useAuth } from "@/features/auth/auth-context"
import { useAdminNotificationsBridge } from "@/features/reports"
import { usePendingRegistrationRequestCount } from "@/features/subscribers/hooks"
import { usePendingChangeRequestCount } from "@/features/subscriptions/hooks"
import { useLocale } from "@/hooks/useLocale"
import {
  filterByPermission,
  resolveAdminLandingPath,
} from "@/lib/permissions/can"

export function AdminLayout() {
  const { user, hasPermission } = useAuth()
  const { locale } = useLocale()
  const items = filterByPermission(user, adminNav)
  const homeTo = resolveAdminLandingPath(user)

  const canListen =
    hasPermission("reports:read") || hasPermission("notifications:send")
  const canApprove = hasPermission("subscribers:approve")
  const canManageSubs = hasPermission("subscriptions:manage")

  const { badgeCount } = useAdminNotificationsBridge({
    enabled: canListen,
    locale,
  })
  const pendingRegistrations = usePendingRegistrationRequestCount({
    enabled: canApprove,
  })
  const pendingPackageChanges = usePendingChangeRequestCount({
    enabled: canManageSubs,
  })

  const badgeByTo = useMemo(() => {
    const map: Record<string, number> = {}
    if (badgeCount) map[APP_ROUTES.admin.reports] = badgeCount
    if (pendingRegistrations) {
      map[APP_ROUTES.admin.registrationRequests] = pendingRegistrations
    }
    if (pendingPackageChanges) {
      map[APP_ROUTES.admin.subscriptions] = pendingPackageChanges
    }
    return Object.keys(map).length ? map : undefined
  }, [badgeCount, pendingRegistrations, pendingPackageChanges])

  return (
    <DashboardShell
      area="admin"
      items={items}
      homeTo={homeTo}
      badgeByTo={badgeByTo}
    />
  )
}
