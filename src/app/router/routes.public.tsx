import type { RouteObject } from "react-router-dom"
import { Navigate } from "react-router-dom"
import { RequireGuest } from "@/app/router/guards"
import { PublicLayout } from "@/layouts/PublicLayout"
import { AuthLayout } from "@/layouts/AuthLayout"
import { HomePage } from "@/pages/public/HomePage"
import { LoginPage } from "@/pages/public/LoginPage"
import { ForgotPasswordPage } from "@/pages/public/ForgotPasswordPage"
import { APP_ROUTES } from "@/config/constants"

export const publicRoutes: RouteObject[] = [
  {
    element: <PublicLayout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: "about", element: <Navigate to={APP_ROUTES.public.about} replace /> },
      { path: "services", element: <Navigate to={APP_ROUTES.public.services} replace /> },
      { path: "contact", element: <Navigate to={APP_ROUTES.public.contact} replace /> },
    ],
  },
  {
    element: <RequireGuest />,
    children: [
      {
        element: <AuthLayout />,
        children: [
          { path: "login", element: <LoginPage /> },
          { path: "forgot-password", element: <ForgotPasswordPage /> },
        ],
      },
    ],
  },
]
