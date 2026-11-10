import { useMemo } from "react"
import { Link } from "react-router-dom"
import {
  Apple,
  ArrowLeft,
  ArrowRight,
  Dumbbell,
  Flame,
  Timer,
  Zap,
} from "lucide-react"
import { APP_ROUTES } from "@/config/constants"
import { useSubscriberOverviewDashboard } from "@/features/subscriber-overview/use-overview-dashboard"
import { useLocale } from "@/hooks/useLocale"
import { trainingDayCount } from "@/lib/program-text"
import { cn } from "@/lib/utils"

/** Program weekdays are Mon=0 … Sun=6 */
function programWeekdayToday(): number {
  return (new Date().getDay() + 6) % 7
}

function startOfUtcWeekIso(now = new Date()): string {
  const day = now.getUTCDay() || 7
  const monday = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
  )
  monday.setUTCDate(monday.getUTCDate() - (day - 1))
  return monday.toISOString().slice(0, 10)
}

export function SubscriberAssignedPrograms() {
  const { locale, isRtl } = useLocale()
  const isAr = locale === "ar"
  const {
    isLoading: loading,
    canWorkout,
    canNutrition,
    activeWorkout,
    activeNutrition,
    workoutLogs,
    nutritionLogs,
    currentWeek,
  } = useSubscriberOverviewDashboard(locale)

  const workoutCard = useMemo(() => {
    if (!activeWorkout) return null

    const todayIdx = programWeekdayToday()
    const todayDay =
      activeWorkout.days.find((d) => d.weekday === todayIdx) ??
      activeWorkout.days[todayIdx]
    const focus =
      (todayDay?.focus &&
        (typeof todayDay.focus === "string"
          ? todayDay.focus
          : todayDay.focus[locale] || todayDay.focus.en)) ||
      (todayDay?.label &&
        (typeof todayDay.label === "string"
          ? todayDay.label
          : todayDay.label[locale] || todayDay.label.en)) ||
      (todayDay?.isRest
        ? isAr
          ? "اليوم راحة واستشفاء"
          : "Rest & recovery day"
        : isAr
          ? `يوم ${todayIdx + 1} — ${(todayDay?.exercises.length ?? 0)} تمارين`
          : `Day ${todayIdx + 1} — ${todayDay?.exercises.length ?? 0} exercises`)

    const weekStart = startOfUtcWeekIso()
    const weekLogs = workoutLogs.filter(
      (log) =>
        log.programId === activeWorkout.id &&
        (log.date || log.completedAt).slice(0, 10) >= weekStart,
    )
    const total = Math.max(
      1,
      activeWorkout.completion?.total ?? trainingDayCount(activeWorkout),
    )
    // Prefer shared weekly adherence counter so boxes match the chart.
    const doneThisWeek = currentWeek?.workoutDone ?? weekLogs.length
    const lifetimeDone = activeWorkout.completion?.done ?? weekLogs.length
    const progress = Math.min(
      100,
      Math.round((Math.min(lifetimeDone, total) / total) * 100),
    )

    return {
      title: activeWorkout.title[locale] || activeWorkout.title.en,
      description:
        activeWorkout.description?.[locale] ||
        activeWorkout.description?.en ||
        (isAr
          ? "البرنامج التدريبي المعيّن لك من المدرب"
          : "Your coach-assigned workout program"),
      daysCount: trainingDayCount(activeWorkout),
      todayFocus: focus,
      format: activeWorkout.format,
      progress,
      doneLabel: `${Math.min(lifetimeDone, total)}/${total}`,
      weekSessions: doneThisWeek,
    }
  }, [activeWorkout, workoutLogs, currentWeek, locale, isAr])

  const nutritionCard = useMemo(() => {
    if (!activeNutrition) return null
    const macros = activeNutrition.macros
    const mealsCount = activeNutrition.days.reduce(
      (sum, day) => sum + day.meals.length,
      0,
    )
    const weekStart = startOfUtcWeekIso()
    const weekLogs = nutritionLogs.filter(
      (log) =>
        log.programId === activeNutrition.id &&
        (log.date || log.loggedAt).slice(0, 10) >= weekStart &&
        (log.status === "adhered" || log.status === "mostly"),
    )
    const total = Math.max(
      1,
      activeNutrition.adherence?.total ?? 7,
    )
    const lifetimeDone = activeNutrition.adherence?.done ?? weekLogs.length
    const progress = Math.min(
      100,
      Math.round((Math.min(lifetimeDone, total) / total) * 100),
    )
    return {
      title: activeNutrition.title[locale] || activeNutrition.title.en,
      description:
        activeNutrition.description?.[locale] ||
        activeNutrition.description?.en ||
        (isAr
          ? "الخطة الغذائية المعيّنة لك من المدرب"
          : "Your coach-assigned nutrition plan"),
      calories: activeNutrition.targetCalories ?? 0,
      protein: macros?.proteinGrams ?? 0,
      carbs: macros?.carbsGrams ?? 0,
      fats: macros?.fatsGrams ?? 0,
      water:
        activeNutrition.targetWaterLiters != null
          ? isAr
            ? `${activeNutrition.targetWaterLiters} لتر`
            : `${activeNutrition.targetWaterLiters} L`
          : "—",
      mealsCount,
      format: activeNutrition.format,
      progress,
      doneLabel: `${Math.min(lifetimeDone, total)}/${total}`,
      weekSessions: currentWeek?.nutritionDone ?? weekLogs.length,
    }
  }, [activeNutrition, nutritionLogs, currentWeek, locale, isAr])

  const ArrowIcon = isRtl ? ArrowLeft : ArrowRight
  const workoutHref = canWorkout
    ? APP_ROUTES.subscriber.workout
    : APP_ROUTES.subscriber.subscription
  const nutritionHref = canNutrition
    ? APP_ROUTES.subscriber.nutrition
    : APP_ROUTES.subscriber.subscription

  return (
    <section dir={isRtl ? "rtl" : "ltr"} className="space-y-3.5 select-none">
      <div className="px-1">
        <h2
          className={cn(
            "text-[20px] sm:text-[22px] font-black text-[var(--gym-ink,#111111)] tracking-tight",
            isAr ? "font-arabic" : "font-heading",
          )}
        >
          {isAr ? "البرامج والخطط المخصصة لك" : "Current Assigned Programs"}
        </h2>
        <p
          className={cn(
            "text-[12.5px] sm:text-[13.5px] font-semibold text-[#8c8c8c] mt-0.5",
            isAr ? "font-arabic" : "font-sans",
          )}
        >
          {isAr
            ? "متابعة جداول التمارين والخطة الغذائية النشطة حالياً من الكوتش"
            : "Track your active workout routines and customized diet plans"}
        </p>
      </div>

      {loading ? (
        <div className="rounded-[22px] bg-white p-8 text-center text-[13px] text-[#8c8c8c] border border-black/[0.06]">
          {isAr ? "جاري تحميل البرامج المعيّنة..." : "Loading assigned programs..."}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-5">
          {/* Workout card */}
          {workoutCard ? (
            <div className="group relative flex flex-col justify-between overflow-hidden rounded-[22px] sm:rounded-[26px] bg-white p-5 sm:p-6 lg:p-7 border border-black/[0.06] shadow-[0_4px_24px_rgba(0,0,0,0.03)] hover:shadow-[0_12px_36px_rgba(0,0,0,0.08)] hover:-translate-y-0.5 transition-all duration-300">
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3.5">
                    <span className="flex size-11 sm:size-12 shrink-0 items-center justify-center rounded-2xl bg-[var(--gym-ink,#111111)] text-white shadow-sm transition-transform duration-300 group-hover:scale-105">
                      <Dumbbell className="size-5 sm:size-5.5" strokeWidth={2.2} />
                    </span>
                    <div>
                      <span
                        className={cn(
                          "text-[10.5px] font-bold uppercase tracking-wider text-[var(--gym-lime,#fb5001)] block",
                          isAr ? "font-arabic" : "font-sans",
                        )}
                      >
                        {isAr ? "خطة التمارين" : "Workout Plan"}
                      </span>
                      <h3
                        className={cn(
                          "text-[17px] sm:text-[18px] font-extrabold text-[var(--gym-ink,#111111)] tracking-tight leading-snug mt-0.5",
                          isAr ? "font-arabic" : "font-heading",
                        )}
                      >
                        {workoutCard.title}
                      </h3>
                    </div>
                  </div>

                  <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700 border border-emerald-200/80 shrink-0">
                    <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span>{isAr ? "نشط" : "Active"}</span>
                  </span>
                </div>

                <p
                  className={cn(
                    "mt-3 text-[12.5px] sm:text-[13px] font-medium leading-relaxed text-[#737373] line-clamp-2",
                    isAr ? "font-arabic" : "font-sans",
                  )}
                >
                  {workoutCard.description}
                </p>

                <div className="mt-4 rounded-2xl bg-[#fafafa] p-3.5 sm:p-4 border border-black/[0.04]">
                  <div className="flex items-center justify-between text-[12.5px] font-bold text-[var(--gym-ink,#111111)]">
                    <div className="flex items-center gap-2 min-w-0">
                      <Zap className="size-4 shrink-0 text-[var(--gym-lime,#fb5001)]" />
                      <span className={cn("truncate", isAr ? "font-arabic" : "font-sans")}>
                        {workoutCard.todayFocus}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[#888] text-[11.5px] font-semibold shrink-0">
                      <Timer className="size-3.5" />
                      <span>
                        {workoutCard.format === "pdf"
                          ? "PDF"
                          : `${workoutCard.weekSessions} ${isAr ? "هذا الأسبوع" : "this week"}`}
                      </span>
                    </div>
                  </div>

                  <div className="mt-3">
                    <div className="flex items-center justify-between text-[11px] font-semibold text-[#888] mb-1">
                      <span>{isAr ? "إنجاز البرنامج" : "Program progress"}</span>
                      <span className="font-extrabold text-[var(--gym-ink,#111111)]">
                        {workoutCard.doneLabel} · {workoutCard.progress}%
                      </span>
                    </div>
                    <div className="relative h-2 w-full overflow-hidden rounded-full bg-black/5">
                      <div
                        className="h-full rounded-full bg-[var(--gym-lime,#fb5001)] transition-all duration-500 shadow-[0_0_8px_rgba(251,80,1,0.4)]"
                        style={{ width: `${workoutCard.progress}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-5 pt-4 border-t border-black/[0.05] flex items-center justify-between">
                <span className="text-[12px] font-semibold text-[#888]">
                  {isAr
                    ? `${workoutCard.daysCount} أيام تمرين / أسبوع`
                    : `${workoutCard.daysCount} training days / week`}
                </span>

                <Link
                  to={workoutHref}
                  className={cn(
                    "group/btn inline-flex items-center gap-2 rounded-full bg-[var(--gym-lime,#fb5001)] hover:bg-[#e04500] text-white px-4 py-2 sm:px-5 sm:py-2.5 text-[12.5px] sm:text-[13px] font-extrabold shadow-[0_4px_16px_rgba(251,80,1,0.35)] transition-all duration-200 hover:scale-105 active:scale-95",
                    isAr ? "font-arabic" : "font-heading",
                  )}
                >
                  <span>
                    {canWorkout
                      ? isAr
                        ? "متابعة التمارين"
                        : "View Workouts"
                      : isAr
                        ? "راجع الاشتراك"
                        : "Review subscription"}
                  </span>
                  <ArrowIcon
                    className="size-3.5 rtl:rotate-180 transition-transform group-hover/btn:translate-x-1 rtl:group-hover/btn:-translate-x-1"
                    strokeWidth={2.5}
                  />
                </Link>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center rounded-[22px] bg-white p-8 text-center border border-black/[0.06] min-h-[220px]">
              <Dumbbell className="size-10 mb-3 text-[var(--gym-orange,#fb5001)] stroke-1" />
              <p className="font-heading text-[15px] font-extrabold text-[var(--gym-ink,#111111)]">
                {isAr ? "لا يوجد برنامج تمارين نشط" : "No active workout program"}
              </p>
              <p className="mt-1 text-[12.5px] text-[#8c8c8c] max-w-sm">
                {isAr
                  ? "سيظهر هنا بمجرد أن يعيّن المدرب برنامجك التدريبي."
                  : "It will appear here once your coach assigns a workout."}
              </p>
              <Link
                to={APP_ROUTES.subscriber.history}
                className="mt-4 text-[12px] font-bold text-[var(--gym-orange,#fb5001)] hover:underline"
              >
                {isAr ? "عرض السجل السابق" : "View previous history"}
              </Link>
            </div>
          )}

          {/* Nutrition card */}
          {nutritionCard ? (
            <div className="group relative flex flex-col justify-between overflow-hidden rounded-[22px] sm:rounded-[26px] bg-white p-5 sm:p-6 lg:p-7 border border-black/[0.06] shadow-[0_4px_24px_rgba(0,0,0,0.03)] hover:shadow-[0_12px_36px_rgba(0,0,0,0.08)] hover:-translate-y-0.5 transition-all duration-300">
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3.5">
                    <span className="flex size-11 sm:size-12 shrink-0 items-center justify-center rounded-2xl bg-[#24030c] text-white shadow-sm transition-transform duration-300 group-hover:scale-105">
                      <Apple className="size-5 sm:size-5.5" strokeWidth={2.2} />
                    </span>
                    <div>
                      <span
                        className={cn(
                          "text-[10.5px] font-bold uppercase tracking-wider text-[var(--gym-lime,#fb5001)] block",
                          isAr ? "font-arabic" : "font-sans",
                        )}
                      >
                        {isAr ? "الخطة الغذائية" : "Nutrition Plan"}
                      </span>
                      <h3
                        className={cn(
                          "text-[17px] sm:text-[18px] font-extrabold text-[var(--gym-ink,#111111)] tracking-tight leading-snug mt-0.5",
                          isAr ? "font-arabic" : "font-heading",
                        )}
                      >
                        {nutritionCard.title}
                      </h3>
                    </div>
                  </div>

                  {nutritionCard.calories > 0 ? (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-orange-50 px-2.5 py-1 text-[11px] font-bold text-[var(--gym-lime,#fb5001)] border border-orange-200/80 shrink-0">
                      <Flame className="size-3.5" />
                      <span>
                        {nutritionCard.calories} {isAr ? "سعرة" : "kcal"}
                      </span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700 border border-emerald-200/80 shrink-0">
                      <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      <span>{isAr ? "نشط" : "Active"}</span>
                    </span>
                  )}
                </div>

                <p
                  className={cn(
                    "mt-3 text-[12.5px] sm:text-[13px] font-medium leading-relaxed text-[#737373] line-clamp-2",
                    isAr ? "font-arabic" : "font-sans",
                  )}
                >
                  {nutritionCard.description}
                </p>

                <div className="mt-3">
                  <div className="flex items-center justify-between text-[11px] font-semibold text-[#888] mb-1">
                    <span>
                      {isAr
                        ? `التزام هذا الأسبوع: ${nutritionCard.weekSessions}`
                        : `This week adherence: ${nutritionCard.weekSessions}`}
                    </span>
                    <span className="font-extrabold text-[var(--gym-ink,#111111)]">
                      {nutritionCard.doneLabel} · {nutritionCard.progress}%
                    </span>
                  </div>
                  <div className="relative h-2 w-full overflow-hidden rounded-full bg-black/5">
                    <div
                      className="h-full rounded-full bg-[var(--gym-lime,#fb5001)] transition-all duration-500"
                      style={{ width: `${nutritionCard.progress}%` }}
                    />
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-3 gap-2.5">
                  <div className="rounded-2xl bg-[#fafafa] p-3 text-center border border-black/[0.04]">
                    <span className="block text-[11px] font-semibold text-[#888]">
                      {isAr ? "بروتين" : "Protein"}
                    </span>
                    <span className="mt-0.5 block text-[16px] sm:text-[17px] font-black text-[var(--gym-ink,#111111)]">
                      {nutritionCard.protein > 0 ? `${nutritionCard.protein}g` : "—"}
                    </span>
                  </div>
                  <div className="rounded-2xl bg-[#fafafa] p-3 text-center border border-black/[0.04]">
                    <span className="block text-[11px] font-semibold text-[#888]">
                      {isAr ? "كاربوهيدرات" : "Carbs"}
                    </span>
                    <span className="mt-0.5 block text-[16px] sm:text-[17px] font-black text-[var(--gym-ink,#111111)]">
                      {nutritionCard.carbs > 0 ? `${nutritionCard.carbs}g` : "—"}
                    </span>
                  </div>
                  <div className="rounded-2xl bg-[#fafafa] p-3 text-center border border-black/[0.04]">
                    <span className="block text-[11px] font-semibold text-[#888]">
                      {isAr ? "دهون صحية" : "Fats"}
                    </span>
                    <span className="mt-0.5 block text-[16px] sm:text-[17px] font-black text-[var(--gym-ink,#111111)]">
                      {nutritionCard.fats > 0 ? `${nutritionCard.fats}g` : "—"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-5 pt-4 border-t border-black/[0.05] flex items-center justify-between">
                <span className="text-[12px] font-semibold text-[#888]">
                  {isAr
                    ? `${nutritionCard.mealsCount} وجبات • ماء: ${nutritionCard.water}`
                    : `${nutritionCard.mealsCount} meals • Water: ${nutritionCard.water}`}
                </span>

                <Link
                  to={nutritionHref}
                  className={cn(
                    "group/btn inline-flex items-center gap-2 rounded-full bg-[var(--gym-lime,#fb5001)] hover:bg-[#e04500] text-white px-4 py-2 sm:px-5 sm:py-2.5 text-[12.5px] sm:text-[13px] font-extrabold shadow-[0_4px_16px_rgba(251,80,1,0.35)] transition-all duration-200 hover:scale-105 active:scale-95",
                    isAr ? "font-arabic" : "font-heading",
                  )}
                >
                  <span>
                    {canNutrition
                      ? isAr
                        ? "عرض الوجبات"
                        : "View Meals"
                      : isAr
                        ? "راجع الاشتراك"
                        : "Review subscription"}
                  </span>
                  <ArrowIcon
                    className="size-3.5 rtl:rotate-180 transition-transform group-hover/btn:translate-x-1 rtl:group-hover/btn:-translate-x-1"
                    strokeWidth={2.5}
                  />
                </Link>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center rounded-[22px] bg-white p-8 text-center border border-black/[0.06] min-h-[220px]">
              <Apple className="size-10 mb-3 text-[var(--gym-orange,#fb5001)] stroke-1" />
              <p className="font-heading text-[15px] font-extrabold text-[var(--gym-ink,#111111)]">
                {isAr ? "لا توجد خطة تغذية نشطة" : "No active nutrition plan"}
              </p>
              <p className="mt-1 text-[12.5px] text-[#8c8c8c] max-w-sm">
                {isAr
                  ? "سيظهر هنا بمجرد أن يعيّن المدرب خطتك الغذائية."
                  : "It will appear here once your coach assigns a nutrition plan."}
              </p>
            </div>
          )}
        </div>
      )}
    </section>
  )
}
