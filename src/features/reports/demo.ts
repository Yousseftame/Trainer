import { DEMO_CONTENT, getContentLinks } from "@/features/content/demo"
import {
  DEMO_ADHERENCE,
  DEMO_MEASUREMENTS,
  DEMO_PHOTOS,
  DEMO_TODAY,
  adherenceFor,
  adherenceScore,
  daysSinceCheckIn,
  lastCheckIn,
  latestMeasurement,
  latestWeek,
  progressRoster,
} from "@/features/progress/demo"
import { DEMO_REGISTRATION_REQUESTS } from "@/features/subscribers/requests-demo"
import { DEMO_SUBSCRIBERS, getSubscriberById, type DemoSubscriber } from "@/features/subscribers/demo"
import {
  DEMO_PACKAGES,
  DEMO_SUBSCRIPTIONS,
  getPackageById,
  type DemoPackage,
} from "@/features/subscriptions/demo"

export const REPORT_TODAY = DEMO_TODAY
export const EXPIRING_DAYS = 21

export type ReportTab = "inbox" | "activity" | "billing" | "adherence" | "progress" | "content" | "export"
export type NoticeKind = "registration" | "approval" | "activation" | "expiration"
export type NoticeStatus = "queued" | "sent" | "failed"
export type NoticeChannel = "email"

export type DemoNotice = {
  id: string
  kind: NoticeKind
  status: NoticeStatus
  channel: NoticeChannel
  subscriberId?: string
  requestId?: string
  packageId?: string
  subject: { en: string; ar: string }
  detail: { en: string; ar: string }
  createdAt: string
  sentAt?: string
  scheduledAt?: string
}

export const REPORT_TABS: ReportTab[] = [
  "inbox",
  "activity",
  "billing",
  "adherence",
  "progress",
  "content",
  "export",
]

function iso(value: string) {
  return value.includes("T") ? value : `${value}T00:00:00.000Z`
}

export function daysFromToday(value: string | null | undefined) {
  if (!value) return null
  return Math.ceil((new Date(value).getTime() - REPORT_TODAY.getTime()) / 86_400_000)
}

function weekAgoIso(days: number) {
  const date = new Date(REPORT_TODAY)
  date.setUTCDate(date.getUTCDate() - days)
  date.setUTCHours(0, 0, 0, 0)
  return date.toISOString()
}

