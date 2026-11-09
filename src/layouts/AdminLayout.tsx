import { useMemo } from "react"
import { DashboardShell } from "@/components/dashboard/DashboardShell"
import { adminNav } from "@/config/navigation"
import { APP_ROUTES } from "@/config/constants"
import { useAuth } from "@/features/auth/auth-context"
import { useAdminNotificationsBridge } from "@/features/reports"
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

  const { badgeCount } = useAdminNotificationsBridge({
    enabled: canListen,
    locale,
  })

  const badgeByTo = useMemo(() => {
    if (!badgeCount) return undefined
    return { [APP_ROUTES.admin.reports]: badgeCount }
  }, [badgeCount])

  return (
    <DashboardShell
      area="admin"
      items={items}
      homeTo={homeTo}
      badgeByTo={badgeByTo}
    />
  )
}
