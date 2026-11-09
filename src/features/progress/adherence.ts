import type {
  NutritionAdherenceLog,
  NutritionProgram,
  WorkoutProgram,
  WorkoutSessionLog,
} from "@/types/program"

export type AdherenceWeek = {
  weekStart: string
  workoutDone: number
  workoutTotal: number
  nutritionDone: number
  nutritionTotal: number
}

function startOfUtcWeek(iso: string): string {
  const date = new Date(iso)
  const day = date.getUTCDay() || 7
  const monday = new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  )
  monday.setUTCDate(monday.getUTCDate() - (day - 1))
  return monday.toISOString()
}

function rate(done: number, total: number) {
  if (!total) return null
  return Math.round((done / total) * 100)
}

function expectedWorkoutDays(programs: WorkoutProgram[]): number {
  const active = programs.filter((p) => p.status === "active")
  if (!active.length) return 0
  const counts = active.map((p) =>
    Math.max(1, p.days?.filter((d) => !d.isRest)?.length || p.days?.length || 0),
  )
  return Math.max(...counts)
}

function expectedNutritionDays(programs: NutritionProgram[]): number {
  const active = programs.filter((p) => p.status === "active")
  return active.length ? 7 : 0
}

/**
 * Build weekly adherence from live workout/nutrition logs.
 * Totals default to active program day counts (or observed maxima).
 */
export function computeAdherenceWeeks(input: {
  workoutLogs: WorkoutSessionLog[]
  nutritionLogs: NutritionAdherenceLog[]
  workoutPrograms?: WorkoutProgram[]
  nutritionPrograms?: NutritionProgram[]
  weeks?: number
}): AdherenceWeek[] {
  const weekCount = input.weeks ?? 8
  const now = new Date()
  const currentWeekStart = startOfUtcWeek(now.toISOString())
  const weeks: AdherenceWeek[] = []

  for (let i = weekCount - 1; i >= 0; i -= 1) {
    const start = new Date(currentWeekStart)
    start.setUTCDate(start.getUTCDate() - i * 7)
    weeks.push({
      weekStart: start.toISOString(),
      workoutDone: 0,
      workoutTotal: 0,
      nutritionDone: 0,
      nutritionTotal: 0,
    })
  }

  const byStart = new Map(weeks.map((w) => [w.weekStart, w]))
  const workoutTarget = expectedWorkoutDays(input.workoutPrograms ?? [])
  const nutritionTarget = expectedNutritionDays(input.nutritionPrograms ?? [])

  for (const log of input.workoutLogs) {
    const key = startOfUtcWeek(log.date || log.completedAt)
    const bucket = byStart.get(key)
    if (!bucket) continue
    bucket.workoutDone += 1
  }

  for (const log of input.nutritionLogs) {
    const key = startOfUtcWeek(log.date || log.loggedAt)
    const bucket = byStart.get(key)
    if (!bucket) continue
    if (log.status === "adhered" || log.status === "mostly") {
      bucket.nutritionDone += 1
    }
  }

  for (const week of weeks) {
    week.workoutTotal = Math.max(workoutTarget, week.workoutDone, 0)
    week.nutritionTotal = Math.max(nutritionTarget, week.nutritionDone, 0)
    // If no active program and no logs, leave totals at 0
    if (!workoutTarget && week.workoutDone === 0) week.workoutTotal = 0
    if (!nutritionTarget && week.nutritionDone === 0) week.nutritionTotal = 0
  }

  return weeks
}

export function adherenceScoreFromWeeks(weeks: AdherenceWeek[]) {
  const totals = weeks.reduce(
    (acc, week) => ({
      done: acc.done + week.workoutDone + week.nutritionDone,
      total: acc.total + week.workoutTotal + week.nutritionTotal,
    }),
    { done: 0, total: 0 },
  )
  return rate(totals.done, totals.total)
}

export function latestAdherenceWeek(weeks: AdherenceWeek[]) {
  return weeks[weeks.length - 1]
}
