import { useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { CircleCheck, CircleX, ClipboardList, Inbox, Search } from "lucide-react"
import { DataTable, TableAction } from "@/components/dashboard/DataTable"
import { FilterChip, StatCard } from "@/components/dashboard/StatCard"
import { StatusBadge } from "@/components/dashboard/StatusBadge"
import {
  DEMO_REGISTRATION_REQUESTS,
  type DemoRegistrationRequest,
  type RegistrationRequestStatus,
} from "@/features/subscribers/requests-demo"
import { getPackageById } from "@/features/subscriptions/demo"
import { useDocumentTitle } from "@/hooks/useDocumentTitle"
import { useLocale } from "@/hooks/useLocale"
import { formatDate, initials } from "@/lib/format"
import { appToast } from "@/lib/toast"
import { cn } from "@/lib/utils"

const STATUS_FILTERS: Array<"all" | RegistrationRequestStatus> = [
  "all",
  "pending",
  "approved",
  "rejected",
]

function requestTone(status: RegistrationRequestStatus) {
  if (status === "pending") return "warning" as const
  if (status === "approved") return "success" as const
  return "danger" as const
}

export function RegistrationRequestsPage() {
  const { t } = useTranslation()
  const { locale } = useLocale()
  useDocumentTitle(t("nav.registrationRequests"))

  const [query, setQuery] = useState("")
  const [status, setStatus] = useState<"all" | RegistrationRequestStatus>("pending")
  const [rows, setRows] = useState(DEMO_REGISTRATION_REQUESTS)

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase()
    return rows.filter((row) => {
      if (status !== "all" && row.status !== status) return false
      if (!q) return true
      const pkg = getPackageById(row.packageId)
      return (
        row.displayName.toLowerCase().includes(q) ||
        row.email.toLowerCase().includes(q) ||
        row.phone.toLowerCase().includes(q) ||
        (pkg?.name[locale].toLowerCase().includes(q) ?? false)
      )
    })
  }, [query, status, rows, locale])

  const stats = useMemo(() => {
    const pending = rows.filter((item) => item.status === "pending").length
    const approved = rows.filter((item) => item.status === "approved").length
    const rejected = rows.filter((item) => item.status === "rejected").length
    return { pending, approved, rejected, total: rows.length }
  }, [rows])

  function review(id: string, next: RegistrationRequestStatus) {
    setRows((current) =>
      current.map((item) =>
        item.id === id
          ? { ...item, status: next, reviewedAt: new Date().toISOString() }
          : item,
      ),
    )
    appToast.success(
      next === "approved"
        ? t("admin.requests.toast.approved")
        : t("admin.requests.toast.rejected"),
    )
  }

  return (
    <div className="flex flex-col gap-4 sm:gap-5">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
        <StatCard
          label={t("admin.requests.stats.pending")}
          value={stats.pending}
          hint={t("admin.requests.stats.pendingHint")}
          icon={<Inbox className="size-4" strokeWidth={1.8} />}
        />
        <StatCard
          label={t("admin.requests.stats.approved")}
          value={stats.approved}
          icon={<CircleCheck className="size-4" strokeWidth={1.8} />}
        />
        <StatCard
          label={t("admin.requests.stats.rejected")}
          value={stats.rejected}
          icon={<CircleX className="size-4" strokeWidth={1.8} />}
        />
        <StatCard
          label={t("admin.requests.stats.total")}
          value={stats.total}
          icon={<ClipboardList className="size-4" strokeWidth={1.8} />}
        />
      </div>

      <DataTable
        rows={visible}
        rowKey={(row) => row.id}
        empty={t("admin.requests.empty")}
        actionsHeader={t("admin.common.actions")}
        renderExpandedRow={(row) => <RequestDetails row={row} />}
        toolbar={
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex min-w-0 flex-1 flex-col gap-3 sm:flex-row sm:items-center">
              <label className="relative min-w-0 flex-1 sm:max-w-[320px]">
                <Search className="pointer-events-none absolute start-3.5 top-1/2 size-4 -translate-y-1/2 text-[#8c8c8c]" />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder={t("admin.requests.search")}
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
                      : t(`admin.requests.status.${item}`)}
                  </FilterChip>
                ))}
              </div>
            </div>
            <p className="text-[13px] font-medium text-[#8c8c8c]">
              {t("admin.requests.hint")}
            </p>
          </div>
        }
        columns={[
          {
            id: "person",
            header: t("admin.requests.columns.person"),
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
            id: "package",
            header: t("admin.requests.columns.package"),
            cell: (row) => getPackageById(row.packageId)?.name[locale] ?? "—",
          },
          {
            id: "received",
            header: t("admin.requests.columns.received"),
            cell: (row) => formatDate(row.createdAt, locale),
            className: "text-[#6B7280]",
          },
          {
            id: "status",
            header: t("admin.requests.columns.status"),
            cell: (row) => (
              <StatusBadge
                label={t(`admin.requests.status.${row.status}`)}
                tone={requestTone(row.status)}
              />
            ),
          },
        ]}
        actions={(row) =>
          row.status === "pending" ? (
            <>
              <TableAction
                label={t("admin.requests.approve")}
                tone="primary"
                onClick={() => review(row.id, "approved")}
              />
              <TableAction
                label={t("admin.requests.reject")}
                tone="danger"
                onClick={() => review(row.id, "rejected")}
              />
            </>
          ) : (
            <span className="px-3 text-[12px] font-bold text-[#8c8c8c]">
              {t("admin.requests.reviewed")}
            </span>
          )
        }
      />
    </div>
  )
}

function RequestDetails({ row }: { row: DemoRegistrationRequest }) {
  const { t } = useTranslation()
  const { locale } = useLocale()
  const pkg = getPackageById(row.packageId)

  return (
    <div className="grid gap-4 sm:grid-cols-[1fr_220px]">
      <div>
        <p className="text-[12px] font-bold uppercase tracking-[0.08em] text-[#8c8c8c]">
          {t("admin.requests.goal")}
        </p>
        <p className="mt-2 text-[14px] font-medium leading-relaxed text-[var(--gym-ink,#063434)]">
          {row.goal[locale]}
        </p>
      </div>
      <dl className="space-y-2 text-[13px]">
        <div className="flex justify-between gap-3">
          <dt className="text-[#8c8c8c]">{t("admin.requests.columns.package")}</dt>
          <dd className="font-semibold text-[var(--gym-ink,#063434)]">
            {pkg?.name[locale] ?? "—"}
          </dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="text-[#8c8c8c]">{t("admin.requests.source")}</dt>
          <dd className="font-semibold text-[var(--gym-ink,#063434)]">
            {t(`admin.requests.sources.${row.source}`)}
          </dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="text-[#8c8c8c]">{t("admin.subscribers.language")}</dt>
          <dd className="font-semibold text-[var(--gym-ink,#063434)]">
            {row.locale.toUpperCase()}
          </dd>
        </div>
      </dl>
    </div>
  )
}
