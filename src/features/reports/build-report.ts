import { getContentLinks } from "@/features/content/access"
import {
  adherenceScoreFromWeeks,
  computeAdherenceWeeks,
  type AdherenceWeek,
} from "@/features/progress/adherence"
import { daysSince, isStaleCheckIn } from "@/features/progress/metrics"
import { buildProgressRoster } from "@/features/progress/roster"
import type { RegistrationRequest, Subscriber } from "@/features/subscribers/types"
import type { CatalogPackage } from "@/features/subscriptions/types"
import type { ContentAsset } from "@/types/content"
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
import {
  EXPIRING_DAYS,
  type ActivityRow,
  type AdherenceRow,
  type ContentUsageRow,
  type ExpiringSubscriptionRow,
  type OpsNotice,
  type PackageRow,
  type ProgressRow,
  type ReportPulse,
} from "@/features/reports/types"

export type ReportsLiveInput = {
  subscribers: Subscriber[]
  subscriptions: SubscriberSubscription[]
  packages: CatalogPackage[]
  registrationRequests: RegistrationRequest[]
  measurements: BodyMeasurement[]
  photos: ProgressPhoto[]
  workoutLogs: WorkoutSessionLog[]
  nutritionLogs: NutritionAdherenceLog[]
  workoutPrograms: WorkoutProgram[]
  nutritionPrograms: NutritionProgram[]
  contentAssets: ContentAsset[]
  notices: OpsNotice[]
  now?: Date
  expiringWindowDays?: number
}

function rate(done: number, total: number) {
  if (!total) return null
  return Math.round((done / total) * 100)
}

export function daysFromToday(
  value: string | null | undefined,
  now: Date = new Date(),
) {
  if (!value) return null
  return Math.ceil((new Date(value).getTime() - now.getTime()) / 86_400_000)
}

function weekAgoIso(days: number, now: Date) {
  const date = new Date(now)
  date.setUTCDate(date.getUTCDate() - days)
  date.setUTCHours(0, 0, 0, 0)
  return date.toISOString()
}

function packageById(packages: CatalogPackage[], id?: string | null) {
  if (!id) return undefined
  return packages.find((item) => item.id === id)
}

function logsForSubscriber<T extends { subscriberId: string }>(
  items: T[],
  subscriberId: string,
) {
  return items.filter((item) => item.subscriberId === subscriberId)
}

function programsForSubscriber<T extends { subscriberId?: string }>(
  items: T[],
  subscriberId: string,
) {
  return items.filter((item) => item.subscriberId === subscriberId)
}

function adherenceBySubscriber(input: ReportsLiveInput) {
  const map: Record<string, AdherenceWeek[]> = {}
  for (const subscriber of input.subscribers) {
    if (subscriber.status === "rejected") continue
    map[subscriber.id] = computeAdherenceWeeks({
      workoutLogs: logsForSubscriber(input.workoutLogs, subscriber.id),
      nutritionLogs: logsForSubscriber(input.nutritionLogs, subscriber.id),
      workoutPrograms: programsForSubscriber(
        input.workoutPrograms,
        subscriber.id,
      ),
      nutritionPrograms: programsForSubscriber(
        input.nutritionPrograms,
        subscriber.id,
      ),
      weeks: 8,
    })
  }
  return map
}

export function noticePerson(
  notice: OpsNotice,
  subscribers: Subscriber[],
  requests: RegistrationRequest[],
) {
  if (notice.subscriberId) {
    const sub = subscribers.find((item) => item.id === notice.subscriberId)
    if (sub) {
      return {
        id: sub.id,
        displayName: sub.displayName,
        email: sub.email,
      }
    }
  }
  if (notice.toName || notice.toEmail) {
    return {
      id: notice.requestId ?? notice.id,
      displayName: notice.toName || notice.toEmail || "—",
      email: notice.toEmail,
    }
  }
  if (notice.requestId) {
    const request = requests.find((item) => item.id === notice.requestId)
    if (request) {
      return {
        id: request.id,
        displayName: request.displayName,
        email: request.email,
      }
    }
  }
  return undefined
}

