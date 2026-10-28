import { DEMO_NUTRITION } from "@/features/nutrition/demo"
import { DEMO_SUBSCRIBERS, type DemoSubscriber } from "@/features/subscribers/demo"
import { DEMO_WORKOUTS } from "@/features/workouts/demo"
import type {
  BodyMeasurement,
  PerformanceRecord,
  ProgressPhoto,
  ProgressPhotoPose,
} from "@/types/progress"

/** Frozen "today" so demo staleness stays stable. */
export const DEMO_TODAY = new Date("2026-10-28T12:00:00.000Z")

export type AdherenceWeek = {
  weekStart: string
  workoutDone: number
  workoutTotal: number
  nutritionDone: number
  nutritionTotal: number
}

export type ProgressFilter = "all" | "attention" | "ontrack" | "quiet"

export type RosterTone = "success" | "warning" | "danger" | "muted" | "info"

function iso(value: string) {
  return `${value}T00:00:00.000Z`
}

function startOfUtcDay(value: string) {
  const date = new Date(value)
  return Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate())
}

function daysBetween(later: string, earlier: string) {
  return Math.round((startOfUtcDay(later) - startOfUtcDay(earlier)) / 86_400_000)
}

function measure(
  id: string,
  subscriberId: string,
  day: string,
  extra: Partial<BodyMeasurement>,
): BodyMeasurement {
  return { id, subscriberId, recordedAt: iso(day), ...extra }
}

function photo(
  id: string,
  subscriberId: string,
  day: string,
  pose: ProgressPhotoPose,
  caption?: string,
): ProgressPhoto {
  return {
    id,
    subscriberId,
    pose,
    caption,
    takenAt: iso(day),
    createdAt: iso(day),
    storagePath: `progress/${subscriberId}/${day}-${pose}.jpg`,
  }
}

function lift(
  id: string,
  subscriberId: string,
  day: string,
  name: string,
  value: number,
  notes?: string,
): PerformanceRecord {
  return { id, subscriberId, recordedAt: iso(day), name, value, unit: "kg", notes }
}

function weeks(
  subscriberId: string,
  rows: Array<[string, number, number, number, number]>,
): Array<AdherenceWeek & { subscriberId: string }> {
  return rows.map(([weekStart, workoutDone, workoutTotal, nutritionDone, nutritionTotal]) => ({
    subscriberId,
    weekStart: iso(weekStart),
    workoutDone,
    workoutTotal,
    nutritionDone,
    nutritionTotal,
  }))
}

