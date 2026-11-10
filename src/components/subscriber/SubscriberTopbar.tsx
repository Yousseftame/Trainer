import { useMemo, useState } from "react"
import { Link } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { AnimatePresence, motion } from "motion/react"
import { Dumbbell, PanelLeft, Search, Sparkles } from "lucide-react"
import { ProfileMenu } from "@/components/dashboard/ProfileMenu"
import { LanguageSwitcher } from "@/components/shared/LanguageSwitcher"
import { APP_ROUTES } from "@/config/constants"
import { useAuth } from "@/features/auth/auth-context"
import { pickCurrentSubscription } from "@/features/subscriptions/entitlements"
import {
  usePackageByIdQuery,
  useSubscriberSubscriptionsQuery,
} from "@/features/subscriptions/hooks"
import { useLocale } from "@/hooks/useLocale"
import { cn } from "@/lib/utils"

type SubscriberTopbarProps = {
  title: string
  areaLabel: string
  onSidebarToggle: () => void
  onSignOut?: () => void
  className?: string
}

export function SubscriberTopbar({
  title,
  areaLabel,
  onSidebarToggle,
  onSignOut,
  className,
}: SubscriberTopbarProps) {
  const { t } = useTranslation()
  const { locale } = useLocale()
  const isAr = locale === "ar"
  const { user } = useAuth()
  const [query, setQuery] = useState("")

  const { data: subscriptions = [] } = useSubscriberSubscriptionsQuery(user?.uid)
  const sub = useMemo(
    () => pickCurrentSubscription(subscriptions),
    [subscriptions],
  )
  const { data: pkg } = usePackageByIdQuery(sub?.packageId)

  return (
    <header
      className={cn(
        "z-30 shrink-0 bg-[#F4F4F4] px-4 pt-[max(0.875rem,calc(0.5rem+env(safe-area-inset-top,0px)))] pb-2.5 sm:px-6 sm:pt-4 sm:pb-3 lg:px-7",
        className,
      )}
    >
      {/* Mobile Top Bar (<lg) */}
      <div className="flex items-center justify-between lg:hidden">
        <Link
          to={APP_ROUTES.subscriber.root}
          className="flex items-center gap-2.5 group"
        >
          <span className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-[var(--gym-ink,#111111)] text-[var(--gym-lime,#fb5001)] shadow-md transition-transform group-active:scale-95">
            <Dumbbell className="size-5" />
          </span>
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="font-heading text-[16px] font-extrabold tracking-tight text-[var(--gym-ink,#111111)]">
                DERPYFIT
              </span>
              <span className="size-1.5 rounded-full bg-[var(--gym-lime,#fb5001)]" />
            </div>
            {pkg ? (
              <span className="text-[11px] font-bold text-[#8c8c8c]">
                {pkg.name[locale]}
              </span>
            ) : (
              <span className="text-[11px] font-bold text-[#8c8c8c]">
                {isAr ? "بوابة المشترك" : "Subscriber Portal"}
              </span>
            )}
          </div>
        </Link>

        <div className="flex items-center gap-2">
          <LanguageSwitcher variant="dashboard" />
          <ProfileMenu onRequestSignOut={onSignOut} />
        </div>
      </div>

      {/* Desktop Top Bar (>=lg) */}
      <div className="hidden lg:flex lg:items-center lg:gap-4">
        {/* Left: toggle + title + badge */}
        <div className="flex min-w-0 shrink-0 items-center gap-3">
          <button
            type="button"
            onClick={onSidebarToggle}
            className="inline-flex size-11 shrink-0 items-center justify-center rounded-full bg-white text-[var(--gym-ink,#111111)] shadow-[0_8px_24px_rgba(0,0,0,0.08)] transition-transform active:scale-[0.97]"
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
                className="min-w-0 truncate font-heading text-[22px] font-extrabold leading-[1.35] tracking-tight text-[var(--gym-ink,#111111)]"
              >
                {title}
              </motion.h1>
            </AnimatePresence>

            <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-[var(--gym-lime,#fb5001)]/20 px-3 py-1 text-[12px] font-bold text-[var(--gym-ink,#111111)]">
              <Sparkles className="size-3 text-[var(--gym-lime,#fb5001)]" />
              <span>{areaLabel}</span>
            </span>
          </div>
        </div>

        {/* Center: Search */}
        <label className="relative mx-auto hidden min-w-0 max-w-[500px] flex-1 xl:block">
          <span className="pointer-events-none absolute inset-y-0 start-4 inline-flex items-center text-[var(--gym-muted,#4e5151)]/55">
            <Search className="size-[18px]" strokeWidth={1.8} />
          </span>
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={isAr ? "بحث في التمارين، الوجبات، والمكتبة..." : "Search workouts, meals, library..."}
            className={cn(
              "h-11 w-full rounded-full border-0 bg-white pe-4 ps-11",
              "font-heading text-[14px] font-medium text-[var(--gym-ink,#111111)]",
              "shadow-[0_8px_24px_rgba(0,0,0,0.06)] outline-none",
              "placeholder:font-normal placeholder:text-[var(--gym-muted,#4e5151)]/55",
              "transition-[box-shadow] focus:shadow-[0_10px_28px_rgba(0,0,0,0.1)]",
            )}
          />
        </label>

        {/* Right: website + language + profile */}
        <div className="ms-auto flex shrink-0 items-center gap-2.5">
          <Link
            to={APP_ROUTES.public.home}
            className="hidden h-11 items-center justify-center rounded-full bg-[var(--gym-ink,#111111)] px-5 text-[13px] font-bold text-white transition-opacity hover:opacity-90 sm:inline-flex"
          >
            {t("dashboard.website")}
          </Link>

          <LanguageSwitcher variant="dashboard" />
          <ProfileMenu onRequestSignOut={onSignOut} />
        </div>
      </div>
    </header>
  )
}

