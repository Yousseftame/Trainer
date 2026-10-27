import { Link, NavLink, Outlet } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { subscriberNav } from "@/config/navigation"
import { APP_ROUTES } from "@/config/constants"
import { LanguageSwitcher } from "@/components/shared/LanguageSwitcher"
import { useAuth } from "@/features/auth/auth-context"
import { env } from "@/config/env"

export function SubscriberLayout() {
  const { t } = useTranslation()
  const { user, signOut } = useAuth()

  return (
    <div className="flex min-h-dvh flex-col bg-background text-foreground">
      <header className="border-b border-border">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-3 px-4 py-3">
          <Link to={APP_ROUTES.subscriber.root} className="text-sm font-semibold">
            {env.appName}
          </Link>
          <div className="flex items-center gap-3">
            <LanguageSwitcher />
            <span className="hidden text-sm text-muted-foreground sm:inline">{user?.displayName}</span>
            <button
              type="button"
              onClick={() => void signOut()}
              className="text-sm font-medium text-muted-foreground hover:text-foreground"
            >
              {t("nav.logout")}
            </button>
          </div>
        </div>
        <nav className="mx-auto flex w-full max-w-6xl gap-1 overflow-x-auto px-2 pb-2 text-sm">
          {subscriberNav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === APP_ROUTES.subscriber.root}
              className={({ isActive }) =>
                [
                  "whitespace-nowrap rounded-md px-3 py-1.5",
                  isActive ? "bg-muted font-medium" : "text-muted-foreground hover:bg-muted/60",
                ].join(" ")
              }
            >
              {t(item.labelKey)}
            </NavLink>
          ))}
        </nav>
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1">
        <Outlet />
      </main>
    </div>
  )
}
