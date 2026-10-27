import { useEffect, useId, useRef, useState } from "react"
import { Link, NavLink, useLocation } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { ChevronDown } from "lucide-react"
import { APP_ROUTES } from "@/config/constants"
import { ArrowCtaLink } from "@/components/public/ArrowCtaLink"
import { HamburgerButton } from "@/components/public/HamburgerButton"
import { MobileNavOverlay } from "@/components/public/MobileNavOverlay"
import { NavUnderline } from "@/components/public/NavUnderline"
import { LanguageSwitcher } from "@/components/shared/LanguageSwitcher"
import { cn } from "@/lib/utils"
import logo from "@/assets/brand/logo.png"

const primaryLinks = [
  { labelKey: "nav.home", to: APP_ROUTES.public.home, end: true },
  { labelKey: "nav.about", to: APP_ROUTES.public.about },
] as const

const pagesLinks = [
  { labelKey: "nav.home", to: APP_ROUTES.public.home, end: true },
  { labelKey: "nav.about", to: APP_ROUTES.public.about },
  { labelKey: "nav.services", to: APP_ROUTES.public.services },
  { labelKey: "nav.contact", to: APP_ROUTES.public.contact },
  { labelKey: "nav.login", to: APP_ROUTES.public.login },
  { labelKey: "nav.register", to: APP_ROUTES.public.register },
] as const

const pagesOnlyPaths: readonly string[] = [
  APP_ROUTES.public.contact,
  APP_ROUTES.public.login,
  APP_ROUTES.public.register,
]

const topLinkClass =
  "group relative inline-flex items-center pb-1.5 text-[16px] font-bold text-[var(--gym-ink)] outline-none"

export function PublicNavbar() {
  const { t } = useTranslation()
  const location = useLocation()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [pagesOpen, setPagesOpen] = useState(false)
  const [pagesMounted, setPagesMounted] = useState(false)
  const closeTimer = useRef<number | null>(null)
  const pagesRef = useRef<HTMLDivElement>(null)
  const pagesMenuId = useId()

  const pagesTriggerActive = pagesOpen || pagesOnlyPaths.includes(location.pathname)

  useEffect(() => {
    setMobileOpen(false)
    setPagesOpen(false)
  }, [location.pathname])

  useEffect(() => {
    if (pagesOpen) {
      setPagesMounted(true)
      return
    }
    const timer = window.setTimeout(() => setPagesMounted(false), 280)
    return () => window.clearTimeout(timer)
  }, [pagesOpen])

  useEffect(() => {
    if (!pagesOpen) return

    function onPointerDown(event: MouseEvent) {
      if (!pagesRef.current?.contains(event.target as Node)) {
        setPagesOpen(false)
      }
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setPagesOpen(false)
    }

    document.addEventListener("mousedown", onPointerDown)
    document.addEventListener("keydown", onKeyDown)
    return () => {
      document.removeEventListener("mousedown", onPointerDown)
      document.removeEventListener("keydown", onKeyDown)
    }
  }, [pagesOpen])

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : ""
    return () => {
      document.body.style.overflow = ""
    }
  }, [mobileOpen])

  function openPages() {
    if (closeTimer.current) {
      window.clearTimeout(closeTimer.current)
      closeTimer.current = null
    }
    setPagesOpen(true)
  }

  function scheduleClosePages() {
    if (closeTimer.current) window.clearTimeout(closeTimer.current)
    closeTimer.current = window.setTimeout(() => setPagesOpen(false), 120)
  }

  return (
    <header className="relative z-50 bg-white">
      <div className="mx-auto grid w-full max-w-[1300px] grid-cols-[auto_1fr_auto] items-center gap-6 px-[15px] py-[22px] md:px-[30px] lg:gap-10 lg:py-[30px]">
        <Link
          to={APP_ROUTES.public.home}
          className="flex shrink-0 items-center gap-2.5 text-[var(--gym-ink)]"
          aria-label={t("app.name")}
        >
          <img src={logo} alt="" className="size-11 object-contain md:size-12" />
          <span className="font-heading text-[22px] font-bold tracking-tight md:text-[24px]">
            {t("app.name")}
          </span>
        </Link>

        <nav className="hidden items-center justify-center gap-8 lg:flex" aria-label={t("nav.main")}>
          {primaryLinks.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={"end" in item ? item.end : false}
              className={topLinkClass}
            >
              {({ isActive }) => (
                <>
                  {t(item.labelKey)}
                  <NavUnderline active={isActive} />
                </>
              )}
            </NavLink>
          ))}

          <div
            ref={pagesRef}
            className="relative"
            onMouseEnter={openPages}
            onMouseLeave={scheduleClosePages}
          >
            <button
              type="button"
              className={cn(topLinkClass, "gap-1")}
              aria-expanded={pagesOpen}
              aria-controls={pagesMenuId}
              onClick={() => setPagesOpen((open) => !open)}
            >
              {t("nav.pages")}
              <ChevronDown
                className={cn(
                  "size-4 transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
                  pagesOpen && "rotate-180",
                )}
                strokeWidth={2}
              />
              <NavUnderline active={pagesTriggerActive} />
            </button>

            {pagesMounted ? (
              <div
                id={pagesMenuId}
                role="menu"
                className={cn(
                  "absolute left-1/2 top-[calc(100%+14px)] z-50 w-[200px] -translate-x-1/2 origin-top",
                  "rounded-[14px] border-[1.5px] border-[var(--gym-ink)]/55 bg-[#f2f4ed] px-4 py-3",
                  "shadow-[0_18px_50px_rgba(6,52,52,0.14)]",
                  "transition-all duration-[280ms] ease-[cubic-bezier(0.22,1,0.36,1)]",
                  pagesOpen
                    ? "pointer-events-auto translate-y-0 scale-100 opacity-100"
                    : "pointer-events-none translate-y-2 scale-[0.98] opacity-0",
                )}
              >
                <div className="flex flex-col gap-1.5">
                  {pagesLinks.map((item) => (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      end={"end" in item ? item.end : false}
                      role="menuitem"
                      className="group relative w-fit pb-1 text-[16px] font-bold leading-tight text-[var(--gym-ink)] outline-none"
                    >
                      {({ isActive }) => (
                        <>
                          {t(item.labelKey)}
                          <NavUnderline active={isActive} />
                        </>
                      )}
                    </NavLink>
                  ))}
                </div>
              </div>
            ) : null}
          </div>

          <NavLink to={APP_ROUTES.public.services} className={topLinkClass}>
            {({ isActive }) => (
              <>
                {t("nav.services")}
                <NavUnderline active={isActive} />
              </>
            )}
          </NavLink>
        </nav>

        <div className="flex items-center justify-end gap-4 justify-self-end">
          <div className="hidden items-center gap-4 lg:flex">
            <LanguageSwitcher />
            <ArrowCtaLink to={APP_ROUTES.public.register} label={t("nav.getStarted")} />
          </div>

          <HamburgerButton
            open={mobileOpen}
            onClick={() => setMobileOpen((open) => !open)}
            label={mobileOpen ? t("nav.closeMenu") : t("nav.openMenu")}
          />
        </div>
      </div>

      <MobileNavOverlay open={mobileOpen} onClose={() => setMobileOpen(false)} />
    </header>
  )
}
