import { useCallback, useEffect, useMemo, useState } from "react"
import { Outlet, useLocation, useNavigate } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar"
import { DashboardTopbar } from "@/components/dashboard/DashboardTopbar"
import { LogoutConfirmDialog } from "@/components/dashboard/LogoutConfirmDialog"
import { SubscriberMobileMenuDrawer } from "@/components/subscriber/SubscriberMobileMenuDrawer"
import { SubscriberMobileNavbar } from "@/components/subscriber/SubscriberMobileNavbar"
import { APP_ROUTES } from "@/config/constants"
import { env } from "@/config/env"
import { flattenNavItems, subscriberNav } from "@/config/navigation"
import { useAuth } from "@/features/auth/auth-context"
import { firebaseAuthErrorKey } from "@/features/auth/errors"
import { appToast } from "@/lib/toast"
import { cn } from "@/lib/utils"

const COLLAPSE_KEY = "trainer.subscriber.sidebar.collapsed"

function resolveTitle(pathname: string, fallback: string) {
  const match = [...flattenNavItems(subscriberNav)]
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

export function SubscriberLayout() {
  const { t } = useTranslation()
  const location = useLocation()
  const navigate = useNavigate()
  const { signOut } = useAuth()

  const [collapsed, setCollapsed] = useState(false)
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false)
  const [logoutOpen, setLogoutOpen] = useState(false)

  useEffect(() => {
    setCollapsed(readCollapsed())
  }, [])

  const titleKey = useMemo(
    () => resolveTitle(location.pathname, "nav.overview"),
    [location.pathname],
  )

  const handleToggleDrawer = useCallback(() => {
    setMobileDrawerOpen((prev) => !prev)
  }, [])

  const handleCloseDrawer = useCallback(() => {
    setMobileDrawerOpen(false)
  }, [])

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
    setMobileDrawerOpen(false)
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

  return (
    <div className={cn("subscriber-layout flex h-dvh max-h-dvh overflow-hidden bg-[#F4F4F4] text-[var(--gym-ink,#111111)]")}>
      {/* Desktop Sidebar (hidden on mobile, managed by GlassSurface on mobile) */}
      <DashboardSidebar
        items={subscriberNav}
        brand={env.appName}
        areaLabel={t("dashboard.subscriberArea")}
        homeTo={APP_ROUTES.subscriber.root}
        mobileOpen={false}
        collapsed={collapsed}
        onMobileClose={() => undefined}
        onToggle={toggleCollapsed}
        onSignOut={requestSignOut}
      />

      {/* Main Content Area */}
      <div className="flex min-h-0 min-w-0 flex-1 flex-col w-full max-w-full">
        <DashboardTopbar
          title={t(titleKey)}
          areaLabel={t("dashboard.subscriberArea")}
          onSidebarToggle={() => {
            if (window.matchMedia("(min-width: 1024px)").matches) {
              toggleCollapsed()
              return
            }
            handleToggleDrawer()
          }}
          onSignOut={requestSignOut}
        />

        <main className="min-h-0 min-w-0 flex-1 overflow-x-hidden overflow-y-auto px-4 pb-28 pt-2 sm:px-6 sm:pb-32 lg:px-7 lg:pb-10">
          <Outlet />
        </main>
      </div>

      {/* Mobile Glass Surface Floating Bottom Navbar */}
      <SubscriberMobileNavbar
        isMenuOpen={mobileDrawerOpen}
        onToggleMenu={handleToggleDrawer}
      />

      {/* Mobile Menu Drawer (Opened when clicking "Menu" on the glass navbar) */}
      <SubscriberMobileMenuDrawer
        open={mobileDrawerOpen}
        onClose={handleCloseDrawer}
        onRequestSignOut={requestSignOut}
      />

      {/* Logout Confirmation */}
      <LogoutConfirmDialog
        open={logoutOpen}
        onCancel={() => setLogoutOpen(false)}
        onConfirm={handleConfirmSignOut}
      />
    </div>
  )
}
