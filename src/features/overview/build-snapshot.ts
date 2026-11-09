import { APP_ROUTES } from "@/config/constants"
import {
  adherenceScoreFromWeeks,
  computeAdherenceWeeks,
} from "@/features/progress/adherence"
import { daysSince } from "@/features/progress/metrics"
import { buildProgressRoster } from "@/features/progress/roster"
import type {
  PriorityItem,
  PriorityKind,
} from "@/features/overview/types"
import type { RegistrationRequest, Subscriber } from "@/features/subscribers/types"
import type { CatalogPackage } from "@/features/subscriptions/types"
import type {
  BodyMeasurement,
  ProgressPhoto,
} from "@/types/progress"
import type {
  NutritionAdherenceLog,
  NutritionProgram,
  WorkoutProgram,
  WorkoutSessionLog,
} from "@/types/program"
import type { SubscriberSubscription } from "@/types/subscription"
import { EXPIRING_DAYS } from "@/features/reports/types"

export type OverviewLiveInput = {
  subscribers: Subscriber[]
  subscriptions: SubscriberSubscription[]
  packages: CatalogPackage[]
  registrationRequests: RegistrationRequest[]
  workoutPrograms?: WorkoutProgram[]
  nutritionPrograms?: NutritionProgram[]
  measurements?: BodyMeasurement[]
  photos?: ProgressPhoto[]
  workoutLogs?: WorkoutSessionLog[]
  nutritionLogs?: NutritionAdherenceLog[]
  now?: Date
}

function rate(done: number, total: number) {
  if (!total) return null
  return Math.round((done / total) * 100)
}

function overall(workout: number | null, nutrition: number | null) {
  const parts = [workout, nutrition].filter(
    (item): item is number => item != null,
  )
  if (!parts.length) return null
  return Math.round(parts.reduce((sum, item) => sum + item, 0) / parts.length)
}

function daysFromToday(value: string | null | undefined, now: Date) {
  if (!value) return null
  return Math.ceil((new Date(value).getTime() - now.getTime()) / 86_400_000)
}

function packageById(packages: CatalogPackage[], id: string | null | undefined) {
  if (!id) return undefined
  return packages.find((p) => p.id === id)
}

function latestSubscriptionFor(
  subscriptions: SubscriberSubscription[],
  subscriberId: string,
) {
  return [...subscriptions]
    .filter((item) => item.subscriberId === subscriberId)
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    )[0]
}

function seatMix(
  subscribers: Subscriber[],
  subscriptions: SubscriberSubscription[],
) {
  const counts = { active: 0, expired: 0, pending: 0, suspended: 0 }
  for (const person of subscribers) {
    if (person.status === "rejected") continue
    const seat = latestSubscriptionFor(subscriptions, person.id)
    if (!seat) continue
    if (seat.status === "active") counts.active += 1
    else if (seat.status === "expired") counts.expired += 1
    else if (seat.status === "pending") counts.pending += 1
    else if (seat.status === "suspended") counts.suspended += 1
  }
  return counts
}