export const DEMO_NOTICES: DemoNotice[] = [
  {
    id: "n-exp-alex",
    kind: "expiration",
    status: "queued",
    channel: "email",
    subscriberId: "sub-alex",
    packageId: "pkg-transform",
    subject: {
      en: "Transform ends in 13 days",
      ar: "باقة تحوّل تنتهي خلال 13 يوماً",
    },
    detail: {
      en: "Queued 14-day reminder. Renew before 10 Nov so the assigned programs stay live.",
      ar: "تذكير 14 يوماً في الانتظار. جدّد قبل 10 نوفمبر حتى تبقى البرامج المعيّنة.",
    },
    createdAt: iso("2026-10-27T08:00:00.000Z"),
    scheduledAt: iso("2026-10-27T08:00:00.000Z"),
  },
  {
    id: "n-reg-tamer",
    kind: "registration",
    status: "sent",
    channel: "email",
    requestId: "req-tamer",
    packageId: "pkg-quick",
    subject: {
      en: "We received Tamer’s request",
      ar: "استلمنا طلب تامر",
    },
    detail: {
      en: "Registration received email sent after the contact form.",
      ar: "أُرسل بريد استلام الطلب بعد نموذج التواصل.",
    },
    createdAt: iso("2026-10-27T08:42:00.000Z"),
    sentAt: iso("2026-10-27T08:42:00.000Z"),
  },
  {
    id: "n-reg-yara",
    kind: "registration",
    status: "sent",
    channel: "email",
    requestId: "req-yara",
    packageId: "pkg-elite",
    subject: {
      en: "We received Yara’s request",
      ar: "استلمنا طلب يارا",
    },
    detail: {
      en: "Registration received email sent after the contact form.",
      ar: "أُرسل بريد استلام الطلب بعد نموذج التواصل.",
    },
    createdAt: iso("2026-10-26T14:06:00.000Z"),
    sentAt: iso("2026-10-26T14:06:00.000Z"),
  },
  {
    id: "n-reg-layla",
    kind: "registration",
    status: "sent",
    channel: "email",
    requestId: "req-layla",
    subscriberId: "sub-layla",
    packageId: "pkg-transform",
    subject: {
      en: "We received Layla’s request",
      ar: "استلمنا طلب ليلى",
    },
    detail: {
      en: "Registration received email. Account stays pending until approval.",
      ar: "بريد استلام الطلب. الحساب يبقى معلّقاً حتى الموافقة.",
    },
    createdAt: iso("2026-10-22T09:21:00.000Z"),
    sentAt: iso("2026-10-22T09:21:00.000Z"),
  },
  {
    id: "n-act-nina",
    kind: "activation",
    status: "sent",
    channel: "email",
    subscriberId: "sub-nina",
    packageId: "pkg-transform",
    subject: {
      en: "Nina’s Transform is active",
      ar: "باقة تحوّل لنينا أصبحت نشطة",
    },
    detail: {
      en: "Activation email after Head Coach assigned Transform.",
      ar: "بريد التفعيل بعد تعيين المدرب الرئيسي لباقة تحوّل.",
    },
    createdAt: iso("2026-09-15T10:00:00.000Z"),
    sentAt: iso("2026-09-15T10:00:00.000Z"),
  },
  {
    id: "n-act-alex",
    kind: "activation",
    status: "sent",
    channel: "email",
    subscriberId: "sub-alex",
    packageId: "pkg-transform",
    subject: {
      en: "Alex moved onto Transform",
      ar: "أليكس انتقل إلى باقة تحوّل",
    },
    detail: {
      en: "Activation email when the Quick start rolled into Transform.",
      ar: "بريد التفعيل عند الانتقال من البداية السريعة إلى تحوّل.",
    },
    createdAt: iso("2026-08-12T09:00:00.000Z"),
    sentAt: iso("2026-08-12T09:00:00.000Z"),
  },
  {
    id: "n-exp-omar",
    kind: "expiration",
    status: "failed",
    channel: "email",
    subscriberId: "sub-omar",
    packageId: "pkg-quick",
    subject: {
      en: "Omar’s Quick start is ending",
      ar: "بداية عمر السريعة على وشك الانتهاء",
    },
    detail: {
      en: "Reminder bounced. Subscription later expired on 19 Sep — renew before assigning programs.",
      ar: "فشل التذكير. انتهى الاشتراك في 19 سبتمبر — جدّد قبل تعيين البرامج.",
    },
    createdAt: iso("2026-09-12T08:00:00.000Z"),
    scheduledAt: iso("2026-09-12T08:00:00.000Z"),
  },
  {
    id: "n-apr-hassan",
    kind: "approval",
    status: "sent",
    channel: "email",
    requestId: "req-hassan",
    subscriberId: "sub-hassan",
    subject: {
      en: "Hassan’s request was not approved",
      ar: "لم تُقبل طلبة حسن",
    },
    detail: {
      en: "Rejection email after the request was marked out of coaching scope.",
      ar: "بريد الرفض بعد اعتبار الطلب خارج نطاق التدريب.",
    },
    createdAt: iso("2026-05-03T12:05:00.000Z"),
    sentAt: iso("2026-05-03T12:05:00.000Z"),
  },
  {
    id: "n-apr-alex",
    kind: "approval",
    status: "sent",
    channel: "email",
    requestId: "req-alex",
    subscriberId: "sub-alex",
    packageId: "pkg-quick",
    subject: {
      en: "Alex’s account is ready",
      ar: "حساب أليكس جاهز",
    },
    detail: {
      en: "Approval email after the registration request was accepted.",
      ar: "بريد الموافقة بعد قبول طلب التسجيل.",
    },
    createdAt: iso("2026-04-02T10:05:00.000Z"),
    sentAt: iso("2026-04-02T10:05:00.000Z"),
  },
]

export function noticePerson(notice: DemoNotice) {
  if (notice.subscriberId) return getSubscriberById(notice.subscriberId)
  if (notice.requestId) {
    const request = DEMO_REGISTRATION_REQUESTS.find((item) => item.id === notice.requestId)
    if (!request) return undefined
    return {
      id: request.id,
      displayName: request.displayName,
      email: request.email,
    }
  }
  return undefined
}

export function expiringSubscriptions(windowDays = EXPIRING_DAYS) {
  return DEMO_SUBSCRIPTIONS.filter((item) => {
    if (item.status !== "active") return false
    const days = daysFromToday(item.endsAt)
    return days != null && days >= 0 && days <= windowDays
  }).sort((a, b) => new Date(a.endsAt ?? 0).getTime() - new Date(b.endsAt ?? 0).getTime())
}

function rate(done: number, total: number) {
  if (!total) return null
  return Math.round((done / total) * 100)
}

