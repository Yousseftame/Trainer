import { useEffect, useMemo, useRef, useState, type ReactNode } from "react"
import { Link, useSearchParams } from "react-router-dom"
import { useTranslation } from "react-i18next"
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import {
  Activity,
  AlertTriangle,
  Apple,
  ArrowLeftRight,
  Camera,
  ChevronDown,
  Dumbbell,
  Plus,
  Scale,
  Search,
  ShieldCheck,
  Trash2,
} from "lucide-react"
import { AddProgressPhotoDialog } from "@/components/dashboard/AddProgressPhotoDialog"
import { ConfirmActionDialog } from "@/components/dashboard/ConfirmActionDialog"
import { LogMeasurementDialog } from "@/components/dashboard/LogMeasurementDialog"
import { LogPerformanceDialog } from "@/components/dashboard/LogPerformanceDialog"
import { PhotoComparisonDialog } from "@/components/dashboard/PhotoComparisonDialog"
import { ProgressPhotoImage } from "@/components/dashboard/ProgressPhotoImage"
import { FilterChip, StatCard } from "@/components/dashboard/StatCard"
import { StatusBadge } from "@/components/dashboard/StatusBadge"
import { APP_ROUTES } from "@/config/constants"
import { useAuth } from "@/features/auth/auth-context"
import {
  adherenceScoreFromWeeks,
  computeAdherenceWeeks,
  latestAdherenceWeek,
  type AdherenceWeek,
} from "@/features/progress/adherence"
import {
  useDeleteMeasurementMutation,
  useDeletePerformanceMutation,
  useDeletePhotoMutation,
  useMeasurementsQuery,
  usePerformanceQuery,
  usePhotosQuery,
  useSaveMeasurementMutation,
  useSavePerformanceMutation,
  useSavePhotoMutation,
} from "@/features/progress/hooks"
import { liftSeries as buildLiftSeries } from "@/features/progress/metrics"
import {
  buildProgressRoster,
  daysSinceCheckIn,
  progressStats,
  type ProgressFilter,
  type RosterPerson,
} from "@/features/progress/roster"
import {
  useNutritionLogsQuery,
  useNutritionProgramsQuery,
} from "@/features/nutrition/hooks"
import { useSubscribersQuery } from "@/features/subscribers/hooks"
import {
  usePackageByIdQuery,
  useSubscriptionsQuery,
} from "@/features/subscriptions/hooks"
import type { SubscriberSubscription } from "@/types/subscription"
import {
  useWorkoutLogsQuery,
  useWorkoutProgramsQuery,
} from "@/features/workouts/hooks"
import { appToast } from "@/lib/toast"
import type { NutritionProgram, WorkoutProgram } from "@/types/program"
import { useDocumentTitle } from "@/hooks/useDocumentTitle"
import { useLocale } from "@/hooks/useLocale"
import { formatChartDate, formatDate, formatKg, initials } from "@/lib/format"
import { cn } from "@/lib/utils"
import type { AppLocale } from "@/i18n/rtl"
import type { BodyMeasurement, PerformanceRecord, ProgressPhoto } from "@/types/progress"

type ReviewTab = "overview" | "body" | "photos" | "performance" | "history"

const FILTERS: ProgressFilter[] = ["all", "attention", "ontrack", "quiet"]
const TABS: ReviewTab[] = ["overview", "body", "photos", "performance", "history"]

const INK = "var(--gym-ink,#111111)"
const LIME = "var(--gym-lime,#fb5001)"

function signed(value: number, digits = 1) {
  const abs = Math.abs(value).toFixed(digits).replace(/\.0$/, "")
  if (value > 0) return `+${abs}`
  if (value < 0) return `−${abs}`
  return abs
}

function percent(done: number, total: number) {
  if (!total) return null
  return Math.round((done / total) * 100)
}

function weightDomain(values: number[]): [number, number] {
  const min = Math.min(...values)
  const max = Math.max(...values)
  const pad = Math.max(1, Math.ceil((max - min) * 0.2) || 1)
  const lo = Math.floor(min) - pad
  const hi = Math.ceil(max) + pad
  return [lo, hi]
}

