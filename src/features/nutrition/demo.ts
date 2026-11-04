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
    name: { en: "3 Boiled Eggs", ar: "3 بيضات مسلوقين" },
    quantity: { en: "150g", ar: "150 جرام" },
    percentage: 50,
    calories: 230,
    protein: 21,
    carbs: 2,
    fats: 16,
    thumbnailUrl: "https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?w=400&auto=format&fit=crop&q=80",
    alternatives: [
      {
        id: "alt-egg-cottage",
        name: { en: "Cottage Cheese", ar: "جبنة قريش" },
        quantity: { en: "200g", ar: "200 جرام" },
        calories: 195,
        protein: 24,
        carbs: 6,
        fats: 4,
        thumbnailUrl: "https://images.unsplash.com/photo-1559561853-08451507cbe7?w=400&auto=format&fit=crop&q=80",
        reason: { en: "Low fat, high casein protein for fullness", ar: "بروتين عالي قليل الدسم للشبع واستقرار السكر" },
      },
      {
        id: "alt-egg-tuna",
        name: { en: "Canned Tuna in Oil (Drained)", ar: "تونة في الزيت - مصفى" },
        quantity: { en: "118g", ar: "118 جرام" },
        calories: 220,
        protein: 29,
        carbs: 0,
        fats: 8,
        thumbnailUrl: "https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?w=400&auto=format&fit=crop&q=80",
        reason: { en: "Convenient lean protein option", ar: "بروتين نقي وسهل التحضير في أي وقت" },
      },
    ],
  },
  {
    id: "m-toast",
    name: { en: "2 Slices Brown Toast", ar: "قطعتين توست بني" },
    quantity: { en: "100g", ar: "100 جرام" },
    percentage: 35,
    calories: 240,
    protein: 8,
    carbs: 46,
    fats: 3,
    thumbnailUrl: "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400&auto=format&fit=crop&q=80",
    alternatives: [
      {
        id: "alt-toast-oats",
        name: { en: "Whole Grain Rolled Oats", ar: "شوفان كامل الحبة" },
        quantity: { en: "60g", ar: "60 جرام" },
        calories: 235,
        protein: 8,
        carbs: 42,
        fats: 4,
        thumbnailUrl: "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400&auto=format&fit=crop&q=80",
        reason: { en: "Complex carbs rich in fiber and beta-glucan", ar: "كاربوهيدرات معقدة غنية بالألياف للطاقة المستمرة" },
      },
    ],
  },
  {
    id: "m-salad",
    name: { en: "Fresh Mixed Salad (Tomato, Carrot, Pepper & Cucumber)", ar: "سلطة (طماطم وجزر وفلفل وخيار)" },
    quantity: { en: "200g", ar: "200 جرام" },
    percentage: 15,
    calories: 80,
    protein: 3,
    carbs: 15,
    fats: 1,
    thumbnailUrl: "https://images.unsplash.com/photo-1540420773420-3366772f4999?w=400&auto=format&fit=crop&q=80",
  },
]

