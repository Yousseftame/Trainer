import { APP_ROUTES } from "@/config/constants"
import { DEMO_NUTRITION } from "@/features/nutrition/demo"
import {
  DEMO_ADHERENCE,
  DEMO_MEASUREMENTS,
  DEMO_TODAY,
  daysSinceCheckIn,
  progressRoster,
} from "@/features/progress/demo"
import { daysFromToday, expiringSubscriptions, packageRows } from "@/features/reports/demo"
import { DEMO_REGISTRATION_REQUESTS } from "@/features/subscribers/requests-demo"
import { DEMO_SUBSCRIBERS, getSubscriberById } from "@/features/subscribers/demo"
import { currentSubscriptionFor, getPackageById } from "@/features/subscriptions/demo"
import { DEMO_WORKOUTS } from "@/features/workouts/demo"

function rate(done: number, total: number) {
  if (!total) return null
  return Math.round((done / total) * 100)
}

function overall(workout: number | null, nutrition: number | null) {
  const parts = [workout, nutrition].filter((item): item is number => item != null)
  if (!parts.length) return null
  return Math.round(parts.reduce((sum, item) => sum + item, 0) / parts.length)
}

export function currentSeatMix() {
  const counts = { active: 0, expired: 0, pending: 0, suspended: 0 }
  for (const person of DEMO_SUBSCRIBERS) {
    if (person.status === "rejected") continue
    const seat = currentSubscriptionFor(person.id)
    if (!seat) continue
    if (seat.status === "active") counts.active += 1
    else if (seat.status === "expired") counts.expired += 1
    else if (seat.status === "pending") counts.pending += 1
    else if (seat.status === "suspended") counts.suspended += 1
  }
  return counts
}

