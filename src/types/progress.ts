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

export type ProgressPhoto = {
  id: string
  subscriberId: string
  storagePath: string
  takenAt: string
  caption?: string
  createdAt: string
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
