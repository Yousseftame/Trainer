/** Personalized fitness & nutrition assessment attached to registration requests. */

export type AssessmentSex = "male" | "female"

export type FitnessExperience = "beginner" | "intermediate" | "advanced"

export type ActivityLevel =
  | "sedentary"
  | "light"
  | "moderate"
  | "very_active"

export type WorkoutFrequency = "1_2" | "3_4" | "5_6" | "daily"

export type PrimaryFitnessGoal =
  | "muscle_gain"
  | "fat_loss"
  | "maintenance"
  | "performance"

export type RegistrationAssessment = {
  age?: number
  sex?: AssessmentSex
  heightCm?: number
  startingWeightKg?: number
  targetWeightKg?: number
  healthNotes?: { en: string; ar: string }
  fitnessExperience?: FitnessExperience
  activityLevel?: ActivityLevel
  workoutFrequency?: WorkoutFrequency
  primaryGoal?: PrimaryFitnessGoal
}

export const FITNESS_EXPERIENCE_OPTIONS: FitnessExperience[] = [
  "beginner",
  "intermediate",
  "advanced",
]

export const ACTIVITY_LEVEL_OPTIONS: ActivityLevel[] = [
  "sedentary",
  "light",
  "moderate",
  "very_active",
]

export const WORKOUT_FREQUENCY_OPTIONS: WorkoutFrequency[] = [
  "1_2",
  "3_4",
  "5_6",
  "daily",
]

export const PRIMARY_GOAL_OPTIONS: PrimaryFitnessGoal[] = [
  "muscle_gain",
  "fat_loss",
  "maintenance",
  "performance",
]

function asOptionalNumber(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) return value
  if (typeof value === "string" && value.trim()) {
    const n = Number(value)
    if (Number.isFinite(n)) return n
  }
  return undefined
}

function asBilingual(
  value: unknown,
): { en: string; ar: string } | undefined {
  if (!value) return undefined
  if (typeof value === "string") {
    const t = value.trim()
    return t ? { en: t, ar: t } : undefined
  }
  if (typeof value === "object") {
    const obj = value as Record<string, unknown>
    const en = String(obj.en ?? "").trim()
    const ar = String(obj.ar ?? "").trim()
    if (!en && !ar) return undefined
    return { en: en || ar, ar: ar || en }
  }
  return undefined
}

export function normalizeRegistrationAssessment(
  raw: unknown,
): RegistrationAssessment | undefined {
  if (!raw || typeof raw !== "object") return undefined
  const data = raw as Record<string, unknown>

  const sexRaw = String(data.sex ?? "")
  const sex: AssessmentSex | undefined =
    sexRaw === "male" || sexRaw === "female" ? sexRaw : undefined

  const experienceRaw = String(data.fitnessExperience ?? "")
  const fitnessExperience = FITNESS_EXPERIENCE_OPTIONS.includes(
    experienceRaw as FitnessExperience,
  )
    ? (experienceRaw as FitnessExperience)
    : undefined

  const activityRaw = String(data.activityLevel ?? "")
  const activityLevel = ACTIVITY_LEVEL_OPTIONS.includes(
    activityRaw as ActivityLevel,
  )
    ? (activityRaw as ActivityLevel)
    : undefined

  const frequencyRaw = String(data.workoutFrequency ?? "")
  const workoutFrequency = WORKOUT_FREQUENCY_OPTIONS.includes(
    frequencyRaw as WorkoutFrequency,
  )
    ? (frequencyRaw as WorkoutFrequency)
    : undefined

  const goalRaw = String(data.primaryGoal ?? "")
  const primaryGoal = PRIMARY_GOAL_OPTIONS.includes(
    goalRaw as PrimaryFitnessGoal,
  )
    ? (goalRaw as PrimaryFitnessGoal)
    : undefined

  const assessment: RegistrationAssessment = {}
  const age = asOptionalNumber(data.age)
  if (age !== undefined) assessment.age = age
  if (sex) assessment.sex = sex
  const heightCm = asOptionalNumber(data.heightCm)
  if (heightCm !== undefined) assessment.heightCm = heightCm
  const startingWeightKg = asOptionalNumber(data.startingWeightKg)
  if (startingWeightKg !== undefined) assessment.startingWeightKg = startingWeightKg
  const targetWeightKg = asOptionalNumber(data.targetWeightKg)
  if (targetWeightKg !== undefined) assessment.targetWeightKg = targetWeightKg
  const healthNotes = asBilingual(data.healthNotes)
  if (healthNotes) assessment.healthNotes = healthNotes
  if (fitnessExperience) assessment.fitnessExperience = fitnessExperience
  if (activityLevel) assessment.activityLevel = activityLevel
  if (workoutFrequency) assessment.workoutFrequency = workoutFrequency
  if (primaryGoal) assessment.primaryGoal = primaryGoal

  return Object.keys(assessment).length > 0 ? assessment : undefined
}

/** Short bilingual summary for subscriber healthNotes when free-text notes are empty. */
export function buildAssessmentProfileSummary(
  assessment: RegistrationAssessment | undefined,
): { en: string; ar: string } | undefined {
  if (!assessment) return undefined
  if (assessment.healthNotes?.en || assessment.healthNotes?.ar) {
    return assessment.healthNotes
  }

  const enParts: string[] = []
  const arParts: string[] = []

  if (assessment.fitnessExperience) {
    enParts.push(`Experience: ${assessment.fitnessExperience}`)
    arParts.push(`الخبرة: ${assessment.fitnessExperience}`)
  }
  if (assessment.activityLevel) {
    enParts.push(`Activity: ${assessment.activityLevel}`)
    arParts.push(`النشاط: ${assessment.activityLevel}`)
  }
  if (assessment.workoutFrequency) {
    enParts.push(`Frequency: ${assessment.workoutFrequency}`)
    arParts.push(`التكرار: ${assessment.workoutFrequency}`)
  }
  if (assessment.primaryGoal) {
    enParts.push(`Primary goal: ${assessment.primaryGoal}`)
    arParts.push(`الهدف الأساسي: ${assessment.primaryGoal}`)
  }

  if (!enParts.length) return undefined
  return { en: enParts.join(" · "), ar: arParts.join(" · ") }
}