export function ProgressPage() {
  const { t } = useTranslation()
  const { locale } = useLocale()
  const isAr = locale === "ar"
  const { hasPermission } = useAuth()
  const canWrite = hasPermission("progress:write")
  useDocumentTitle(t("nav.progress"))

  // Real-time Queries & Mutations
  const { data: subscribers = [] } = useSubscribersQuery()
  const { data: allMeasurements = [] } = useMeasurementsQuery()
  const { data: allPhotos = [] } = usePhotosQuery()
  const { data: allLifts = [] } = usePerformanceQuery()
  const { data: allWorkouts = [] } = useWorkoutProgramsQuery()
  const { data: allNutrition = [] } = useNutritionProgramsQuery()
  const { data: allWorkoutLogs = [] } = useWorkoutLogsQuery()
  const { data: allNutritionLogs = [] } = useNutritionLogsQuery()
  const { data: allSubscriptions = [] } = useSubscriptionsQuery()

  const subscriptionsBySubscriber = useMemo(() => {
    const map = new Map<string, SubscriberSubscription>()
    for (const sub of allSubscriptions) {
      const prev = map.get(sub.subscriberId)
      if (!prev) {
        map.set(sub.subscriberId, sub)
        continue
      }
      if (sub.status === "active") map.set(sub.subscriberId, sub)
      else if (
        prev.status !== "active" &&
        (sub.status === "suspended" || !prev)
      ) {
        map.set(sub.subscriberId, sub)
      }
    }
    return map
  }, [allSubscriptions])

  const saveMeasurementMutation = useSaveMeasurementMutation()
  const deleteMeasurementMutation = useDeleteMeasurementMutation()
  const savePhotoMutation = useSavePhotoMutation()
  const deletePhotoMutation = useDeletePhotoMutation()
  const savePerformanceMutation = useSavePerformanceMutation()
  const deletePerformanceMutation = useDeletePerformanceMutation()

  const [measurementModalOpen, setMeasurementModalOpen] = useState(false)
  const [photoModalOpen, setPhotoModalOpen] = useState(false)
  const [performanceModalOpen, setPerformanceModalOpen] = useState(false)
  const [compareModalOpen, setCompareModalOpen] = useState(false)

  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean
    title: string
    description?: string
    confirmLabel?: string
    tone?: "danger" | "primary" | "warning"
    onConfirm: () => Promise<void> | void
  } | null>(null)

  const [filter, setFilter] = useState<ProgressFilter>("all")
  const [query, setQuery] = useState("")
  const [tab, setTab] = useState<ReviewTab>("overview")
  const [params] = useSearchParams()

  const adherenceBySubscriber = useMemo(() => {
    const workoutLogsBySub = new Map<string, typeof allWorkoutLogs>()
    for (const log of allWorkoutLogs) {
      const list = workoutLogsBySub.get(log.subscriberId) ?? []
      list.push(log)
      workoutLogsBySub.set(log.subscriberId, list)
    }
    const nutritionLogsBySub = new Map<string, typeof allNutritionLogs>()
    for (const log of allNutritionLogs) {
      const list = nutritionLogsBySub.get(log.subscriberId) ?? []
      list.push(log)
      nutritionLogsBySub.set(log.subscriberId, list)
    }
    const workoutsBySub = new Map<string, typeof allWorkouts>()
    for (const program of allWorkouts) {
      if (!program.subscriberId) continue
      const list = workoutsBySub.get(program.subscriberId) ?? []
      list.push(program)
      workoutsBySub.set(program.subscriberId, list)
    }
    const nutritionBySub = new Map<string, typeof allNutrition>()
    for (const program of allNutrition) {
      if (!program.subscriberId) continue
      const list = nutritionBySub.get(program.subscriberId) ?? []
      list.push(program)
      nutritionBySub.set(program.subscriberId, list)
    }

    const scores: Record<string, number | null> = {}
    for (const subscriber of subscribers) {
      if (subscriber.status === "rejected") continue
      const weeks = computeAdherenceWeeks({
        workoutLogs: workoutLogsBySub.get(subscriber.id) ?? [],
        nutritionLogs: nutritionLogsBySub.get(subscriber.id) ?? [],
        workoutPrograms: workoutsBySub.get(subscriber.id) ?? [],
        nutritionPrograms: nutritionBySub.get(subscriber.id) ?? [],
        weeks: 4,
      })
      scores[subscriber.id] = adherenceScoreFromWeeks(weeks)
    }
    return scores
  }, [
    subscribers,
    allWorkoutLogs,
    allNutritionLogs,
    allWorkouts,
    allNutrition,
  ])

  const roster: RosterPerson[] = useMemo(
    () =>
      buildProgressRoster({
        subscribers,
        measurements: allMeasurements,
        photos: allPhotos,
        adherenceBySubscriber,
      }),
    [subscribers, allMeasurements, allPhotos, adherenceBySubscriber],
  )

  const requested = params.get("subscriber")
  const [selectedId, setSelectedId] = useState(
    requested && roster.some((item) => item.subscriber.id === requested)
      ? requested
      : (roster[0]?.subscriber.id ?? ""),
  )

  useEffect(() => {
    if (requested && roster.some((item) => item.subscriber.id === requested)) {
      setSelectedId(requested)
    }
  }, [requested, roster])

  const list = useMemo(() => {
    const q = query.trim().toLowerCase()
    return roster.filter((item) => {
      if (filter !== "all" && item.bucket !== filter) return false
      if (!q) return true
      return (
        item.subscriber.displayName.toLowerCase().includes(q) ||
        item.subscriber.email.toLowerCase().includes(q)
      )
    })
  }, [roster, filter, query])

  const selected = list.find((item) => item.subscriber.id === selectedId) ?? list[0]

  const stats = useMemo(
    () => progressStats(roster, allMeasurements, allPhotos),
    [roster, allMeasurements, allPhotos],
  )

  const selectedMeasurements = useMemo(() => {
    if (!selected) return []
    return allMeasurements
      .filter((m) => m.subscriberId === selected.subscriber.id)
      .sort(
        (a, b) =>
          new Date(a.recordedAt).getTime() - new Date(b.recordedAt).getTime(),
      )
  }, [allMeasurements, selected])

  const selectedPhotos = useMemo(() => {
    if (!selected) return []
    return allPhotos
      .filter((p) => p.subscriberId === selected.subscriber.id)
      .sort(
        (a, b) => new Date(a.takenAt).getTime() - new Date(b.takenAt).getTime(),
      )
  }, [allPhotos, selected])

  const selectedLifts = useMemo(() => {
    if (!selected) return []
    return allLifts
      .filter((l) => l.subscriberId === selected.subscriber.id)
      .sort(
        (a, b) =>
          new Date(a.recordedAt).getTime() - new Date(b.recordedAt).getTime(),
      )
  }, [allLifts, selected])

  const subscriberPrograms = useMemo(() => {
    if (!selected) return { workouts: [] as WorkoutProgram[], nutrition: [] as NutritionProgram[] }
    return {
      workouts: allWorkouts.filter(
        (w) => w.subscriberId === selected.subscriber.id,
      ),
      nutrition: allNutrition.filter(
        (n) => n.subscriberId === selected.subscriber.id,
      ),
    }
  }, [allWorkouts, allNutrition, selected])

  const selectedSubscriberId = selected?.subscriber.id
  const selectedWorkoutLogs = useMemo(
    () =>
      selectedSubscriberId
        ? allWorkoutLogs.filter(
            (log) => log.subscriberId === selectedSubscriberId,
          )
        : [],
    [allWorkoutLogs, selectedSubscriberId],
  )
  const selectedNutritionLogs = useMemo(
    () =>
      selectedSubscriberId
        ? allNutritionLogs.filter(
            (log) => log.subscriberId === selectedSubscriberId,
          )
        : [],
    [allNutritionLogs, selectedSubscriberId],
  )

  const selectedAdherenceWeeks = useMemo(
    () =>
      computeAdherenceWeeks({
        workoutLogs: selectedWorkoutLogs,
        nutritionLogs: selectedNutritionLogs,
        workoutPrograms: subscriberPrograms.workouts,
        nutritionPrograms: subscriberPrograms.nutrition,
      }),
    [
      selectedWorkoutLogs,
      selectedNutritionLogs,
      subscriberPrograms.workouts,
      subscriberPrograms.nutrition,
    ],
  )

  // Delete Action Handlers
  function handleDeleteMeasurement(row: BodyMeasurement) {
    setConfirmDialog({
      open: true,
      title: isAr ? "حذف سجل القياسات" : "Delete Check-in Record",
      description: isAr
        ? `هل أنت متأكد من حذف قياس تاريخ ${formatDate(row.recordedAt, locale)} للمشترك "${selected?.subscriber.displayName}"؟`
        : `Are you sure you want to delete the check-in from ${formatDate(row.recordedAt, locale)} for "${selected?.subscriber.displayName}"?`,
      confirmLabel: isAr ? "تأكيد الحذف" : "Delete Record",
      tone: "danger",
      onConfirm: async () => {
        await deleteMeasurementMutation.mutateAsync({
          id: row.id,
          subscriberId: row.subscriberId,
        })
        appToast.success(isAr ? "تم حذف السجل بنجاح" : "Record deleted successfully")
      },
    })
  }

  function handleDeletePhoto(item: ProgressPhoto) {
    setConfirmDialog({
      open: true,
      title: isAr ? "حذف صورة التقدم" : "Delete Progress Photo",
      description: isAr
        ? `هل ترغب في حذف هذه الصورة نهائياً من ملف المشترك "${selected?.subscriber.displayName}"؟`
        : `Are you sure you want to permanently delete this photo from "${selected?.subscriber.displayName}"'s profile?`,
      confirmLabel: isAr ? "تأكيد الحذف" : "Delete Photo",
      tone: "danger",
      onConfirm: async () => {
        await deletePhotoMutation.mutateAsync({
          id: item.id,
          subscriberId: item.subscriberId,
        })
        appToast.success(isAr ? "تم حذف الصورة بنجاح" : "Photo deleted successfully")
      },
    })
  }

  function handleDeleteLift(row: PerformanceRecord) {
    setConfirmDialog({
      open: true,
      title: isAr ? "حذف رقم الأداء الرياضي" : "Delete Performance Record",
      description: isAr
        ? `هل ترغب في حذف سجل تمرين "${row.name}" (${row.value} ${row.unit}) للمشترك "${selected?.subscriber.displayName}"؟`
        : `Delete ${row.name} record (${row.value} ${row.unit}) for "${selected?.subscriber.displayName}"?`,
      confirmLabel: isAr ? "تأكيد الحذف" : "Delete Record",
      tone: "danger",
      onConfirm: async () => {
        await deletePerformanceMutation.mutateAsync({
          id: row.id,
          subscriberId: row.subscriberId,
        })
        appToast.success(isAr ? "تم حذف السجل بنجاح" : "Record deleted successfully")
      },
    })
  }

  function pickFilter(next: ProgressFilter) {
    setFilter(next)
    const first = roster.find((item) => next === "all" || item.bucket === next)
    setSelectedId(first?.subscriber.id ?? "")
    setTab("overview")
  }

  function pickPerson(person: RosterPerson) {
    setSelectedId(person.subscriber.id)
    setTab("overview")
  }

  return (
    <div className="flex flex-col gap-4 sm:gap-5">
      <div className="grid grid-cols-2 gap-2 sm:gap-3 lg:grid-cols-4 lg:gap-4">
        <StatCard
          label={t("admin.progress.stats.onTrack")}
          value={stats.onTrack}
          icon={<Activity className="size-4" strokeWidth={1.8} />}
        />
        <StatCard
          label={t("admin.progress.stats.attention")}
          value={stats.attention}
          icon={<AlertTriangle className="size-4" strokeWidth={1.8} />}
        />
        <StatCard
          label={t("admin.progress.stats.checkIns")}
          value={stats.checkIns}
          icon={<Scale className="size-4" strokeWidth={1.8} />}
        />
        <StatCard
          label={t("admin.progress.stats.photos")}
          value={stats.photos}
          icon={<Camera className="size-4" strokeWidth={1.8} />}
        />
      </div>

      <section className="rounded-[24px] bg-white p-3.5 sm:p-6 lg:p-7">
        <div className="flex flex-col gap-3.5">
          {/* Top row: Search input + Actions */}
          <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
            <label className="relative w-full sm:max-w-[340px]">
              <Search className="pointer-events-none absolute start-3.5 top-1/2 size-4 -translate-y-1/2 text-[#8c8c8c]" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={t("admin.progress.search")}
                className="h-11 w-full rounded-full bg-[#F4F4F4] pe-4 ps-10 text-[14px] font-medium text-[var(--gym-ink,#111111)] outline-none placeholder:font-normal placeholder:text-[#8c8c8c]"
              />
            </label>

            {/* Quick action buttons */}
            <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
              {canWrite ? (
                <button
                  type="button"
                  onClick={() => setMeasurementModalOpen(true)}
                  className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-full bg-[var(--gym-ink,#111111)] px-5 text-[13px] font-bold text-white transition hover:opacity-95"
                >
                  <Plus className="size-4" strokeWidth={2} />
                  <span>{isAr ? "تسجيل قياسات" : "Log Check-in"}</span>
                </button>
              ) : null}

              {canWrite ? (
                <button
                  type="button"
                  onClick={() => setPhotoModalOpen(true)}
                  className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-full bg-[#F4F4F4] px-4 text-[13px] font-bold text-[var(--gym-ink,#111111)] transition hover:bg-black/5"
                >
                  <Camera className="size-4" />
                  <span>{isAr ? "إضافة صورة" : "Add Photo"}</span>
                </button>
              ) : null}

              {selectedPhotos.length >= 2 ? (
                <button
                  type="button"
                  onClick={() => setCompareModalOpen(true)}
                  className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-full bg-[#F4F4F4] px-4 text-[13px] font-bold text-[var(--gym-ink,#111111)] transition hover:bg-black/5"
                >
                  <ArrowLeftRight className="size-4" />
                  <span>{isAr ? "مقارنة الصور" : "Compare"}</span>
                </button>
              ) : null}
            </div>
          </div>

          {/* Filter Chips */}
          <div className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {FILTERS.map((item) => (
              <FilterChip key={item} active={filter === item} onClick={() => pickFilter(item)}>
                {t(`admin.progress.filter.${item}`)}
              </FilterChip>
            ))}
          </div>
        </div>

        {list.length === 0 || !selected ? (
          <div
            role="status"
            className="mt-5 flex min-h-40 items-center justify-center rounded-[20px] bg-[#F4F4F4] text-sm font-medium text-[#8c8c8c]"
          >
            {t("admin.progress.empty")}
          </div>
        ) : (
          <div className="mt-4 grid items-start gap-4 xl:mt-5 xl:grid-cols-[240px_minmax(0,1fr)] 2xl:grid-cols-[260px_minmax(0,1fr)]">
            <MobilePersonPicker list={list} selected={selected} onSelect={pickPerson} />
            <div className="hidden max-h-[640px] flex-col gap-2 overflow-y-auto pe-1 xl:flex [scrollbar-width:thin]">
              {list.map((person) => (
                <PersonChip
                  key={person.subscriber.id}
                  person={person}
                  active={person.subscriber.id === selected.subscriber.id}
                  onSelect={() => pickPerson(person)}
                />
              ))}
            </div>

            <ReviewPanel
              person={selected}
              tab={tab}
              onTab={setTab}
              locale={locale}
              liveMeasurements={selectedMeasurements}
              livePhotos={selectedPhotos}
              liveLifts={selectedLifts}
              adherenceWeeks={selectedAdherenceWeeks}
              programs={subscriberPrograms}
              liveSubscription={
                subscriptionsBySubscriber.get(selected.subscriber.id) ?? null
              }
              onOpenMeasurementModal={
                canWrite ? () => setMeasurementModalOpen(true) : undefined
              }
              onOpenPhotoModal={
                canWrite ? () => setPhotoModalOpen(true) : undefined
              }
              onOpenPerformanceModal={
                canWrite ? () => setPerformanceModalOpen(true) : undefined
              }
              onOpenCompareModal={() => setCompareModalOpen(true)}
              onDeleteMeasurement={
                canWrite ? handleDeleteMeasurement : undefined
              }
              onDeletePhoto={canWrite ? handleDeletePhoto : undefined}
              onDeleteLift={canWrite ? handleDeleteLift : undefined}
            />
          </div>
        )}
      </section>

      {/* Dialog Modals */}
      {selected ? (
        <>
          {canWrite ? (
            <>
              <LogMeasurementDialog
                open={measurementModalOpen}
                subscriberId={selected.subscriber.id}
                subscriberName={selected.subscriber.displayName}
                onClose={() => setMeasurementModalOpen(false)}
                onSave={async (input) => {
                  await saveMeasurementMutation.mutateAsync(input)
                }}
              />

              <AddProgressPhotoDialog
                open={photoModalOpen}
                subscriberId={selected.subscriber.id}
                subscriberName={selected.subscriber.displayName}
                onClose={() => setPhotoModalOpen(false)}
                onSave={async (input) => {
                  await savePhotoMutation.mutateAsync(input)
                }}
              />

              <LogPerformanceDialog
                open={performanceModalOpen}
                subscriberId={selected.subscriber.id}
                subscriberName={selected.subscriber.displayName}
                onClose={() => setPerformanceModalOpen(false)}
                onSave={async (input) => {
                  await savePerformanceMutation.mutateAsync(input)
                }}
              />
            </>
          ) : null}

          <PhotoComparisonDialog
            open={compareModalOpen}
            photos={selectedPhotos}
            subscriberName={selected.subscriber.displayName}
            onClose={() => setCompareModalOpen(false)}
          />
        </>
      ) : null}

      {/* Confirm Action Dialog */}
      {confirmDialog ? (
        <ConfirmActionDialog
          open={confirmDialog.open}
          title={confirmDialog.title}
          description={confirmDialog.description}
          confirmLabel={confirmDialog.confirmLabel}
          tone={confirmDialog.tone}
          onCancel={() => setConfirmDialog(null)}
          onConfirm={confirmDialog.onConfirm}
        />
      ) : null}
    </div>
  )
}

function PersonChip({
  person,
  active,
  onSelect,
  className,
  chevron,
  open,
}: {
  person: RosterPerson
  active: boolean
  onSelect: () => void
  className?: string
  chevron?: boolean
  open?: boolean
}) {
  const { t } = useTranslation()
  const { locale } = useLocale()
  const { subscriber } = person

  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "flex h-fit w-full shrink-0 items-center gap-3 rounded-[18px] p-2.5 text-start transition-colors",
        active
          ? "bg-[var(--gym-ink,#111111)] text-white"
          : "bg-[#F4F4F4] text-[var(--gym-ink,#111111)] hover:bg-[#ececec]",
        className,
      )}
    >
      <span
        className={cn(
          "inline-flex size-10 shrink-0 items-center justify-center rounded-2xl font-heading text-[13px] font-bold",
          active
            ? "bg-[var(--gym-lime,#fb5001)] text-[var(--gym-ink,#111111)]"
            : "bg-white text-[var(--gym-ink,#111111)]",
        )}
      >
        {initials(subscriber.displayName)}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[13px] font-bold">{subscriber.displayName}</span>
        <span className={cn("mt-0.5 block truncate text-[11px] font-medium", active ? "text-white/70" : "text-[#8c8c8c]")}>
          {person.lastCheckIn
            ? person.stale
              ? t("admin.progress.stale")
              : person.weightKg != null
                ? `${formatKg(person.weightKg, locale)}${person.deltaKg != null ? ` · ${signed(person.deltaKg)} kg` : ""}`
                : t("admin.progress.logged")
            : t("admin.progress.noLogs")}
        </span>
      </span>
      {chevron ? (
        <ChevronDown
          className={cn("size-4 shrink-0 transition-transform duration-200", open && "rotate-180")}
          strokeWidth={2}
        />
      ) : null}
    </button>
  )
}

