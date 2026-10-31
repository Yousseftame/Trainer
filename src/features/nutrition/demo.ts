import type {
  BilingualText,
  MealItem,
  MealSlot,
  MealSlotKey,
  NutritionAdherenceLog,
  NutritionDay,
  NutritionProgram,
} from "@/types/program"

export type { MealSlotKey }
export type DemoMealSlot = MealSlot
export type DemoNutritionDay = NutritionDay
export type DemoNutritionProgram = NutritionProgram

const BREAKFAST: MealItem[] = [
  {
    id: "m-eggs",
    name: "Eggs + sourdough",
    quantity: "3 eggs, 1 slice",
    calories: 420,
    protein: 28,
    carbs: 24,
    fats: 22,
  },
  {
    id: "m-yogurt",
    name: "Greek yogurt",
    quantity: "150g",
    calories: 130,
    protein: 16,
    carbs: 8,
    fats: 3,
    notes: "Add berries if hungry",
  },
]

const LUNCH: MealItem[] = [
  {
    id: "m-chicken",
    name: "Grilled chicken bowl",
    quantity: "180g chicken, rice, salad",
    calories: 620,
    protein: 48,
    carbs: 55,
    fats: 18,
  },
]

const SNACK: MealItem[] = [
  {
    id: "m-shake",
    name: "Protein shake",
    quantity: "1 scoop + water",
    calories: 120,
    protein: 24,
    carbs: 3,
    fats: 1,
  },
]

const DINNER: MealItem[] = [
  {
    id: "m-salmon",
    name: "Salmon + vegetables",
    quantity: "160g salmon, mixed veg",
    notes: "Cook with olive oil, no weighing required tonight",
  },
]

function week(days: Array<Partial<DemoNutritionDay> & { weekday: number; id: string }>): DemoNutritionDay[] {
  return Array.from({ length: 7 }, (_, weekday) => {
    const found = days.find((day) => day.weekday === weekday)
    return {
      id: found?.id ?? `n-empty-${weekday}`,
      weekday,
      meals: found?.meals ?? [],
    }
  })
}

const FULL_DAY: DemoMealSlot[] = [
  { id: "s-bf", slot: "breakfast", items: BREAKFAST },
  { id: "s-ln", slot: "lunch", items: LUNCH },
  { id: "s-sn", slot: "snack", items: SNACK },
  { id: "s-dn", slot: "dinner", items: DINNER },
]

