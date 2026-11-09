import { useEffect, useRef } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { QUERY_STALE_TIMES } from "@/config/constants"
import {
  buildActivityRows,
  buildAdherenceRows,
  buildAdherenceTotals,
  buildContentUsageRows,
  buildPackageRows,
  buildProgressRows,
  buildReportPulse,
  contentUsageStats,
  expiringSubscriptions,
  type ReportsLiveInput,
} from "@/features/reports/build-report"
import {
  countActionableNotices,
  dispatchOpsNotice,
  fetchOpsNotices,
  fetchReportsDesk,
  markNoticesRead,
  subscribeOpsNotices,
} from "@/features/reports/service"
import { EXPIRING_DAYS, type OpsNotice } from "@/features/reports/types"
import { claimNoticeAlert } from "@/features/notifications/dedupe"
import {
  registerPushNotifications,
  showBrowserNotification,
  startForegroundPushListener,
} from "@/features/notifications/service"
import { appToast } from "@/lib/toast"

export const REPORTS_QUERY_KEYS = {
  all: ["reports"] as const,
  desk: ["reports", "desk"] as const,
  notices: ["reports", "notices"] as const,
}

export function useReportsDeskQuery(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: REPORTS_QUERY_KEYS.desk,
    queryFn: fetchReportsDesk,
    staleTime: QUERY_STALE_TIMES.adminList,
    enabled: options?.enabled ?? true,
  })
}

export function useOpsNoticesQuery(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: REPORTS_QUERY_KEYS.notices,
    queryFn: fetchOpsNotices,
    staleTime: QUERY_STALE_TIMES.adminList,
    enabled: options?.enabled ?? true,
  })
}

function alertFromNotice(
  notice: OpsNotice,
  locale: "en" | "ar",
) {
  if (!claimNoticeAlert(notice.id)) return
  const subject = notice.staffSubject ?? notice.subject
  const detail = notice.staffDetail ?? notice.detail
  const title = subject[locale] || subject.en
  const body = detail[locale] || detail.en
  appToast.success(title)
  showBrowserNotification({
    title,
    body,
    url: "/admin/reports",
    tag: `notice-${notice.id}`,
  })
}

/**
 * Keeps notices + reports desk cache live via Firestore snapshots,
 * registers FCM, and shows a single browser notification per notice.
 */
export function useAdminNotificationsBridge(options?: {
  enabled?: boolean
  locale?: "en" | "ar"
}) {
  const enabled = options?.enabled ?? true
  const locale = options?.locale ?? "en"
  const queryClient = useQueryClient()
  const knownIdsRef = useRef<Set<string> | null>(null)
  const localeRef = useRef(locale)
  localeRef.current = locale

  const noticesQuery = useOpsNoticesQuery({ enabled })

  useEffect(() => {
    if (!enabled) return

    const unsub = subscribeOpsNotices((notices) => {
      const prev = knownIdsRef.current
      queryClient.setQueryData(REPORTS_QUERY_KEYS.notices, notices)
      queryClient.setQueryData(
        REPORTS_QUERY_KEYS.desk,
        (old: ReportsLiveInput | undefined) =>
          old ? { ...old, notices } : old,
      )

      if (prev) {
        for (const notice of notices) {
          if (prev.has(notice.id)) continue
          // Tab focused → prefer this locale-aware path; FCM is deduped.
          if (
            typeof document !== "undefined" &&
            document.visibilityState === "visible"
          ) {
            alertFromNotice(notice, localeRef.current)
          }
        }
      }
      knownIdsRef.current = new Set(notices.map((item) => item.id))
    })

    return () => unsub()
  }, [enabled, queryClient])

  useEffect(() => {
    if (!enabled) return
    let stopForeground: (() => void) | undefined
    let cancelled = false

    void (async () => {
      const result = await registerPushNotifications()
      if (cancelled) return
      if (!result.ok && result.reason && result.reason !== "denied") {
        console.warn("[notifications] push register:", result.reason)
      }
      stopForeground = await startForegroundPushListener((payload) => {
        // OS notification already claimed+shown inside startForegroundPushListener.
        appToast.success(payload.title)
        void queryClient.invalidateQueries({
          queryKey: REPORTS_QUERY_KEYS.all,
        })
      })
    })()

    return () => {
      cancelled = true
      stopForeground?.()
    }
  }, [enabled, queryClient])

  const notices = (noticesQuery.data ?? []) as OpsNotice[]
  return {
    notices,
    badgeCount: countActionableNotices(notices),
    queuedCount: notices.filter((item) => item.status === "queued").length,
    isLoading: noticesQuery.isLoading,
  }
}

