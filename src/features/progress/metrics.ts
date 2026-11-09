import type {
  BodyMeasurement,
  PerformanceRecord,
  ProgressPhoto,
} from "@/types/progress"

export function sortMeasurementsAsc(items: BodyMeasurement[]) {
  return [...items].sort(
    (a, b) =>
      new Date(a.recordedAt).getTime() - new Date(b.recordedAt).getTime(),
  )
}

export function sortPhotosAsc(items: ProgressPhoto[]) {
  return [...items].sort(
    (a, b) => new Date(a.takenAt).getTime() - new Date(b.takenAt).getTime(),
  )
}

export function sortPerformanceAsc(items: PerformanceRecord[]) {
  return [...items].sort(
    (a, b) =>
      new Date(a.recordedAt).getTime() - new Date(b.recordedAt).getTime(),
  )
}

export function latestMeasurement(items: BodyMeasurement[]) {
  const list = sortMeasurementsAsc(items)
  return list[list.length - 1]
}

export function firstMeasurement(items: BodyMeasurement[]) {
  return sortMeasurementsAsc(items)[0]
}

export function previousMeasurement(items: BodyMeasurement[]) {
  const list = sortMeasurementsAsc(items)
  return list.length >= 2 ? list[list.length - 2] : undefined
}

export function weightDelta(items: BodyMeasurement[], startingWeightKg?: number) {
  const latest = latestMeasurement(items)?.weightKg
  if (latest == null) return null
  if (startingWeightKg != null) {
    return Math.round((latest - startingWeightKg) * 10) / 10
  }
  const first = firstMeasurement(items)?.weightKg
  if (first == null) return null
  return Math.round((latest - first) * 10) / 10
}

export function daysSince(isoDate?: string | null, now = new Date()) {
  if (!isoDate) return null
  const start = Date.UTC(
    new Date(isoDate).getUTCFullYear(),
    new Date(isoDate).getUTCMonth(),
    new Date(isoDate).getUTCDate(),
  )
  const end = Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate(),
  )
  return Math.round((end - start) / 86_400_000)
}

export function isStaleCheckIn(isoDate?: string | null, thresholdDays = 14) {
  const days = daysSince(isoDate)
  return days != null && days > thresholdDays
}

export function liftSeries(records: PerformanceRecord[]) {
  const sorted = sortPerformanceAsc(records)
  const grouped = new Map<string, PerformanceRecord[]>()
  for (const record of sorted) {
    const list = grouped.get(record.name) ?? []
    list.push(record)
    grouped.set(record.name, list)
  }
  return [...grouped.entries()].map(([name, list]) => {
    const first = list[0]
    const latest = list[list.length - 1]
    return {
      name,
      records: list,
      first: first.value,
      latest: latest.value,
      delta: Math.round((latest.value - first.value) * 10) / 10,
      unit: latest.unit,
    }
  })
}
