import { useMemo } from "react"
import { Link } from "react-router-dom"
import {
  Activity,
  ArrowLeft,
  ArrowRight,
  HeartPulse,
  ShieldAlert,
} from "lucide-react"
import { APP_ROUTES } from "@/config/constants"
import { useSubscriberPTQuery } from "@/features/physicalTherapy/hooks"
import { usePanelSubscriber } from "@/features/subscribers/use-panel-subscriber"
import { useLocale } from "@/hooks/useLocale"
import { cn } from "@/lib/utils"

/**
 * Live rehab status strip on the subscriber overview — only renders when an
 * open (active/recovering) PT case exists for the signed-in member.
 */
export function SubscriberPTSection() {
  const { locale, isRtl } = useLocale()
  const isAr = locale === "ar"
  const { subscriberId } = usePanelSubscriber()
  const { data: ptRecord, isLoading } = useSubscriberPTQuery(subscriberId)

  const openCase = useMemo(() => {
    if (!ptRecord) return null
    if (ptRecord.status === "cleared") return null
    return ptRecord
  }, [ptRecord])

  if (isLoading || !openCase) return null

  const ArrowIcon = isRtl ? ArrowLeft : ArrowRight

  return (
    <section dir={isRtl ? "rtl" : "ltr"} className="space-y-3 select-none">
      <div className="px-1">
        <h2
          className={cn(
            "text-[18px] sm:text-[20px] font-extrabold text-[var(--gym-ink,#111111)] tracking-tight",
            isAr ? "font-arabic" : "font-heading",
          )}
        >
          {isAr ? "التأهيل الحركي" : "Active Rehab Protocol"}
        </h2>
        <p className="text-[12px] sm:text-[13px] font-medium text-[#8c8c8c]">
          {isAr
            ? "موانع الحركة والبدائل الآمنة المرتبطة بجدولك التدريبي"
            : "Movement restrictions and safe substitutes linked to your training"}
        </p>
      </div>

      <Link
        to={APP_ROUTES.subscriber.physicalTherapy}
        className="group flex flex-col gap-3 rounded-[22px] border border-rose-200/70 bg-gradient-to-br from-rose-50 via-white to-amber-50/40 p-4 sm:p-5 shadow-xs transition hover:border-rose-300 hover:shadow-md"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-[var(--gym-ink,#111111)] text-[var(--gym-lime,#fb5001)]">
              <HeartPulse className="size-5" strokeWidth={2} />
            </span>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <p
                  className={cn(
                    "truncate text-[15px] sm:text-[16px] font-extrabold text-[var(--gym-ink,#111111)]",
                    isAr ? "font-arabic" : "font-heading",
                  )}
                >
                  {openCase.injuryTitle[locale] || openCase.injuryTitle.en}
                </p>
                <span
                  className={cn(
                    "inline-flex items-center rounded-full px-2 py-0.5 text-[10.5px] font-bold",
                    openCase.status === "active"
                      ? "bg-rose-100 text-rose-800"
                      : "bg-amber-100 text-amber-900",
                  )}
                >
                  {openCase.status === "active"
                    ? isAr
                      ? "تأهيل نشط"
                      : "Active"
                    : isAr
                      ? "استشفاء"
                      : "Recovering"}
                </span>
              </div>
              <p className="mt-1 text-[12.5px] font-medium text-[#6B7280]">
                {openCase.restrictions.length}{" "}
                {isAr ? "موانع حركة" : "restrictions"} ·{" "}
                {openCase.rehabExercises.length}{" "}
                {isAr ? "تمارين تأهيل" : "rehab drills"}
              </p>
            </div>
          </div>

          <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-[var(--gym-ink,#111111)] px-3.5 py-2 text-[12px] font-extrabold text-white transition group-hover:bg-[var(--gym-lime,#fb5001)]">
            <span>{isAr ? "عرض البروتوكول" : "View protocol"}</span>
            <ArrowIcon className="size-3.5 rtl:rotate-180" strokeWidth={2.5} />
          </span>
        </div>

        {openCase.restrictions.length > 0 ? (
          <div className="flex flex-wrap items-center gap-2 rounded-xl bg-white/80 px-3 py-2 border border-rose-100">
            <ShieldAlert className="size-3.5 text-rose-600 shrink-0" />
            <span className="text-[11.5px] font-bold text-rose-900">
              {isAr
                ? "تم دمج البدائل الآمنة في جدول تمارينك"
                : "Safe substitutes are integrated into your workout plan"}
            </span>
            <span className="inline-flex items-center gap-1 rounded-md bg-black/5 px-2 py-0.5 text-[10.5px] font-bold text-[#555]">
              <Activity className="size-3" />
              {isAr ? "متصل بالتمارين" : "Linked to workouts"}
            </span>
          </div>
        ) : null}
      </Link>
    </section>
  )
}
