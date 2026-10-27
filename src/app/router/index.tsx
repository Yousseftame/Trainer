import { createBrowserRouter, Navigate } from "react-router-dom"
import { publicRoutes } from "@/app/router/routes.public"
import { adminRoutes } from "@/app/router/routes.admin"
import { subscriberRoutes } from "@/app/router/routes.subscriber"
import { NotFoundPage } from "@/pages/errors/NotFoundPage"
import { UnauthorizedPage } from "@/pages/errors/UnauthorizedPage"
import { SubscriptionExpiredPage } from "@/pages/errors/SubscriptionExpiredPage"

export const router = createBrowserRouter([
  ...publicRoutes,
  ...adminRoutes,
  ...subscriberRoutes,
  { path: "unauthorized", element: <UnauthorizedPage /> },
  { path: "subscription-expired", element: <SubscriptionExpiredPage /> },
  { path: "404", element: <NotFoundPage /> },
  { path: "*", element: <Navigate to="/404" replace /> },
])