function packageRows(
  packages: CatalogPackage[],
  subscriptions: SubscriberSubscription[],
) {
  const live = packages.filter((item) => item.isActive)
  const activeTotal =
    subscriptions.filter((item) => item.status === "active").length || 1
  const expiringIds = new Set(
    subscriptions
      .filter((item) => {
        if (item.status !== "active") return false
        const days = daysFromToday(item.endsAt, new Date())
        return days != null && days >= 0 && days <= EXPIRING_DAYS
      })
      .map((item) => item.id),
  )

  return live
    .map((pkg) => {
      const seats = subscriptions.filter((item) => item.packageId === pkg.id)
      const active = seats.filter((item) => item.status === "active").length
      return {
        pkg,
        active,
        pending: seats.filter((item) => item.status === "pending").length,
        expiring: seats.filter((item) => expiringIds.has(item.id)).length,
        share: Math.round((active / activeTotal) * 100),
      }
    })
    .sort((a, b) => b.active - a.active)
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

function studioAdherenceTrend(input: {
  workoutLogs: WorkoutSessionLog[]
  nutritionLogs: NutritionAdherenceLog[]
  workoutPrograms: WorkoutProgram[]
  nutritionPrograms: NutritionProgram[]
}) {
  // Aggregate across all subscribers by summing per-subscriber week buckets.
  const bySubscriber = new Map<string, { w: WorkoutSessionLog[]; n: NutritionAdherenceLog[]; wp: WorkoutProgram[]; np: NutritionProgram[] }>()

  const ensure = (id: string) => {
    let row = bySubscriber.get(id)
    if (!row) {
      row = { w: [], n: [], wp: [], np: [] }
      bySubscriber.set(id, row)
    }
    return row
  }

  for (const log of input.workoutLogs) ensure(log.subscriberId).w.push(log)
  for (const log of input.nutritionLogs) ensure(log.subscriberId).n.push(log)
  for (const program of input.workoutPrograms) {
    if (program.subscriberId) ensure(program.subscriberId).wp.push(program)
  }
  for (const program of input.nutritionPrograms) {
    if (program.subscriberId) ensure(program.subscriberId).np.push(program)
  }

  const weekMap = new Map<
    string,
    { workoutDone: number; workoutTotal: number; nutritionDone: number; nutritionTotal: number }
  >()

  for (const row of bySubscriber.values()) {
    const weeks = computeAdherenceWeeks({
      workoutLogs: row.w,
      nutritionLogs: row.n,
      workoutPrograms: row.wp,
      nutritionPrograms: row.np,
      weeks: 8,
    })
    for (const week of weeks) {
      const current = weekMap.get(week.weekStart) ?? {
        workoutDone: 0,
        workoutTotal: 0,
        nutritionDone: 0,
        nutritionTotal: 0,
      }
      current.workoutDone += week.workoutDone
      current.workoutTotal += week.workoutTotal
      current.nutritionDone += week.nutritionDone
      current.nutritionTotal += week.nutritionTotal
      weekMap.set(week.weekStart, current)
    }
  }

  return [...weekMap.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-8)
    .map(([week, value]) => ({
      week,
      workout: rate(value.workoutDone, value.workoutTotal),
      nutrition: rate(value.nutritionDone, value.nutritionTotal),
      overall: rate(
        value.workoutDone + value.nutritionDone,
        value.workoutTotal + value.nutritionTotal,
      ),
    }))
}

function checkInTrend(measurements: BodyMeasurement[], now: Date) {
  const buckets = new Map<string, number>()
  for (let i = 7; i >= 0; i -= 1) {
    const start = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
    )
    const day = start.getUTCDay() || 7
    start.setUTCDate(start.getUTCDate() - (day - 1) - i * 7)
    buckets.set(start.toISOString(), 0)
  }

  for (const row of measurements) {
    const key = startOfUtcWeek(row.recordedAt)
    if (!buckets.has(key)) continue
    buckets.set(key, (buckets.get(key) ?? 0) + 1)
  }

  return [...buckets.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([week, count]) => ({ week, count }))
}

/**
 * Live admin overview snapshot from Firestore module data.
 * Summaries only — no demo fallbacks.
 */
