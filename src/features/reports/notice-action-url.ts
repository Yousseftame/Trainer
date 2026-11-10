import { APP_ROUTES } from "@/config/constants"
import type { OpsNotice } from "@/features/reports/types"

function isReportsSelfLink(url: string) {
  return url === APP_ROUTES.admin.reports || url.startsWith(`${APP_ROUTES.admin.reports}?`)
}

/** Desk destination for a notice CTA — never loops back to Reports itself. */
export function resolveNoticeActionUrl(notice: OpsNotice): string {
  if (notice.kind === "subscription_change") {
    if (notice.requestId) {
      return `${APP_ROUTES.admin.subscriptions}?request=${encodeURIComponent(notice.requestId)}`
    }
    if (notice.actionUrl && !isReportsSelfLink(notice.actionUrl)) {
      return notice.actionUrl
    }
    return APP_ROUTES.admin.subscriptions
  }

  if (notice.kind === "registration") {
    if (notice.requestId) {
      return `${APP_ROUTES.admin.registrationRequests}?request=${encodeURIComponent(notice.requestId)}`
    }
    if (notice.actionUrl && !isReportsSelfLink(notice.actionUrl)) {
      return notice.actionUrl
    }
    return APP_ROUTES.admin.registrationRequests
  }

  if (notice.actionUrl && !isReportsSelfLink(notice.actionUrl)) {
    return notice.actionUrl
  }

  if (notice.subscriberId) {
    return APP_ROUTES.admin.subscriberDetail(notice.subscriberId)
  }

  return APP_ROUTES.admin.reports
}

export function noticeActionIsReview(notice: OpsNotice) {
  return notice.kind === "subscription_change" || notice.kind === "registration"
}