export function reportPulse() {
  const roster = progressRoster()
  const thisWeekStart = weekAgoIso(7)
  const lastWeekStart = weekAgoIso(14)
  return {
    expiring: expiringSubscriptions().length,
    attention: roster.filter((item) => item.bucket === "attention").length,
    pendingRequests: DEMO_REGISTRATION_REQUESTS.filter((item) => item.status === "pending").length,
    queued: DEMO_NOTICES.filter((item) => item.status === "queued").length,
    checkInsThisWeek: DEMO_MEASUREMENTS.filter((item) => item.recordedAt >= thisWeekStart).length,
    checkInsLastWeek: DEMO_MEASUREMENTS.filter(
      (item) => item.recordedAt >= lastWeekStart && item.recordedAt < thisWeekStart,
    ).length,
    photosThisMonth: DEMO_PHOTOS.filter((item) => item.takenAt >= "2026-10-01T00:00:00.000Z").length,
  }
}

export type ActivityRow = {
  subscriber: DemoSubscriber
  lastCheckIn?: string
  daysSince: number | null
  thisWeekWorkout: string
  thisWeekNutrition: string
  loggedThisWeek: boolean
}

export function activityRows(): ActivityRow[] {
  return DEMO_SUBSCRIBERS.filter((item) => item.status === "active" || item.status === "suspended").map(
    (subscriber) => {
      const week = latestWeek(subscriber.id)
      const last = lastCheckIn(subscriber.id)
      const days = daysSinceCheckIn(subscriber.id)
      return {
        subscriber,
        lastCheckIn: last,
        daysSince: days,
        thisWeekWorkout: week && week.workoutTotal ? `${week.workoutDone}/${week.workoutTotal}` : "—",
        thisWeekNutrition: week && week.nutritionTotal ? `${week.nutritionDone}/${week.nutritionTotal}` : "—",
        loggedThisWeek: Boolean(last && last >= weekAgoIso(7)),
      }
    },
  )
}

export type PackageRow = {
  pkg: DemoPackage
  active: number
  pending: number
  expiring: number
  share: number
}