function MobilePersonPicker({
  list,
  selected,
  onSelect,
}: {
  list: RosterPerson[]
  selected: RosterPerson
  onSelect: (person: RosterPerson) => void
}) {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function onPointer(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false)
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false)
    }
    document.addEventListener("mousedown", onPointer)
    document.addEventListener("keydown", onKey)
    return () => {
      document.removeEventListener("mousedown", onPointer)
      document.removeEventListener("keydown", onKey)
    }
  }, [open])

  return (
    <div ref={rootRef} className="relative xl:hidden">
      <PersonChip
        person={selected}
        active
        chevron
        open={open}
        onSelect={() => setOpen((value) => !value)}
        className="w-full"
      />
      {open ? (
        <div
          role="listbox"
          aria-label={t("admin.progress.chooseSubscriber")}
          className="absolute inset-x-0 top-[calc(100%+8px)] z-30 max-h-[min(20rem,55vh)] overflow-y-auto rounded-[20px] bg-white p-1.5 shadow-[0_18px_40px_rgba(0,0,0,0.16)]"
        >
          <p className="px-2.5 py-1.5 text-[11px] font-medium text-[#8c8c8c]">
            {t("admin.progress.subscriberCount", { count: list.length })}
          </p>
          <div className="flex flex-col gap-1">
            {list.map((person) => (
              <PersonChip
                key={person.subscriber.id}
                person={person}
                active={person.subscriber.id === selected.subscriber.id}
                onSelect={() => {
                  onSelect(person)
                  setOpen(false)
                }}
                className="w-full"
              />
            ))}
          </div>
        </div>
      ) : null}
    </div>
  )
}

