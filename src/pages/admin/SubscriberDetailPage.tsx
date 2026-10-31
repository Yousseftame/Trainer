import { useMemo, useState, type ReactNode } from "react"
import { Link, useNavigate, useParams } from "react-router-dom"
import { useTranslation } from "react-i18next"
import {
  Activity,
  ArrowLeft,
  CalendarDays,
  Check,
  Dumbbell,
  Languages,
  Mail,
  Phone,
  Ruler,
  Scale,
  StickyNote,
  Target,
  UserRound,
} from "lucide-react"
import { DataTable, TableAction } from "@/components/dashboard/DataTable"
import { StatCard } from "@/components/dashboard/StatCard"
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
import { mealCount, type DemoNutritionProgram } from "@/features/nutrition/demo"
import {
  DEMO_TODAY,
  adherenceScore,
  daysSinceCheckIn,
  firstMeasurement,
  getRosterPerson,
  latestMeasurement,
  latestWeek,
  photosFor,
  previousMeasurement,
  programsFor,
  weightDelta,
} from "@/features/progress/demo"
import {
  getSubscriberById,
  subscriberDisplayName,
} from "@/features/subscribers/demo"
import {
  useSaveSubscriberMutation,
  useSubscribersQuery,
  useUpdateSubscriberStatusMutation,
} from "@/features/subscribers/hooks"
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
import { trainingDayCount, type DemoWorkoutProgram } from "@/features/workouts/demo"
import { useDocumentTitle } from "@/hooks/useDocumentTitle"
import { useLocale } from "@/hooks/useLocale"
import { formatBmi, formatDate, formatKg, initials } from "@/lib/format"
import { appToast } from "@/lib/toast"
import { cn } from "@/lib/utils"
import type { AppLocale } from "@/i18n/rtl"
import type { BodyMeasurement } from "@/types/progress"
import type { PackageEntitlementKey } from "@/types/subscription"

const ENTITLEMENT_LABELS: Record<
  PackageEntitlementKey,
  { ar: string; en: string }
> = {
  workoutProgram: { ar: "التمارين", en: "Workouts" },
  nutritionProgram: { ar: "التغذية", en: "Nutrition" },
  exerciseVideos: { ar: "الفيديوهات", en: "Videos" },
  pdfDocuments: { ar: "ملفات PDF", en: "PDFs" },
  progressTracking: { ar: "التقدم", en: "Progress" },
}

