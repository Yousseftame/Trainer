import { useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { Clock, Search, UserCheck, UserPlus, Users, UserX } from "lucide-react"
import { DataTable, TableAction } from "@/components/dashboard/DataTable"
import { FilterChip, StatCard } from "@/components/dashboard/StatCard"
import {
  StatusBadge,
  accountStatusTone,
  subscriptionStatusTone,
} from "@/components/dashboard/StatusBadge"
import { APP_ROUTES } from "@/config/constants"
import { DEMO_SUBSCRIBERS, subscriberRow } from "@/features/subscribers/demo"
import { getPackageById } from "@/features/subscriptions/demo"
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
  const navigate = useNavigate()
  useDocumentTitle(t("nav.subscribers"))

  const [query, setQuery] = useState("")
  const [status, setStatus] = useState<"all" | UserStatus>("all")

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase()
    return DEMO_SUBSCRIBERS.map(subscriberRow).filter((row) => {
      if (status !== "all" && row.status !== status) return false
      if (!q) return true
      return (
        row.displayName.toLowerCase().includes(q) ||
        row.email.toLowerCase().includes(q) ||
        row.phone.toLowerCase().includes(q)
      )
    })
  }, [query, status])

  const stats = useMemo(() => {
    const total = DEMO_SUBSCRIBERS.length
    const active = DEMO_SUBSCRIBERS.filter((item) => item.status === "active").length
    const pending = DEMO_SUBSCRIBERS.filter((item) => item.status === "pending").length
    const suspended = DEMO_SUBSCRIBERS.filter((item) => item.status === "suspended").length
    return { total, active, pending, suspended }
  }, [])

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
        empty={t("admin.subscribers.empty")}
        actionsHeader={t("admin.common.actions")}
        toolbar={
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex min-w-0 flex-1 flex-col gap-3 sm:flex-row sm:items-center">
              <label className="relative min-w-0 flex-1 sm:max-w-[320px]">
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
              className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-full bg-[var(--gym-ink,#063434)] px-5 text-[13px] font-bold text-white"
            >
              <UserPlus className="size-4" strokeWidth={2} />
              {t("admin.subscribers.add")}
            </button>
          </div>
        }
        columns={[
          {
            id: "name",
            header: t("admin.subscribers.columns.name"),
            cell: (row) => (
              <div className="flex items-center gap-3">
                <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-full bg-[var(--gym-ink,#063434)] font-heading text-[12px] font-bold text-[var(--gym-lime,#b8fe22)]">
                  {initials(row.displayName)}
                </span>
                <div className="min-w-0">
                  <p className="truncate font-semibold">{row.displayName}</p>
                  <p className="truncate text-[12px] font-medium text-[#8c8c8c]">{row.email}</p>
                </div>
              </div>
            ),
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
              getPackageById(row.subscription?.packageId)?.name[locale] ?? "—",
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
              label={t("admin.common.manage")}
              onClick={() => appToast.success(t("admin.common.demoOnly"))}
            />
          </>
        )}
      />
    </div>
  )
}
