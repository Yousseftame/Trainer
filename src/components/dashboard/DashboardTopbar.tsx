import { useState } from "react"
import { Link } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { AnimatePresence, motion } from "motion/react"
import { PanelLeft, Search } from "lucide-react"
import { ProfileMenu } from "@/components/dashboard/ProfileMenu"
import { LanguageSwitcher } from "@/components/shared/LanguageSwitcher"
import { APP_ROUTES } from "@/config/constants"
import { useLocale } from "@/hooks/useLocale"
import { cn } from "@/lib/utils"

type DashboardTopbarProps = {
  title: string
  areaLabel: string
  onSidebarToggle: () => void
  onSignOut?: () => void
  className?: string
}

export function DashboardTopbar({
  title,
  areaLabel,
  onSidebarToggle,
  onSignOut,
  className,
}: DashboardTopbarProps) {
  const { t } = useTranslation()
  const { isRtl } = useLocale()
  const [query, setQuery] = useState("")

  return (
    <header
      className={cn(
        "relative z-40 w-full max-w-full shrink-0 bg-[#F4F4F4] px-3.5 pt-[max(0.875rem,calc(0.5rem+env(safe-area-inset-top,0px)))] pb-2.5 sm:px-6 sm:pt-5 sm:pb-3.5 lg:px-7",
        className,
      )}
    >
      <div className="flex items-center justify-between gap-2 sm:gap-4 min-w-0">
        {/* Leading Side: toggle button + title + badge */}
        <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
          <button
            type="button"
            onClick={onSidebarToggle}
            className="inline-flex size-9 sm:size-11 shrink-0 items-center justify-center rounded-full bg-white text-[var(--gym-ink,#111111)] shadow-[0_4px_16px_rgba(0,0,0,0.06)] transition-transform active:scale-[0.97]"
            aria-label={t("nav.openMenu")}
          >
            <PanelLeft className="size-4 sm:size-5 rtl:-scale-x-100" strokeWidth={1.8} />
          </button>

          <div className="flex min-w-0 flex-1 items-center gap-2 overflow-hidden">
            <AnimatePresence mode="wait" initial={false}>
              <motion.h1
                key={title}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15, ease: [0.22, 1, 0.36, 1] }}
                className={cn(
                  "min-w-0 max-w-full truncate text-[15px] sm:text-[20px] lg:text-[22px] font-extrabold leading-[1.3] tracking-tight text-[var(--gym-ink,#111111)]",
                  isRtl ? "font-arabic" : "font-heading",
                )}
                title={title}
              >
                {title}
              </motion.h1>
            </AnimatePresence>

            <span className="hidden shrink-0 items-center rounded-full bg-[var(--gym-lime,#fb5001)]/20 px-2.5 py-0.5 text-[11px] font-bold leading-none text-[var(--gym-ink,#111111)] md:inline-flex">
              {areaLabel}
            </span>
          </div>
        </div>

        {/* Center: Search (Desktop only) */}
        <label className="relative mx-auto hidden min-w-0 max-w-[480px] flex-1 md:block">
          <span className="pointer-events-none absolute inset-y-0 start-4 inline-flex items-center text-[var(--gym-muted,#4e5151)]/55">
            <Search className="size-[18px]" strokeWidth={1.8} />
          </span>
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t("dashboard.searchPlaceholder")}
            className={cn(
              "h-11 w-full rounded-full border-0 bg-white pe-4 ps-11",
              "font-heading text-[14px] font-medium text-[var(--gym-ink,#111111)]",
              "shadow-[0_8px_24px_rgba(0,0,0,0.06)] outline-none",
              "placeholder:font-normal placeholder:text-[var(--gym-muted,#4e5151)]/55",
              "transition-[box-shadow] focus:shadow-[0_10px_28px_rgba(0,0,0,0.1)]",
            )}
          />
        </label>

        {/* Trailing Side: website + language switcher + profile */}
        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2.5">
          <Link
            to={APP_ROUTES.public.home}
            className="hidden h-10 lg:h-11 items-center justify-center rounded-full bg-[var(--gym-ink,#111111)] px-4 lg:px-5 text-[12.5px] lg:text-[13px] font-bold text-white transition-opacity hover:opacity-90 xl:inline-flex"
          >
            {t("dashboard.website")}
          </Link>

          <LanguageSwitcher variant="dashboard" />

          <ProfileMenu onRequestSignOut={onSignOut} />
        </div>
      </div>

      {/* Mobile search */}
      <label className="relative mt-2.5 block md:hidden">
        <span className="pointer-events-none absolute inset-y-0 start-3.5 inline-flex items-center text-[var(--gym-muted,#4e5151)]/55">
          <Search className="size-[17px]" strokeWidth={1.8} />
        </span>
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={t("dashboard.searchPlaceholder")}
          className={cn(
            "h-10 w-full rounded-full border-0 bg-white pe-4 ps-10",
            "text-[13.5px] font-medium text-[var(--gym-ink,#111111)]",
            "shadow-[0_4px_16px_rgba(0,0,0,0.05)] outline-none",
            "placeholder:font-normal placeholder:text-[var(--gym-muted,#4e5151)]/55",
            isRtl ? "font-arabic" : "font-heading",
          )}
        />
      </label>
    </header>
  )
}
