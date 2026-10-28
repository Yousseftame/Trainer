import { useState } from "react"
import { Link } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { AnimatePresence, motion } from "motion/react"
import { PanelLeft, Search } from "lucide-react"
import { ProfileMenu } from "@/components/dashboard/ProfileMenu"
import { LanguageSwitcher } from "@/components/shared/LanguageSwitcher"
import { APP_ROUTES } from "@/config/constants"
import { cn } from "@/lib/utils"

type DashboardTopbarProps = {
  title: string
  areaLabel: string
  onSidebarToggle: () => void
  className?: string
}

export function DashboardTopbar({
  title,
  areaLabel,
  onSidebarToggle,
  className,
}: DashboardTopbarProps) {
  const { t } = useTranslation()
  const [query, setQuery] = useState("")

  return (
    <header
      className={cn(
        "z-50 shrink-0 bg-[#F4F4F4] px-4 pt-4 pb-3 sm:px-6 sm:pt-5 sm:pb-3.5 lg:px-7",
        className,
      )}
    >
      <div className="flex items-center gap-3 sm:gap-4">
        {/* Left: toggle + title + badge */}
        <div className="flex min-w-0 shrink-0 items-center gap-3">
          <button
            type="button"
            onClick={onSidebarToggle}
            className="inline-flex size-11 shrink-0 items-center justify-center rounded-full bg-white text-[var(--gym-ink,#063434)] shadow-[0_8px_24px_rgba(6,52,52,0.08)] transition-transform active:scale-[0.97]"
            aria-label={t("nav.openMenu")}
          >
            <PanelLeft className="size-5 rtl:-scale-x-100" strokeWidth={1.8} />
          </button>

          <div className="flex min-w-0 items-center gap-2.5">
            <AnimatePresence mode="wait" initial={false}>
              <motion.h1
                key={title}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                className="min-w-0 truncate font-heading text-[20px] font-extrabold leading-[1.35] tracking-tight text-[var(--gym-ink,#063434)] sm:text-[22px]"
              >
                {title}
              </motion.h1>
            </AnimatePresence>

            <span className="hidden shrink-0 items-center rounded-full bg-[var(--gym-lime,#b8fe22)]/35 px-3 py-1 text-[12px] font-semibold leading-none text-[var(--gym-ink,#063434)] sm:inline-flex">
              {areaLabel}
            </span>
          </div>
        </div>

        {/* Center: search */}
        <label className="relative mx-auto hidden min-w-0 max-w-[520px] flex-1 md:block">
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
              "font-heading text-[14px] font-medium text-[var(--gym-ink,#063434)]",
              "shadow-[0_8px_24px_rgba(6,52,52,0.06)] outline-none",
              "placeholder:font-normal placeholder:text-[var(--gym-muted,#4e5151)]/55",
              "transition-[box-shadow] focus:shadow-[0_10px_28px_rgba(6,52,52,0.1)]",
            )}
          />
        </label>

        {/* Right: website + language + profile */}
        <div className="ms-auto flex shrink-0 items-center gap-2 sm:gap-2.5">
          <Link
            to={APP_ROUTES.public.home}
            className="hidden h-11 items-center justify-center rounded-full bg-[var(--gym-ink,#063434)] px-5 text-[13px] font-bold text-white transition-opacity hover:opacity-90 sm:inline-flex"
          >
            {t("dashboard.website")}
          </Link>

          <LanguageSwitcher variant="dashboard" />

          <ProfileMenu />
        </div>
      </div>

      {/* Mobile search */}
      <label className="relative mt-3 block md:hidden">
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
            "font-heading text-[14px] font-medium text-[var(--gym-ink,#063434)]",
            "shadow-[0_8px_24px_rgba(6,52,52,0.06)] outline-none",
            "placeholder:font-normal placeholder:text-[var(--gym-muted,#4e5151)]/55",
          )}
        />
      </label>
    </header>
  )
}
