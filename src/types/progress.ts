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
  createdAt?: string
  updatedAt?: string
  createdBy?: string
}

export type ProgressPhotoPose = "front" | "side" | "back"

export type ProgressPhoto = {
  id: string
  subscriberId: string
  /** Firebase Storage object path — never store base64 here */
  storagePath: string
  /** Cached download URL (optional; prefer resolveProgressPhotoUrl) */
  downloadUrl?: string
  takenAt: string
  pose?: ProgressPhotoPose
  caption?: string
  mimeType?: string
  sizeBytes?: number
  sizeLabel?: string
  uploadedBy?: string
  createdAt: string
  updatedAt?: string
}

export type PerformanceRecord = {
  id: string
  subscriberId: string
  recordedAt: string
  name: string
  value: number
  unit: "kg" | "reps"
  notes?: string
  programId?: string
  exerciseId?: string
  createdAt?: string
  updatedAt?: string
  createdBy?: string
}
