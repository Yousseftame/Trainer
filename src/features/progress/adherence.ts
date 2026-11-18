import type {
  NutritionAdherenceLog,
  NutritionProgram,
  WorkoutProgram,
  WorkoutSessionLog,
} from "@/types/program"

export type AdherenceWeek = {
  weekStart: string
  weekEnd: string
  workoutDone: number
  workoutTotal: number
  nutritionDone: number
  nutritionTotal: number
}

/** Saturday 00:00 UTC ISO for the Egypt week containing `iso` (Sat–Fri). */
export function startOfUtcWeek(iso: string): string {
  const date = new Date(iso)
  const day = date.getUTCDay() // Sun=0 … Sat=6
  const daysSinceSaturday = (day + 1) % 7
  const saturday = new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  )
  saturday.setUTCDate(saturday.getUTCDate() - daysSinceSaturday)
  return saturday.toISOString()
}

export function endOfUtcWeek(weekStartIso: string): string {
  const end = new Date(weekStartIso)
  end.setUTCDate(end.getUTCDate() + 6)
  end.setUTCHours(23, 59, 59, 999)
  return end.toISOString()
}

export function isSameUtcWeek(a: string, b: string): boolean {
  return startOfUtcWeek(a) === startOfUtcWeek(b)
}

export function adherenceWeekPercent(week: AdherenceWeek): number | null {
  const total = week.workoutTotal + week.nutritionTotal
  if (!total) return null
  return Math.round(((week.workoutDone + week.nutritionDone) / total) * 100)
}

function rate(done: number, total: number) {
  if (!total) return null
  return Math.round((done / total) * 100)
}

function expectedWorkoutDays(programs: WorkoutProgram[]): number {
  const active = programs.filter((p) => p.status === "active")
  if (!active.length) return 0
  // Match admin assign completion.total / subscriber trainingDayCount
  const counts = active.map((p) =>
    Math.max(
      0,
      p.completion?.total ??
        p.days?.filter((d) => !d.isRest && (d.exercises?.length ?? 0) > 0)
          .length ??
        0,
    ),
  )
  return Math.max(...counts, 0)
}

function expectedNutritionDays(programs: NutritionProgram[]): number {
  const active = programs.filter((p) => p.status === "active")
  return active.length ? 7 : 0
}

/**
 * Build weekly adherence from live workout/nutrition logs.
 * Totals default to active program day counts (or observed maxima).
 * Pass a large `weeks` (e.g. 52) for year-long history — rebuilt from logs, no separate store.
 */
export function computeAdherenceWeeks(input: {
  workoutLogs: WorkoutSessionLog[]
  nutritionLogs: NutritionAdherenceLog[]
  workoutPrograms?: WorkoutProgram[]
  nutritionPrograms?: NutritionProgram[]
  weeks?: number
}): AdherenceWeek[] {
  const weekCount = Math.max(1, Math.min(input.weeks ?? 8, 104))
  const now = new Date()
  const currentWeekStart = startOfUtcWeek(now.toISOString())
  const weeks: AdherenceWeek[] = []

  for (let i = weekCount - 1; i >= 0; i -= 1) {
    const start = new Date(currentWeekStart)
    start.setUTCDate(start.getUTCDate() - i * 7)
    const weekStart = start.toISOString()
    weeks.push({
      weekStart,
      weekEnd: endOfUtcWeek(weekStart),
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

/** Drop leading empty weeks so history starts at the first activity (keeps current week). */
export function trimLeadingEmptyAdherenceWeeks(
  weeks: AdherenceWeek[],
): AdherenceWeek[] {
  if (weeks.length <= 1) return weeks
  const firstActive = weeks.findIndex(
    (w) => w.workoutDone > 0 || w.nutritionDone > 0,
  )
  if (firstActive <= 0) return weeks
  // Always keep the current (last) week even if empty
  const trimmed = weeks.slice(firstActive)
  if (trimmed[trimmed.length - 1]?.weekStart !== weeks[weeks.length - 1]?.weekStart) {
    return [...trimmed, weeks[weeks.length - 1]]
  }
  return trimmed
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
