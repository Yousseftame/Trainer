export type {
  ReportTab,
  NoticeKind,
  NoticeStatus,
  NoticeChannel,
  OpsNotice,
  ActivityRow,
  PackageRow,
  AdherenceRow,
  ProgressRow,
  ContentUsageRow,
  ExportKind,
  ReportPulse,
  ExpiringSubscriptionRow,
} from "@/features/reports/types"

export {
  REPORT_TABS,
  EXPIRING_DAYS,
} from "@/features/reports/types"

export {
  daysFromToday,
  noticePerson,
  expiringSubscriptions,
  buildReportPulse,
  buildActivityRows,
  buildPackageRows,
  buildAdherenceRows,
  buildProgressRows,
  buildContentUsageRows,
  contentUsageStats,
  buildAdherenceTotals,
  type ReportsLiveInput,
} from "@/features/reports/build-report"

export { exportReport, toCsv, downloadText } from "@/features/reports/export"

export {
  fetchReportsDesk,
  fetchOpsNotices,
  dispatchOpsNotice,
} from "@/features/reports/service"

export {
  useReportsDeskQuery,
  useOpsNoticesQuery,
  useAdminNotificationsBridge,
  useMarkNoticesReadOnMount,
  useMarkNoticeReadWhenOpened,
  useDispatchNoticeMutation,
  deriveReportsDesk,
  REPORTS_QUERY_KEYS,
} from "@/features/reports/hooks"

export {
  subscribeOpsNotices,
  countActionableNotices,
  markNoticesRead,
} from "@/features/reports/service"
