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
