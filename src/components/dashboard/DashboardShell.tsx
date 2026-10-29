import { useEffect, useMemo, useState } from "react"
import { Outlet, useLocation, useNavigate } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar"
import { DashboardTopbar } from "@/components/dashboard/DashboardTopbar"
import { LogoutConfirmDialog } from "@/components/dashboard/LogoutConfirmDialog"
import { flattenNavItems, type NavItem } from "@/config/navigation"
import { useAuth } from "@/features/auth/auth-context"
import { firebaseAuthErrorKey } from "@/features/auth/errors"
import { APP_ROUTES } from "@/config/constants"
import { env } from "@/config/env"
import { appToast } from "@/lib/toast"
import { cn } from "@/lib/utils"

const COLLAPSE_KEY = "trainer.dashboard.sidebar.collapsed"

type DashboardShellProps = {
  area: "admin" | "subscriber"
  items: NavItem[]
  homeTo: string
}

function resolveTitle(pathname: string, items: NavItem[], fallback: string) {
  const match = [...flattenNavItems(items)]
    .sort((a, b) => b.to.length - a.to.length)
    .find((item) => pathname === item.to || pathname.startsWith(`${item.to}/`))
  return match?.labelKey ?? fallback
}

function readCollapsed(): boolean {
  try {
    return window.localStorage.getItem(COLLAPSE_KEY) === "1"
  } catch {
    return false
  }
}

export function DashboardShell({ area, items, homeTo }: DashboardShellProps) {
  const { t } = useTranslation()
  const location = useLocation()
  const navigate = useNavigate()
  const { signOut } = useAuth()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(false)
  const [logoutOpen, setLogoutOpen] = useState(false)

  useEffect(() => {
    setCollapsed(readCollapsed())
  }, [])

  const titleKey = useMemo(
    () => resolveTitle(location.pathname, items, items[0]?.labelKey ?? "nav.overview"),
    [location.pathname, items],
  )

  useEffect(() => {
    setMobileOpen(false)
  }, [location.pathname])

  useEffect(() => {
    if (!mobileOpen) return
    const previous = document.body.style.overflow
    document.body.style.overflow = "hidden"

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setMobileOpen(false)
    }
    document.addEventListener("keydown", onKeyDown)

    return () => {
      document.body.style.overflow = previous
      document.removeEventListener("keydown", onKeyDown)
    }
  }, [mobileOpen])

  function toggleCollapsed() {
    setCollapsed((prev) => {
      const next = !prev
      try {
        window.localStorage.setItem(COLLAPSE_KEY, next ? "1" : "0")
      } catch {
        // ignore
      }
      return next
    })
  }

  function requestSignOut() {
    setMobileOpen(false)
    setLogoutOpen(true)
  }

  async function handleConfirmSignOut() {
    try {
      await signOut()
      setLogoutOpen(false)
      appToast.success(t("auth.toast.signedOut"))
      navigate(APP_ROUTES.public.login, { replace: true, state: null })
    } catch (error) {
      appToast.error(t(firebaseAuthErrorKey(error)))
    }
  }

  const areaLabel =
    area === "admin" ? t("dashboard.adminArea") : t("dashboard.subscriberArea")

  return (
    <div className={cn("dashboard-shell flex h-dvh max-h-dvh overflow-hidden bg-[#F4F4F4] text-[var(--gym-ink,#111111)]")}>
      <DashboardSidebar
        items={items}
        brand={env.appName}
        areaLabel={areaLabel}
        homeTo={homeTo}
        mobileOpen={mobileOpen}
        collapsed={collapsed}
        onMobileClose={() => setMobileOpen(false)}
        onToggle={toggleCollapsed}
        onSignOut={requestSignOut}
      />

      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <DashboardTopbar
          title={t(titleKey)}
          areaLabel={areaLabel}
          onSignOut={requestSignOut}
          onSidebarToggle={() => {
            if (window.matchMedia("(min-width: 1024px)").matches) {
              toggleCollapsed()
              return
            }
            setMobileOpen(true)
          }}
        />
        <main className="min-h-0 min-w-0 flex-1 overflow-x-hidden overflow-y-auto px-4 pb-6 pt-3 sm:px-6 sm:pb-8 lg:px-7 lg:pb-10">
          <Outlet />
        </main>
      </div>

      <LogoutConfirmDialog
        open={logoutOpen}
        onCancel={() => setLogoutOpen(false)}
        onConfirm={handleConfirmSignOut}
      />
    </div>
  )
}
