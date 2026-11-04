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
import { useLocale } from "@/hooks/useLocale"
import { cn } from "@/lib/utils"
import { SubscriberWeeklyAdherenceCard } from "./SubscriberWeeklyAdherenceCard"

type ChartMetric = "weight" | "adherence"
type ChartType = "area" | "column"

const WEEKLY_DATA = [
  { week: "أسبوع 1", weekShort: "س 1", weekEn: "W1", weight: 82.5, adherence: 85, workouts: 4 },
  { week: "أسبوع 2", weekShort: "س 2", weekEn: "W2", weight: 81.8, adherence: 88, workouts: 4 },
  { week: "أسبوع 3", weekShort: "س 3", weekEn: "W3", weight: 81.2, adherence: 92, workouts: 5 },
  { week: "أسبوع 4", weekShort: "س 4", weekEn: "W4", weight: 80.5, adherence: 90, workouts: 4 },
  { week: "أسبوع 5", weekShort: "س 5", weekEn: "W5", weight: 79.8, adherence: 95, workouts: 5 },
  { week: "أسبوع 6", weekShort: "س 6", weekEn: "W6", weight: 79.2, adherence: 94, workouts: 4 },
  { week: "الحالي", weekShort: "الآن", weekEn: "Now", weight: 78.8, adherence: 96, workouts: 4 },
]

