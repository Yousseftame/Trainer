import type { LucideIcon } from "lucide-react"
import {
  Activity,
  Apple,
  Award,
  BarChart3,
  BookOpen,
  ClipboardList,
  CreditCard,
  Dumbbell,
  Globe2,
  HelpCircle,
  History,
  ImageIcon,
  LayoutDashboard,
  Library,
  MessageSquareQuote,
  MonitorPlay,
  NotebookPen,
  Package,
  Shield,
  Sparkles,
  Target,
  TrendingUp,
  User,
  UserPlus,
  Users,
  Video,
} from "lucide-react"
import type { Permission } from "@/lib/permissions/permissions"
import type { PackageEntitlementKey } from "@/types/subscription"
import { APP_ROUTES } from "@/config/constants"

export type NavItem = {
  labelKey: string
  to: string
  icon: LucideIcon
  /** If set, item is shown only when the user has this permission */
  permission?: Permission
  /**
   * Subscriber package entitlement gate.
   * Array = show when the subscriber has ANY of the listed keys.
   */
  entitlement?: PackageEntitlementKey | PackageEntitlementKey[]
  /** Nested links shown under an expandable group */
  children?: NavItem[]
  /** Non-clickable sidebar note / separator for content modules */
  kind?: "divider"
}

export const adminNav: NavItem[] = [
  {
    labelKey: "nav.overview",
    to: APP_ROUTES.admin.overview,
    icon: LayoutDashboard,
    permission: "overview:read",
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
    permission: "workouts:read",
  },
  {
    labelKey: "nav.nutrition",
    to: APP_ROUTES.admin.nutrition,
    icon: Apple,
    permission: "nutrition:read",
  },
  {
    labelKey: "nav.content",
    to: APP_ROUTES.admin.content,
    icon: Library,
    permission: "content:read",
  },
  {
    labelKey: "nav.progress",
    to: APP_ROUTES.admin.progress,
    icon: TrendingUp,
    permission: "progress:read",
  },
  {
    labelKey: "nav.physicalTherapy",
    to: APP_ROUTES.admin.physicalTherapy,
    icon: Activity,
    permission: "physicalTherapy:read",
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

  // —— Public website content (CMS) ——
  {
    kind: "divider",
    labelKey: "nav.websiteContentNote",
    to: "__website_content_divider__",
    icon: Globe2,
    permission: "content:read",
  },
  {
    labelKey: "nav.websiteHomeSection",
    to: APP_ROUTES.admin.website.homeHero,
    icon: MonitorPlay,
    children: [
      {
        labelKey: "nav.websiteHomeHero",
        to: APP_ROUTES.admin.website.homeHero,
        icon: MonitorPlay,
        permission: "content:read",
      },
      {
        labelKey: "nav.websiteHomeTrustedPartners",
        to: APP_ROUTES.admin.website.homeTrustedPartners,
        icon: Users,
        permission: "content:read",
      },
      {
        labelKey: "nav.websiteHomeWhoIAm",
        to: APP_ROUTES.admin.website.homeWhoIAm,
        icon: User,
        permission: "content:read",
      },
      {
        labelKey: "nav.websiteHomeFitnessDream",
        to: APP_ROUTES.admin.website.homeFitnessDream,
        icon: Sparkles,
        permission: "content:read",
      },
      {
        labelKey: "nav.websiteHomeCoachingApp",
        to: APP_ROUTES.admin.website.homeCoachingApp,
        icon: Package,
        permission: "content:read",
      },
      {
        labelKey: "nav.websiteHomeVideoBanner",
        to: APP_ROUTES.admin.website.homeVideoBanner,
        icon: Video,
        permission: "content:read",
      },
      {
        labelKey: "nav.websiteHomeTestimonials",
        to: APP_ROUTES.admin.website.homeTestimonials,
        icon: MessageSquareQuote,
        permission: "content:read",
      },
      {
        labelKey: "nav.websiteHomeGoalsBanner",
        to: APP_ROUTES.admin.website.homeGoalsBanner,
        icon: Target,
        permission: "content:read",
      },
    ],
  },
  {
    labelKey: "nav.websiteAboutSection",
    to: APP_ROUTES.admin.website.aboutHero,
    icon: BookOpen,
    children: [
      {
        labelKey: "nav.websiteAboutHero",
        to: APP_ROUTES.admin.website.aboutHero,
        icon: MonitorPlay,
        permission: "content:read",
      },
      {
        labelKey: "nav.websiteAboutMyStory",
        to: APP_ROUTES.admin.website.aboutMyStory,
        icon: BookOpen,
        permission: "content:read",
      },
      {
        labelKey: "nav.websiteAboutHowICoach",
        to: APP_ROUTES.admin.website.aboutHowICoach,
        icon: Dumbbell,
        permission: "content:read",
      },
      {
        labelKey: "nav.websiteAboutWhoIHelp",
        to: APP_ROUTES.admin.website.aboutWhoIHelp,
        icon: Users,
        permission: "content:read",
      },
      {
        labelKey: "nav.websiteAboutCertifications",
        to: APP_ROUTES.admin.website.aboutCertifications,
        icon: Award,
        permission: "content:read",
      },
      {
        labelKey: "nav.websiteAboutClosingBanner",
        to: APP_ROUTES.admin.website.aboutClosingBanner,
        icon: ImageIcon,
        permission: "content:read",
      },
    ],
  },
  {
    labelKey: "nav.websiteCommonSection",
    to: APP_ROUTES.admin.website.commonFaq,
    icon: Globe2,
    children: [
      {
        labelKey: "nav.websiteCommonFaq",
        to: APP_ROUTES.admin.website.commonFaq,
        icon: HelpCircle,
        permission: "content:read",
      },
      {
        labelKey: "nav.websiteCommonTransformations",
        to: APP_ROUTES.admin.website.commonTransformations,
        icon: ImageIcon,
        permission: "content:read",
      },
      {
        labelKey: "nav.websiteCommonFooter",
        to: APP_ROUTES.admin.website.commonFooter,
        icon: LayoutDashboard,
        permission: "content:read",
      },
    ],
  },
]

export const subscriberNav: NavItem[] = [
  { labelKey: "nav.overview", to: APP_ROUTES.subscriber.overview, icon: LayoutDashboard },
  { labelKey: "nav.community", to: APP_ROUTES.subscriber.community, icon: Users },
  {
    labelKey: "nav.workoutSection",
    to: APP_ROUTES.subscriber.workout,
    icon: Dumbbell,
    entitlement: "workoutProgram",
    children: [
      {
        labelKey: "nav.workoutPlan",
        to: APP_ROUTES.subscriber.workout,
        icon: Dumbbell,
        entitlement: "workoutProgram",
      },
      {
        labelKey: "nav.workoutLog",
        to: APP_ROUTES.subscriber.workoutLog,
        icon: ClipboardList,
        entitlement: "workoutProgram",
      },
    ],
  },
  {
    labelKey: "nav.nutritionSection",
    to: APP_ROUTES.subscriber.nutrition,
    icon: Apple,
    entitlement: "nutritionProgram",
    children: [
      {
        labelKey: "nav.nutritionPlan",
        to: APP_ROUTES.subscriber.nutrition,
        icon: Apple,
        entitlement: "nutritionProgram",
      },
      {
        labelKey: "nav.nutritionLog",
        to: APP_ROUTES.subscriber.nutritionLog,
        icon: NotebookPen,
        entitlement: "nutritionProgram",
      },
    ],
  },
  {
    labelKey: "nav.library",
    to: APP_ROUTES.subscriber.library,
    icon: Library,
    entitlement: [
      "pdfDocuments",
      "exerciseVideos",
      "workoutProgram",
      "nutritionProgram",
    ],
  },
  {
    labelKey: "nav.progress",
    to: APP_ROUTES.subscriber.progress,
    icon: TrendingUp,
    entitlement: "progressTracking",
  },
  {
    labelKey: "nav.physicalTherapy",
    to: APP_ROUTES.subscriber.physicalTherapy,
    icon: Activity,
    entitlement: "physicalTherapy",
  },
  { labelKey: "nav.history", to: APP_ROUTES.subscriber.history, icon: History },
  { labelKey: "nav.subscription", to: APP_ROUTES.subscriber.subscription, icon: CreditCard },
  { labelKey: "nav.profile", to: APP_ROUTES.subscriber.profile, icon: User },
]

export const publicNav: Array<Omit<NavItem, "icon" | "children" | "kind">> = [
  { labelKey: "nav.home", to: APP_ROUTES.public.home },
  { labelKey: "nav.about", to: APP_ROUTES.public.about },
  { labelKey: "nav.services", to: APP_ROUTES.public.services },
  { labelKey: "nav.packages", to: APP_ROUTES.public.packages },
  { labelKey: "nav.contact", to: APP_ROUTES.public.contact },
]

/** Leaf links only — used for page titles and active matching. */
export function flattenNavItems(items: NavItem[]): NavItem[] {
  return items.flatMap((item) => {
    if (item.kind === "divider") return []
    return item.children?.length ? item.children : [item]
  })
}
