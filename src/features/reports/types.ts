import type { Subscriber } from "@/features/subscribers/types"
import type { CatalogPackage } from "@/features/subscriptions/types"
import type { ContentAsset } from "@/types/content"
import type { SubscriberSubscription } from "@/types/subscription"

export const EXPIRING_DAYS = 21

export type ReportTab =
  | "inbox"
  | "activity"
  | "billing"
  | "adherence"
  | "progress"
  | "content"
  | "export"

export const REPORT_TABS: ReportTab[] = [
  "inbox",
  "activity",
  "billing",
  "adherence",
  "progress",
  "content",
  "export",
]

export type NoticeKind =
  | "registration"
  | "approval"
  | "activation"
  | "expiration"

export type NoticeStatus = "queued" | "sent" | "failed"
export type NoticeChannel = "email" | "push" | "email+push"

export type OpsNotice = {
  id: string
  kind: NoticeKind
  status: NoticeStatus
  channel: NoticeChannel
  subscriberId?: string
  requestId?: string
  packageId?: string
  subscriptionId?: string
  toEmail?: string
  toName?: string
  subject: { en: string; ar: string }
  detail: { en: string; ar: string }
  /** Staff browser / inbox alert copy when different from customer email. */
  staffSubject?: { en: string; ar: string }
  staffDetail?: { en: string; ar: string }
  createdAt: string
  updatedAt?: string
  sentAt?: string
  scheduledAt?: string
  lastError?: string
  dedupeKey?: string
  fcmSent?: boolean
  mailQueued?: boolean
  /** Staff inbox badge — true until opened on Reports. */
  unread?: boolean
}

export type ActivityRow = {
  subscriber: Subscriber
  lastCheckIn?: string
  daysSince: number | null
  thisWeekWorkout: string
  thisWeekNutrition: string
  loggedThisWeek: boolean
}

export type PackageRow = {
  pkg: CatalogPackage
  active: number
  pending: number
  expiring: number
  share: number
}

export type AdherenceRow = {
  subscriber: Subscriber
  workoutThis: number | null
  workoutPrev: number | null
  nutritionThis: number | null
  nutritionPrev: number | null
  overall: number | null
  stale: boolean
}

export type ProgressRow = {
  subscriber: Subscriber
  weightKg?: number
  deltaKg: number | null
  lastCheckIn?: string
  photoCount: number
  stale: boolean
  bucket: "attention" | "ontrack" | "quiet"
}

export type ContentUsageRow = {
  id: string
  title: { en: string; ar: string }
  kind: ContentAsset["kind"]
  category: string
  activePrograms: number
  subscribers: number
  packages: number
  linked: boolean
}

export type ExportKind =
  | "expiring"
  | "adherence"
  | "progress"
  | "packages"
  | "notices"
  | "roster"

export type ReportPulse = {
  expiring: number
  attention: number
  pendingRequests: number
  queued: number
  unread: number
  checkInsThisWeek: number
  checkInsLastWeek: number
  photosThisMonth: number
}

export type ExpiringSubscriptionRow = SubscriberSubscription & {
  daysLeft: number | null
}