export function buildOverviewSnapshot(input: OverviewLiveInput) {
  const now = input.now ?? new Date()
  const {
    subscribers,
    subscriptions,
    packages,
    registrationRequests,
    workoutPrograms = [],
    nutritionPrograms = [],
    measurements = [],
    photos = [],
    workoutLogs = [],
    nutritionLogs = [],
  } = input

  const mix = seatMix(subscribers, subscriptions)
  const trend = studioAdherenceTrend({
    workoutLogs,
    nutritionLogs,
    workoutPrograms,
    nutritionPrograms,
  })
  const nowWeek = trend[trend.length - 1]
  const prevWeek = trend[trend.length - 2]

  const checkIns = checkInTrend(measurements, now)
  const checkInsNow = checkIns[checkIns.length - 1]?.count ?? 0
  const checkInsPrev = checkIns[checkIns.length - 2]?.count ?? 0

  const adherenceBySubscriber: Record<string, number | null> = {}
  for (const person of subscribers) {
    if (person.status === "rejected") continue
    const weeks = computeAdherenceWeeks({
      workoutLogs: workoutLogs.filter((item) => item.subscriberId === person.id),
      nutritionLogs: nutritionLogs.filter(
        (item) => item.subscriberId === person.id,
      ),
      workoutPrograms: workoutPrograms.filter(
        (item) => item.subscriberId === person.id,
      ),
      nutritionPrograms: nutritionPrograms.filter(
        (item) => item.subscriberId === person.id,
      ),
      weeks: 4,
    })
    adherenceBySubscriber[person.id] = adherenceScoreFromWeeks(weeks)
  }

  const roster = buildProgressRoster({
    subscribers,
    measurements,
    photos,
    adherenceBySubscriber,
  })

  const pendingRequests = registrationRequests
    .filter((item) => item.status === "pending")
    .slice()
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    )

  const requests = pendingRequests.map((item) => ({
    id: item.id,
    name: item.displayName,
    createdAt: item.createdAt,
    packageName: packageById(packages, item.packageId)?.name,
  }))

  const expiring = subscriptions
    .filter((item) => {
      if (item.status !== "active") return false
      const days = daysFromToday(item.endsAt, now)
      return days != null && days >= 0 && days <= EXPIRING_DAYS
    })
    .sort(
      (a, b) =>
        new Date(a.endsAt ?? 0).getTime() - new Date(b.endsAt ?? 0).getTime(),
    )
    .map((item) => {
      const person = subscribers.find((s) => s.id === item.subscriberId)
      return {
        id: item.id,
        subscriberId: item.subscriberId,
        name: person?.displayName ?? item.subscriberId,
        packageName: packageById(packages, item.packageId)?.name,
        endsAt: item.endsAt,
        daysLeft: daysFromToday(item.endsAt, now) ?? 0,
      }
    })

  const expiredSeats = subscribers
    .filter((person) => person.status !== "rejected")
    .map((person) => ({
      person,
      seat: latestSubscriptionFor(subscriptions, person.id),
    }))
    .filter((item) => item.seat?.status === "expired")
    .map((item) => ({
      id: item.seat!.id,
      subscriberId: item.person.id,
      name: item.person.displayName,
      packageName: packageById(packages, item.seat!.packageId)?.name,
      days: Math.abs(daysFromToday(item.seat!.endsAt, now) ?? 0),
    }))

  const stale = roster.filter((item) => {
    if (!item.stale) return false
    if (item.subscriber.status !== "active") return false
    const seat = latestSubscriptionFor(subscriptions, item.subscriber.id)
    return seat?.status === "active"
  })

  const priority: PriorityItem[] = [
    ...requests.map((item) => ({
      id: `req-${item.id}`,
      kind: "request" as PriorityKind,
      name: item.name,
      href: APP_ROUTES.admin.registrationRequests,
      packageName: item.packageName,
      createdAt: item.createdAt,
    })),
    ...expiring.map((item) => ({
      id: `exp-${item.id}`,
      kind: "expiring" as PriorityKind,
      name: item.name,
      href: APP_ROUTES.admin.subscriberDetail(item.subscriberId),
      packageName: item.packageName,
      daysLeft: item.daysLeft,
    })),
    ...expiredSeats.map((item) => ({
      id: `end-${item.id}`,
      kind: "expired" as PriorityKind,
      name: item.name,
      href: APP_ROUTES.admin.subscriberDetail(item.subscriberId),
      packageName: item.packageName,
      days: item.days,
    })),
    ...stale.map((item) => ({
      id: `stale-${item.subscriber.id}`,
      kind: "stale" as PriorityKind,
      name: item.subscriber.displayName,
      href: `${APP_ROUTES.admin.progress}?subscriber=${item.subscriber.id}`,
      days: daysSince(item.lastCheckIn) ?? 0,
    })),
  ].slice(0, 8)

  const liveRoster = roster.filter((item) => item.subscriber.status !== "rejected")

  return {
    today: now.toISOString(),
    subscribers: {
      total: subscribers.filter((item) => item.status !== "rejected").length,
      active: subscribers.filter((item) => item.status === "active").length,
    },
    subscriptions: {
      ...mix,
      expiring: expiring.length,
    },
    adherence: {
      workout: nowWeek?.workout ?? null,
      nutrition: nowWeek?.nutrition ?? null,
      overall:
        nowWeek?.overall ??
        overall(nowWeek?.workout ?? null, nowWeek?.nutrition ?? null),
      previous: prevWeek?.overall ?? null,
      trend,
    },
    checkIns: {
      now: checkInsNow,
      previous: checkInsPrev,
      trend: checkIns,
    },
    progress: {
      onTrack: liveRoster.filter((item) => item.bucket === "ontrack").length,
      attention: liveRoster.filter((item) => item.bucket === "attention").length,
      quiet: liveRoster.filter((item) => item.bucket === "quiet").length,
    },
    packages: packageRows(packages, subscriptions),
    programs: {
      workouts: workoutPrograms.filter((item) => item.status === "active").length,
      nutrition: nutritionPrograms.filter((item) => item.status === "active")
        .length,
    },
    queue: priority.length,
    requests: requests.length,
    priority,
  }
}

export type LiveOverviewSnapshot = ReturnType<typeof buildOverviewSnapshot>
