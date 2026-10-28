import { DashboardShell } from "@/components/dashboard/DashboardShell"
import { adminNav } from "@/config/navigation"
import { APP_ROUTES } from "@/config/constants"
import { useAuth } from "@/features/auth/auth-context"
import { filterByPermission } from "@/lib/permissions/can"

export function AdminLayout() {
  const { user } = useAuth()
  const items = filterByPermission(user, adminNav)

  return (
    <DashboardShell
      area="admin"
      items={items}
      homeTo={APP_ROUTES.admin.root}
    />
  )
}
