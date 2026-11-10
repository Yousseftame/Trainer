import { useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { Link } from "react-router-dom"
import {
  ArrowLeftRight,
  ArrowUpRight,
  Camera,
  Flame,
  Lock,
  Plus,
  Scale,
  ShieldCheck,
  Target,
  Trash2,
  TrendingDown,
  TrendingUp,
  Trophy,
} from "lucide-react"
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { AddProgressPhotoDialog } from "@/components/dashboard/AddProgressPhotoDialog"
import { ConfirmActionDialog } from "@/components/dashboard/ConfirmActionDialog"
import { LogMeasurementDialog } from "@/components/dashboard/LogMeasurementDialog"
import { LogPerformanceDialog } from "@/components/dashboard/LogPerformanceDialog"
import { PhotoComparisonDialog } from "@/components/dashboard/PhotoComparisonDialog"
import { ProgressPhotoImage } from "@/components/dashboard/ProgressPhotoImage"
import { FilterChip } from "@/components/dashboard/StatCard"
import { StatusBadge } from "@/components/dashboard/StatusBadge"
import { APP_ROUTES } from "@/config/constants"
import {
  computeAdherenceWeeks,
  latestAdherenceWeek,
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
import {
  firstMeasurement as firstMeasurementOf,
  latestMeasurement as latestMeasurementOf,
} from "@/features/progress/metrics"
import { useNutritionLogsQuery } from "@/features/nutrition/hooks"
import { useNutritionProgramsQuery } from "@/features/nutrition/hooks"
import { usePanelSubscriber } from "@/features/subscribers/use-panel-subscriber"
import { useWorkoutLogsQuery } from "@/features/workouts/hooks"
import { useWorkoutProgramsQuery } from "@/features/workouts/hooks"
import { useDocumentTitle } from "@/hooks/useDocumentTitle"
import { useLocale } from "@/hooks/useLocale"
import { formatChartDate, formatDate } from "@/lib/format"
import { appToast } from "@/lib/toast"
import { cn } from "@/lib/utils"
import type { ProgressPhotoPose } from "@/types/progress"

type SubscriberProgressTab = "body" | "photos" | "performance" | "adherence"

const INK = "var(--gym-ink,#111111)"
const ORANGE = "var(--gym-lime,#fb5001)"

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
  if (!values.length) return [60, 100]
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
  useDocumentTitle(isAr ? "متابعة التقدم والقياسات" : "My Progress")

  const {
    staffCanPick,
    directory: subscribers,
    subscriber: currentSubscriber,
    subscriberId,
    selectedSubscriberId,
    setSelectedSubscriberId,
  } = usePanelSubscriber({ allowStaffPicker: true })

  // React Query hooks for real-time progress data (scoped)
  const {
    data: measurements = [],
    isLoading: measurementsLoading,
    isError: measurementsError,
    refetch: refetchMeasurements,
  } = useMeasurementsQuery(subscriberId || undefined)
  const {
    data: photos = [],
    isLoading: photosLoading,
    isError: photosError,
    refetch: refetchPhotos,
  } = usePhotosQuery(subscriberId || undefined)
  const {
    data: lifts = [],
    isLoading: liftsLoading,
    isError: liftsError,
    refetch: refetchLifts,
  } = usePerformanceQuery(subscriberId || undefined)

  const progressLoading =
    measurementsLoading || photosLoading || liftsLoading
  const progressError = measurementsError || photosError || liftsError

  function refetchProgress() {
    void refetchMeasurements()
    void refetchPhotos()
    void refetchLifts()
  }
  const { data: allWorkoutPrograms = [] } = useWorkoutProgramsQuery({
    subscriberId,
    enabled: Boolean(subscriberId),
  })
  const { data: allNutritionPrograms = [] } = useNutritionProgramsQuery({
    subscriberId,
    enabled: Boolean(subscriberId),
  })
  const { data: workoutLogs = [] } = useWorkoutLogsQuery({
    subscriberId,
    enabled: Boolean(subscriberId),
  })
  const { data: nutritionLogs = [] } = useNutritionLogsQuery({
    subscriberId,
    enabled: Boolean(subscriberId),
  })

  const assignedPrograms = useMemo(
    () => ({
      workouts: allWorkoutPrograms,
      nutrition: allNutritionPrograms,
    }),
    [allWorkoutPrograms, allNutritionPrograms],
  )

  // Mutations
  const saveMeasurementMutation = useSaveMeasurementMutation()
  const deleteMeasurementMutation = useDeleteMeasurementMutation()
  const savePhotoMutation = useSavePhotoMutation()
  const deletePhotoMutation = useDeletePhotoMutation()
  const savePerformanceMutation = useSavePerformanceMutation()
  const deletePerformanceMutation = useDeletePerformanceMutation()

  // UI States
  const [tab, setTab] = useState<SubscriberProgressTab>("body")
  const [photoPoseFilter, setPhotoPoseFilter] = useState<
    ProgressPhotoPose | "all"
  >("all")
  const [measurementModalOpen, setMeasurementModalOpen] = useState(false)
  const [photoModalOpen, setPhotoModalOpen] = useState(false)
  const [performanceModalOpen, setPerformanceModalOpen] = useState(false)
  const [compareModalOpen, setCompareModalOpen] = useState(false)
  const [selectedLiftName, setSelectedLiftName] = useState<string>("")
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean
    title: string
    description?: string
    confirmLabel?: string
    tone?: "danger" | "primary" | "warning"
    onConfirm: () => Promise<void> | void
  } | null>(null)

  // Computed metrics (canonical chronological helpers — same as admin)
  const firstMeasurement = firstMeasurementOf(measurements)
  const latestMeasurement = latestMeasurementOf(measurements)
  const currentWeight =
    latestMeasurement?.weightKg ?? currentSubscriber?.startingWeightKg
  const startWeight =
    firstMeasurement?.weightKg ?? currentSubscriber?.startingWeightKg
  const targetWeight = currentSubscriber?.targetWeightKg
  const totalChangeKg =
    currentWeight != null && startWeight != null
      ? Math.round((currentWeight - startWeight) * 10) / 10
      : null

  const weeks = useMemo(
    () =>
      computeAdherenceWeeks({
        workoutLogs,
        nutritionLogs,
        workoutPrograms: assignedPrograms.workouts,
        nutritionPrograms: assignedPrograms.nutrition,
      }),
    [workoutLogs, nutritionLogs, assignedPrograms],
  )
  const week = useMemo(() => latestAdherenceWeek(weeks), [weeks])
  const workoutPct = week ? percent(week.workoutDone, week.workoutTotal) : null
  const nutritionPct = week
    ? percent(week.nutritionDone, week.nutritionTotal)
    : null

  // Body circumference comparisons (First vs Latest)
  const circumferenceDiffs = useMemo(() => {
    const base = firstMeasurementOf(measurements)
    const cur = latestMeasurementOf(measurements)
    if (!base || !cur || base.id === cur.id) return null

    const calc = (c?: number | null, b?: number | null) => {
      if (c == null || b == null) return null
      return Math.round((c - b) * 10) / 10
    }

    return {
      waist: {
        start: base.waistCm,
        current: cur.waistCm,
        diff: calc(cur.waistCm, base.waistCm),
      },
      chest: {
        start: base.chestCm,
        current: cur.chestCm,
        diff: calc(cur.chestCm, base.chestCm),
      },
      arms: {
        start: base.armsCm,
        current: cur.armsCm,
        diff: calc(cur.armsCm, base.armsCm),
      },
      hips: {
        start: base.hipsCm,
        current: cur.hipsCm,
        diff: calc(cur.hipsCm, base.hipsCm),
      },
      thighs: {
        start: base.thighsCm,
        current: cur.thighsCm,
        diff: calc(cur.thighsCm, base.thighsCm),
      },
    }
  }, [measurements])

  // Group lifts by exercise name & calculate PR gains
  const groupedLifts = useMemo(() => {
    const map = new Map<string, typeof lifts>()
    for (const lift of lifts) {
      const list = map.get(lift.name) ?? []
      list.push(lift)
      map.set(lift.name, list)
    }
    return [...map.entries()].map(([name, records]) => {
      const sorted = [...records].sort(
        (a, b) =>
          new Date(a.recordedAt).getTime() - new Date(b.recordedAt).getTime(),
      )
      const first = sorted[0]
      const latest = sorted[sorted.length - 1]
      return {
        name,
        records: sorted,
        first: first.value,
        latest: latest.value,
        delta: Math.round((latest.value - first.value) * 10) / 10,
        unit: latest.unit,
      }
    })
  }, [lifts])

  // Active lift for strength progression chart
  const activeLift = useMemo(() => {
    if (!groupedLifts.length) return null
    return (
      groupedLifts.find((l) => l.name === selectedLiftName) ?? groupedLifts[0]
    )
  }, [groupedLifts, selectedLiftName])

  // Overall Adherence Metrics
  const adherenceSummary = useMemo(() => {
    if (!weeks.length) return null
    const totalWkExpected = weeks.reduce((acc, w) => acc + w.workoutTotal, 0)
    const totalWkDone = weeks.reduce((acc, w) => acc + w.workoutDone, 0)
    const totalNutrExpected = weeks.reduce(
      (acc, w) => acc + w.nutritionTotal,
      0,
    )
    const totalNutrDone = weeks.reduce((acc, w) => acc + w.nutritionDone, 0)

    const overallWk = totalWkExpected
      ? Math.round((totalWkDone / totalWkExpected) * 100)
      : 0
    const overallNutr = totalNutrExpected
      ? Math.round((totalNutrDone / totalNutrExpected) * 100)
      : 0
    const streak = weeks.filter((w) => {
      const wP = w.workoutTotal ? (w.workoutDone / w.workoutTotal) * 100 : 100
      const nP = w.nutritionTotal
        ? (w.nutritionDone / w.nutritionTotal) * 100
        : 100
      return wP >= 70 && nP >= 70
    }).length

    return {
      overallWk,
      overallNutr,
      totalWkDone,
      totalWkExpected,
      totalNutrDone,
      totalNutrExpected,
      streak,
    }
  }, [weeks])

  // Filtered photos by pose
  const filteredPhotos = useMemo(() => {
    if (photoPoseFilter === "all") return photos
    return photos.filter((p) => p.pose === photoPoseFilter)
  }, [photos, photoPoseFilter])

  // Security Guard: Deny access if subscriber account is not authorized
  if (!currentSubscriber) {
    return (
      <div className="flex min-h-80 flex-col items-center justify-center rounded-[28px] bg-white p-8 text-center shadow-xs border border-black/6">
        <div className="flex size-14 items-center justify-center rounded-3xl bg-black/5 text-[var(--gym-lime,#fb5001)] mb-4">
          <Lock className="size-7" />
        </div>
        <h2 className="font-heading text-[20px] font-black text-[var(--gym-ink,#111111)]">
          {isAr ? "سجلات التقدم محمية وخاصة" : "Protected Progress Records"}
        </h2>
        <p className="mt-1.5 max-w-md text-[13px] font-medium text-[#6B7280]">
          {isAr
            ? "لا يمكنك استعراض سجلات التقدم إلا بعد تسجيل الدخول بحساب المشترك المعتمد صاحب هذه السجلات."
            : "You can only view progress records when authenticated as the authorized subscriber or coaching staff."}
        </p>
        <Link
          to={APP_ROUTES.public.login}
          className="mt-5 inline-flex h-11 items-center justify-center rounded-full bg-[var(--gym-ink,#111111)] px-6 text-[13px] font-extrabold text-white transition hover:bg-[var(--gym-lime,#fb5001)]"
        >
          {isAr ? "تسجيل الدخول" : "Sign in"}
        </Link>
      </div>
    )
  }

  if (progressLoading) {
    return (
      <div className="flex min-h-64 flex-col items-center justify-center gap-2 rounded-[28px] bg-white p-8 text-center shadow-xs border border-black/6">
        <Scale className="size-8 animate-pulse text-[var(--gym-lime,#fb5001)]" />
        <p className="text-[13px] font-medium text-[#8c8c8c]">
          {isAr
            ? "جاري تحميل سجلات التقدم المحمية..."
            : "Loading your protected progress records..."}
        </p>
      </div>
    )
  }

  if (progressError) {
    return (
      <div className="flex min-h-64 flex-col items-center justify-center gap-3 rounded-[28px] bg-white p-8 text-center shadow-xs border border-black/6">
        <Lock className="size-10 text-rose-500 stroke-1" />
        <h2 className="font-heading text-[18px] font-extrabold text-[var(--gym-ink,#111111)]">
          {isAr ? "تعذر تحميل التقدم" : "Could not load progress"}
        </h2>
        <p className="max-w-md text-[13px] text-[#8c8c8c]">
          {isAr
            ? "سجلات الوزن والقياسات والصور محمية بصلاحيات الحساب. أعد المحاولة أو تواصل مع المدرب."
            : "Weight, measurements, and photos are account-protected. Retry or contact your coach."}
        </p>
        <button
          type="button"
          onClick={refetchProgress}
          className="inline-flex items-center gap-2 rounded-full bg-[var(--gym-ink,#111111)] px-4 py-2 text-[12px] font-bold text-white"
        >
          {isAr ? "إعادة المحاولة" : "Retry"}
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-5 pb-12">
      {/* ======================================================== */}
      {/* 1. Clean Top Header & Metric Highlights                  */}
      {/* ======================================================== */}
      <div className="flex flex-col gap-4">
        {/* Top Header Row */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-heading text-[20px] sm:text-[23px] font-black text-[var(--gym-ink,#111111)] tracking-tight">
                {isAr ? "التقدم والقياسات" : "Progress & Check-ins"}
              </h1>
              <StatusBadge label={isAr ? "نشط" : "Active"} tone="success" />
            </div>
            <p className="mt-0.5 text-[12px] sm:text-[13px] font-medium text-[#6B7280]">
              {isAr
                ? "سجل وزن الجسم، القياسات الدورية، صور التحول، والأرقام الرياضية"
                : "Track body weight, circumferences, transformation photos, and lift PRs."}
            </p>
          </div>

          {/* Action Buttons Row */}
          <div className="flex items-center gap-2">
            {/* Admin Member Switcher (Only visible to admin staff) */}
            {staffCanPick && currentSubscriber ? (
              <div className="flex items-center gap-1.5 rounded-full bg-[#F4F4F4] px-3 py-1.5 text-[11.5px] font-bold text-[var(--gym-ink,#111111)] border border-black/8">
                <ShieldCheck className="size-3.5 text-[var(--gym-lime,#fb5001)]" />
                <span className="hidden xs:inline">
                  {isAr ? "معاينة:" : "Member:"}
                </span>
                <select
                  value={selectedSubscriberId || currentSubscriber.id}
                  onChange={(e) => setSelectedSubscriberId(e.target.value)}
                  className="rounded-lg bg-white px-2 py-0.5 text-[11.5px] font-bold outline-none"
                >
                  {subscribers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.displayName}
                    </option>
                  ))}
                </select>
              </div>
            ) : null}

            {/* Log Measurement Button */}
            <button
              type="button"
              onClick={() => setMeasurementModalOpen(true)}
              className="inline-flex h-9.5 sm:h-10 items-center justify-center gap-1.5 rounded-full bg-[var(--gym-ink,#111111)] hover:bg-[var(--gym-lime,#fb5001)] px-3.5 sm:px-4.5 text-[12px] sm:text-[12.5px] font-extrabold text-white shadow-2xs transition-all active:scale-95"
            >
              <Plus className="size-3.5" strokeWidth={2.5} />
              <span>{isAr ? "تسجيل قياسات" : "Log Check-in"}</span>
            </button>

            {/* Add Photo Button */}
            <button
              type="button"
              onClick={() => setPhotoModalOpen(true)}
              className="inline-flex h-9.5 sm:h-10 items-center justify-center gap-1.5 rounded-full bg-[#F4F4F4] hover:bg-[#ECECEC] px-3.5 sm:px-4 text-[12px] sm:text-[12.5px] font-bold text-[var(--gym-ink,#111111)] transition-all active:scale-95"
            >
              <Camera className="size-3.5" />
              <span>{isAr ? "رفع صورة" : "Add Photo"}</span>
            </button>
          </div>
        </div>

        {/* 4 Metric Highlight Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {/* 1. Current Weight */}
          <div className="rounded-[20px] bg-white p-3.5 sm:p-4 border border-black/6 shadow-2xs flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[12px] font-bold text-[#8c8c8c]">
                {isAr ? "الوزن الحالي" : "Current Weight"}
              </span>
              <span className="flex size-7 items-center justify-center rounded-xl bg-black/5 text-[var(--gym-lime,#fb5001)]">
                <Scale className="size-3.5" />
              </span>
            </div>
            <div className="mt-2 flex items-baseline gap-1.5">
              <span className="font-heading text-[22px] font-black text-[var(--gym-ink,#111111)]">
                {currentWeight != null ? `${currentWeight}` : "—"}
              </span>
              <span className="text-[12px] font-bold text-[#8c8c8c]">kg</span>
            </div>
          </div>

          {/* 2. Target Weight */}
          <div className="rounded-[20px] bg-white p-3.5 sm:p-4 border border-black/6 shadow-2xs flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[12px] font-bold text-[#8c8c8c]">
                {isAr ? "الوزن المستهدف" : "Goal Target"}
              </span>
              <span className="flex size-7 items-center justify-center rounded-xl bg-black/5 text-[var(--gym-lime,#fb5001)]">
                <Target className="size-3.5" />
              </span>
            </div>
            <div className="mt-2 flex items-baseline gap-1.5">
              <span className="font-heading text-[22px] font-black text-[var(--gym-ink,#111111)]">
                {targetWeight != null ? `${targetWeight}` : "—"}
              </span>
              <span className="text-[12px] font-bold text-[#8c8c8c]">kg</span>
            </div>
          </div>

          {/* 3. Total Change */}
          <div className="rounded-[20px] bg-white p-3.5 sm:p-4 border border-black/6 shadow-2xs flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[12px] font-bold text-[#8c8c8c]">
                {isAr ? "التغير الكلي" : "Net Transformation"}
              </span>
              <span className="flex size-7 items-center justify-center rounded-xl bg-black/5 text-[var(--gym-lime,#fb5001)]">
                {totalChangeKg && totalChangeKg < 0 ? (
                  <TrendingDown className="size-3.5" />
                ) : (
                  <TrendingUp className="size-3.5" />
                )}
              </span>
            </div>
            <div className="mt-2 flex items-baseline gap-1.5">
              <span className="font-heading text-[22px] font-black text-[var(--gym-lime,#fb5001)]">
                {totalChangeKg != null ? `${signed(totalChangeKg)}` : "0.0"}
              </span>
              <span className="text-[12px] font-bold text-[#8c8c8c]">kg</span>
            </div>
          </div>

          {/* 4. Weekly Consistency */}
          <div className="rounded-[20px] bg-white p-3.5 sm:p-4 border border-black/6 shadow-2xs flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[12px] font-bold text-[#8c8c8c]">
                {isAr ? "التزام الأسبوع" : "Weekly Consistency"}
              </span>
              <span className="flex size-7 items-center justify-center rounded-xl bg-black/5 text-[var(--gym-lime,#fb5001)]">
                <Flame className="size-3.5" />
              </span>
            </div>
            <div className="mt-2 flex items-baseline gap-1.5">
              <span className="font-heading text-[22px] font-black text-[var(--gym-ink,#111111)]">
                {workoutPct != null ? `${workoutPct}%` : "—"}
              </span>
              {nutritionPct != null ? (
                <span className="text-[11px] font-semibold text-[#8c8c8c]">
                  ({nutritionPct}% {isAr ? "تغذية" : "nutr"})
                </span>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 2. Main Progress Navigation & Tabs                       */}
      {/* ======================================================== */}
      <section className="rounded-[26px] bg-white p-4 sm:p-6 shadow-xs border border-black/6">
        {/* Navigation Tabs Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-black/6 pb-4">
          <div className="flex gap-2 overflow-x-auto no-scrollbar">
            <FilterChip active={tab === "body"} onClick={() => setTab("body")}>
              <Scale className="size-3.5 me-1 inline-block" />
              {isAr ? "الوزن والقياسات" : "Weight & Measurements"}
            </FilterChip>
            <FilterChip
              active={tab === "photos"}
              onClick={() => setTab("photos")}
            >
              <Camera className="size-3.5 me-1 inline-block" />
              {isAr ? "صور التقدم" : "Progress Photos"} ({photos.length})
            </FilterChip>
            <FilterChip
              active={tab === "performance"}
              onClick={() => setTab("performance")}
            >
              <Trophy className="size-3.5 me-1 inline-block" />
              {isAr ? "الأرقام الرياضية PR" : "Lifts & PRs"}
            </FilterChip>
            <FilterChip
              active={tab === "adherence"}
              onClick={() => setTab("adherence")}
            >
              <Flame className="size-3.5 me-1 inline-block" />
              {isAr ? "سجل الالتزام" : "Consistency"}
            </FilterChip>
          </div>

          <p className="hidden text-[12px] font-medium text-[#8c8c8c] sm:flex items-center gap-1.5">
            <ShieldCheck className="size-4 text-[var(--gym-lime,#fb5001)]" />
            {isAr
              ? "سجلاتك خاصة ومشفرة ولا تظهر إلا لك ولمدربك"
              : "Private records visible only to you and your coach"}
          </p>
        </div>

        {/* ====================================================== */}
        {/* Tab 1: Weight & Measurements                           */}
        {/* ====================================================== */}
        {tab === "body" && (
          <div className="mt-5 space-y-6">
            {/* Weight Trend Chart */}
            <div className="rounded-[22px] bg-[#F9F9F9] p-4 sm:p-5 border border-black/4">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h3 className="font-heading text-[16px] font-extrabold text-[var(--gym-ink,#111111)]">
                    {isAr ? "مسار تطور وزن الجسم" : "Body Weight Trend"}
                  </h3>
                  <p className="text-[12px] text-[#8c8c8c]">
                    {isAr
                      ? "متابعة أسبوعية دقيقة مقارنة بالهدف التدريبي"
                      : "Weigh-in progression plotted against your target goal"}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setMeasurementModalOpen(true)}
                  className="rounded-full bg-white px-3.5 py-1.5 text-[12px] font-bold text-[var(--gym-ink,#111111)] shadow-2xs hover:bg-[#F4F4F4] transition border border-black/5"
                >
                  {isAr ? "+ تسجيل وزن جديد" : "+ New Weigh-in"}
                </button>
              </div>

              {measurements.length >= 2 ? (
                <div className="h-[240px] w-full sm:h-[280px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={measurements
                        .filter((m) => m.weightKg != null)
                        .map((m) => ({
                          date: formatChartDate(m.recordedAt, locale),
                          kg: m.weightKg,
                        }))}
                      margin={{ top: 12, right: 12, left: -10, bottom: 4 }}
                    >
                      <defs>
                        <linearGradient
                          id="subWeightFill"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop
                            offset="0%"
                            stopColor="#111111"
                            stopOpacity={0.22}
                          />
                          <stop
                            offset="100%"
                            stopColor="#111111"
                            stopOpacity={0}
                          />
                        </linearGradient>
                      </defs>
                      <CartesianGrid
                        stroke="#E8E8E8"
                        strokeDasharray="3 3"
                        vertical={false}
                      />
                      <XAxis
                        dataKey="date"
                        tick={{ fill: "#8c8c8c", fontSize: 11 }}
                        axisLine={false}
                        tickLine={false}
                        tickMargin={10}
                      />
                      <YAxis
                        domain={weightDomain(
                          measurements
                            .filter((m) => m.weightKg != null)
                            .map((m) => m.weightKg as number),
                        )}
                        tick={{ fill: "#8c8c8c", fontSize: 11 }}
                        axisLine={false}
                        tickLine={false}
                        tickMargin={10}
                        width={40}
                      />
                      <Tooltip
                        contentStyle={{
                          background: "#111111",
                          border: "none",
                          borderRadius: 12,
                          color: "#fff",
                          fontSize: 12,
                          fontWeight: 700,
                        }}
                        formatter={(val) => [
                          `${val} kg`,
                          isAr ? "الوزن" : "Weight",
                        ]}
                      />
                      {targetWeight != null ? (
                        <ReferenceLine
                          y={targetWeight}
                          stroke={ORANGE}
                          strokeDasharray="4 4"
                          strokeWidth={1.5}
                          label={{
                            value: isAr
                              ? `الهدف: ${targetWeight}kg`
                              : `Goal: ${targetWeight}kg`,
                            fill: ORANGE,
                            fontSize: 11,
                            position: "insideTopRight",
                          }}
                        />
                      ) : null}
                      <Area
                        type="monotone"
                        dataKey="kg"
                        stroke={INK}
                        strokeWidth={2.5}
                        fill="url(#subWeightFill)"
                        dot={{
                          r: 4,
                          fill: INK,
                          stroke: "#fff",
                          strokeWidth: 2,
                        }}
                        activeDot={{
                          r: 6,
                          fill: INK,
                          stroke: "#fff",
                          strokeWidth: 2,
                        }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="flex h-44 items-center justify-center text-[13px] font-medium text-[#8c8c8c]">
                  {isAr
                    ? "سجل قراءتين على الأقل لعرض الرسم البياني"
                    : "Log at least two weigh-ins to see the progress chart"}
                </div>
              )}
            </div>

            {/* Circumference Baseline vs Current Diff Cards */}
            {circumferenceDiffs ? (
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <h4 className="text-[13px] font-extrabold uppercase tracking-wider text-[#8c8c8c]">
                    {isAr
                      ? "تغير محيط أجزاء الجسم منذ البداية"
                      : "Circumference Progress (Baseline vs Now)"}
                  </h4>
                  <span className="text-[11.5px] font-bold text-[var(--gym-lime,#fb5001)]">
                    {measurements.length} {isAr ? "قياسات مسجلة" : "check-ins"}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-5">
                  {/* Waist */}
                  <div className="rounded-2xl border border-black/5 bg-[#F9F9F9] p-3 text-center">
                    <span className="text-[11px] font-bold text-[#8c8c8c]">
                      {isAr ? "الخصر" : "Waist"}
                    </span>
                    <p className="mt-1 font-heading text-[18px] font-black text-[var(--gym-ink,#111111)]">
                      {circumferenceDiffs.waist.current != null
                        ? `${circumferenceDiffs.waist.current} cm`
                        : "—"}
                    </p>
                    {circumferenceDiffs.waist.diff != null ? (
                      <span
                        className={cn(
                          "mt-0.5 inline-block text-[11px] font-bold",
                          circumferenceDiffs.waist.diff < 0
                            ? "text-[var(--gym-lime,#fb5001)]"
                            : "text-[#8c8c8c]",
                        )}
                      >
                        {signed(circumferenceDiffs.waist.diff)} cm
                      </span>
                    ) : null}
                  </div>

                  {/* Chest */}
                  <div className="rounded-2xl border border-black/5 bg-[#F9F9F9] p-3 text-center">
                    <span className="text-[11px] font-bold text-[#8c8c8c]">
                      {isAr ? "الصدر" : "Chest"}
                    </span>
                    <p className="mt-1 font-heading text-[18px] font-black text-[var(--gym-ink,#111111)]">
                      {circumferenceDiffs.chest.current != null
                        ? `${circumferenceDiffs.chest.current} cm`
                        : "—"}
                    </p>
                    {circumferenceDiffs.chest.diff != null ? (
                      <span className="mt-0.5 inline-block text-[11px] font-bold text-[var(--gym-lime,#fb5001)]">
                        {signed(circumferenceDiffs.chest.diff)} cm
                      </span>
                    ) : null}
                  </div>

                  {/* Arms */}
                  <div className="rounded-2xl border border-black/5 bg-[#F9F9F9] p-3 text-center">
                    <span className="text-[11px] font-bold text-[#8c8c8c]">
                      {isAr ? "الذراع" : "Arms"}
                    </span>
                    <p className="mt-1 font-heading text-[18px] font-black text-[var(--gym-ink,#111111)]">
                      {circumferenceDiffs.arms.current != null
                        ? `${circumferenceDiffs.arms.current} cm`
                        : "—"}
                    </p>
                    {circumferenceDiffs.arms.diff != null ? (
                      <span className="mt-0.5 inline-block text-[11px] font-bold text-[var(--gym-lime,#fb5001)]">
                        {signed(circumferenceDiffs.arms.diff)} cm
                      </span>
                    ) : null}
                  </div>

                  {/* Hips */}
                  <div className="rounded-2xl border border-black/5 bg-[#F9F9F9] p-3 text-center">
                    <span className="text-[11px] font-bold text-[#8c8c8c]">
                      {isAr ? "الوركين" : "Hips"}
                    </span>
                    <p className="mt-1 font-heading text-[18px] font-black text-[var(--gym-ink,#111111)]">
                      {circumferenceDiffs.hips.current != null
                        ? `${circumferenceDiffs.hips.current} cm`
                        : "—"}
                    </p>
                    {circumferenceDiffs.hips.diff != null ? (
                      <span
                        className={cn(
                          "mt-0.5 inline-block text-[11px] font-bold",
                          circumferenceDiffs.hips.diff < 0
                            ? "text-[var(--gym-lime,#fb5001)]"
                            : "text-[#8c8c8c]",
                        )}
                      >
                        {signed(circumferenceDiffs.hips.diff)} cm
                      </span>
                    ) : null}
                  </div>

                  {/* Thighs */}
                  <div className="rounded-2xl border border-black/5 bg-[#F9F9F9] p-3 text-center">
                    <span className="text-[11px] font-bold text-[#8c8c8c]">
                      {isAr ? "الفخذين" : "Thighs"}
                    </span>
                    <p className="mt-1 font-heading text-[18px] font-black text-[var(--gym-ink,#111111)]">
                      {circumferenceDiffs.thighs.current != null
                        ? `${circumferenceDiffs.thighs.current} cm`
                        : "—"}
                    </p>
                    {circumferenceDiffs.thighs.diff != null ? (
                      <span className="mt-0.5 inline-block text-[11px] font-bold text-[var(--gym-lime,#fb5001)]">
                        {signed(circumferenceDiffs.thighs.diff)} cm
                      </span>
                    ) : null}
                  </div>
                </div>
              </div>
            ) : null}

            {/* Detailed Measurements Table */}
            <div className="rounded-[22px] bg-[#F9F9F9] p-4 sm:p-5 border border-black/4">
              <h3 className="mb-3 font-heading text-[16px] font-extrabold text-[var(--gym-ink,#111111)]">
                {isAr ? "سجل القياسات الكامل" : "Detailed Check-in Log"}
              </h3>
              {measurements.length === 0 ? (
                <p className="text-[13px] text-[#8c8c8c]">
                  {isAr
                    ? "لا توجد قياسات مسجلة بعد."
                    : "No measurements logged yet."}
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[640px] text-start text-[13px]">
                    <thead>
                      <tr className="border-b border-black/6 text-[11px] font-extrabold uppercase tracking-wider text-[#8c8c8c]">
                        <th className="pb-2.5 font-bold pe-3">
                          {isAr ? "التاريخ" : "Date"}
                        </th>
                        <th className="pb-2.5 font-bold pe-3">
                          {isAr ? "الوزن" : "Weight"}
                        </th>
                        <th className="pb-2.5 font-bold pe-3">
                          {isAr ? "الخصر" : "Waist"}
                        </th>
                        <th className="pb-2.5 font-bold pe-3">
                          {isAr ? "الصدر" : "Chest"}
                        </th>
                        <th className="pb-2.5 font-bold pe-3">
                          {isAr ? "الوركين" : "Hips"}
                        </th>
                        <th className="pb-2.5 font-bold pe-3">
                          {isAr ? "الذراع" : "Arms"}
                        </th>
                        <th className="pb-2.5 font-bold pe-3">
                          {isAr ? "الفخذ" : "Thighs"}
                        </th>
                        <th className="pb-2.5 font-bold">
                          {isAr ? "ملاحظات" : "Notes"}
                        </th>
                        <th className="pb-2.5 font-bold text-end"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {[...measurements].reverse().map((row, idx, arr) => {
                        const older =
                          idx < arr.length - 1 ? arr[idx + 1] : undefined
                        const weightDiff =
                          row.weightKg != null && older?.weightKg != null
                            ? Math.round((row.weightKg - older.weightKg) * 10) /
                              10
                            : null

                        return (
                          <tr
                            key={row.id}
                            className="border-b border-black/4 font-medium text-[var(--gym-ink,#111111)] hover:bg-black/2 transition"
                          >
                            <td className="py-3 pe-3 whitespace-nowrap font-bold">
                              {formatDate(row.recordedAt, locale)}
                            </td>
                            <td className="py-3 pe-3 font-extrabold whitespace-nowrap">
                              {row.weightKg != null
                                ? `${row.weightKg} kg`
                                : "—"}
                              {weightDiff != null ? (
                                <span className="ms-1.5 text-[11px] font-bold text-[var(--gym-lime,#fb5001)]">
                                  {signed(weightDiff)}
                                </span>
                              ) : null}
                            </td>
                            <td className="py-3 pe-3">
                              {row.waistCm != null ? `${row.waistCm} cm` : "—"}
                            </td>
                            <td className="py-3 pe-3">
                              {row.chestCm != null ? `${row.chestCm} cm` : "—"}
                            </td>
                            <td className="py-3 pe-3">
                              {row.hipsCm != null ? `${row.hipsCm} cm` : "—"}
                            </td>
                            <td className="py-3 pe-3">
                              {row.armsCm != null ? `${row.armsCm} cm` : "—"}
                            </td>
                            <td className="py-3 pe-3">
                              {row.thighsCm != null
                                ? `${row.thighsCm} cm`
                                : "—"}
                            </td>
                            <td className="py-3 text-[12px] text-[#6B7280]">
                              {row.notes || "—"}
                            </td>
                            <td className="py-3 text-end">
                              <button
                                type="button"
                                onClick={() => {
                                  setConfirmDialog({
                                    open: true,
                                    title: isAr
                                      ? "حذف سجل القياسات"
                                      : "Delete Check-in Record",
                                    description: isAr
                                      ? `هل أنت متأكد من حذف قياس تاريخ ${formatDate(row.recordedAt, locale)}؟ لا يمكن التراجع عن هذا الإجراء.`
                                      : `Are you sure you want to delete the check-in from ${formatDate(row.recordedAt, locale)}? This action cannot be undone.`,
                                    confirmLabel: isAr
                                      ? "تأكيد الحذف"
                                      : "Delete Record",
                                    tone: "danger",
                                    onConfirm: async () => {
                                      await deleteMeasurementMutation.mutateAsync({
                                        id: row.id,
                                        subscriberId: row.subscriberId,
                                      })
                                      appToast.success(
                                        isAr ? "تم الحذف بنجاح" : "Record deleted",
                                      )
                                    },
                                  })
                                }}
                                className="p-1 text-[#8c8c8c] hover:text-[#C44536] transition"
                                title={isAr ? "حذف السجل" : "Delete"}
                              >
                                <Trash2 className="size-3.5" />
                              </button>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ====================================================== */}
        {/* Tab 2: Progress Photos                                 */}
        {/* ====================================================== */}
        {tab === "photos" && (
          <div className="mt-5 space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="font-heading text-[16px] font-extrabold text-[var(--gym-ink,#111111)]">
                  {isAr
                    ? "معرض صور التقدم والتحول البدني"
                    : "Your Transformation Gallery"}
                </h3>
                <p className="text-[12px] text-[#8c8c8c]">
                  {isAr
                    ? "الصور مرئية لك وللمدرب فقط لتقييم الفارق والنتائج"
                    : "Encrypted and visible only to you and your coach"}
                </p>
              </div>

              {/* Action Buttons: Compare & Upload */}
              <div className="flex items-center gap-2">
                {photos.length >= 2 ? (
                  <button
                    type="button"
                    onClick={() => setCompareModalOpen(true)}
                    className="inline-flex h-9.5 items-center gap-1.5 rounded-full bg-[#F4F4F4] px-4 text-[12px] font-extrabold text-[var(--gym-ink,#111111)] hover:bg-[#ececec] transition"
                  >
                    <ArrowLeftRight className="size-3.5" />
                    <span>
                      {isAr ? "مقارنة جنباً إلى جنب" : "Side-by-Side Compare"}
                    </span>
                  </button>
                ) : null}

                <button
                  type="button"
                  onClick={() => setPhotoModalOpen(true)}
                  className="inline-flex h-9.5 items-center gap-1.5 rounded-full bg-[var(--gym-ink,#111111)] hover:bg-[var(--gym-lime,#fb5001)] px-4.5 text-[12px] font-extrabold text-white transition active:scale-95"
                >
                  <Plus className="size-3.5" />
                  <span>{isAr ? "رفع صورة جديدة" : "Add Photo"}</span>
                </button>
              </div>
            </div>

            {/* Pose Filter Buttons */}
            {photos.length > 0 ? (
              <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                {(["all", "front", "side", "back"] as const).map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPhotoPoseFilter(p)}
                    className={cn(
                      "rounded-full px-3.5 py-1 text-[11.5px] font-bold transition",
                      photoPoseFilter === p
                        ? "bg-[var(--gym-ink,#111111)] text-white shadow-2xs"
                        : "bg-[#F4F4F4] text-[#6B7280] hover:text-[var(--gym-ink,#111111)]",
                    )}
                  >
                    {p === "all"
                      ? isAr
                        ? "الكل"
                        : "All"
                      : p === "front"
                        ? isAr
                          ? "أمامي"
                          : "Front"
                        : p === "side"
                          ? isAr
                            ? "جانبي"
                            : "Side"
                          : isAr
                            ? "خلفي"
                            : "Back"}
                  </button>
                ))}
              </div>
            ) : null}

            {filteredPhotos.length === 0 ? (
              <div className="flex min-h-52 flex-col items-center justify-center rounded-[22px] bg-[#F9F9F9] p-6 text-center text-[#8c8c8c] border border-black/4">
                <Camera className="size-8 stroke-[1.5] text-[var(--gym-lime,#fb5001)]" />
                <p className="mt-2 text-[14px] font-bold text-[var(--gym-ink,#111111)]">
                  {isAr
                    ? "لم تقم برفع صور تقدم حتى الآن"
                    : "No progress photos uploaded yet"}
                </p>
                <p className="mt-0.5 max-w-sm text-[12px]">
                  {isAr
                    ? "التقط صوراً دورية بنفس الإضاءة والزوايا لملاحظة الفرق في تكوين جسمك!"
                    : "Upload consistent check-in photos to track visual transformation!"}
                </p>
                <button
                  type="button"
                  onClick={() => setPhotoModalOpen(true)}
                  className="mt-4 rounded-full bg-[var(--gym-ink,#111111)] hover:bg-[var(--gym-lime,#fb5001)] px-5 py-2 text-[12px] font-bold text-white shadow-sm transition"
                >
                  {isAr ? "رفع صورتك الأولى" : "Upload your first photo"}
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-3 lg:grid-cols-4">
                {filteredPhotos.map((item) => (
                  <figure
                    key={item.id}
                    className="group relative overflow-hidden rounded-[22px] bg-[var(--gym-ink,#111111)] text-white shadow-xs border border-black/6"
                  >
                    <div className="relative flex aspect-[3/4] items-center justify-center bg-black/40">
                      <ProgressPhotoImage
                        photo={item}
                        imgClassName="group-hover:scale-105 transition-transform duration-300"
                      />

                      {/* Pose badge */}
                      <span className="absolute bottom-2.5 start-2.5 rounded-lg bg-black/70 px-2 py-0.5 text-[10px] font-bold uppercase backdrop-blur-xs">
                        {item.pose
                          ? t(`admin.progress.pose.${item.pose}`)
                          : "Photo"}
                      </span>

                      {/* Delete button on hover */}
                      <button
                        type="button"
                        onClick={() => {
                          setConfirmDialog({
                            open: true,
                            title: isAr
                              ? "حذف صورة التقدم"
                              : "Delete Progress Photo",
                            description: isAr
                              ? "هل ترغب في حذف هذه الصورة نهائياً؟ لن تظهر مجدداً في مقارنات التحول."
                              : "Are you sure you want to permanently delete this progress photo? It will no longer appear in transformation comparisons.",
                            confirmLabel: isAr
                              ? "تأكيد الحذف"
                              : "Delete Photo",
                            tone: "danger",
                            onConfirm: async () => {
                              await deletePhotoMutation.mutateAsync({
                                id: item.id,
                                subscriberId: item.subscriberId,
                              })
                              appToast.success(
                                isAr ? "تم حذف الصورة بنجاح" : "Photo deleted",
                              )
                            },
                          })
                        }}
                        className="absolute top-2.5 end-2.5 flex size-7 items-center justify-center rounded-full bg-black/60 text-white/80 opacity-0 group-hover:opacity-100 transition hover:bg-[#C44536] hover:text-white"
                        title={isAr ? "حذف الصورة" : "Delete photo"}
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>

                    <figcaption className="p-3 text-[11px] font-bold text-white/85 flex items-center justify-between">
                      <span>{formatDate(item.takenAt, locale)}</span>
                      {photos.length >= 2 ? (
                        <button
                          type="button"
                          onClick={() => setCompareModalOpen(true)}
                          className="text-[10px] font-bold text-[var(--gym-lime,#fb5001)] hover:underline"
                        >
                          {isAr ? "مقارنة" : "Compare"}
                        </button>
                      ) : null}
                    </figcaption>
                  </figure>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ====================================================== */}
        {/* Tab 3: Performance & Lifts                             */}
        {/* ====================================================== */}
        {tab === "performance" && (
          <div className="mt-5 space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="font-heading text-[16px] font-extrabold text-[var(--gym-ink,#111111)]">
                  {isAr
                    ? "الأرقام الرياضية وأفضل الإنجازات (PR)"
                    : "Personal Records & Lift Progression"}
                </h3>
                <p className="text-[12px] text-[#8c8c8c]">
                  {isAr
                    ? "متابعة تطور القوة والأوزان المرفوعة مع الوقت"
                    : "Strength gains and heavy load milestones over your training block"}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setPerformanceModalOpen(true)}
                className="inline-flex h-9.5 items-center gap-1.5 rounded-full bg-[var(--gym-ink,#111111)] hover:bg-[var(--gym-lime,#fb5001)] px-4.5 text-[12px] font-extrabold text-white transition active:scale-95"
              >
                <Plus className="size-3.5" />
                <span>{isAr ? "تسجيل رقم جديد" : "Log PR"}</span>
              </button>
            </div>

            {/* PR Summary Cards */}
            {groupedLifts.length ? (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                {groupedLifts.map((lift) => (
                  <button
                    key={lift.name}
                    type="button"
                    onClick={() => setSelectedLiftName(lift.name)}
                    className={cn(
                      "rounded-2xl border p-4 text-start transition",
                      (activeLift?.name === lift.name)
                        ? "border-[var(--gym-lime,#fb5001)] bg-[var(--gym-lime,#fb5001)]/5 shadow-2xs"
                        : "border-black/5 bg-[#F9F9F9] hover:border-black/15",
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <p className="text-[12px] font-extrabold text-[#8c8c8c]">
                        {lift.name}
                      </p>
                      <Trophy className="size-3.5 text-[var(--gym-lime,#fb5001)]" />
                    </div>
                    <p className="mt-1 font-heading text-[24px] font-black text-[var(--gym-ink,#111111)]">
                      {lift.latest} {lift.unit}
                    </p>
                    <p className="mt-1 text-[11.5px] font-bold text-[var(--gym-lime,#fb5001)] flex items-center gap-1">
                      <ArrowUpRight className="size-3" />
                      <span>
                        {signed(lift.delta)} {lift.unit}{" "}
                        {isAr ? "منذ البداية" : "gain"}
                      </span>
                    </p>
                  </button>
                ))}
              </div>
            ) : null}

            {/* Interactive Strength Progression Chart */}
            {activeLift && activeLift.records.length >= 2 ? (
              <div className="rounded-[22px] bg-[#F9F9F9] p-4 sm:p-5 border border-black/4">
                <div className="mb-2 flex items-center justify-between">
                  <div>
                    <h4 className="font-heading text-[15px] font-bold text-[var(--gym-ink,#111111)]">
                      {isAr
                        ? `مسار تطور القوة — ${activeLift.name}`
                        : `Strength Trend — ${activeLift.name}`}
                    </h4>
                    <p className="text-[11.5px] text-[#8c8c8c]">
                      {isAr
                        ? "الأوزان المسجلة عبر الحصص التدريبية"
                        : "Lift progression curve across training sessions"}
                    </p>
                  </div>
                  <span className="rounded-full bg-white px-3 py-1 text-[11px] font-bold text-[var(--gym-ink,#111111)] border border-black/8">
                    {isAr ? "الرقم القياسي:" : "Current PR:"} {activeLift.latest}{" "}
                    {activeLift.unit}
                  </span>
                </div>

                <div className="h-[210px] w-full sm:h-[240px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={activeLift.records.map((r) => ({
                        date: formatChartDate(r.recordedAt, locale),
                        val: r.value,
                        notes: r.notes,
                      }))}
                      margin={{ top: 10, right: 10, left: -10, bottom: 4 }}
                    >
                      <CartesianGrid
                        stroke="#E8E8E8"
                        strokeDasharray="3 3"
                        vertical={false}
                      />
                      <XAxis
                        dataKey="date"
                        tick={{ fill: "#8c8c8c", fontSize: 11 }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        tick={{ fill: "#8c8c8c", fontSize: 11 }}
                        axisLine={false}
                        tickLine={false}
                        width={40}
                      />
                      <Tooltip
                        contentStyle={{
                          background: "#111111",
                          border: "none",
                          borderRadius: 12,
                          color: "#fff",
                          fontSize: 12,
                          fontWeight: 700,
                        }}
                        formatter={(val) => [`${val} ${activeLift.unit}`, activeLift.name]}
                      />
                      <Area
                        type="monotone"
                        dataKey="val"
                        stroke={ORANGE}
                        strokeWidth={2.5}
                        fill="rgba(251,80,1,0.12)"
                        dot={{
                          r: 4,
                          fill: ORANGE,
                          stroke: "#fff",
                          strokeWidth: 2,
                        }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            ) : null}

            {/* Lifts Table */}
            <div className="rounded-[22px] bg-[#F9F9F9] p-4 sm:p-5 border border-black/4">
              <h4 className="mb-3 text-[14px] font-extrabold text-[var(--gym-ink,#111111)]">
                {isAr ? "سجل التمارين والأوزان" : "Lifts Log"}
              </h4>
              {lifts.length === 0 ? (
                <p className="text-[13px] text-[#8c8c8c]">
                  {isAr
                    ? "لا توجد أرقام مسجلة بعد."
                    : "No lift records logged yet."}
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[480px] text-start text-[13px]">
                    <thead>
                      <tr className="border-b border-black/6 text-[11px] font-extrabold uppercase tracking-wider text-[#8c8c8c]">
                        <th className="pb-2.5 font-bold pe-3">
                          {isAr ? "التاريخ" : "Date"}
                        </th>
                        <th className="pb-2.5 font-bold pe-3">
                          {isAr ? "التمرين" : "Exercise"}
                        </th>
                        <th className="pb-2.5 font-bold pe-3">
                          {isAr ? "الوزن / التكرار" : "Load / Reps"}
                        </th>
                        <th className="pb-2.5 font-bold">
                          {isAr ? "ملاحظات" : "Notes"}
                        </th>
                        <th className="pb-2.5 font-bold text-end"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {[...lifts].reverse().map((row) => (
                        <tr
                          key={row.id}
                          className="border-b border-black/4 font-medium text-[var(--gym-ink,#111111)] hover:bg-black/2 transition"
                        >
                          <td className="py-2.5 pe-3 whitespace-nowrap font-bold">
                            {formatDate(row.recordedAt, locale)}
                          </td>
                          <td className="py-2.5 pe-3 font-extrabold">
                            {row.name}
                          </td>
                          <td className="py-2.5 pe-3 whitespace-nowrap font-black text-[var(--gym-lime,#fb5001)]">
                            {row.value} {row.unit}
                          </td>
                          <td className="py-2.5 text-[12px] text-[#6B7280]">
                            {row.notes || "—"}
                          </td>
                          <td className="py-2.5 text-end">
                            <button
                              type="button"
                              onClick={() => {
                                setConfirmDialog({
                                  open: true,
                                  title: isAr
                                    ? "حذف سجل الأداء الرياضي"
                                    : "Delete Performance Record",
                                  description: isAr
                                    ? `هل ترغب في حذف سجل تمرين "${row.name}" (${row.value} ${row.unit})؟ لا يمكن التراجع عن هذا الإجراء.`
                                    : `Are you sure you want to delete the ${row.name} record (${row.value} ${row.unit})? This action cannot be undone.`,
                                  confirmLabel: isAr
                                    ? "تأكيد الحذف"
                                    : "Delete Record",
                                  tone: "danger",
                                  onConfirm: async () => {
                                    await deletePerformanceMutation.mutateAsync({
                                      id: row.id,
                                      subscriberId: row.subscriberId,
                                    })
                                    appToast.success(
                                      isAr ? "تم الحذف بنجاح" : "Record deleted",
                                    )
                                  },
                                })
                              }}
                              className="p-1 text-[#8c8c8c] hover:text-[#C44536] transition"
                              title={isAr ? "حذف" : "Delete"}
                            >
                              <Trash2 className="size-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ====================================================== */}
        {/* Tab 4: Consistency & Adherence                         */}
        {/* ====================================================== */}
        {tab === "adherence" && (
          <div className="mt-5 space-y-6">
            <div>
              <h3 className="font-heading text-[16px] font-extrabold text-[var(--gym-ink,#111111)]">
                {isAr
                  ? "الالتزام الأسبوعي بالتمارين والوجبات"
                  : "Weekly Consistency & Adherence Score"}
              </h3>
              <p className="text-[12px] text-[#8c8c8c]">
                {isAr
                  ? "نسبة إتمام الحصص التدريبية والوجبات المبرمجة أسبوعياً"
                  : "Completion rate of programmed workout days and nutrition meals"}
              </p>
            </div>

            {/* Adherence Summary Cards */}
            {adherenceSummary ? (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="rounded-2xl border border-black/5 bg-[#F9F9F9] p-4">
                  <span className="text-[12px] font-bold text-[#8c8c8c]">
                    {isAr ? "إجمالي التزام التمارين" : "Workout Adherence"}
                  </span>
                  <p className="mt-1 font-heading text-[24px] font-black text-[var(--gym-ink,#111111)]">
                    {adherenceSummary.overallWk}%
                  </p>
                  <p className="text-[11px] font-semibold text-[#8c8c8c] mt-0.5">
                    {adherenceSummary.totalWkDone} /{" "}
                    {adherenceSummary.totalWkExpected}{" "}
                    {isAr ? "حصص منجزة" : "sessions completed"}
                  </p>
                </div>

                <div className="rounded-2xl border border-black/5 bg-[#F9F9F9] p-4">
                  <span className="text-[12px] font-bold text-[#8c8c8c]">
                    {isAr ? "إجمالي التزام التغذية" : "Nutrition Adherence"}
                  </span>
                  <p className="mt-1 font-heading text-[24px] font-black text-[var(--gym-lime,#fb5001)]">
                    {adherenceSummary.overallNutr}%
                  </p>
                  <p className="text-[11px] font-semibold text-[#8c8c8c] mt-0.5">
                    {adherenceSummary.totalNutrDone} /{" "}
                    {adherenceSummary.totalNutrExpected}{" "}
                    {isAr ? "وجبات مسجلة" : "meals on track"}
                  </p>
                </div>

                <div className="rounded-2xl border border-black/5 bg-[#F9F9F9] p-4">
                  <span className="text-[12px] font-bold text-[#8c8c8c]">
                    {isAr ? "الاستمرارية المتواصلة" : "Active Consistency Streak"}
                  </span>
                  <p className="mt-1 font-heading text-[24px] font-black text-[var(--gym-ink,#111111)] flex items-center gap-1.5">
                    <Flame className="size-6 text-[var(--gym-lime,#fb5001)]" />
                    <span>
                      {adherenceSummary.streak}{" "}
                      {isAr ? "أسابيع" : "weeks"}
                    </span>
                  </p>
                  <p className="text-[11px] font-semibold text-[#8c8c8c] mt-0.5">
                    {isAr
                      ? "التزام يتجاوز 70% أسبوعياً"
                      : "Weeks with ≥70% compliance"}
                  </p>
                </div>
              </div>
            ) : null}

            {/* Consistency Bar Chart */}
            {weeks.length ? (
              <div className="rounded-[22px] bg-[#F9F9F9] p-4 sm:p-5 border border-black/4">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-[13px] font-bold text-[var(--gym-ink,#111111)]">
                    {isAr ? "مقارنة الالتزام الأسبوعي" : "Weekly Consistency Plot"}
                  </span>
                  <div className="flex items-center gap-3 text-[11px] font-bold">
                    <span className="flex items-center gap-1">
                      <span className="size-2.5 rounded-full bg-[var(--gym-ink,#111111)]" />
                      {isAr ? "التمارين" : "Workouts"}
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="size-2.5 rounded-full bg-[var(--gym-lime,#fb5001)]" />
                      {isAr ? "التغذية" : "Nutrition"}
                    </span>
                  </div>
                </div>

                <div className="h-[220px] w-full sm:h-[260px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={weeks.map((w) => ({
                        date: formatChartDate(w.weekStart, locale),
                        workout: w.workoutTotal
                          ? percent(w.workoutDone, w.workoutTotal)
                          : 0,
                        nutrition: w.nutritionTotal
                          ? percent(w.nutritionDone, w.nutritionTotal)
                          : 0,
                      }))}
                      barSize={16}
                      margin={{ top: 8, right: 8, left: -10, bottom: 4 }}
                    >
                      <CartesianGrid
                        stroke="#E8E8E8"
                        strokeDasharray="3 3"
                        vertical={false}
                      />
                      <XAxis
                        dataKey="date"
                        tick={{ fill: "#8c8c8c", fontSize: 11 }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        domain={[0, 100]}
                        ticks={[0, 25, 50, 75, 100]}
                        tick={{ fill: "#8c8c8c", fontSize: 11 }}
                        tickFormatter={(v) => `${v}%`}
                        axisLine={false}
                        tickLine={false}
                        width={40}
                      />
                      <Tooltip
                        cursor={{ fill: "rgba(0,0,0,0.04)" }}
                        contentStyle={{
                          background: "#111111",
                          border: "none",
                          borderRadius: 12,
                          color: "#fff",
                          fontSize: 12,
                          fontWeight: 700,
                        }}
                        formatter={(val, name) => [`${val}%`, String(name)]}
                      />
                      <Bar
                        dataKey="workout"
                        name={isAr ? "التمارين" : "Workouts"}
                        fill={INK}
                        radius={[6, 6, 0, 0]}
                      />
                      <Bar
                        dataKey="nutrition"
                        name={isAr ? "التغذية" : "Nutrition"}
                        fill={ORANGE}
                        radius={[6, 6, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            ) : (
              <p className="text-[13px] text-[#8c8c8c]">
                {isAr
                  ? "لا توجد أسابيع مسجلة بعد."
                  : "No adherence history logged yet."}
              </p>
            )}

            {/* Program Assignments & History (Workouts & Nutrition) */}
            <div className="pt-5 border-t border-black/5">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h4 className="font-heading text-[15px] font-extrabold text-[var(--gym-ink,#111111)]">
                    {isAr
                      ? "البرامج التدريبية والغذائية المعتمدة"
                      : "Assigned Workout & Nutrition Programs"}
                  </h4>
                  <p className="text-[12px] text-[#8c8c8c]">
                    {isAr
                      ? "سجل البرامج المعينة من قبل المدرب وخطة التغذية المعتمدة"
                      : "Active and historical plans assigned by your coaching staff"}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* Workout Programs */}
                <div className="rounded-2xl border border-black/5 bg-[#F9F9F9] p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[12px] font-extrabold text-[var(--gym-ink,#111111)]">
                      {isAr ? "برامج التمارين" : "Workout Programs"}
                    </span>
                    <Link
                      to={APP_ROUTES.subscriber.workout}
                      className="text-[11.5px] font-bold text-[var(--gym-lime,#fb5001)] hover:underline inline-flex items-center gap-1"
                    >
                      <span>{isAr ? "عرض جدول التمرين" : "View workout"}</span>
                      <ArrowUpRight className="size-3" />
                    </Link>
                  </div>

                  {assignedPrograms.workouts.length ? (
                    <div className="space-y-2 mt-3">
                      {assignedPrograms.workouts.map((w) => (
                        <div
                          key={w.id}
                          className="rounded-xl bg-white p-3 border border-black/5 flex items-center justify-between gap-2"
                        >
                          <div className="min-w-0">
                            <p className="text-[13px] font-extrabold text-[var(--gym-ink,#111111)] truncate">
                              {w.title[locale]}
                            </p>
                            <p className="text-[11px] font-semibold text-[#8c8c8c]">
                              {t(`admin.workouts.format.${w.format}`)} · v{w.version}
                              {w.completion ? ` · ${w.completion.done}/${w.completion.total}` : ""}
                            </p>
                          </div>
                          <StatusBadge
                            label={w.status === "active" ? (isAr ? "نشط" : "Active") : (isAr ? "مؤرشف" : "Archived")}
                            tone={w.status === "active" ? "success" : "muted"}
                          />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[12px] font-medium text-[#8c8c8c] py-2">
                      {isAr ? "لا توجد برامج تمارين معينة حالياً." : "No workout programs assigned yet."}
                    </p>
                  )}
                </div>

                {/* Nutrition Programs */}
                <div className="rounded-2xl border border-black/5 bg-[#F9F9F9] p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[12px] font-extrabold text-[var(--gym-ink,#111111)]">
                      {isAr ? "الخطط الغذائية" : "Nutrition Plans"}
                    </span>
                    <Link
                      to={APP_ROUTES.subscriber.nutrition}
                      className="text-[11.5px] font-bold text-[var(--gym-lime,#fb5001)] hover:underline inline-flex items-center gap-1"
                    >
                      <span>{isAr ? "عرض جدول الوجبات" : "View meals"}</span>
                      <ArrowUpRight className="size-3" />
                    </Link>
                  </div>

                  {assignedPrograms.nutrition.length ? (
                    <div className="space-y-2 mt-3">
                      {assignedPrograms.nutrition.map((n) => (
                        <div
                          key={n.id}
                          className="rounded-xl bg-white p-3 border border-black/5 flex items-center justify-between gap-2"
                        >
                          <div className="min-w-0">
                            <p className="text-[13px] font-extrabold text-[var(--gym-ink,#111111)] truncate">
                              {n.title[locale]}
                            </p>
                            <p className="text-[11px] font-semibold text-[#8c8c8c]">
                              {n.targetCalories ? `${n.targetCalories} kcal · ` : ""}v{n.version}
                              {n.adherence ? ` · ${n.adherence.done}/${n.adherence.total}` : ""}
                            </p>
                          </div>
                          <StatusBadge
                            label={n.status === "active" ? (isAr ? "نشط" : "Active") : (isAr ? "مؤرشف" : "Archived")}
                            tone={n.status === "active" ? "success" : "muted"}
                          />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[12px] font-medium text-[#8c8c8c] py-2">
                      {isAr ? "لا توجد خطط غذائية معينة حالياً." : "No nutrition plans assigned yet."}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* ======================================================== */}
      {/* 3. Action Dialog Modals                                  */}
      {/* ======================================================== */}
      <LogMeasurementDialog
        open={measurementModalOpen}
        subscriberId={subscriberId}
        subscriberName={currentSubscriber?.displayName}
        onClose={() => setMeasurementModalOpen(false)}
        onSave={async (input) => {
          await saveMeasurementMutation.mutateAsync(input)
        }}
      />

      <AddProgressPhotoDialog
        open={photoModalOpen}
        subscriberId={subscriberId}
        subscriberName={currentSubscriber?.displayName}
        onClose={() => setPhotoModalOpen(false)}
        onSave={async (input) => {
          await savePhotoMutation.mutateAsync(input)
        }}
      />

      <LogPerformanceDialog
        open={performanceModalOpen}
        subscriberId={subscriberId}
        subscriberName={currentSubscriber?.displayName}
        onClose={() => setPerformanceModalOpen(false)}
        onSave={async (input) => {
          await savePerformanceMutation.mutateAsync(input)
        }}
      />

      <PhotoComparisonDialog
        open={compareModalOpen}
        photos={photos}
        subscriberName={currentSubscriber?.displayName}
        onClose={() => setCompareModalOpen(false)}
      />

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
