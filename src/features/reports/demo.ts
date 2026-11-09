/**
 * @deprecated Empty shim — Reports & Notifications are Firestore-first.
 * Prefer `@/features/reports` (hooks / build-report / service).
 */
export {
  REPORT_TABS,
  EXPIRING_DAYS,
  daysFromToday,
} from "@/features/reports"

export type {
  ReportTab,
  NoticeKind,
  NoticeStatus,
  NoticeChannel,
  OpsNotice as DemoNotice,
  ExportKind,
} from "@/features/reports"

/** @deprecated Always empty — live notices come from Firestore `notices`. */
export const DEMO_NOTICES: never[] = []

/** @deprecated Use expiringSubscriptions(subscriptions) from build-report. */
export function expiringSubscriptions() {
  return []
}

/** @deprecated Use buildPackageRows(packages, subscriptions). */
export function packageRows() {
  return []
}
