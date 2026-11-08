import { useMemo, useState } from "react"
import { Link } from "react-router-dom"
import {
  Apple,
  Archive,
  ArrowRight,
  ArrowLeft,
  Dumbbell,
  Eye,
  HeartPulse,
  Layers,
  Scale,
  UserCheck,
} from "lucide-react"
import { ProgramHistoryDialog } from "@/components/dashboard/ProgramHistoryDialog"
import { StatCard } from "@/components/dashboard/StatCard"
import { APP_ROUTES } from "@/config/constants"
import { useNutritionLogsQuery, useNutritionProgramsQuery } from "@/features/nutrition/hooks"
import { useSubscriberPTRecordsQuery } from "@/features/physicalTherapy/hooks"
import { useMeasurementsQuery } from "@/features/progress/hooks"
import { usePanelSubscriber } from "@/features/subscribers/use-panel-subscriber"
import { useWorkoutLogsQuery, useWorkoutProgramsQuery } from "@/features/workouts/hooks"
import { useDocumentTitle } from "@/hooks/useDocumentTitle"
import { useLocale } from "@/hooks/useLocale"
import { formatDate } from "@/lib/format"
import { cn } from "@/lib/utils"
import type { NutritionProgram, WorkoutProgram } from "@/types/program"
import { NutritionLogPage } from "./NutritionLogPage"
import { WorkoutLogPage } from "./WorkoutLogPage"

type HistoryTab = "programs" | "workoutLogs" | "nutritionLogs" | "measurements" | "rehab"

