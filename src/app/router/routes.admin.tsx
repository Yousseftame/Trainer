import { lazy } from "react"
import type { RouteObject } from "react-router-dom"
import { AdminLayout } from "@/layouts/AdminLayout"
import { RequireAuth, RequirePermission, RequireRole } from "@/app/router/guards"

const OverviewPage = lazy(() =>
  import("@/pages/admin/OverviewPage").then((m) => ({ default: m.OverviewPage })),
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
const StaffPage = lazy(() =>
  import("@/pages/admin/StaffPage").then((m) => ({ default: m.StaffPage })),
)
const ReportsPage = lazy(() =>
  import("@/pages/admin/ReportsPage").then((m) => ({ default: m.ReportsPage })),
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
              {
                element: <RequirePermission permission="reports:read" />,
                children: [{ index: true, element: <OverviewPage /> }],
              },
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
                element: <RequirePermission permission="workouts:manage" />,
                children: [{ path: "workouts", element: <WorkoutsPage /> }],
              },
              {
                element: <RequirePermission permission="nutrition:manage" />,
                children: [{ path: "nutrition", element: <NutritionPage /> }],
              },
              {
                element: <RequirePermission permission="content:manage" />,
                children: [{ path: "content", element: <ContentLibraryPage /> }],
              },
              {
                element: <RequirePermission permission="progress:read" />,
                children: [{ path: "progress", element: <ProgressPage /> }],
              },
              {
                element: <RequirePermission permission="staff:manage" />,
                children: [{ path: "staff", element: <StaffPage /> }],
              },
              {
                element: <RequirePermission permission="reports:read" />,
                children: [{ path: "reports", element: <ReportsPage /> }],
              },
            ],
          },
        ],
      },
    ],
  },
]
