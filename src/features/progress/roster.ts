import {
  adherenceScoreFromWeeks,
  type AdherenceWeek,
} from "@/features/progress/adherence"
import {
  daysSince,
  isStaleCheckIn,
  latestMeasurement,
  weightDelta,
} from "@/features/progress/metrics"
import type { Subscriber } from "@/features/subscribers/types"
import type {
  BodyMeasurement,
  ProgressPhoto,
} from "@/types/progress"

export type ProgressFilter = "all" | "attention" | "ontrack" | "quiet"
export type RosterTone = "success" | "warning" | "danger" | "muted" | "info"

export type RosterPerson = {
  subscriber: Subscriber
  weightKg?: number
  deltaKg: number | null
  adherence: number | null
  stale: boolean
  lastCheckIn?: string
  photoCount: number
  tone: RosterTone
  bucket: Exclude<ProgressFilter, "all">
}

function classify(person: {
  lastCheckIn?: string
  stale: boolean
  adherence: number | null
}): { bucket: RosterPerson["bucket"]; tone: RosterTone } {
  if (!person.lastCheckIn) return { bucket: "quiet", tone: "muted" }
  if (person.stale || (person.adherence != null && person.adherence < 70)) {
    return { bucket: "attention", tone: person.stale ? "danger" : "warning" }
  }
  if (person.adherence != null && person.adherence >= 75) {
    return { bucket: "ontrack", tone: "success" }
  }
  return { bucket: "ontrack", tone: "info" }
}

export function buildProgressRoster(input: {
  subscribers: Subscriber[]
  measurements: BodyMeasurement[]
  photos: ProgressPhoto[]
  adherenceBySubscriber?: Record<string, number | null>
}): RosterPerson[] {
  const measurementsBySub = new Map<string, BodyMeasurement[]>()
  for (const item of input.measurements) {
    const list = measurementsBySub.get(item.subscriberId) ?? []
    list.push(item)
    measurementsBySub.set(item.subscriberId, list)
  }

  const photoCountBySub = new Map<string, number>()
  for (const item of input.photos) {
    photoCountBySub.set(
      item.subscriberId,
      (photoCountBySub.get(item.subscriberId) ?? 0) + 1,
    )
  }

  return input.subscribers
    .filter((s) => s.status !== "rejected")
    .map((subscriber) => {
      const measurements = measurementsBySub.get(subscriber.id) ?? []
      const latest = latestMeasurement(measurements)
      const lastCheckIn = latest?.recordedAt
      const adherence =
        input.adherenceBySubscriber?.[subscriber.id] ?? null
      const base = {
        subscriber,
        weightKg: latest?.weightKg ?? subscriber.startingWeightKg,
        deltaKg: weightDelta(measurements, subscriber.startingWeightKg),
        adherence,
        stale: isStaleCheckIn(lastCheckIn),
        lastCheckIn,
        photoCount: photoCountBySub.get(subscriber.id) ?? 0,
      }
      const { bucket, tone } = classify(base)
      return { ...base, bucket, tone }
    })
}

export function progressStats(
  roster: RosterPerson[],
  measurements: BodyMeasurement[],
  photos: ProgressPhoto[],
  now = new Date(),
) {
  const weekAgo = new Date(now)
  weekAgo.setHours(0, 0, 0, 0)
  weekAgo.setDate(weekAgo.getDate() - 7)
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

  return {
    onTrack: roster.filter((item) => item.bucket === "ontrack").length,
    attention: roster.filter((item) => item.bucket === "attention").length,
    checkIns: measurements.filter(
      (item) => new Date(item.recordedAt) >= weekAgo,
    ).length,
    photos: photos.filter((item) => new Date(item.takenAt) >= monthStart)
      .length,
  }
}

export function getRosterPerson(roster: RosterPerson[], id: string) {
  return roster.find((item) => item.subscriber.id === id)
}

/** Compatibility helper for pages that still pass weeks arrays. */
export function adherenceScore(weeks: AdherenceWeek[]) {
  return adherenceScoreFromWeeks(weeks)
}

export function daysSinceCheckIn(isoDate?: string | null) {
  return daysSince(isoDate)
}

export function isStale(isoDate?: string | null) {
  return isStaleCheckIn(isoDate)
}
