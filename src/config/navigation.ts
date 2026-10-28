import type { LucideIcon } from "lucide-react"
import {
  Apple,
  BarChart3,
  ClipboardList,
  CreditCard,
  Dumbbell,
  History,
  LayoutDashboard,
  Library,
  NotebookPen,
  Package,
  Shield,
  TrendingUp,
  User,
  UserPlus,
  Users,
} from "lucide-react"
import type { Permission } from "@/lib/permissions/permissions"
import { APP_ROUTES } from "@/config/constants"

export type NavItem = {
  labelKey: string
  to: string
  icon: LucideIcon
  /** If set, item is shown only when the user has this permission */
  permission?: Permission
  /** Nested links shown under an expandable group */
  children?: NavItem[]
}

export const adminNav: NavItem[] = [
  {
    labelKey: "nav.overview",
    to: APP_ROUTES.admin.overview,
    icon: LayoutDashboard,
    permission: "reports:read",
  },
  {
    labelKey: "nav.peopleSection",
    to: APP_ROUTES.admin.subscribers,
    icon: Users,
    children: [
      {
        labelKey: "nav.subscribers",
        to: APP_ROUTES.admin.subscribers,
        icon: Users,
        permission: "subscribers:read",
      },
      {
        labelKey: "nav.registrationRequests",
        to: APP_ROUTES.admin.registrationRequests,
        icon: UserPlus,
        permission: "subscribers:approve",
      },
    ],
  },
  {
    labelKey: "nav.billingSection",
    to: APP_ROUTES.admin.packages,
    icon: Package,
    children: [
      {
        labelKey: "nav.packages",
        to: APP_ROUTES.admin.packages,
        icon: Package,
        permission: "packages:manage",
      },
      {
        labelKey: "nav.subscriptions",
        to: APP_ROUTES.admin.subscriptions,
        icon: CreditCard,
        permission: "subscriptions:manage",
      },
    ],
  },
  {
    labelKey: "nav.workouts",
    to: APP_ROUTES.admin.workouts,
    icon: Dumbbell,
    permission: "workouts:manage",
  },
  {
    labelKey: "nav.nutrition",
    to: APP_ROUTES.admin.nutrition,
    icon: Apple,
    permission: "nutrition:manage",
  },
  {
    labelKey: "nav.content",
    to: APP_ROUTES.admin.content,
    icon: Library,
    permission: "content:manage",
  },
  {
    labelKey: "nav.progress",
    to: APP_ROUTES.admin.progress,
    icon: TrendingUp,
    permission: "progress:read",
  },
  {
    labelKey: "nav.staff",
    to: APP_ROUTES.admin.staff,
    icon: Shield,
    permission: "staff:manage",
  },
  {
    labelKey: "nav.reports",
    to: APP_ROUTES.admin.reports,
    icon: BarChart3,
    permission: "reports:read",
  },
]

export const subscriberNav: NavItem[] = [
  { labelKey: "nav.overview", to: APP_ROUTES.subscriber.overview, icon: LayoutDashboard },
  {
    labelKey: "nav.workoutSection",
    to: APP_ROUTES.subscriber.workout,
    icon: Dumbbell,
    children: [
      {
        labelKey: "nav.workoutPlan",
        to: APP_ROUTES.subscriber.workout,
        icon: Dumbbell,
      },
      {
        labelKey: "nav.workoutLog",
        to: APP_ROUTES.subscriber.workoutLog,
        icon: ClipboardList,
      },
    ],
  },
  {
    labelKey: "nav.nutritionSection",
    to: APP_ROUTES.subscriber.nutrition,
    icon: Apple,
    children: [
      {
        labelKey: "nav.nutritionPlan",
        to: APP_ROUTES.subscriber.nutrition,
        icon: Apple,
      },
      {
        labelKey: "nav.nutritionLog",
        to: APP_ROUTES.subscriber.nutritionLog,
        icon: NotebookPen,
      },
    ],
  },
  { labelKey: "nav.library", to: APP_ROUTES.subscriber.library, icon: Library },
  { labelKey: "nav.progress", to: APP_ROUTES.subscriber.progress, icon: TrendingUp },
  { labelKey: "nav.history", to: APP_ROUTES.subscriber.history, icon: History },
  { labelKey: "nav.subscription", to: APP_ROUTES.subscriber.subscription, icon: CreditCard },
  { labelKey: "nav.profile", to: APP_ROUTES.subscriber.profile, icon: User },
]

export const publicNav: Array<Omit<NavItem, "icon" | "children">> = [
  { labelKey: "nav.home", to: APP_ROUTES.public.home },
  { labelKey: "nav.about", to: APP_ROUTES.public.about },
  { labelKey: "nav.services", to: APP_ROUTES.public.services },
  { labelKey: "nav.packages", to: APP_ROUTES.public.packages },
  { labelKey: "nav.contact", to: APP_ROUTES.public.contact },
]

/** Leaf links only — used for page titles and active matching. */
export function flattenNavItems(items: NavItem[]): NavItem[] {
  return items.flatMap((item) =>
    item.children?.length ? item.children : [item],
  )
}
