import { lazy } from "react"
import type { RouteObject } from "react-router-dom"
import { AdminLayout } from "@/layouts/AdminLayout"
import { RequireAuth, RequirePermission, RequireRole } from "@/app/router/guards"

const AdminEntryPage = lazy(() =>
  import("@/pages/admin/AdminEntryPage").then((m) => ({
    default: m.AdminEntryPage,
  })),
)
const SubscribersPage = lazy(() =>
  import("@/pages/admin/SubscribersPage").then((m) => ({ default: m.SubscribersPage })),
)
const SubscriberDetailPage = lazy(() =>
  import("@/pages/admin/SubscriberDetailPage").then((m) => ({ default: m.SubscriberDetailPage })),
)
const RegistrationRequestsPage = lazy(() =>
  import("@/pages/admin/RegistrationRequestsPage").then((m) => ({
    default: m.RegistrationRequestsPage,
  })),
)
const PackagesPage = lazy(() =>
  import("@/pages/admin/PackagesPage").then((m) => ({ default: m.PackagesPage })),
)
const SubscriptionsPage = lazy(() =>
  import("@/pages/admin/SubscriptionsPage").then((m) => ({ default: m.SubscriptionsPage })),
)
const WorkoutsPage = lazy(() =>
  import("@/pages/admin/WorkoutsPage").then((m) => ({ default: m.WorkoutsPage })),
)
const NutritionPage = lazy(() =>
  import("@/pages/admin/NutritionPage").then((m) => ({ default: m.NutritionPage })),
)
const ContentLibraryPage = lazy(() =>
  import("@/pages/admin/ContentLibraryPage").then((m) => ({ default: m.ContentLibraryPage })),
)
const ProgressPage = lazy(() =>
  import("@/pages/admin/ProgressPage").then((m) => ({ default: m.ProgressPage })),
)
const PhysicalTherapyPage = lazy(() =>
  import("@/pages/admin/PhysicalTherapyPage").then((m) => ({
    default: m.PhysicalTherapyPage,
  })),
)
const StaffPage = lazy(() =>
  import("@/pages/admin/StaffPage").then((m) => ({ default: m.StaffPage })),
)
const ReportsPage = lazy(() =>
  import("@/pages/admin/ReportsPage").then((m) => ({ default: m.ReportsPage })),
)

const HomeHeroPage = lazy(() =>
  import("@/pages/admin/website/HomeHeroPage").then((m) => ({
    default: m.HomeHeroPage,
  })),
)
const HomeTrustedPartnersPage = lazy(() =>
  import("@/pages/admin/website/HomeTrustedPartnersPage").then((m) => ({
    default: m.HomeTrustedPartnersPage,
  })),
)
const HomeWhoIAmPage = lazy(() =>
  import("@/pages/admin/website/HomeWhoIAmPage").then((m) => ({
    default: m.HomeWhoIAmPage,
  })),
)
const HomeFitnessDreamPage = lazy(() =>
  import("@/pages/admin/website/HomeFitnessDreamPage").then((m) => ({
    default: m.HomeFitnessDreamPage,
  })),
)
const HomeCoachingAppPage = lazy(() =>
  import("@/pages/admin/website/HomeCoachingAppPage").then((m) => ({
    default: m.HomeCoachingAppPage,
  })),
)
const HomeVideoBannerPage = lazy(() =>
  import("@/pages/admin/website/HomeVideoBannerPage").then((m) => ({
    default: m.HomeVideoBannerPage,
  })),
)
const HomeTestimonialsPage = lazy(() =>
  import("@/pages/admin/website/HomeTestimonialsPage").then((m) => ({
    default: m.HomeTestimonialsPage,
  })),
)
const HomeGoalsBannerPage = lazy(() =>
  import("@/pages/admin/website/HomeGoalsBannerPage").then((m) => ({
    default: m.HomeGoalsBannerPage,
  })),
)
const AboutHeroPage = lazy(() =>
  import("@/pages/admin/website/AboutHeroPage").then((m) => ({
    default: m.AboutHeroPage,
  })),
)
const AboutMyStoryPage = lazy(() =>
  import("@/pages/admin/website/AboutMyStoryPage").then((m) => ({
    default: m.AboutMyStoryPage,
  })),
)
const AboutHowICoachPage = lazy(() =>
  import("@/pages/admin/website/AboutHowICoachPage").then((m) => ({
    default: m.AboutHowICoachPage,
  })),
)
const AboutWhoIHelpPage = lazy(() =>
  import("@/pages/admin/website/AboutWhoIHelpPage").then((m) => ({
    default: m.AboutWhoIHelpPage,
  })),
)
const AboutCertificationsPage = lazy(() =>
  import("@/pages/admin/website/AboutCertificationsPage").then((m) => ({
    default: m.AboutCertificationsPage,
  })),
)
const AboutClosingBannerPage = lazy(() =>
  import("@/pages/admin/website/AboutClosingBannerPage").then((m) => ({
    default: m.AboutClosingBannerPage,
  })),
)
const CommonFaqPage = lazy(() =>
  import("@/pages/admin/website/CommonFaqPage").then((m) => ({
    default: m.CommonFaqPage,
  })),
)
const CommonTransformationsPage = lazy(() =>
  import("@/pages/admin/website/CommonTransformationsPage").then((m) => ({
    default: m.CommonTransformationsPage,
  })),
)
const CommonFooterPage = lazy(() =>
  import("@/pages/admin/website/CommonFooterPage").then((m) => ({
    default: m.CommonFooterPage,
  })),
)

