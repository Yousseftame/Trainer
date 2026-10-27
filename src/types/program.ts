export type ProgramFormat = "interactive" | "pdf"

export type WorkoutExercise = {
  id: string
  name: string
  description?: string
  sets?: number
  reps?: string
  restSeconds?: number
  notes?: string
  videoContentId?: string
}

export type WorkoutDay = {
  id: string
  label: string
  exercises: WorkoutExercise[]
}

export type WorkoutTemplate = {
  id: string
  title: string
  format: ProgramFormat
  days: WorkoutDay[]
  pdfContentId?: string
  createdAt: string
  updatedAt: string
}

export type WorkoutAssignment = {
  id: string
  subscriberId: string
  templateId?: string
  title: string
  format: ProgramFormat
  days: WorkoutDay[]
  pdfContentId?: string
  status: "active" | "archived"
  assignedAt: string
  archivedAt?: string
}

export type MealItem = {
  id: string
  name: string
  quantity?: string
  notes?: string
  calories?: number
  protein?: number
  carbs?: number
  fats?: number
}

export type MealSlot = {
  id: string
  label: string
  items: MealItem[]
}

export type NutritionDay = {
  id: string
  label: string
  meals: MealSlot[]
}

export type NutritionTemplate = {
  id: string
  title: string
  format: ProgramFormat
  days: NutritionDay[]
  pdfContentId?: string
  createdAt: string
  updatedAt: string
}

export type NutritionAssignment = {
  id: string
  subscriberId: string
  templateId?: string
  title: string
  format: ProgramFormat
  days: NutritionDay[]
  pdfContentId?: string
  status: "active" | "archived"
  assignedAt: string
  archivedAt?: string
}
