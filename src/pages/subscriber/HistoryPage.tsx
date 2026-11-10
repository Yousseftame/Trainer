import { useEffect, useMemo, useState } from "react"
import { Link, useSearchParams } from "react-router-dom"
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import {
  Apple,
  Archive,
  ArrowRight,
  ArrowLeft,
  Camera,
  CreditCard,
  Dumbbell,
  Eye,
  HeartPulse,
  Layers,
  RefreshCw,
  Scale,
  Trophy,
} from "lucide-react"
import { ProgramHistoryDialog } from "@/components/dashboard/ProgramHistoryDialog"
import { ProgressPhotoImage } from "@/components/dashboard/ProgressPhotoImage"
import { StatCard } from "@/components/dashboard/StatCard"
import { APP_ROUTES } from "@/config/constants"
import {
  useNutritionLogsQuery,
  useNutritionProgramsQuery,
} from "@/features/nutrition/hooks"
import { useSubscriberPTRecordsQuery } from "@/features/physicalTherapy/hooks"
import {
  useMeasurementsQuery,
  usePerformanceQuery,
  usePhotosQuery,
} from "@/features/progress/hooks"
import { liftSeries, sortMeasurementsAsc } from "@/features/progress/metrics"
import { usePanelSubscriber } from "@/features/subscribers/use-panel-subscriber"
import {
  canAccessPackageEntitlement,
  pickCurrentSubscription,
} from "@/features/subscriptions/entitlements"
import {
  usePackageByIdQuery,
  useSubscriberSubscriptionsQuery,
} from "@/features/subscriptions/hooks"
import {
  useWorkoutLogsQuery,
  useWorkoutProgramsQuery,
} from "@/features/workouts/hooks"
import { useDocumentTitle } from "@/hooks/useDocumentTitle"
import { useLocale } from "@/hooks/useLocale"
import { formatChartDate, formatDate } from "@/lib/format"
import { cn } from "@/lib/utils"
import type { NutritionProgram, WorkoutProgram } from "@/types/program"
import { NutritionLogPage } from "./NutritionLogPage"
import { WorkoutLogPage } from "./WorkoutLogPage"

type HistoryTab =
  | "programs"
  | "workoutLogs"
  | "nutritionLogs"
  | "progress"
  | "rehab"
  | "subscriptions"

const HISTORY_TABS: HistoryTab[] = [
  "programs",
  "workoutLogs",
  "nutritionLogs",
  "progress",
  "rehab",
  "subscriptions",
]

function isHistoryTab(value: string | null): value is HistoryTab {
  return Boolean(value && HISTORY_TABS.includes(value as HistoryTab))
}

function weightDomain(values: number[]): [number, number] {
  if (!values.length) return [60, 100]
  const min = Math.min(...values)
  const max = Math.max(...values)
  const pad = Math.max(1, Math.ceil((max - min) * 0.2) || 1)
  return [Math.floor(min) - pad, Math.ceil(max) + pad]
}

function cmLabel(value: number | undefined, isAr: boolean) {
  if (value == null) return "—"
  return `${value} ${isAr ? "سم" : "cm"}`
}

function kgLabel(value: number | undefined, isAr: boolean) {
  if (value == null) return "—"
  return `${value} ${isAr ? "كجم" : "kg"}`
}

