import { useEffect, useMemo, useState, type ReactNode } from "react"
import { Link } from "react-router-dom"
import { useTranslation } from "react-i18next"
import {
  AlertTriangle,
  Bell,
  ChevronRight,
  CreditCard,
  Download,
  Inbox,
  Send,
} from "lucide-react"
import { StatCard } from "@/components/dashboard/StatCard"
import { APP_ROUTES } from "@/config/constants"
import { useAuth } from "@/features/auth/auth-context"
import {
  daysFromToday,
  exportReport,
  noticeActionIsReview,
  noticePerson,
  REPORT_TABS,
  deriveReportsDesk,
  resolveNoticeActionUrl,
  useDispatchNoticeMutation,
  useMarkNoticeReadWhenOpened,
  useOpsNoticesQuery,
  useReportsDeskQuery,
  type ExportKind,
  type ExpiringSubscriptionRow,
  type NoticeStatus,
  type OpsNotice,
  type ReportTab,
} from "@/features/reports"
import type { Subscriber } from "@/features/subscribers/types"
import type { CatalogPackage } from "@/features/subscriptions/types"
import { useDocumentTitle } from "@/hooks/useDocumentTitle"
import { useLocale } from "@/hooks/useLocale"
import { formatDate, formatKg, initials } from "@/lib/format"
import { appToast } from "@/lib/toast"
import { cn } from "@/lib/utils"
import type { AppLocale } from "@/i18n/rtl"

function signed(value: number, digits = 1) {
  const abs = Math.abs(value).toFixed(digits).replace(/\.0$/, "")
  if (value > 0) return `+${abs}`
  if (value < 0) return `−${abs}`
  return abs
}

function pct(value: number | null) {
  return value == null ? "—" : `${value}%`
}

function vsPrev(current: number | null, previous: number | null) {
  if (current == null || previous == null) return null
  return signed(current - previous, 0)
}

function statusDot(status: NoticeStatus) {
  if (status === "queued") return "bg-[#C9A227]"
  if (status === "failed") return "bg-[#C44536]"
  return "bg-[#22c55e]"
}

function isUnreadNotice(notice: OpsNotice) {
  return notice.unread === true
}

