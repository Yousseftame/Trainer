import type { ReactNode } from "react"
import { Link, useNavigate, useParams } from "react-router-dom"
import { useTranslation } from "react-i18next"
import {
  Activity,
  ArrowLeft,
  CalendarDays,
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
import { DataTable } from "@/components/dashboard/DataTable"
import { StatCard } from "@/components/dashboard/StatCard"
import {
  StatusBadge,
  accountStatusTone,
  subscriptionStatusTone,
} from "@/components/dashboard/StatusBadge"
import { APP_ROUTES } from "@/config/constants"
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
import { getSubscriberById } from "@/features/subscribers/demo"
import { getPackageById, subscriptionsFor } from "@/features/subscriptions/demo"
import { trainingDayCount, type DemoWorkoutProgram } from "@/features/workouts/demo"
import { useDocumentTitle } from "@/hooks/useDocumentTitle"
import { useLocale } from "@/hooks/useLocale"
import { formatBmi, formatDate, formatKg, initials } from "@/lib/format"
import { appToast } from "@/lib/toast"
import { cn } from "@/lib/utils"
import type { AppLocale } from "@/i18n/rtl"
import type { BodyMeasurement } from "@/types/progress"

export function SubscriberDetailPage() {
  const { t } = useTranslation()
  const { locale, isRtl } = useLocale()
  const navigate = useNavigate()
  const { subscriberId = "" } = useParams()
  const subscriber = getSubscriberById(subscriberId)
  useDocumentTitle(subscriber?.displayName ?? t("nav.subscribers"))

  if (!subscriber) {
    return (
      <section className="rounded-[24px] bg-white p-8">
        <p className="font-heading text-[20px] font-extrabold text-[var(--gym-ink,#063434)]">
          {t("admin.subscribers.notFound")}
        </p>
        <Link
          to={APP_ROUTES.admin.subscribers}
          className="mt-4 inline-flex text-[14px] font-bold text-[var(--gym-ink,#063434)]"
        >
          {t("admin.common.back")}
        </Link>
      </section>
    )
  }

  const history = subscriptionsFor(subscriber.id)
  const current = history.find((item) => item.status === "active" || item.status === "suspended")
  const currentPackage = getPackageById(current?.packageId)
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
        className="inline-flex w-fit items-center gap-2 text-[14px] font-bold text-[var(--gym-ink,#063434)]"
      >
        <ArrowLeft className={cn("size-4", isRtl && "rotate-180")} strokeWidth={2} />
        {t("admin.common.back")}
      </button>

      <section className="rounded-[24px] bg-white p-5 sm:p-7">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-4">
            <span className="inline-flex size-14 shrink-0 items-center justify-center rounded-2xl bg-[var(--gym-ink,#063434)] font-heading text-[18px] font-bold text-[var(--gym-lime,#b8fe22)]">
              {initials(subscriber.displayName)}
            </span>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="font-heading text-[22px] font-extrabold tracking-tight text-[var(--gym-ink,#063434)]">
                  {subscriber.displayName}
                </h2>
                <StatusBadge
                  label={t(`admin.status.${subscriber.status}`)}
                  tone={accountStatusTone(subscriber.status)}
                />
                {currentPackage ? <StatusBadge label={currentPackage.name[locale]} tone="info" /> : null}
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
            <Link
              to={`${APP_ROUTES.admin.progress}?subscriber=${subscriber.id}`}
              className="inline-flex h-11 items-center rounded-full bg-[var(--gym-lime,#b8fe22)] px-5 text-[13px] font-bold text-[var(--gym-ink,#063434)]"
            >
              {t("admin.subscribers.viewProgress")}
            </Link>
            <button
              type="button"
              onClick={() => appToast.success(t("admin.common.demoOnly"))}
              className="inline-flex h-11 items-center rounded-full bg-[var(--gym-ink,#063434)] px-5 text-[13px] font-bold text-white"
            >
              {t("admin.subscribers.assignPackage")}
            </button>
            <button
              type="button"
              onClick={() => appToast.success(t("admin.common.demoOnly"))}
              className="inline-flex h-11 items-center rounded-full bg-[#F4F4F4] px-5 text-[13px] font-bold text-[var(--gym-ink,#063434)]"
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
          <h3 className="font-heading text-[16px] font-extrabold text-[var(--gym-ink,#063434)]">
            {t("admin.subscribers.profile")}
          </h3>
          <dl className="mt-5 space-y-4 text-[14px]">
            <DetailRow icon={<Mail className="size-4" />} label={t("admin.subscribers.columns.email")} value={subscriber.email} />
            <DetailRow icon={<Phone className="size-4" />} label={t("admin.subscribers.columns.phone")} value={subscriber.phone} />
            <DetailRow
              icon={<Languages className="size-4" />}
              label={t("admin.subscribers.language")}
              value={subscriber.locale.toUpperCase()}
            />
            <DetailRow
              icon={<Ruler className="size-4" />}
              label={t("admin.subscribers.height")}
              value={subscriber.heightCm ? t("admin.subscribers.heightValue", { value: subscriber.heightCm }) : "—"}
            />
            <DetailRow
              icon={<UserRound className="size-4" />}
              label={t("admin.subscribers.sex")}
              value={subscriber.sex ? t(`admin.subscribers.sexValue.${subscriber.sex}`) : "—"}
            />
            <DetailRow label={t("admin.subscribers.bmi")} value={bmi ?? "—"} />
            <DetailRow
              icon={<Target className="size-4" />}
              label={t("admin.subscribers.goal")}
              value={subscriber.goal?.[locale] ?? "—"}
              stacked
            />
          </dl>
        </section>

        <section className="rounded-[24px] bg-white p-5 sm:p-7">
          <h3 className="font-heading text-[16px] font-extrabold text-[var(--gym-ink,#063434)]">
            {t("admin.subscribers.currentSubscription")}
          </h3>
          {current ? (
            <dl className="mt-5 space-y-4 text-[14px]">
              <DetailRow label={t("admin.subscribers.columns.package")} value={currentPackage?.name[locale] ?? "—"} />
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
              <DetailRow
                label={t("admin.subscribers.notes")}
                value={current.notes ?? "—"}
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
          <h3 className="inline-flex items-center gap-2 font-heading text-[16px] font-extrabold text-[var(--gym-ink,#063434)]">
            <StickyNote className="size-4" strokeWidth={1.8} />
            {t("admin.subscribers.coachNotes")}
          </h3>
          <p className="mt-3 text-[14px] font-medium leading-relaxed text-[var(--gym-ink,#063434)]">
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
          <h3 className="font-heading text-[16px] font-extrabold text-[var(--gym-ink,#063434)]">
            {t("admin.subscribers.progressSnapshot")}
          </h3>
          <Link
            to={`${APP_ROUTES.admin.progress}?subscriber=${subscriber.id}`}
            className="text-[13px] font-bold text-[var(--gym-ink,#063434)]"
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
                    <figure key={photo.id} className="h-fit overflow-hidden rounded-[16px] bg-[var(--gym-ink,#063434)]">
                      <div className="relative flex aspect-[3/4] items-center justify-center">
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(184,254,34,0.22),transparent_45%)]" />
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
          <h3 className="font-heading text-[16px] font-extrabold text-[var(--gym-ink,#063434)]">
            {t("admin.progress.workoutHistory")}
          </h3>
          <ProgramHistory items={programs.workouts} locale={locale} empty={t("admin.progress.noProgram")} />
        </section>
        <section className="rounded-[24px] bg-white p-5 sm:p-7">
          <h3 className="font-heading text-[16px] font-extrabold text-[var(--gym-ink,#063434)]">
            {t("admin.progress.nutritionHistory")}
          </h3>
          <ProgramHistory items={programs.nutrition} locale={locale} empty={t("admin.progress.noProgram")} />
        </section>
      </div>

      <DataTable
        rows={history}
        rowKey={(row) => row.id}
        empty={t("admin.subscriptions.empty")}
        toolbar={
          <h3 className="font-heading text-[16px] font-extrabold text-[var(--gym-ink,#063434)]">
            {t("admin.subscribers.history")}
          </h3>
        }
        columns={[
          {
            id: "package",
            header: t("admin.subscribers.columns.package"),
            cell: (row) => getPackageById(row.packageId)?.name[locale] ?? "—",
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
            cell: (row) => row.notes ?? "—",
            className: "text-[#6B7280]",
          },
        ]}
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
        <h3 className="font-heading text-[16px] font-extrabold text-[var(--gym-ink,#063434)]">{title}</h3>
        <Link to={href} className="text-[12px] font-bold text-[var(--gym-ink,#063434)]">
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
      <p className="text-[15px] font-bold text-[var(--gym-ink,#063434)]">{program.title[locale]}</p>
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
      <p className="text-[15px] font-bold text-[var(--gym-ink,#063434)]">{program.title[locale]}</p>
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
            <span className="block truncate text-[13px] font-bold text-[var(--gym-ink,#063434)]">
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
      <p className="mt-1 font-heading text-[16px] font-extrabold text-[var(--gym-ink,#063434)]">
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
        <dd className="font-semibold leading-relaxed text-[var(--gym-ink,#063434)]">{value}</dd>
      </div>
    )
  }
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="inline-flex items-center gap-2 text-[#8c8c8c]">
        {icon}
        {label}
      </dt>
      <dd className="text-end font-semibold text-[var(--gym-ink,#063434)]">{value}</dd>
    </div>
  )
}
