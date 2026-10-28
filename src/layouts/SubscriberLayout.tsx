import { DashboardShell } from "@/components/dashboard/DashboardShell"
import { subscriberNav } from "@/config/navigation"
import { APP_ROUTES } from "@/config/constants"

export function SubscriberLayout() {
  return (
    <DashboardShell
      area="subscriber"
      items={subscriberNav}
      homeTo={APP_ROUTES.subscriber.root}
    />
  )
}