export function ReportsPage() {
  const { t } = useTranslation()
  const { locale } = useLocale()
  const { hasPermission } = useAuth()
  useDocumentTitle(t("nav.reports"))

  const canExport = hasPermission("reports:export")
  const canSend = hasPermission("notifications:send")
  const [tab, setTab] = useState<ReportTab>("inbox")
  const [inboxFilter, setInboxFilter] = useState<"all" | NoticeStatus>("all")
  const [openId, setOpenId] = useState<string | undefined>()
  /** Only true after a deliberate inbox click — auto-preview does not clear unread. */
  const [readOpenedId, setReadOpenedId] = useState<string | undefined>()

  const { data: desk, isLoading, isError, refetch } = useReportsDeskQuery()
  const { data: liveNotices } = useOpsNoticesQuery()
  const deskWithLiveNotices = useMemo(() => {
    if (!desk) return desk
    if (!liveNotices) return desk
    return { ...desk, notices: liveNotices }
  }, [desk, liveNotices])
  const derived = useMemo(
    () => deriveReportsDesk(deskWithLiveNotices),
    [deskWithLiveNotices],
  )
  const dispatchMutation = useDispatchNoticeMutation()

  const notices = derived.notices

  const inbox = notices.filter((item) =>
    inboxFilter === "all" ? true : item.status === inboxFilter,
  )
  const openNotice =
    inbox.find((item) => item.id === openId) ?? inbox[0] ?? undefined
  const unreadCount = derived.pulse.unread

  useMarkNoticeReadWhenOpened(
    readOpenedId,
    notices,
    !isLoading && !isError && tab === "inbox",
  )

  function openInboxNotice(id: string) {
    setOpenId(id)
    setReadOpenedId(id)
  }

  useEffect(() => {
    if (!openId && inbox[0]) setOpenId(inbox[0].id)
  }, [inbox, openId])

  // Keep selection valid when the live inbox reshuffles
  useEffect(() => {
    if (openId && !inbox.some((item) => item.id === openId) && inbox[0]) {
      setOpenId(inbox[0].id)
    }
  }, [inbox, openId])

  async function sendNotice(id: string) {
    try {
      await dispatchMutation.mutateAsync(id)
      appToast.success(t("admin.reports.toast.sent"))
      void refetch()
    } catch {
      appToast.error(t("admin.reports.toast.sendFailed"))
    }
  }

  function runExport(kind: ExportKind) {
    if (!canExport) {
      appToast.error(t("admin.reports.toast.noExport"))
      return
    }
    if (!desk) {
      appToast.error(t("admin.reports.toast.noExport"))
      return
    }
    exportReport(kind, deskWithLiveNotices ?? desk)
    appToast.success(t("admin.reports.toast.exported"))
  }

  function pickInboxFilter(next: "all" | NoticeStatus) {
    setInboxFilter(next)
    const first = notices.find((item) => next === "all" || item.status === next)
    setOpenId(first?.id)
    // Filter change only previews — do not mark read until a click.
  }

  const subscriberById = useMemo(() => {
    const map = new Map<string, Subscriber>()
    for (const item of desk?.subscribers ?? []) map.set(item.id, item)
    return map
  }, [desk?.subscribers])

  const packageById = useMemo(() => {
    const map = new Map<string, CatalogPackage>()
    for (const item of desk?.packages ?? []) map.set(item.id, item)
    return map
  }, [desk?.packages])

  if (isError) {
    return (
      <div className="rounded-[24px] bg-white p-8 text-center">
        <p className="text-[14px] font-medium text-[#C44536]">
          {t("admin.reports.empty.loadError")}
        </p>
        <button
          type="button"
          onClick={() => void refetch()}
          className="mt-4 inline-flex h-10 items-center rounded-full bg-[var(--gym-ink,#111111)] px-4 text-[13px] font-bold text-white"
        >
          {t("admin.common.retry")}
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4 sm:gap-5">
      <div className="grid grid-cols-2 gap-2 sm:gap-3 lg:grid-cols-4 lg:gap-4">
        <StatCard
          label={t("admin.reports.stats.expiring")}
          value={isLoading ? "…" : derived.pulse.expiring}
          icon={<CreditCard className="size-4" strokeWidth={1.8} />}
        />
        <StatCard
          label={t("admin.reports.stats.attention")}
          value={isLoading ? "…" : derived.pulse.attention}
          icon={<AlertTriangle className="size-4" strokeWidth={1.8} />}
        />
        <StatCard
          label={t("admin.reports.stats.pending")}
          value={isLoading ? "…" : derived.pulse.pendingRequests}
          icon={<Inbox className="size-4" strokeWidth={1.8} />}
        />
        <StatCard
          label={t("admin.reports.stats.unread")}
          value={isLoading ? "…" : unreadCount}
          icon={<Bell className="size-4" strokeWidth={1.8} />}
        />
      </div>

      <section className="rounded-[24px] bg-white p-4 sm:p-6 lg:p-8">
        <div className="-mx-1 flex gap-0 overflow-x-auto border-b border-black/[0.06] px-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {REPORT_TABS.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setTab(item)}
              className={cn(
                "h-11 shrink-0 border-b-2 px-3.5 text-[13px] font-semibold whitespace-nowrap transition-colors sm:px-4",
                tab === item
                  ? "border-[var(--gym-ink,#111111)] text-[var(--gym-ink,#111111)]"
                  : "border-transparent text-[#8c8c8c] hover:text-[var(--gym-ink,#111111)]",
              )}
            >
              {t(`admin.reports.tabs.${item}`)}
              {item === "inbox" && unreadCount > 0 ? (
                <span className="ms-2 inline-flex min-w-5 items-center justify-center rounded-full bg-[var(--gym-lime,#fb5001)] px-1.5 py-0.5 text-[10px] font-bold text-white">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              ) : null}
            </button>
          ))}
        </div>

        <div className="pt-5 sm:pt-6">
          {tab === "inbox" ? (
            <InboxPane
              notices={inbox}
              open={openNotice}
              filter={inboxFilter}
              onFilter={pickInboxFilter}
              onOpen={openInboxNotice}
              onSend={sendNotice}
              canSend={canSend}
              canExport={canExport}
              onExport={() => runExport("notices")}
              locale={locale}
              subscribers={desk?.subscribers ?? []}
              requests={desk?.registrationRequests ?? []}
              sending={dispatchMutation.isPending}
            />
          ) : null}
          {tab === "activity" ? (
            <ActivityPane
              rows={derived.activity}
              thisWeek={derived.pulse.checkInsThisWeek}
              lastWeek={derived.pulse.checkInsLastWeek}
              canExport={canExport}
              onExport={() => runExport("roster")}
              locale={locale}
            />
          ) : null}
          {tab === "billing" ? (
            <BillingPane
              packages={derived.packages}
              expiring={derived.expiring}
              subscriberById={subscriberById}
              packageById={packageById}
              canExport={canExport}
              onExport={() => runExport("expiring")}
              locale={locale}
            />
          ) : null}
          {tab === "adherence" ? (
            <AdherencePane
              rows={derived.adherence}
              totals={derived.totals}
              canExport={canExport}
              onExport={() => runExport("adherence")}
            />
          ) : null}
          {tab === "progress" ? (
            <ProgressPane
              rows={derived.progress}
              canExport={canExport}
              onExport={() => runExport("progress")}
              locale={locale}
            />
          ) : null}
          {tab === "content" ? (
            <ContentPane
              rows={derived.content}
              stats={derived.contentStats}
              locale={locale}
            />
          ) : null}
          {tab === "export" ? (
            <ExportPane canExport={canExport} onExport={runExport} />
          ) : null}
        </div>
      </section>
    </div>
  )
}

