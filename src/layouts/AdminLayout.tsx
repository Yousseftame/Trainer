import { useMemo } from "react"
import { DashboardShell } from "@/components/dashboard/DashboardShell"
import { adminNav } from "@/config/navigation"
import { APP_ROUTES } from "@/config/constants"
import { useAuth } from "@/features/auth/auth-context"
import { useAdminNotificationsBridge } from "@/features/reports"
import { usePendingRegistrationRequestCount } from "@/features/subscribers/hooks"
import { usePendingChangeRequestCount } from "@/features/subscriptions/hooks"
import { usePendingMealChangeRequestsQuery } from "@/features/nutrition/hooks"
import { usePendingExerciseChangeRequestsQuery } from "@/features/workouts/hooks"
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
  const canViewWorkouts =
    hasPermission("workouts:read") || hasPermission("workouts:manage")
  const canViewNutrition =
    hasPermission("nutrition:read") || hasPermission("nutrition:manage")

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
  const { data: pendingExerciseChanges = [] } =
    usePendingExerciseChangeRequestsQuery({ enabled: canViewWorkouts })
  const { data: pendingMealChanges = [] } = usePendingMealChangeRequestsQuery({
    enabled: canViewNutrition,
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
    if (pendingExerciseChanges.length) {
      map[APP_ROUTES.admin.workouts] = pendingExerciseChanges.length
    }
    if (pendingMealChanges.length) {
      map[APP_ROUTES.admin.nutrition] = pendingMealChanges.length
    }
    return Object.keys(map).length ? map : undefined
  }, [
    badgeCount,
    pendingRegistrations,
    pendingPackageChanges,
    pendingExerciseChanges.length,
    pendingMealChanges.length,
  ])

  return (
    <DashboardShell
      area="admin"
      items={items}
      homeTo={homeTo}
      badgeByTo={badgeByTo}
    />
  )
}
