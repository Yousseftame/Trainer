import { Link, Outlet } from "react-router-dom"
import { APP_ROUTES } from "@/config/constants"
import { LanguageSwitcher } from "@/components/shared/LanguageSwitcher"
import { env } from "@/config/env"

export function AuthLayout() {
  return (
    <div className="flex min-h-dvh flex-col bg-background text-foreground">
      <header className="mx-auto flex w-full max-w-lg items-center justify-between px-4 py-4">
        <Link to={APP_ROUTES.public.home} className="text-sm font-semibold">
          {env.appName}
        </Link>
        <LanguageSwitcher />
      </header>
      <main className="mx-auto flex w-full max-w-lg flex-1 flex-col px-4 pb-10">
        <Outlet />
      </main>
    </div>
  )
}