export const adminRoutes: RouteObject[] = [
  {
    path: "admin",
    element: <RequireAuth />,
    children: [
      {
        element: <RequireRole allowed={["admin"]} />,
        children: [
          {
            element: <AdminLayout />,
            children: [
              { index: true, element: <AdminEntryPage /> },
              {
                element: <RequirePermission permission="subscribers:read" />,
                children: [
                  { path: "subscribers", element: <SubscribersPage /> },
                  { path: "subscribers/:subscriberId", element: <SubscriberDetailPage /> },
                ],
              },
              {
                element: <RequirePermission permission="subscribers:approve" />,
                children: [
                  { path: "registration-requests", element: <RegistrationRequestsPage /> },
                ],
              },
              {
                element: <RequirePermission permission="packages:manage" />,
                children: [{ path: "packages", element: <PackagesPage /> }],
              },
              {
                element: <RequirePermission permission="subscriptions:manage" />,
                children: [{ path: "subscriptions", element: <SubscriptionsPage /> }],
              },
              {
                element: <RequirePermission permission="workouts:read" />,
                children: [{ path: "workouts", element: <WorkoutsPage /> }],
              },
              {
                element: <RequirePermission permission="nutrition:read" />,
                children: [{ path: "nutrition", element: <NutritionPage /> }],
              },
              {
                element: <RequirePermission permission="content:read" />,
                children: [{ path: "content", element: <ContentLibraryPage /> }],
              },
              {
                element: <RequirePermission permission="progress:read" />,
                children: [{ path: "progress", element: <ProgressPage /> }],
              },
              {
                element: <RequirePermission permission="physicalTherapy:read" />,
                children: [{ path: "physical-therapy", element: <PhysicalTherapyPage /> }],
              },
              {
                element: <RequirePermission permission="staff:manage" />,
                children: [{ path: "staff", element: <StaffPage /> }],
              },
              {
                element: <RequirePermission permission="reports:read" />,
                children: [{ path: "reports", element: <ReportsPage /> }],
              },
              {
                element: <RequirePermission permission="content:read" />,
                children: [
                  { path: "website/home/hero", element: <HomeHeroPage /> },
                  {
                    path: "website/home/trusted-partners",
                    element: <HomeTrustedPartnersPage />,
                  },
                  { path: "website/home/who-i-am", element: <HomeWhoIAmPage /> },
                  {
                    path: "website/home/fitness-dream",
                    element: <HomeFitnessDreamPage />,
                  },
                  {
                    path: "website/home/coaching-app",
                    element: <HomeCoachingAppPage />,
                  },
                  {
                    path: "website/home/video-banner",
                    element: <HomeVideoBannerPage />,
                  },
                  {
                    path: "website/home/testimonials",
                    element: <HomeTestimonialsPage />,
                  },
                  {
                    path: "website/home/goals-banner",
                    element: <HomeGoalsBannerPage />,
                  },
                  { path: "website/about/hero", element: <AboutHeroPage /> },
                  {
                    path: "website/about/my-story",
                    element: <AboutMyStoryPage />,
                  },
                  {
                    path: "website/about/how-i-coach",
                    element: <AboutHowICoachPage />,
                  },
                  {
                    path: "website/about/who-i-help",
                    element: <AboutWhoIHelpPage />,
                  },
                  {
                    path: "website/about/certifications",
                    element: <AboutCertificationsPage />,
                  },
                  {
                    path: "website/about/closing-banner",
                    element: <AboutClosingBannerPage />,
                  },
                  { path: "website/common/faq", element: <CommonFaqPage /> },
                  {
                    path: "website/common/transformations",
                    element: <CommonTransformationsPage />,
                  },
                  {
                    path: "website/common/footer",
                    element: <CommonFooterPage />,
                  },
                ],
              },
            ],
          },
        ],
      },
    ],
  },
]