export function adherenceTrend() {
  const weeks = new Map<
    string,
    { workoutDone: number; workoutTotal: number; nutritionDone: number; nutritionTotal: number }
  >()
  for (const week of DEMO_ADHERENCE) {
    const current = weeks.get(week.weekStart) ?? {
      workoutDone: 0,
      workoutTotal: 0,
      nutritionDone: 0,
      nutritionTotal: 0,
    }
    current.workoutDone += week.workoutDone
    current.workoutTotal += week.workoutTotal
    current.nutritionDone += week.nutritionDone
    current.nutritionTotal += week.nutritionTotal
    weeks.set(week.weekStart, current)
  }
  return [...weeks.entries()]
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

export function checkInTrend() {
  const buckets = new Map<string, number>()
  for (const row of DEMO_MEASUREMENTS) {
    const date = new Date(row.recordedAt)
    const day = date.getUTCDay()
    const monday = new Date(date)
    monday.setUTCDate(date.getUTCDate() - ((day + 6) % 7))
    monday.setUTCHours(0, 0, 0, 0)
    const key = monday.toISOString()
    buckets.set(key, (buckets.get(key) ?? 0) + 1)
  }
  return [...buckets.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-8)
    .map(([week, count]) => ({ week, count }))
}

export type PriorityKind = "request" | "expiring" | "expired" | "stale"

export type PriorityItem = {
  id: string
  kind: PriorityKind
  name: string
  href: string
  packageName?: { en: string; ar: string }
  createdAt?: string
  daysLeft?: number
  days?: number
}

export function overviewSnapshot() {
  const roster = progressRoster()
  const mix = currentSeatMix()
  const trend = adherenceTrend()
  const now = trend[trend.length - 1]
  const prev = trend[trend.length - 2]
  const checkIns = checkInTrend()
  const checkInsNow = checkIns[checkIns.length - 1]?.count ?? 0
  const checkInsPrev = checkIns[checkIns.length - 2]?.count ?? 0
  const pendingRequests = DEMO_REGISTRATION_REQUESTS.filter((item) => item.status === "pending")
    .slice()
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

  const requests = pendingRequests.map((item) => ({
    id: item.id,
    name: item.displayName,
    createdAt: item.createdAt,
    packageName: getPackageById(item.packageId)?.name,
  }))

  const expiring = expiringSubscriptions().map((item) => ({
    id: item.id,
    subscriberId: item.subscriberId,
    name: getSubscriberById(item.subscriberId)?.displayName ?? item.subscriberId,
    packageName: getPackageById(item.packageId)?.name,
    endsAt: item.endsAt,
    daysLeft: daysFromToday(item.endsAt) ?? 0,
  }))

  const expiredSeats = DEMO_SUBSCRIBERS.filter((person) => person.status !== "rejected")
    .map((person) => ({ person, seat: currentSubscriptionFor(person.id) }))
    .filter((item) => item.seat?.status === "expired")
    .map((item) => ({
      id: item.seat!.id,
      subscriberId: item.person.id,
      name: item.person.displayName,
      packageName: getPackageById(item.seat!.packageId)?.name,
      days: daysSinceCheckIn(item.person.id) ?? daysFromToday(item.seat!.endsAt) ?? 0,
    }))

  const stale = roster.filter((item) => {
    if (!item.stale) return false
    if (item.subscriber.status !== "active") return false
    const seat = currentSubscriptionFor(item.subscriber.id)
    return seat?.status === "active"
  })

  const priority: PriorityItem[] = [
    ...requests.map((item) => ({
      id: `req-${item.id}`,
      kind: "request" as const,
      name: item.name,
      href: APP_ROUTES.admin.registrationRequests,
      packageName: item.packageName,
      createdAt: item.createdAt,
    })),
    ...expiring.map((item) => ({
      id: `exp-${item.id}`,
      kind: "expiring" as const,
      name: item.name,
      href: APP_ROUTES.admin.subscriberDetail(item.subscriberId),
      packageName: item.packageName,
      daysLeft: item.daysLeft,
    })),
    ...expiredSeats.map((item) => ({
      id: `end-${item.id}`,
      kind: "expired" as const,
      name: item.name,
      href: APP_ROUTES.admin.subscriberDetail(item.subscriberId),
      packageName: item.packageName,
      days: Math.abs(item.days),
    })),
    ...stale.map((item) => ({
      id: `stale-${item.subscriber.id}`,
      kind: "stale" as const,
      name: item.subscriber.displayName,
      href: `${APP_ROUTES.admin.progress}?subscriber=${item.subscriber.id}`,
      days: daysSinceCheckIn(item.subscriber.id) ?? 0,
    })),
  ].slice(0, 6)

  const live = roster.filter((item) => item.subscriber.status !== "rejected")
  const onTrack = live.filter((item) => item.bucket === "ontrack").length
  const attention = live.filter((item) => item.bucket === "attention").length
  const quiet = live.filter((item) => item.bucket === "quiet").length

  return {
    today: DEMO_TODAY.toISOString(),
    subscribers: {
      total: DEMO_SUBSCRIBERS.filter((item) => item.status !== "rejected").length,
      active: DEMO_SUBSCRIBERS.filter((item) => item.status === "active").length,
    },
    subscriptions: {
      ...mix,
      expiring: expiring.length,
    },
    adherence: {
      workout: now?.workout ?? null,
      nutrition: now?.nutrition ?? null,
      overall: now?.overall ?? overall(now?.workout ?? null, now?.nutrition ?? null),
      previous: prev?.overall ?? null,
      trend,
    },
    checkIns: {
      now: checkInsNow,
      previous: checkInsPrev,
      trend: checkIns,
    },
    progress: { onTrack, attention, quiet },
    packages: packageRows(),
    programs: {
      workouts: DEMO_WORKOUTS.filter((item) => item.status === "active").length,
      nutrition: DEMO_NUTRITION.filter((item) => item.status === "active").length,
    },
    queue: priority.length,
    requests: requests.length,
    priority,
  }
}

export type OverviewSnapshot = ReturnType<typeof overviewSnapshot>
