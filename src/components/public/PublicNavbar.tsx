import { useEffect, useState } from "react"
import { Link, useLocation } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { APP_ROUTES } from "@/config/constants"
import { ArrowCtaLink } from "@/components/public/ArrowCtaLink"
import { HamburgerButton } from "@/components/public/HamburgerButton"
import { MobileNavOverlay } from "@/components/public/MobileNavOverlay"
import { NavUnderline } from "@/components/public/NavUnderline"
import { BrandLogo } from "@/components/shared/BrandLogo"
import { LanguageSwitcher } from "@/components/shared/LanguageSwitcher"

const primaryLinks = [
  { labelKey: "nav.home", to: APP_ROUTES.public.home, end: true },
  { labelKey: "nav.about", to: APP_ROUTES.public.about },
  { labelKey: "nav.services", to: APP_ROUTES.public.services },
  { labelKey: "nav.packages", to: APP_ROUTES.public.packages },
  { labelKey: "nav.contact", to: APP_ROUTES.public.contact },
] as const

const topLinkClass =
  "group relative inline-flex items-center pb-1.5 text-[16px] font-bold text-[var(--gym-ink)] outline-none"

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

export function PublicNavbar() {
  const { t } = useTranslation()
  const location = useLocation()
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    setMobileOpen(false)
  }, [location.pathname, location.hash])

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : ""
    return () => {
      document.body.style.overflow = ""
    }
  }, [mobileOpen])

  return (
    <header className="relative z-50 bg-white">
      <div className="mx-auto grid w-full max-w-[1300px] grid-cols-[auto_1fr_auto] items-center gap-6 px-[15px] py-[22px] md:px-[30px] lg:gap-10 lg:py-[30px]">
        <Link
          to={APP_ROUTES.public.home}
          className="flex shrink-0 items-center"
          aria-label={t("app.name")}
        >
          <BrandLogo className="h-9 md:h-10" />
        </Link>

        <nav className="hidden items-center justify-center gap-8 lg:flex" aria-label={t("nav.main")}>
          {primaryLinks.map((item) => {
            const active = isHashNavActive(
              location.pathname,
              location.hash,
              item.to,
              "end" in item ? item.end : false
            )
            return (
              <Link
                key={item.to}
                to={item.to}
                className={topLinkClass}
                aria-current={active ? "page" : undefined}
              >
                {t(item.labelKey)}
                <NavUnderline active={active} />
              </Link>
            )
          })}
        </nav>

        <div className="flex items-center justify-end gap-4 justify-self-end">
          <div className="hidden items-center gap-4 lg:flex">
            <LanguageSwitcher />
            <ArrowCtaLink to={APP_ROUTES.public.login} label={t("nav.getStarted")} />
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
