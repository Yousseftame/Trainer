import { lazy } from "react"
import type { RouteObject } from "react-router-dom"
import { SubscriberLayout } from "@/layouts/SubscriberLayout"
import {
  RequireActiveSubscription,
  RequireAuth,
  RequireRole,
} from "@/app/router/guards"

const OverviewPage = lazy(() =>
  import("@/pages/subscriber/OverviewPage").then((m) => ({ default: m.OverviewPage })),
)
const ProfilePage = lazy(() =>
  import("@/pages/subscriber/ProfilePage").then((m) => ({ default: m.ProfilePage })),
)
const SubscriptionPage = lazy(() =>
  import("@/pages/subscriber/SubscriptionPage").then((m) => ({ default: m.SubscriptionPage })),
)
const WorkoutPlanPage = lazy(() =>
  import("@/pages/subscriber/WorkoutPlanPage").then((m) => ({ default: m.WorkoutPlanPage })),
)
const NutritionPlanPage = lazy(() =>
  import("@/pages/subscriber/NutritionPlanPage").then((m) => ({ default: m.NutritionPlanPage })),
)
const LibraryPage = lazy(() =>
  import("@/pages/subscriber/LibraryPage").then((m) => ({ default: m.LibraryPage })),
)
const WorkoutLogPage = lazy(() =>
  import("@/pages/subscriber/WorkoutLogPage").then((m) => ({ default: m.WorkoutLogPage })),
)
const NutritionLogPage = lazy(() =>
  import("@/pages/subscriber/NutritionLogPage").then((m) => ({ default: m.NutritionLogPage })),
)
const ProgressPage = lazy(() =>
  import("@/pages/subscriber/ProgressPage").then((m) => ({ default: m.ProgressPage })),
)
const HistoryPage = lazy(() =>
  import("@/pages/subscriber/HistoryPage").then((m) => ({ default: m.HistoryPage })),
)

export const subscriberRoutes: RouteObject[] = [
  {
    path: "app",
    element: <RequireAuth />,
    children: [
      {
        element: <RequireRole allowed={["subscriber"]} />,
        children: [
          {
            element: <SubscriberLayout />,
            children: [
              { index: true, element: <OverviewPage /> },
              { path: "profile", element: <ProfilePage /> },
              { path: "subscription", element: <SubscriptionPage /> },
              {
                element: <RequireActiveSubscription />,
                children: [
                  { path: "workout", element: <WorkoutPlanPage /> },
                  { path: "nutrition", element: <NutritionPlanPage /> },
                  { path: "library", element: <LibraryPage /> },
                  { path: "workout-log", element: <WorkoutLogPage /> },
                  { path: "nutrition-log", element: <NutritionLogPage /> },
                  { path: "progress", element: <ProgressPage /> },
                  { path: "history", element: <HistoryPage /> },
                ],
              },
            ],
          },
        ],
      },
    ],
  },
]