export const DEMO_NUTRITION: DemoNutritionProgram[] = [
  {
    id: "ntpl-cut",
    title: { en: "Fat-loss plate", ar: "طبق خسارة الدهون" },
    format: "interactive",
    version: 2,
    status: "template",
    targetCalories: 1900,
    updatedAt: "2026-10-16T00:00:00.000Z",
    createdAt: "2026-06-01T00:00:00.000Z",
    days: week([
      { id: "c-0", weekday: 0, meals: FULL_DAY },
      { id: "c-1", weekday: 1, meals: FULL_DAY },
      { id: "c-2", weekday: 2, meals: FULL_DAY },
      { id: "c-3", weekday: 3, meals: FULL_DAY },
      { id: "c-4", weekday: 4, meals: FULL_DAY },
      {
        id: "c-5",
        weekday: 5,
        meals: [
          { id: "c-5-bf", slot: "breakfast", items: BREAKFAST },
          { id: "c-5-ln", slot: "lunch", items: LUNCH },
          { id: "c-5-dn", slot: "dinner", items: DINNER },
        ],
      },
    ]),
  },
  {
    id: "ntpl-build",
    title: { en: "Muscle-build meals", ar: "وجبات بناء العضلات" },
    format: "interactive",
    version: 1,
    status: "template",
    targetCalories: 2600,
    createdAt: "2026-05-15T00:00:00.000Z",
    updatedAt: "2026-09-28T00:00:00.000Z",
    days: week([
      { id: "b-0", weekday: 0, meals: FULL_DAY },
      { id: "b-1", weekday: 1, meals: FULL_DAY },
      { id: "b-2", weekday: 2, meals: FULL_DAY },
      { id: "b-3", weekday: 3, meals: FULL_DAY },
      { id: "b-4", weekday: 4, meals: FULL_DAY },
    ]),
  },
  {
    id: "ntpl-pdf",
    title: { en: "Ramadan PDF guide", ar: "دليل رمضان PDF" },
    format: "pdf",
    version: 1,
    status: "template",
    createdAt: "2026-02-20T00:00:00.000Z",
    updatedAt: "2026-03-02T00:00:00.000Z",
    pdfContentId: "pdf-macro-guide",
    pdfName: { en: "Ramadan_Nutrition_v1.pdf", ar: "تغذية_رمضان_v1.pdf" },
    days: week([]),
  },
  {
    id: "nasg-alex",
    title: { en: "Alex — Fat-loss plate", ar: "أليكس — طبق خسارة الدهون" },
    format: "interactive",
    version: 2,
    status: "active",
    subscriberId: "sub-alex",
    templateId: "ntpl-cut",
    targetCalories: 1900,
    adherence: { done: 18, total: 24 },
    createdAt: "2026-06-15T00:00:00.000Z",
    updatedAt: "2026-10-21T00:00:00.000Z",
    days: week([
      { id: "na-0", weekday: 0, meals: FULL_DAY },
      { id: "na-1", weekday: 1, meals: FULL_DAY },
      { id: "na-2", weekday: 2, meals: FULL_DAY },
      { id: "na-3", weekday: 3, meals: FULL_DAY },
      { id: "na-4", weekday: 4, meals: FULL_DAY },
      {
        id: "na-5",
        weekday: 5,
        meals: [
          { id: "na-5-bf", slot: "breakfast", items: BREAKFAST },
          { id: "na-5-ln", slot: "lunch", items: LUNCH },
        ],
      },
    ]),
  },
  {
    id: "nasg-alex-start",
    title: { en: "Alex — Kickstart plate", ar: "أليكس — طبق الانطلاقة" },
    format: "interactive",
    version: 1,
    status: "archived",
    subscriberId: "sub-alex",
    templateId: "ntpl-cut",
    targetCalories: 2100,
    adherence: { done: 16, total: 20 },
    createdAt: "2026-01-10T00:00:00.000Z",
    updatedAt: "2026-05-01T00:00:00.000Z",
    archivedAt: "2026-06-15T00:00:00.000Z",
    days: week([
      { id: "nas-0", weekday: 0, meals: FULL_DAY },
      { id: "nas-2", weekday: 2, meals: FULL_DAY },
      { id: "nas-4", weekday: 4, meals: FULL_DAY },
    ]),
  },
  {
    id: "nasg-nina",
    title: { en: "Nina — Muscle-build meals", ar: "نينا — وجبات بناء العضلات" },
    format: "interactive",
    version: 1,
    status: "active",
    subscriberId: "sub-nina",
    templateId: "ntpl-build",
    targetCalories: 2400,
    adherence: { done: 12, total: 20 },
    createdAt: "2026-08-01T00:00:00.000Z",
    updatedAt: "2026-10-14T00:00:00.000Z",
    days: week([
      { id: "nn-0", weekday: 0, meals: FULL_DAY },
      { id: "nn-2", weekday: 2, meals: FULL_DAY },
      { id: "nn-4", weekday: 4, meals: FULL_DAY },
    ]),
  },
  {
    id: "nasg-omar",
    title: { en: "Omar — Ramadan PDF", ar: "عمر — دليل رمضان" },
    format: "pdf",
    version: 1,
    status: "archived",
    subscriberId: "sub-omar",
    templateId: "ntpl-pdf",
    pdfContentId: "pdf-macro-guide",
    pdfName: { en: "Ramadan_Nutrition_v1.pdf", ar: "تغذية_رمضان_v1.pdf" },
    createdAt: "2026-07-01T00:00:00.000Z",
    updatedAt: "2026-09-19T00:00:00.000Z",
    archivedAt: "2026-09-19T00:00:00.000Z",
    days: week([]),
  },
]

export const NUTRITION_DISCLAIMER: BilingualText = {
  en: "The platform delivers and tracks trainer-approved nutrition programs. It does not independently generate medical or therapeutic dietary prescriptions.",
  ar: "توفر المنصة وتتابع خطط التغذية المعتمدة من المدرب الرياضي. ولا تصدر بشكل مستقل وصفات غذائية علاجية أو طبية.",
}

export const INITIAL_NUTRITION_LOGS: NutritionAdherenceLog[] = [
  {
    id: "nlog-1",
    subscriberId: "sub-alex",
    programId: "nasg-alex",
    date: "2026-10-26",
    status: "adhered",
    caloriesActual: 1880,
    waterLitersActual: 3.2,
    notes: "Hit all meals, skipped late snack without issues.",
    loggedAt: "2026-10-26T21:00:00.000Z",
  },
  {
    id: "nlog-2",
    subscriberId: "sub-alex",
    programId: "nasg-alex",
    date: "2026-10-27",
    status: "mostly",
    caloriesActual: 2050,
    waterLitersActual: 3.0,
    notes: "Business lunch had slightly more carbs than planned, compensated at dinner.",
    loggedAt: "2026-10-27T21:30:00.000Z",
  },
  {
    id: "nlog-3",
    subscriberId: "sub-nina",
    programId: "nasg-nina",
    date: "2026-10-26",
    status: "adhered",
    caloriesActual: 2420,
    waterLitersActual: 3.5,
    notes: "Hit high protein targets easily today.",
    loggedAt: "2026-10-26T20:45:00.000Z",
  },
]

export function resolveBilingualText(
  value: string | BilingualText | undefined,
  locale: "en" | "ar",
  fallback = "",
): string {
  if (!value) return fallback
  if (typeof value === "string") return value
  return value[locale] || value.en || value.ar || fallback
}

export function mealCount(program: DemoNutritionProgram) {
  return program.days.reduce((sum, day) => sum + day.meals.length, 0)
}

export function dayMacros(day: DemoNutritionDay | undefined) {
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
