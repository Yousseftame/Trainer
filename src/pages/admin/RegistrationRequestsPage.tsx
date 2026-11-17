import { useEffect, useMemo, useRef, useState } from "react"
import { Link, useSearchParams } from "react-router-dom"
import { useTranslation } from "react-i18next"
import {
  CircleCheck,
  CircleX,
  ClipboardList,
  Inbox,
  Plus,
  Search,
} from "lucide-react"
import { DataTable, TableAction } from "@/components/dashboard/DataTable"
import { FilterChip, StatCard } from "@/components/dashboard/StatCard"
import { StatusBadge } from "@/components/dashboard/StatusBadge"
import {
  RegistrationReviewDialog,
  type RegistrationDialogState,
} from "@/components/dashboard/RegistrationReviewDialog"
import { ShareCredentialsDialog } from "@/components/dashboard/ShareCredentialsDialog"
import { SendRegistrationOfferDialog } from "@/components/dashboard/SendRegistrationOfferDialog"
import { APP_ROUTES } from "@/config/constants"
import { useAuth } from "@/features/auth/auth-context"
import {
  useCreateRegistrationRequestMutation,
  useRegistrationRequestsQuery,
  useReviewRegistrationRequestMutation,
} from "@/features/subscribers/hooks"
import type {
  RegistrationRequest,
  RegistrationRequestStatus,
} from "@/features/subscribers"
import { usePackagesQuery } from "@/features/subscriptions/hooks"
import { useDocumentTitle } from "@/hooks/useDocumentTitle"
import { useLocale } from "@/hooks/useLocale"
import { formatDate, initials } from "@/lib/format"
import {
  buildOfferPayloadFromRequest,
  type RegistrationOfferPayload,
} from "@/lib/registration-offer"
import type { ShareCredentialsPayload } from "@/lib/share-credentials"
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
  const { user } = useAuth()
  const [searchParams] = useSearchParams()
  const focusRequestId = searchParams.get("request") || ""
  const focusedOnceRef = useRef<string | null>(null)
  useDocumentTitle(t("nav.registrationRequests"))

  const { data: rows = [] } = useRegistrationRequestsQuery()
  const { data: packages = [] } = usePackagesQuery()
  const reviewMutation = useReviewRegistrationRequestMutation()
  const createMutation = useCreateRegistrationRequestMutation()
  const actionsBusy = reviewMutation.isPending || createMutation.isPending

  const [query, setQuery] = useState("")
  const [status, setStatus] = useState<"all" | RegistrationRequestStatus>(
    "pending",
  )
  const [dialogState, setDialogState] =
    useState<RegistrationDialogState | null>(null)
  const [sharePayload, setSharePayload] =
    useState<ShareCredentialsPayload | null>(null)
  const [offerPayload, setOfferPayload] =
    useState<RegistrationOfferPayload | null>(null)

  useEffect(() => {
    if (!focusRequestId || !rows.length) return
    if (focusedOnceRef.current === focusRequestId) return
    const row = rows.find((item) => item.id === focusRequestId)
    if (!row) return
    focusedOnceRef.current = focusRequestId
    setStatus(row.status === "pending" ? "pending" : "all")
    if (row.status === "pending") {
      setDialogState({ mode: "approve", request: row })
    }
  }, [focusRequestId, rows])

  const packageMap = useMemo(
    () => new Map(packages.map((p) => [p.id, p])),
    [packages],
  )

  function openOffer(row: RegistrationRequest) {
    const pkg = row.packageId ? packageMap.get(row.packageId) : undefined
    setOfferPayload(
      buildOfferPayloadFromRequest({
        displayName: row.displayName,
        name: row.name,
        email: row.email,
        phone: row.phone,
        locale: row.locale,
        goal: row.goal,
        assessment: row.assessment,
        packageName: pkg?.name,
        packagePrice: pkg?.price,
      }),
    )
  }

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase()
    return rows.filter((row) => {
      if (status !== "all" && row.status !== status) return false
      if (!q) return true
      const pkg = row.packageId ? packageMap.get(row.packageId) : undefined
      return (
        row.displayName.toLowerCase().includes(q) ||
        (row.name?.en.toLowerCase().includes(q) ?? false) ||
        (row.name?.ar.includes(q) ?? false) ||
        row.email.toLowerCase().includes(q) ||
        row.phone.toLowerCase().includes(q) ||
        (pkg?.name[locale].toLowerCase().includes(q) ?? false) ||
        row.goal[locale].toLowerCase().includes(q)
      )
    })
  }, [query, status, rows, locale, packageMap])

  const stats = useMemo(() => {
    const pending = rows.filter((item) => item.status === "pending").length
    const approved = rows.filter((item) => item.status === "approved").length
    const rejected = rows.filter((item) => item.status === "rejected").length
    return { pending, approved, rejected, total: rows.length }
  }, [rows])

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
        pageSize={6}
        empty={t("admin.requests.empty")}
        actionsHeader={t("admin.common.actions")}
        renderExpandedRow={(row) => (
          <RequestDetails
            row={row}
            packageName={
              row.packageId ? packageMap.get(row.packageId)?.name[locale] : undefined
            }
          />
        )}
        toolbar={
          <div className="flex flex-col gap-3.5">
            {/* Top row: Search input + New Request Action button */}
            <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
              <label className="relative w-full sm:max-w-[340px]">
                <Search className="pointer-events-none absolute start-3.5 top-1/2 size-4 -translate-y-1/2 text-[#8c8c8c]" />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder={t("admin.requests.search")}
                  className={cn(
                    "h-11 w-full rounded-full bg-[#F4F4F4] pe-4 ps-10 text-[14px] font-medium text-[var(--gym-ink,#111111)] outline-none",
                    "placeholder:font-normal placeholder:text-[#8c8c8c]",
                  )}
                />
              </label>
              <button
                type="button"
                disabled={actionsBusy}
                onClick={() => setDialogState({ mode: "create" })}
                className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-full bg-[var(--gym-ink,#111111)] px-5 text-[13px] font-bold text-white transition hover:opacity-95 disabled:opacity-60"
              >
                <Plus className="size-4" strokeWidth={2} />
                {locale === "ar" ? "طلب يدوي جديد" : "New request"}
              </button>
            </div>

            {/* Bottom row: Filter chips on left + descriptive hint on right */}
            <div className="flex flex-col gap-2 pt-1 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
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
              <p className="text-[12.5px] font-medium text-[#8c8c8c]">
                {t("admin.requests.hint")}
              </p>
            </div>
          </div>
        }
        columns={[
          {
            id: "person",
            header: t("admin.requests.columns.person"),
            cell: (row) => {
              const nameText = row.name?.[locale] || row.displayName
              return (
                <div className="flex items-center gap-3">
                  <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-full bg-[var(--gym-ink,#111111)] font-heading text-[12px] font-bold text-[var(--gym-lime,#fb5001)]">
                    {initials(nameText)}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate font-semibold">{nameText}</p>
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
            id: "package",
            header: t("admin.requests.columns.package"),
            cell: (row) =>
              (row.packageId
                ? packageMap.get(row.packageId)?.name[locale]
                : undefined) ?? "—",
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
                label={t("admin.requests.offer.action")}
                disabled={actionsBusy}
                onClick={() => openOffer(row)}
              />
              <TableAction
                label={t("admin.requests.approve")}
                tone="primary"
                disabled={actionsBusy}
                onClick={() =>
                  setDialogState({ mode: "approve", request: row })
                }
              />
              <TableAction
                label={t("admin.requests.reject")}
                tone="danger"
                disabled={actionsBusy}
                onClick={() =>
                  setDialogState({ mode: "reject", request: row })
                }
              />
            </>
          ) : (
            <div className="flex items-center gap-1">
              <TableAction
                label={t("admin.requests.offer.action")}
                onClick={() => openOffer(row)}
              />
              {row.subscriberId ? (
                <Link
                  to={APP_ROUTES.admin.subscriberDetail(row.subscriberId)}
                  className="inline-flex h-8 items-center rounded-full px-3 text-xs font-bold text-[var(--gym-ink,#111111)] hover:bg-white"
                >
                  {t("admin.common.view")}
                </Link>
              ) : null}
              <span className="px-3 text-[12px] font-bold text-[#8c8c8c]">
                {t("admin.requests.reviewed")}
              </span>
            </div>
          )
        }
      />

      <RegistrationReviewDialog
        state={dialogState}
        packages={packages}
        busy={actionsBusy}
        adminName={user?.displayName || user?.email || "Head Coach"}
        onClose={() => {
          if (actionsBusy) return
          setDialogState(null)
        }}
        onReview={async (payload) => {
          try {
            const result = await reviewMutation.mutateAsync(payload)
            setDialogState(null)
            appToast.success(
              payload.decision === "approved"
                ? t("admin.requests.toast.approved")
                : t("admin.requests.toast.rejected"),
            )
            if (
              payload.decision === "approved" &&
              result.subscriber?.id &&
              payload.password?.trim()
            ) {
              setSharePayload({
                subscriberId: result.subscriber.id,
                displayName: result.subscriber.displayName,
                email: result.subscriber.email,
                phone:
                  result.subscriber.phone || result.request.phone || "",
                password:
                  result.subscriber.loginPassword?.trim() ||
                  payload.password.trim(),
                locale: result.subscriber.locale,
              })
            }
          } catch (err) {
            appToast.error(
              err instanceof Error
                ? err.message
                : locale === "ar"
                  ? "تعذر إكمال مراجعة الطلب"
                  : "Could not complete request review",
            )
          }
        }}
        onCreate={async (payload) => {
          try {
            await createMutation.mutateAsync(payload)
            setDialogState(null)
            appToast.success(
              locale === "ar"
                ? "تمت إضافة طلب التسجيل بنجاح"
                : "Registration request added",
            )
          } catch (err) {
            appToast.error(
              err instanceof Error
                ? err.message
                : locale === "ar"
                  ? "تعذر إضافة طلب التسجيل"
                  : "Could not add registration request",
            )
          }
        }}
      />

      <ShareCredentialsDialog
        open={Boolean(sharePayload)}
        payload={sharePayload}
        onClose={() => setSharePayload(null)}
      />

      <SendRegistrationOfferDialog
        open={Boolean(offerPayload)}
        payload={offerPayload}
        onClose={() => setOfferPayload(null)}
      />
    </div>
  )
}

function AssessmentDetailRow({
  label,
  value,
}: {
  label: string
  value?: string | number | null
}) {
  if (value === undefined || value === null || value === "") return null
  return (
    <div className="flex justify-between gap-3 text-[13px]">
      <dt className="text-[#8c8c8c]">{label}</dt>
      <dd className="max-w-[60%] text-end font-semibold text-[var(--gym-ink,#111111)]">
        {value}
      </dd>
    </div>
  )
}

function RequestDetails({
  row,
  packageName,
}: {
  row: RegistrationRequest
  packageName?: string
}) {
  const { t } = useTranslation()
  const { locale } = useLocale()
  const assessment = row.assessment

  return (
    <div className="grid gap-4 sm:grid-cols-[1fr_240px]">
      <div className="space-y-4">
        <div>
          <p className="text-[12px] font-bold uppercase tracking-[0.08em] text-[#8c8c8c]">
            {t("admin.requests.goal")}
          </p>
          <p className="mt-1.5 text-[14px] font-medium leading-relaxed text-[var(--gym-ink,#111111)]">
            {row.goal[locale]}
          </p>
        </div>

        {assessment ? (
          <div className="space-y-4 rounded-2xl border border-[var(--gym-ink)]/8 bg-[#fafafa] p-4">
            <p className="text-[12px] font-bold uppercase tracking-[0.08em] text-[#8c8c8c]">
              {t("admin.requests.assessment.title")}
            </p>

            <div className="space-y-2">
              <p className="text-[12px] font-semibold text-[var(--gym-ink)]/70">
                {t("admin.requests.assessment.personal")}
              </p>
              <dl className="space-y-1.5">
                <AssessmentDetailRow
                  label={t("admin.requests.assessment.age")}
                  value={assessment.age}
                />
                <AssessmentDetailRow
                  label={t("admin.requests.assessment.sex")}
                  value={
                    assessment.sex
                      ? t(`contact.assessment.options.sex.${assessment.sex}`)
                      : undefined
                  }
                />
                <AssessmentDetailRow
                  label={t("admin.requests.assessment.height")}
                  value={
                    assessment.heightCm != null
                      ? t("admin.requests.assessment.cm", {
                          value: assessment.heightCm,
                        })
                      : undefined
                  }
                />
                <AssessmentDetailRow
                  label={t("admin.requests.assessment.weight")}
                  value={
                    assessment.startingWeightKg != null
                      ? t("admin.requests.assessment.kg", {
                          value: assessment.startingWeightKg,
                        })
                      : undefined
                  }
                />
                <AssessmentDetailRow
                  label={t("admin.requests.assessment.targetWeight")}
                  value={
                    assessment.targetWeightKg != null
                      ? t("admin.requests.assessment.kg", {
                          value: assessment.targetWeightKg,
                        })
                      : undefined
                  }
                />
                {assessment.healthNotes?.[locale] ||
                assessment.healthNotes?.en ||
                assessment.healthNotes?.ar ? (
                  <div className="pt-1">
                    <p className="text-[12px] text-[#8c8c8c]">
                      {t("admin.requests.assessment.healthNotes")}
                    </p>
                    <p className="mt-1 text-[13px] font-medium leading-relaxed text-[var(--gym-ink,#111111)]">
                      {assessment.healthNotes?.[locale] ||
                        assessment.healthNotes?.en ||
                        assessment.healthNotes?.ar}
                    </p>
                  </div>
                ) : null}
              </dl>
            </div>

            <div className="space-y-2 border-t border-[var(--gym-ink)]/6 pt-3">
              <p className="text-[12px] font-semibold text-[var(--gym-ink)]/70">
                {t("admin.requests.assessment.fitness")}
              </p>
              <dl className="space-y-1.5">
                <AssessmentDetailRow
                  label={t("admin.requests.assessment.experience")}
                  value={
                    assessment.fitnessExperience
                      ? t(
                          `contact.assessment.options.experience.${assessment.fitnessExperience}`,
                        )
                      : undefined
                  }
                />
                <AssessmentDetailRow
                  label={t("admin.requests.assessment.activity")}
                  value={
                    assessment.activityLevel
                      ? t(
                          `contact.assessment.options.activity.${assessment.activityLevel}`,
                        )
                      : undefined
                  }
                />
                <AssessmentDetailRow
                  label={t("admin.requests.assessment.frequency")}
                  value={
                    assessment.workoutFrequency
                      ? t(
                          `contact.assessment.options.frequency.${assessment.workoutFrequency}`,
                        )
                      : undefined
                  }
                />
                <AssessmentDetailRow
                  label={t("admin.requests.assessment.primaryGoal")}
                  value={
                    assessment.primaryGoal
                      ? t(
                          `contact.assessment.options.goal.${assessment.primaryGoal}`,
                        )
                      : undefined
                  }
                />
              </dl>
            </div>
          </div>
        ) : null}

        {row.reviewNotesLocalized?.[locale] || row.reviewNotes ? (
          <div>
            <p className="text-[12px] font-bold uppercase tracking-[0.08em] text-[#8c8c8c]">
              {locale === "ar" ? "ملاحظات المراجعة" : "Review notes"}
            </p>
            <p className="mt-1 text-[13px] font-medium text-[#6B7280]">
              {row.reviewNotesLocalized?.[locale] ?? row.reviewNotes}
            </p>
          </div>
        ) : null}
      </div>
      <dl className="space-y-2 text-[13px]">
        <div className="flex justify-between gap-3">
          <dt className="text-[#8c8c8c]">{t("admin.requests.columns.package")}</dt>
          <dd className="font-semibold text-[var(--gym-ink,#111111)]">
            {packageName ?? "—"}
          </dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="text-[#8c8c8c]">{t("admin.requests.source")}</dt>
          <dd className="font-semibold text-[var(--gym-ink,#111111)]">
            {t(`admin.requests.sources.${row.source}`)}
          </dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="text-[#8c8c8c]">{t("admin.subscribers.language")}</dt>
          <dd className="font-semibold text-[var(--gym-ink,#111111)]">
            {row.locale.toUpperCase()}
          </dd>
        </div>
        {row.reviewedAt ? (
          <div className="flex justify-between gap-3">
            <dt className="text-[#8c8c8c]">
              {locale === "ar" ? "تاريخ المراجعة" : "Reviewed on"}
            </dt>
            <dd className="font-semibold text-[var(--gym-ink,#111111)]">
              {formatDate(row.reviewedAt, locale)}
            </dd>
          </div>
        ) : null}
        {row.reviewedBy ? (
          <div className="flex justify-between gap-3">
            <dt className="text-[#8c8c8c]">
              {locale === "ar" ? "تمت المراجعة بواسطة" : "Reviewed by"}
            </dt>
            <dd className="font-semibold text-[var(--gym-ink,#111111)]">
              {row.reviewedBy}
            </dd>
          </div>
        ) : null}
        {row.subscriberId ? (
          <div className="pt-1">
            <Link
              to={APP_ROUTES.admin.subscriberDetail(row.subscriberId)}
              className="inline-flex text-[12px] font-bold text-[var(--gym-lime,#fb5001)] hover:underline"
            >
              {locale === "ar"
                ? "فتح ملف المشترك ←"
                : "Open subscriber profile →"}
            </Link>
          </div>
        ) : null}
      </dl>
    </div>
  )
}
