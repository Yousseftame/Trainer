import type { RouteObject } from "react-router-dom"
import { PublicLayout } from "@/layouts/PublicLayout"
import { AuthLayout } from "@/layouts/AuthLayout"
import { HomePage } from "@/pages/public/HomePage"
import { AboutPage } from "@/pages/public/AboutPage"
import { ServicesPage } from "@/pages/public/ServicesPage"
import { ContactPage } from "@/pages/public/ContactPage"
import { LoginPage } from "@/pages/public/LoginPage"
import { RegisterPage } from "@/pages/public/RegisterPage"
import { ForgotPasswordPage } from "@/pages/public/ForgotPasswordPage"

export const publicRoutes: RouteObject[] = [
  {
    element: <PublicLayout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: "about", element: <AboutPage /> },
      { path: "services", element: <ServicesPage /> },
      { path: "contact", element: <ContactPage /> },
    ],
  },
  {
    element: <AuthLayout />,
    children: [
      { path: "login", element: <LoginPage /> },
      { path: "register", element: <RegisterPage /> },
      { path: "forgot-password", element: <ForgotPasswordPage /> },
    ],
  },
]
