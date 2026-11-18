import type {
  BilingualText,
  NutritionDay,
  NutritionProgram,
  WorkoutProgram,
} from "@/types/program"

/** Resolve bilingual or plain string fields for the active locale. */
export function resolveBilingualText(
  value: string | BilingualText | undefined,
  locale: "en" | "ar",
  fallback = "",
): string {
  if (!value) return fallback
  if (typeof value === "string") return value
  return value[locale] || value.en || value.ar || fallback
}

export function formatRest(seconds?: number) {
  if (!seconds) return "—"
  if (seconds < 60) return `${seconds}s`
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return s ? `${m}:${String(s).padStart(2, "0")}` : `${m}:00`
}

export function trainingDayCount(program: Pick<WorkoutProgram, "days">) {
  return program.days.filter((day) => !day.isRest && day.exercises.length > 0)
    .length
}

export function mealCount(program: Pick<NutritionProgram, "days">) {
  return program.days.reduce((sum, day) => sum + day.meals.length, 0)
}

export function dayMacros(day: NutritionDay | undefined) {
  const items = day?.meals.flatMap((slot) => slot.items) ?? []
  const hasAny = items.some(
    (item) => item.calories || item.protein || item.carbs || item.fats,
  )
  if (!hasAny) return null
  return items.reduce(
    (acc, item) => ({
      calories: acc.calories + (item.calories ?? 0),
      protein: acc.protein + (item.protein ?? 0),
      carbs: acc.carbs + (item.carbs ?? 0),
      fats: acc.fats + (item.fats ?? 0),
    }),
    { calories: 0, protein: 0, carbs: 0, fats: 0 },
  )
}

/** Coach-approved plans disclaimer (docs: not medical dietary prescriptions). */
export const NUTRITION_DISCLAIMER: BilingualText = {
  en: "This nutrition plan is coach-approved guidance for training goals. It is not a medical or therapeutic dietary prescription.",
  ar: "خطة التغذية هذه توجيهات معتمدة من المدرب لأهداف التدريب، وليست وصفة طبية أو علاجية.",
}

/**
 * Shared Egypt calendar for workout + nutrition plans.
 * weekday 0 = Saturday … 6 = Friday (Day 1 … Day 7).
 */
export type PlanWeekStartsOn = "saturday" | "monday"

/** Canonical week start for this product (Egypt). */
export const PLAN_WEEK_STARTS_ON: PlanWeekStartsOn = "saturday"

export const PLAN_WEEKDAY_SHORT: Record<"en" | "ar", string[]> = {
  en: ["Sat", "Sun", "Mon", "Tue", "Wed", "Thu", "Fri"],
  ar: ["السبت", "الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة"],
}

export const PLAN_WEEKDAY_LONG: Record<"en" | "ar", string[]> = {
  en: [
    "Saturday",
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
  ],
  ar: [
    "السبت",
    "الأحد",
    "الإثنين",
    "الثلاثاء",
    "الأربعاء",
    "الخميس",
    "الجمعة",
  ],
}

/**
 * Convert JS `Date#getDay()` (Sun=0 … Sat=6) → plan weekday (Sat=0 … Fri=6).
 */
export function jsDayToPlanWeekday(jsDay: number): number {
  return (jsDay + 1) % 7
}

/** Today's plan weekday in the local timezone. */
export function planWeekdayToday(now = new Date()): number {
  return jsDayToPlanWeekday(now.getDay())
}

/**
 * Legacy programs used Mon=0 … Sun=6. Remap once to Egypt Sat=0 … Fri=6.
 * `(old + 2) % 7` — e.g. Mon0→2, Sat5→0, Sun6→1.
 */
export function mondayWeekdayToEgypt(weekday: number): number {
  return (Math.max(0, Math.min(6, weekday)) + 2) % 7
}

/** Normalize stored days onto the Egypt week when `weekStartsOn` is missing/legacy. */
export function migratePlanDaysToEgyptWeek<T extends { weekday: number }>(
  days: T[],
  weekStartsOn?: PlanWeekStartsOn | string | null,
): { days: T[]; weekStartsOn: PlanWeekStartsOn } {
  const remapped =
    weekStartsOn === "saturday"
      ? days
      : days.map((d) => ({
          ...d,
          weekday: mondayWeekdayToEgypt(Number(d.weekday) || 0),
        }))
  return {
    days: [...remapped].sort((a, b) => a.weekday - b.weekday),
    weekStartsOn: "saturday",
  }
}

export function planWeekdayIndex(weekday: number | undefined, fallbackIdx: number) {
  if (typeof weekday === "number" && weekday >= 0 && weekday <= 6) return weekday
  return Math.min(6, Math.max(0, fallbackIdx))
}

/** Always show Sat → Fri so workout and nutrition stay aligned. */
export function sortPlanDaysByWeekday<T extends { weekday: number }>(days: T[]): T[] {
  return [...days].sort((a, b) => a.weekday - b.weekday)
}

/** Chip label: "Mon" / "الإثنين" */
export function planWeekdayShortName(
  weekday: number | undefined,
  fallbackIdx: number,
  locale: "en" | "ar",
) {
  const idx = planWeekdayIndex(weekday, fallbackIdx)
  return PLAN_WEEKDAY_SHORT[locale][idx]
}

/** Detail title: "Saturday · Day 1" / "السبت · يوم 1" */
export function planDayHeading(
  weekday: number | undefined,
  fallbackIdx: number,
  locale: "en" | "ar",
) {
  const idx = planWeekdayIndex(weekday, fallbackIdx)
  const name = PLAN_WEEKDAY_LONG[locale][idx]
  return locale === "ar" ? `${name} · يوم ${idx + 1}` : `${name} · Day ${idx + 1}`
}