function InboxPane({
  notices,
  open,
  filter,
  onFilter,
  onOpen,
  onSend,
  canSend,
  canExport,
  onExport,
  locale,
  subscribers,
  requests,
  sending,
}: {
  notices: OpsNotice[]
  open?: OpsNotice
  filter: "all" | NoticeStatus
  onFilter: (value: "all" | NoticeStatus) => void
  onOpen: (id: string) => void
  onSend: (id: string) => void
  canSend: boolean
  canExport: boolean
  onExport: () => void
  locale: AppLocale
  subscribers: Subscriber[]
  requests: import("@/features/subscribers/types").RegistrationRequest[]
  sending: boolean
}) {
  const { t } = useTranslation()
  const filters: Array<"all" | NoticeStatus> = [
    "all",
    "queued",
    "sent",
    "failed",
  ]
  const person = open
    ? noticePerson(open, subscribers, requests)
    : undefined
  const href = open
    ? resolveNoticeActionUrl(open)
    : APP_ROUTES.admin.registrationRequests

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-1">
          {filters.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => onFilter(item)}
              className={cn(
                "h-8 rounded-full px-3 text-[12px] font-semibold",
                filter === item
                  ? "bg-[var(--gym-ink,#111111)] text-white"
                  : "text-[#8c8c8c] hover:text-[var(--gym-ink,#111111)]",
              )}
            >
              {item === "all"
                ? t("admin.common.all")
                : t(`admin.reports.noticeStatus.${item}`)}
            </button>
          ))}
        </div>
        <CsvButton show={canExport} onClick={onExport} />
      </div>

      {notices.length === 0 || !open ? (
        <EmptyNote>{t("admin.reports.empty.inbox")}</EmptyNote>
      ) : (
        <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(280px,380px)] lg:gap-5">
          <ul className="min-w-0 rounded-[22px] border border-black/[0.08] p-1.5">
            {notices.map((notice, index) => {
              const who = noticePerson(notice, subscribers, requests)
              const active = notice.id === open.id
              const unread = isUnreadNotice(notice)
              return (
                <li
                  key={notice.id}
                  className={cn(
                    !active &&
                      index < notices.length - 1 &&
                      "border-b border-black/[0.05]",
                  )}
                >
                  <button
                    type="button"
                    onClick={() => onOpen(notice.id)}
                    className={cn(
                      "flex w-full items-start gap-3 rounded-[16px] px-3 py-3 text-start transition-colors",
                      active
                        ? "border border-[var(--gym-ink,#111111)] bg-[var(--gym-ink,#111111)]/[0.04]"
                        : unread
                          ? "border border-transparent bg-[var(--gym-lime,#fb5001)]/[0.06] hover:bg-[var(--gym-lime,#fb5001)]/[0.1]"
                          : "border border-transparent hover:bg-black/[0.02]",
                    )}
                  >
                    <span className="mt-1.5 flex size-2.5 shrink-0 items-center justify-center">
                      {unread ? (
                        <span
                          className="size-2.5 rounded-full bg-[var(--gym-lime,#fb5001)]"
                          aria-label={t("admin.reports.unreadBadge")}
                        />
                      ) : (
                        <span
                          className={cn(
                            "size-2 rounded-full opacity-70",
                            statusDot(notice.status),
                          )}
                          title={t(`admin.reports.noticeStatus.${notice.status}`)}
                        />
                      )}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-baseline justify-between gap-3">
                        <span
                          className={cn(
                            "truncate text-[14px] text-[var(--gym-ink,#111111)]",
                            unread ? "font-extrabold" : "font-semibold",
                          )}
                        >
                          {who?.displayName ??
                            t(`admin.reports.noticeKind.${notice.kind}`)}
                        </span>
                        <span className="inline-flex shrink-0 items-center gap-1.5">
                          {unread ? (
                            <span className="rounded-full bg-[var(--gym-lime,#fb5001)] px-1.5 py-0.5 text-[10px] font-bold tracking-wide text-white">
                              {t("admin.reports.unreadBadge")}
                            </span>
                          ) : null}
                          <span className="text-[11px] font-medium text-[#8c8c8c]">
                            {formatDate(
                              notice.sentAt ??
                                notice.scheduledAt ??
                                notice.createdAt,
                              locale,
                            )}
                          </span>
                        </span>
                      </span>
                      <span
                        className={cn(
                          "mt-0.5 block truncate text-[13px]",
                          unread
                            ? "font-medium text-[var(--gym-ink,#111111)]/80"
                            : "text-[#5F6B6B]",
                        )}
                      >
                        {(notice.staffSubject ?? notice.subject)[locale]}
                      </span>
                    </span>
                  </button>
                  {active ? (
                    <div className="m-1.5 rounded-[18px] bg-[#F4F4F4] p-4 lg:hidden">
                      <NoticeDetail
                        notice={open}
                        person={person}
                        href={href}
                        canSend={canSend}
                        onSend={onSend}
                        locale={locale}
                        sending={sending}
                      />
                    </div>
                  ) : null}
                </li>
              )
            })}
          </ul>

          <aside
            data-report-pane="notice"
            className="hidden h-fit rounded-[22px] border border-[var(--gym-ink,#111111)]/15 bg-[#F4F4F4] p-5 sm:p-6 lg:sticky lg:top-4 lg:block"
          >
            <NoticeDetail
              notice={open}
              person={person}
              href={href}
              canSend={canSend}
              onSend={onSend}
              locale={locale}
              sending={sending}
            />
          </aside>
        </div>
      )}
    </div>
  )
}

