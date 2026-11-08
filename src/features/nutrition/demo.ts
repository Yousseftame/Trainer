/**
 * Compatibility shim — demo nutrition seed data removed.
 * Prefer `@/lib/program-text` helpers and Firestore nutrition services.
 */
export type {
  MealSlot as DemoMealSlot,
  NutritionDay as DemoNutritionDay,
  NutritionProgram as DemoNutritionProgram,
  MealSlotKey,
} from "@/types/program"
export {
  resolveBilingualText,
  mealCount,
  dayMacros,
  NUTRITION_DISCLAIMER,
} from "@/lib/program-text"

/** @deprecated Empty — live data comes from Firestore */
export const DEMO_NUTRITION: import("@/types/program").NutritionProgram[] = []

/** @deprecated Empty — live logs come from Firestore */
export const INITIAL_NUTRITION_LOGS: import("@/types/program").NutritionAdherenceLog[] =
  []