function ReviewPanel({
  person,
  tab,
  onTab,
  locale,
  liveMeasurements,
  livePhotos,
  liveLifts,
  adherenceWeeks = [],
  programs: assignedPrograms,
  liveSubscription = null,
  onOpenMeasurementModal,
  onOpenPhotoModal,
  onOpenPerformanceModal,
  onOpenCompareModal,
  onDeleteMeasurement,
  onDeletePhoto,
  onDeleteLift,
}: {
  person: RosterPerson
  tab: ReviewTab
  onTab: (tab: ReviewTab) => void
  locale: AppLocale
  liveMeasurements?: BodyMeasurement[]
  livePhotos?: ProgressPhoto[]
  liveLifts?: PerformanceRecord[]
  adherenceWeeks?: AdherenceWeek[]
  programs?: { workouts: WorkoutProgram[]; nutrition: NutritionProgram[] }
  liveSubscription?: SubscriberSubscription | null
  onOpenMeasurementModal?: () => void
  onOpenPhotoModal?: () => void
  onOpenPerformanceModal?: () => void
  onOpenCompareModal?: () => void
  onDeleteMeasurement?: (row: BodyMeasurement) => void
  onDeletePhoto?: (photo: ProgressPhoto) => void
  onDeleteLift?: (row: PerformanceRecord) => void
}) {
  const { t } = useTranslation()
  const { subscriber } = person
  const { data: pkg = null } = usePackageByIdQuery(liveSubscription?.packageId)
  const days = daysSinceCheckIn(person.lastCheckIn)

  const measurements = liveMeasurements ?? []
  const photos = livePhotos ?? []
  const programs = assignedPrograms ?? { workouts: [], nutrition: [] }
  const week = latestAdherenceWeek(adherenceWeeks)

  const lifts = useMemo(
    () => buildLiftSeries(liveLifts ?? []),
    [liveLifts],
  )

  const first = measurements[0]
  const previous = measurements.length >= 2 ? measurements[measurements.length - 2] : undefined
  const latest = measurements[measurements.length - 1]

  return (
    <div className="min-w-0 rounded-[22px] bg-[#F4F4F4] p-3.5 sm:p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="font-heading text-[18px] font-extrabold tracking-tight text-[var(--gym-ink,#111111)] sm:text-[20px]">
              {subscriber.displayName}
            </h2>
            <StatusBadge label={t(`admin.progress.filter.${person.bucket}`)} tone={person.tone} />
            {pkg ? <StatusBadge label={pkg.name[locale]} tone="info" /> : null}
          </div>
          <p className="mt-1 text-[12px] font-medium text-[#8c8c8c] sm:text-[13px]">
            {latest?.recordedAt
              ? t("admin.progress.lastCheckIn", {
                  date: formatDate(latest.recordedAt, locale),
                  days: days ?? 0,
                })
              : t("admin.progress.noLogs")}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            to={APP_ROUTES.admin.subscriberDetail(subscriber.id)}
            className="inline-flex h-9 shrink-0 items-center rounded-full bg-white px-3.5 text-[12px] font-bold text-[var(--gym-ink,#111111)] shadow-2xs hover:bg-[#ececec]"
          >
            {t("admin.progress.profile")}
          </Link>
        </div>
      </div>

      <p className="mt-3 flex items-start gap-2 text-[12px] font-medium leading-relaxed text-[#6B7280]">
        <ShieldCheck className="mt-0.5 size-4 shrink-0" strokeWidth={1.8} />
        {t("admin.progress.privacy")}
      </p>

      <div className="-mx-1 mt-4 flex gap-1.5 overflow-x-auto px-1 pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {TABS.map((item) => (
          <FilterChip key={item} active={tab === item} onClick={() => onTab(item)}>
            {t(`admin.progress.tabs.${item}`)}
          </FilterChip>
        ))}
      </div>

      <div className="mt-4">
        {tab === "overview" ? (
          <OverviewTab
            measurements={measurements}
            photos={photos}
            week={week}
            first={first}
            previous={previous}
            latest={latest}
            programs={programs}
            locale={locale}
          />
        ) : null}
        {tab === "body" ? (
          <BodyTab
            measurements={measurements}
            locale={locale}
            onAddMeasurement={onOpenMeasurementModal}
            onDeleteMeasurement={onDeleteMeasurement}
          />
        ) : null}
        {tab === "photos" ? (
          <PhotosTab
            photos={photos}
            onAddPhoto={onOpenPhotoModal}
            onCompare={onOpenCompareModal}
            onDeletePhoto={onDeletePhoto}
          />
        ) : null}
        {tab === "performance" ? (
          <PerformanceTab
            lifts={lifts}
            liveLifts={liveLifts}
            adherenceWeeks={adherenceWeeks}
            locale={locale}
            onAddLift={onOpenPerformanceModal}
            onDeleteLift={onDeleteLift}
          />
        ) : null}
        {tab === "history" ? <HistoryTab programs={programs} locale={locale} /> : null}
      </div>
    </div>
  )
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

