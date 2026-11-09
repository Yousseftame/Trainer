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
  /** Exercise or movement to avoid (e.g. "Overhead Barbell Press") */
  prohibited: BilingualText
  /** Safe replacement (e.g. "Landmine Press") */
  safeAlternative: BilingualText
  reason?: BilingualText
  equipment?: string
  /** Lowercase tokens used by workout contraindication matching */
  matchTokens?: string[]
}

export type PTRehabExercise = {
  id: string
  name: BilingualText
  sets: number
  reps: string
  /** e.g. "Daily", "3x / week", "Pre-workout warmup" */
  frequency: string
  notes?: BilingualText
  /** Prefer Content Library id when available */
  videoContentId?: string
  /** External / legacy stream URL */
  videoUrl?: string
}

export type PhysicalTherapyRecord = {
  id: string
  subscriberId: string
  /** @deprecated Prefer resolving display name from subscribers query */
  subscriberName?: string
  injuryTitle: BilingualText
  affectedArea: PTAffectedArea
  severity: PTSeverity
  status: PTStatus
  diagnosisDate: string
  clearanceDate?: string | null
  nextEvaluationDate?: string | null
  restrictions: PTMovementRestriction[]
  rehabExercises: PTRehabExercise[]
  therapistNotes?: BilingualText
  createdAt: string
  updatedAt: string
  createdBy?: string
  updatedBy?: string
}
