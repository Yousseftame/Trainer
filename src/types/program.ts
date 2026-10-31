export type ProgramFormat = "interactive" | "pdf"

export type BilingualText = {
  en: string
  ar: string
}

export type WorkoutExercise = {
  id: string
  name: string | BilingualText
  description?: string | BilingualText
  sets?: number
  reps?: string
  restSeconds?: number
  notes?: string | BilingualText
  /** Associated instructional video from Content Library */
  videoContentId?: string
  /** Cached video title or metadata for fast rendering */
  videoTitle?: string | BilingualText
  equipment?: string
}

export type WorkoutDay = {
  id: string
  weekday: number
  label?: string | BilingualText
  isRest?: boolean
  focus?: string | BilingualText
  exercises: WorkoutExercise[]
}

export type WorkoutProgram = {
  id: string
  title: BilingualText
  description?: BilingualText
  format: ProgramFormat
  version: number
  status: "template" | "active" | "archived"
  subscriberId?: string
  templateId?: string
  previousVersionId?: string
  days: WorkoutDay[]
  pdfContentId?: string
  pdfName?: BilingualText
  completion?: { done: number; total: number }
  createdAt: string
  updatedAt: string
  archivedAt?: string
  notes?: BilingualText
}

// Legacy aliases for backward compatibility
export type WorkoutTemplate = WorkoutProgram
export type WorkoutAssignment = WorkoutProgram

export type MealItem = {
  id: string
  name: string | BilingualText
  quantity?: string | BilingualText
  notes?: string | BilingualText
  calories?: number
  protein?: number
  carbs?: number
  fats?: number
}

export type MealSlotKey =
  | "breakfast"
  | "lunch"
  | "snack"
  | "dinner"
  | "pre_workout"
  | "post_workout"

export type MealSlot = {
  id: string
  slot: MealSlotKey
  label?: string | BilingualText
  timeRecommendation?: string
  items: MealItem[]
}

export type NutritionDay = {
  id: string
  weekday: number
  label?: string | BilingualText
  targetCalories?: number
  targetWaterLiters?: number
  meals: MealSlot[]
}

export type NutritionProgram = {
  id: string
  title: BilingualText
  description?: BilingualText
  format: ProgramFormat
  version: number
  status: "template" | "active" | "archived"
  subscriberId?: string
  templateId?: string
  previousVersionId?: string
  days: NutritionDay[]
  targetCalories?: number
  targetWaterLiters?: number
  macros?: {
    proteinGrams: number
    carbsGrams: number
    fatsGrams: number
  }
  pdfContentId?: string
  pdfName?: BilingualText
  adherence?: { done: number; total: number }
  createdAt: string
  updatedAt: string
  archivedAt?: string
  notes?: BilingualText
  disclaimerAcknowledged?: boolean
}

// Legacy aliases for backward compatibility
export type NutritionTemplate = NutritionProgram
export type NutritionAssignment = NutritionProgram

export type WorkoutSessionLog = {
  id: string
  subscriberId: string
  programId: string
  dayId: string
  weekday: number
  date: string
  durationMinutes?: number
  perceivedEffort?: number // RPE 1-10
  notes?: string
  completedAt: string
}

export type NutritionAdherenceLog = {
  id: string
  subscriberId: string
  programId: string
  date: string
  status: "adhered" | "mostly" | "deviated" | "skipped"
  caloriesActual?: number
  waterLitersActual?: number
  notes?: string
  loggedAt: string
}

