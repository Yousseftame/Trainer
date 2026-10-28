import { useEffect } from "react"
import { Link, useLocation } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { APP_ROUTES } from "@/config/constants"
import { ArrowCtaLink } from "@/components/public/ArrowCtaLink"
import { HamburgerButton } from "@/components/public/HamburgerButton"
import { LanguageSwitcher } from "@/components/shared/LanguageSwitcher"
import { cn } from "@/lib/utils"

const mobileLinks = [
  { labelKey: "nav.home", to: APP_ROUTES.public.home, end: true },
  { labelKey: "nav.about", to: APP_ROUTES.public.about },
  { labelKey: "nav.services", to: APP_ROUTES.public.services },
  { labelKey: "nav.packages", to: APP_ROUTES.public.packages },
  { labelKey: "nav.contact", to: APP_ROUTES.public.contact },
  { labelKey: "nav.login", to: APP_ROUTES.public.login },
] as const

type MobileNavOverlayProps = {
  open: boolean
  onClose: () => void
}

function isHashNavActive(pathname: string, hash: string, to: string, end?: boolean) {
  const [pathPart, hashPart] = to.split("#")
  const pathOnly = pathPart || "/"
  const targetHash = hashPart ? `#${hashPart}` : ""

  if (targetHash) {
    return pathname === pathOnly && hash === targetHash
  }

  if (end) {
    return pathname === pathOnly && !hash
  }

  return pathname === pathOnly || (pathOnly !== "/" && pathname.startsWith(pathOnly))
}

export function MobileNavOverlay({ open, onClose }: MobileNavOverlayProps) {
  const { t } = useTranslation()
  const location = useLocation()

  useEffect(() => {
    if (!open) return

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose()
    }

    document.addEventListener("keydown", onKeyDown)
    return () => document.removeEventListener("keydown", onKeyDown)
  }, [open, onClose])

  return (
    <div
      id="public-mobile-nav"
      className={cn(
        "fixed inset-0 z-[60] flex flex-col bg-[var(--gym-ink)] lg:hidden",
        "transition-[opacity,visibility] duration-[320ms] ease-[cubic-bezier(0.22,1,0.36,1)]",
        open ? "visible opacity-100" : "invisible opacity-0 pointer-events-none",
      )}
      aria-hidden={!open}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage:
            "radial-gradient(circle at 20% 20%, #b8fe22 0%, transparent 42%), radial-gradient(circle at 85% 75%, #b8fe22 0%, transparent 36%)",
        }}
      />

      <div className="relative z-10 flex items-center justify-between px-5 py-4">
        <Link
          to={APP_ROUTES.public.home}
          onClick={onClose}
          className="flex items-center"
          aria-label={t("app.name")}
        >
          <span className="font-heading text-[22px] font-bold tracking-tight text-white">
            {t("app.name")}
          </span>
        </Link>

        <HamburgerButton open onClick={onClose} label={t("nav.closeMenu")} />
      </div>

      <div
        className={cn(
          "relative z-10 px-5 pb-4 pt-1",
          "transition-[opacity,transform] duration-[400ms] ease-[cubic-bezier(0.22,1,0.36,1)]",
          open ? "translate-y-0 opacity-100 delay-75" : "translate-y-2 opacity-0 delay-0",
        )}
      >
        <LanguageSwitcher
          className={cn(
            "h-11 w-auto border-white/25 bg-white/10 p-1",
            "[&_button]:h-9 [&_button]:min-w-[44px] [&_button]:px-3.5 [&_button]:text-[14px]",
            "[&_button]:text-white",
            "[&_button[aria-pressed=true]]:bg-[var(--gym-lime)] [&_button[aria-pressed=true]]:text-[var(--gym-ink)]",
            "[&_button[aria-pressed=false]]:hover:bg-white/10",
          )}
        />
      </div>

      <nav
        className="relative z-10 flex flex-1 flex-col justify-start overflow-y-auto px-6 pb-4 pt-1"
        aria-label={t("nav.main")}
      >
        {mobileLinks.map((item, index) => {
          const active = isHashNavActive(
            location.pathname,
            location.hash,
            item.to,
            "end" in item ? item.end : false
          )
          const baseClass = cn(
            "font-heading border-b border-white/10 py-3.5 text-[30px] font-semibold tracking-tight",
            "sm:py-4 sm:text-[34px]",
            open ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0",
          )
          const style = {
            transitionDelay: open ? `${100 + index * 40}ms` : "0ms",
            transitionProperty: "opacity, transform, color",
            transitionDuration: "400ms",
            transitionTimingFunction: "cubic-bezier(0.22, 1, 0.36, 1)",
          } as const

          return (
            <Link
              key={item.to}
              to={item.to}
              onClick={onClose}
              aria-current={active ? "page" : undefined}
              className={cn(
                baseClass,
                "transition-colors duration-200",
                active ? "text-[var(--gym-lime)]" : "text-white hover:text-[var(--gym-lime)]",
              )}
              style={style}
            >
              {t(item.labelKey)}
            </Link>
          )
        })}
      </nav>

      <div
        className={cn(
          "relative z-10 flex justify-center px-6 pb-[max(2rem,env(safe-area-inset-bottom))] pt-2",
          "transition-[opacity,transform] duration-[400ms] ease-[cubic-bezier(0.22,1,0.36,1)]",
          open ? "translate-y-0 opacity-100 delay-150" : "translate-y-3 opacity-0 delay-0",
        )}
      >
        <ArrowCtaLink
          to={APP_ROUTES.public.login}
          label={t("nav.getStarted")}
          onClick={onClose}
          className="text-[var(--gym-ink)] [&_span:first-child]:border-[var(--gym-ink)] [&_span:first-child]:bg-white [&_span:last-child]:bg-[var(--gym-lime)] [&_span:last-child]:text-[var(--gym-ink)]"
        />
      </div>
    </div>
  )
}