function ActivityPane({
  rows,
  thisWeek,
  lastWeek,
  canExport,
  onExport,
  locale,
}: {
  rows: ReturnType<typeof deriveReportsDesk>["activity"]
  thisWeek: number
  lastWeek: number
  canExport: boolean
  onExport: () => void
  locale: AppLocale
}) {
  const { t } = useTranslation()
  const quiet = rows.filter((item) => !item.loggedThisWeek).length
  if (!rows.length) {
    return <EmptyNote>{t("admin.reports.empty.activity")}</EmptyNote>
  }
  return (
    <div>
      <PaneHead
        summary={t("admin.reports.activity.compare", { quiet })}
        aside={`${t("admin.reports.thisWeek")} ${thisWeek} · ${t("admin.reports.lastWeek")} ${lastWeek}`}
        canExport={canExport}
        onExport={onExport}
      />
      <ul>
        {rows.map((row) => (
          <RowLink
            key={row.subscriber.id}
            to={APP_ROUTES.admin.subscriberDetail(row.subscriber.id)}
            name={row.subscriber.displayName}
          >
            <span
              className={
                row.loggedThisWeek
                  ? "text-[var(--gym-ink,#111111)]"
                  : "text-[#8c8c8c]"
              }
            >
              {row.loggedThisWeek
                ? t("admin.reports.activity.logged")
                : t("admin.reports.activity.quiet")}
            </span>
            <span className="hidden sm:inline">
              {formatDate(row.lastCheckIn, locale)}
            </span>
            <span>
              {row.thisWeekWorkout} · {row.thisWeekNutrition}
            </span>
          </RowLink>
        ))}
      </ul>
    </div>
  )
}