export function HistoryPage() {
  const { locale, isRtl } = useLocale()
  const isAr = locale === "ar"
  useDocumentTitle(isAr ? "السجل التاريخي الشامل" : "Comprehensive History & Archives")

  const { subscriberId: activeSubscriberId, subscriber } = usePanelSubscriber()
  const [searchParams, setSearchParams] = useSearchParams()
  const tabParam = searchParams.get("tab")
  const [activeTab, setActiveTab] = useState<HistoryTab>(
    isHistoryTab(tabParam) ? tabParam : "programs",
  )
  const [programFilter, setProgramFilter] = useState<"all" | "workout" | "nutrition">(
    "all",
  )
  const [historyDialogProgram, setHistoryDialogProgram] = useState<{
    open: boolean
    title: string
    type: "workout" | "nutrition"
    initialProgramId: string
    programs: Array<WorkoutProgram | NutritionProgram>
  } | null>(null)

  useEffect(() => {
    if (isHistoryTab(tabParam) && tabParam !== activeTab) {
      setActiveTab(tabParam)
    }
  }, [tabParam, activeTab])

  function selectTab(tab: HistoryTab) {
    setActiveTab(tab)
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev)
        next.set("tab", tab)
        return next
      },
      { replace: true },
    )
  }

  const {
    data: subscriberWorkouts = [],
    isLoading: workoutsLoading,
    isError: workoutsError,
    refetch: refetchWorkouts,
  } = useWorkoutProgramsQuery({
    subscriberId: activeSubscriberId,
    enabled: Boolean(activeSubscriberId),
  })
  const {
    data: subscriberNutrition = [],
    isLoading: nutritionLoading,
    isError: nutritionError,
    refetch: refetchNutrition,
  } = useNutritionProgramsQuery({
    subscriberId: activeSubscriberId,
    enabled: Boolean(activeSubscriberId),
  })
  const { data: workoutLogs = [] } = useWorkoutLogsQuery({
    subscriberId: activeSubscriberId,
    enabled: Boolean(activeSubscriberId),
  })
  const { data: nutritionLogs = [] } = useNutritionLogsQuery({
    subscriberId: activeSubscriberId,
    enabled: Boolean(activeSubscriberId),
  })
  const {
    data: measurements = [],
    isLoading: measurementsLoading,
    isError: measurementsError,
    refetch: refetchMeasurements,
  } = useMeasurementsQuery(activeSubscriberId || undefined)
  const { data: photos = [] } = usePhotosQuery(activeSubscriberId || undefined)
  const { data: lifts = [] } = usePerformanceQuery(activeSubscriberId || undefined)
  const {
    data: ptRecords = [],
    isLoading: ptLoading,
    isError: ptError,
    refetch: refetchPt,
  } = useSubscriberPTRecordsQuery(activeSubscriberId)
  const { data: subscriptions = [] } = useSubscriberSubscriptionsQuery(
    activeSubscriberId || undefined,
  )

  const currentSub = useMemo(
    () => pickCurrentSubscription(subscriptions),
    [subscriptions],
  )
  const { data: pkg } = usePackageByIdQuery(currentSub?.packageId)

  const canWorkout = canAccessPackageEntitlement(
    currentSub,
    pkg ?? undefined,
    "workoutProgram",
  )
  const canNutrition = canAccessPackageEntitlement(
    currentSub,
    pkg ?? undefined,
    "nutritionProgram",
  )
  const canProgress = canAccessPackageEntitlement(
    currentSub,
    pkg ?? undefined,
    "progressTracking",
  )

  const unifiedPrograms = useMemo(() => {
    const list: Array<{
      id: string
      type: "workout" | "nutrition"
      title: string
      status: "active" | "archived"
      version: number
      format: string
      assignedDate: string
      archivedDate?: string | null
      metricLabel: string
      metricValue: string
      rawProgram: WorkoutProgram | NutritionProgram
    }> = []

    for (const wp of subscriberWorkouts) {
      if (wp.status === "template") continue
      const daysCount =
        wp.days?.filter((d) => !d.isRest && (d.exercises?.length ?? 0) > 0)
          .length ?? 0
      list.push({
        id: wp.id,
        type: "workout",
        title: wp.title[locale] || wp.title.en,
        status: wp.status === "active" ? "active" : "archived",
        version: wp.version,
        format: wp.format,
        assignedDate: wp.createdAt,
        archivedDate: wp.archivedAt,
        metricLabel: isAr ? "حصص التدريب" : "Training days",
        metricValue: `${daysCount} ${isAr ? "حصص / أسبوع" : "days/wk"}`,
        rawProgram: wp,
      })
    }

    for (const np of subscriberNutrition) {
      if (np.status === "template") continue
      list.push({
        id: np.id,
        type: "nutrition",
        title: np.title[locale] || np.title.en,
        status: np.status === "active" ? "active" : "archived",
        version: np.version,
        format: np.format,
        assignedDate: np.createdAt,
        archivedDate: np.archivedAt,
        metricLabel: isAr ? "السعرات المستهدفة" : "Target calories",
        metricValue: np.targetCalories
          ? `${np.targetCalories} ${isAr ? "سعرة" : "kcal"}`
          : "—",
        rawProgram: np,
      })
    }

    return list.sort(
      (a, b) =>
        new Date(b.assignedDate).getTime() - new Date(a.assignedDate).getTime(),
    )
  }, [subscriberWorkouts, subscriberNutrition, locale, isAr])

  const archivedPrograms = useMemo(
    () => unifiedPrograms.filter((p) => p.status === "archived"),
    [unifiedPrograms],
  )

  const filteredPrograms = useMemo(() => {
    if (programFilter === "all") return unifiedPrograms
    return unifiedPrograms.filter((p) => p.type === programFilter)
  }, [unifiedPrograms, programFilter])

  const sortedMeasurements = useMemo(
    () =>
      [...measurements].sort(
        (a, b) =>
          new Date(b.recordedAt).getTime() - new Date(a.recordedAt).getTime(),
      ),
    [measurements],
  )

  const weightChartData = useMemo(() => {
    return sortMeasurementsAsc(measurements)
      .filter((m) => m.weightKg != null)
      .map((m) => ({
        date: formatChartDate(m.recordedAt, locale),
        kg: m.weightKg as number,
      }))
  }, [measurements, locale])

  const performanceSeries = useMemo(() => liftSeries(lifts).slice(0, 6), [lifts])

  const sortedSubscriptions = useMemo(
    () =>
      [...subscriptions].sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      ),
    [subscriptions],
  )

  const sortedPhotos = useMemo(
    () =>
      [...photos].sort(
        (a, b) => new Date(b.takenAt).getTime() - new Date(a.takenAt).getTime(),
      ),
    [photos],
  )

  const stats = useMemo(
    () => ({
      archivedPrograms: archivedPrograms.length,
      totalWorkoutSessions: workoutLogs.length,
      totalNutritionDays: nutritionLogs.length,
      totalMeasurements: measurements.length,
    }),
    [archivedPrograms, workoutLogs, nutritionLogs, measurements],
  )

  const pageLoading =
    Boolean(activeSubscriberId) &&
    (workoutsLoading || nutritionLoading || measurementsLoading || ptLoading)
  const pageError = workoutsError || nutritionError || measurementsError || ptError

  function refetchAll() {
    void refetchWorkouts()
    void refetchNutrition()
    void refetchMeasurements()
    void refetchPt()
  }

  const Arrow = isRtl ? ArrowLeft : ArrowRight

  return (
    <div className="flex flex-col gap-5 pb-14">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="font-heading text-[20px] font-black tracking-tight text-[var(--gym-ink,#111111)] sm:text-[23px]">
                {isAr ? "السجل التاريخي الشامل" : "Comprehensive History & Archives"}
              </h1>
              <span className="inline-flex h-7 items-center whitespace-nowrap rounded-full bg-[var(--gym-lime,#fb5001)]/25 px-2.5 text-[12px] font-bold text-[var(--gym-ink,#111111)]">
                {isAr ? "سجلات دائمة ومحفوظة" : "Historical Archive"}
              </span>
            </div>
            <p className="mt-0.5 text-[12px] font-medium text-[#6B7280] sm:text-[13px]">
              {isAr
                ? "أرشيف البرامج والخطط السابقة، سجلات التمارين والتغذية، وسجل القياسات والتحول عبر الزمن"
                : "Archive of previous workout & nutrition plans, session logs, adherence records, and progress timeline."}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {canWorkout ? (
              <Link
                to={APP_ROUTES.subscriber.workout}
                className="inline-flex h-9.5 items-center justify-center gap-1.5 rounded-full bg-[var(--gym-ink,#111111)] px-3.5 text-[12px] font-extrabold text-white shadow-2xs transition-all hover:bg-[var(--gym-lime,#fb5001)] active:scale-95 sm:h-10 sm:px-4.5 sm:text-[12.5px]"
              >
                <Dumbbell className="size-3.5" />
                <span>{isAr ? "البرنامج التدريبي النشط" : "Active Workout"}</span>
              </Link>
            ) : canNutrition ? (
              <Link
                to={APP_ROUTES.subscriber.nutrition}
                className="inline-flex h-9.5 items-center justify-center gap-1.5 rounded-full bg-[var(--gym-ink,#111111)] px-3.5 text-[12px] font-extrabold text-white shadow-2xs transition-all hover:bg-[var(--gym-lime,#fb5001)] active:scale-95 sm:h-10 sm:px-4.5 sm:text-[12.5px]"
              >
                <Apple className="size-3.5" />
                <span>{isAr ? "خطة التغذية النشطة" : "Active Nutrition"}</span>
              </Link>
            ) : (
              <Link
                to={APP_ROUTES.subscriber.subscription}
                className="inline-flex h-9.5 items-center justify-center gap-1.5 rounded-full bg-[var(--gym-ink,#111111)] px-3.5 text-[12px] font-extrabold text-white shadow-2xs transition-all hover:bg-[var(--gym-lime,#fb5001)] active:scale-95 sm:h-10 sm:px-4.5 sm:text-[12.5px]"
              >
                <CreditCard className="size-3.5" />
                <span>{isAr ? "الاشتراك والصلاحيات" : "Subscription"}</span>
              </Link>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard
            label={isAr ? "البرامج المؤرشفة" : "Archived Programs"}
            value={stats.archivedPrograms}
            icon={<Archive className="size-4" strokeWidth={1.8} />}
          />
          <StatCard
            label={isAr ? "الحصص المنجزة" : "Completed Sessions"}
            value={stats.totalWorkoutSessions}
            icon={<Dumbbell className="size-4" strokeWidth={1.8} />}
          />
          <StatCard
            label={isAr ? "أيام الالتزام الغذائي" : "Nutrition Check-ins"}
            value={stats.totalNutritionDays}
            icon={<Apple className="size-4" strokeWidth={1.8} />}
          />
          <StatCard
            label={isAr ? "تسجيلات القياسات" : "Body Measurements"}
            value={stats.totalMeasurements}
            icon={<Scale className="size-4" strokeWidth={1.8} />}
          />
        </div>

        <div className="no-scrollbar flex items-center gap-2 overflow-x-auto pb-1 pt-1">
          {(
            [
              {
                id: "programs" as const,
                icon: Layers,
                label: isAr ? "البرامج والخطط" : "Programs",
                count: unifiedPrograms.length,
              },
              {
                id: "workoutLogs" as const,
                icon: Dumbbell,
                label: isAr ? "سجل الحصص" : "Workout Sessions",
                count: workoutLogs.length,
              },
              {
                id: "nutritionLogs" as const,
                icon: Apple,
                label: isAr ? "سجل التغذية" : "Nutrition Logs",
                count: nutritionLogs.length,
              },
              {
                id: "progress" as const,
                icon: Scale,
                label: isAr ? "التقدم والقياسات" : "Progress Archive",
                count: measurements.length + photos.length + lifts.length,
              },
              {
                id: "rehab" as const,
                icon: HeartPulse,
                label: isAr ? "التأهيل" : "Rehab History",
                count: ptRecords.length,
              },
              {
                id: "subscriptions" as const,
                icon: CreditCard,
                label: isAr ? "الاشتراكات" : "Subscriptions",
                count: subscriptions.length,
              },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => selectTab(tab.id)}
              className={cn(
                "inline-flex shrink-0 select-none items-center gap-2 rounded-full border px-4 py-2 text-[12.5px] font-bold transition",
                activeTab === tab.id
                  ? "border-transparent bg-[var(--gym-ink,#111111)] text-white shadow-xs"
                  : "border-black/10 bg-white text-[var(--gym-ink,#111111)] hover:bg-neutral-50",
              )}
            >
              <tab.icon className="size-4" />
              <span>{tab.label}</span>
              <span
                className={cn(
                  "rounded-full px-1.5 text-[10.5px] font-bold",
                  activeTab === tab.id
                    ? "bg-white/20 text-white"
                    : "bg-black/5 text-[#8c8c8c]",
                )}
              >
                {tab.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {!activeSubscriberId ? (
        <div className="flex min-h-60 flex-col items-center justify-center rounded-[24px] border border-black/6 bg-white p-8 text-center shadow-xs">
          <p className="font-heading text-[16px] font-bold text-[var(--gym-ink,#111111)]">
            {isAr ? "تعذر تحديد المشترك" : "Subscriber context unavailable"}
          </p>
        </div>
      ) : pageLoading ? (
        <div className="flex min-h-60 flex-col items-center justify-center rounded-[24px] border border-black/6 bg-white p-8 text-center shadow-xs">
          <RefreshCw className="mb-3 size-8 animate-spin text-[var(--gym-lime,#fb5001)] stroke-1" />
          <p className="text-[13px] font-medium text-[#8c8c8c]">
            {isAr ? "جاري تحميل السجل..." : "Loading your archive..."}
          </p>
        </div>
      ) : pageError ? (
        <div className="flex min-h-60 flex-col items-center justify-center gap-3 rounded-[24px] border border-black/6 bg-white p-8 text-center shadow-xs">
          <p className="font-heading text-[16px] font-extrabold text-[var(--gym-ink,#111111)]">
            {isAr ? "تعذر تحميل السجل" : "Could not load history"}
          </p>
          <button
            type="button"
            onClick={refetchAll}
            className="rounded-full bg-[var(--gym-ink,#111111)] px-4 py-2 text-[12px] font-bold text-white"
          >
            {isAr ? "إعادة المحاولة" : "Retry"}
          </button>
        </div>
      ) : null}

      {activeSubscriberId && !pageLoading && !pageError && activeTab === "programs" ? (
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-1.5 rounded-full border border-black/5 bg-[#F4F4F4] p-1">
              {(
                [
                  {
                    id: "all" as const,
                    label: isAr ? "الكل" : "All",
                    count: unifiedPrograms.length,
                  },
                  {
                    id: "workout" as const,
                    label: isAr ? "تمارين" : "Workouts",
                    count: subscriberWorkouts.filter((p) => p.status !== "template")
                      .length,
                  },
                  {
                    id: "nutrition" as const,
                    label: isAr ? "تغذية" : "Nutrition",
                    count: subscriberNutrition.filter((p) => p.status !== "template")
                      .length,
                  },
                ] as const
              ).map((chip) => (
                <button
                  key={chip.id}
                  type="button"
                  onClick={() => setProgramFilter(chip.id)}
                  className={cn(
                    "rounded-full px-3 py-1 text-[11.5px] font-bold transition",
                    programFilter === chip.id
                      ? "bg-[var(--gym-ink,#111111)] text-white shadow-xs"
                      : "text-[#6B7280] hover:text-black",
                  )}
                >
                  {chip.label} ({chip.count})
                </button>
              ))}
            </div>
            <span className="hidden text-[12px] font-bold text-[#8c8c8c] sm:inline">
              {isAr
                ? "النسخ السابقة تبقى محفوظة عند تغيير الخطة"
                : "Prior versions stay when plans change"}
            </span>
          </div>

          {filteredPrograms.length === 0 ? (
            <div className="flex min-h-60 flex-col items-center justify-center rounded-[24px] border border-black/6 bg-white p-8 text-center shadow-xs">
              <Archive className="mb-2 size-10 stroke-1 text-[#8c8c8c]" />
              <p className="font-heading text-[16px] font-bold text-[var(--gym-ink,#111111)]">
                {isAr ? "لا توجد برامج مسجلة" : "No programs found"}
              </p>
              <p className="mt-1 text-[12.5px] text-[#8c8c8c]">
                {isAr
                  ? "عند اعتماد خطة جديدة، تُحفظ النسخ السابقة هنا."
                  : "When a new plan is assigned, previous versions are archived here."}
              </p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredPrograms.map((prog) => (
                <div
                  key={prog.id}
                  className="flex flex-col justify-between gap-4 rounded-[24px] border border-black/8 bg-white p-5 shadow-2xs transition hover:border-black/20"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        <span className="flex size-7 items-center justify-center rounded-xl bg-black/5 text-[var(--gym-orange,#fb5001)]">
                          {prog.type === "workout" ? (
                            <Dumbbell className="size-4" />
                          ) : (
                            <Apple className="size-4" />
                          )}
                        </span>
                        <span className="text-[11.5px] font-extrabold text-[#555]">
                          {prog.type === "workout"
                            ? isAr
                              ? "برنامج تمارين"
                              : "Workout Program"
                            : isAr
                              ? "خطة تغذية"
                              : "Nutrition Plan"}
                        </span>
                      </div>
                      <span
                        className={cn(
                          "rounded-full px-2.5 py-0.5 text-[11px] font-bold",
                          prog.status === "active"
                            ? "bg-black/10 font-black text-[var(--gym-ink,#111111)]"
                            : "bg-neutral-100 text-[#6B7280]",
                        )}
                      >
                        {prog.status === "active"
                          ? isAr
                            ? "نشط حالياً"
                            : "Currently Active"
                          : isAr
                            ? "نسخة مؤرشفة"
                            : "Archived Version"}
                      </span>
                    </div>

                    <div>
                      <h3 className="font-heading text-[16px] font-black leading-snug text-[var(--gym-ink,#111111)]">
                        {prog.title}
                      </h3>
                      <div className="mt-1 flex items-center gap-2 text-[11.5px] text-[#8c8c8c]">
                        <span>v{prog.version}</span>
                        <span>·</span>
                        <span>
                          {prog.format === "pdf"
                            ? "PDF Document"
                            : "Interactive Split"}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between rounded-xl border border-black/4 bg-[#F8F9FA] p-3 text-[12px]">
                      <span className="font-medium text-[#6B7280]">
                        {prog.metricLabel}
                      </span>
                      <strong className="font-bold text-[var(--gym-ink,#111111)]">
                        {prog.metricValue}
                      </strong>
                    </div>

                    <div className="space-y-0.5 text-[11.5px] text-[#8c8c8c]">
                      <p>
                        {isAr ? "تاريخ الاعتماد: " : "Assigned: "}
                        <strong className="text-[#555]">
                          {formatDate(prog.assignedDate, locale)}
                        </strong>
                      </p>
                      {prog.archivedDate ? (
                        <p>
                          {isAr ? "تاريخ الأرشفة: " : "Archived: "}
                          <strong className="text-[#555]">
                            {formatDate(prog.archivedDate, locale)}
                          </strong>
                        </p>
                      ) : null}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setHistoryDialogProgram({
                        open: true,
                        title: prog.title,
                        type: prog.type,
                        initialProgramId: prog.id,
                        programs:
                          prog.type === "workout"
                            ? subscriberWorkouts.filter((p) => p.status !== "template")
                            : subscriberNutrition.filter((p) => p.status !== "template"),
                      })
                    }}
                    className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-[var(--gym-ink,#111111)] text-[12.5px] font-bold text-white shadow-xs transition hover:bg-[var(--gym-orange,#fb5001)]"
                  >
                    <Eye className="size-4" />
                    <span>
                      {isAr ? "استعراض تفاصيل الخطة" : "View Plan Breakdown"}
                    </span>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : null}

      {activeSubscriberId && !pageLoading && !pageError && activeTab === "workoutLogs" ? (
        <WorkoutLogPage subscriberId={activeSubscriberId} embedded />
      ) : null}

      {activeSubscriberId && !pageLoading && !pageError && activeTab === "nutritionLogs" ? (
        <NutritionLogPage subscriberId={activeSubscriberId} embedded />
      ) : null}

      {activeSubscriberId && !pageLoading && !pageError && activeTab === "progress" ? (
        <div className="flex flex-col gap-4">
          <div className="space-y-4 rounded-[24px] border border-black/6 bg-white p-5 shadow-xs sm:p-7">
            <div className="flex flex-col gap-2 border-b border-black/5 pb-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="font-heading text-[17px] font-black text-[var(--gym-ink,#111111)]">
                  {isAr
                    ? "سجل القياسات والتحول الجسدي"
                    : "Body Measurements & Transformation"}
                </h3>
                <p className="text-[12.5px] text-[#8c8c8c]">
                  {isAr
                    ? "وزن، محيطات، صور أداء — محفوظة حتى بعد تغيير الباقة"
                    : "Weight, circumferences, photos & lifts — retained across plan changes."}
                </p>
              </div>
              {canProgress ? (
                <Link
                  to={APP_ROUTES.subscriber.progress}
                  className="inline-flex items-center gap-1.5 self-start rounded-full bg-[#F4F4F4] px-4 py-2 text-[12px] font-bold text-[var(--gym-ink,#111111)] transition hover:bg-[#ECECEC] sm:self-auto"
                >
                  <span>{isAr ? "تسجيل قياسات جديدة" : "Log Check-in"}</span>
                </Link>
              ) : (
                <Link
                  to={APP_ROUTES.subscriber.subscription}
                  className="inline-flex items-center gap-1.5 self-start rounded-full bg-[#F4F4F4] px-4 py-2 text-[12px] font-bold text-[var(--gym-ink,#111111)] transition hover:bg-[#ECECEC] sm:self-auto"
                >
                  <span>
                    {isAr ? "تفعيل تتبع التقدم" : "Enable progress tracking"}
                  </span>
                </Link>
              )}
            </div>

            {weightChartData.length >= 2 ? (
              <div className="h-[220px] w-full sm:h-[260px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={weightChartData}
                    margin={{ top: 12, right: 12, left: -10, bottom: 4 }}
                  >
                    <defs>
                      <linearGradient id="histWeightFill" x1="0" y1="0" x2="0" y2="1">
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
                    />
                    <YAxis
                      domain={weightDomain(weightChartData.map((d) => d.kg))}
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
                        `${val} ${isAr ? "كجم" : "kg"}`,
                        isAr ? "الوزن" : "Weight",
                      ]}
                    />
                    <Area
                      type="monotone"
                      dataKey="kg"
                      stroke="#111111"
                      strokeWidth={2.5}
                      fill="url(#histWeightFill)"
                      dot={{ r: 3.5, fill: "#111111", stroke: "#fff", strokeWidth: 2 }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="py-4 text-center text-[13px] text-[#8c8c8c]">
                {isAr
                  ? "سجّل قراءتين على الأقل لعرض مخطط الوزن."
                  : "Log at least two weigh-ins to see the weight chart."}
              </p>
            )}

            {sortedMeasurements.length === 0 ? (
              <p className="py-4 text-center text-[13px] text-[#8c8c8c]">
                {isAr
                  ? "لا توجد قياسات مسجلة حتى الآن."
                  : "No body measurements recorded yet."}
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-start text-[13px]">
                  <thead>
                    <tr className="border-b border-black/6 text-[11px] font-bold uppercase tracking-wider text-[#8c8c8c]">
                      <th className="py-2.5 text-start font-bold">
                        {isAr ? "التاريخ" : "Date"}
                      </th>
                      <th className="py-2.5 text-start font-bold">
                        {isAr ? "الوزن" : "Weight"}
                      </th>
                      <th className="py-2.5 text-start font-bold">
                        {isAr ? "الخصر" : "Waist"}
                      </th>
                      <th className="py-2.5 text-start font-bold">
                        {isAr ? "الصدر" : "Chest"}
                      </th>
                      <th className="py-2.5 text-start font-bold">
                        {isAr ? "الوركين" : "Hips"}
                      </th>
                      <th className="py-2.5 text-start font-bold">
                        {isAr ? "الذراع" : "Arms"}
                      </th>
                      <th className="py-2.5 text-start font-bold">
                        {isAr ? "الفخذ" : "Thighs"}
                      </th>
                      <th className="py-2.5 text-start font-bold">
                        {isAr ? "الملاحظات" : "Notes"}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-black/4">
                    {sortedMeasurements.map((m) => (
                      <tr key={m.id} className="transition hover:bg-neutral-50/60">
                        <td className="py-3 font-bold text-[var(--gym-ink,#111111)]">
                          {formatDate(m.recordedAt, locale)}
                        </td>
                        <td className="py-3 font-extrabold text-[var(--gym-ink,#111111)]">
                          {kgLabel(m.weightKg, isAr)}
                        </td>
                        <td className="py-3 text-[#555]">{cmLabel(m.waistCm, isAr)}</td>
                        <td className="py-3 text-[#555]">{cmLabel(m.chestCm, isAr)}</td>
                        <td className="py-3 text-[#555]">{cmLabel(m.hipsCm, isAr)}</td>
                        <td className="py-3 text-[#555]">{cmLabel(m.armsCm, isAr)}</td>
                        <td className="py-3 text-[#555]">{cmLabel(m.thighsCm, isAr)}</td>
                        <td className="max-w-[200px] truncate py-3 text-[12px] text-[#8c8c8c]">
                          {m.notes || "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-[24px] border border-black/6 bg-white p-5 shadow-xs sm:p-6">
              <div className="mb-3 flex items-center justify-between gap-2">
                <h4 className="inline-flex items-center gap-2 font-heading text-[15px] font-black text-[var(--gym-ink,#111111)]">
                  <Camera className="size-4 text-[var(--gym-lime,#fb5001)]" />
                  {isAr ? "صور التقدم" : "Progress Photos"}
                </h4>
                <span className="text-[11px] font-bold text-[#8c8c8c]">
                  {photos.length}
                </span>
              </div>
              {sortedPhotos.length === 0 ? (
                <p className="text-[13px] text-[#8c8c8c]">
                  {isAr ? "لا توجد صور بعد." : "No progress photos yet."}
                </p>
              ) : (
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                  {sortedPhotos.slice(0, 8).map((photo) => (
                    <div
                      key={photo.id}
                      className="aspect-[3/4] overflow-hidden rounded-xl bg-[#F4F4F4]"
                    >
                      <ProgressPhotoImage
                        photo={photo}
                        className="size-full"
                        imgClassName="size-full object-cover"
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="rounded-[24px] border border-black/6 bg-white p-5 shadow-xs sm:p-6">
              <div className="mb-3 flex items-center justify-between gap-2">
                <h4 className="inline-flex items-center gap-2 font-heading text-[15px] font-black text-[var(--gym-ink,#111111)]">
                  <Trophy className="size-4 text-[var(--gym-lime,#fb5001)]" />
                  {isAr ? "أرقام الأداء" : "Performance Records"}
                </h4>
                <span className="text-[11px] font-bold text-[#8c8c8c]">
                  {lifts.length}
                </span>
              </div>
              {performanceSeries.length === 0 ? (
                <p className="text-[13px] text-[#8c8c8c]">
                  {isAr ? "لا توجد أرقام أداء بعد." : "No performance lifts logged yet."}
                </p>
              ) : (
                <div className="space-y-2">
                  {performanceSeries.map((series) => (
                    <div
                      key={series.name}
                      className="flex items-center justify-between rounded-xl border border-black/5 bg-[#F9F9F9] px-3 py-2.5 text-[13px]"
                    >
                      <span className="font-bold text-[var(--gym-ink,#111111)]">
                        {series.name}
                      </span>
                      <span className="font-extrabold text-[#555]">
                        {series.latest}
                        {series.unit ? ` ${series.unit}` : ""}
                        {series.delta != null && series.delta !== 0 ? (
                          <span
                            className={cn(
                              "ms-2 text-[11px] font-bold",
                              series.delta > 0 ? "text-emerald-700" : "text-rose-700",
                            )}
                          >
                            {series.delta > 0 ? "+" : ""}
                            {series.delta}
                          </span>
                        ) : null}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      ) : null}

      {activeSubscriberId && !pageLoading && !pageError && activeTab === "rehab" ? (
        <div className="flex flex-col gap-4">
          <div className="space-y-4 rounded-[24px] border border-black/6 bg-white p-5 shadow-xs sm:p-7">
            <div className="flex flex-col gap-2 border-b border-black/5 pb-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="font-heading text-[17px] font-black text-[var(--gym-ink,#111111)]">
                  {isAr
                    ? "أرشيف التأهيل الحركي والعلاج الطبيعي"
                    : "Rehabilitation & Movement Archive"}
                </h3>
                <p className="text-[12.5px] text-[#8c8c8c]">
                  {isAr
                    ? "سجل الإصابات وموانع الحركة والبروتوكولات المعتمدة"
                    : "Record of movement restrictions, diagnoses, and resolved injuries."}
                </p>
              </div>
              <Link
                to={APP_ROUTES.subscriber.physicalTherapy}
                className="inline-flex items-center gap-1.5 self-start rounded-full bg-[#F4F4F4] px-4 py-2 text-[12px] font-bold text-[var(--gym-ink,#111111)] transition hover:bg-[#ECECEC] sm:self-auto"
              >
                <span>{isAr ? "عرض خطة التأهيل الحالية" : "View Active Rehab"}</span>
              </Link>
            </div>

            {ptRecords.length === 0 ? (
              <p className="py-6 text-center text-[13px] text-[#8c8c8c]">
                {isAr
                  ? "لا توجد سجلات تأهيل سابقة مسجلة."
                  : "No rehabilitation records found."}
              </p>
            ) : (
              <div className="grid gap-3.5 sm:grid-cols-2">
                {ptRecords.map((rec) => (
                  <div
                    key={rec.id}
                    className="flex flex-col justify-between gap-3 rounded-2xl border border-black/8 bg-[#FAF9F7] p-4"
                  >
                    <div>
                      <div className="mb-2 flex items-center justify-between gap-2">
                        <span className="text-[13px] font-bold text-[var(--gym-ink,#111111)]">
                          {rec.injuryTitle[locale] || rec.injuryTitle.en}
                        </span>
                        <span
                          className={cn(
                            "rounded-full px-2 py-0.5 text-[10.5px] font-bold",
                            rec.status === "cleared"
                              ? "bg-black/10 text-[var(--gym-ink,#111111)]"
                              : rec.status === "recovering"
                                ? "bg-amber-100 text-amber-900"
                                : "bg-rose-100 text-rose-800",
                          )}
                        >
                          {rec.status === "cleared"
                            ? isAr
                              ? "تعافي تام"
                              : "Cleared"
                            : rec.status === "recovering"
                              ? isAr
                                ? "مرحلة استشفاء"
                                : "In Recovery"
                              : isAr
                                ? "تأهيل نشط"
                                : "Active"}
                        </span>
                      </div>
                      <div className="space-y-1 text-[12px] text-[#666]">
                        <p>
                          {isAr ? "تاريخ التشخيص: " : "Diagnosed: "}
                          <strong className="text-[var(--gym-ink,#111111)]">
                            {formatDate(rec.diagnosisDate, locale)}
                          </strong>
                        </p>
                        {rec.clearanceDate ? (
                          <p>
                            {isAr ? "تاريخ التعافي: " : "Clearance date: "}
                            <strong className="text-[var(--gym-ink,#111111)]">
                              {formatDate(rec.clearanceDate, locale)}
                            </strong>
                          </p>
                        ) : null}
                      </div>
                      <div className="mt-2.5 flex items-center gap-2 text-[11px] font-bold text-[#8c8c8c]">
                        <span>
                          {rec.restrictions.length}{" "}
                          {isAr ? "موانع حركة" : "restrictions"}
                        </span>
                        <span>·</span>
                        <span>
                          {rec.rehabExercises.length}{" "}
                          {isAr ? "تمارين تأهيل" : "rehab drills"}
                        </span>
                      </div>
                    </div>
                    <Link
                      to={`${APP_ROUTES.subscriber.physicalTherapy}?record=${encodeURIComponent(rec.id)}`}
                      className="inline-flex items-center gap-1 self-start text-[12px] font-bold text-[var(--gym-orange,#fb5001)] hover:underline"
                    >
                      <span>
                        {isAr ? "استعراض تفاصيل البروتوكول" : "View Protocol Details"}
                      </span>
                      <Arrow className="size-3.5" />
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : null}

      {activeSubscriberId && !pageLoading && !pageError && activeTab === "subscriptions" ? (
        <div className="rounded-[24px] border border-black/6 bg-white p-5 shadow-xs sm:p-7">
          <div className="mb-4 border-b border-black/5 pb-4">
            <h3 className="font-heading text-[17px] font-black text-[var(--gym-ink,#111111)]">
              {isAr ? "سجل الاشتراكات والباقات" : "Subscription History"}
            </h3>
            <p className="text-[12.5px] text-[#8c8c8c]">
              {isAr
                ? "دورات الاشتراك السابقة والحالية المرتبطة بحسابك"
                : "Past and current subscription cycles linked to your account."}
            </p>
          </div>

          {sortedSubscriptions.length === 0 ? (
            <p className="py-6 text-center text-[13px] text-[#8c8c8c]">
              {isAr ? "لا توجد اشتراكات مسجلة." : "No subscription records yet."}
            </p>
          ) : (
            <div className="space-y-3">
              {sortedSubscriptions.map((sub) => {
                const name =
                  sub.packageName?.[locale] ||
                  sub.packageName?.en ||
                  sub.packageId
                return (
                  <div
                    key={sub.id}
                    className="flex flex-col gap-2 rounded-2xl border border-black/8 bg-[#FAF9F7] p-4 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <p className="font-heading text-[15px] font-extrabold text-[var(--gym-ink,#111111)]">
                        {name}
                      </p>
                      <p className="mt-1 text-[12px] text-[#6B7280]">
                        {sub.startsAt
                          ? formatDate(sub.startsAt, locale)
                          : "—"}
                        {" → "}
                        {sub.endsAt ? formatDate(sub.endsAt, locale) : "—"}
                      </p>
                    </div>
                    <span
                      className={cn(
                        "self-start rounded-full px-2.5 py-1 text-[11px] font-bold sm:self-auto",
                        sub.status === "active"
                          ? "bg-black/10 text-[var(--gym-ink,#111111)]"
                          : sub.status === "expired"
                            ? "bg-neutral-100 text-[#6B7280]"
                            : sub.status === "suspended"
                              ? "bg-amber-100 text-amber-900"
                              : "bg-rose-50 text-rose-800",
                      )}
                    >
                      {sub.status}
                    </span>
                  </div>
                )
              })}
            </div>
          )}

          <div className="mt-4">
            <Link
              to={APP_ROUTES.subscriber.subscription}
              className="inline-flex items-center gap-1 text-[12px] font-bold text-[var(--gym-orange,#fb5001)] hover:underline"
            >
              <span>
                {isAr ? "إدارة الاشتراك الحالي" : "Manage current subscription"}
              </span>
              <Arrow className="size-3.5" />
            </Link>
          </div>
        </div>
      ) : null}

      {historyDialogProgram ? (
        <ProgramHistoryDialog
          open={historyDialogProgram.open}
          title={historyDialogProgram.title}
          type={historyDialogProgram.type}
          initialProgramId={historyDialogProgram.initialProgramId}
          subscriberName={subscriber?.displayName}
          programs={historyDialogProgram.programs}
          onClose={() => setHistoryDialogProgram(null)}
        />
      ) : null}
    </div>
  )
}