export const DEMO_MEASUREMENTS: BodyMeasurement[] = [
  measure("m-alex-1", "sub-alex", "2026-08-12", {
    weightKg: 86.4,
    chestCm: 104,
    waistCm: 92,
    hipsCm: 101,
    armsCm: 35,
    thighsCm: 58,
    notes: "Baseline at Transform start",
  }),
  measure("m-alex-2", "sub-alex", "2026-08-26", {
    weightKg: 85.7,
    chestCm: 104,
    waistCm: 91,
    hipsCm: 100.5,
    armsCm: 35,
    thighsCm: 57.5,
    notes: "Two weeks in — sleep still short",
  }),
  measure("m-alex-3", "sub-alex", "2026-09-09", {
    weightKg: 84.8,
    chestCm: 104,
    waistCm: 90,
    hipsCm: 100,
    armsCm: 35.5,
    thighsCm: 57,
    notes: "Week 4 photos taken",
  }),
  measure("m-alex-4", "sub-alex", "2026-09-23", {
    weightKg: 83.9,
    chestCm: 104.5,
    waistCm: 89,
    hipsCm: 99,
    armsCm: 35.5,
    thighsCm: 56.5,
    notes: "Strength holding on the cut",
  }),
  measure("m-alex-5", "sub-alex", "2026-10-07", {
    weightKg: 82.6,
    chestCm: 105,
    waistCm: 88,
    hipsCm: 98.5,
    armsCm: 36,
    thighsCm: 56,
    notes: "Waist moving, protein on target",
  }),
  measure("m-alex-6", "sub-alex", "2026-10-21", {
    weightKg: 81.4,
    chestCm: 105.5,
    waistCm: 87,
    hipsCm: 98,
    armsCm: 36,
    thighsCm: 55.5,
    notes: "Waist down 5 cm since start",
  }),

  measure("m-sara-1", "sub-sara", "2026-07-08", { weightKg: 64.2, chestCm: 88, waistCm: 74, hipsCm: 96, armsCm: 27, thighsCm: 54 }),
  measure("m-sara-2", "sub-sara", "2026-08-12", { weightKg: 63.6, chestCm: 88, waistCm: 73, hipsCm: 95.5, armsCm: 27.5, thighsCm: 53.5 }),
  measure("m-sara-3", "sub-sara", "2026-09-16", { weightKg: 63.1, chestCm: 88.5, waistCm: 72.5, hipsCm: 95, armsCm: 28, thighsCm: 53.5 }),
  measure("m-sara-4", "sub-sara", "2026-10-14", { weightKg: 62.9, chestCm: 89, waistCm: 72, hipsCm: 94.5, armsCm: 28, thighsCm: 53, notes: "Slow and consistent" }),

  measure("m-nina-1", "sub-nina", "2026-09-16", { weightKg: 57.8, chestCm: 82, waistCm: 66, hipsCm: 90, armsCm: 25, thighsCm: 50 }),
  measure("m-nina-2", "sub-nina", "2026-10-01", { weightKg: 58.6, chestCm: 83, waistCm: 66.5, hipsCm: 90.5, armsCm: 25.5, thighsCm: 50.5 }),
  measure("m-nina-3", "sub-nina", "2026-10-15", { weightKg: 59.4, chestCm: 83.5, waistCm: 67, hipsCm: 91, armsCm: 26, thighsCm: 51, notes: "Building, not cutting" }),

  measure("m-omar-1", "sub-omar", "2026-08-20", {
    weightKg: 92.1,
    chestCm: 108,
    waistCm: 98,
    hipsCm: 104,
    armsCm: 37,
    thighsCm: 61,
  }),
  measure("m-omar-2", "sub-omar", "2026-09-10", {
    weightKg: 90.4,
    chestCm: 107.5,
    waistCm: 96,
    hipsCm: 102,
    armsCm: 36.5,
    thighsCm: 60,
    notes: "Last check-in before the travel block ended",
  }),

  measure("m-karim-1", "sub-karim", "2026-06-18", {
    weightKg: 79.2,
    chestCm: 98,
    waistCm: 86,
    hipsCm: 97,
    armsCm: 33,
    thighsCm: 55,
  }),
  measure("m-karim-2", "sub-karim", "2026-07-09", {
    weightKg: 78.6,
    chestCm: 98,
    waistCm: 85,
    hipsCm: 96.5,
    armsCm: 33,
    thighsCm: 54.5,
    notes: "Paused shortly after this visit",
  }),
]

export const DEMO_PHOTOS: ProgressPhoto[] = [
  photo("p-alex-1", "sub-alex", "2026-08-12", "front", "Start of Transform"),
  photo("p-alex-2", "sub-alex", "2026-08-12", "side", "Start of Transform"),
  photo("p-alex-3", "sub-alex", "2026-08-12", "back", "Start of Transform"),
  photo("p-alex-4", "sub-alex", "2026-09-09", "front", "Week 4"),
  photo("p-alex-5", "sub-alex", "2026-09-09", "side", "Week 4"),
  photo("p-alex-6", "sub-alex", "2026-10-21", "front", "Week 10 check-in"),
  photo("p-alex-7", "sub-alex", "2026-10-21", "side", "Week 10 check-in"),
  photo("p-alex-8", "sub-alex", "2026-10-21", "back", "Week 10 check-in"),
  photo("p-sara-1", "sub-sara", "2026-07-08", "front", "Starter baseline"),
  photo("p-sara-2", "sub-sara", "2026-10-14", "front", "Week 14"),
  photo("p-nina-1", "sub-nina", "2026-09-16", "front", "Build start"),
  photo("p-nina-2", "sub-nina", "2026-10-15", "front", "Four weeks in"),
]