export function HistoryPage() {
  const { locale, isRtl } = useLocale()
  const isAr = locale === "ar"
  useDocumentTitle(isAr ? "السجل التاريخي الشامل" : "Comprehensive History & Archives")

  const {
    staffCanPick,
    directory: subscribers,
    subscriberId: activeSubscriberId,
    selectedSubscriberId,
    setSelectedSubscriberId,
  } = usePanelSubscriber({ allowStaffPicker: true })

  // Active Tab state
  const [activeTab, setActiveTab] = useState<HistoryTab>("programs")

  // Filter within Programs tab: all | workouts | nutrition
  const [programFilter, setProgramFilter] = useState<"all" | "workout" | "nutrition">("all")

  // Modal for viewing full program breakdown
  const [historyDialogProgram, setHistoryDialogProgram] = useState<{
    open: boolean
    title: string
    type: "workout" | "nutrition"
    programs: Array<WorkoutProgram | NutritionProgram>
  } | null>(null)

  // Scoped queries for the active subscriber only
  const { data: subscriberWorkouts = [] } = useWorkoutProgramsQuery({
    subscriberId: activeSubscriberId,
    enabled: Boolean(activeSubscriberId),
  })
  const { data: subscriberNutrition = [] } = useNutritionProgramsQuery({
    subscriberId: activeSubscriberId,
    enabled: Boolean(activeSubscriberId),
  })
  const { data: workoutLogs = [] } = useWorkoutLogsQuery(activeSubscriberId)
  const { data: nutritionLogs = [] } = useNutritionLogsQuery(activeSubscriberId)
  const { data: measurements = [] } = useMeasurementsQuery(activeSubscriberId)
  const { data: ptRecords = [] } = useSubscriberPTRecordsQuery(activeSubscriberId)

  // All combined historical programs for this subscriber
  const unifiedPrograms = useMemo(() => {
    const list: Array<{
      id: string
      type: "workout" | "nutrition"
      title: string
      status: "active" | "archived" | "completed"
      version: number
      format: string
      assignedDate: string
      archivedDate?: string | null
      metricLabel: string
      metricValue: string
      rawProgram: WorkoutProgram | NutritionProgram
    }> = []

    for (const wp of subscriberWorkouts) {
      const daysCount = wp.days?.filter((d) => !d.isRest && d.exercises?.length > 0).length ?? 0
      list.push({
        id: wp.id,
        type: "workout",
        title: wp.title[locale] || wp.title.en,
        status: (wp.status as "active" | "archived" | "completed") || "archived",
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
      list.push({
        id: np.id,
        type: "nutrition",
        title: np.title[locale] || np.title.en,
        status: (np.status as "active" | "archived" | "completed") || "archived",
        version: np.version,
        format: np.format,
        assignedDate: np.createdAt,
        archivedDate: np.archivedAt,
        metricLabel: isAr ? "السعرات المستهدفة" : "Target calories",
        metricValue: np.targetCalories ? `${np.targetCalories} ${isAr ? "سعرة" : "kcal"}` : "—",
        rawProgram: np,
      })
    }

    return list.sort(
      (a, b) => new Date(b.assignedDate).getTime() - new Date(a.assignedDate).getTime(),
    )
  }, [subscriberWorkouts, subscriberNutrition, locale, isAr])

  // Filtered programs based on sub-filter
  const filteredPrograms = useMemo(() => {
    if (programFilter === "all") return unifiedPrograms
    return unifiedPrograms.filter((p) => p.type === programFilter)
  }, [unifiedPrograms, programFilter])

  // Sorted measurements
  const sortedMeasurements = useMemo(() => {
    return [...measurements].sort(
      (a, b) => new Date(b.recordedAt).getTime() - new Date(a.recordedAt).getTime(),
    )
  }, [measurements])

  // Top Statistics
  const stats = useMemo(() => {
    const totalPrograms = unifiedPrograms.length
    const totalWorkoutSessions = workoutLogs.length
    const totalNutritionDays = nutritionLogs.length
    const totalMeasurements = measurements.length
    return { totalPrograms, totalWorkoutSessions, totalNutritionDays, totalMeasurements }
  }, [unifiedPrograms, workoutLogs, nutritionLogs, measurements])

  return (
    <div className="flex flex-col gap-5 pb-14">
      {/* ======================================================== */}
      {/* 1. Clean Top Header & Metric Highlights                  */}
      {/* ======================================================== */}
      <div className="flex flex-col gap-4">
        {/* Top Header Row (Matching Progress & Physical Therapy layout) */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="font-heading text-[20px] sm:text-[23px] font-black text-[var(--gym-ink,#111111)] tracking-tight">
                {isAr ? "السجل التاريخي الشامل" : "Comprehensive History & Archives"}
              </h1>
              <span className="inline-flex h-7 items-center rounded-full bg-[var(--gym-lime,#fb5001)]/25 px-2.5 text-[12px] font-bold text-[var(--gym-ink,#111111)] whitespace-nowrap">
                {isAr ? "سجلات دائمة ومحفوظة" : "Historical Archive"}
              </span>
            </div>
            <p className="mt-0.5 text-[12px] sm:text-[13px] font-medium text-[#6B7280]">
              {isAr
                ? "أرشيف البرامج والخطط السابقة، سجلات التمارين والتغذية، وسجل القياسات والتحول عبر الزمن"
                : "Archive of previous workout & nutrition plans, session logs, adherence records, and progress timeline."}
            </p>
          </div>

          {/* Action Buttons Row */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Admin Member Switcher (Only visible to staff/admin) */}
            {staffCanPick ? (
              <div className="flex items-center gap-1.5 rounded-full bg-[#F4F4F4] px-3 py-1.5 text-[11.5px] font-bold text-[var(--gym-ink,#111111)] border border-black/8">
                <UserCheck className="size-3.5 text-[var(--gym-lime,#fb5001)]" />
                <span className="hidden xs:inline">
                  {isAr ? "معاينة:" : "Member:"}
                </span>
                <select
                  value={selectedSubscriberId || activeSubscriberId}
                  onChange={(e) => setSelectedSubscriberId(e.target.value)}
                  className="rounded-lg bg-white px-2 py-0.5 text-[11.5px] font-bold outline-none cursor-pointer"
                >
                  {subscribers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.displayName || s.email}
                    </option>
                  ))}
                </select>
              </div>
            ) : null}

            {/* Link to Active Workout */}
            <Link
              to={APP_ROUTES.subscriber.workout}
              className="inline-flex h-9.5 sm:h-10 items-center justify-center gap-1.5 rounded-full bg-[var(--gym-ink,#111111)] hover:bg-[var(--gym-lime,#fb5001)] px-3.5 sm:px-4.5 text-[12px] sm:text-[12.5px] font-extrabold text-white shadow-2xs transition-all active:scale-95"
            >
              <Dumbbell className="size-3.5" />
              <span>{isAr ? "البرنامج التدريبي النشط" : "Active Program"}</span>
            </Link>
          </div>
        </div>

        {/* 4 Clean Metric Cards (Eye-Comfortable, Zero Green) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard
            label={isAr ? "إجمالي البرامج السابقة" : "Archived Programs"}
            value={stats.totalPrograms}
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

        {/* Navigation Tabs Strip (Scrollable & Responsive) */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-1 no-scrollbar">
          {/* Tab 1: Programs & Plans */}
          <button
            type="button"
            onClick={() => setActiveTab("programs")}
            className={cn(
              "inline-flex items-center gap-2 rounded-full px-4 py-2 text-[12.5px] font-bold transition shrink-0 border select-none",
              activeTab === "programs"
                ? "bg-[var(--gym-ink,#111111)] text-white border-transparent shadow-xs"
                : "bg-white text-[var(--gym-ink,#111111)] border-black/10 hover:bg-neutral-50",
            )}
          >
            <Layers className="size-4" />
            <span>{isAr ? "البرامج والخطط السابقة" : "Previous Programs"}</span>
            <span
              className={cn(
                "rounded-full px-1.5 py-0.2 text-[10.5px] font-bold",
                activeTab === "programs" ? "bg-white/20 text-white" : "bg-black/5 text-[#8c8c8c]",
              )}
            >
              {unifiedPrograms.length}
            </span>
          </button>

          {/* Tab 2: Workout Logs */}
          <button
            type="button"
            onClick={() => setActiveTab("workoutLogs")}
            className={cn(
              "inline-flex items-center gap-2 rounded-full px-4 py-2 text-[12.5px] font-bold transition shrink-0 border select-none",
              activeTab === "workoutLogs"
                ? "bg-[var(--gym-ink,#111111)] text-white border-transparent shadow-xs"
                : "bg-white text-[var(--gym-ink,#111111)] border-black/10 hover:bg-neutral-50",
            )}
          >
            <Dumbbell className="size-4" />
            <span>{isAr ? "سجل الحصص والأداء" : "Workout Sessions"}</span>
            <span
              className={cn(
                "rounded-full px-1.5 py-0.2 text-[10.5px] font-bold",
                activeTab === "workoutLogs" ? "bg-white/20 text-white" : "bg-black/5 text-[#8c8c8c]",
              )}
            >
              {workoutLogs.length}
            </span>
          </button>

          {/* Tab 3: Nutrition Logs */}
          <button
            type="button"
            onClick={() => setActiveTab("nutritionLogs")}
            className={cn(
              "inline-flex items-center gap-2 rounded-full px-4 py-2 text-[12.5px] font-bold transition shrink-0 border select-none",
              activeTab === "nutritionLogs"
                ? "bg-[var(--gym-ink,#111111)] text-white border-transparent shadow-xs"
                : "bg-white text-[var(--gym-ink,#111111)] border-black/10 hover:bg-neutral-50",
            )}
          >
            <Apple className="size-4" />
            <span>{isAr ? "سجل التغذية والالتزام" : "Nutrition Logs"}</span>
            <span
              className={cn(
                "rounded-full px-1.5 py-0.2 text-[10.5px] font-bold",
                activeTab === "nutritionLogs" ? "bg-white/20 text-white" : "bg-black/5 text-[#8c8c8c]",
              )}
            >
              {nutritionLogs.length}
            </span>
          </button>

          {/* Tab 4: Measurements Timeline */}
          <button
            type="button"
            onClick={() => setActiveTab("measurements")}
            className={cn(
              "inline-flex items-center gap-2 rounded-full px-4 py-2 text-[12.5px] font-bold transition shrink-0 border select-none",
              activeTab === "measurements"
                ? "bg-[var(--gym-ink,#111111)] text-white border-transparent shadow-xs"
                : "bg-white text-[var(--gym-ink,#111111)] border-black/10 hover:bg-neutral-50",
            )}
          >
            <Scale className="size-4" />
            <span>{isAr ? "سجل القياسات والتحول" : "Measurements Timeline"}</span>
            <span
              className={cn(
                "rounded-full px-1.5 py-0.2 text-[10.5px] font-bold",
                activeTab === "measurements" ? "bg-white/20 text-white" : "bg-black/5 text-[#8c8c8c]",
              )}
            >
              {measurements.length}
            </span>
          </button>

          {/* Tab 5: Rehab & Therapy History */}
          <button
            type="button"
            onClick={() => setActiveTab("rehab")}
            className={cn(
              "inline-flex items-center gap-2 rounded-full px-4 py-2 text-[12.5px] font-bold transition shrink-0 border select-none",
              activeTab === "rehab"
                ? "bg-[var(--gym-ink,#111111)] text-white border-transparent shadow-xs"
                : "bg-white text-[var(--gym-ink,#111111)] border-black/10 hover:bg-neutral-50",
            )}
          >
            <HeartPulse className="size-4" />
            <span>{isAr ? "أرشيف التأهيل والاستشفاء" : "Rehab History"}</span>
            <span
              className={cn(
                "rounded-full px-1.5 py-0.2 text-[10.5px] font-bold",
                activeTab === "rehab" ? "bg-white/20 text-white" : "bg-black/5 text-[#8c8c8c]",
              )}
            >
              {ptRecords.length}
            </span>
          </button>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 2. Tab Content Rendering                                 */}
      {/* ======================================================== */}

      {/* TAB 1: Previous Programs & Plans */}
      {activeTab === "programs" ? (
        <div className="flex flex-col gap-4">
          {/* Sub-filter chips: All | Workout Programs | Nutrition Plans */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-1.5 rounded-full bg-[#F4F4F4] p-1 border border-black/5">
              <button
                type="button"
                onClick={() => setProgramFilter("all")}
                className={cn(
                  "rounded-full px-3 py-1 text-[11.5px] font-bold transition",
                  programFilter === "all"
                    ? "bg-[var(--gym-ink,#111111)] text-white shadow-xs"
                    : "text-[#6B7280] hover:text-black",
                )}
              >
                {isAr ? "الكل" : "All"} ({unifiedPrograms.length})
              </button>
              <button
                type="button"
                onClick={() => setProgramFilter("workout")}
                className={cn(
                  "rounded-full px-3 py-1 text-[11.5px] font-bold transition",
                  programFilter === "workout"
                    ? "bg-[var(--gym-ink,#111111)] text-white shadow-xs"
                    : "text-[#6B7280] hover:text-black",
                )}
              >
                {isAr ? "برامج التمارين" : "Workout Plans"} ({subscriberWorkouts.length})
              </button>
              <button
                type="button"
                onClick={() => setProgramFilter("nutrition")}
                className={cn(
                  "rounded-full px-3 py-1 text-[11.5px] font-bold transition",
                  programFilter === "nutrition"
                    ? "bg-[var(--gym-ink,#111111)] text-white shadow-xs"
                    : "text-[#6B7280] hover:text-black",
                )}
              >
                {isAr ? "خطط التغذية" : "Nutrition Plans"} ({subscriberNutrition.length})
              </button>
            </div>

            <span className="text-[12px] font-bold text-[#8c8c8c] hidden sm:inline">
              {isAr ? "جميع الخطط تظل محفوظة بالكامل" : "Records retained permanently"}
            </span>
          </div>

          {filteredPrograms.length === 0 ? (
            <div className="flex min-h-60 flex-col items-center justify-center rounded-[24px] bg-white p-8 text-center shadow-xs border border-black/6">
              <Archive className="size-10 text-[#8c8c8c] mb-2 stroke-1" />
              <p className="font-heading text-[16px] font-bold text-[var(--gym-ink,#111111)]">
                {isAr ? "لا توجد برامج سابقة مسجلة" : "No previous programs found"}
              </p>
              <p className="mt-1 text-[12.5px] text-[#8c8c8c]">
                {isAr
                  ? "عند اكتمال برنامجك الحالي أو اعتماد خطة جديدة، سيتم الاحتفاظ بالنسخ السابقة هنا."
                  : "When your current plan updates or completes, previous versions will be archived here."}
              </p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredPrograms.map((prog) => (
                <div
                  key={prog.id}
                  className="rounded-[24px] bg-white p-5 border border-black/8 shadow-2xs flex flex-col justify-between gap-4 hover:border-black/20 transition"
                >
                  <div className="space-y-3">
                    {/* Card Top: Type badge & Status */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        <span
                          className="flex size-7 items-center justify-center rounded-xl bg-black/5 text-[var(--gym-orange,#fb5001)]"
                        >
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
                            ? "bg-black/10 text-[var(--gym-ink,#111111)] font-black"
                            : prog.status === "archived"
                              ? "bg-neutral-100 text-[#6B7280]"
                              : "bg-blue-50 text-blue-800",
                        )}
                      >
                        {prog.status === "active"
                          ? isAr
                            ? "نشط حالياً"
                            : "Currently Active"
                          : prog.status === "archived"
                            ? isAr
                              ? "نسخة سابقة مؤرشفة"
                              : "Archived Version"
                            : isAr
                              ? "مكتمل"
                              : "Completed"}
                      </span>
                    </div>

                    {/* Title */}
                    <div>
                      <h3 className="font-heading text-[16px] font-black text-[var(--gym-ink,#111111)] leading-snug">
                        {prog.title}
                      </h3>
                      <div className="mt-1 flex items-center gap-2 text-[11.5px] text-[#8c8c8c]">
                        <span>v{prog.version}</span>
                        <span>·</span>
                        <span>{prog.format === "pdf" ? "PDF Document" : "Interactive Split"}</span>
                      </div>
                    </div>

                    {/* Metric Row */}
                    <div className="rounded-xl bg-[#F8F9FA] p-3 text-[12px] flex items-center justify-between border border-black/4">
                      <span className="font-medium text-[#6B7280]">{prog.metricLabel}</span>
                      <strong className="font-bold text-[var(--gym-ink,#111111)]">
                        {prog.metricValue}
                      </strong>
                    </div>

                    {/* Dates */}
                    <div className="text-[11.5px] text-[#8c8c8c] space-y-0.5">
                      <p>
                        {isAr ? "تاريخ الاعتماد: " : "Assigned: "}
                        <strong className="text-[#555]">{formatDate(prog.assignedDate, locale)}</strong>
                      </p>
                      {prog.archivedDate ? (
                        <p>
                          {isAr ? "تاريخ الأرشفة: " : "Archived: "}
                          <strong className="text-[#555]">{formatDate(prog.archivedDate, locale)}</strong>
                        </p>
                      ) : null}
                    </div>
                  </div>

                  {/* View Details Button */}
                  <button
                    type="button"
                    onClick={() => {
                      setHistoryDialogProgram({
                        open: true,
                        title: prog.title,
                        type: prog.type,
                        programs:
                          prog.type === "workout"
                            ? subscriberWorkouts
                            : subscriberNutrition,
                      })
                    }}
                    className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-[var(--gym-ink,#111111)] hover:bg-[var(--gym-orange,#fb5001)] text-white text-[12.5px] font-bold transition shadow-xs"
                  >
                    <Eye className="size-4" />
                    <span>{isAr ? "استعراض تفاصيل الخطة" : "View Plan Breakdown"}</span>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : null}

      {/* TAB 2: Workout Logs */}
      {activeTab === "workoutLogs" ? (
        <WorkoutLogPage subscriberId={activeSubscriberId} />
      ) : null}

      {/* TAB 3: Nutrition Logs */}
      {activeTab === "nutritionLogs" ? (
        <NutritionLogPage subscriberId={activeSubscriberId} />
      ) : null}

      {/* TAB 4: Measurements Timeline */}
      {activeTab === "measurements" ? (
        <div className="flex flex-col gap-4">
          <div className="rounded-[24px] bg-white p-5 sm:p-7 shadow-xs border border-black/6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-black/5 pb-4">
              <div>
                <h3 className="font-heading text-[17px] font-black text-[var(--gym-ink,#111111)]">
                  {isAr ? "سجل القياسات والتحول الجسدي التاريخي" : "Historical Body Measurements Timeline"}
                </h3>
                <p className="text-[12.5px] text-[#8c8c8c]">
                  {isAr
                    ? "مقارنة وزن الجسم وقياسات المحيطات المسجلة عبر الأسابيع والشهور السابقة"
                    : "Complete record of weight and body circumferences recorded over time."}
                </p>
              </div>

              <Link
                to="/app/progress"
                className="inline-flex items-center gap-1.5 self-start sm:self-auto rounded-full bg-[#F4F4F4] hover:bg-[#ECECEC] px-4 py-2 text-[12px] font-bold text-[var(--gym-ink,#111111)] transition"
              >
                <span>{isAr ? "تسجيل قياسات جديدة" : "Log Check-in"}</span>
              </Link>
            </div>

            {sortedMeasurements.length === 0 ? (
              <p className="text-[13px] text-[#8c8c8c] py-6 text-center">
                {isAr ? "لا توجد قياسات مسجلة لهذا المشترك حتى الآن." : "No body measurements recorded yet."}
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-start text-[13px]">
                  <thead>
                    <tr className="border-b border-black/6 text-[11px] font-bold uppercase tracking-wider text-[#8c8c8c]">
                      <th className="py-2.5 text-start font-bold">{isAr ? "التاريخ" : "Date"}</th>
                      <th className="py-2.5 text-start font-bold">{isAr ? "الوزن (كجم)" : "Weight (kg)"}</th>
                      <th className="py-2.5 text-start font-bold">{isAr ? "الخصر (سم)" : "Waist (cm)"}</th>
                      <th className="py-2.5 text-start font-bold">{isAr ? "الصدر (سم)" : "Chest (cm)"}</th>
                      <th className="py-2.5 text-start font-bold">{isAr ? "الذراع (سم)" : "Arm (cm)"}</th>
                      <th className="py-2.5 text-start font-bold">{isAr ? "الفخذ (سم)" : "Thighs (cm)"}</th>
                      <th className="py-2.5 text-start font-bold">{isAr ? "الملاحظات" : "Notes"}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-black/4">
                    {sortedMeasurements.map((m, idx) => (
                      <tr key={m.id || idx} className="hover:bg-neutral-50/60 transition">
                        <td className="py-3 font-bold text-[var(--gym-ink,#111111)]">
                          {formatDate(m.recordedAt, locale)}
                        </td>
                        <td className="py-3 font-extrabold text-[var(--gym-ink,#111111)]">
                          {m.weightKg} {isAr ? "كجم" : "kg"}
                        </td>
                        <td className="py-3 text-[#555]">{m.waistCm ? `${m.waistCm} سم` : "—"}</td>
                        <td className="py-3 text-[#555]">{m.chestCm ? `${m.chestCm} سم` : "—"}</td>
                        <td className="py-3 text-[#555]">{m.armsCm ? `${m.armsCm} سم` : "—"}</td>
                        <td className="py-3 text-[#555]">{m.thighsCm ? `${m.thighsCm} سم` : "—"}</td>
                        <td className="py-3 text-[12px] text-[#8c8c8c] max-w-[200px] truncate">
                          {m.notes || "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      ) : null}

      {/* TAB 5: Rehab & Therapy History */}
      {activeTab === "rehab" ? (
        <div className="flex flex-col gap-4">
          <div className="rounded-[24px] bg-white p-5 sm:p-7 shadow-xs border border-black/6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-black/5 pb-4">
              <div>
                <h3 className="font-heading text-[17px] font-black text-[var(--gym-ink,#111111)]">
                  {isAr ? "أرشيف التأهيل الحركي والعلاج الطبيعي" : "Rehabilitation & Movement Archive"}
                </h3>
                <p className="text-[12.5px] text-[#8c8c8c]">
                  {isAr
                    ? "سجل الإصابات وموانع الحركة والبروتوكولات التي تم التعامل معها واعتماد تعافيها"
                    : "Record of movement restrictions, diagnoses, and successfully resolved injuries."}
                </p>
              </div>

              <Link
                to="/app/physical-therapy"
                className="inline-flex items-center gap-1.5 self-start sm:self-auto rounded-full bg-[#F4F4F4] hover:bg-[#ECECEC] px-4 py-2 text-[12px] font-bold text-[var(--gym-ink,#111111)] transition"
              >
                <span>{isAr ? "عرض خطة التأهيل الحالية" : "View Active Rehab"}</span>
              </Link>
            </div>

            {ptRecords.length === 0 ? (
              <p className="text-[13px] text-[#8c8c8c] py-6 text-center">
                {isAr ? "لا توجد سجلات تأهيل سابقة مسجلة." : "No rehabilitation records found."}
              </p>
            ) : (
              <div className="grid gap-3.5 sm:grid-cols-2">
                {ptRecords.map((rec) => (
                  <div
                    key={rec.id}
                    className="rounded-2xl border border-black/8 bg-[#FAF9F7] p-4 flex flex-col justify-between gap-3"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className="font-bold text-[13px] text-[var(--gym-ink,#111111)]">
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

                      <div className="text-[12px] text-[#666] space-y-1">
                        <p>
                          {isAr ? "تاريخ التشخيص: " : "Diagnosed: "}
                          <strong className="text-[var(--gym-ink,#111111)]">
                            {formatDate(rec.diagnosisDate, locale)}
                          </strong>
                        </p>
                        {rec.clearanceDate ? (
                          <p>
                            {isAr ? "تاريخ التعافي والاعتماد: " : "Clearance date: "}
                            <strong className="text-[var(--gym-ink,#111111)]">
                              {formatDate(rec.clearanceDate, locale)}
                            </strong>
                          </p>
                        ) : null}
                      </div>

                      <div className="mt-2.5 flex items-center gap-2 text-[11px] font-bold text-[#8c8c8c]">
                        <span>{rec.restrictions.length} {isAr ? "موانع حركة" : "restrictions"}</span>
                        <span>·</span>
                        <span>{rec.rehabExercises.length} {isAr ? "تمارين تأهيل" : "rehab drills"}</span>
                      </div>
                    </div>

                    <Link
                      to="/app/physical-therapy"
                      className="inline-flex items-center gap-1 text-[12px] font-bold text-[var(--gym-orange,#fb5001)] hover:underline self-start"
                    >
                      <span>{isAr ? "استعراض تفاصيل البروتوكول" : "View Protocol Details"}</span>
                      {isRtl ? <ArrowLeft className="size-3.5" /> : <ArrowRight className="size-3.5" />}
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : null}

      {/* Program History Modal */}
      {historyDialogProgram ? (
        <ProgramHistoryDialog
          open={historyDialogProgram.open}
          title={historyDialogProgram.title}
          type={historyDialogProgram.type}
          programs={historyDialogProgram.programs}
          onClose={() => setHistoryDialogProgram(null)}
        />
      ) : null}
    </div>
  )
}
