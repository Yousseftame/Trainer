import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
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
  ArrowLeft,
  ArrowRight,
  BarChart2,
  CheckCircle2,
  LineChart,
  Scale,
  TrendingDown,
  TrendingUp,
} from "lucide-react"
import { APP_ROUTES } from "@/config/constants"
import { useSubscriberOverviewDashboard } from "@/features/subscriber-overview/use-overview-dashboard"
import { useLocale } from "@/hooks/useLocale"
import { cn } from "@/lib/utils"
import { SubscriberWeeklyAdherenceCard } from "./SubscriberWeeklyAdherenceCard"

type ChartMetric = "weight" | "adherence"
type ChartType = "area" | "column"

function weightDomain(values: number[]): [number, number] {
  if (!values.length) return [60, 100]
  const min = Math.min(...values)
  const max = Math.max(...values)
  const pad = Math.max(1, Math.ceil((max - min) * 0.25) || 1)
  return [Math.floor(min) - pad, Math.ceil(max) + pad]
}

export function SubscriberActivityProgressChart() {
  const { locale, isRtl } = useLocale()
  const isAr = locale === "ar"
  const [metric, setMetric] = useState<ChartMetric>("weight")
  const [chartType, setChartType] = useState<ChartType>("area")
  const [isMobile, setIsMobile] = useState(false)

  const {
    isLoading,
    isError,
    canProgress,
    canWorkout,
    measurements,
    currentWeek,
    currentAdherence,
    adherenceDelta,
    latestWeight,
    weightChange,
    chartData,
  } = useSubscriberOverviewDashboard(locale)

  useEffect(() => {
    function checkMobile() {
      setIsMobile(window.innerWidth < 640)
    }
    checkMobile()
    window.addEventListener("resize", checkMobile)
    return () => window.removeEventListener("resize", checkMobile)
  }, [])

  const weightValues = chartData
    .map((d) => d.weight)
    .filter((v): v is number => v != null)
  const yDomain =
    metric === "weight" ? weightDomain(weightValues) : ([0, 100] as [number, number])

  const plotData = chartData.map((d) => ({
    ...d,
    weight: d.weight ?? undefined,
    adherence: d.adherence ?? undefined,
  }))

  const hasPlot =
    !plotData.every((d) =>
      metric === "weight" ? d.weight == null : d.adherence == null,
    )

  const ArrowIcon = isRtl ? ArrowLeft : ArrowRight
  const progressHref = canProgress
    ? APP_ROUTES.subscriber.progress
    : APP_ROUTES.subscriber.subscription
  const historyHref = `${APP_ROUTES.subscriber.history}?tab=progress`

  const controlsMarkup = (
    <div className="flex max-w-full flex-nowrap items-center justify-center gap-1.5 overflow-x-auto no-scrollbar sm:gap-2">
      <div className="flex shrink-0 items-center rounded-full border border-black/[0.04] bg-black/[0.05] p-0.5 sm:p-1">
        <button
          type="button"
          onClick={() => setChartType("area")}
          aria-label={isAr ? "عرض منحنى" : "Area curve view"}
          className={cn(
            "flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-extrabold transition-all duration-200 sm:gap-1.5 sm:px-3 sm:text-[11.5px]",
            chartType === "area"
              ? "bg-white text-[var(--gym-ink,#111111)] shadow-sm"
              : "text-[#777] hover:text-[#111]",
            isAr ? "font-arabic" : "font-heading",
          )}
        >
          <LineChart className="size-3.5" />
          <span>{isAr ? "منحنى" : "Curve"}</span>
        </button>
        <button
          type="button"
          onClick={() => setChartType("column")}
          aria-label={isAr ? "عرض أعمدة" : "Column bars view"}
          className={cn(
            "flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-extrabold transition-all duration-200 sm:gap-1.5 sm:px-3 sm:text-[11.5px]",
            chartType === "column"
              ? "bg-white text-[var(--gym-ink,#111111)] shadow-sm"
              : "text-[#777] hover:text-[#111]",
            isAr ? "font-arabic" : "font-heading",
          )}
        >
          <BarChart2 className="size-3.5" />
          <span>{isAr ? "أعمدة" : "Bars"}</span>
        </button>
      </div>

      <div className="flex shrink-0 items-center rounded-full border border-black/[0.04] bg-black/[0.05] p-0.5 sm:p-1">
        <button
          type="button"
          onClick={() => setMetric("weight")}
          className={cn(
            "rounded-full px-2.5 py-1 text-[11px] font-extrabold transition-all duration-200 sm:px-3.5 sm:text-[12px]",
            metric === "weight"
              ? "bg-[var(--gym-lime,#fb5001)] text-white shadow-[0_2px_10px_rgba(251,80,1,0.35)]"
              : "text-[#666] hover:text-[#111]",
            isAr ? "font-arabic" : "font-heading",
          )}
        >
          {isAr ? "الوزن (كجم)" : "Weight (kg)"}
        </button>
        <button
          type="button"
          onClick={() => setMetric("adherence")}
          className={cn(
            "rounded-full px-2.5 py-1 text-[11px] font-extrabold transition-all duration-200 sm:px-3.5 sm:text-[12px]",
            metric === "adherence"
              ? "bg-[var(--gym-lime,#fb5001)] text-white shadow-[0_2px_10px_rgba(251,80,1,0.35)]"
              : "text-[#666] hover:text-[#111]",
            isAr ? "font-arabic" : "font-heading",
          )}
        >
          {isAr ? "الالتزام (%)" : "Adherence (%)"}
        </button>
      </div>
    </div>
  )

  return (
    <section dir={isRtl ? "rtl" : "ltr"} className="space-y-3.5 select-none">
      <div className="flex flex-col gap-3 px-1 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2
            className={cn(
              "text-[20px] font-black tracking-tight text-[var(--gym-ink,#111111)] sm:text-[22px]",
              isAr ? "font-arabic" : "font-heading",
            )}
          >
            {isAr ? "مؤشرات التقدم والنشاط الرياضي" : "Recent Progress & Activity"}
          </h2>
          <p
            className={cn(
              "mt-0.5 text-[12.5px] font-semibold text-[#8c8c8c] sm:text-[13.5px]",
              isAr ? "font-arabic" : "font-sans",
            )}
          >
            {isAr
              ? "تحليل حي لتطور وزنك والتزامك من سجلات التمارين والتغذية والقياسات"
              : "Live analytics from your measurements, workout logs, and nutrition adherence"}
          </p>
        </div>
        <div className="hidden shrink-0 lg:flex">{controlsMarkup}</div>
      </div>

      {isError ? (
        <div className="rounded-[22px] border border-rose-200 bg-rose-50 p-5 text-[13px] font-semibold text-rose-700">
          {isAr
            ? "تعذر تحميل مؤشرات التقدم. حاول تحديث الصفحة."
            : "Could not load progress analytics. Try refreshing the page."}
        </div>
      ) : null}

      <div className="grid grid-cols-1 items-stretch gap-4 sm:gap-5 lg:grid-cols-3">
        <div className="order-2 flex flex-col gap-2.5 sm:gap-3 lg:order-1 lg:col-span-2">
          <div className="flex w-full items-center justify-center pb-0.5 lg:hidden">
            {controlsMarkup}
          </div>

          <div className="flex h-full flex-col justify-between overflow-hidden rounded-[22px] border border-black/[0.06] bg-white p-5 shadow-[0_4px_24px_rgba(0,0,0,0.03)] transition-all duration-300 hover:shadow-[0_10px_32px_rgba(0,0,0,0.06)] sm:rounded-[26px] sm:p-7">
            <div className="grid grid-cols-1 gap-2.5 border-b border-black/[0.05] pb-5 sm:grid-cols-3 sm:gap-3.5">
              <div className="rounded-[18px] border border-black/[0.04] bg-[#F8F9FA] p-3.5 sm:rounded-[22px] sm:p-4.5">
                <div className="flex items-start justify-between gap-2">
                  <span
                    className={cn(
                      "text-[12px] font-semibold text-[#8c8c8c] sm:text-[13px]",
                      isAr && "font-arabic",
                    )}
                  >
                    {isAr ? "معدل الالتزام" : "Adherence Rate"}
                  </span>
                  <span className="inline-flex size-8 shrink-0 items-center justify-center rounded-2xl bg-white text-[var(--gym-ink,#111111)] shadow-xs sm:size-9">
                    <Activity className="size-4" strokeWidth={1.8} />
                  </span>
                </div>
                <div className="mt-2.5 flex items-baseline gap-2 sm:mt-3">
                  <span
                    className={cn(
                      "font-heading text-[24px] font-extrabold leading-none tracking-tight text-[var(--gym-ink,#111111)] sm:text-[28px]",
                      isAr && "font-arabic",
                    )}
                  >
                    {isLoading
                      ? "…"
                      : currentAdherence != null
                        ? `${currentAdherence}%`
                        : "—"}
                  </span>
                  {adherenceDelta != null && adherenceDelta !== 0 ? (
                    <span
                      className={cn(
                        "inline-flex items-center text-[12px] font-bold",
                        adherenceDelta > 0 ? "text-[#2F7D32]" : "text-rose-600",
                      )}
                    >
                      {adherenceDelta > 0 ? (
                        <TrendingUp className="me-0.5 size-3" />
                      ) : (
                        <TrendingDown className="me-0.5 size-3" />
                      )}
                      {adherenceDelta > 0 ? "+" : ""}
                      {adherenceDelta}%
                    </span>
                  ) : null}
                </div>
                <p
                  className={cn(
                    "mt-2 text-[11.5px] font-medium text-[#8c8c8c]",
                    isAr && "font-arabic",
                  )}
                >
                  {isAr ? "مقارنة بالأسبوع الماضي" : "vs last week"}
                </p>
              </div>

              <div className="rounded-[18px] border border-black/[0.04] bg-[#F8F9FA] p-3.5 sm:rounded-[22px] sm:p-4.5">
                <div className="flex items-start justify-between gap-2">
                  <span
                    className={cn(
                      "text-[12px] font-semibold text-[#8c8c8c] sm:text-[13px]",
                      isAr && "font-arabic",
                    )}
                  >
                    {isAr ? "جلسات الأسبوع" : "Weekly Sessions"}
                  </span>
                  <span className="inline-flex size-8 shrink-0 items-center justify-center rounded-2xl bg-white text-[var(--gym-ink,#111111)] shadow-xs sm:size-9">
                    <CheckCircle2 className="size-4" strokeWidth={1.8} />
                  </span>
                </div>
                <div className="mt-2.5 flex items-baseline gap-1.5 sm:mt-3">
                  <span
                    className={cn(
                      "font-heading text-[24px] font-extrabold leading-none tracking-tight text-[var(--gym-ink,#111111)] sm:text-[28px]",
                      isAr && "font-arabic",
                    )}
                  >
                    {isLoading
                      ? "…"
                      : currentWeek
                        ? `${currentWeek.workoutDone} / ${currentWeek.workoutTotal || "—"}`
                        : "—"}
                  </span>
                  <span className="text-[12px] font-bold text-[#8c8c8c]">
                    {isAr ? "حصص" : "sessions"}
                  </span>
                </div>
                <p
                  className={cn(
                    "mt-2 text-[11.5px] font-medium text-[#8c8c8c]",
                    isAr && "font-arabic",
                  )}
                >
                  {!canWorkout
                    ? isAr
                      ? "الباقة لا تتضمن التمارين حالياً"
                      : "Workout access not included in your package"
                    : currentWeek && currentWeek.workoutTotal
                      ? currentWeek.workoutTotal - currentWeek.workoutDone > 0
                        ? isAr
                          ? `متبقي ${currentWeek.workoutTotal - currentWeek.workoutDone}`
                          : `${currentWeek.workoutTotal - currentWeek.workoutDone} remaining`
                        : isAr
                          ? "اكتملت حصص الأسبوع"
                          : "Week sessions complete"
                      : isAr
                        ? "لا يوجد برنامج تمارين نشط"
                        : "No active workout plan"}
                </p>
              </div>

              <div className="rounded-[18px] border border-black/[0.04] bg-[#F8F9FA] p-3.5 sm:rounded-[22px] sm:p-4.5">
                <div className="flex items-start justify-between gap-2">
                  <span
                    className={cn(
                      "text-[12px] font-semibold text-[#8c8c8c] sm:text-[13px]",
                      isAr && "font-arabic",
                    )}
                  >
                    {isAr ? "الوزن الحالي" : "Current Weight"}
                  </span>
                  <span className="inline-flex size-8 shrink-0 items-center justify-center rounded-2xl bg-white text-[var(--gym-ink,#111111)] shadow-xs sm:size-9">
                    <Scale className="size-4" strokeWidth={1.8} />
                  </span>
                </div>
                <div className="mt-2.5 flex items-baseline gap-1.5 sm:mt-3">
                  <span
                    className={cn(
                      "font-heading text-[24px] font-extrabold leading-none tracking-tight text-[var(--gym-ink,#111111)] sm:text-[28px]",
                      isAr && "font-arabic",
                    )}
                  >
                    {isLoading ? "…" : latestWeight != null ? latestWeight : "—"}
                  </span>
                  <span className="text-[12px] font-bold text-[#8c8c8c]">
                    {isAr ? "كجم" : "kg"}
                  </span>
                  {weightChange != null && weightChange !== 0 ? (
                    <span
                      className={cn(
                        "ms-auto inline-flex items-center text-[11.5px] font-bold",
                        weightChange < 0 ? "text-[#2F7D32]" : "text-rose-600",
                      )}
                    >
                      {weightChange < 0 ? (
                        <TrendingDown className="me-0.5 size-3" />
                      ) : (
                        <TrendingUp className="me-0.5 size-3" />
                      )}
                      {weightChange > 0 ? "+" : ""}
                      {weightChange} {isAr ? "كجم" : "kg"}
                    </span>
                  ) : null}
                </div>
                <p
                  className={cn(
                    "mt-2 text-[11.5px] font-medium text-[#8c8c8c]",
                    isAr && "font-arabic",
                  )}
                >
                  {measurements.length
                    ? isAr
                      ? `${measurements.length} قياسات مسجّلة`
                      : `${measurements.length} logged check-ins`
                    : isAr
                      ? "سجّل أول قياس لبدء المنحنى"
                      : "Log your first check-in to start the curve"}
                </p>
              </div>
            </div>

            <div className="pt-6">
              <div className="mb-4 flex items-center justify-between gap-2.5">
                <div className="flex min-w-0 items-center gap-1.5">
                  <span
                    className={cn(
                      "truncate text-[13px] font-extrabold text-[var(--gym-ink,#111111)] sm:text-[14px]",
                      isAr && "font-arabic",
                    )}
                  >
                    {metric === "weight"
                      ? isAr
                        ? "منحنى تغير وتطور الوزن"
                        : "Weight Progression"
                      : isAr
                        ? "منحنى الالتزام بالحصص والوجبات"
                        : "Adherence Rate Trend"}
                  </span>
                  <span className="shrink-0 rounded-md bg-black/5 px-2 py-0.5 text-[10.5px] font-bold text-[#666]">
                    {metric === "weight" ? (isAr ? "كجم" : "kg") : "%"}
                  </span>
                </div>
                <span className="shrink-0 whitespace-nowrap text-[11px] font-semibold text-[#888] sm:text-[11.5px]">
                  {isAr ? "آخر 7 أسابيع" : "Last 7 weeks"}
                </span>
              </div>

              <div className="h-[250px] w-full sm:h-[280px]">
                {isLoading ? (
                  <div className="flex h-full items-center justify-center text-[13px] font-semibold text-[#8c8c8c]">
                    {isAr ? "جارٍ تحميل المؤشرات…" : "Loading analytics…"}
                  </div>
                ) : !hasPlot ? (
                  <div className="flex h-full flex-col items-center justify-center px-4 text-center">
                    <Scale className="mb-2 size-8 text-[var(--gym-lime,#fb5001)]" />
                    <p className="text-[13px] font-bold text-[var(--gym-ink,#111111)]">
                      {metric === "weight"
                        ? isAr
                          ? "لا توجد قياسات وزن بعد"
                          : "No weight check-ins yet"
                        : isAr
                          ? "لا توجد بيانات التزام بعد"
                          : "No adherence data yet"}
                    </p>
                    <Link
                      to={
                        metric === "weight"
                          ? progressHref
                          : canWorkout
                            ? APP_ROUTES.subscriber.workoutLog
                            : APP_ROUTES.subscriber.subscription
                      }
                      className="mt-3 text-[12px] font-bold text-[var(--gym-lime,#fb5001)]"
                    >
                      {metric === "weight"
                        ? canProgress
                          ? isAr
                            ? "تسجيل أول قياس"
                            : "Log your first check-in"
                          : isAr
                            ? "راجع اشتراكك لتفعيل التقدم"
                            : "Review subscription for progress access"
                        : isAr
                          ? "سجّل حصة تمارين"
                          : "Log a workout session"}
                    </Link>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    {chartType === "area" ? (
                      <AreaChart
                        data={plotData}
                        margin={{ top: 12, right: 16, left: 0, bottom: 4 }}
                      >
                        <defs>
                          <linearGradient
                            id="progressLiveGradient"
                            x1="0"
                            y1="0"
                            x2="0"
                            y2="1"
                          >
                            <stop offset="5%" stopColor="#fb5001" stopOpacity={0.28} />
                            <stop offset="95%" stopColor="#fb5001" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid
                          strokeDasharray="3 3"
                          vertical={false}
                          stroke="rgba(0,0,0,0.06)"
                        />
                        <XAxis
                          dataKey={isMobile ? "weekShort" : isAr ? "week" : "weekEn"}
                          axisLine={false}
                          tickLine={false}
                          interval={0}
                          tick={{
                            fontSize: isMobile ? 10 : 11,
                            fill: "#777",
                            fontWeight: 700,
                          }}
                        />
                        <YAxis
                          domain={yDomain}
                          axisLine={false}
                          tickLine={false}
                          width={42}
                          tickMargin={8}
                          tick={{ fontSize: 11.5, fill: "#777", fontWeight: 700 }}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "#111111",
                            borderRadius: "14px",
                            border: "1px solid rgba(255,255,255,0.15)",
                            boxShadow: "0 12px 32px rgba(0,0,0,0.25)",
                            color: "#ffffff",
                            fontSize: "12px",
                            fontWeight: 700,
                          }}
                          formatter={(val: unknown) => [
                            metric === "weight"
                              ? `${val ?? "—"} ${isAr ? "كجم" : "kg"}`
                              : `${val ?? "—"}%`,
                            metric === "weight"
                              ? isAr
                                ? "الوزن"
                                : "Weight"
                              : isAr
                                ? "الالتزام"
                                : "Adherence",
                          ]}
                        />
                        <Area
                          type="monotone"
                          dataKey={metric}
                          stroke="#fb5001"
                          strokeWidth={3}
                          fillOpacity={1}
                          fill="url(#progressLiveGradient)"
                          connectNulls
                          dot={{
                            r: 4.5,
                            fill: "#fb5001",
                            stroke: "#ffffff",
                            strokeWidth: 2,
                          }}
                          activeDot={{
                            r: 7,
                            fill: "#fb5001",
                            stroke: "#ffffff",
                            strokeWidth: 2.5,
                          }}
                        />
                      </AreaChart>
                    ) : (
                      <BarChart
                        data={plotData}
                        margin={{ top: 12, right: 16, left: 0, bottom: 4 }}
                      >
                        <defs>
                          <linearGradient
                            id="progressLiveBar"
                            x1="0"
                            y1="0"
                            x2="0"
                            y2="1"
                          >
                            <stop offset="0%" stopColor="#fb5001" stopOpacity={1} />
                            <stop offset="100%" stopColor="#e04300" stopOpacity={0.85} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid
                          strokeDasharray="3 3"
                          vertical={false}
                          stroke="rgba(0,0,0,0.06)"
                        />
                        <XAxis
                          dataKey={isMobile ? "weekShort" : isAr ? "week" : "weekEn"}
                          axisLine={false}
                          tickLine={false}
                          interval={0}
                          tick={{
                            fontSize: isMobile ? 10 : 11,
                            fill: "#777",
                            fontWeight: 700,
                          }}
                        />
                        <YAxis
                          domain={yDomain}
                          axisLine={false}
                          tickLine={false}
                          width={42}
                          tickMargin={8}
                          tick={{ fontSize: 11.5, fill: "#777", fontWeight: 700 }}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "#111111",
                            borderRadius: "14px",
                            border: "1px solid rgba(255,255,255,0.15)",
                            boxShadow: "0 12px 32px rgba(0,0,0,0.25)",
                            color: "#ffffff",
                            fontSize: "12px",
                            fontWeight: 700,
                          }}
                          formatter={(val: unknown) => [
                            metric === "weight"
                              ? `${val ?? "—"} ${isAr ? "كجم" : "kg"}`
                              : `${val ?? "—"}%`,
                            metric === "weight"
                              ? isAr
                                ? "الوزن"
                                : "Weight"
                              : isAr
                                ? "الالتزام"
                                : "Adherence",
                          ]}
                        />
                        <Bar
                          dataKey={metric}
                          fill="url(#progressLiveBar)"
                          radius={[8, 8, 0, 0]}
                          maxBarSize={36}
                        />
                      </BarChart>
                    )}
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between gap-3 border-t border-black/[0.05] pt-4">
              <span className="text-[12px] font-semibold text-[#888]">
                {isAr
                  ? "تُحدَّث تلقائياً من القياسات وسجلات التمارين والتغذية"
                  : "Updates automatically from measurements and session logs"}
              </span>
              <Link
                to={historyHref}
                className={cn(
                  "group/link inline-flex shrink-0 items-center gap-1.5 text-[12.5px] font-bold text-[var(--gym-lime,#fb5001)] transition-colors hover:text-[#e04500] sm:text-[13px]",
                  isAr ? "font-arabic" : "font-heading",
                )}
              >
                <span>
                  {isAr ? "عرض السجل الكامل والصور" : "View Full History & Photos"}
                </span>
                <ArrowIcon
                  className="size-3.5 transition-transform group-hover/link:translate-x-1 rtl:rotate-180 rtl:group-hover/link:-translate-x-1"
                  strokeWidth={2.5}
                />
              </Link>
            </div>
          </div>
        </div>

        <div className="order-1 flex h-full flex-col lg:order-2 lg:col-span-1">
          <SubscriberWeeklyAdherenceCard className="h-full" />
        </div>
      </div>
    </section>
  )
}
