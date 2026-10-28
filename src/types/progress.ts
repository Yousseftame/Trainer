export type BodyMeasurement = {
  id: string
  subscriberId: string
  recordedAt: string
  weightKg?: number
  chestCm?: number
  waistCm?: number
  hipsCm?: number
  armsCm?: number
  thighsCm?: number
  notes?: string
}

export type ProgressPhotoPose = "front" | "side" | "back"

export type ProgressPhoto = {
  id: string
  subscriberId: string
  storagePath: string
  takenAt: string
  pose?: ProgressPhotoPose
  caption?: string
  createdAt: string
}

export type PerformanceRecord = {
  id: string
  subscriberId: string
  recordedAt: string
  name: string
  value: number
  unit: "kg" | "reps"
  notes?: string
}

export type WorkoutLogEntry = {
  id: string
  subscriberId: string
  assignmentId: string
  dayId: string
  exerciseId?: string
  completedAt: string
  performanceNotes?: string
  setsCompleted?: number
  repsCompleted?: string
}

export type NutritionLogEntry = {
  id: string
  subscriberId: string
  assignmentId: string
  dayId: string
  mealId?: string
  adhered: boolean
  loggedAt: string
  notes?: string
}