const LUNCH: MealItem[] = [
  {
    id: "m-rice-basmati",
    name: { en: "Boiled Basmati Rice", ar: "ارز بسمتي مسلوق" },
    quantity: { en: "200g", ar: "200 جرام" },
    percentage: 40,
    calories: 240,
    protein: 5,
    carbs: 52,
    fats: 1,
    thumbnailUrl: "https://images.unsplash.com/photo-1536304993881-ff6e9eefa2a6?w=400&auto=format&fit=crop&q=80",
    alternatives: [
      {
        id: "alt-rice-potato",
        name: { en: "Roasted Sweet Potato", ar: "بطاطا حلوة مشوية" },
        quantity: { en: "250g", ar: "250 جرام" },
        calories: 230,
        protein: 4,
        carbs: 50,
        fats: 1,
        thumbnailUrl: "https://images.unsplash.com/photo-1596560548464-f010549b84d7?w=400&auto=format&fit=crop&q=80",
        reason: { en: "Lower glycemic index & rich in potassium", ar: "مؤشر جلايسيمي منخفض وغني بالبوتاسيوم" },
      },
      {
        id: "alt-rice-quinoa",
        name: { en: "Cooked Quinoa", ar: "كينوا مطبوخة" },
        quantity: { en: "180g", ar: "180 جرام" },
        calories: 220,
        protein: 8,
        carbs: 40,
        fats: 3,
        thumbnailUrl: "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400&auto=format&fit=crop&q=80",
        reason: { en: "Complete amino acid profile with minerals", ar: "بروتين نباتي كامل الأحماض الأمينية ومعادن" },
      },
    ],
  },
  {
    id: "m-chicken-breast",
    name: { en: "Cooked Chicken Breast", ar: "صدر دجاج مطهي" },
    quantity: { en: "100g", ar: "100 جرام" },
    percentage: 45,
    calories: 180,
    protein: 31,
    carbs: 0,
    fats: 4,
    thumbnailUrl: "https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?w=400&auto=format&fit=crop&q=80",
    alternatives: [
      {
        id: "alt-chick-beef",
        name: { en: "Lean Beef Sirloin", ar: "لحم بقري أحمر قليل الدهن" },
        quantity: { en: "110g", ar: "110 جرام" },
        calories: 190,
        protein: 30,
        carbs: 0,
        fats: 6,
        thumbnailUrl: "https://images.unsplash.com/photo-1544025162-d76694265947?w=400&auto=format&fit=crop&q=80",
        reason: { en: "High iron & zinc for muscle recovery", ar: "غني بالحديد والزنك لدعم الاستشفاء والقوة" },
      },
      {
        id: "alt-chick-salmon",
        name: { en: "Grilled Salmon Fillet", ar: "فيليه سلمون مشوي" },
        quantity: { en: "120g", ar: "120 جرام" },
        calories: 210,
        protein: 26,
        carbs: 0,
        fats: 11,
        thumbnailUrl: "https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=400&auto=format&fit=crop&q=80",
        reason: { en: "Rich in Omega-3 fatty acids", ar: "غني بأوميجا 3 الصحية لتقليل الالتهابات" },
      },
      {
        id: "alt-chick-whitefish",
        name: { en: "Grilled White Fish (Tilapia/Cod)", ar: "فيليه سمك أبيض مشوي" },
        quantity: { en: "140g", ar: "140 جرام" },
        calories: 165,
        protein: 32,
        carbs: 0,
        fats: 2,
        thumbnailUrl: "https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?w=400&auto=format&fit=crop&q=80",
        reason: { en: "Ultra lean & fast absorbing", ar: "بروتين خفيف جداً وسريع الهضم" },
      },
      {
        id: "alt-chick-eggwhites",
        name: { en: "Cooked Egg Whites", ar: "بياض بيض مطهي" },
        quantity: { en: "250g", ar: "250 جرام" },
        calories: 130,
        protein: 27,
        carbs: 1,
        fats: 0,
        thumbnailUrl: "https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?w=400&auto=format&fit=crop&q=80",
        reason: { en: "Pure protein with zero cholesterol", ar: "بروتين خالص خالي من الكوليسترول" },
      },
    ],
  },
  {
    id: "m-lunch-salad",
    name: { en: "Fresh Salad (Tomato, Carrot, Pepper & Cucumber)", ar: "سلطة (طماطم وجزر وفلفل وخيار)" },
    quantity: { en: "200g", ar: "200 جرام" },
    percentage: 15,
    calories: 80,
    protein: 3,
    carbs: 15,
    fats: 1,
    thumbnailUrl: "https://images.unsplash.com/photo-1540420773420-3366772f4999?w=400&auto=format&fit=crop&q=80",
  },
]

