import type { Permission } from "@/lib/permissions/permissions"
import { APP_ROUTES } from "@/config/constants"

export type NavItem = {
  labelKey: string
  to: string
  /** If set, item is shown only when the user has this permission */
  permission?: Permission
}

export const adminNav: NavItem[] = [
  { labelKey: "nav.overview", to: APP_ROUTES.admin.overview, permission: "reports:read" },
  { labelKey: "nav.subscribers", to: APP_ROUTES.admin.subscribers, permission: "subscribers:read" },
  {
    labelKey: "nav.registrationRequests",
    to: APP_ROUTES.admin.registrationRequests,
    permission: "subscribers:approve",
  },
  { labelKey: "nav.packages", to: APP_ROUTES.admin.packages, permission: "packages:manage" },
  {
    labelKey: "nav.subscriptions",
    to: APP_ROUTES.admin.subscriptions,
    permission: "subscriptions:manage",
  },
  { labelKey: "nav.workouts", to: APP_ROUTES.admin.workouts, permission: "workouts:manage" },
  { labelKey: "nav.nutrition", to: APP_ROUTES.admin.nutrition, permission: "nutrition:manage" },
  { labelKey: "nav.content", to: APP_ROUTES.admin.content, permission: "content:manage" },
  { labelKey: "nav.progress", to: APP_ROUTES.admin.progress, permission: "progress:read" },
  { labelKey: "nav.staff", to: APP_ROUTES.admin.staff, permission: "staff:manage" },
  { labelKey: "nav.reports", to: APP_ROUTES.admin.reports, permission: "reports:read" },
]

export const subscriberNav: NavItem[] = [
  { labelKey: "nav.overview", to: APP_ROUTES.subscriber.overview },
  { labelKey: "nav.workout", to: APP_ROUTES.subscriber.workout },
  { labelKey: "nav.nutrition", to: APP_ROUTES.subscriber.nutrition },
  { labelKey: "nav.library", to: APP_ROUTES.subscriber.library },
  { labelKey: "nav.workoutLog", to: APP_ROUTES.subscriber.workoutLog },
  { labelKey: "nav.nutritionLog", to: APP_ROUTES.subscriber.nutritionLog },
  { labelKey: "nav.progress", to: APP_ROUTES.subscriber.progress },
  { labelKey: "nav.history", to: APP_ROUTES.subscriber.history },
  { labelKey: "nav.subscription", to: APP_ROUTES.subscriber.subscription },
  { labelKey: "nav.profile", to: APP_ROUTES.subscriber.profile },
]

export const publicNav: NavItem[] = [
  { labelKey: "nav.home", to: APP_ROUTES.public.home },
  { labelKey: "nav.about", to: APP_ROUTES.public.about },
  { labelKey: "nav.services", to: APP_ROUTES.public.services },
  { labelKey: "nav.contact", to: APP_ROUTES.public.contact },
]
