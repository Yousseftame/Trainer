/**
 * Compatibility shim — demo progress seed data removed.
 * Prefer `@/features/progress/metrics`, `adherence`, `roster`, and Firestore services.
 */
import {
  adherenceScoreFromWeeks,
  computeAdherenceWeeks,
  latestAdherenceWeek,
  type AdherenceWeek,
} from "@/features/progress/adherence"
import {
  daysSince,
  firstMeasurement as firstFromList,
  isStaleCheckIn,
  latestMeasurement as latestFromList,
  liftSeries as liftSeriesFromList,
  previousMeasurement as previousFromList,
  weightDelta as weightDeltaFromList,
} from "@/features/progress/metrics"
import {
  buildProgressRoster,
  progressStats as statsFromRoster,
  type ProgressFilter,
  type RosterPerson,
  type RosterTone,
} from "@/features/progress/roster"
import type {
  BodyMeasurement,
  PerformanceRecord,
  ProgressPhoto,
} from "@/types/progress"

export type { AdherenceWeek, ProgressFilter, RosterPerson, RosterTone }

/** @deprecated Use `new Date()` */
export const DEMO_TODAY = new Date()

/** @deprecated Empty — live data comes from Firestore */
export const DEMO_MEASUREMENTS: BodyMeasurement[] = []
export const DEMO_PHOTOS: ProgressPhoto[] = []
export const DEMO_LIFTS: PerformanceRecord[] = []
export const DEMO_ADHERENCE: Array<AdherenceWeek & { subscriberId: string }> = []

export function measurementsFor(_subscriberId: string): BodyMeasurement[] {
  return []
}
export function photosFor(_subscriberId: string): ProgressPhoto[] {
  return []
}
export function liftsFor(_subscriberId: string): PerformanceRecord[] {
  return []
}
export function adherenceFor(_subscriberId: string): AdherenceWeek[] {
  return []
}
export function programsFor(_subscriberId: string) {
  return { workouts: [], nutrition: [] }
}

export function latestMeasurement(subscriberId: string) {
  return latestFromList(measurementsFor(subscriberId))
}
export function firstMeasurement(subscriberId: string) {
  return firstFromList(measurementsFor(subscriberId))
}
export function previousMeasurement(subscriberId: string) {
  return previousFromList(measurementsFor(subscriberId))
}
export function weightDelta(subscriberId: string) {
  return weightDeltaFromList(measurementsFor(subscriberId))
}
export function lastCheckIn(subscriberId: string) {
  return latestMeasurement(subscriberId)?.recordedAt
}
export function daysSinceCheckIn(subscriberId: string) {
  return daysSince(lastCheckIn(subscriberId))
}
export function isStale(subscriberId: string) {
  return isStaleCheckIn(lastCheckIn(subscriberId))
}
export function adherenceScore(subscriberId: string) {
  return adherenceScoreFromWeeks(adherenceFor(subscriberId))
}
export function latestWeek(subscriberId: string) {
  return latestAdherenceWeek(adherenceFor(subscriberId))
}
export function liftSeries(subscriberId: string) {
  return liftSeriesFromList(liftsFor(subscriberId))
}

export function progressRoster(): RosterPerson[] {
  return buildProgressRoster({
    subscribers: [],
    measurements: [],
    photos: [],
  })
}

export function progressStats(roster: RosterPerson[] = progressRoster()) {
  return statsFromRoster(roster, [], [])
}

export function getRosterPerson(id: string) {
  return progressRoster().find((item) => item.subscriber.id === id)
}

export {
  computeAdherenceWeeks,
  adherenceScoreFromWeeks,
  buildProgressRoster,
}
