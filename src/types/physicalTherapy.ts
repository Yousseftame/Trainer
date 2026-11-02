import type { BilingualText } from "@/types/program"

export type PTAffectedArea =
  | "shoulder"
  | "knee"
  | "lower_back"
  | "neck"
  | "ankle"
  | "wrist"
  | "hip"
  | "elbow"
  | "other"

export type PTSeverity = "mild" | "moderate" | "severe"

export type PTStatus = "active" | "recovering" | "cleared"

export type PTMovementRestriction = {
  id: string
  prohibited: BilingualText // Exercise or movement to avoid (e.g. "Overhead Barbell Press")
  safeAlternative: BilingualText // Safe replacement (e.g. "Landmine Press or Neutral Grip DB Press")
  reason?: BilingualText // Medical/biomechanical reason
  equipment?: string
}

export type PTRehabExercise = {
  id: string
  name: BilingualText
  sets: number
  reps: string
  frequency: string // e.g., "Daily", "3x / week", "Pre-workout warmup"
  notes?: BilingualText
  videoUrl?: string
}

export type PhysicalTherapyRecord = {
  id: string
  subscriberId: string
  subscriberName?: string
  injuryTitle: BilingualText
  affectedArea: PTAffectedArea
  severity: PTSeverity
  status: PTStatus
  diagnosisDate: string
  clearanceDate?: string | null
  restrictions: PTMovementRestriction[]
  rehabExercises: PTRehabExercise[]
  therapistNotes?: BilingualText
  nextEvaluationDate?: string | null
  createdAt: string
  updatedAt: string
}