export function packageRows(): PackageRow[] {
  const live = DEMO_PACKAGES.filter((item) => item.isActive)
  const activeTotal = DEMO_SUBSCRIPTIONS.filter((item) => item.status === "active").length || 1
  const expiringIds = new Set(expiringSubscriptions().map((item) => item.id))
  return live
    .map((pkg) => {
      const seats = DEMO_SUBSCRIPTIONS.filter((item) => item.packageId === pkg.id)
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

export type AdherenceRow = {
  subscriber: DemoSubscriber
  workoutThis: number | null
  workoutPrev: number | null
  nutritionThis: number | null
  nutritionPrev: number | null
  overall: number | null
  stale: boolean
}

export function adherenceRows(): AdherenceRow[] {
  return progressRoster()
    .filter((item) => item.subscriber.status === "active" || item.subscriber.status === "suspended")
    .map((person) => {
      const weeks = adherenceFor(person.subscriber.id)
      const current = weeks[weeks.length - 1]
      const previous = weeks[weeks.length - 2]
      return {
        subscriber: person.subscriber,
        workoutThis: current ? rate(current.workoutDone, current.workoutTotal) : null,
        workoutPrev: previous ? rate(previous.workoutDone, previous.workoutTotal) : null,
        nutritionThis: current ? rate(current.nutritionDone, current.nutritionTotal) : null,
        nutritionPrev: previous ? rate(previous.nutritionDone, previous.nutritionTotal) : null,
        overall: person.adherence,
        stale: person.stale,
      }
    })
    .sort((a, b) => (a.overall ?? 101) - (b.overall ?? 101))
}

export type ProgressRow = {
  subscriber: DemoSubscriber
  weightKg?: number
  deltaKg: number | null
  lastCheckIn?: string
  photoCount: number
  stale: boolean
  bucket: "attention" | "ontrack" | "quiet"
}

export function progressRows(): ProgressRow[] {
  return progressRoster()
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

export type ContentUsageRow = {
  id: string
  title: { en: string; ar: string }
  kind: "video" | "pdf" | "document"
  category: string
  activePrograms: number
  subscribers: number
  packages: number
  linked: boolean
}

export function contentUsageRows(): ContentUsageRow[] {
  return DEMO_CONTENT.map((asset) => {
    const links = getContentLinks(asset)
    const activePrograms = links.programs.filter((item) => item.status === "active").length
    return {
      id: asset.id,
      title: asset.title,
      kind: asset.kind,
      category: asset.category,
      activePrograms,
      subscribers: links.subscribers.length,
      packages: links.packages.length,
      linked: links.programs.length > 0 || links.subscribers.length > 0,
    }
  }).sort((a, b) => b.activePrograms + b.subscribers - (a.activePrograms + a.subscribers))
}

export function contentUsageStats(rows: ContentUsageRow[] = contentUsageRows()) {
  return {
    linked: rows.filter((item) => item.linked).length,
    unlinked: rows.filter((item) => !item.linked).length,
    inActivePrograms: rows.filter((item) => item.activePrograms > 0).length,
    videos: rows.filter((item) => item.kind === "video").length,
  }
}

export function adherenceTotals() {
  const latest = new Map<string, (typeof DEMO_ADHERENCE)[number]>()
  for (const week of DEMO_ADHERENCE) latest.set(week.subscriberId, week)
  let workoutDone = 0
  let workoutTotal = 0
  let nutritionDone = 0
  let nutritionTotal = 0
  for (const week of latest.values()) {
    workoutDone += week.workoutDone
    workoutTotal += week.workoutTotal
    nutritionDone += week.nutritionDone
    nutritionTotal += week.nutritionTotal
  }
  return {
    workout: rate(workoutDone, workoutTotal),
    nutrition: rate(nutritionDone, nutritionTotal),
  }
}

export type ExportKind = "expiring" | "adherence" | "progress" | "packages" | "notices" | "roster"

export function toCsv(headers: string[], rows: Array<Array<string | number | null | undefined>>) {
  const escape = (value: string | number | null | undefined) => `"${String(value ?? "").replace(/"/g, '""')}"`
  return [headers.map(escape).join(","), ...rows.map((row) => row.map(escape).join(","))].join("\n")
}

export function downloadText(filename: string, content: string) {
  const blob = new Blob([`\uFEFF${content}`], { type: "text/csv;charset=utf-8" })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

function personName(id: string) {
  return getSubscriberById(id)?.displayName ?? id
}

function packageName(id: string | null | undefined) {
  return getPackageById(id)?.name.en ?? ""
}

export function exportReport(kind: ExportKind) {
  const stamp = REPORT_TODAY.toISOString().slice(0, 10)
  if (kind === "expiring") {
    const rows = expiringSubscriptions().map((item) => [
      personName(item.subscriberId),
      packageName(item.packageId),
      item.status,
      item.endsAt ?? "",
      daysFromToday(item.endsAt),
    ])
    downloadText(`expiring-subscriptions-${stamp}.csv`, toCsv(["Subscriber", "Package", "Status", "Ends", "Days left"], rows))
    return
  }
  if (kind === "adherence") {
    const rows = adherenceRows().map((item) => [
      item.subscriber.displayName,
      item.workoutThis,
      item.workoutPrev,
      item.nutritionThis,
      item.nutritionPrev,
      item.overall,
    ])
    downloadText(
      `adherence-${stamp}.csv`,
      toCsv(["Subscriber", "Workout %", "Workout prev %", "Nutrition %", "Nutrition prev %", "Overall %"], rows),
    )
    return
  }
  if (kind === "progress") {
    const rows = progressRows().map((item) => [
      item.subscriber.displayName,
      item.weightKg,
      item.deltaKg,
      item.lastCheckIn ?? "",
      item.photoCount,
      item.bucket,
    ])
    downloadText(
      `progress-summary-${stamp}.csv`,
      toCsv(["Subscriber", "Weight kg", "Delta kg", "Last check-in", "Photos", "Bucket"], rows),
    )
    return
  }
  if (kind === "packages") {
    const rows = packageRows().map((item) => [item.pkg.name.en, item.active, item.pending, item.expiring, item.share])
    downloadText(`package-summary-${stamp}.csv`, toCsv(["Package", "Active", "Pending", "Expiring", "Share %"], rows))
    return
  }
  if (kind === "notices") {
    const rows = DEMO_NOTICES.map((item) => [
      item.kind,
      item.status,
      item.channel,
      noticePerson(item)?.displayName ?? "",
      item.subject.en,
      item.sentAt ?? item.scheduledAt ?? item.createdAt,
    ])
    downloadText(`notifications-${stamp}.csv`, toCsv(["Kind", "Status", "Channel", "Person", "Subject", "At"], rows))
    return
  }
  const rows = DEMO_SUBSCRIBERS.filter((item) => item.status !== "rejected").map((item) => {
    const sub = DEMO_SUBSCRIPTIONS.find(
      (row) => row.subscriberId === item.id && (row.status === "active" || row.status === "suspended"),
    )
    return [
      item.displayName,
      item.email,
      item.phone,
      item.status,
      packageName(sub?.packageId),
      sub?.status ?? "",
      sub?.endsAt ?? "",
      lastCheckIn(item.id) ?? "",
      latestMeasurement(item.id)?.weightKg ?? "",
      adherenceScore(item.id),
    ]
  })
  downloadText(
    `subscriber-roster-${stamp}.csv`,
    toCsv(
      ["Name", "Email", "Phone", "Account", "Package", "Subscription", "Ends", "Last check-in", "Weight kg", "Adherence %"],
      rows,
    ),
  )
}