export const DEMO_LIFTS: PerformanceRecord[] = [
  lift("l-alex-b1", "sub-alex", "2026-08-18", "Bench press", 80),
  lift("l-alex-b2", "sub-alex", "2026-09-15", "Bench press", 82.5),
  lift("l-alex-b3", "sub-alex", "2026-10-20", "Bench press", 87.5, "Last set RPE 8"),
  lift("l-alex-s1", "sub-alex", "2026-08-20", "Back squat", 110, "Belt on, depth consistent"),
  lift("l-alex-s2", "sub-alex", "2026-09-17", "Back squat", 117.5),
  lift("l-alex-s3", "sub-alex", "2026-10-22", "Back squat", 125, "Paused reps feel stronger"),
  lift("l-alex-r1", "sub-alex", "2026-08-27", "Romanian deadlift", 90),
  lift("l-alex-r2", "sub-alex", "2026-10-08", "Romanian deadlift", 100),
  lift("l-sara-s1", "sub-sara", "2026-07-22", "Goblet squat", 16),
  lift("l-sara-s2", "sub-sara", "2026-09-02", "Goblet squat", 20),
  lift("l-sara-s3", "sub-sara", "2026-10-14", "Goblet squat", 24),
  lift("l-nina-r1", "sub-nina", "2026-09-18", "Romanian deadlift", 50),
  lift("l-nina-r2", "sub-nina", "2026-10-16", "Romanian deadlift", 60),
]

export const DEMO_ADHERENCE: Array<AdherenceWeek & { subscriberId: string }> = [
  ...weeks("sub-alex", [
    ["2026-09-01", 3, 4, 20, 24],
    ["2026-09-08", 4, 4, 22, 24],
    ["2026-09-15", 3, 4, 21, 24],
    ["2026-09-22", 4, 4, 23, 24],
    ["2026-09-29", 3, 4, 19, 24],
    ["2026-10-06", 4, 4, 22, 24],
    ["2026-10-13", 3, 4, 20, 24],
    ["2026-10-20", 3, 4, 18, 24],
  ]),
  ...weeks("sub-sara", [
    ["2026-09-01", 2, 3, 0, 0],
    ["2026-09-08", 3, 3, 0, 0],
    ["2026-09-15", 2, 3, 0, 0],
    ["2026-09-22", 2, 3, 0, 0],
    ["2026-09-29", 3, 3, 0, 0],
    ["2026-10-06", 2, 3, 0, 0],
    ["2026-10-13", 2, 3, 0, 0],
    ["2026-10-20", 1, 3, 0, 0],
  ]),
  ...weeks("sub-nina", [
    ["2026-09-15", 0, 0, 12, 20],
    ["2026-09-22", 0, 0, 14, 20],
    ["2026-09-29", 0, 0, 11, 20],
    ["2026-10-06", 0, 0, 13, 20],
    ["2026-10-13", 0, 0, 12, 20],
    ["2026-10-20", 0, 0, 10, 20],
  ]),
  ...weeks("sub-omar", [
    ["2026-08-25", 2, 4, 10, 20],
    ["2026-09-01", 1, 4, 8, 20],
    ["2026-09-08", 0, 4, 6, 20],
  ]),
]

export function measurementsFor(subscriberId: string) {
  return DEMO_MEASUREMENTS.filter((item) => item.subscriberId === subscriberId).sort(
    (a, b) => new Date(a.recordedAt).getTime() - new Date(b.recordedAt).getTime(),
  )
}

export function photosFor(subscriberId: string) {
  return DEMO_PHOTOS.filter((item) => item.subscriberId === subscriberId).sort(
    (a, b) => new Date(a.takenAt).getTime() - new Date(b.takenAt).getTime(),
  )
}

export function liftsFor(subscriberId: string) {
  return DEMO_LIFTS.filter((item) => item.subscriberId === subscriberId).sort(
    (a, b) => new Date(a.recordedAt).getTime() - new Date(b.recordedAt).getTime(),
  )
}

export function adherenceFor(subscriberId: string) {
  return DEMO_ADHERENCE.filter((item) => item.subscriberId === subscriberId).sort(
    (a, b) => new Date(a.weekStart).getTime() - new Date(b.weekStart).getTime(),
  )
}

export function programsFor(subscriberId: string) {
  return {
    workouts: DEMO_WORKOUTS.filter((item) => item.subscriberId === subscriberId),
    nutrition: DEMO_NUTRITION.filter((item) => item.subscriberId === subscriberId),
  }
}

function rate(done: number, total: number) {
  if (!total) return null
  return Math.round((done / total) * 100)
}

export function latestMeasurement(subscriberId: string) {
  const list = measurementsFor(subscriberId)
  return list[list.length - 1]
}

export function firstMeasurement(subscriberId: string) {
  return measurementsFor(subscriberId)[0]
}