export function SubscriberActivityProgressChart() {
  const { isRtl } = useLocale()
  const [metric, setMetric] = useState<ChartMetric>("weight")
  const [chartType, setChartType] = useState<ChartType>("area")
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    function checkMobile() {
      setIsMobile(window.innerWidth < 640)
    }
    checkMobile()
    window.addEventListener("resize", checkMobile)
    return () => window.removeEventListener("resize", checkMobile)
  }, [])

  const ArrowIcon = isRtl ? ArrowLeft : ArrowRight

  const controlsMarkup = (
    <div className="flex flex-nowrap items-center justify-center gap-1.5 sm:gap-2 max-w-full overflow-x-auto no-scrollbar">
      {/* Chart Type Toggle (Area vs Column) */}
      <div className="flex shrink-0 items-center rounded-full bg-black/[0.05] p-0.5 sm:p-1 border border-black/[0.04]">
        <button
          type="button"
          onClick={() => setChartType("area")}
          aria-label={isRtl ? "عرض منحنى" : "Area curve view"}
          className={cn(
            "flex items-center gap-1 sm:gap-1.5 rounded-full px-2.5 sm:px-3 py-1 text-[11px] sm:text-[11.5px] font-extrabold transition-all duration-200",
            chartType === "area"
              ? "bg-white text-[var(--gym-ink,#111111)] shadow-sm"
              : "text-[#777] hover:text-[#111]",
            isRtl ? "font-arabic" : "font-heading",
          )}
        >
          <LineChart className="size-3.5" />
          <span>{isRtl ? "منحنى" : "Curve"}</span>
        </button>
        <button
          type="button"
          onClick={() => setChartType("column")}
          aria-label={isRtl ? "عرض أعمدة" : "Column bars view"}
          className={cn(
            "flex items-center gap-1 sm:gap-1.5 rounded-full px-2.5 sm:px-3 py-1 text-[11px] sm:text-[11.5px] font-extrabold transition-all duration-200",
            chartType === "column"
              ? "bg-white text-[var(--gym-ink,#111111)] shadow-sm"
              : "text-[#777] hover:text-[#111]",
            isRtl ? "font-arabic" : "font-heading",
          )}
        >
          <BarChart2 className="size-3.5" />
          <span>{isRtl ? "أعمدة" : "Bars"}</span>
        </button>
      </div>

      {/* Metric Selector Toggle (Weight vs Adherence) */}
      <div className="flex shrink-0 items-center rounded-full bg-black/[0.05] p-0.5 sm:p-1 border border-black/[0.04]">
        <button
          type="button"
          onClick={() => setMetric("weight")}
          className={cn(
            "rounded-full px-2.5 sm:px-3.5 py-1 text-[11px] sm:text-[12px] font-extrabold transition-all duration-200",
            metric === "weight"
              ? "bg-[var(--gym-lime,#fb5001)] text-white shadow-[0_2px_10px_rgba(251,80,1,0.35)]"
              : "text-[#666] hover:text-[#111]",
            isRtl ? "font-arabic" : "font-heading",
          )}
        >
          {isRtl ? "الوزن (كجم)" : "Weight (kg)"}
        </button>
        <button
          type="button"
          onClick={() => setMetric("adherence")}
          className={cn(
            "rounded-full px-2.5 sm:px-3.5 py-1 text-[11px] sm:text-[12px] font-extrabold transition-all duration-200",
            metric === "adherence"
              ? "bg-[var(--gym-lime,#fb5001)] text-white shadow-[0_2px_10px_rgba(251,80,1,0.35)]"
              : "text-[#666] hover:text-[#111]",
            isRtl ? "font-arabic" : "font-heading",
          )}
        >
          {isRtl ? "الالتزام (%)" : "Adherence (%)"}
        </button>
      </div>
    </div>
  )

  return (
    <section dir={isRtl ? "rtl" : "ltr"} className="space-y-3.5 select-none">
      {/* ======================================================== */}
      {/* Section Header with Metric and Chart Type Controls       */}
      {/* ======================================================== */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 px-1">
        <div>
          <h2
            className={cn(
              "text-[20px] sm:text-[22px] font-black text-[var(--gym-ink,#111111)] tracking-tight",
              isRtl ? "font-arabic" : "font-heading",
            )}
          >
            {isRtl ? "مؤشرات التقدم والنشاط الرياضي" : "Recent Progress & Activity"}
          </h2>
          <p
            className={cn(
              "text-[12.5px] sm:text-[13.5px] font-semibold text-[#8c8c8c] mt-0.5",
              isRtl ? "font-arabic" : "font-sans",
            )}
          >
            {isRtl
              ? "تحليل بياني لتطور أوزانك، التزامك بالتمارين، وتغيرات الجسم"
              : "Visual analytics of weight trends, workout adherence, and transformation"}
          </p>
        </div>

        {/* Desktop Controls (hidden on mobile, displayed above the graph on mobile) */}
        <div className="hidden lg:flex shrink-0">
          {controlsMarkup}
        </div>
      </div>

      {/* ======================================================== */}
      {/* Analytics Grid: Trend Chart (2 cols) + Adherence Donut (1 col) */}
      {/* ======================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-5 items-stretch">
        {/* Left (2 Cols on lg): Progression Trend Chart (order-2 on mobile so Donut is above) */}
        <div className="order-2 lg:order-1 lg:col-span-2 flex flex-col gap-2.5 sm:gap-3">
          {/* Mobile Controls (perfectly centered directly above the graph box, hidden on desktop) */}
          <div className="flex lg:hidden justify-center items-center w-full pb-0.5">
            {controlsMarkup}
          </div>

          <div className="h-full overflow-hidden rounded-[22px] sm:rounded-[26px] bg-white p-5 sm:p-7 border border-black/[0.06] shadow-[0_4px_24px_rgba(0,0,0,0.03)] hover:shadow-[0_10px_32px_rgba(0,0,0,0.06)] transition-all duration-300 flex flex-col justify-between">
          {/* Top KPI Telemetry Stat Cards (Admin Panel Design) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3.5 pb-5 border-b border-black/[0.05]">
            {/* Card 1: Weekly Adherence */}
            <div className="rounded-[18px] sm:rounded-[22px] bg-[#F8F9FA] p-3.5 sm:p-4.5 border border-black/[0.04] transition-all hover:bg-black/[0.02]">
              <div className="flex items-start justify-between gap-2">
                <span className={cn("text-[12px] sm:text-[13px] font-semibold text-[#8c8c8c]", isRtl && "font-arabic")}>
                  {isRtl ? "معدل الالتزام" : "Adherence Rate"}
                </span>
                <span className="inline-flex size-8 sm:size-9 shrink-0 items-center justify-center rounded-2xl bg-white text-[var(--gym-ink,#111111)] shadow-xs">
                  <Activity className="size-4" strokeWidth={1.8} />
                </span>
              </div>
              <div className="mt-2.5 sm:mt-3 flex items-baseline gap-2">
                <span className={cn("font-heading text-[24px] sm:text-[28px] font-extrabold leading-none tracking-tight text-[var(--gym-ink,#111111)]", isRtl && "font-arabic")}>
                  96%
                </span>
                <span className="inline-flex items-center text-[12px] font-bold text-[#2F7D32]">
                  <TrendingUp className="size-3 me-0.5" />
                  +4%
                </span>
              </div>
              <p className={cn("mt-2 text-[11.5px] font-medium text-[#8c8c8c]", isRtl && "font-arabic")}>
                {isRtl ? "مقارنة بالأسبوع الماضي" : "vs last week"}
              </p>
            </div>

            {/* Card 2: Workouts Completed */}
            <div className="rounded-[18px] sm:rounded-[22px] bg-[#F8F9FA] p-3.5 sm:p-4.5 border border-black/[0.04] transition-all hover:bg-black/[0.02]">
              <div className="flex items-start justify-between gap-2">
                <span className={cn("text-[12px] sm:text-[13px] font-semibold text-[#8c8c8c]", isRtl && "font-arabic")}>
                  {isRtl ? "جلسات الأسبوع" : "Weekly Sessions"}
                </span>
                <span className="inline-flex size-8 sm:size-9 shrink-0 items-center justify-center rounded-2xl bg-white text-[var(--gym-ink,#111111)] shadow-xs">
                  <CheckCircle2 className="size-4" strokeWidth={1.8} />
                </span>
              </div>
              <div className="mt-2.5 sm:mt-3 flex items-baseline gap-1.5">
                <span className={cn("font-heading text-[24px] sm:text-[28px] font-extrabold leading-none tracking-tight text-[var(--gym-ink,#111111)]", isRtl && "font-arabic")}>
                  4 / 5
                </span>
                <span className="text-[12px] font-bold text-[#8c8c8c]">
                  {isRtl ? "حصص" : "sessions"}
                </span>
              </div>
              <p className={cn("mt-2 text-[11.5px] font-medium text-[#8c8c8c]", isRtl && "font-arabic")}>
                {isRtl ? "متبقي حصة واحدة" : "1 session remaining"}
              </p>
            </div>

            {/* Card 3: Current Weight & Change */}
            <div className="rounded-[18px] sm:rounded-[22px] bg-[#F8F9FA] p-3.5 sm:p-4.5 border border-black/[0.04] transition-all hover:bg-black/[0.02]">
              <div className="flex items-start justify-between gap-2">
                <span className={cn("text-[12px] sm:text-[13px] font-semibold text-[#8c8c8c]", isRtl && "font-arabic")}>
                  {isRtl ? "الوزن الحالي" : "Current Weight"}
                </span>
                <span className="inline-flex size-8 sm:size-9 shrink-0 items-center justify-center rounded-2xl bg-white text-[var(--gym-ink,#111111)] shadow-xs">
                  <Scale className="size-4" strokeWidth={1.8} />
                </span>
              </div>
              <div className="mt-2.5 sm:mt-3 flex items-baseline gap-1.5">
                <span className={cn("font-heading text-[24px] sm:text-[28px] font-extrabold leading-none tracking-tight text-[var(--gym-ink,#111111)]", isRtl && "font-arabic")}>
                  78.8
                </span>
                <span className="text-[12px] font-bold text-[#8c8c8c]">
                  {isRtl ? "كجم" : "kg"}
                </span>
                <span className="ms-auto inline-flex items-center text-[11.5px] font-bold text-[#2F7D32]">
                  <TrendingDown className="size-3 me-0.5" />
                  {isRtl ? "3.7- كجم" : "-3.7 kg"}
                </span>
              </div>
              <p className={cn("mt-2 text-[11.5px] font-medium text-[#8c8c8c]", isRtl && "font-arabic")}>
                {isRtl ? "انخفاض صحي ومستمر" : "Healthy steady drop"}
              </p>
            </div>
          </div>

          {/* Chart Header */}
          <div className="pt-6">
            <div className="flex items-center justify-between gap-2.5 mb-4">
              <div className="flex items-center gap-1.5 min-w-0">
                <span
                  className={cn(
                    "truncate text-[13px] sm:text-[14px] font-extrabold text-[var(--gym-ink,#111111)]",
                    isRtl && "font-arabic",
                  )}
                >
                  {metric === "weight"
                    ? isRtl
                      ? "منحنى تغير وتطور الوزن"
                      : "Weight Progression"
                    : isRtl
                      ? (isMobile ? "منحنى الالتزام بالحصص" : "منحنى الالتزام بالحصص والوجبات")
                      : "Adherence Rate Trend"}
                </span>
                <span className="shrink-0 rounded-md bg-black/5 px-2 py-0.5 text-[10.5px] font-bold text-[#666]">
                  {metric === "weight" ? (isRtl ? "كجم" : "kg") : "%"}
                </span>
              </div>
              <span className="shrink-0 whitespace-nowrap text-[11px] sm:text-[11.5px] font-semibold text-[#888]">
                {isRtl ? "آخر 7 أسابيع" : "Last 7 weeks"}
              </span>
            </div>

            {/* Recharts Chart Container (Supports Area Curve & Column Bars) */}
            <div className="h-[250px] sm:h-[280px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                {chartType === "area" ? (
                  <AreaChart
                    data={WEEKLY_DATA}
                    margin={{ top: 12, right: 16, left: 0, bottom: 4 }}
                  >
                    <defs>
                      <linearGradient id="whiteThemeGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#fb5001" stopOpacity={0.28} />
                        <stop offset="95%" stopColor="#fb5001" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.06)" />
                    <XAxis
                      dataKey={isRtl ? (isMobile ? "weekShort" : "week") : (isMobile ? "weekEn" : "weekEn")}
                      axisLine={false}
                      tickLine={false}
                      interval={0}
                      tick={{ fontSize: isMobile ? 10 : 11, fill: "#777", fontWeight: 700 }}
                    />
                    <YAxis
                      domain={metric === "weight" ? [76, 84] : [70, 100]}
                      ticks={metric === "weight" ? [76, 78, 80, 82, 84] : [70, 80, 90, 100]}
                      axisLine={false}
                      tickLine={false}
                      width={42}
                      tickMargin={8}
                      tick={{ fontSize: 11.5, fill: "#777", fontWeight: 700 }}
                      tickFormatter={(val: number) => `${val}`}
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
                      labelFormatter={(label) => {
                        const found = WEEKLY_DATA.find(
                          (d) => d.week === label || d.weekShort === label || d.weekEn === label,
                        )
                        return found ? (isRtl ? found.week : found.weekEn) : String(label)
                      }}
                      formatter={(val: unknown) => [
                        metric === "weight" ? `${val ?? 0} كجم` : `${val ?? 0}%`,
                        metric === "weight" ? (isRtl ? "الوزن" : "Weight") : (isRtl ? "الالتزام" : "Adherence"),
                      ]}
                    />
                    <Area
                      type="monotone"
                      dataKey={metric}
                      stroke="#fb5001"
                      strokeWidth={3}
                      fillOpacity={1}
                      fill="url(#whiteThemeGradient)"
                      dot={{ r: 4.5, fill: "#fb5001", stroke: "#ffffff", strokeWidth: 2 }}
                      activeDot={{ r: 7, fill: "#fb5001", stroke: "#ffffff", strokeWidth: 2.5 }}
                    />
                  </AreaChart>
                ) : (
                  <BarChart
                    data={WEEKLY_DATA}
                    margin={{ top: 12, right: 16, left: 0, bottom: 4 }}
                  >
                    <defs>
                      <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#fb5001" stopOpacity={1} />
                        <stop offset="100%" stopColor="#e04300" stopOpacity={0.85} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.06)" />
                    <XAxis
                      dataKey={isRtl ? (isMobile ? "weekShort" : "week") : (isMobile ? "weekEn" : "weekEn")}
                      axisLine={false}
                      tickLine={false}
                      interval={0}
                      tick={{ fontSize: isMobile ? 10 : 11, fill: "#777", fontWeight: 700 }}
                    />
                    <YAxis
                      domain={metric === "weight" ? [76, 84] : [70, 100]}
                      ticks={metric === "weight" ? [76, 78, 80, 82, 84] : [70, 80, 90, 100]}
                      axisLine={false}
                      tickLine={false}
                      width={42}
                      tickMargin={8}
                      tick={{ fontSize: 11.5, fill: "#777", fontWeight: 700 }}
                      tickFormatter={(val: number) => `${val}`}
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
                      labelFormatter={(label) => {
                        const found = WEEKLY_DATA.find(
                          (d) => d.week === label || d.weekShort === label || d.weekEn === label,
                        )
                        return found ? (isRtl ? found.week : found.weekEn) : String(label)
                      }}
                      formatter={(val: unknown) => [
                        metric === "weight" ? `${val ?? 0} كجم` : `${val ?? 0}%`,
                        metric === "weight" ? (isRtl ? "الوزن" : "Weight") : (isRtl ? "الالتزام" : "Adherence"),
                      ]}
                    />
                    <Bar
                      dataKey={metric}
                      fill="url(#barGradient)"
                      radius={[8, 8, 0, 0]}
                      maxBarSize={36}
                    />
                  </BarChart>
                )}
              </ResponsiveContainer>
            </div>
          </div>

          {/* Bottom Bar: Auto Sync Notice + Direct Link */}
          <div className="mt-4 pt-4 border-t border-black/[0.05] flex items-center justify-between">
            <span className="text-[12px] font-semibold text-[#888]">
              {isRtl ? "يتم تحديث البيانات تلقائياً بمجرد إدخال قياسات جديدة" : "Metrics update automatically with each new entry"}
            </span>

            <Link
              to={APP_ROUTES.subscriber.progress}
              className={cn(
                "group/link inline-flex items-center gap-1.5 text-[12.5px] sm:text-[13px] font-bold text-[var(--gym-lime,#fb5001)] hover:text-[#e04500] transition-colors",
                isRtl ? "font-arabic" : "font-heading",
              )}
            >
              <span>{isRtl ? "عرض السجل الكامل وصور المقارنة" : "View Full History & Photos"}</span>
              <ArrowIcon className="size-3.5 rtl:rotate-180 transition-transform group-hover/link:translate-x-1 rtl:group-hover/link:-translate-x-1" strokeWidth={2.5} />
            </Link>
          </div>
        </div>
      </div>

        {/* Right (1 Col on lg): Weekly Adherence Donut Chart (order-1 on mobile to display before and above) */}
        <div className="order-1 lg:order-2 lg:col-span-1 h-full flex flex-col">
          <SubscriberWeeklyAdherenceCard className="h-full" />
        </div>
      </div>
    </section>
  )
}
