import { useMemo } from "react"
import { Link } from "react-router-dom"
import { motion } from "motion/react"
import heroPattern from "@/assets/hero-pattern.avif"
import { BRAND_LOGO_ON_LIGHT } from "@/components/shared/BrandLogo"
import { APP_ROUTES } from "@/config/constants"
import { useAuth } from "@/features/auth/auth-context"
import {
  currentSubscriptionFor,
  getPackageById,
} from "@/features/subscriptions/demo"
import { useLocale } from "@/hooks/useLocale"
import { cn } from "@/lib/utils"

export function SubscriberPackageBanner() {
  const { locale, isRtl } = useLocale()
  const isAr = locale === "ar"
  const { user } = useAuth()

  // Get current subscription and corresponding package
  const sub = useMemo(
    () => (user?.uid ? currentSubscriptionFor(user.uid) : null),
    [user?.uid],
  )
  const pkg = useMemo(() => getPackageById(sub?.packageId), [sub?.packageId])

  // Calculation for dates and progress
  const { packageName, formattedStart, daysRemainingLabel, progressPercent } = useMemo(() => {
    const name =
      pkg?.name[locale] ??
      sub?.packageName?.[locale] ??
      (isAr ? "باقة تحوّل" : "Transform Plan")

    const startVal = sub?.startsAt ?? "2026-08-12T00:00:00.000Z"
    const endVal = sub?.endsAt ?? "2026-11-10T00:00:00.000Z"

    const startDate = new Date(startVal)
    const endDate = new Date(endVal)
    const now = new Date()

    // Compact date format DD-MM-YYYY
    const day = String(startDate.getDate()).padStart(2, "0")
    const month = String(startDate.getMonth() + 1).padStart(2, "0")
    const year = startDate.getFullYear()
    const formatted = `${day}-${month}-${year}`

    const startMs = startDate.getTime()
    const endMs = endDate.getTime()
    const nowMs = now.getTime()

    const totalDuration = Math.max(1, endMs - startMs)
    const elapsed = Math.min(Math.max(0, nowMs - startMs), totalDuration)
    const pct = Math.min(100, Math.max(4, Math.round((elapsed / totalDuration) * 100)))

    const remainingDays = Math.max(0, Math.ceil((endMs - nowMs) / (1000 * 60 * 60 * 24)))

    // Accurate human-friendly phrasing
    let remainingLabel = `${remainingDays} days remaining`
    if (isAr) {
      if (remainingDays === 1) remainingLabel = "يوم واحد متبقي"
      else if (remainingDays === 2) remainingLabel = "يومان متبقيان"
      else if (remainingDays >= 3 && remainingDays <= 10) remainingLabel = `${remainingDays} أيام متبقية`
      else remainingLabel = `${remainingDays} يوماً متبقياً`
    }

    return {
      packageName: name,
      formattedStart: formatted,
      daysRemainingLabel: remainingLabel,
      progressPercent: pct,
    }
  }, [sub, pkg, locale, isAr])

  return (
    <Link
      to={APP_ROUTES.subscriber.subscription}
      dir={isRtl ? "rtl" : "ltr"}
      aria-label={packageName}
      className="group relative block w-full overflow-hidden rounded-[22px] sm:rounded-[26px] bg-gradient-to-r from-[#24030c] via-[#2c0410] to-[#190208] p-4 sm:p-5 text-white shadow-[0_12px_32px_rgba(36,3,12,0.22)] border border-white/10 hover:border-white/20 hover:shadow-[0_16px_40px_rgba(36,3,12,0.32)] active:scale-[0.995] transition-all duration-300 select-none cursor-pointer"
    >
      {/* Website Hero Pattern subtle texture */}
      <img
        src={heroPattern}
        alt=""
        aria-hidden
        draggable={false}
        className="pointer-events-none absolute inset-0 size-full object-cover opacity-15 mix-blend-screen transition-opacity duration-300 group-hover:opacity-25"
      />

      {/* Ambient Backlight Glow behind Logo */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-10 -start-10 size-32 rounded-full bg-[var(--gym-lime,#fb5001)]/15 blur-2xl"
      />

      {/* Subtle top specular border line */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/25 to-transparent"
      />

      {/* Content Container */}
      <div className="relative z-10 flex flex-col justify-between">
        {/* Top Row: Logo Badge + Package Info */}
        <div className="flex items-center gap-3.5 sm:gap-4">
          {/* White Circular DerpyFit Logo Badge with specular rim */}
          <div className="flex size-11 sm:size-12 shrink-0 items-center justify-center rounded-full bg-white shadow-md p-2 group-hover:scale-105 transition-transform duration-300">
            <img
              src={BRAND_LOGO_ON_LIGHT}
              alt="DerpyFit"
              className="size-full object-contain"
            />
          </div>

          {/* Details */}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h2
                className={cn(
                  "truncate text-[16px] sm:text-[18px] font-extrabold text-white tracking-tight leading-snug",
                  isAr ? "font-arabic" : "font-heading",
                )}
              >
                {packageName}
              </h2>

              {/* Subtle Live Active Ping (Default Green Online Pulse) */}
              <span className="relative flex size-2 sm:size-2.5 shrink-0" title={isAr ? "نشط" : "Active"}>
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex size-2 sm:size-2.5 rounded-full bg-emerald-500" />
              </span>
            </div>

            {/* Dates & Remaining Days (Clean spacing, no grey dot) */}
            <div className="mt-0.5 flex flex-wrap items-center justify-between sm:justify-start gap-x-4 sm:gap-x-6 gap-y-0.5 text-[12px] sm:text-[13px] font-semibold text-white/80">
              <span>
                {isAr ? `منضم ${formattedStart}` : `Joined ${formattedStart}`}
              </span>
              <span className="text-[var(--gym-lime,#fb5001)] font-bold">
                {daysRemainingLabel}
              </span>
            </div>
          </div>
        </div>

        {/* Bottom Row: Slim Rounded Progress Line with Indicator Pill */}
        <div className="mt-3.5 sm:mt-4">
          <div className="relative h-2 sm:h-2.5 w-full overflow-hidden rounded-full bg-black/40 border border-white/10 p-[1px] shadow-inner">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progressPercent}%` }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              className="relative h-full rounded-full bg-[var(--gym-lime,#fb5001)] shadow-[0_0_10px_rgba(251,80,1,0.7)] flex items-center justify-end"
            >
              {/* White capsule pill indicator at the tip of the progress bar */}
              <span className="size-1.5 sm:size-2 rounded-full bg-white shadow-sm me-0.5" />
            </motion.div>
          </div>
        </div>
      </div>
    </Link>
  )
}