function OverviewTab({
  measurements,
  photos,
  week,
  first,
  previous,
  latest,
  programs,
  locale,
}: {
  measurements: BodyMeasurement[]
  photos: ProgressPhoto[]
  week: AdherenceWeek | undefined
  first?: BodyMeasurement
  previous?: BodyMeasurement
  latest?: BodyMeasurement
  programs: { workouts: WorkoutProgram[]; nutrition: NutritionProgram[] }
  locale: AppLocale
}) {
  const { t } = useTranslation()
  const workoutPct = week ? percent(week.workoutDone, week.workoutTotal) : null
  const nutritionPct = week ? percent(week.nutritionDone, week.nutritionTotal) : null
  const latestPhotos = photos.filter((item) => item.takenAt === photos[photos.length - 1]?.takenAt)

  if (!latest) {
    return <EmptyNote>{t("admin.progress.emptyPerson")}</EmptyNote>
  }

  return (
    <div className="flex flex-col gap-3">
      <Panel>
        <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#8c8c8c]">
          {t("admin.progress.weightTrend")}
        </p>
        <WeightChart measurements={measurements} locale={locale} />
      </Panel>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <AdherenceCard
          icon={<Dumbbell className="size-4" strokeWidth={1.8} />}
          label={t("admin.progress.workoutWeek")}
          value={workoutPct}
          detail={week && week.workoutTotal ? `${week.workoutDone}/${week.workoutTotal}` : t("admin.progress.noProgram")}
        />
        <AdherenceCard
          icon={<Apple className="size-4" strokeWidth={1.8} />}
          label={t("admin.progress.nutritionWeek")}
          value={nutritionPct}
          detail={
            week && week.nutritionTotal ? `${week.nutritionDone}/${week.nutritionTotal}` : t("admin.progress.noProgram")
          }
        />
      </div>

      <Panel>
        <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#8c8c8c]">
          {t("admin.progress.sinceStart")}
        </p>
        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
          {metricSet(first, latest).map((item) => (
            <DeltaStat
              key={item.key}
              label={t(`admin.progress.metrics.${item.key}`)}
              first={item.first}
              latest={item.latest}
              unit={item.unit}
            />
          ))}
        </div>
      </Panel>

      {previous ? (
        <Panel>
          <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#8c8c8c]">
            {t("admin.progress.vsPrevious")}
          </p>
          <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
            {metricSet(previous, latest).map((item) => (
              <DeltaStat
                key={item.key}
                label={t(`admin.progress.metrics.${item.key}`)}
                first={item.first}
                latest={item.latest}
                unit={item.unit}
              />
            ))}
          </div>
        </Panel>
      ) : null}

      {latestPhotos.length ? (
        <Panel>
          <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#8c8c8c]">
            {t("admin.progress.latestPhotos")}
          </p>
          <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3 sm:max-w-xl">
            {latestPhotos.map((item) => (
              <PhotoCard key={item.id} photo={item} />
            ))}
          </div>
        </Panel>
      ) : null}

      <Panel>
        <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#8c8c8c]">
          {t("admin.progress.currentPrograms")}
        </p>
        <ul className="mt-2 flex flex-col gap-2">
          {programs.workouts
            .filter((item) => item.status === "active")
            .map((item) => (
              <li key={item.id} className="rounded-2xl bg-[#F4F4F4] px-3 py-2.5">
                <p className="text-[13px] font-bold text-[var(--gym-ink,#111111)]">{item.title[locale]}</p>
                <p className="mt-0.5 text-[11px] font-medium text-[#8c8c8c]">
                  {t("admin.progress.workoutWeek")} · {t(`admin.workouts.format.${item.format}`)} ·{" "}
                  {t("admin.workouts.version", { version: item.version })}
                  {item.completion ? ` · ${item.completion.done}/${item.completion.total}` : ""}
                </p>
              </li>
            ))}
          {programs.nutrition
            .filter((item) => item.status === "active")
            .map((item) => (
              <li key={item.id} className="rounded-2xl bg-[#F4F4F4] px-3 py-2.5">
                <p className="text-[13px] font-bold text-[var(--gym-ink,#111111)]">{item.title[locale]}</p>
                <p className="mt-0.5 text-[11px] font-medium text-[#8c8c8c]">
                  {t("admin.progress.nutritionWeek")} · {t(`admin.workouts.format.${item.format}`)} ·{" "}
                  {t("admin.workouts.version", { version: item.version })}
                  {item.targetCalories ? ` · ${t("admin.nutrition.target", { value: item.targetCalories })}` : ""}
                  {item.adherence ? ` · ${item.adherence.done}/${item.adherence.total}` : ""}
                </p>
              </li>
            ))}
          {!programs.workouts.some((item) => item.status === "active") &&
          !programs.nutrition.some((item) => item.status === "active") ? (
            <li className="text-[13px] font-medium text-[#8c8c8c]">{t("admin.progress.noProgram")}</li>
          ) : null}
        </ul>
      </Panel>
    </div>
  )
}

