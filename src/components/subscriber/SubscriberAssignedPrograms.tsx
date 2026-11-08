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
import { useNutritionProgramsQuery } from "@/features/nutrition/hooks"
import { usePanelSubscriber } from "@/features/subscribers/use-panel-subscriber"
import { useWorkoutProgramsQuery } from "@/features/workouts/hooks"
import { useLocale } from "@/hooks/useLocale"
import { cn } from "@/lib/utils"

export function SubscriberAssignedPrograms() {
  const { locale, isRtl } = useLocale()
  const isAr = locale === "ar"
  const { subscriberId } = usePanelSubscriber()

  const { data: workoutPrograms = [] } = useWorkoutProgramsQuery({
    subscriberId,
    enabled: Boolean(subscriberId),
  })
  const { data: nutritionPrograms = [] } = useNutritionProgramsQuery({
    subscriberId,
    enabled: Boolean(subscriberId),
  })

  // Resolve assigned workout program
  const activeWorkout = useMemo(() => {
    const prog =
      workoutPrograms.find((p) => p.status === "active") ?? workoutPrograms[0]

    return {
      title: prog?.title?.[locale] ?? (isAr ? "برنامج تضخيم وبناء القوة" : "Strength & Hypertrophy Split"),
      description:
        prog?.description?.[locale] ??
        (isAr ? "نظام تدريبي 4 أيام أسبوعياً مع تركيز على التمارين المركبة والتطور المستمر" : "Advanced 4-day split focusing on compound progressive overload"),
      daysCount: prog?.days?.length ?? 4,
      todayFocus: isAr ? "اليوم: الصدر والترايسبس (Push Day)" : "Today: Chest & Triceps (Push Day)",
      duration: isAr ? "55 دقيقة" : "55 min",
      progress: 68,
    }
  }, [workoutPrograms, locale, isAr])

  // Resolve assigned nutrition program
  const activeNutrition = useMemo(() => {
    const prog =
      nutritionPrograms.find((p) => p.status === "active") ?? nutritionPrograms[0]

    return {
      title: prog?.title?.[locale] ?? (isAr ? "نظام التضخيم النظيف المتوازن" : "Clean Bulk Nutrition Plan"),
      description:
        prog?.description?.[locale] ??
        (isAr ? "توزيع مثالي للسعرات والماكروز مع الوجبات الغذائية المحددة لتسريع البناء" : "Optimal calorie surplus with targeted macro distribution"),
      calories: 2450,
      protein: 165,
      carbs: 260,
      fats: 65,
      water: isAr ? "3.5 لتر" : "3.5 L",
      mealsCount: 4,
    }
  }, [nutritionPrograms, locale, isAr])

  const ArrowIcon = isRtl ? ArrowLeft : ArrowRight

  return (
    <section dir={isRtl ? "rtl" : "ltr"} className="space-y-3.5 select-none">
      {/* Section Header */}
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

      {/* Two-Column Grid: Crisp White Luxury Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-5">
        {/* ======================================================== */}
        {/* CARD 1: ACTIVE WORKOUT PROGRAM (Crisp White Card)        */}
        {/* ======================================================== */}
        <div className="group relative flex flex-col justify-between overflow-hidden rounded-[22px] sm:rounded-[26px] bg-white p-5 sm:p-6 lg:p-7 border border-black/[0.06] shadow-[0_4px_24px_rgba(0,0,0,0.03)] hover:shadow-[0_12px_36px_rgba(0,0,0,0.08)] hover:-translate-y-0.5 transition-all duration-300">
          <div>
            {/* Top Header Row: Icon + Title + Status */}
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
                    {activeWorkout.title}
                  </h3>
                </div>
              </div>

              {/* Status Pill */}
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700 border border-emerald-200/80 shrink-0">
                <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>{isAr ? "نشط" : "Active"}</span>
              </span>
            </div>

            {/* Description */}
            <p
              className={cn(
                "mt-3 text-[12.5px] sm:text-[13px] font-medium leading-relaxed text-[#737373] line-clamp-2",
                isAr ? "font-arabic" : "font-sans",
              )}
            >
              {activeWorkout.description}
            </p>

            {/* Today's Training Highlight Bar */}
            <div className="mt-4 rounded-2xl bg-[#fafafa] p-3.5 sm:p-4 border border-black/[0.04]">
              <div className="flex items-center justify-between text-[12.5px] font-bold text-[var(--gym-ink,#111111)]">
                <div className="flex items-center gap-2">
                  <Zap className="size-4 text-[var(--gym-lime,#fb5001)]" />
                  <span className={isAr ? "font-arabic" : "font-sans"}>
                    {activeWorkout.todayFocus}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-[#888] text-[11.5px] font-semibold">
                  <Timer className="size-3.5" />
                  <span>{activeWorkout.duration}</span>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mt-3">
                <div className="flex items-center justify-between text-[11px] font-semibold text-[#888] mb-1">
                  <span>{isAr ? "إنجاز الخطة الأسبوعية" : "Weekly Progress"}</span>
                  <span className="font-extrabold text-[var(--gym-ink,#111111)]">{activeWorkout.progress}%</span>
                </div>
                <div className="relative h-2 w-full overflow-hidden rounded-full bg-black/5">
                  <div
                    className="h-full rounded-full bg-[var(--gym-lime,#fb5001)] transition-all duration-500 shadow-[0_0_8px_rgba(251,80,1,0.4)]"
                    style={{ width: `${activeWorkout.progress}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Action Row */}
          <div className="mt-5 pt-4 border-t border-black/[0.05] flex items-center justify-between">
            <span className="text-[12px] font-semibold text-[#888]">
              {isAr ? `${activeWorkout.daysCount} أيام تمرين / أسبوع` : `${activeWorkout.daysCount} training days / week`}
            </span>

            <Link
              to={APP_ROUTES.subscriber.workout}
              className={cn(
                "group/btn inline-flex items-center gap-2 rounded-full bg-[var(--gym-lime,#fb5001)] hover:bg-[#e04500] text-white px-4 py-2 sm:px-5 sm:py-2.5 text-[12.5px] sm:text-[13px] font-extrabold shadow-[0_4px_16px_rgba(251,80,1,0.35)] transition-all duration-200 hover:scale-105 active:scale-95",
                isAr ? "font-arabic" : "font-heading",
              )}
            >
              <span>{isAr ? "متابعة التمارين" : "View Workouts"}</span>
              <ArrowIcon className="size-3.5 rtl:rotate-180 transition-transform group-hover/btn:translate-x-1 rtl:group-hover/btn:-translate-x-1" strokeWidth={2.5} />
            </Link>
          </div>
        </div>

        {/* ======================================================== */}
        {/* CARD 2: ACTIVE NUTRITION PROGRAM (Crisp White Card)      */}
        {/* ======================================================== */}
        <div className="group relative flex flex-col justify-between overflow-hidden rounded-[22px] sm:rounded-[26px] bg-white p-5 sm:p-6 lg:p-7 border border-black/[0.06] shadow-[0_4px_24px_rgba(0,0,0,0.03)] hover:shadow-[0_12px_36px_rgba(0,0,0,0.08)] hover:-translate-y-0.5 transition-all duration-300">
          <div>
            {/* Top Header Row: Icon + Title + Calories Target */}
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
                    {activeNutrition.title}
                  </h3>
                </div>
              </div>

              {/* Calories Target Pill */}
              <span className="inline-flex items-center gap-1.5 rounded-full bg-orange-50 px-2.5 py-1 text-[11px] font-bold text-[var(--gym-lime,#fb5001)] border border-orange-200/80 shrink-0">
                <Flame className="size-3.5" />
                <span>{activeNutrition.calories} {isAr ? "سعرة" : "kcal"}</span>
              </span>
            </div>

            {/* Description */}
            <p
              className={cn(
                "mt-3 text-[12.5px] sm:text-[13px] font-medium leading-relaxed text-[#737373] line-clamp-2",
                isAr ? "font-arabic" : "font-sans",
              )}
            >
              {activeNutrition.description}
            </p>

            {/* Target Macros Breakdown */}
            <div className="mt-4 grid grid-cols-3 gap-2.5">
              {/* Protein */}
              <div className="rounded-2xl bg-[#fafafa] p-3 text-center border border-black/[0.04]">
                <span className="block text-[11px] font-semibold text-[#888]">
                  {isAr ? "بروتين" : "Protein"}
                </span>
                <span className="mt-0.5 block text-[16px] sm:text-[17px] font-black text-[var(--gym-ink,#111111)]">
                  {activeNutrition.protein}g
                </span>
                <div className="mt-1.5 h-1 w-full rounded-full bg-black/5 overflow-hidden">
                  <div className="h-full rounded-full bg-[var(--gym-lime,#fb5001)] w-full" />
                </div>
              </div>

              {/* Carbs */}
              <div className="rounded-2xl bg-[#fafafa] p-3 text-center border border-black/[0.04]">
                <span className="block text-[11px] font-semibold text-[#888]">
                  {isAr ? "كاربوهيدرات" : "Carbs"}
                </span>
                <span className="mt-0.5 block text-[16px] sm:text-[17px] font-black text-[var(--gym-ink,#111111)]">
                  {activeNutrition.carbs}g
                </span>
                <div className="mt-1.5 h-1 w-full rounded-full bg-black/5 overflow-hidden">
                  <div className="h-full rounded-full bg-amber-500 w-full" />
                </div>
              </div>

              {/* Fats */}
              <div className="rounded-2xl bg-[#fafafa] p-3 text-center border border-black/[0.04]">
                <span className="block text-[11px] font-semibold text-[#888]">
                  {isAr ? "دهون صحية" : "Fats"}
                </span>
                <span className="mt-0.5 block text-[16px] sm:text-[17px] font-black text-[var(--gym-ink,#111111)]">
                  {activeNutrition.fats}g
                </span>
                <div className="mt-1.5 h-1 w-full rounded-full bg-black/5 overflow-hidden">
                  <div className="h-full rounded-full bg-emerald-500 w-full" />
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Action Row */}
          <div className="mt-5 pt-4 border-t border-black/[0.05] flex items-center justify-between">
            <span className="text-[12px] font-semibold text-[#888]">
              {isAr ? `${activeNutrition.mealsCount} وجبات • ماء: ${activeNutrition.water}` : `${activeNutrition.mealsCount} meals • Water: ${activeNutrition.water}`}
            </span>

            <Link
              to={APP_ROUTES.subscriber.nutrition}
              className={cn(
                "group/btn inline-flex items-center gap-2 rounded-full bg-[var(--gym-lime,#fb5001)] hover:bg-[#e04500] text-white px-4 py-2 sm:px-5 sm:py-2.5 text-[12.5px] sm:text-[13px] font-extrabold shadow-[0_4px_16px_rgba(251,80,1,0.35)] transition-all duration-200 hover:scale-105 active:scale-95",
                isAr ? "font-arabic" : "font-heading",
              )}
            >
              <span>{isAr ? "عرض الوجبات" : "View Meals"}</span>
              <ArrowIcon className="size-3.5 rtl:rotate-180 transition-transform group-hover/btn:translate-x-1 rtl:group-hover/btn:-translate-x-1" strokeWidth={2.5} />
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
