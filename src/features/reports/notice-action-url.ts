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

  if (notice.kind === "exercise_change") {
    if (notice.requestId) {
      return `${APP_ROUTES.admin.workouts}?request=${encodeURIComponent(notice.requestId)}`
    }
    if (notice.actionUrl && !isReportsSelfLink(notice.actionUrl)) {
      return notice.actionUrl
    }
    return APP_ROUTES.admin.workouts
  }

  if (notice.kind === "workout_session") {
    if (notice.requestId) {
      const params = new URLSearchParams({ session: notice.requestId })
      if (notice.subscriberId) params.set("subscriber", notice.subscriberId)
      return `${APP_ROUTES.admin.workouts}?${params.toString()}`
    }
    if (notice.actionUrl && !isReportsSelfLink(notice.actionUrl)) {
      return notice.actionUrl
    }
    return APP_ROUTES.admin.workouts
  }

  if (notice.kind === "meal_change") {
    if (notice.requestId) {
      return `${APP_ROUTES.admin.nutrition}?request=${encodeURIComponent(notice.requestId)}`
    }
    if (notice.actionUrl && !isReportsSelfLink(notice.actionUrl)) {
      return notice.actionUrl
    }
    return APP_ROUTES.admin.nutrition
  }

  if (notice.kind === "nutrition_adherence") {
    if (notice.requestId) {
      const params = new URLSearchParams({ log: notice.requestId })
      if (notice.subscriberId) params.set("subscriber", notice.subscriberId)
      return `${APP_ROUTES.admin.nutrition}?${params.toString()}`
    }
    if (notice.actionUrl && !isReportsSelfLink(notice.actionUrl)) {
      return notice.actionUrl
    }
    return APP_ROUTES.admin.nutrition
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
  return (
    notice.kind === "subscription_change" ||
    notice.kind === "registration" ||
    notice.kind === "exercise_change" ||
    notice.kind === "meal_change"
  )
}
