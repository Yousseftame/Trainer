import { Link } from "react-router-dom"
import { ChevronLeft, ChevronRight } from "lucide-react"
import adminBanner from "@/assets/admin.webp"
import { APP_ROUTES } from "@/config/constants"
import { useLocale } from "@/hooks/useLocale"
import { formatDate } from "@/lib/format"
import { cn } from "@/lib/utils"

export function SubscriberProgressHeroBanner() {
  const { locale, isRtl } = useLocale()
  const isAr = locale === "ar"

  const Chevron = isRtl ? ChevronLeft : ChevronRight
  const todayFormatted = formatDate(new Date().toISOString(), locale)

  return (
    <section
      dir={isRtl ? "rtl" : "ltr"}
      aria-label={isAr ? "تابع تقدمك" : "Track your progress"}
      className="relative isolate overflow-hidden rounded-[22px] bg-[var(--gym-ink,#063434)] sm:rounded-[28px] shadow-[0_12px_36px_rgba(6,52,52,0.22)] select-none"
    >
      {/* Background Athlete Image */}
      <img
        src={adminBanner}
        alt=""
        className="absolute inset-0 size-full object-cover object-[68%_center] select-none sm:object-[center_42%]"
        draggable={false}
      />

      {/* Mobile Teal Overlay */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 sm:hidden"
        style={{
          background:
            "linear-gradient(180deg, rgba(6,52,52,0.28) 0%, rgba(6,52,52,0.48) 40%, rgba(6,52,52,0.88) 100%)",
        }}
      />

      {/* Desktop Horizontal Teal Overlay */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 hidden sm:block rtl:-scale-x-100"
        style={{
          background:
            "linear-gradient(90deg, #063434 0%, rgba(6,52,52,0.92) 36%, rgba(6,52,52,0.45) 62%, rgba(6,52,52,0.12) 100%)",
        }}
      />

      {/* Desktop Vertical Teal Tint */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 hidden sm:block bg-[linear-gradient(180deg,rgba(6,52,52,0.15)_0%,rgba(6,52,52,0.55)_100%)]"
      />

      {/* Foreground Content Row */}
      <div className="relative z-10 flex flex-col justify-end gap-4 p-5 sm:min-h-[228px] sm:flex-row sm:items-end sm:justify-between sm:gap-6 sm:p-7 lg:min-h-[248px] lg:p-8">
        <div className="min-w-0 max-w-2xl">
          {/* Date Label */}
          <p
            className={cn(
              "text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--gym-lime,#fb5001)] sm:text-[12px]",
              isAr ? "font-arabic" : "font-sans",
            )}
          >
            {todayFormatted}
          </p>

          {/* Title */}
          <h2
            className={cn(
              "mt-1 text-[22px] font-extrabold leading-[1.15] tracking-tight text-white sm:mt-2 sm:text-[32px] lg:text-[38px]",
              isAr ? "font-arabic" : "font-heading",
            )}
          >
            {isAr ? "تابع تقدمك !" : "Track Your Progress !"}
          </h2>

          {/* Subtitle */}
          <p
            className={cn(
              "mt-1.5 max-w-lg text-[13px] font-medium leading-relaxed text-white/85 sm:mt-2 sm:text-[15px]",
              isAr ? "font-arabic" : "font-sans",
            )}
          >
            {isAr
              ? "سجل تقدمك باستمرار لتبقي على قمة رحلتك و تحقق اهدافك اسرع"
              : "Log your progress consistently to stay on top of your fitness journey and reach your goals faster."}
          </p>
        </div>

        {/* Action Button */}
        <Link
          to={APP_ROUTES.subscriber.progress}
          className={cn(
            "inline-flex h-10 w-fit shrink-0 items-center justify-center gap-1.5 self-start rounded-full bg-[var(--gym-lime,#fb5001)] px-5 text-[13px] font-extrabold text-white shadow-[0_10px_28px_rgba(251,80,1,0.38)] rtl:self-end sm:h-11 sm:gap-2 sm:self-auto sm:px-6 sm:text-[14px] sm:rtl:self-auto hover:bg-[#e04500] hover:scale-105 active:scale-95 transition-all duration-200 border border-white/15",
            isAr ? "font-arabic" : "font-heading",
          )}
        >
          <span>{isAr ? "سجل تقدمك" : "Log Progress"}</span>
          <Chevron className="size-3.5 sm:size-4" strokeWidth={2.5} />
        </Link>
      </div>
    </section>
  )
}