const PRE_WORKOUT: MealItem[] = [
  {
    id: "m-coffee",
    name: { en: "Turkish Coffee (Plain or with Diet Sweetener)", ar: "كوب قهوة تركي سادة او بسكر دايت" },
    quantity: { en: "76g", ar: "76 جرام" },
    percentage: 10,
    calories: 15,
    protein: 0.5,
    carbs: 1,
    fats: 0.2,
    thumbnailUrl: "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=400&auto=format&fit=crop&q=80",
  },
  {
    id: "m-banana",
    name: { en: "Fresh Banana", ar: "موزه" },
    quantity: { en: "100g", ar: "100 جرام" },
    percentage: 40,
    calories: 90,
    protein: 1.2,
    carbs: 23,
    fats: 0.3,
    thumbnailUrl: "https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=400&auto=format&fit=crop&q=80",
  },
  {
    id: "m-rice-white",
    name: { en: "Boiled White Rice", ar: "أرز ابيض مسلوق" },
    quantity: { en: "150g", ar: "150 جرام" },
    percentage: 50,
    calories: 180,
    protein: 3.5,
    carbs: 39,
    fats: 0.5,
    thumbnailUrl: "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400&auto=format&fit=crop&q=80",
    alternatives: [
      {
        id: "alt-rice-honeytoast",
        name: { en: "White Toast with Natural Honey", ar: "توست أبيض مع عسل طبيعي" },
        quantity: { en: "2 slices + 15g honey", ar: "شريحتين توست + 15 جم عسل" },
        calories: 185,
        protein: 4,
        carbs: 41,
        fats: 1,
        thumbnailUrl: "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400&auto=format&fit=crop&q=80",
        reason: { en: "Fast-acting glycogen replenisher", ar: "طاقة جلوكوز سريعة التدفق للعضلات قبل التمرين" },
      },
      {
        id: "alt-rice-creamrice",
        name: { en: "Cream of Rice with Cinnamon", ar: "كريمة أرز مع قرفة" },
        quantity: { en: "50g dry cream of rice", ar: "50 جم بودرة أرز بالماء والقرفة" },
        calories: 180,
        protein: 3,
        carbs: 40,
        fats: 0.5,
        thumbnailUrl: "https://images.unsplash.com/photo-1536304993881-ff6e9eefa2a6?w=400&auto=format&fit=crop&q=80",
        reason: { en: "Super easy digestion pre-session", ar: "فائقة السلاسة وخفيفة جداً على المعدة" },
      },
    ],
  },
]

