import { useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { ChevronDown, Clock, Search, UserCheck, UserPlus, Users, UserX } from "lucide-react"
import { DataTable, TableAction } from "@/components/dashboard/DataTable"
import { FilterChip, StatCard } from "@/components/dashboard/StatCard"
import {
  StatusBadge,
  accountStatusTone,
  subscriptionStatusTone,
} from "@/components/dashboard/StatusBadge"
import { SubscriberFormDialog } from "@/components/dashboard/SubscriberFormDialog"
import {
  SubscriptionActionDialog,
  type SubscriptionDialogState,
} from "@/components/dashboard/SubscriptionActionDialog"
import { APP_ROUTES } from "@/config/constants"
import { useAuth } from "@/features/auth/auth-context"
import {
  subscriberDisplayName,
  subscriberRow,
  type DemoSubscriber,
} from "@/features/subscribers/demo"
import {
  useSaveSubscriberMutation,
  useSubscribersQuery,
  useUpdateSubscriberStatusMutation,
} from "@/features/subscribers/hooks"
import {
  useAssignSubscriptionMutation,
  usePackagesQuery,
  useSubscriptionsQuery,
  useUpdateSubscriptionLifecycleMutation,
} from "@/features/subscriptions/hooks"
import { useDocumentTitle } from "@/hooks/useDocumentTitle"
import { useLocale } from "@/hooks/useLocale"
import { formatDate, initials } from "@/lib/format"
import { appToast } from "@/lib/toast"
import { cn } from "@/lib/utils"
import type { UserStatus } from "@/types/user"

const STATUS_FILTERS: Array<"all" | UserStatus> = [
  "all",
  "active",
  "pending",
  "suspended",
  "rejected",
]

export function SubscribersPage() {
  const { t } = useTranslation()
  const { locale } = useLocale()
  const { user } = useAuth()
  const navigate = useNavigate()
  useDocumentTitle(t("nav.subscribers"))

  const { data: subscribers = [] } = useSubscribersQuery()
  const { data: subscriptions = [] } = useSubscriptionsQuery()
  const { data: packages = [] } = usePackagesQuery()

  const saveSubscriberMutation = useSaveSubscriberMutation()
  const updateStatusMutation = useUpdateSubscriberStatusMutation()
  const assignSubMutation = useAssignSubscriptionMutation()
  const lifecycleSubMutation = useUpdateSubscriptionLifecycleMutation()

  const [query, setQuery] = useState("")
  const [status, setStatus] = useState<"all" | UserStatus>("all")
  const [packageFilter, setPackageFilter] = useState<string>("all")
  const [formState, setFormState] = useState<{
    open: boolean
    subscriber: DemoSubscriber | null
  }>({ open: false, subscriber: null })
  const [subDialogState, setSubDialogState] =
    useState<SubscriptionDialogState | null>(null)

  const packageMap = useMemo(
    () => new Map(packages.map((p) => [p.id, p])),
    [packages],
  )

  const rows = useMemo(() => {
    void subscriptions
    void packages
    const q = query.trim().toLowerCase()
    return subscribers.map(subscriberRow).filter((row) => {
      if (status !== "all" && row.status !== status) return false
      if (packageFilter !== "all") {
        if (packageFilter === "none") {
          if (row.subscription) return false
        } else if (row.subscription?.packageId !== packageFilter) {
          return false
        }
      }
      if (!q) return true
      return (
        row.displayName.toLowerCase().includes(q) ||
        (row.name?.en.toLowerCase().includes(q) ?? false) ||
        (row.name?.ar.includes(q) ?? false) ||
        row.email.toLowerCase().includes(q) ||
        row.phone.toLowerCase().includes(q) ||
        (row.goal?.[locale]?.toLowerCase().includes(q) ?? false)
      )
    })
  }, [query, status, packageFilter, subscribers, subscriptions, packages, locale])

  const stats = useMemo(() => {
    const total = subscribers.length
    const active = subscribers.filter((item) => item.status === "active").length
    const pending = subscribers.filter((item) => item.status === "pending").length
    const suspended = subscribers.filter(
      (item) => item.status === "suspended",
    ).length
    return { total, active, pending, suspended }
  }, [subscribers])

  async function handleQuickToggleStatus(row: DemoSubscriber) {
    const nextStatus: UserStatus =
      row.status === "active" ? "suspended" : "active"
    await updateStatusMutation.mutateAsync({
      subscriberId: row.id,
      status: nextStatus,
      syncSubscription: true,
      adminName: user?.displayName || user?.email || "Head Coach",
    })
    appToast.success(
      nextStatus === "active"
        ? locale === "ar"
          ? "تم تفعيل حساب المشترك بنجاح"
          : "Subscriber account activated"
        : locale === "ar"
          ? "تم تعليق حساب المشترك"
          : "Subscriber account suspended",
    )
  }

  return (
    <div className="flex flex-col gap-4 sm:gap-5">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
        <StatCard
          label={t("admin.subscribers.stats.total")}
          value={stats.total}
          icon={<Users className="size-4" strokeWidth={1.8} />}
        />
        <StatCard
          label={t("admin.subscribers.stats.active")}
          value={stats.active}
          icon={<UserCheck className="size-4" strokeWidth={1.8} />}
        />
        <StatCard
          label={t("admin.subscribers.stats.pending")}
          value={stats.pending}
          icon={<Clock className="size-4" strokeWidth={1.8} />}
        />
        <StatCard
          label={t("admin.subscribers.stats.suspended")}
          value={stats.suspended}
          icon={<UserX className="size-4" strokeWidth={1.8} />}
        />
      </div>

      <DataTable
        rows={rows}
        rowKey={(row) => row.id}
        pageSize={6}
        empty={t("admin.subscribers.empty")}
        actionsHeader={t("admin.common.actions")}
        renderExpandedRow={(row) => (
          <div className="grid gap-4 sm:grid-cols-[1fr_240px]">
            <div className="space-y-2.5">
              {row.goal?.[locale] ? (
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#8c8c8c]">
                    {t("admin.subscribers.goal")}
                  </p>
                  <p className="mt-1 text-[13px] font-medium text-[var(--gym-ink,#111111)]">
                    {row.goal[locale]}
                  </p>
                </div>
              ) : null}
              {row.healthNotes?.[locale] ? (
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#8c8c8c]">
                    {locale === "ar"
                      ? "ملاحظات صحية أو إصابات"
                      : "Health / injury notes"}
                  </p>
                  <p className="mt-1 text-[13px] font-medium text-[#C44536]">
                    {row.healthNotes[locale]}
                  </p>
                </div>
              ) : null}
              {row.coachNotes?.[locale] ? (
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#8c8c8c]">
                    {t("admin.subscribers.coachNotes")}
                  </p>
                  <p className="mt-1 text-[13px] font-medium text-[#6B7280]">
                    {row.coachNotes[locale]}
                  </p>
                </div>
              ) : null}
              {!row.goal?.[locale] &&
              !row.healthNotes?.[locale] &&
              !row.coachNotes?.[locale] ? (
                <p className="text-[13px] font-medium text-[#8c8c8c]">
                  {locale === "ar"
                    ? "لا توجد ملاحظات إضافية مسجلة لهذا المشترك."
                    : "No additional notes recorded for this subscriber."}
                </p>
              ) : null}
            </div>
            <dl className="space-y-1.5 text-[12px]">
              <div className="flex justify-between gap-2">
                <dt className="text-[#8c8c8c]">
                  {t("admin.subscribers.language")}
                </dt>
                <dd className="font-bold text-[var(--gym-ink,#111111)]">
                  {row.locale.toUpperCase()}
                </dd>
              </div>
              {row.age ? (
                <div className="flex justify-between gap-2">
                  <dt className="text-[#8c8c8c]">
                    {locale === "ar" ? "العمر" : "Age"}
                  </dt>
                  <dd className="font-bold text-[var(--gym-ink,#111111)]">
                    {row.age}
                  </dd>
                </div>
              ) : null}
              {row.heightCm ? (
                <div className="flex justify-between gap-2">
                  <dt className="text-[#8c8c8c]">
                    {t("admin.subscribers.height")}
                  </dt>
                  <dd className="font-bold text-[var(--gym-ink,#111111)]">
                    {row.heightCm} cm
                  </dd>
                </div>
              ) : null}
              {row.startingWeightKg != null || row.targetWeightKg != null ? (
                <div className="flex justify-between gap-2">
                  <dt className="text-[#8c8c8c]">
                    {locale === "ar" ? "الوزن (البداية ← الهدف)" : "Weight (start → target)"}
                  </dt>
                  <dd className="font-bold text-[var(--gym-ink,#111111)]">
                    {row.startingWeightKg ?? "—"} → {row.targetWeightKg ?? "—"} kg
                  </dd>
                </div>
              ) : null}
              <div className="flex justify-between gap-2">
                <dt className="text-[#8c8c8c]">
                  {locale === "ar" ? "تاريخ الانضمام" : "Joined"}
                </dt>
                <dd className="font-bold text-[var(--gym-ink,#111111)]">
                  {formatDate(row.createdAt, locale)}
                </dd>
              </div>
            </dl>
          </div>
        )}
        toolbar={
          <div className="flex flex-col gap-3.5">
            {/* Top row: Search input + Package filter select + Add subscriber button */}
            <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
              <label className="relative w-full sm:max-w-[340px]">
                <Search className="pointer-events-none absolute start-3.5 top-1/2 size-4 -translate-y-1/2 text-[#8c8c8c]" />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder={t("admin.subscribers.search")}
                  className={cn(
                    "h-11 w-full rounded-full bg-[#F4F4F4] pe-4 ps-10 text-[14px] font-medium text-[var(--gym-ink,#063434)] outline-none",
                    "placeholder:font-normal placeholder:text-[#8c8c8c]",
                  )}
                />
              </label>

              <div className="flex shrink-0 items-center gap-2 sm:gap-2.5">
                <div className="relative inline-flex items-center">
                  <select
                    value={packageFilter}
                    onChange={(event) => setPackageFilter(event.target.value)}
                    className="h-11 w-auto min-w-[130px] max-w-[170px] cursor-pointer appearance-none rounded-full bg-[#F4F4F4] pe-8 ps-4 text-[13px] font-bold text-[var(--gym-ink,#111111)] outline-none transition hover:bg-black/5 truncate"
                  >
                    <option value="all">
                      {locale === "ar" ? "كل الباقات" : "All packages"}
                    </option>
                    {packages.map((pkg) => (
                      <option key={pkg.id} value={pkg.id}>
                        {pkg.name[locale]}
                      </option>
                    ))}
                    <option value="none">
                      {locale === "ar" ? "بدون باقة" : "No package"}
                    </option>
                  </select>
                  <ChevronDown className="pointer-events-none absolute end-3 size-4 text-[#8c8c8c]" />
                </div>

                <button
                  type="button"
                  onClick={() => setFormState({ open: true, subscriber: null })}
                  className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-full bg-[var(--gym-ink,#063434)] px-5 text-[13px] font-bold text-white transition hover:opacity-95"
                >
                  <UserPlus className="size-4" strokeWidth={2} />
                  {t("admin.subscribers.add")}
                </button>
              </div>
            </div>

            {/* Bottom row: Filter chips */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 pt-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {STATUS_FILTERS.map((item) => (
                <FilterChip
                  key={item}
                  active={status === item}
                  onClick={() => setStatus(item)}
                >
                  {item === "all"
                    ? t("admin.common.all")
                    : t(`admin.status.${item}`)}
                </FilterChip>
              ))}
            </div>
          </div>
        }
        columns={[
          {
            id: "name",
            header: t("admin.subscribers.columns.name"),
            cell: (row) => {
              const nameText = subscriberDisplayName(row, locale)
              return (
                <div className="flex items-center gap-3">
                  <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-full bg-[var(--gym-ink,#063434)] font-heading text-[12px] font-bold text-[var(--gym-lime,#b8fe22)]">
                    {initials(nameText)}
                  </span>
                  <div className="min-w-0">
                    <button
                      type="button"
                      onClick={() =>
                        navigate(APP_ROUTES.admin.subscriberDetail(row.id))
                      }
                      className="truncate text-start font-semibold hover:underline"
                    >
                      {nameText}
                    </button>
                    <p className="truncate text-[12px] font-medium text-[#8c8c8c]">
                      {row.email}
                    </p>
                  </div>
                </div>
              )
            },
          },
          {
            id: "phone",
            header: t("admin.subscribers.columns.phone"),
            cell: (row) => row.phone,
            className: "text-[#6B7280]",
          },
          {
            id: "account",
            header: t("admin.subscribers.columns.account"),
            cell: (row) => (
              <StatusBadge
                label={t(`admin.status.${row.status}`)}
                tone={accountStatusTone(row.status)}
              />
            ),
          },
          {
            id: "package",
            header: t("admin.subscribers.columns.package"),
            cell: (row) =>
              row.subscription
                ? (packageMap.get(row.subscription.packageId)?.name[locale] ??
                  row.subscription.packageName?.[locale] ??
                  "—")
                : "—",
          },
          {
            id: "subscription",
            header: t("admin.subscribers.columns.subscription"),
            cell: (row) =>
              row.subscription ? (
                <StatusBadge
                  label={t(`admin.status.${row.subscription.status}`)}
                  tone={subscriptionStatusTone(row.subscription.status)}
                />
              ) : (
                "—"
              ),
          },
          {
            id: "ends",
            header: t("admin.subscribers.columns.expires"),
            cell: (row) => formatDate(row.subscription?.endsAt, locale),
            className: "text-[#6B7280]",
          },
        ]}
        actions={(row) => (
          <>
            <TableAction
              label={t("admin.common.view")}
              tone="primary"
              onClick={() => navigate(APP_ROUTES.admin.subscriberDetail(row.id))}
            />
            <TableAction
              label={locale === "ar" ? "تعديل" : "Edit"}
              onClick={() => setFormState({ open: true, subscriber: row })}
            />
            <TableAction
              label={t("admin.common.manage")}
              onClick={() => {
                if (row.subscription) {
                  setSubDialogState({
                    mode: "manage",
                    subscription: row.subscription,
                    initialAction:
                      row.subscription.status === "active"
                        ? "renew"
                        : "activate",
                  })
                } else {
                  setSubDialogState({
                    mode: "assign",
                    defaultSubscriberId: row.id,
                    defaultPackageId: row.preferredPackageId,
                  })
                }
              }}
            />
            <TableAction
              label={
                row.status === "active"
                  ? locale === "ar"
                    ? "تعليق"
                    : "Suspend"
                  : locale === "ar"
                    ? "تفعيل"
                    : "Activate"
              }
              tone={row.status === "active" ? "danger" : "default"}
              onClick={() => void handleQuickToggleStatus(row)}
            />
          </>
        )}
      />

      <SubscriberFormDialog
        open={formState.open}
        subscriber={formState.subscriber}
        packages={packages}
        busy={saveSubscriberMutation.isPending}
        adminName={user?.displayName || user?.email || "Head Coach"}
        onClose={() => setFormState({ open: false, subscriber: null })}
        onSave={async (payload) => {
          const isEdit = Boolean(payload.id)
          await saveSubscriberMutation.mutateAsync(payload)
          setFormState({ open: false, subscriber: null })
          appToast.success(
            isEdit
              ? locale === "ar"
                ? "تم تحديث بيانات المشترك بنجاح"
                : "Subscriber updated successfully"
              : locale === "ar"
                ? "تم إنشاء حساب المشترك بنجاح"
                : "Subscriber account created successfully",
          )
        }}
      />

      <SubscriptionActionDialog
        state={subDialogState}
        packages={packages}
        busy={assignSubMutation.isPending || lifecycleSubMutation.isPending}
        adminName={user?.displayName || user?.email || "Head Coach"}
        onClose={() => setSubDialogState(null)}
        onAssign={async (payload) => {
          await assignSubMutation.mutateAsync(payload)
          setSubDialogState(null)
          appToast.success(
            locale === "ar"
              ? "تم تعيين الاشتراك للمشترك بنجاح"
              : "Subscription assigned successfully",
          )
        }}
        onLifecycle={async (payload) => {
          await lifecycleSubMutation.mutateAsync(payload)
          setSubDialogState(null)
          appToast.success(
            locale === "ar"
              ? "تم تحديث حالة الاشتراك بنجاح"
              : "Subscription updated successfully",
          )
        }}
      />
    </div>
  )
}
