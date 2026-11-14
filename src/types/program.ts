export type ProgramFormat = "interactive" | "pdf"

export type BilingualText = {
  en: string
  ar: string
}

export type ExerciseAlternative = {
  id: string
  name: string | BilingualText
  reason?: string | BilingualText
  equipment?: string
  notes?: string | BilingualText
  videoContentId?: string
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
  /** Direct or embedded video URL */
  videoUrl?: string
  /** Thumbnail preview image */
  thumbnailUrl?: string
  /** Cached video title or metadata for fast rendering */
  videoTitle?: string | BilingualText
  equipment?: string
  targetMuscles?: string[]
  /** Alternative exercises if subscriber lacks equipment or has limitations */
  alternatives?: ExerciseAlternative[]
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

export type MealAlternative = {
  id: string
  name: string | BilingualText
  quantity?: string | BilingualText
  notes?: string | BilingualText
  percentage?: number
  calories?: number
  protein?: number
  carbs?: number
  fats?: number
  reason?: string | BilingualText
  thumbnailUrl?: string
}

export type MealItem = {
  id: string
  name: string | BilingualText
  quantity?: string | BilingualText
  notes?: string | BilingualText
  /** Calorie contribution percentage within the meal slot */
  percentage?: number
  calories?: number
  protein?: number
  carbs?: number
  fats?: number
  thumbnailUrl?: string
  /** Alternative food choices with matching macronutrients */
  alternatives?: MealAlternative[]
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
  calories?: number
  coachingNote?: string | BilingualText
  photoUrl?: string
  completed?: boolean
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

export type CompletedExerciseRecord = {
  exerciseId: string
  name: string
  targetSets?: number
  completedSets: number
  weightKg?: number
  repsDone?: string | number
  durationSeconds?: number
  restSeconds?: number
  notes?: string
  wasSubstituted?: boolean
  substituteName?: string
}

export type WorkoutSessionLog = {
  id: string
  subscriberId: string
  programId: string
  dayId: string
  weekday: number
  date: string
  workoutTitle?: string
  durationMinutes?: number
  activeMinutes?: number
  restMinutes?: number
  perceivedEffort?: number // RPE 1-10
  energyLevel?: "great" | "good" | "tired" | "exhausted"
  totalVolumeKg?: number
  exercisesCompleted?: CompletedExerciseRecord[]
  notes?: string
  completedAt: string
}

export type NutritionMealCheck = {
  slotId: string
  slotTitle: string
  completed: boolean
  updatedAt: string
}

export type NutritionMealPhoto = {
  slotId: string
  slotTitle: string
  photoUrl: string
  storagePath?: string
  note?: string
  uploadedAt: string
}

export type NutritionAdherenceLog = {
  id: string
  subscriberId: string
  programId: string
  date: string
  /** Optional day reference on the assigned nutrition program */
  dayId?: string
  weekday?: number
  status: "adhered" | "mostly" | "deviated" | "skipped"
  caloriesActual?: number
  waterLitersActual?: number
  notes?: string
  /** Per-meal eaten toggles for the day (coach-visible). */
  mealChecks?: NutritionMealCheck[]
  /** Meal verification photos for the day (coach-visible). */
  mealPhotos?: NutritionMealPhoto[]
  loggedAt: string
}

