import { useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { CalendarClock, CalendarOff, Clock, CreditCard, Search } from "lucide-react"
import { DataTable, TableAction } from "@/components/dashboard/DataTable"
import { FilterChip, StatCard } from "@/components/dashboard/StatCard"
import { StatusBadge, subscriptionStatusTone } from "@/components/dashboard/StatusBadge"
import { APP_ROUTES } from "@/config/constants"
import { getSubscriberById } from "@/features/subscribers/demo"
import { DEMO_SUBSCRIPTIONS, getPackageById } from "@/features/subscriptions/demo"
import { useDocumentTitle } from "@/hooks/useDocumentTitle"
import { useLocale } from "@/hooks/useLocale"
import { daysUntil, formatDate, initials } from "@/lib/format"
import { appToast } from "@/lib/toast"
import { cn } from "@/lib/utils"
import type { SubscriptionStatus } from "@/types/subscription"

const STATUS_FILTERS: Array<"all" | SubscriptionStatus> = [
  "all",
  "active",
  "pending",
  "expired",
  "suspended",
  "cancelled",
]

export function SubscriptionsPage() {
  const { t } = useTranslation()
  const { locale } = useLocale()
  const navigate = useNavigate()
  useDocumentTitle(t("nav.subscriptions"))

  const [query, setQuery] = useState("")
  const [status, setStatus] = useState<"all" | SubscriptionStatus>("all")

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase()
    return DEMO_SUBSCRIPTIONS.filter((row) => {
      if (status !== "all" && row.status !== status) return false
      if (!q) return true
      const subscriber = getSubscriberById(row.subscriberId)
      const pkg = getPackageById(row.packageId)
      return (
        subscriber?.displayName.toLowerCase().includes(q) ||
        subscriber?.email.toLowerCase().includes(q) ||
        pkg?.name.en.toLowerCase().includes(q) ||
        pkg?.name.ar.includes(q)
      )
    })
  }, [query, status])

  const stats = useMemo(() => {
    const active = DEMO_SUBSCRIPTIONS.filter((item) => item.status === "active").length
    const pending = DEMO_SUBSCRIPTIONS.filter((item) => item.status === "pending").length
    const expired = DEMO_SUBSCRIPTIONS.filter((item) => item.status === "expired").length
    const expiring = DEMO_SUBSCRIPTIONS.filter((item) => {
      if (item.status !== "active") return false
      const days = daysUntil(item.endsAt)
      return days !== null && days >= 0 && days <= 21
    }).length
    return { active, pending, expired, expiring }
  }, [])

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

      <DataTable
        rows={rows}
        rowKey={(row) => row.id}
        empty={t("admin.subscriptions.empty")}
        actionsHeader={t("admin.common.actions")}
        toolbar={
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex min-w-0 flex-1 flex-col gap-3 sm:flex-row sm:items-center">
              <label className="relative min-w-0 flex-1 sm:max-w-[320px]">
                <Search className="pointer-events-none absolute start-3.5 top-1/2 size-4 -translate-y-1/2 text-[#8c8c8c]" />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder={t("admin.subscriptions.search")}
                  className={cn(
                    "h-11 w-full rounded-full bg-[#F4F4F4] pe-4 ps-10 text-[14px] font-medium text-[var(--gym-ink,#063434)] outline-none",
                    "placeholder:font-normal placeholder:text-[#8c8c8c]",
                  )}
                />
              </label>
              <div className="flex gap-1.5 overflow-x-auto pb-0.5">
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
            <button
              type="button"
              onClick={() => appToast.success(t("admin.common.demoOnly"))}
              className="inline-flex h-11 shrink-0 items-center justify-center rounded-full bg-[var(--gym-ink,#063434)] px-5 text-[13px] font-bold text-white"
            >
              {t("admin.subscriptions.assign")}
            </button>
          </div>
        }
        columns={[
          {
            id: "subscriber",
            header: t("admin.subscriptions.columns.subscriber"),
            cell: (row) => {
              const subscriber = getSubscriberById(row.subscriberId)
              if (!subscriber) return "—"
              return (
                <div className="flex items-center gap-3">
                  <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-full bg-[var(--gym-ink,#063434)] font-heading text-[12px] font-bold text-[var(--gym-lime,#b8fe22)]">
                    {initials(subscriber.displayName)}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate font-semibold">{subscriber.displayName}</p>
                    <p className="truncate text-[12px] font-medium text-[#8c8c8c]">
                      {subscriber.email}
                    </p>
                  </div>
                </div>
              )
            },
          },
          {
            id: "package",
            header: t("admin.subscribers.columns.package"),
            cell: (row) => getPackageById(row.packageId)?.name[locale] ?? "—",
          },
          {
            id: "status",
            header: t("admin.subscribers.columns.subscription"),
            cell: (row) => (
              <StatusBadge
                label={t(`admin.status.${row.status}`)}
                tone={subscriptionStatusTone(row.status)}
              />
            ),
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
              tone="primary"
              onClick={() => navigate(APP_ROUTES.admin.subscriberDetail(row.subscriberId))}
            />
            <TableAction
              label={
                row.status === "active"
                  ? t("admin.subscriptions.renew")
                  : t("admin.subscriptions.activate")
              }
              onClick={() => appToast.success(t("admin.common.demoOnly"))}
            />
          </>
        )}
      />
    </div>
  )
}