export function previousMeasurement(subscriberId: string) {
  const list = measurementsFor(subscriberId)
  return list.length >= 2 ? list[list.length - 2] : undefined
}

export function weightDelta(subscriberId: string) {
  const first = firstMeasurement(subscriberId)?.weightKg
  const latest = latestMeasurement(subscriberId)?.weightKg
  if (first == null || latest == null) return null
  return Math.round((latest - first) * 10) / 10
}

export function lastCheckIn(subscriberId: string) {
  return latestMeasurement(subscriberId)?.recordedAt
}

export function daysSinceCheckIn(subscriberId: string) {
  const last = lastCheckIn(subscriberId)
  if (!last) return null
  return daysBetween(DEMO_TODAY.toISOString(), last)
}

export function isStale(subscriberId: string) {
  const days = daysSinceCheckIn(subscriberId)
  return days != null && days > 14
}

export function adherenceScore(subscriberId: string) {
  const weeksList = adherenceFor(subscriberId)
  const totals = weeksList.reduce(
    (acc, week) => ({
      done: acc.done + week.workoutDone + week.nutritionDone,
      total: acc.total + week.workoutTotal + week.nutritionTotal,
    }),
    { done: 0, total: 0 },
  )
  return rate(totals.done, totals.total)
}

export function latestWeek(subscriberId: string) {
  const list = adherenceFor(subscriberId)
  return list[list.length - 1]
}

export function liftSeries(subscriberId: string) {
  const grouped = new Map<string, PerformanceRecord[]>()
  for (const record of liftsFor(subscriberId)) {
    const list = grouped.get(record.name) ?? []
    list.push(record)
    grouped.set(record.name, list)
  }
  return [...grouped.entries()].map(([name, records]) => {
    const first = records[0]
    const latest = records[records.length - 1]
    return {
      name,
      records,
      first: first.value,
      latest: latest.value,
      delta: Math.round((latest.value - first.value) * 10) / 10,
      unit: latest.unit,
    }
  })
}

export type RosterPerson = {
  subscriber: DemoSubscriber
  weightKg?: number
  deltaKg: number | null
  adherence: number | null
  stale: boolean
  lastCheckIn?: string
  photoCount: number
  tone: RosterTone
  bucket: Exclude<ProgressFilter, "all">
}

function bucketFor(person: Omit<RosterPerson, "bucket" | "tone" | "subscriber"> & { subscriber: DemoSubscriber }): {
  bucket: RosterPerson["bucket"]
  tone: RosterTone
} {
  if (!person.lastCheckIn) return { bucket: "quiet", tone: "muted" }
  if (person.stale || (person.adherence != null && person.adherence < 70)) {
    return { bucket: "attention", tone: person.stale ? "danger" : "warning" }
  }
  if (person.adherence != null && person.adherence >= 75) return { bucket: "ontrack", tone: "success" }
  return { bucket: "ontrack", tone: "info" }
}

export function progressRoster(): RosterPerson[] {
  return DEMO_SUBSCRIBERS.filter((item) => item.status !== "rejected").map((subscriber) => {
    const latest = latestMeasurement(subscriber.id)
    const base = {
      subscriber,
      weightKg: latest?.weightKg,
      deltaKg: weightDelta(subscriber.id),
      adherence: adherenceScore(subscriber.id),
      stale: isStale(subscriber.id),
      lastCheckIn: lastCheckIn(subscriber.id),
      photoCount: photosFor(subscriber.id).length,
    }
    const { bucket, tone } = bucketFor(base)
    return { ...base, bucket, tone }
  })
}

export function progressStats(roster: RosterPerson[] = progressRoster()) {
  const weekAgo = new Date(DEMO_TODAY)
  weekAgo.setUTCHours(0, 0, 0, 0)
  weekAgo.setUTCDate(weekAgo.getUTCDate() - 7)
  const monthStart = "2026-10-01T00:00:00.000Z"

  return {
    onTrack: roster.filter((item) => item.bucket === "ontrack").length,
    attention: roster.filter((item) => item.bucket === "attention").length,
    checkIns: DEMO_MEASUREMENTS.filter((item) => item.recordedAt >= weekAgo.toISOString()).length,
    photos: DEMO_PHOTOS.filter((item) => item.takenAt >= monthStart).length,
  }
}

export function getRosterPerson(id: string) {
  return progressRoster().find((item) => item.subscriber.id === id)
}