export function SubscriberDetailPage() {
  const { t } = useTranslation()
  const { locale, isRtl } = useLocale()
  const { user } = useAuth()
  const navigate = useNavigate()
  const { subscriberId = "" } = useParams()
  const { data: allSubscribers = [] } = useSubscribersQuery()
  const subscriber =
    allSubscribers.find((item) => item.id === subscriberId) ??
    getSubscriberById(subscriberId)
  useDocumentTitle(subscriber?.displayName ?? t("nav.subscribers"))

  const { data: allPackages = [] } = usePackagesQuery()
  const { data: allSubscriptions = [] } = useSubscriptionsQuery()
  const saveSubscriberMutation = useSaveSubscriberMutation()
  const updateStatusMutation = useUpdateSubscriberStatusMutation()
  const assignMutation = useAssignSubscriptionMutation()
  const lifecycleMutation = useUpdateSubscriptionLifecycleMutation()
  const [editProfileOpen, setEditProfileOpen] = useState(false)
  const [subDialogState, setSubDialogState] =
    useState<SubscriptionDialogState | null>(null)

  const packageMap = useMemo(
    () => new Map(allPackages.map((p) => [p.id, p])),
    [allPackages],
  )

  const history = useMemo(
    () =>
      allSubscriptions
        .filter((item) => item.subscriberId === subscriberId)
        .sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        ),
    [allSubscriptions, subscriberId],
  )

  if (!subscriber) {
    return (
      <section className="rounded-[24px] bg-white p-8">
        <p className="font-heading text-[20px] font-extrabold text-[var(--gym-ink,#111111)]">
          {t("admin.subscribers.notFound")}
        </p>
        <Link
          to={APP_ROUTES.admin.subscribers}
          className="mt-4 inline-flex text-[14px] font-bold text-[var(--gym-ink,#111111)]"
        >
          {t("admin.common.back")}
        </Link>
      </section>
    )
  }

  const current =
    history.find(
      (item) => item.status === "active" || item.status === "suspended",
    ) ?? history[0]
  const currentPackage = current ? packageMap.get(current.packageId) : undefined
  const currentEntitlements = current
    ? normalizeEntitlements(
        currentPackage?.entitlements ?? current.entitlementsSnapshot,
      )
    : null
  const programs = programsFor(subscriber.id)
  const activeWorkout = programs.workouts.find((item) => item.status === "active")
  const activeNutrition = programs.nutrition.find((item) => item.status === "active")
  const latest = latestMeasurement(subscriber.id)
  const first = firstMeasurement(subscriber.id)
  const previous = previousMeasurement(subscriber.id)
  const photos = photosFor(subscriber.id)
  const latestPhotos = photos.filter((item) => item.takenAt === photos[photos.length - 1]?.takenAt)
  const week = latestWeek(subscriber.id)
  const roster = getRosterPerson(subscriber.id)
  const remaining = remainingDays(current?.endsAt)
  const days = daysSinceCheckIn(subscriber.id)
  const delta = weightDelta(subscriber.id)
  const bmi = formatBmi(latest?.weightKg, subscriber.heightCm)
  const adherence = adherenceScore(subscriber.id)

  return (
    <div className="flex flex-col gap-4 sm:gap-5">
      <button
        type="button"
        onClick={() => navigate(APP_ROUTES.admin.subscribers)}
        className="inline-flex w-fit items-center gap-2 text-[14px] font-bold text-[var(--gym-ink,#111111)]"
      >
        <ArrowLeft className={cn("size-4", isRtl && "rotate-180")} strokeWidth={2} />
        {t("admin.common.back")}
      </button>

      <section className="rounded-[24px] bg-white p-5 sm:p-7">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-4">
            <span className="inline-flex size-14 shrink-0 items-center justify-center rounded-2xl bg-[var(--gym-ink,#111111)] font-heading text-[18px] font-bold text-[var(--gym-lime,#fb5001)]">
              {initials(subscriberDisplayName(subscriber, locale))}
            </span>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="font-heading text-[22px] font-extrabold tracking-tight text-[var(--gym-ink,#111111)]">
                  {subscriberDisplayName(subscriber, locale)}
                </h2>
                <StatusBadge
                  label={t(`admin.status.${subscriber.status}`)}
                  tone={accountStatusTone(subscriber.status)}
                />
                {currentPackage ? (
                  <StatusBadge label={currentPackage.name[locale]} tone="info" />
                ) : null}
                {roster ? (
                  <StatusBadge
                    label={t(`admin.progress.filter.${roster.bucket}`)}
                    tone={roster.tone}
                  />
                ) : null}
              </div>
              <p className="mt-1 text-[13px] font-medium text-[#8c8c8c]">
                {t("admin.subscribers.joined", { date: formatDate(subscriber.createdAt, locale) })}
                {subscriber.goal ? ` · ${subscriber.goal[locale]}` : ""}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setEditProfileOpen(true)}
              className="inline-flex h-11 items-center rounded-full bg-[#F4F4F4] px-5 text-[13px] font-bold text-[var(--gym-ink,#111111)] transition hover:bg-black/10"
            >
              {locale === "ar" ? "تعديل البيانات" : "Edit profile"}
            </button>
            <button
              type="button"
              disabled={updateStatusMutation.isPending}
              onClick={async () => {
                const nextStatus =
                  subscriber.status === "active" ? "suspended" : "active"
                await updateStatusMutation.mutateAsync({
                  subscriberId: subscriber.id,
                  status: nextStatus,
                  syncSubscription: true,
                  adminName: user?.displayName || user?.email || "Head Coach",
                })
                appToast.success(
                  nextStatus === "active"
                    ? locale === "ar"
                      ? "تم إعادة تفعيل حساب المشترك"
                      : "Subscriber account reactivated"
                    : locale === "ar"
                      ? "تم تعليق حساب المشترك"
                      : "Subscriber account suspended",
                )
              }}
              className={cn(
                "inline-flex h-11 items-center rounded-full px-5 text-[13px] font-bold transition",
                subscriber.status === "active"
                  ? "bg-[#FFE8E4] text-[#C44536] hover:bg-[#ffd6cf]"
                  : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100",
              )}
            >
              {subscriber.status === "active"
                ? locale === "ar"
                  ? "تعليق الحساب"
                  : "Suspend account"
                : locale === "ar"
                  ? "تفعيل الحساب"
                  : "Activate account"}
            </button>
            <Link
              to={`${APP_ROUTES.admin.progress}?subscriber=${subscriber.id}`}
              className="inline-flex h-11 items-center rounded-full bg-[var(--gym-lime,#fb5001)] px-5 text-[13px] font-bold text-white"
            >
              {t("admin.subscribers.viewProgress")}
            </Link>
            <button
              type="button"
              onClick={() =>
                setSubDialogState({
                  mode: "assign",
                  defaultSubscriberId: subscriber.id,
                  defaultPackageId: current?.packageId,
                })
              }
              className="inline-flex h-11 items-center rounded-full bg-[var(--gym-ink,#111111)] px-5 text-[13px] font-bold text-white"
            >
              {t("admin.subscribers.assignPackage")}
            </button>
            <button
              type="button"
              onClick={() => {
                if (current) {
                  setSubDialogState({
                    mode: "manage",
                    subscription: current,
                    initialAction:
                      current.status === "active" ? "renew" : "activate",
                  })
                } else {
                  setSubDialogState({
                    mode: "assign",
                    defaultSubscriberId: subscriber.id,
                  })
                }
              }}
              className="inline-flex h-11 items-center rounded-full bg-[#F4F4F4] px-5 text-[13px] font-bold text-[var(--gym-ink,#111111)]"
            >
              {t("admin.subscribers.updateStatus")}
            </button>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-2 gap-2 sm:gap-3 lg:grid-cols-4 lg:gap-4">
        <StatCard
          label={t("admin.subscribers.weightNow")}
          value={latest?.weightKg != null ? formatKg(latest.weightKg, locale) : "—"}
          hint={delta != null ? `${signed(delta)} kg · ${t("admin.progress.sinceStart")}` : t("admin.progress.noLogs")}
          icon={<Scale className="size-4" strokeWidth={1.8} />}
        />
        <StatCard
          label={t("admin.subscribers.lastCheckIn")}
          value={latest ? formatDate(latest.recordedAt, locale) : "—"}
          hint={
            days != null
              ? t("admin.progress.lastCheckIn", { date: formatDate(latest?.recordedAt, locale), days })
              : t("admin.progress.noLogs")
          }
          icon={<Activity className="size-4" strokeWidth={1.8} />}
        />
        <StatCard
          label={t("admin.subscribers.adherence")}
          value={adherence != null ? `${adherence}%` : "—"}
          hint={
            week
              ? `${week.workoutDone}/${week.workoutTotal || 0} · ${week.nutritionDone}/${week.nutritionTotal || 0}`
              : t("admin.progress.noProgram")
          }
          icon={<Dumbbell className="size-4" strokeWidth={1.8} />}
        />
        <StatCard
          label={t("admin.subscribers.remaining")}
          value={remainingLabel(remaining, t)}
          hint={current?.endsAt ? formatDate(current.endsAt, locale) : t("admin.subscribers.noSubscription")}
          icon={<CalendarDays className="size-4" strokeWidth={1.8} />}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-[24px] bg-white p-5 sm:p-7">
          <div className="flex items-center justify-between gap-2">
            <h3 className="font-heading text-[16px] font-extrabold text-[var(--gym-ink,#111111)]">
              {t("admin.subscribers.profile")}
            </h3>
            <button
              type="button"
              onClick={() => setEditProfileOpen(true)}
              className="text-[12px] font-bold text-[var(--gym-lime,#fb5001)] hover:underline"
            >
              {locale === "ar" ? "تعديل الملف" : "Edit"}
            </button>
          </div>
          <dl className="mt-5 space-y-4 text-[14px]">
            <DetailRow icon={<Mail className="size-4" />} label={t("admin.subscribers.columns.email")} value={subscriber.email} />
            <DetailRow icon={<Phone className="size-4" />} label={t("admin.subscribers.columns.phone")} value={subscriber.phone} />
            <DetailRow
              icon={<Languages className="size-4" />}
              label={t("admin.subscribers.language")}
              value={subscriber.locale.toUpperCase()}
            />
            <DetailRow
              icon={<UserRound className="size-4" />}
              label={t("admin.subscribers.sex")}
              value={subscriber.sex ? t(`admin.subscribers.sexValue.${subscriber.sex}`) : "—"}
            />
            {subscriber.age ? (
              <DetailRow
                label={locale === "ar" ? "العمر" : "Age"}
                value={`${subscriber.age}`}
              />
            ) : null}
            <DetailRow
              icon={<Ruler className="size-4" />}
              label={t("admin.subscribers.height")}
              value={subscriber.heightCm ? t("admin.subscribers.heightValue", { value: subscriber.heightCm }) : "—"}
            />
            {subscriber.startingWeightKg != null || subscriber.targetWeightKg != null ? (
              <DetailRow
                label={locale === "ar" ? "وزن البداية / المستهدف" : "Start / Target weight"}
                value={`${subscriber.startingWeightKg != null ? formatKg(subscriber.startingWeightKg, locale) : "—"} → ${subscriber.targetWeightKg != null ? formatKg(subscriber.targetWeightKg, locale) : "—"}`}
              />
            ) : null}
            <DetailRow label={t("admin.subscribers.bmi")} value={bmi ?? "—"} />
            <DetailRow
              icon={<Target className="size-4" />}
              label={t("admin.subscribers.goal")}
              value={subscriber.goal?.[locale] ?? "—"}
              stacked
            />
            {subscriber.healthNotes ? (
              <DetailRow
                label={locale === "ar" ? "ملاحظات صحية / إصابات" : "Health & injury notes"}
                value={subscriber.healthNotes[locale]}
                stacked
              />
            ) : null}
          </dl>
        </section>

        <section className="rounded-[24px] bg-white p-5 sm:p-7">
          <div className="flex items-center justify-between gap-2">
            <h3 className="font-heading text-[16px] font-extrabold text-[var(--gym-ink,#111111)]">
              {t("admin.subscribers.currentSubscription")}
            </h3>
            {current ? (
              <button
                type="button"
                onClick={() =>
                  setSubDialogState({
                    mode: "manage",
                    subscription: current,
                    initialAction:
                      current.status === "active" ? "renew" : "activate",
                  })
                }
                className="text-[12px] font-bold text-[var(--gym-lime,#fb5001)] hover:underline"
              >
                {current.status === "active"
                  ? t("admin.subscriptions.renew")
                  : t("admin.subscriptions.activate")}
              </button>
            ) : null}
          </div>
          {current ? (
            <dl className="mt-5 space-y-4 text-[14px]">
              <DetailRow
                label={t("admin.subscribers.columns.package")}
                value={
                  currentPackage?.name[locale] ??
                  current.packageName?.[locale] ??
                  "—"
                }
              />
              <div className="flex items-center justify-between gap-3">
                <dt className="text-[#8c8c8c]">{t("admin.subscribers.columns.subscription")}</dt>
                <StatusBadge
                  label={t(`admin.status.${current.status}`)}
                  tone={subscriptionStatusTone(current.status)}
                />
              </div>
              <DetailRow label={t("admin.subscriptions.columns.starts")} value={formatDate(current.startsAt, locale)} />
              <DetailRow label={t("admin.subscriptions.columns.ends")} value={formatDate(current.endsAt, locale)} />
              <DetailRow label={t("admin.subscribers.remaining")} value={remainingLabel(remaining, t)} />
              <DetailRow
                label={t("admin.subscriptions.columns.activatedBy")}
                value={current.activatedBy ?? "—"}
              />
              {currentEntitlements ? (
                <div className="flex flex-col gap-1.5 pt-1">
                  <dt className="text-[#8c8c8c]">
                    {locale === "ar" ? "صلاحيات المحتوى" : "Content access"}
                  </dt>
                  <dd className="flex flex-wrap gap-1.5">
                    {ENTITLEMENT_KEYS.map((key) => {
                      const allowed =
                        current.status === "active" && currentEntitlements[key]
                      return (
                        <span
                          key={key}
                          className={cn(
                            "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold",
                            allowed
                              ? "bg-emerald-50 text-emerald-700"
                              : "bg-black/5 text-[#8c8c8c] line-through",
                          )}
                        >
                          {allowed ? <Check className="size-3" strokeWidth={2.5} /> : null}
                          {ENTITLEMENT_LABELS[key][locale]}
                        </span>
                      )
                    })}
                  </dd>
                </div>
              ) : null}
              <DetailRow
                label={t("admin.subscribers.notes")}
                value={current.notesLocalized?.[locale] ?? current.notes ?? "—"}
                stacked
              />
            </dl>
          ) : (
            <p className="mt-5 text-[14px] font-medium text-[#8c8c8c]">{t("admin.subscribers.noSubscription")}</p>
          )}
        </section>
      </div>

      {subscriber.coachNotes ? (
        <section className="rounded-[24px] bg-white p-5 sm:p-7">
          <h3 className="inline-flex items-center gap-2 font-heading text-[16px] font-extrabold text-[var(--gym-ink,#111111)]">
            <StickyNote className="size-4" strokeWidth={1.8} />
            {t("admin.subscribers.coachNotes")}
          </h3>
          <p className="mt-3 text-[14px] font-medium leading-relaxed text-[var(--gym-ink,#111111)]">
            {subscriber.coachNotes[locale]}
          </p>
        </section>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-2">
        <ProgramCard
          title={t("admin.subscribers.currentWorkout")}
          empty={t("admin.progress.noProgram")}
          href={APP_ROUTES.admin.workouts}
        >
          {activeWorkout ? <WorkoutSummary program={activeWorkout} locale={locale} /> : null}
        </ProgramCard>
        <ProgramCard
          title={t("admin.subscribers.currentNutrition")}
          empty={t("admin.progress.noProgram")}
          href={APP_ROUTES.admin.nutrition}
        >
          {activeNutrition ? <NutritionSummary program={activeNutrition} locale={locale} /> : null}
        </ProgramCard>
      </div>

      <section className="rounded-[24px] bg-white p-5 sm:p-7">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="font-heading text-[16px] font-extrabold text-[var(--gym-ink,#111111)]">
            {t("admin.subscribers.progressSnapshot")}
          </h3>
          <Link
            to={`${APP_ROUTES.admin.progress}?subscriber=${subscriber.id}`}
            className="text-[13px] font-bold text-[var(--gym-ink,#111111)]"
          >
            {t("admin.subscribers.viewProgress")}
          </Link>
        </div>

        {latest ? (
          <div className="mt-5 flex flex-col gap-4">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#8c8c8c]">
                {t("admin.progress.sinceStart")}
              </p>
              <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
                {metricSet(first, latest).map((item) => (
                  <DeltaChip
                    key={item.key}
                    label={t(`admin.progress.metrics.${item.key}`)}
                    first={item.first}
                    latest={item.latest}
                    unit={item.unit}
                  />
                ))}
              </div>
            </div>
            {previous ? (
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#8c8c8c]">
                  {t("admin.progress.vsPrevious")}
                </p>
                <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
                  {metricSet(previous, latest).map((item) => (
                    <DeltaChip
                      key={item.key}
                      label={t(`admin.progress.metrics.${item.key}`)}
                      first={item.first}
                      latest={item.latest}
                      unit={item.unit}
                    />
                  ))}
                </div>
              </div>
            ) : null}
            {latest.notes ? (
              <p className="text-[13px] font-medium text-[#6B7280]">
                {formatDate(latest.recordedAt, locale)} · {latest.notes}
              </p>
            ) : null}
            {latestPhotos.length ? (
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#8c8c8c]">
                  {t("admin.progress.latestPhotos")} · {photos.length}
                </p>
                <div className="mt-3 grid grid-cols-2 gap-2 sm:max-w-xl sm:grid-cols-3">
                  {latestPhotos.map((photo) => (
                    <figure key={photo.id} className="h-fit overflow-hidden rounded-[16px] bg-[var(--gym-ink,#111111)]">
                      <div className="relative flex aspect-[3/4] items-center justify-center">
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(251,80,1,0.22),transparent_45%)]" />
                        <span className="relative font-heading text-[22px] font-extrabold text-white/80">
                          {photo.pose ? t(`admin.progress.pose.${photo.pose}`) : "•"}
                        </span>
                      </div>
                      <figcaption className="px-2.5 py-2 text-[11px] font-bold text-white/80">
                        <span className="block">{formatDate(photo.takenAt, locale)}</span>
                        {photo.caption ? (
                          <span className="mt-0.5 block font-medium text-white/55">{photo.caption}</span>
                        ) : null}
                      </figcaption>
                    </figure>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        ) : (
          <p className="mt-5 text-[14px] font-medium text-[#8c8c8c]">{t("admin.progress.emptyPerson")}</p>
        )}
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-[24px] bg-white p-5 sm:p-7">
          <h3 className="font-heading text-[16px] font-extrabold text-[var(--gym-ink,#111111)]">
            {t("admin.progress.workoutHistory")}
          </h3>
          <ProgramHistory items={programs.workouts} locale={locale} empty={t("admin.progress.noProgram")} />
        </section>
        <section className="rounded-[24px] bg-white p-5 sm:p-7">
          <h3 className="font-heading text-[16px] font-extrabold text-[var(--gym-ink,#111111)]">
            {t("admin.progress.nutritionHistory")}
          </h3>
          <ProgramHistory items={programs.nutrition} locale={locale} empty={t("admin.progress.noProgram")} />
        </section>
      </div>

      <DataTable
        rows={history}
        rowKey={(row) => row.id}
        empty={t("admin.subscriptions.empty")}
        actionsHeader={t("admin.common.actions")}
        toolbar={
          <div className="flex items-center justify-between gap-3">
            <h3 className="font-heading text-[16px] font-extrabold text-[var(--gym-ink,#111111)]">
              {t("admin.subscribers.history")} ({history.length})
            </h3>
            <button
              type="button"
              onClick={() =>
                setSubDialogState({
                  mode: "assign",
                  defaultSubscriberId: subscriber.id,
                  defaultPackageId: current?.packageId,
                })
              }
              className="inline-flex h-9 items-center rounded-full bg-[var(--gym-ink,#111111)] px-4 text-[12px] font-bold text-white"
            >
              {t("admin.subscribers.assignPackage")}
            </button>
          </div>
        }
        columns={[
          {
            id: "package",
            header: t("admin.subscribers.columns.package"),
            cell: (row) =>
              packageMap.get(row.packageId)?.name[locale] ??
              row.packageName?.[locale] ??
              "—",
          },
          {
            id: "status",
            header: t("admin.subscribers.columns.subscription"),
            cell: (row) => (
              <StatusBadge label={t(`admin.status.${row.status}`)} tone={subscriptionStatusTone(row.status)} />
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
          {
            id: "by",
            header: t("admin.subscriptions.columns.activatedBy"),
            cell: (row) => row.activatedBy ?? "—",
            className: "text-[#6B7280]",
          },
          {
            id: "notes",
            header: t("admin.subscribers.notes"),
            cell: (row) => row.notesLocalized?.[locale] ?? row.notes ?? "—",
            className: "text-[#6B7280]",
          },
        ]}
        actions={(row) => (
          <>
            <TableAction
              label={
                row.status === "active"
                  ? t("admin.subscriptions.renew")
                  : t("admin.subscriptions.activate")
              }
              tone="primary"
              onClick={() =>
                setSubDialogState({
                  mode: "manage",
                  subscription: row,
                  initialAction: row.status === "active" ? "renew" : "activate",
                })
              }
            />
            <TableAction
              label={locale === "ar" ? "تعديل" : "Edit"}
              onClick={() =>
                setSubDialogState({
                  mode: "manage",
                  subscription: row,
                  initialAction: "edit",
                })
              }
            />
          </>
        )}
      />

      <SubscriberFormDialog
        open={editProfileOpen}
        subscriber={subscriber}
        packages={allPackages}
        busy={saveSubscriberMutation.isPending}
        adminName={user?.displayName || user?.email || "Head Coach"}
        onClose={() => setEditProfileOpen(false)}
        onSave={async (payload) => {
          await saveSubscriberMutation.mutateAsync(payload)
          setEditProfileOpen(false)
          appToast.success(
            locale === "ar"
              ? "تم تحديث بيانات المشترك بنجاح"
              : "Subscriber profile updated successfully",
          )
        }}
      />

      <SubscriptionActionDialog
        state={subDialogState}
        packages={allPackages}
        busy={assignMutation.isPending || lifecycleMutation.isPending}
        adminName={user?.displayName || user?.email || "Head Coach"}
        onClose={() => setSubDialogState(null)}
        onAssign={async (payload) => {
          await assignMutation.mutateAsync(payload)
          setSubDialogState(null)
          appToast.success(
            locale === "ar"
              ? "تم تعيين الاشتراك للمشترك بنجاح"
              : "Subscription assigned successfully",
          )
        }}
        onLifecycle={async (payload) => {
          await lifecycleMutation.mutateAsync(payload)
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

function remainingDays(endsAt: string | null | undefined) {
  if (!endsAt) return null
  return Math.ceil((new Date(endsAt).getTime() - DEMO_TODAY.getTime()) / 86_400_000)
}

function remainingLabel(days: number | null, t: (key: string, options?: Record<string, unknown>) => string) {
  if (days == null) return "—"
  if (days < 0) return t("admin.subscribers.endedAgo", { count: Math.abs(days) })
  if (days === 0) return t("admin.subscribers.endsToday")
  return t("admin.subscribers.daysLeft", { count: days })
}

function signed(value: number, digits = 1) {
  const abs = Math.abs(value).toFixed(digits).replace(/\.0$/, "")
  if (value > 0) return `+${abs}`
  if (value < 0) return `−${abs}`
  return abs
}

function metricSet(row: BodyMeasurement | undefined, latest: BodyMeasurement) {
  return [
    { key: "weight", first: row?.weightKg, latest: latest.weightKg, unit: "kg" },
    { key: "waist", first: row?.waistCm, latest: latest.waistCm, unit: "cm" },
    { key: "chest", first: row?.chestCm, latest: latest.chestCm, unit: "cm" },
    { key: "hips", first: row?.hipsCm, latest: latest.hipsCm, unit: "cm" },
    { key: "arms", first: row?.armsCm, latest: latest.armsCm, unit: "cm" },
    { key: "thighs", first: row?.thighsCm, latest: latest.thighsCm, unit: "cm" },
  ] as const
}

function ProgramCard({
  title,
  empty,
  href,
  children,
}: {
  title: string
  empty: string
  href: string
  children: ReactNode
}) {
  const { t } = useTranslation()
  return (
    <section className="rounded-[24px] bg-white p-5 sm:p-7">
      <div className="flex items-center justify-between gap-3">
        <h3 className="font-heading text-[16px] font-extrabold text-[var(--gym-ink,#111111)]">{title}</h3>
        <Link to={href} className="text-[12px] font-bold text-[var(--gym-ink,#111111)]">
          {t("admin.subscribers.openWorkspace")}
        </Link>
      </div>
      {children ?? <p className="mt-5 text-[14px] font-medium text-[#8c8c8c]">{empty}</p>}
    </section>
  )
}

function WorkoutSummary({ program, locale }: { program: DemoWorkoutProgram; locale: AppLocale }) {
  const { t } = useTranslation()
  return (
    <div className="mt-5">
      <p className="text-[15px] font-bold text-[var(--gym-ink,#111111)]">{program.title[locale]}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        <StatusBadge
          label={t(`admin.workouts.scope.${program.status}`)}
          tone={program.status === "active" ? "success" : "muted"}
        />
        <StatusBadge label={t(`admin.workouts.format.${program.format}`)} tone="info" />
        <StatusBadge label={t("admin.workouts.version", { version: program.version })} tone="muted" />
      </div>
      <dl className="mt-4 space-y-3 text-[14px]">
        <DetailRow
          label={t("admin.subscribers.trainingDays")}
          value={String(trainingDayCount(program))}
        />
        {program.completion ? (
          <DetailRow
            label={t("admin.workouts.thisWeek")}
            value={`${program.completion.done}/${program.completion.total}`}
          />
        ) : null}
        <DetailRow label={t("admin.subscribers.updated")} value={formatDate(program.updatedAt, locale)} />
        {program.pdfName ? <DetailRow label={t("admin.subscribers.file")} value={program.pdfName[locale]} stacked /> : null}
      </dl>
    </div>
  )
}

function NutritionSummary({ program, locale }: { program: DemoNutritionProgram; locale: AppLocale }) {
  const { t } = useTranslation()
  return (
    <div className="mt-5">
      <p className="text-[15px] font-bold text-[var(--gym-ink,#111111)]">{program.title[locale]}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        <StatusBadge
          label={t(`admin.workouts.scope.${program.status}`)}
          tone={program.status === "active" ? "success" : "muted"}
        />
        <StatusBadge label={t(`admin.workouts.format.${program.format}`)} tone="info" />
        <StatusBadge label={t("admin.workouts.version", { version: program.version })} tone="muted" />
      </div>
      <dl className="mt-4 space-y-3 text-[14px]">
        {program.targetCalories ? (
          <DetailRow label={t("admin.subscribers.calories")} value={String(program.targetCalories)} />
        ) : null}
        <DetailRow label={t("admin.subscribers.mealsWeek")} value={String(mealCount(program))} />
        {program.adherence ? (
          <DetailRow
            label={t("admin.nutrition.thisWeek")}
            value={`${program.adherence.done}/${program.adherence.total}`}
          />
        ) : null}
        <DetailRow label={t("admin.subscribers.updated")} value={formatDate(program.updatedAt, locale)} />
        {program.pdfName ? <DetailRow label={t("admin.subscribers.file")} value={program.pdfName[locale]} stacked /> : null}
      </dl>
    </div>
  )
}

function ProgramHistory({
  items,
  locale,
  empty,
}: {
  items: Array<{
    id: string
    title: { en: string; ar: string }
    status: "template" | "active" | "archived"
    updatedAt: string
    format: "interactive" | "pdf"
    version: number
    pdfName?: { en: string; ar: string }
  }>
  locale: AppLocale
  empty: string
}) {
  const { t } = useTranslation()
  if (!items.length) return <p className="mt-5 text-[14px] font-medium text-[#8c8c8c]">{empty}</p>
  const ordered = [...items].sort((a, b) => {
    if (a.status !== b.status) return a.status === "active" ? -1 : 1
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  })
  return (
    <ul className="mt-5 flex flex-col gap-2">
      {ordered.map((item) => (
        <li key={item.id} className="flex items-center justify-between gap-2 rounded-2xl bg-[#F4F4F4] px-3 py-2.5">
          <span className="min-w-0">
            <span className="block truncate text-[13px] font-bold text-[var(--gym-ink,#111111)]">
              {item.title[locale]}
            </span>
            <span className="text-[11px] font-medium text-[#8c8c8c]">
              {t(`admin.workouts.format.${item.format}`)} · {t("admin.workouts.version", { version: item.version })} ·{" "}
              {formatDate(item.updatedAt, locale)}
              {item.pdfName ? ` · ${item.pdfName[locale]}` : ""}
            </span>
          </span>
          <StatusBadge
            label={t(`admin.workouts.scope.${item.status}`)}
            tone={item.status === "active" ? "success" : "muted"}
          />
        </li>
      ))}
    </ul>
  )
}

function DeltaChip({
  label,
  first,
  latest,
  unit,
}: {
  label: string
  first?: number
  latest?: number
  unit: string
}) {
  const delta = first != null && latest != null ? Math.round((latest - first) * 10) / 10 : null
  return (
    <div className="rounded-2xl bg-[#F4F4F4] px-3 py-2.5">
      <p className="text-[11px] font-bold text-[#8c8c8c]">{label}</p>
      <p className="mt-1 font-heading text-[16px] font-extrabold text-[var(--gym-ink,#111111)]">
        {latest != null ? `${latest} ${unit}` : "—"}
      </p>
      <p className="text-[11px] font-bold text-[#6B7280]">{delta == null ? "—" : `${signed(delta)} ${unit}`}</p>
    </div>
  )
}

function DetailRow({
  label,
  value,
  icon,
  stacked,
}: {
  label: string
  value: string
  icon?: ReactNode
  stacked?: boolean
}) {
  if (stacked) {
    return (
      <div className="flex flex-col gap-1">
        <dt className="inline-flex items-center gap-2 text-[#8c8c8c]">
          {icon}
          {label}
        </dt>
        <dd className="font-semibold leading-relaxed text-[var(--gym-ink,#111111)]">{value}</dd>
      </div>
    )
  }
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="inline-flex items-center gap-2 text-[#8c8c8c]">
        {icon}
        {label}
      </dt>
      <dd className="text-end font-semibold text-[var(--gym-ink,#111111)]">{value}</dd>
    </div>
  )
}