function BodyTab({
  measurements,
  locale,
  onAddMeasurement,
  onDeleteMeasurement,
}: {
  measurements: BodyMeasurement[]
  locale: AppLocale
  onAddMeasurement?: () => void
  onDeleteMeasurement?: (row: BodyMeasurement) => void
}) {
  const { t } = useTranslation()
  const isAr = locale === "ar"
  if (!measurements.length) return <EmptyNote>{t("admin.progress.emptyBody")}</EmptyNote>
  const latest = measurements[measurements.length - 1]
  const first = measurements[0]
  const previous = measurements.length >= 2 ? measurements[measurements.length - 2] : undefined

  return (
    <div className="flex flex-col gap-3">
      <Panel>
        <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#8c8c8c]">
          {t("admin.progress.weightTrend")}
        </p>
        <WeightChart measurements={measurements} locale={locale} />
      </Panel>
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        <Panel>
          <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#8c8c8c]">
            {t("admin.progress.sinceStart")}
          </p>
          <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
            {metricSet(first, latest).map((item) => (
              <DeltaStat
                key={item.key}
                label={t(`admin.progress.metrics.${item.key}`)}
                first={item.first}
                latest={item.latest}
                unit={item.unit}
              />
            ))}
          </div>
        </Panel>
        {previous ? (
          <Panel>
            <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#8c8c8c]">
              {t("admin.progress.vsPrevious")}
            </p>
            <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
              {metricSet(previous, latest).map((item) => (
                <DeltaStat
                  key={item.key}
                  label={t(`admin.progress.metrics.${item.key}`)}
                  first={item.first}
                  latest={item.latest}
                  unit={item.unit}
                />
              ))}
            </div>
          </Panel>
        ) : null}
      </div>
      <Panel>
        <div className="flex items-center justify-between">
          <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#8c8c8c]">
            {t("admin.progress.measurements")}
          </p>
          {onAddMeasurement ? (
            <button
              type="button"
              onClick={onAddMeasurement}
              className="inline-flex h-8 items-center gap-1.5 rounded-full bg-[var(--gym-ink,#111111)] px-3.5 text-[11px] font-bold text-white transition hover:opacity-90"
            >
              <Plus className="size-3.5" />
              <span>{isAr ? "تسجيل قياسات جديدة" : "Log Measurement"}</span>
            </button>
          ) : null}
        </div>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[720px] text-start text-[12px] sm:text-[13px]">
            <thead>
              <tr className="text-[11px] font-bold uppercase tracking-[0.06em] text-[#8c8c8c]">
                <th className="pb-2 pe-3 font-bold">{t("admin.progress.metrics.date")}</th>
                <th className="pb-2 pe-3 font-bold">{t("admin.progress.metrics.weight")}</th>
                <th className="pb-2 pe-3 font-bold">{t("admin.progress.metrics.chest")}</th>
                <th className="pb-2 pe-3 font-bold">{t("admin.progress.metrics.waist")}</th>
                <th className="pb-2 pe-3 font-bold">{t("admin.progress.metrics.hips")}</th>
                <th className="pb-2 pe-3 font-bold">{t("admin.progress.metrics.arms")}</th>
                <th className="pb-2 pe-3 font-bold">{t("admin.progress.metrics.thighs")}</th>
                <th className="pb-2 font-bold">{t("admin.progress.metrics.notes")}</th>
                {onDeleteMeasurement ? (
                  <th className="pb-2 text-end font-bold">{isAr ? "الإجراء" : "Action"}</th>
                ) : null}
              </tr>
            </thead>
            <tbody>
              {[...measurements].reverse().map((row) => {
                const index = measurements.findIndex((item) => item.id === row.id)
                const older = index > 0 ? measurements[index - 1] : undefined
                return (
                  <tr key={row.id} className="border-t border-black/5 font-medium text-[var(--gym-ink,#111111)]">
                    <td className="py-2.5 pe-3 whitespace-nowrap">{formatDate(row.recordedAt, locale)}</td>
                    <MeasureCell value={row.weightKg} previous={older?.weightKg} />
                    <MeasureCell value={row.chestCm} previous={older?.chestCm} />
                    <MeasureCell value={row.waistCm} previous={older?.waistCm} />
                    <MeasureCell value={row.hipsCm} previous={older?.hipsCm} />
                    <MeasureCell value={row.armsCm} previous={older?.armsCm} />
                    <MeasureCell value={row.thighsCm} previous={older?.thighsCm} />
                    <td className="py-2.5 text-[12px] font-medium text-[#6B7280]">{row.notes ?? "—"}</td>
                    {onDeleteMeasurement ? (
                      <td className="py-2.5 text-end">
                        <button
                          type="button"
                          onClick={() => onDeleteMeasurement(row)}
                          className="p-1 text-[#8c8c8c] hover:text-[#C44536] transition"
                          title={isAr ? "حذف السجل" : "Delete record"}
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      </td>
                    ) : null}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  )
}

function PhotosTab({
  photos,
  onAddPhoto,
  onCompare,
  onDeletePhoto,
}: {
  photos: ProgressPhoto[]
  onAddPhoto?: () => void
  onCompare?: () => void
  onDeletePhoto?: (photo: ProgressPhoto) => void
}) {
  const { t } = useTranslation()
  const { locale } = useLocale()
  const isAr = locale === "ar"
  if (!photos.length) return <EmptyNote>{t("admin.progress.emptyPhotos")}</EmptyNote>

  const firstDate = photos[0]?.takenAt
  const lastDate = photos[photos.length - 1]?.takenAt
  const start = photos.filter((item) => item.takenAt === firstDate)
  const latest = firstDate !== lastDate ? photos.filter((item) => item.takenAt === lastDate) : []

  return (
    <div className="flex flex-col gap-3">
      {/* Header controls inside tab */}
      <div className="flex items-center justify-between rounded-[18px] bg-white px-4 py-3">
        <p className="text-[12px] font-bold text-[#8c8c8c]">
          {photos.length} {isAr ? "صور مسجلة في هذا الملف" : "photos on this profile"}
        </p>
        <div className="flex items-center gap-2">
          {photos.length >= 2 && onCompare ? (
            <button
              type="button"
              onClick={onCompare}
              className="inline-flex h-8 items-center gap-1.5 rounded-full bg-[#F4F4F4] px-3.5 text-[11px] font-bold text-[var(--gym-ink,#111111)] hover:bg-[#ececec]"
            >
              <ArrowLeftRight className="size-3.5" />
              <span>{isAr ? "مقارنة جنباً إلى جنب" : "Side-by-Side"}</span>
            </button>
          ) : null}
          {onAddPhoto ? (
            <button
              type="button"
              onClick={onAddPhoto}
              className="inline-flex h-8 items-center gap-1.5 rounded-full bg-[var(--gym-ink,#111111)] px-3.5 text-[11px] font-bold text-white hover:opacity-90"
            >
              <Plus className="size-3.5" />
              <span>{isAr ? "إضافة صورة" : "Add Photo"}</span>
            </button>
          ) : null}
        </div>
      </div>

      {latest.length ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Panel>
            <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#8c8c8c]">
              {t("admin.progress.photoStart")}
            </p>
            <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
              {start.map((item) => (
                <PhotoCard key={item.id} photo={item} onDelete={onDeletePhoto} />
              ))}
            </div>
          </Panel>
          <Panel>
            <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#8c8c8c]">
              {t("admin.progress.photoLatest")}
            </p>
            <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
              {latest.map((item) => (
                <PhotoCard key={item.id} photo={item} onDelete={onDeletePhoto} />
              ))}
            </div>
          </Panel>
        </div>
      ) : null}
      <Panel>
        <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#8c8c8c]">
          {t("admin.progress.photoTimeline")}
        </p>
        <div className="mt-3 grid grid-cols-2 content-start items-start gap-2 sm:grid-cols-3 lg:grid-cols-4">
          {photos.map((item) => (
            <PhotoCard key={item.id} photo={item} onDelete={onDeletePhoto} />
          ))}
        </div>
      </Panel>
    </div>
  )
}

function PerformanceTab({
  lifts,
  liveLifts,
  adherenceWeeks,
  locale,
  onAddLift,
  onDeleteLift,
}: {
  lifts: ReturnType<typeof buildLiftSeries>
  liveLifts?: PerformanceRecord[]
  adherenceWeeks: AdherenceWeek[]
  locale: AppLocale
  onAddLift?: () => void
  onDeleteLift?: (row: PerformanceRecord) => void
}) {
  const { t } = useTranslation()
  const isAr = locale === "ar"
  const weeks = adherenceWeeks
  const log = [...(liveLifts ?? [])].reverse()
  const hasWorkout = weeks.some((week) => week.workoutTotal > 0)
  const hasNutrition = weeks.some((week) => week.nutritionTotal > 0)
  const chartData = weeks.map((week) => ({
    date: formatChartDate(week.weekStart, locale),
    workout: week.workoutTotal ? percent(week.workoutDone, week.workoutTotal) : null,
    nutrition: week.nutritionTotal ? percent(week.nutritionDone, week.nutritionTotal) : null,
  }))

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between rounded-[18px] bg-white px-4 py-3">
        <p className="text-[12px] font-bold text-[#8c8c8c]">
          {isAr ? "الأرقام القياسية والتطور الرياضي" : "Athletic Performance & PR Records"}
        </p>
        {onAddLift ? (
          <button
            type="button"
            onClick={onAddLift}
            className="inline-flex h-8 items-center gap-1.5 rounded-full bg-[var(--gym-ink,#111111)] px-3.5 text-[11px] font-bold text-white hover:opacity-90"
          >
            <Plus className="size-3.5" />
            <span>{isAr ? "تسجيل رقم جديد" : "Log PR"}</span>
          </button>
        ) : null}
      </div>

      {lifts.length ? (
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          {lifts.map((item) => (
            <div key={item.name} className="rounded-[18px] bg-white p-3.5">
              <p className="text-[12px] font-bold text-[#8c8c8c]">{item.name}</p>
              <p className="mt-1 font-heading text-[22px] font-extrabold text-[var(--gym-ink,#111111)]">
                {item.latest} {item.unit}
              </p>
              <p className="mt-1 text-[12px] font-bold text-[var(--gym-lime,#fb5001)]">
                {signed(item.delta)} {item.unit}
              </p>
            </div>
          ))}
        </div>
      ) : null}
      {log.length ? (
        <Panel>
          <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#8c8c8c]">
            {t("admin.progress.liftLog")}
          </p>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full min-w-[480px] text-start text-[12px] sm:text-[13px]">
              <thead>
                <tr className="text-[11px] font-bold uppercase tracking-[0.06em] text-[#8c8c8c]">
                  <th className="pb-2 pe-3 font-bold">{t("admin.progress.metrics.date")}</th>
                  <th className="pb-2 pe-3 font-bold">{t("admin.progress.liftName")}</th>
                  <th className="pb-2 pe-3 font-bold">{t("admin.progress.liftValue")}</th>
                  <th className="pb-2 font-bold">{t("admin.progress.metrics.notes")}</th>
                  {onDeleteLift ? (
                    <th className="pb-2 text-end font-bold">{isAr ? "الإجراء" : "Action"}</th>
                  ) : null}
                </tr>
              </thead>
              <tbody>
                {log.map((row) => (
                  <tr key={row.id} className="border-t border-black/5 font-medium text-[var(--gym-ink,#111111)]">
                    <td className="py-2.5 pe-3 whitespace-nowrap">{formatDate(row.recordedAt, locale)}</td>
                    <td className="py-2.5 pe-3">{row.name}</td>
                    <td className="py-2.5 pe-3 whitespace-nowrap">
                      {row.value} {row.unit}
                    </td>
                    <td className="py-2.5 text-[12px] font-medium text-[#6B7280]">{row.notes ?? "—"}</td>
                    {onDeleteLift ? (
                      <td className="py-2.5 text-end">
                        <button
                          type="button"
                          onClick={() => onDeleteLift(row)}
                          className="p-1 text-[#8c8c8c] hover:text-[#C44536] transition"
                          title={isAr ? "حذف الرقم" : "Delete record"}
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      </td>
                    ) : null}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
      ) : null}
      {chartData.length ? (
        <Panel>
          <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#8c8c8c]">
            {t("admin.progress.adherenceHistory")}
          </p>
          <div className="mt-2 h-[200px] w-full sm:h-[240px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} barSize={14} margin={{ top: 8, right: 8, left: 4, bottom: 4 }}>
                <CartesianGrid stroke="#E8E8E8" strokeDasharray="3 3" vertical={false} />
                <XAxis
                  dataKey="date"
                  tick={{ fill: "#8c8c8c", fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  tickMargin={8}
                  minTickGap={24}
                  interval="preserveStartEnd"
                />
                <YAxis
                  domain={[0, 100]}
                  ticks={[0, 25, 50, 75, 100]}
                  tick={{ fill: "#8c8c8c", fontSize: 11 }}
                  tickFormatter={(value) => `${value}%`}
                  axisLine={false}
                  tickLine={false}
                  tickMargin={8}
                  width={44}
                />
                <Tooltip
                  cursor={{ fill: "rgba(0,0,0,0.04)" }}
                  contentStyle={{
                    background: "#111111",
                    border: "none",
                    borderRadius: 12,
                    color: "#fff",
                    fontSize: 12,
                    fontWeight: 600,
                  }}
                  formatter={(value, name) => [`${value ?? "—"}%`, String(name)]}
                />
                {hasWorkout ? (
                  <Bar
                    dataKey="workout"
                    name={t("admin.progress.workoutWeek")}
                    fill={INK}
                    radius={[6, 6, 0, 0]}
                  />
                ) : null}
                {hasNutrition ? (
                  <Bar
                    dataKey="nutrition"
                    name={t("admin.progress.nutritionWeek")}
                    fill={LIME}
                    radius={[6, 6, 0, 0]}
                  />
                ) : null}
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>
      ) : null}
    </div>
  )
}

function HistoryTab({
  programs,
  locale,
}: {
  programs: { workouts: WorkoutProgram[]; nutrition: NutritionProgram[] }
  locale: AppLocale
}) {
  const { t } = useTranslation()
  const empty = programs.workouts.length === 0 && programs.nutrition.length === 0
  if (empty) return <EmptyNote>{t("admin.progress.emptyHistory")}</EmptyNote>

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      <Panel>
        <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#8c8c8c]">
          {t("admin.progress.workoutHistory")}
        </p>
        <ProgramList items={programs.workouts} locale={locale} empty={t("admin.progress.noProgram")} />
      </Panel>
      <Panel>
        <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#8c8c8c]">
          {t("admin.progress.nutritionHistory")}
        </p>
        <ProgramList items={programs.nutrition} locale={locale} empty={t("admin.progress.noProgram")} />
      </Panel>
    </div>
  )
}

function ProgramList({
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
  if (!items.length) return <p className="mt-2 text-[13px] font-medium text-[#8c8c8c]">{empty}</p>
  return (
    <ul className="mt-2 flex flex-col gap-2">
      {items.map((item) => (
        <li key={item.id} className="flex items-center justify-between gap-2 rounded-2xl bg-white px-3 py-2.5">
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

function WeightChart({ measurements, locale }: { measurements: BodyMeasurement[]; locale: AppLocale }) {
  const { t } = useTranslation()
  const data = measurements
    .filter((item) => item.weightKg != null)
    .map((item) => ({
      date: formatChartDate(item.recordedAt, locale),
      kg: item.weightKg as number,
    }))

  if (data.length < 2) {
    return <p className="mt-3 text-[13px] font-medium text-[#8c8c8c]">{t("admin.progress.needMorePoints")}</p>
  }

  const [yMin, yMax] = weightDomain(data.map((item) => item.kg))

  return (
    <div className="mt-3 h-[210px] w-full sm:h-[250px]">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 12, left: 4, bottom: 4 }}>
          <defs>
            <linearGradient id="weightFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#111111" stopOpacity={0.22} />
              <stop offset="100%" stopColor="#111111" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="#E8E8E8" strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey="date"
            tick={{ fill: "#8c8c8c", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            tickMargin={10}
            minTickGap={28}
            interval="preserveStartEnd"
          />
          <YAxis
            domain={[yMin, yMax]}
            allowDecimals={false}
            tickCount={5}
            tick={{ fill: "#8c8c8c", fontSize: 11 }}
            tickFormatter={(value) => `${value}`}
            axisLine={false}
            tickLine={false}
            tickMargin={10}
            width={44}
          />
          <Tooltip
            contentStyle={{
              background: "#111111",
              border: "none",
              borderRadius: 12,
              color: "#fff",
              fontSize: 12,
              fontWeight: 600,
            }}
            formatter={(value) => [`${value ?? "—"} kg`, t("admin.progress.metrics.weight")]}
          />
          <Area
            type="monotone"
            dataKey="kg"
            stroke={INK}
            strokeWidth={2.5}
            fill="url(#weightFill)"
            dot={{ r: 3.5, fill: INK, stroke: "#fff", strokeWidth: 2 }}
            activeDot={{ r: 5, fill: INK, stroke: "#fff", strokeWidth: 2 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}

function AdherenceCard({
  icon,
  label,
  value,
  detail,
}: {
  icon: ReactNode
  label: string
  value: number | null
  detail: string
}) {
  return (
    <div className="rounded-[18px] bg-white p-3.5">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[12px] font-bold text-[#8c8c8c]">{label}</p>
        <span className="inline-flex size-8 items-center justify-center rounded-2xl bg-[#F4F4F4] text-[var(--gym-ink,#111111)]">
          {icon}
        </span>
      </div>
      <p className="mt-2 font-heading text-[28px] font-extrabold leading-none text-[var(--gym-ink,#111111)]">
        {value == null ? "—" : `${value}%`}
      </p>
      <p className="mt-1.5 text-[12px] font-medium text-[#8c8c8c]">{detail}</p>
      {value != null ? (
        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-[#F4F4F4]">
          <div
            className="h-full rounded-full bg-[var(--gym-ink,#111111)]"
            style={{ width: `${Math.min(100, value)}%` }}
          />
        </div>
      ) : null}
    </div>
  )
}

function DeltaStat({
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
    <div className="rounded-2xl bg-white px-3 py-2.5">
      <p className="text-[11px] font-bold text-[#8c8c8c]">{label}</p>
      <p className="mt-1 font-heading text-[16px] font-extrabold text-[var(--gym-ink,#111111)]">
        {latest != null ? `${latest} ${unit}` : "—"}
      </p>
      <p className="text-[11px] font-bold text-[#6B7280]">{delta == null ? "—" : `${signed(delta)} ${unit}`}</p>
    </div>
  )
}

function PhotoCard({
  photo,
  onDelete,
}: {
  photo: ProgressPhoto
  onDelete?: (photo: ProgressPhoto) => void
}) {
  const { t } = useTranslation()
  const { locale } = useLocale()
  const isAr = locale === "ar"

  return (
    <figure className="group relative h-fit overflow-hidden rounded-[16px] bg-[var(--gym-ink,#111111)] text-white shadow-2xs">
      <div className="relative flex aspect-[3/4] items-center justify-center overflow-hidden bg-black/40">
        <ProgressPhotoImage photo={photo} />
        <span className="absolute bottom-2 start-2 rounded-md bg-black/60 px-2 py-0.5 text-[10px] font-bold uppercase">
          {photo.pose ? t(`admin.progress.pose.${photo.pose}`) : "Photo"}
        </span>

        {onDelete ? (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              onDelete(photo)
            }}
            className="absolute top-2 end-2 flex size-7 items-center justify-center rounded-full bg-black/60 text-white/80 opacity-0 group-hover:opacity-100 transition hover:bg-[#C44536] hover:text-white"
            title={isAr ? "حذف الصورة" : "Delete photo"}
          >
            <Trash2 className="size-3.5" />
          </button>
        ) : null}
      </div>
      <figcaption className="px-2.5 py-2 text-[11px] font-bold text-white/80">
        <span className="block">{formatDate(photo.takenAt, locale)}</span>
        {photo.caption ? <span className="mt-0.5 block truncate font-medium text-white/55">{photo.caption}</span> : null}
      </figcaption>
    </figure>
  )
}

function Panel({ children }: { children: ReactNode }) {
  return <div className="rounded-[18px] bg-white p-3.5 sm:p-4">{children}</div>
}

function MeasureCell({ value, previous }: { value?: number; previous?: number }) {
  const delta = value != null && previous != null ? Math.round((value - previous) * 10) / 10 : null
  return (
    <td className="py-2.5 pe-3 whitespace-nowrap">
      <span className="block">{value ?? "—"}</span>
      {delta != null ? <span className="text-[11px] font-bold text-[#8c8c8c]">{signed(delta)}</span> : null}
    </td>
  )
}

function EmptyNote({ children }: { children: ReactNode }) {
  return (
    <div
      role="status"
      className="flex min-h-32 items-center justify-center rounded-[18px] bg-white px-4 text-center text-[13px] font-medium text-[#8c8c8c]"
    >
      {children}
    </div>
  )
}
