import { useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import { useTranslation } from "react-i18next"
import {
  CalendarClock,
  CalendarOff,
  ChevronDown,
  Clock,
  CreditCard,
  Plus,
  Search,
} from "lucide-react"
import { ConfirmActionDialog } from "@/components/dashboard/ConfirmActionDialog"
import { DataTable, TableAction } from "@/components/dashboard/DataTable"
import { FilterChip, StatCard } from "@/components/dashboard/StatCard"
import {
  StatusBadge,
  subscriptionStatusTone,
} from "@/components/dashboard/StatusBadge"
import {
  SubscriptionActionDialog,
  type SubscriptionDialogState,
} from "@/components/dashboard/SubscriptionActionDialog"
import { APP_ROUTES } from "@/config/constants"
import { useAuth } from "@/features/auth/auth-context"
import { subscriberDisplayName } from "@/features/subscribers/types"
import { useSubscribersQuery } from "@/features/subscribers/hooks"
import {
  ENTITLEMENT_KEYS,
  normalizeEntitlements,
} from "@/features/subscriptions/entitlements"
import {
  useAssignSubscriptionMutation,
  usePackagesQuery,
  useSubscriptionsQuery,
  useUpdateSubscriptionLifecycleMutation,
} from "@/features/subscriptions/hooks"
import type { UpdateSubscriptionLifecycleInput } from "@/features/subscriptions/service"
import { useDocumentTitle } from "@/hooks/useDocumentTitle"
import { useLocale } from "@/hooks/useLocale"
import { daysUntil, formatDate, initials } from "@/lib/format"
import { appToast } from "@/lib/toast"
import { cn } from "@/lib/utils"
import type {
  SubscriberSubscription,
  SubscriptionStatus,
} from "@/types/subscription"

type FilterMode = "all" | "expiring" | SubscriptionStatus

const STATUS_FILTERS: FilterMode[] = [
  "all",
  "active",
  "expiring",
  "pending",
  "expired",
  "suspended",
  "cancelled",
]

export function SubscriptionsPage() {
  const { t } = useTranslation()
  const { locale } = useLocale()
  const { user } = useAuth()
  const navigate = useNavigate()
  useDocumentTitle(t("nav.subscriptions"))

  const {
    data: allSubscriptions = [],
    isLoading: subscriptionsLoading,
    isError: subscriptionsError,
    refetch: refetchSubscriptions,
  } = useSubscriptionsQuery()
  const { data: allPackages = [], isLoading: packagesLoading } =
    usePackagesQuery()
  const { data: allSubscribers = [], isLoading: subscribersLoading } =
    useSubscribersQuery()
  const assignMutation = useAssignSubscriptionMutation()
  const lifecycleMutation = useUpdateSubscriptionLifecycleMutation()

  const [query, setQuery] = useState("")
  const [status, setStatus] = useState<FilterMode>("all")
  const [scope, setScope] = useState<"all" | "current">("all")
  const [dialogState, setDialogState] =
    useState<SubscriptionDialogState | null>(null)
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean
    title: string
    description: string
    confirmLabel: string
    tone: "danger" | "primary" | "warning"
    onConfirm: () => Promise<void>
  } | null>(null)

  const actionsBusy =
    assignMutation.isPending || lifecycleMutation.isPending

  const packageMap = useMemo(
    () => new Map(allPackages.map((p) => [p.id, p])),
    [allPackages],
  )

  const subscriberMap = useMemo(
    () => new Map(allSubscribers.map((s) => [s.id, s])),
    [allSubscribers],
  )

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase()
    const sorted = [...allSubscriptions].sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    )

    // "Current" = newest record per subscriber (history preserved underneath)
    const seenSubscribers = new Set<string>()
    const scoped =
      scope === "current"
        ? sorted.filter((row) => {
            if (seenSubscribers.has(row.subscriberId)) return false
            seenSubscribers.add(row.subscriberId)
            return true
          })
        : sorted

    return scoped.filter((row) => {
      if (status === "expiring") {
        if (row.status !== "active") return false
        const d = daysUntil(row.endsAt)
        if (d === null || d < 0 || d > 21) return false
      } else if (status !== "all" && row.status !== status) {
        return false
      }

      if (!q) return true
      const subscriber = subscriberMap.get(row.subscriberId)
      const pkg = packageMap.get(row.packageId)
      const subName = (
        subscriber?.displayName ??
        row.subscriberName ??
        ""
      ).toLowerCase()
      const subEmail = (
        subscriber?.email ??
        row.subscriberEmail ??
        ""
      ).toLowerCase()
      const pkgEn = (pkg?.name.en ?? row.packageName?.en ?? "").toLowerCase()
      const pkgAr = pkg?.name.ar ?? row.packageName?.ar ?? ""
      return (
        subName.includes(q) ||
        subEmail.includes(q) ||
        pkgEn.includes(q) ||
        pkgAr.includes(q)
      )
    })
  }, [
    allSubscriptions,
    subscriberMap,
    packageMap,
    query,
    status,
    scope,
  ])

  const stats = useMemo(() => {
    const active = allSubscriptions.filter((item) => item.status === "active")
      .length
    const pending = allSubscriptions.filter((item) => item.status === "pending")
      .length
    const expired = allSubscriptions.filter((item) => item.status === "expired")
      .length
    const expiring = allSubscriptions.filter((item) => {
      if (item.status !== "active") return false
      const days = daysUntil(item.endsAt)
      return days !== null && days >= 0 && days <= 21
    }).length
    return { active, pending, expired, expiring }
  }, [allSubscriptions])

  function openManage(
    row: SubscriberSubscription,
    initialAction: "activate" | "renew" | "suspend" | "terminate" | "edit",
  ) {
    if (actionsBusy) return
    setDialogState({
      mode: "manage",
      subscription: row,
      initialAction,
    })
  }

  function confirmDestructiveLifecycle(
    row: SubscriberSubscription,
    action: "suspend" | "terminate",
  ) {
    if (actionsBusy) return
    const subscriber = subscriberMap.get(row.subscriberId)
    const name = subscriber
      ? subscriberDisplayName(subscriber, locale)
      : row.subscriberName || row.subscriberId
    const isTerminate = action === "terminate"

    setConfirmDialog({
      open: true,
      title: isTerminate
        ? locale === "ar"
          ? "إنهاء الاشتراك"
          : "Terminate subscription"
        : locale === "ar"
          ? "إيقاف الاشتراك مؤقتاً"
          : "Suspend subscription",
      description: isTerminate
        ? locale === "ar"
          ? `إنهاء اشتراك "${name}" الآن؟ سيتم إلغاء الوصول فوراً ويبقى السجل في التاريخ.`
          : `Terminate "${name}" subscription now? Access stops immediately; history is kept.`
        : locale === "ar"
          ? `إيقاف اشتراك "${name}" مؤقتاً؟ يمكن إعادة تفعيله لاحقاً.`
          : `Suspend "${name}" subscription? You can reactivate it later.`,
      confirmLabel: isTerminate
        ? locale === "ar"
          ? "تأكيد الإنهاء"
          : "Terminate"
        : locale === "ar"
          ? "تأكيد الإيقاف"
          : "Suspend",
      tone: isTerminate ? "danger" : "warning",
      onConfirm: async () => {
        await lifecycleMutation.mutateAsync({
          subscriptionId: row.id,
          action,
          activatedBy: user?.displayName || user?.email || "Head Coach",
        })
        appToast.success(
          isTerminate
            ? locale === "ar"
              ? "تم إنهاء الاشتراك"
              : "Subscription terminated"
            : locale === "ar"
              ? "تم إيقاف الاشتراك مؤقتاً"
              : "Subscription suspended",
        )
      },
    })
  }

  async function handleLifecycle(
    payload: UpdateSubscriptionLifecycleInput,
  ) {
    if (actionsBusy) return

    if (payload.action === "suspend" || payload.action === "terminate") {
      const row =
        dialogState?.mode === "manage" ? dialogState.subscription : null
      const subscriber = row
        ? subscriberMap.get(row.subscriberId)
        : undefined
      const name = subscriber
        ? subscriberDisplayName(subscriber, locale)
        : row?.subscriberName ||
          row?.subscriberId ||
          payload.subscriptionId
      const isTerminate = payload.action === "terminate"

      setConfirmDialog({
        open: true,
        title: isTerminate
          ? locale === "ar"
            ? "إنهاء الاشتراك"
            : "Terminate subscription"
          : locale === "ar"
            ? "إيقاف الاشتراك مؤقتاً"
            : "Suspend subscription",
        description: isTerminate
          ? locale === "ar"
            ? `إنهاء اشتراك "${name}"؟`
            : `Terminate "${name}" subscription?`
          : locale === "ar"
            ? `إيقاف اشتراك "${name}" مؤقتاً؟`
            : `Suspend "${name}" subscription?`,
        confirmLabel: isTerminate
          ? locale === "ar"
            ? "تأكيد الإنهاء"
            : "Terminate"
          : locale === "ar"
            ? "تأكيد الإيقاف"
            : "Suspend",
        tone: isTerminate ? "danger" : "warning",
        onConfirm: async () => {
          await lifecycleMutation.mutateAsync(payload)
          setDialogState(null)
          appToast.success(
            isTerminate
              ? locale === "ar"
                ? "تم إنهاء الاشتراك"
                : "Subscription terminated"
              : locale === "ar"
                ? "تم إيقاف الاشتراك مؤقتاً"
                : "Subscription suspended",
          )
        },
      })
      return
    }

    await lifecycleMutation.mutateAsync(payload)
    setDialogState(null)
    appToast.success(
      locale === "ar"
        ? "تم تحديث حالة الاشتراك بنجاح"
        : "Subscription updated successfully",
    )
  }

  const listLoading =
    subscriptionsLoading || packagesLoading || subscribersLoading

  return (
    <div className="flex flex-col gap-4 sm:gap-5">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
        <StatCard
          label={t("admin.subscriptions.stats.active")}
          value={stats.active}
          icon={<CreditCard className="size-4" strokeWidth={1.8} />}
        />
        <StatCard
          label={t("admin.subscriptions.stats.expiring")}
          value={stats.expiring}
          icon={<CalendarClock className="size-4" strokeWidth={1.8} />}
        />
        <StatCard
          label={t("admin.subscriptions.stats.pending")}
          value={stats.pending}
          icon={<Clock className="size-4" strokeWidth={1.8} />}
        />
        <StatCard
          label={t("admin.subscriptions.stats.expired")}
          value={stats.expired}
          icon={<CalendarOff className="size-4" strokeWidth={1.8} />}
        />
      </div>

      {subscriptionsError ? (
        <section className="flex min-h-48 flex-col items-center justify-center gap-3 rounded-[24px] bg-white px-4 py-10 text-center">
          <p className="text-sm font-medium text-[#8c8c8c]">
            {locale === "ar"
              ? "تعذر تحميل الاشتراكات. حاول مرة أخرى."
              : "Could not load subscriptions. Please try again."}
          </p>
          <button
            type="button"
            onClick={() => void refetchSubscriptions()}
            className="inline-flex h-10 items-center justify-center rounded-full bg-[var(--gym-ink,#111111)] px-5 text-[13px] font-bold text-white"
          >
            {locale === "ar" ? "إعادة المحاولة" : "Retry"}
          </button>
        </section>
      ) : (
        <DataTable
          rows={listLoading ? [] : rows}
          rowKey={(row) => row.id}
          pageSize={6}
          empty={
            listLoading
              ? locale === "ar"
                ? "جاري تحميل الاشتراكات…"
                : "Loading subscriptions…"
              : t("admin.subscriptions.empty")
          }
          actionsHeader={t("admin.common.actions")}
          renderExpandedRow={(row) => {
            const pkg = packageMap.get(row.packageId)
            const ent = normalizeEntitlements(
              pkg?.entitlements ?? row.entitlementsSnapshot,
            )
            const labels: Record<string, { ar: string; en: string }> = {
              workoutProgram: { ar: "برنامج التمارين", en: "Workout program" },
              nutritionProgram: {
                ar: "برنامج التغذية",
                en: "Nutrition program",
              },
              exerciseVideos: { ar: "مكتبة الفيديوهات", en: "Exercise videos" },
              pdfDocuments: { ar: "ملفات PDF", en: "PDF documents" },
              progressTracking: {
                ar: "تتبع التقدم",
                en: "Progress tracking",
              },
            }
            return (
              <div className="grid gap-4 sm:grid-cols-[1fr_240px]">
                <div className="space-y-2.5">
                  <p className="text-[12px] font-bold uppercase tracking-[0.08em] text-[#8c8c8c]">
                    {locale === "ar"
                      ? "صلاحيات الوصول للمحتوى"
                      : "Package content entitlements"}
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {ENTITLEMENT_KEYS.map((key) => {
                      const allowed = row.status === "active" && ent[key]
                      return (
                        <span
                          key={key}
                          className={cn(
                            "inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-bold",
                            allowed
                              ? "bg-emerald-50 text-emerald-700"
                              : "bg-black/5 text-[#8c8c8c] line-through",
                          )}
                        >
                          {labels[key][locale]}
                        </span>
                      )
                    })}
                  </div>
                  {row.notesLocalized?.[locale] || row.notes ? (
                    <p className="pt-1 text-[13px] font-medium text-[#6B7280]">
                      <strong className="text-[var(--gym-ink,#111111)]">
                        {locale === "ar" ? "ملاحظات: " : "Notes: "}
                      </strong>
                      {row.notesLocalized?.[locale] ?? row.notes}
                    </p>
                  ) : null}
                </div>
                <dl className="space-y-1.5 text-[12px]">
                  <div className="flex justify-between gap-2">
                    <dt className="text-[#8c8c8c]">
                      {t("admin.subscriptions.columns.activatedBy")}
                    </dt>
                    <dd className="font-bold text-[var(--gym-ink,#111111)]">
                      {row.activatedBy ?? "—"}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-2">
                    <dt className="text-[#8c8c8c]">
                      {locale === "ar" ? "تاريخ الإنشاء" : "Created"}
                    </dt>
                    <dd className="font-bold text-[var(--gym-ink,#111111)]">
                      {formatDate(row.createdAt, locale)}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-2">
                    <dt className="text-[#8c8c8c]">
                      {locale === "ar" ? "آخر تحديث" : "Updated"}
                    </dt>
                    <dd className="font-bold text-[var(--gym-ink,#111111)]">
                      {formatDate(row.updatedAt, locale)}
                    </dd>
                  </div>
                </dl>
              </div>
            )
          }}
          toolbar={
            <div className="flex flex-col gap-3.5">
              <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
                <label className="relative w-full sm:max-w-[340px]">
                  <Search className="pointer-events-none absolute start-3.5 top-1/2 size-4 -translate-y-1/2 text-[#8c8c8c]" />
                  <input
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder={t("admin.subscriptions.search")}
                    className={cn(
                      "h-11 w-full rounded-full bg-[#F4F4F4] pe-4 ps-10 text-[14px] font-medium text-[var(--gym-ink,#111111)] outline-none",
                      "placeholder:font-normal placeholder:text-[#8c8c8c]",
                    )}
                  />
                </label>

                <div className="flex shrink-0 items-center gap-2 sm:gap-2.5">
                  <div className="relative inline-flex items-center">
                    <select
                      value={scope}
                      onChange={(e) =>
                        setScope(e.target.value as "all" | "current")
                      }
                      className="h-11 w-auto min-w-[130px] max-w-[185px] cursor-pointer appearance-none truncate rounded-full bg-[#F4F4F4] pe-8 ps-4 text-[13px] font-bold text-[var(--gym-ink,#111111)] outline-none transition hover:bg-black/5"
                    >
                      <option value="all">
                        {locale === "ar" ? "كل السجل التاريخي" : "All history"}
                      </option>
                      <option value="current">
                        {locale === "ar"
                          ? "الاشتراك الحالي لكل مشترك"
                          : "Current per subscriber"}
                      </option>
                    </select>
                    <ChevronDown className="pointer-events-none absolute end-3 size-4 text-[#8c8c8c]" />
                  </div>

                  <button
                    type="button"
                    disabled={actionsBusy}
                    onClick={() => {
                      if (actionsBusy) return
                      setDialogState({ mode: "assign" })
                    }}
                    className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-full bg-[var(--gym-ink,#111111)] px-5 text-[13px] font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
                  >
                    <Plus className="size-4" strokeWidth={2} />
                    {t("admin.subscriptions.assign")}
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 pt-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {STATUS_FILTERS.map((item) => (
                  <FilterChip
                    key={item}
                    active={status === item}
                    onClick={() => setStatus(item)}
                  >
                    {item === "all"
                      ? t("admin.common.all")
                      : item === "expiring"
                        ? t("admin.subscriptions.stats.expiring")
                        : t(`admin.status.${item}`)}
                  </FilterChip>
                ))}
              </div>
            </div>
          }
          columns={[
            {
              id: "subscriber",
              header: t("admin.subscriptions.columns.subscriber"),
              cell: (row) => {
                const subscriber = subscriberMap.get(row.subscriberId)
                const displayName = subscriber
                  ? subscriberDisplayName(subscriber, locale)
                  : row.subscriberName || row.subscriberId
                const email = subscriber?.email ?? row.subscriberEmail ?? ""
                return (
                  <div className="flex items-center gap-3">
                    <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-full bg-[var(--gym-ink,#111111)] font-heading text-[12px] font-bold text-[var(--gym-lime,#fb5001)]">
                      {initials(displayName)}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate font-semibold">{displayName}</p>
                      <p className="truncate text-[12px] font-medium text-[#8c8c8c]">
                        {email}
                      </p>
                    </div>
                  </div>
                )
              },
            },
            {
              id: "package",
              header: t("admin.subscribers.columns.package"),
              cell: (row) => {
                const pkg = packageMap.get(row.packageId)
                const name =
                  pkg?.name[locale] ?? row.packageName?.[locale] ?? "—"
                const ent = normalizeEntitlements(
                  pkg?.entitlements ?? row.entitlementsSnapshot,
                )
                const enabledCount = ENTITLEMENT_KEYS.filter((k) => ent[k])
                  .length
                return (
                  <div>
                    <p className="font-semibold text-[#111111]">{name}</p>
                    <p className="text-[11px] font-medium text-[#8c8c8c]">
                      {locale === "ar"
                        ? `${enabledCount}/5 صلاحيات محتوى`
                        : `${enabledCount}/5 content permissions`}
                    </p>
                  </div>
                )
              },
            },
            {
              id: "status",
              header: t("admin.subscribers.columns.subscription"),
              cell: (row) => {
                const remaining = daysUntil(row.endsAt)
                return (
                  <div className="flex flex-wrap items-center gap-1.5">
                    <StatusBadge
                      label={t(`admin.status.${row.status}`)}
                      tone={subscriptionStatusTone(row.status)}
                    />
                    {row.status === "active" &&
                    remaining !== null &&
                    remaining >= 0 &&
                    remaining <= 21 ? (
                      <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-bold text-amber-700">
                        {t("admin.subscribers.daysLeft", { count: remaining })}
                      </span>
                    ) : null}
                  </div>
                )
              },
            },
            {
              id: "start",
              header: t("admin.subscriptions.columns.starts"),
              cell: (row) => formatDate(row.startsAt, locale),
              className: "text-[#6B7280]",
            },
            {
              id: "end",
              header: t("admin.subscriptions.columns.ends"),
              cell: (row) => formatDate(row.endsAt, locale),
              className: "text-[#6B7280]",
            },
          ]}
          actions={(row) => (
            <>
              <TableAction
                label={t("admin.common.view")}
                disabled={actionsBusy}
                onClick={() =>
                  navigate(APP_ROUTES.admin.subscriberDetail(row.subscriberId))
                }
              />
              {row.status === "active" ? (
                <>
                  <TableAction
                    label={t("admin.subscriptions.renew")}
                    tone="primary"
                    disabled={actionsBusy}
                    onClick={() => openManage(row, "renew")}
                  />
                  <TableAction
                    label={locale === "ar" ? "إيقاف" : "Suspend"}
                    tone="danger"
                    disabled={actionsBusy}
                    onClick={() => confirmDestructiveLifecycle(row, "suspend")}
                  />
                  <TableAction
                    label={locale === "ar" ? "إدارة" : "Manage"}
                    disabled={actionsBusy}
                    onClick={() => openManage(row, "edit")}
                  />
                </>
              ) : (
                <>
                  <TableAction
                    label={t("admin.subscriptions.activate")}
                    tone="primary"
                    disabled={actionsBusy}
                    onClick={() => openManage(row, "activate")}
                  />
                  <TableAction
                    label={locale === "ar" ? "إنهاء" : "Terminate"}
                    tone="danger"
                    disabled={
                      actionsBusy ||
                      row.status === "cancelled" ||
                      row.status === "expired"
                    }
                    onClick={() =>
                      confirmDestructiveLifecycle(row, "terminate")
                    }
                  />
                  <TableAction
                    label={locale === "ar" ? "تعديل" : "Edit"}
                    disabled={actionsBusy}
                    onClick={() => openManage(row, "edit")}
                  />
                </>
              )}
            </>
          )}
        />
      )}

      <SubscriptionActionDialog
        state={dialogState}
        packages={allPackages}
        busy={actionsBusy}
        adminName={user?.displayName || user?.email || "Head Coach"}
        onClose={() => {
          if (actionsBusy) return
          setDialogState(null)
        }}
        onAssign={async (payload) => {
          await assignMutation.mutateAsync(payload)
          setDialogState(null)
          appToast.success(
            locale === "ar"
              ? "تم تعيين الاشتراك للمشترك بنجاح"
              : "Subscription assigned successfully",
          )
        }}
        onLifecycle={handleLifecycle}
      />

      <ConfirmActionDialog
        open={Boolean(confirmDialog?.open)}
        title={confirmDialog?.title ?? ""}
        description={confirmDialog?.description}
        confirmLabel={confirmDialog?.confirmLabel}
        tone={confirmDialog?.tone ?? "warning"}
        onCancel={() => setConfirmDialog(null)}
        onConfirm={async () => {
          if (!confirmDialog) return
          await confirmDialog.onConfirm()
        }}
      />
    </div>
  )
}
