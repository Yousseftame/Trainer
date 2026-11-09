import {
  buildAdherenceRows,
  buildPackageRows,
  buildProgressRows,
  daysFromToday,
  expiringSubscriptions,
  noticePerson,
  type ReportsLiveInput,
} from "@/features/reports/build-report"
import type { ExportKind } from "@/features/reports/types"

export function toCsv(
  headers: string[],
  rows: Array<Array<string | number | null | undefined>>,
) {
  const escape = (value: string | number | null | undefined) =>
    `"${String(value ?? "").replace(/"/g, '""')}"`
  return [
    headers.map(escape).join(","),
    ...rows.map((row) => row.map(escape).join(",")),
  ].join("\n")
}

export function downloadText(filename: string, content: string) {
  const blob = new Blob([`\uFEFF${content}`], {
    type: "text/csv;charset=utf-8",
  })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

export function exportReport(kind: ExportKind, input: ReportsLiveInput) {
  const stamp = (input.now ?? new Date()).toISOString().slice(0, 10)
  const packages = input.packages
  const packageName = (id?: string | null) =>
    packages.find((item) => item.id === id)?.name.en ?? ""

  if (kind === "expiring") {
    const rows = expiringSubscriptions(input.subscriptions).map((item) => [
      input.subscribers.find((s) => s.id === item.subscriberId)?.displayName ??
        item.subscriberId,
      packageName(item.packageId),
      item.status,
      item.endsAt ?? "",
      daysFromToday(item.endsAt, input.now),
    ])
    downloadText(
      `expiring-subscriptions-${stamp}.csv`,
      toCsv(["Subscriber", "Package", "Status", "Ends", "Days left"], rows),
    )
    return
  }

  if (kind === "adherence") {
    const rows = buildAdherenceRows(input).map((item) => [
      item.subscriber.displayName,
      item.workoutThis,
      item.workoutPrev,
      item.nutritionThis,
      item.nutritionPrev,
      item.overall,
    ])
    downloadText(
      `adherence-${stamp}.csv`,
      toCsv(
        [
          "Subscriber",
          "Workout %",
          "Workout prev %",
          "Nutrition %",
          "Nutrition prev %",
          "Overall %",
        ],
        rows,
      ),
    )
    return
  }

  if (kind === "progress") {
    const rows = buildProgressRows(input).map((item) => [
      item.subscriber.displayName,
      item.weightKg,
      item.deltaKg,
      item.lastCheckIn ?? "",
      item.photoCount,
      item.bucket,
    ])
    downloadText(
      `progress-summary-${stamp}.csv`,
      toCsv(
        [
          "Subscriber",
          "Weight kg",
          "Delta kg",
          "Last check-in",
          "Photos",
          "Bucket",
        ],
        rows,
      ),
    )
    return
  }

  if (kind === "packages") {
    const rows = buildPackageRows(input.packages, input.subscriptions).map(
      (item) => [
        item.pkg.name.en,
        item.active,
        item.pending,
        item.expiring,
        item.share,
      ],
    )
    downloadText(
      `package-summary-${stamp}.csv`,
      toCsv(["Package", "Active", "Pending", "Expiring", "Share %"], rows),
    )
    return
  }

  if (kind === "notices") {
    const rows = input.notices.map((item) => [
      item.kind,
      item.status,
      item.channel,
      noticePerson(item, input.subscribers, input.registrationRequests)
        ?.displayName ?? "",
      item.subject.en,
      item.sentAt ?? item.scheduledAt ?? item.createdAt,
    ])
    downloadText(
      `notifications-${stamp}.csv`,
      toCsv(["Kind", "Status", "Channel", "Person", "Subject", "At"], rows),
    )
    return
  }

  const adherence = buildAdherenceRows(input)
  const progress = buildProgressRows(input)
  const progressById = new Map(
    progress.map((item) => [item.subscriber.id, item]),
  )
  const adherenceById = new Map(
    adherence.map((item) => [item.subscriber.id, item]),
  )

  const rows = input.subscribers
    .filter((item) => item.status !== "rejected")
    .map((item) => {
      const sub = input.subscriptions.find(
        (row) =>
          row.subscriberId === item.id &&
          (row.status === "active" || row.status === "suspended"),
      )
      const prog = progressById.get(item.id)
      const adh = adherenceById.get(item.id)
      return [
        item.displayName,
        item.email,
        item.phone,
        item.status,
        packageName(sub?.packageId),
        sub?.status ?? "",
        sub?.endsAt ?? "",
        prog?.lastCheckIn ?? "",
        prog?.weightKg ?? "",
        adh?.overall ?? "",
      ]
    })

  downloadText(
    `subscriber-roster-${stamp}.csv`,
    toCsv(
      [
        "Name",
        "Email",
        "Phone",
        "Account",
        "Package",
        "Subscription",
        "Ends",
        "Last check-in",
        "Weight kg",
        "Adherence %",
      ],
      rows,
    ),
  )
}
