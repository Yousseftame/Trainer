import { useMemo } from "react"
import { Link } from "react-router-dom"
import { motion } from "motion/react"
import heroPattern from "@/assets/hero-pattern.avif"
import { BRAND_LOGO_ON_LIGHT } from "@/components/shared/BrandLogo"
import { APP_ROUTES } from "@/config/constants"
import { useAuth } from "@/features/auth/auth-context"
import {
  pickCurrentSubscription,
  resolveEffectiveSubscriptionStatus,
} from "@/features/subscriptions/entitlements"
import {
  usePackageByIdQuery,
  useSubscriberSubscriptionsQuery,
} from "@/features/subscriptions/hooks"
import { useLocale } from "@/hooks/useLocale"
import { cn } from "@/lib/utils"

export function SubscriberPackageBanner() {
  const { locale, isRtl } = useLocale()
  const isAr = locale === "ar"
  const { user } = useAuth()
  const subscriberId = user?.uid

  const { data: subscriptions = [] } = useSubscriberSubscriptionsQuery(
    subscriberId,
  )
  const sub = useMemo(
    () => pickCurrentSubscription(subscriptions),
    [subscriptions],
  )
  const { data: pkg } = usePackageByIdQuery(sub?.packageId)
  const effectiveStatus = resolveEffectiveSubscriptionStatus(sub)

  const { packageName, formattedStart, daysRemainingLabel, progressPercent, statusTone } =
    useMemo(() => {
      const name =
        pkg?.name[locale] ??
        sub?.packageName?.[locale] ??
        (isAr ? "لا توجد باقة نشطة" : "No active package")

      if (!sub?.startsAt || !sub?.endsAt) {
        return {
          packageName: name,
          formattedStart: "—",
          daysRemainingLabel: isAr ? "غير محدد" : "Not set",
          progressPercent: 4,
          statusTone: "muted" as const,
        }
      }

      const startDate = new Date(sub.startsAt)
      const endDate = new Date(sub.endsAt)
      const now = new Date()

      const day = String(startDate.getDate()).padStart(2, "0")
      const month = String(startDate.getMonth() + 1).padStart(2, "0")
      const year = startDate.getFullYear()
      const formatted = `${day}-${month}-${year}`

      const startMs = startDate.getTime()
      const endMs = endDate.getTime()
      const nowMs = now.getTime()
      const totalDuration = Math.max(1, endMs - startMs)
      const elapsed = Math.min(Math.max(0, nowMs - startMs), totalDuration)
      const pct = Math.min(
        100,
        Math.max(4, Math.round((elapsed / totalDuration) * 100)),
      )

      const remainingDays = Math.ceil((endMs - nowMs) / (1000 * 60 * 60 * 24))
      let remainingLabel: string
      let tone: "active" | "warning" | "muted" = "active"

      if (effectiveStatus === "suspended") {
        remainingLabel = isAr ? "موقوف" : "Suspended"
        tone = "warning"
      } else if (effectiveStatus === "expired" || remainingDays < 0) {
        remainingLabel = isAr ? "منتهٍ" : "Expired"
        tone = "muted"
      } else if (effectiveStatus !== "active") {
        remainingLabel = effectiveStatus
          ? String(effectiveStatus)
          : isAr
            ? "غير نشط"
            : "Inactive"
        tone = "muted"
      } else {
        if (isAr) {
          if (remainingDays === 1) remainingLabel = "يوم واحد متبقي"
          else if (remainingDays === 2) remainingLabel = "يومان متبقيان"
          else if (remainingDays >= 3 && remainingDays <= 10)
            remainingLabel = `${remainingDays} أيام متبقية`
          else remainingLabel = `${remainingDays} يوماً متبقياً`
        } else {
          remainingLabel = `${remainingDays} days remaining`
        }
        if (remainingDays <= 7) tone = "warning"
      }

      return {
        packageName: name,
        formattedStart: formatted,
        daysRemainingLabel: remainingLabel,
        progressPercent: pct,
        statusTone: tone,
      }
    }, [sub, pkg, locale, isAr, effectiveStatus])

  return (
    <Link
      to={APP_ROUTES.subscriber.subscription}
      dir={isRtl ? "rtl" : "ltr"}
      aria-label={packageName}
      className="group relative block w-full cursor-pointer select-none overflow-hidden rounded-[22px] border border-white/10 bg-gradient-to-r from-[#24030c] via-[#2c0410] to-[#190208] p-4 text-white shadow-[0_12px_32px_rgba(36,3,12,0.22)] transition-all duration-300 hover:border-white/20 hover:shadow-[0_16px_40px_rgba(36,3,12,0.32)] active:scale-[0.995] sm:rounded-[26px] sm:p-5"
    >
      <img
        src={heroPattern}
        alt=""
        aria-hidden
        draggable={false}
        className="pointer-events-none absolute inset-0 size-full object-cover opacity-15 mix-blend-screen transition-opacity duration-300 group-hover:opacity-25"
      />

      <div
        aria-hidden
        className="pointer-events-none absolute -start-10 -top-10 size-32 rounded-full bg-[var(--gym-lime,#fb5001)]/15 blur-2xl"
      />

      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/25 to-transparent"
      />

      <div className="relative z-10 flex flex-col justify-between">
        <div className="flex items-center gap-3.5 sm:gap-4">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-white p-2 shadow-md transition-transform duration-300 group-hover:scale-105 sm:size-12">
            <img
              src={BRAND_LOGO_ON_LIGHT}
              alt="DerpyFit"
              className="size-full object-contain"
            />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h2
                className={cn(
                  "truncate text-[16px] font-extrabold leading-snug tracking-tight text-white sm:text-[18px]",
                  isAr ? "font-arabic" : "font-heading",
                )}
              >
                {packageName}
              </h2>

              {statusTone === "active" ? (
                <span
                  className="relative flex size-2 shrink-0 sm:size-2.5"
                  title={isAr ? "نشط" : "Active"}
                >
                  <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex size-2 rounded-full bg-emerald-500 sm:size-2.5" />
                </span>
              ) : (
                <span
                  className={cn(
                    "size-2 shrink-0 rounded-full sm:size-2.5",
                    statusTone === "warning" ? "bg-amber-400" : "bg-white/40",
                  )}
                  title={daysRemainingLabel}
                />
              )}
            </div>

            <div className="mt-0.5 flex flex-wrap items-center justify-between gap-x-4 gap-y-0.5 text-[12px] font-semibold text-white/80 sm:justify-start sm:gap-x-6 sm:text-[13px]">
              <span>
                {isAr ? `منضم ${formattedStart}` : `Joined ${formattedStart}`}
              </span>
              <span className="font-bold text-[var(--gym-lime,#fb5001)]">
                {daysRemainingLabel}
              </span>
            </div>
          </div>
        </div>

        <div className="mt-3.5 sm:mt-4">
          <div className="relative h-2 w-full overflow-hidden rounded-full border border-white/10 bg-black/40 p-[1px] shadow-inner sm:h-2.5">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progressPercent}%` }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              className="relative flex h-full items-center justify-end rounded-full bg-[var(--gym-lime,#fb5001)] shadow-[0_0_10px_rgba(251,80,1,0.7)]"
            >
              <span className="me-0.5 size-1.5 rounded-full bg-white shadow-sm sm:size-2" />
            </motion.div>
          </div>
        </div>
      </div>
    </Link>
  )
}