function BillingPane({
  packages,
  expiring,
  subscriberById,
  packageById,
  canExport,
  onExport,
  locale,
}: {
  packages: ReturnType<typeof deriveReportsDesk>["packages"]
  expiring: ExpiringSubscriptionRow[]
  subscriberById: Map<string, Subscriber>
  packageById: Map<string, CatalogPackage>
  canExport: boolean
  onExport: () => void
  locale: AppLocale
}) {
  const { t } = useTranslation()
  return (
    <div>
      <PaneHead canExport={canExport} onExport={onExport} />
      {packages.length === 0 ? (
        <EmptyNote>{t("admin.reports.empty.packages")}</EmptyNote>
      ) : (
        <ul>
          {packages.map((row) => (
            <li key={row.pkg.id} className="border-b border-black/[0.05] py-4">
              <div className="flex items-baseline justify-between gap-3">
                <p className="font-heading text-[16px] font-extrabold text-[var(--gym-ink,#111111)]">
                  {row.pkg.name[locale]}
                </p>
                <p className="text-[13px] font-medium text-[#8c8c8c]">
                  {row.share}%
                </p>
              </div>
              <p className="mt-1 text-[13px] text-[#5F6B6B]">
                {row.active} {t("admin.reports.billing.active").toLowerCase()} ·{" "}
                {row.pending}{" "}
                {t("admin.reports.billing.pending").toLowerCase()} ·{" "}
                {row.expiring}{" "}
                {t("admin.reports.billing.expiring").toLowerCase()}
              </p>
              <div className="mt-3 h-1 overflow-hidden rounded-full bg-black/[0.06]">
                <div
                  className="h-full rounded-full bg-[var(--gym-ink,#111111)]"
                  style={{ width: `${row.share}%` }}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
      <p className="mt-6 text-[12px] font-semibold tracking-[0.06em] text-[#8c8c8c] uppercase">
        {t("admin.reports.billing.expiringList")}
      </p>
      {expiring.length === 0 ? (
        <EmptyNote>{t("admin.reports.empty.expiring")}</EmptyNote>
      ) : (
        <ul className="mt-1">
          {expiring.map((item) => {
            const subscriber = subscriberById.get(item.subscriberId)
            const pkg = packageById.get(item.packageId)
            const days = daysFromToday(item.endsAt)
            return (
              <RowLink
                key={item.id}
                to={APP_ROUTES.admin.subscriberDetail(item.subscriberId)}
                name={subscriber?.displayName ?? item.subscriberId}
              >
                <span>{pkg?.name[locale]}</span>
                <span>{formatDate(item.endsAt, locale)}</span>
                <span
                  className={
                    days != null && days <= 7
                      ? "text-[#C44536]"
                      : "text-[var(--gym-ink,#111111)]"
                  }
                >
                  {days != null
                    ? t("admin.reports.daysLeft", { count: days })
                    : "—"}
                </span>
              </RowLink>
            )
          })}
        </ul>
      )}
    </div>
  )
}

function AdherencePane({
  rows,
  totals,
  canExport,
  onExport,
}: {
  rows: ReturnType<typeof deriveReportsDesk>["adherence"]
  totals: ReturnType<typeof deriveReportsDesk>["totals"]
  canExport: boolean
  onExport: () => void
}) {
  const { t } = useTranslation()
  if (!rows.length) {
    return <EmptyNote>{t("admin.reports.empty.adherence")}</EmptyNote>
  }
  return (
    <div>
      <PaneHead
        aside={`${t("admin.reports.adherence.workout")} ${pct(totals.workout)} · ${t("admin.reports.adherence.nutrition")} ${pct(totals.nutrition)}`}
        canExport={canExport}
        onExport={onExport}
      />
      <ul>
        {rows.map((row) => {
          const workoutDelta = vsPrev(row.workoutThis, row.workoutPrev)
          const nutritionDelta = vsPrev(row.nutritionThis, row.nutritionPrev)
          return (
            <RowLink
              key={row.subscriber.id}
              to={`${APP_ROUTES.admin.progress}?subscriber=${row.subscriber.id}`}
              name={row.subscriber.displayName}
            >
              <DeltaLine
                label={t("admin.reports.adherence.workout")}
                value={pct(row.workoutThis)}
                delta={workoutDelta}
              />
              <DeltaLine
                label={t("admin.reports.adherence.nutrition")}
                value={pct(row.nutritionThis)}
                delta={nutritionDelta}
              />
            </RowLink>
          )
        })}
      </ul>
    </div>
  )
}

function ProgressPane({
  rows,
  canExport,
  onExport,
  locale,
}: {
  rows: ReturnType<typeof deriveReportsDesk>["progress"]
  canExport: boolean
  onExport: () => void
  locale: AppLocale
}) {
  const { t } = useTranslation()
  if (!rows.length) {
    return <EmptyNote>{t("admin.reports.empty.progress")}</EmptyNote>
  }
  return (
    <div>
      <PaneHead
        summary={t("admin.reports.progress.privacy")}
        canExport={canExport}
        onExport={onExport}
      />
      <ul>
        {rows.map((row) => (
          <RowLink
            key={row.subscriber.id}
            to={`${APP_ROUTES.admin.progress}?subscriber=${row.subscriber.id}`}
            name={row.subscriber.displayName}
          >
            <span>
              {row.weightKg != null ? formatKg(row.weightKg, locale) : "—"}
              {row.deltaKg != null ? ` · ${signed(row.deltaKg)} kg` : ""}
            </span>
            <span className="hidden sm:inline">
              {formatDate(row.lastCheckIn, locale)}
            </span>
            <span className="capitalize">
              {t(`admin.progress.filter.${row.bucket}`)}
            </span>
          </RowLink>
        ))}
      </ul>
    </div>
  )
}

function ContentPane({
  rows,
  stats,
  locale,
}: {
  rows: ReturnType<typeof deriveReportsDesk>["content"]
  stats: ReturnType<typeof deriveReportsDesk>["contentStats"]
  locale: AppLocale
}) {
  const { t } = useTranslation()
  if (!rows.length) {
    return <EmptyNote>{t("admin.reports.empty.content")}</EmptyNote>
  }
  return (
    <div>
      <PaneHead
        aside={`${stats.linked} ${t("admin.reports.content.linked").toLowerCase()} · ${stats.unlinked} ${t("admin.reports.content.unlinked").toLowerCase()}`}
      />
      <ul>
        {rows.map((row) => (
          <li
            key={row.id}
            className="flex items-center justify-between gap-3 border-b border-black/[0.05] py-3.5"
          >
            <div className="min-w-0">
              <p className="truncate text-[14px] font-semibold text-[var(--gym-ink,#111111)]">
                {row.title[locale]}
              </p>
              <p className="mt-0.5 text-[12px] text-[#8c8c8c]">
                {row.activePrograms}{" "}
                {t("admin.reports.content.programs").toLowerCase()} ·{" "}
                {row.subscribers}{" "}
                {t("admin.reports.content.people").toLowerCase()}
              </p>
            </div>
            <p className="shrink-0 text-[12px] font-medium text-[#8c8c8c]">
              {row.linked
                ? t("admin.content.linked")
                : t("admin.content.unlinked")}
            </p>
          </li>
        ))}
      </ul>
    </div>
  )
}

function ExportPane({
  canExport,
  onExport,
}: {
  canExport: boolean
  onExport: (kind: ExportKind) => void
}) {
  const { t } = useTranslation()
  const packs: ExportKind[] = [
    "expiring",
    "adherence",
    "progress",
    "packages",
    "notices",
    "roster",
  ]
  if (!canExport) return <EmptyNote>{t("admin.reports.toast.noExport")}</EmptyNote>
  return (
    <ul>
      {packs.map((kind) => (
        <li
          key={kind}
          className="flex items-center justify-between gap-3 border-b border-black/[0.05] py-3.5"
        >
          <div className="min-w-0">
            <p className="text-[14px] font-semibold text-[var(--gym-ink,#111111)]">
              {t(`admin.reports.export.${kind}`)}
            </p>
            <p className="mt-0.5 text-[12px] leading-relaxed text-[#8c8c8c]">
              {t(`admin.reports.export.${kind}Hint`)}
            </p>
          </div>
          <button
            type="button"
            onClick={() => onExport(kind)}
            className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full text-[13px] font-semibold text-[var(--gym-ink,#111111)]"
          >
            <Download className="size-3.5" strokeWidth={1.8} />
            CSV
          </button>
        </li>
      ))}
    </ul>
  )
}

function NoticeDetail({
  notice,
  person,
  href,
  canSend,
  onSend,
  locale,
  sending,
}: {
  notice: OpsNotice
  person?: { displayName: string }
  href: string
  canSend: boolean
  onSend: (id: string) => void
  locale: AppLocale
  sending: boolean
}) {
  const { t } = useTranslation()
  return (
    <article>
      <p className="flex flex-wrap items-center gap-2 text-[11px] font-semibold tracking-[0.08em] text-[#8c8c8c] uppercase">
        <span>
          {t(`admin.reports.noticeKind.${notice.kind}`)} ·{" "}
          {t(`admin.reports.noticeStatus.${notice.status}`)}
        </span>
        {isUnreadNotice(notice) ? (
          <span className="rounded-full bg-[var(--gym-lime,#fb5001)] px-1.5 py-0.5 text-[10px] font-bold tracking-wide text-white normal-case">
            {t("admin.reports.unreadBadge")}
          </span>
        ) : null}
      </p>
      <h2 className="mt-2 font-heading text-[18px] font-extrabold tracking-tight text-[var(--gym-ink,#111111)] xl:text-[20px]">
        {(notice.staffSubject ?? notice.subject)[locale]}
      </h2>
      <p className="mt-3 text-[14px] leading-[1.7] text-[#5F6B6B]">
        {(notice.staffDetail ?? notice.detail)[locale]}
      </p>
      {notice.lastError ? (
        <p className="mt-2 text-[12px] font-medium text-[#C44536]">
          {notice.lastError}
        </p>
      ) : null}
      <p className="mt-4 text-[12px] font-medium text-[#8c8c8c]">
        {t("admin.reports.channel.email")}
        {notice.fcmSent ? ` · ${t("admin.reports.channel.push")}` : ""}
        {person ? ` · ${person.displayName}` : ""}
        {` · ${formatDate(notice.sentAt ?? notice.scheduledAt ?? notice.createdAt, locale)}`}
      </p>
      <div className="mt-5 flex flex-wrap items-center gap-2">
        {canSend && notice.status !== "sent" ? (
          <button
            type="button"
            disabled={sending}
            onClick={() => onSend(notice.id)}
            className="inline-flex h-10 items-center gap-2 rounded-full bg-[var(--gym-ink,#111111)] px-4 text-[13px] font-bold text-white disabled:opacity-60"
          >
            <Send className="size-3.5" strokeWidth={2} />
            {notice.status === "failed"
              ? t("admin.reports.retry")
              : t("admin.reports.send")}
          </button>
        ) : null}
        <Link
          to={href}
          className={
            noticeActionIsReview(notice)
              ? "inline-flex h-10 items-center rounded-full bg-[var(--gym-ink,#111111)] px-4 text-[13px] font-bold text-white"
              : "inline-flex h-10 items-center px-2 text-[13px] font-semibold text-[var(--gym-ink,#111111)]"
          }
        >
          {noticeActionIsReview(notice)
            ? t("admin.reports.reviewRequest")
            : t("admin.common.view")}
        </Link>
      </div>
    </article>
  )
}

function PaneHead({
  summary,
  aside,
  canExport,
  onExport,
}: {
  summary?: string
  aside?: string
  canExport?: boolean
  onExport?: () => void
}) {
  if (!summary && !aside && !canExport) return null
  return (
    <div className="mb-1 flex flex-wrap items-center justify-between gap-2 pb-3">
      {summary || aside ? (
        <p className="text-[13px] leading-relaxed text-[#8c8c8c]">
          {summary ?? aside}
        </p>
      ) : (
        <span />
      )}
      <div className="flex items-center gap-3">
        {summary && aside ? (
          <p className="text-[13px] font-medium text-[var(--gym-ink,#111111)]">
            {aside}
          </p>
        ) : null}
        <CsvButton show={Boolean(canExport && onExport)} onClick={onExport} />
      </div>
    </div>
  )
}

function CsvButton({
  show,
  onClick,
}: {
  show?: boolean
  onClick?: () => void
}) {
  const { t } = useTranslation()
  if (!show || !onClick) return null
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex h-8 items-center gap-1.5 text-[12px] font-semibold text-[#8c8c8c] hover:text-[var(--gym-ink,#111111)]"
    >
      <Download className="size-3.5" strokeWidth={1.8} />
      {t("admin.reports.export.download")}
    </button>
  )
}

function RowLink({
  to,
  name,
  children,
}: {
  to: string
  name: string
  children: ReactNode
}) {
  return (
    <li>
      <Link
        to={to}
        className="flex items-center gap-3 border-b border-black/[0.05] py-3.5 text-[13px] transition-colors hover:bg-black/[0.015]"
      >
        <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-full bg-[#F4F4F4] font-heading text-[11px] font-bold text-[var(--gym-ink,#111111)]">
          {initials(name)}
        </span>
        <span className="min-w-0 flex-1 truncate font-semibold text-[var(--gym-ink,#111111)]">
          {name}
        </span>
        <span className="flex min-w-0 flex-col items-end gap-0.5 text-[12px] text-[#5F6B6B] sm:flex-row sm:items-center sm:gap-5 sm:text-[13px]">
          {children}
        </span>
        <ChevronRight
          className="size-4 shrink-0 text-[#C5C5C5] rtl:rotate-180"
          strokeWidth={1.8}
        />
      </Link>
    </li>
  )
}

function DeltaLine({
  label,
  value,
  delta,
}: {
  label: string
  value: string
  delta: string | null
}) {
  return (
    <span className="inline-flex items-baseline gap-1.5">
      <span className="text-[#8c8c8c]">{label}</span>
      <span className="font-medium text-[var(--gym-ink,#111111)]">{value}</span>
      {delta ? (
        <span
          className={
            delta.startsWith("−") ? "text-[#C44536]" : "text-[#8c8c8c]"
          }
        >
          {delta}
        </span>
      ) : null}
    </span>
  )
}

function EmptyNote({ children }: { children: ReactNode }) {
  return (
    <div
      role="status"
      className="py-16 text-center text-[13px] font-medium text-[#8c8c8c]"
    >
      {children}
    </div>
  )
}