export function expiringSubscriptions(
  subscriptions: SubscriberSubscription[],
  windowDays = EXPIRING_DAYS,
  now = new Date(),
): ExpiringSubscriptionRow[] {
  return subscriptions
    .filter((item) => {
      if (item.status !== "active") return false
      const days = daysFromToday(item.endsAt, now)
      return days != null && days >= 0 && days <= windowDays
    })
    .map((item) => ({
      ...item,
      daysLeft: daysFromToday(item.endsAt, now),
    }))
    .sort(
      (a, b) =>
        new Date(a.endsAt ?? 0).getTime() - new Date(b.endsAt ?? 0).getTime(),
    )
}

export function buildReportPulse(input: ReportsLiveInput): ReportPulse {
  const now = input.now ?? new Date()
  const windowDays = input.expiringWindowDays ?? EXPIRING_DAYS
  const weeks = adherenceBySubscriber(input)
  const adherenceScores: Record<string, number | null> = {}
  for (const [id, list] of Object.entries(weeks)) {
    adherenceScores[id] = adherenceScoreFromWeeks(list)
  }
  const roster = buildProgressRoster({
    subscribers: input.subscribers,
    measurements: input.measurements,
    photos: input.photos,
    adherenceBySubscriber: adherenceScores,
  })
  const thisWeekStart = weekAgoIso(7, now)
  const lastWeekStart = weekAgoIso(14, now)
  const monthStart = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1),
  ).toISOString()

  return {
    expiring: expiringSubscriptions(input.subscriptions, windowDays, now)
      .length,
    attention: roster.filter((item) => item.bucket === "attention").length,
    pendingRequests: input.registrationRequests.filter(
      (item) => item.status === "pending",
    ).length,
    queued: input.notices.filter((item) => item.status === "queued").length,
    unread: input.notices.filter((item) => item.unread === true).length,
    checkInsThisWeek: input.measurements.filter(
      (item) => item.recordedAt >= thisWeekStart,
    ).length,
    checkInsLastWeek: input.measurements.filter(
      (item) =>
        item.recordedAt >= lastWeekStart && item.recordedAt < thisWeekStart,
    ).length,
    photosThisMonth: input.photos.filter((item) => item.takenAt >= monthStart)
      .length,
  }
}

export function buildActivityRows(input: ReportsLiveInput): ActivityRow[] {
  const now = input.now ?? new Date()
  const weeks = adherenceBySubscriber(input)
  const thisWeekStart = weekAgoIso(7, now)

  return input.subscribers
    .filter(
      (item) => item.status === "active" || item.status === "suspended",
    )
    .map((subscriber) => {
      const list = weeks[subscriber.id] ?? []
      const week = list[list.length - 1]
      const measurements = logsForSubscriber(
        input.measurements,
        subscriber.id,
      )
      const last = measurements[0]?.recordedAt
      return {
        subscriber,
        lastCheckIn: last,
        daysSince: daysSince(last, now),
        thisWeekWorkout:
          week && week.workoutTotal
            ? `${week.workoutDone}/${week.workoutTotal}`
            : "—",
        thisWeekNutrition:
          week && week.nutritionTotal
            ? `${week.nutritionDone}/${week.nutritionTotal}`
            : "—",
        loggedThisWeek: Boolean(last && last >= thisWeekStart),
      }
    })
}

