import { Link, NavLink, Outlet } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { adminNav } from "@/config/navigation"
import { APP_ROUTES } from "@/config/constants"
import { LanguageSwitcher } from "@/components/shared/LanguageSwitcher"
import { useAuth } from "@/features/auth/auth-context"
import { filterByPermission } from "@/lib/permissions/can"
import { env } from "@/config/env"

export function AdminLayout() {
  const { t } = useTranslation()
  const { user, signOut } = useAuth()
  const items = filterByPermission(user, adminNav)

  return (
    <div className="flex min-h-dvh bg-background text-foreground">
      <aside className="hidden w-60 shrink-0 border-e border-border md:flex md:flex-col">
        <div className="border-b border-border px-4 py-4 text-sm font-semibold">{env.appName} Admin</div>
        <nav className="flex flex-1 flex-col gap-1 p-3 text-sm">
          {items.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === APP_ROUTES.admin.root}
              className={({ isActive }) =>
                [
                  "rounded-md px-3 py-2 transition-colors",
                  isActive ? "bg-muted font-medium text-foreground" : "text-muted-foreground hover:bg-muted/60",
                ].join(" ")
              }
            >
              {t(item.labelKey)}
            </NavLink>
          ))}
        </nav>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
          <Link to={APP_ROUTES.public.home} className="text-sm text-muted-foreground hover:text-foreground md:hidden">
            {env.appName}
          </Link>
          <div className="ms-auto flex items-center gap-3">
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
        </header>
        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