/**
 * Marks a notice read when staff actually opens it in the inbox.
 * Leaves other unread items alone so the list stays honest.
 */
export function useMarkNoticeReadWhenOpened(
  noticeId: string | undefined,
  notices: OpsNotice[],
  enabled = true,
) {
  const queryClient = useQueryClient()
  const markedRef = useRef<Set<string>>(new Set())

  useEffect(() => {
    if (!enabled || !noticeId) return
    const notice = notices.find((item) => item.id === noticeId)
    if (!notice || notice.unread !== true) return
    if (markedRef.current.has(noticeId)) return
    markedRef.current.add(noticeId)

    const timer = window.setTimeout(() => {
      void markNoticesRead([noticeId])
        .then(() => {
          queryClient.setQueryData(
            REPORTS_QUERY_KEYS.notices,
            (old: OpsNotice[] | undefined) =>
              (old ?? []).map((item) =>
                item.id === noticeId ? { ...item, unread: false } : item,
              ),
          )
          queryClient.setQueryData(
            REPORTS_QUERY_KEYS.desk,
            (old: ReportsLiveInput | undefined) =>
              old
                ? {
                    ...old,
                    notices: old.notices.map((item) =>
                      item.id === noticeId
                        ? { ...item, unread: false }
                        : item,
                    ),
                  }
                : old,
          )
        })
        .catch((err) => {
          console.warn("[reports] markNoticesRead failed:", err)
          markedRef.current.delete(noticeId)
        })
    }, 450)

    return () => window.clearTimeout(timer)
  }, [enabled, noticeId, notices, queryClient])
}

/** @deprecated Prefer useMarkNoticeReadWhenOpened */
export function useMarkNoticesReadOnMount(notices: OpsNotice[], enabled = true) {
  useMarkNoticeReadWhenOpened(undefined, notices, enabled)
}

export function useDispatchNoticeMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (noticeId: string) => dispatchOpsNotice(noticeId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: REPORTS_QUERY_KEYS.all })
    },
  })
}

/** Derived view-models from a live desk payload. */
export function deriveReportsDesk(input: ReportsLiveInput | undefined) {
  if (!input) {
    return {
      pulse: {
        expiring: 0,
        attention: 0,
        pendingRequests: 0,
        queued: 0,
        unread: 0,
        checkInsThisWeek: 0,
        checkInsLastWeek: 0,
        photosThisMonth: 0,
      },
      expiring: [],
      activity: [],
      packages: [],
      adherence: [],
      progress: [],
      content: [],
      contentStats: {
        linked: 0,
        unlinked: 0,
        inActivePrograms: 0,
        videos: 0,
      },
      totals: { workout: null as number | null, nutrition: null as number | null },
      notices: [] as ReportsLiveInput["notices"],
    }
  }

  const content = buildContentUsageRows(input)
  return {
    pulse: buildReportPulse(input),
    expiring: expiringSubscriptions(
      input.subscriptions,
      EXPIRING_DAYS,
      input.now,
    ),
    activity: buildActivityRows(input),
    packages: buildPackageRows(
      input.packages,
      input.subscriptions,
      EXPIRING_DAYS,
      input.now,
    ),
    adherence: buildAdherenceRows(input),
    progress: buildProgressRows(input),
    content,
    contentStats: contentUsageStats(content),
    totals: buildAdherenceTotals(input),
    notices: input.notices,
  }
}