export function buildPackageRows(
  packages: CatalogPackage[],
  subscriptions: SubscriberSubscription[],
  windowDays = EXPIRING_DAYS,
  now = new Date(),
): PackageRow[] {
  const live = packages.filter((item) => item.isActive)
  const activeTotal =
    subscriptions.filter((item) => item.status === "active").length || 1
  const expiringIds = new Set(
    expiringSubscriptions(subscriptions, windowDays, now).map((item) => item.id),
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

export function buildAdherenceRows(input: ReportsLiveInput): AdherenceRow[] {
  const weeks = adherenceBySubscriber(input)
  const adherenceScores: Record<string, number | null> = {}
  for (const [id, list] of Object.entries(weeks)) {
    adherenceScores[id] = adherenceScoreFromWeeks(list)
  }
  const roster = buildProgressRoster({
    subscribers: input.subscribers,
    measurements: input.measurements,
    photos: input.photos,
    adherenceBySubscriber: adherenceScores,
  })

  return roster
    .filter(
      (item) =>
        item.subscriber.status === "active" ||
        item.subscriber.status === "suspended",
    )
    .map((person) => {
      const list = weeks[person.subscriber.id] ?? []
      const current = list[list.length - 1]
      const previous = list[list.length - 2]
      return {
        subscriber: person.subscriber,
        workoutThis: current
          ? rate(current.workoutDone, current.workoutTotal)
          : null,
        workoutPrev: previous
          ? rate(previous.workoutDone, previous.workoutTotal)
          : null,
        nutritionThis: current
          ? rate(current.nutritionDone, current.nutritionTotal)
          : null,
        nutritionPrev: previous
          ? rate(previous.nutritionDone, previous.nutritionTotal)
          : null,
        overall: person.adherence,
        stale: person.stale,
      }
    })
    .sort((a, b) => (a.overall ?? 101) - (b.overall ?? 101))
}

export function buildProgressRows(input: ReportsLiveInput): ProgressRow[] {
  const weeks = adherenceBySubscriber(input)
  const adherenceScores: Record<string, number | null> = {}
  for (const [id, list] of Object.entries(weeks)) {
    adherenceScores[id] = adherenceScoreFromWeeks(list)
  }
  return buildProgressRoster({
    subscribers: input.subscribers,
    measurements: input.measurements,
    photos: input.photos,
    adherenceBySubscriber: adherenceScores,
  })
    .filter((item) => item.subscriber.status !== "rejected")
    .map((person) => ({
      subscriber: person.subscriber,
      weightKg: person.weightKg,
      deltaKg: person.deltaKg,
      lastCheckIn: person.lastCheckIn,
      photoCount: person.photoCount,
      stale: person.stale,
      bucket: person.bucket,
    }))
}

export function buildContentUsageRows(input: ReportsLiveInput): ContentUsageRow[] {
  return input.contentAssets
    .filter((asset) => asset.category !== "reference")
    .map((asset) => {
      const links = getContentLinks(
        asset,
        input.subscribers,
        input.packages,
        input.workoutPrograms,
        input.nutritionPrograms,
      )
      const activePrograms = links.programs.filter(
        (item) => item.status === "active",
      ).length
      return {
        id: asset.id,
        title: asset.title,
        kind: asset.kind,
        category: asset.category,
        activePrograms,
        subscribers: links.subscribers.length,
        packages: links.packages.length,
        linked:
          links.programs.length > 0 ||
          links.subscribers.length > 0 ||
          links.packages.length > 0,
      }
    })
    .sort(
      (a, b) =>
        b.activePrograms +
        b.subscribers -
        (a.activePrograms + a.subscribers),
    )
}

export function contentUsageStats(rows: ContentUsageRow[]) {
  return {
    linked: rows.filter((item) => item.linked).length,
    unlinked: rows.filter((item) => !item.linked).length,
    inActivePrograms: rows.filter((item) => item.activePrograms > 0).length,
    videos: rows.filter((item) => item.kind === "video").length,
  }
}

export function buildAdherenceTotals(input: ReportsLiveInput) {
  const weeks = adherenceBySubscriber(input)
  let workoutDone = 0
  let workoutTotal = 0
  let nutritionDone = 0
  let nutritionTotal = 0
  for (const list of Object.values(weeks)) {
    const current = list[list.length - 1]
    if (!current) continue
    workoutDone += current.workoutDone
    workoutTotal += current.workoutTotal
    nutritionDone += current.nutritionDone
    nutritionTotal += current.nutritionTotal
  }
  return {
    workout: rate(workoutDone, workoutTotal),
    nutrition: rate(nutritionDone, nutritionTotal),
  }
}

export function resolvePackageName(
  packages: CatalogPackage[],
  packageId?: string | null,
  locale: "en" | "ar" = "en",
) {
  return packageById(packages, packageId)?.name[locale] ?? ""
}

export function isCheckInStale(lastCheckIn?: string) {
  return isStaleCheckIn(lastCheckIn)
}