const DINNER: MealItem[] = [
  {
    id: "m-fish-fillet",
    name: { en: "Grilled Fish Fillet or Water Tuna", ar: "فيليه سمك مشوي أو تونة مصفاة" },
    quantity: { en: "150g", ar: "150 جرام" },
    percentage: 70,
    calories: 220,
    protein: 36,
    carbs: 0,
    fats: 6,
    thumbnailUrl: "https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?w=400&auto=format&fit=crop&q=80",
    alternatives: [
      {
        id: "alt-din-cottage",
        name: { en: "Low Fat Cottage Cheese with Flaxseeds", ar: "جبنة قريش مع بذور كتان مطحونة" },
        quantity: { en: "200g + 1 tsp flax", ar: "200 جم جبنة قريش + ملعقة بذور كتان" },
        calories: 215,
        protein: 26,
        carbs: 6,
        fats: 7,
        thumbnailUrl: "https://images.unsplash.com/photo-1559561853-08451507cbe7?w=400&auto=format&fit=crop&q=80",
        reason: { en: "Sustained nighttime casein release", ar: "إمداد بروتيني بطيء ومستقر أثناء النوم" },
      },
    ],
  },
  {
    id: "m-veg-sautee",
    name: { en: "Steamed / Sautéed Vegetables (Zucchini, Broccoli, Green Beans)", ar: "خضار سوتيه مشكل (كوسة، بروكلي، فاصوليا خضراء)" },
    quantity: { en: "180g", ar: "180 جرام" },
    percentage: 30,
    calories: 135,
    protein: 5,
    carbs: 18,
    fats: 4,
    thumbnailUrl: "https://images.unsplash.com/photo-1540420773420-3366772f4999?w=400&auto=format&fit=crop&q=80",
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
  {
    id: "s-bf",
    slot: "breakfast",
    label: { en: "Meal 1 (Breakfast)", ar: "اول وجبه (الفطار)" },
    calories: 550,
    coachingNote: {
      en: "After this meal, drink 2 cups of green tea or celery & parsley tea, and take one Vitacid C tablet.",
      ar: "بعد الوجبه دى خد 2 باكت شاي اخضر او شاي الكرفس والبقدونس وخد حبايه فيتاسيد سي.",
    },
    items: BREAKFAST,
  },
  {
    id: "s-ln",
    slot: "lunch",
    label: { en: "Meal 2 (Lunch)", ar: "الغدا" },
    calories: 500,
    coachingNote: {
      en: "Drink 500ml of water 30 minutes before your meal to support healthy digestion.",
      ar: "احرص على شرب نصف لتر ماء قبل الوجبة بنصف ساعة لتنشيط عملية الهضم.",
    },
    items: LUNCH,
  },
  {
    id: "s-pre",
    slot: "pre_workout",
    label: { en: "Meal 3 (Pre-Workout 1.5h before)", ar: "قبل التمرين بساعه ونص" },
    calories: 285,
    coachingNote: {
      en: "Consume 1.5 to 2 hours before training to fuel muscle glycogen without feeling heavy.",
      ar: "تناول الوجبة قبل التمرين بساعة ونصف إلى ساعتين لإمداد العضلات بالطاقة الكافية دون الشعور بالثقل.",
    },
    items: PRE_WORKOUT,
  },
  {
    id: "s-dn",
    slot: "dinner",
    label: { en: "Meal 4 (Dinner / Post-Workout)", ar: "العشاء (بعد التمرين)" },
    calories: 355,
    coachingNote: {
      en: "Light dinner rich in clean protein and fiber to optimize overnight recovery.",
      ar: "عشاء خفيف غني بالبروتين النظيف والألياف لدعم استشفاء العضلات أثناء النوم.",
    },
    items: DINNER,
  },
]

export const DEMO_NUTRITION: DemoNutritionProgram[] = [
  {
    id: "ntpl-cut",
    title: { en: "Fat-loss & Toning Nutrition", ar: "النظام الغذائي لحرق الدهون والتنشيف" },
    format: "interactive",
    version: 2,
    status: "template",
    targetCalories: 1690,
    targetWaterLiters: 3.0,
    macros: {
      proteinGrams: 155,
      carbsGrams: 185,
      fatsGrams: 40,
    },
    updatedAt: "2026-10-16T00:00:00.000Z",
    createdAt: "2026-06-01T00:00:00.000Z",
    days: week([
      { id: "c-0", weekday: 0, meals: FULL_DAY },
      { id: "c-1", weekday: 1, meals: FULL_DAY },
      { id: "c-2", weekday: 2, meals: FULL_DAY },
      { id: "c-3", weekday: 3, meals: FULL_DAY },
      { id: "c-4", weekday: 4, meals: FULL_DAY },
      { id: "c-5", weekday: 5, meals: FULL_DAY },
      { id: "c-6", weekday: 6, meals: FULL_DAY },
    ]),
  },
  {
    id: "ntpl-build",
    title: { en: "Muscle-build meals", ar: "وجبات بناء العضلات" },
    format: "interactive",
    version: 1,
    status: "template",
    targetCalories: 2600,
    targetWaterLiters: 3.5,
    macros: {
      proteinGrams: 180,
      carbsGrams: 320,
      fatsGrams: 65,
    },
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
    title: { en: "Alex — Fat-loss Plate (1690 kcal)", ar: "النظام الغذائي — 1690 سعرة" },
    format: "interactive",
    version: 2,
    status: "active",
    subscriberId: "sub-alex",
    templateId: "ntpl-cut",
    targetCalories: 1690,
    targetWaterLiters: 3.0,
    macros: {
      proteinGrams: 155,
      carbsGrams: 185,
      fatsGrams: 40,
    },
    adherence: { done: 18, total: 24 },
    createdAt: "2026-06-15T00:00:00.000Z",
    updatedAt: "2026-10-21T00:00:00.000Z",
    days: week([
      { id: "na-0", weekday: 0, meals: FULL_DAY },
      { id: "na-1", weekday: 1, meals: FULL_DAY },
      { id: "na-2", weekday: 2, meals: FULL_DAY },
      { id: "na-3", weekday: 3, meals: FULL_DAY },
      { id: "na-4", weekday: 4, meals: FULL_DAY },
      { id: "na-5", weekday: 5, meals: FULL_DAY },
      { id: "na-6", weekday: 6, meals: FULL_DAY },
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
