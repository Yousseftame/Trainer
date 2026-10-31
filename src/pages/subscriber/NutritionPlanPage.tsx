import { useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import {
  Apple,
  Check,
  CheckCircle2,
  Droplet,
  FileText,
  Flame,
  ShieldAlert,
} from "lucide-react"
import { StatusBadge } from "@/components/dashboard/StatusBadge"
import { useAuth } from "@/features/auth/auth-context"
import {
  NUTRITION_DISCLAIMER,
  dayMacros,
  resolveBilingualText,
} from "@/features/nutrition/demo"
import {
  useLogNutritionAdherenceMutation,
  useNutritionLogsQuery,
  useNutritionProgramsQuery,
} from "@/features/nutrition/hooks"
import { useSubscribersQuery } from "@/features/subscribers/hooks"
import { useDocumentTitle } from "@/hooks/useDocumentTitle"
import { useLocale } from "@/hooks/useLocale"
import { appToast } from "@/lib/toast"
import { cn } from "@/lib/utils"

const WEEKDAY_NAMES_EN = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
const WEEKDAY_NAMES_AR = ["الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت", "الأحد"]

export function NutritionPlanPage() {
  const { t } = useTranslation()
  const { locale } = useLocale()
  const isAr = locale === "ar"
  const { user } = useAuth()
  useDocumentTitle(t("nav.nutrition"))

  const { data: subscribers = [] } = useSubscribersQuery()
  const { data: allPrograms = [] } = useNutritionProgramsQuery()

  const currentSubscriber = useMemo(() => {
    if (!user) return subscribers[0]
    return (
      subscribers.find(
        (s) =>
          s.id === user.uid ||
          s.email.toLowerCase() === (user.email ?? "").toLowerCase(),
      ) ?? subscribers[0]
    )
  }, [subscribers, user])

  const activePlan = useMemo(() => {
    if (!currentSubscriber) return null
    return (
      allPrograms.find(
        (p) => p.subscriberId === currentSubscriber.id && p.status === "active",
      ) ?? null
    )
  }, [allPrograms, currentSubscriber])

  const { data: logs = [] } = useNutritionLogsQuery(currentSubscriber?.id)
  const logMutation = useLogNutritionAdherenceMutation()

  const [weekday, setWeekday] = useState(0)
  const [logging, setLogging] = useState(false)

  const selectedDay =
    activePlan?.days.find((d) => d.weekday === weekday) ?? activePlan?.days[0]
  const dayMacroSummary = dayMacros(selectedDay)

  const todayIso = new Date().toISOString().slice(0, 10)
  const isTodayLogged = logs.some((l) => l.date === todayIso)

  async function handleLogTodayAdherence(status: "adhered" | "mostly") {
    if (!activePlan || !currentSubscriber) return
    setLogging(true)
    try {
      await logMutation.mutateAsync({
        subscriberId: currentSubscriber.id,
        programId: activePlan.id,
        date: todayIso,
        status,
        caloriesActual: activePlan.targetCalories,
        waterLitersActual: activePlan.targetWaterLiters || 3.0,
        notes:
          status === "adhered"
            ? isAr
              ? "التزام كامل بالوجبات والماء"
              : "Followed plan fully"
            : isAr
              ? "التزام جزئي بمعظم الوجبات"
              : "Mostly followed meals",
      })
      appToast.success(
        isAr ? "تم تسجيل الالتزام بنجاح!" : "Today's nutrition adherence logged!",
      )
    } catch {
      appToast.error(isAr ? "فشل تسجيل الالتزام" : "Failed to log adherence")
    } finally {
      setLogging(false)
    }
  }

  return (
    <div className="flex flex-col gap-5">
      {!activePlan ? (
        <div className="flex min-h-60 flex-col items-center justify-center rounded-[24px] bg-white p-8 text-center shadow-xs">
          <Apple className="size-10 mb-3 text-[#8c8c8c] stroke-1" />
          <h2 className="font-heading text-[18px] font-extrabold text-[var(--gym-ink,#063434)]">
            {isAr ? "لا توجد خطة تغذية مخصصة حالياً" : "No active nutrition plan"}
          </h2>
          <p className="mt-1 max-w-md text-[13px] text-[#8c8c8c]">
            {isAr
              ? "يقوم المدرب بتجهيز خطتك الغذائية والسعرات المناسبة لأهدافك."
              : "Your coach will assign your customized nutrition plan soon."}
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {/* Plan Header Card */}
          <div className="rounded-[24px] bg-white p-5 sm:p-6 shadow-xs flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="font-heading text-[22px] font-extrabold text-[var(--gym-ink,#063434)]">
                  {activePlan.title[locale]}
                </h1>
                <StatusBadge
                  label={t(`admin.nutrition.format.${activePlan.format}`)}
                  tone={activePlan.format === "pdf" ? "info" : "success"}
                />
                <StatusBadge label={`v${activePlan.version}`} tone="muted" />
              </div>
              <p className="mt-1 text-[13px] font-medium text-[#8c8c8c]">
                {activePlan.description?.[locale] ||
                  `${activePlan.targetCalories ?? 2000} kcal / ${isAr ? "يوم" : "day"}`}
              </p>
            </div>

            {/* Quick Adherence Button */}
            <div className="flex items-center gap-2">
              {isTodayLogged ? (
                <div className="inline-flex h-11 items-center gap-2 rounded-full bg-emerald-600 px-5 text-[13px] font-bold text-white shadow-sm">
                  <CheckCircle2 className="size-4" />
                  <span>{isAr ? "تم تسجيل التزام اليوم" : "Today Logged"}</span>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => handleLogTodayAdherence("adhered")}
                  disabled={logging}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-[var(--gym-ink,#063434)] px-6 text-[13px] font-bold text-white shadow-sm transition hover:opacity-95 disabled:opacity-50"
                >
                  <Check className="size-4" strokeWidth={2.5} />
                  <span>
                    {logging
                      ? isAr
                        ? "جاري الحفظ..."
                        : "Logging..."
                      : isAr
                        ? "تسجيل الالتزام بالخطة اليوم"
                        : "Log Today Adherence"}
                  </span>
                </button>
              )}
            </div>
          </div>

          {/* Medical & Practice Disclaimer Notice */}
          <div className="rounded-2xl border border-amber-200/90 bg-amber-50/80 p-4">
            <div className="flex items-start gap-3">
              <ShieldAlert className="size-5 shrink-0 text-amber-700 mt-0.5" />
              <div>
                <p className="text-[12px] font-bold text-amber-900">
                  {isAr ? "إشعار التوجيه الرياضي والغذائي" : "Sports Nutrition Practice Disclaimer"}
                </p>
                <p className="mt-0.5 text-[12px] leading-relaxed text-amber-800">
                  {NUTRITION_DISCLAIMER[locale]}
                </p>
              </div>
            </div>
          </div>

          {/* Daily Targets Strip */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-2xl bg-white p-4 shadow-2xs">
              <div className="flex items-center gap-2 text-[#8c8c8c] text-[12px] font-bold">
                <Flame className="size-4 text-amber-500" />
                <span>{isAr ? "السعرات اليومية" : "Daily Calories"}</span>
              </div>
              <p className="mt-2 font-heading text-[20px] font-extrabold text-[var(--gym-ink,#063434)]">
                {activePlan.targetCalories ?? 2000} <span className="text-[13px] font-medium text-[#8c8c8c]">kcal</span>
              </p>
            </div>

            <div className="rounded-2xl bg-white p-4 shadow-2xs">
              <span className="text-[#8c8c8c] text-[12px] font-bold">
                {isAr ? "البروتين" : "Protein Target"}
              </span>
              <p className="mt-2 font-heading text-[20px] font-extrabold text-blue-700">
                {activePlan.macros?.proteinGrams ?? 150} <span className="text-[13px] font-medium text-[#8c8c8c]">g</span>
              </p>
            </div>

            <div className="rounded-2xl bg-white p-4 shadow-2xs">
              <span className="text-[#8c8c8c] text-[12px] font-bold">
                {isAr ? "الكاربوهيدرات" : "Carbohydrates"}
              </span>
              <p className="mt-2 font-heading text-[20px] font-extrabold text-amber-700">
                {activePlan.macros?.carbsGrams ?? 200} <span className="text-[13px] font-medium text-[#8c8c8c]">g</span>
              </p>
            </div>

            <div className="rounded-2xl bg-white p-4 shadow-2xs">
              <div className="flex items-center gap-2 text-[#8c8c8c] text-[12px] font-bold">
                <Droplet className="size-4 text-blue-500" />
                <span>{isAr ? "الماء المستهدف" : "Hydration"}</span>
              </div>
              <p className="mt-2 font-heading text-[20px] font-extrabold text-[var(--gym-ink,#063434)]">
                {activePlan.targetWaterLiters ?? 3.0} <span className="text-[13px] font-medium text-[#8c8c8c]">L / day</span>
              </p>
            </div>
          </div>

          {/* PDF Format Display */}
          {activePlan.format === "pdf" ? (
            <div className="flex min-h-56 flex-col items-center justify-center rounded-[24px] bg-white p-8 text-center shadow-xs">
              <FileText className="size-12 text-[var(--gym-ink,#063434)] mb-3" strokeWidth={1.5} />
              <h3 className="font-heading text-[18px] font-bold text-[var(--gym-ink,#063434)]">
                {activePlan.pdfName?.[locale] || "Nutrition Plan PDF"}
              </h3>
              <p className="mt-1 text-[13px] text-[#8c8c8c]">
                {t("admin.nutrition.pdfHint")}
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {/* Weekday Selector */}
              <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
                {activePlan.days.map((d) => {
                  const active = d.weekday === weekday
                  return (
                    <button
                      key={d.id}
                      type="button"
                      onClick={() => setWeekday(d.weekday)}
                      className={cn(
                        "flex min-h-[70px] flex-col items-center justify-center rounded-2xl py-2 px-1 text-center transition shadow-2xs overflow-hidden",
                        active
                          ? "bg-[var(--gym-ink,#063434)] text-white"
                          : "bg-white text-[var(--gym-ink,#063434)] hover:bg-[#F9F9F9]",
                      )}
                    >
                      <span className="block w-full max-w-full truncate px-0.5 text-center text-[11px] font-extrabold uppercase">
                        {t(`admin.nutrition.weekdays.${d.weekday}`, {
                          defaultValue: isAr ? WEEKDAY_NAMES_AR[d.weekday] : WEEKDAY_NAMES_EN[d.weekday],
                        })}
                      </span>
                      <span className="mt-1 text-[10px] font-semibold">
                        {d.meals.length} {isAr ? "وجبات" : "meals"}
                      </span>
                    </button>
                  )
                })}
              </div>

              {/* Day Meals Container */}
              <div className="rounded-[24px] bg-white p-5 sm:p-6 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-[#F0F0F0] pb-3">
                  <h3 className="font-heading text-[17px] font-extrabold text-[var(--gym-ink,#063434)]">
                    {t(`admin.nutrition.weekdays.${selectedDay?.weekday ?? 0}`, {
                      defaultValue:
                        isAr
                          ? WEEKDAY_NAMES_AR[selectedDay?.weekday ?? 0]
                          : WEEKDAY_NAMES_EN[selectedDay?.weekday ?? 0],
                    })}
                  </h3>
                  {dayMacroSummary ? (
                    <div className="flex items-center gap-2 text-[11px] font-bold">
                      <span className="rounded-full bg-[#F4F4F4] px-2.5 py-1 text-[var(--gym-ink,#063434)]">
                        {dayMacroSummary.calories} kcal
                      </span>
                      <span className="text-blue-700">P: {dayMacroSummary.protein}g</span>
                      <span className="text-amber-700">C: {dayMacroSummary.carbs}g</span>
                      <span className="text-purple-700">F: {dayMacroSummary.fats}g</span>
                    </div>
                  ) : null}
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  {selectedDay?.meals.map((slot) => (
                    <div
                      key={slot.id}
                      className="rounded-2xl border border-[#ECECEC] bg-[#FBFBFB] p-4 space-y-2.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-heading text-[14px] font-extrabold text-[var(--gym-ink,#063434)]">
                          {t(`admin.nutrition.slots.${slot.slot}`)}
                        </span>
                        <span className="text-[11px] font-bold text-[#8c8c8c]">
                          {slot.items.length} {isAr ? "أصناف" : "foods"}
                        </span>
                      </div>

                      <ul className="space-y-2">
                        {slot.items.map((item) => {
                          const name = resolveBilingualText(item.name, locale)
                          const qty = resolveBilingualText(item.quantity, locale)
                          const notes = resolveBilingualText(item.notes, locale)

                          return (
                            <li
                              key={item.id}
                              className="rounded-xl bg-white p-3 shadow-2xs space-y-1.5"
                            >
                              <div className="flex items-center justify-between gap-2">
                                <p className="font-heading text-[13px] font-bold text-[var(--gym-ink,#063434)]">
                                  {name}
                                </p>
                                {qty ? (
                                  <span className="rounded-full bg-[#F4F4F4] px-2 py-0.5 text-[11px] font-bold text-[#6B7280]">
                                    {qty}
                                  </span>
                                ) : null}
                              </div>

                              <div className="flex flex-wrap items-center gap-2 text-[11px] font-bold">
                                {item.calories ? (
                                  <span className="text-[var(--gym-ink,#063434)]">
                                    {item.calories} kcal
                                  </span>
                                ) : null}
                                {item.protein ? (
                                  <span className="text-blue-700">P: {item.protein}g</span>
                                ) : null}
                                {item.carbs ? (
                                  <span className="text-amber-700">C: {item.carbs}g</span>
                                ) : null}
                                {item.fats ? (
                                  <span className="text-purple-700">F: {item.fats}g</span>
                                ) : null}
                              </div>

                              {notes ? (
                                <p className="text-[11px] leading-relaxed text-[#8c8c8c]">
                                  {notes}
                                </p>
                              ) : null}
                            </li>
                          )
                        })}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
