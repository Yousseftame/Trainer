import { useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import {
  ArrowLeftRight,
  Camera,
  Plus,
  ShieldCheck,
} from "lucide-react"
import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { AddProgressPhotoDialog } from "@/components/dashboard/AddProgressPhotoDialog"
import { LogMeasurementDialog } from "@/components/dashboard/LogMeasurementDialog"
import { LogPerformanceDialog } from "@/components/dashboard/LogPerformanceDialog"
import { PhotoComparisonDialog } from "@/components/dashboard/PhotoComparisonDialog"
import { FilterChip } from "@/components/dashboard/StatCard"
import { StatusBadge } from "@/components/dashboard/StatusBadge"
import { useAuth } from "@/features/auth/auth-context"
import {
  adherenceFor,
  latestWeek,
} from "@/features/progress/demo"
import {
  useMeasurementsQuery,
  usePerformanceQuery,
  usePhotosQuery,
  useSaveMeasurementMutation,
  useSavePerformanceMutation,
  useSavePhotoMutation,
} from "@/features/progress/hooks"
import { useSubscribersQuery } from "@/features/subscribers/hooks"
import { useDocumentTitle } from "@/hooks/useDocumentTitle"
import { useLocale } from "@/hooks/useLocale"
import { formatChartDate, formatDate, initials } from "@/lib/format"
import { cn } from "@/lib/utils"

type SubscriberProgressTab = "body" | "photos" | "performance" | "adherence"

const INK = "var(--gym-ink,#063434)"
const LIME = "var(--gym-lime,#b8fe22)"

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
  const { user } = useAuth()
  useDocumentTitle(t("nav.progress"))

  const { data: subscribers = [] } = useSubscribersQuery()

  // Match current subscriber from auth or fallback to primary demo subscriber
  const currentSubscriber = useMemo(() => {
    if (!user) return subscribers[0]
    return (
      subscribers.find(
        (s) => s.email.toLowerCase() === user.email?.toLowerCase() || s.id === user.uid,
      ) ?? subscribers[0]
    )
  }, [user, subscribers])

  const subscriberId = currentSubscriber?.id ?? "sub-alex"

  // React Query hooks for real-time progress data
  const { data: measurements = [] } = useMeasurementsQuery(subscriberId)
  const { data: photos = [] } = usePhotosQuery(subscriberId)
  const { data: lifts = [] } = usePerformanceQuery(subscriberId)

  // Mutations
  const saveMeasurementMutation = useSaveMeasurementMutation()
  const savePhotoMutation = useSavePhotoMutation()
  const savePerformanceMutation = useSavePerformanceMutation()

  // UI States
  const [tab, setTab] = useState<SubscriberProgressTab>("body")
  const [measurementModalOpen, setMeasurementModalOpen] = useState(false)
  const [photoModalOpen, setPhotoModalOpen] = useState(false)
  const [performanceModalOpen, setPerformanceModalOpen] = useState(false)
  const [compareModalOpen, setCompareModalOpen] = useState(false)

  // Computed metrics
  const firstMeasurement = measurements[0]
  const latestMeasurement = measurements[measurements.length - 1]
  const currentWeight = latestMeasurement?.weightKg ?? currentSubscriber?.startingWeightKg
  const startWeight = firstMeasurement?.weightKg ?? currentSubscriber?.startingWeightKg
  const targetWeight = currentSubscriber?.targetWeightKg
  const totalChangeKg =
    currentWeight != null && startWeight != null
      ? Math.round((currentWeight - startWeight) * 10) / 10
      : null

  const weeks = useMemo(() => adherenceFor(subscriberId), [subscriberId])
  const week = useMemo(() => latestWeek(subscriberId), [subscriberId])
  const workoutPct = week ? percent(week.workoutDone, week.workoutTotal) : null
  const nutritionPct = week ? percent(week.nutritionDone, week.nutritionTotal) : null

  // Group lifts by exercise name
  const groupedLifts = useMemo(() => {
    const map = new Map<string, typeof lifts>()
    for (const lift of lifts) {
      const list = map.get(lift.name) ?? []
      list.push(lift)
      map.set(lift.name, list)
    }
    return [...map.entries()].map(([name, records]) => {
      const sorted = [...records].sort(
        (a, b) => new Date(a.recordedAt).getTime() - new Date(b.recordedAt).getTime(),
      )
      const first = sorted[0]
      const latest = sorted[sorted.length - 1]
      return {
        name,
        latest: latest.value,
        delta: Math.round((latest.value - first.value) * 10) / 10,
        unit: latest.unit,
      }
    })
  }, [lifts])

  return (
    <div className="flex flex-col gap-4 sm:gap-6">
      {/* Top Banner / Hero */}
      <div className="relative overflow-hidden rounded-[28px] bg-gradient-to-br from-[var(--gym-ink,#063434)] to-[#032020] p-5 text-white sm:p-7">
        <div className="relative z-10 flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-4">
            <span className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-[var(--gym-lime,#b8fe22)] font-heading text-[18px] font-extrabold text-[var(--gym-ink,#063434)] shadow-md">
              {initials(currentSubscriber?.displayName || "Member")}
            </span>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="font-heading text-[22px] font-extrabold tracking-tight sm:text-[26px]">
                  {currentSubscriber?.displayName}
                </h1>
                <StatusBadge label={isAr ? "نشط" : "Active"} tone="success" />
              </div>
              <p className="mt-1 text-[13px] font-medium text-white/70">
                {isAr ? "متابعة تطور الجسم والأداء الرياضي" : "Your personal transformation & athletic tracking"}
              </p>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
            <button
              type="button"
              onClick={() => setMeasurementModalOpen(true)}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-[var(--gym-lime,#b8fe22)] px-5 text-[13px] font-extrabold text-[var(--gym-ink,#063434)] shadow-sm transition hover:opacity-95"
            >
              <Plus className="size-4" strokeWidth={2.5} />
              {isAr ? "تسجيل قياسات" : "Log Check-in"}
            </button>

            <button
              type="button"
              onClick={() => setPhotoModalOpen(true)}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-white/10 px-4 text-[13px] font-bold text-white backdrop-blur-xs transition hover:bg-white/20"
            >
              <Camera className="size-4" />
              {isAr ? "رفع صورة" : "Add Photo"}
            </button>

            {photos.length >= 2 ? (
              <button
                type="button"
                onClick={() => setCompareModalOpen(true)}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-white/10 px-4 text-[13px] font-bold text-white backdrop-blur-xs transition hover:bg-white/20"
              >
                <ArrowLeftRight className="size-4" />
                {isAr ? "مقارنة الصور" : "Compare"}
              </button>
            ) : null}
          </div>
        </div>

        {/* Highlight Stats Strip */}
        <div className="mt-6 grid grid-cols-2 gap-2.5 border-t border-white/10 pt-5 sm:grid-cols-4 sm:gap-4">
          <div className="rounded-2xl bg-white/5 p-3 backdrop-blur-xs">
            <p className="text-[11px] font-bold text-white/60">
              {isAr ? "الوزن الحالي" : "Current Weight"}
            </p>
            <p className="mt-1 font-heading text-[20px] font-extrabold text-white">
              {currentWeight != null ? `${currentWeight} kg` : "—"}
            </p>
          </div>

          <div className="rounded-2xl bg-white/5 p-3 backdrop-blur-xs">
            <p className="text-[11px] font-bold text-white/60">
              {isAr ? "الوزن المستهدف" : "Target Weight"}
            </p>
            <p className="mt-1 font-heading text-[20px] font-extrabold text-white">
              {targetWeight != null ? `${targetWeight} kg` : "—"}
            </p>
          </div>

          <div className="rounded-2xl bg-white/5 p-3 backdrop-blur-xs">
            <p className="text-[11px] font-bold text-white/60">
              {isAr ? "التغير الكلي" : "Total Change"}
            </p>
            <p className="mt-1 font-heading text-[20px] font-extrabold text-[var(--gym-lime,#b8fe22)]">
              {totalChangeKg != null ? `${signed(totalChangeKg)} kg` : "—"}
            </p>
          </div>

          <div className="rounded-2xl bg-white/5 p-3 backdrop-blur-xs">
            <p className="text-[11px] font-bold text-white/60">
              {isAr ? "التزام الأسبوع" : "Weekly Adherence"}
            </p>
            <p className="mt-1 font-heading text-[18px] font-extrabold text-white">
              {workoutPct != null ? `${workoutPct}%` : "—"}
              {nutritionPct != null ? (
                <span className="ms-1.5 text-[12px] text-white/70">
                  ({nutritionPct}% {isAr ? "تغذية" : "nutr"})
                </span>
              ) : null}
            </p>
          </div>
        </div>
      </div>

      {/* Main Content Card with Navigation Tabs */}
      <section className="rounded-[28px] bg-white p-4 sm:p-6 lg:p-7 shadow-xs">
        {/* Navigation Tabs */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#F0F0F0] pb-4">
          <div className="-mx-1 flex gap-2 overflow-x-auto px-1 [scrollbar-width:none]">
            <FilterChip active={tab === "body"} onClick={() => setTab("body")}>
              {isAr ? "الوزن والقياسات" : "Weight & Measurements"}
            </FilterChip>
            <FilterChip active={tab === "photos"} onClick={() => setTab("photos")}>
              {isAr ? "صور التقدم" : "Progress Photos"} ({photos.length})
            </FilterChip>
            <FilterChip active={tab === "performance"} onClick={() => setTab("performance")}>
              {isAr ? "الأرقام الرياضية" : "Lifts & PRs"}
            </FilterChip>
            <FilterChip active={tab === "adherence"} onClick={() => setTab("adherence")}>
              {isAr ? "سجل الالتزام" : "Weekly Consistency"}
            </FilterChip>
          </div>

          <p className="hidden text-[12px] font-medium text-[#8c8c8c] sm:flex items-center gap-1.5">
            <ShieldCheck className="size-4 text-emerald-600" />
            {isAr ? "سجلاتك خاصة تماماً ومحمية" : "Private & encrypted coaching records"}
          </p>
        </div>

        {/* Tab 1: Body Measurements & Weight */}
        {tab === "body" && (
          <div className="mt-5 space-y-5">
            {/* Weight Chart */}
            <div className="rounded-[22px] bg-[#F9F9F9] p-4 sm:p-5">
              <div className="mb-2 flex items-center justify-between">
                <div>
                  <h3 className="font-heading text-[16px] font-bold text-[var(--gym-ink,#063434)]">
                    {isAr ? "تطور وزن الجسم" : "Body Weight Trend"}
                  </h3>
                  <p className="text-[12px] text-[#8c8c8c]">
                    {isAr ? "متابعة التغير على مدار الأسابيع" : "Historical weigh-ins over time"}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setMeasurementModalOpen(true)}
                  className="rounded-full bg-white px-3.5 py-1.5 text-[12px] font-bold text-[var(--gym-ink,#063434)] shadow-2xs hover:bg-[#F4F4F4]"
                >
                  {isAr ? "+ وزن جديد" : "+ New Weigh-in"}
                </button>
              </div>

              {measurements.length >= 2 ? (
                <div className="h-[230px] w-full sm:h-[270px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={measurements
                        .filter((m) => m.weightKg != null)
                        .map((m) => ({
                          date: formatChartDate(m.recordedAt, locale),
                          kg: m.weightKg,
                        }))}
                      margin={{ top: 10, right: 10, left: 0, bottom: 4 }}
                    >
                      <defs>
                        <linearGradient id="subWeightFill" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#063434" stopOpacity={0.25} />
                          <stop offset="100%" stopColor="#063434" stopOpacity={0} />
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
                          background: "#063434",
                          border: "none",
                          borderRadius: 12,
                          color: "#fff",
                          fontSize: 12,
                          fontWeight: 600,
                        }}
                        formatter={(val) => [`${val} kg`, isAr ? "الوزن" : "Weight"]}
                      />
                      <Area
                        type="monotone"
                        dataKey="kg"
                        stroke={INK}
                        strokeWidth={2.5}
                        fill="url(#subWeightFill)"
                        dot={{ r: 4, fill: INK, stroke: "#fff", strokeWidth: 2 }}
                        activeDot={{ r: 6, fill: INK, stroke: "#fff", strokeWidth: 2 }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="flex h-40 items-center justify-center text-[13px] font-medium text-[#8c8c8c]">
                  {isAr ? "سجل على الأقل قراءتين لعرض الرسم البياني" : "Log at least two weigh-ins to see the progress chart"}
                </div>
              )}
            </div>

            {/* Measurements Table */}
            <div className="rounded-[22px] bg-[#F9F9F9] p-4 sm:p-5">
              <h3 className="mb-3 font-heading text-[16px] font-bold text-[var(--gym-ink,#063434)]">
                {isAr ? "سجل القياسات التفصيلي" : "Detailed Measurement Log"}
              </h3>
              {measurements.length === 0 ? (
                <p className="text-[13px] text-[#8c8c8c]">
                  {isAr ? "لا توجد قياسات مسجلة بعد." : "No measurements logged yet."}
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[640px] text-start text-[13px]">
                    <thead>
                      <tr className="border-b border-black/5 text-[11px] font-bold uppercase tracking-[0.06em] text-[#8c8c8c]">
                        <th className="pb-2.5 font-bold pe-3">{isAr ? "التاريخ" : "Date"}</th>
                        <th className="pb-2.5 font-bold pe-3">{isAr ? "الوزن" : "Weight"}</th>
                        <th className="pb-2.5 font-bold pe-3">{isAr ? "الخصر" : "Waist"}</th>
                        <th className="pb-2.5 font-bold pe-3">{isAr ? "الصدر" : "Chest"}</th>
                        <th className="pb-2.5 font-bold pe-3">{isAr ? "الوركين" : "Hips"}</th>
                        <th className="pb-2.5 font-bold pe-3">{isAr ? "الذراع" : "Arms"}</th>
                        <th className="pb-2.5 font-bold pe-3">{isAr ? "الفخذ" : "Thighs"}</th>
                        <th className="pb-2.5 font-bold">{isAr ? "ملاحظات" : "Notes"}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[...measurements].reverse().map((row, idx, arr) => {
                        const older = idx < arr.length - 1 ? arr[idx + 1] : undefined
                        const weightDiff =
                          row.weightKg != null && older?.weightKg != null
                            ? Math.round((row.weightKg - older.weightKg) * 10) / 10
                            : null

                        return (
                          <tr key={row.id} className="border-b border-black/5 font-medium text-[var(--gym-ink,#063434)]">
                            <td className="py-3 pe-3 whitespace-nowrap">{formatDate(row.recordedAt, locale)}</td>
                            <td className="py-3 pe-3 font-bold whitespace-nowrap">
                              {row.weightKg != null ? `${row.weightKg} kg` : "—"}
                              {weightDiff != null ? (
                                <span className={cn("ms-1 text-[11px]", weightDiff > 0 ? "text-amber-600" : "text-emerald-600")}>
                                  {signed(weightDiff)}
                                </span>
                              ) : null}
                            </td>
                            <td className="py-3 pe-3">{row.waistCm != null ? `${row.waistCm} cm` : "—"}</td>
                            <td className="py-3 pe-3">{row.chestCm != null ? `${row.chestCm} cm` : "—"}</td>
                            <td className="py-3 pe-3">{row.hipsCm != null ? `${row.hipsCm} cm` : "—"}</td>
                            <td className="py-3 pe-3">{row.armsCm != null ? `${row.armsCm} cm` : "—"}</td>
                            <td className="py-3 pe-3">{row.thighsCm != null ? `${row.thighsCm} cm` : "—"}</td>
                            <td className="py-3 text-[12px] text-[#6B7280]">{row.notes || "—"}</td>
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

        {/* Tab 2: Photos */}
        {tab === "photos" && (
          <div className="mt-5 space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="font-heading text-[16px] font-bold text-[var(--gym-ink,#063434)]">
                  {isAr ? "معرض صور التقدم الخاص بك" : "Your Transformation Gallery"}
                </h3>
                <p className="text-[12px] text-[#8c8c8c]">
                  {isAr ? "الصور مرئية لك وللمدرب فقط لتقييم التقدم البدني" : "Only visible to you and your coach"}
                </p>
              </div>

              <div className="flex items-center gap-2">
                {photos.length >= 2 ? (
                  <button
                    type="button"
                    onClick={() => setCompareModalOpen(true)}
                    className="inline-flex h-9 items-center gap-1.5 rounded-full bg-[#F4F4F4] px-4 text-[12px] font-bold text-[var(--gym-ink,#063434)] hover:bg-[#ececec]"
                  >
                    <ArrowLeftRight className="size-3.5" />
                    {isAr ? "مقارنة جنباً إلى جنب" : "Side-by-Side"}
                  </button>
                ) : null}

                <button
                  type="button"
                  onClick={() => setPhotoModalOpen(true)}
                  className="inline-flex h-9 items-center gap-1.5 rounded-full bg-[var(--gym-ink,#063434)] px-4 text-[12px] font-bold text-white hover:opacity-95"
                >
                  <Plus className="size-3.5" />
                  {isAr ? "رفع صورة جديدة" : "Add Photo"}
                </button>
              </div>
            </div>

            {photos.length === 0 ? (
              <div className="flex min-h-48 flex-col items-center justify-center rounded-[22px] bg-[#F9F9F9] p-6 text-center text-[#8c8c8c]">
                <Camera className="size-8 stroke-[1.5]" />
                <p className="mt-2 text-[14px] font-bold text-[var(--gym-ink,#063434)]">
                  {isAr ? "لم تقم برفع صور تقدم حتى الآن" : "No progress photos uploaded yet"}
                </p>
                <p className="mt-0.5 max-w-sm text-[12px]">
                  {isAr ? "التقط صوراً أسبوعية أو شهرية في نفس الإضاءة لملاحظة الفارق!" : "Take consistent weekly or monthly photos in the same lighting to track your transformation!"}
                </p>
                <button
                  type="button"
                  onClick={() => setPhotoModalOpen(true)}
                  className="mt-4 rounded-full bg-[var(--gym-ink,#063434)] px-5 py-2 text-[12px] font-bold text-white shadow-sm"
                >
                  {isAr ? "رفع صورتك الأولى" : "Upload your first photo"}
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                {photos.map((item) => (
                  <figure
                    key={item.id}
                    className="overflow-hidden rounded-2xl bg-[var(--gym-ink,#063434)] text-white shadow-2xs"
                  >
                    <div className="relative flex aspect-[3/4] items-center justify-center bg-black/40">
                      {item.storagePath?.startsWith("data:") || item.storagePath?.startsWith("http") ? (
                        <img
                          src={item.storagePath}
                          alt="Progress"
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <span className="font-heading text-[22px] font-extrabold text-white/80">
                          {item.pose?.toUpperCase() || "•"}
                        </span>
                      )}
                      <span className="absolute bottom-2 start-2 rounded-md bg-black/60 px-2 py-0.5 text-[10px] font-bold uppercase backdrop-blur-xs">
                        {item.pose ? t(`admin.progress.pose.${item.pose}`) : "Photo"}
                      </span>
                    </div>
                    <figcaption className="p-2.5 text-[11px] font-bold text-white/80">
                      <span>{formatDate(item.takenAt, locale)}</span>
                      {item.caption ? (
                        <span className="mt-0.5 block truncate text-[10px] font-medium text-white/60">
                          {item.caption}
                        </span>
                      ) : null}
                    </figcaption>
                  </figure>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Performance & Lifts */}
        {tab === "performance" && (
          <div className="mt-5 space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-heading text-[16px] font-bold text-[var(--gym-ink,#063434)]">
                  {isAr ? "الأرقام الرياضية وأفضل الإنجازات (PR)" : "Personal Records & Lifts"}
                </h3>
                <p className="text-[12px] text-[#8c8c8c]">
                  {isAr ? "متابعة زيادة القوة والأوزان المرفوعة" : "Track strength progression and heavy sets"}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setPerformanceModalOpen(true)}
                className="inline-flex h-9 items-center gap-1.5 rounded-full bg-[var(--gym-ink,#063434)] px-4 text-[12px] font-bold text-white hover:opacity-95"
              >
                <Plus className="size-3.5" />
                {isAr ? "تسجيل رقم جديد" : "Log PR"}
              </button>
            </div>

            {/* PR Summary Cards */}
            {groupedLifts.length ? (
              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
                {groupedLifts.map((lift) => (
                  <div key={lift.name} className="rounded-2xl border border-black/5 bg-[#F9F9F9] p-4">
                    <p className="text-[12px] font-bold text-[#8c8c8c]">{lift.name}</p>
                    <p className="mt-1 font-heading text-[24px] font-extrabold text-[var(--gym-ink,#063434)]">
                      {lift.latest} {lift.unit}
                    </p>
                    <p className="mt-1 text-[12px] font-bold text-emerald-600">
                      {signed(lift.delta)} {lift.unit} {isAr ? "منذ البداية" : "gain"}
                    </p>
                  </div>
                ))}
              </div>
            ) : null}

            {/* Lifts Table */}
            <div className="rounded-[22px] bg-[#F9F9F9] p-4 sm:p-5">
              <h4 className="mb-3 text-[14px] font-bold text-[var(--gym-ink,#063434)]">
                {isAr ? "سجل التمارين والأوزان" : "Lifts Log"}
              </h4>
              {lifts.length === 0 ? (
                <p className="text-[13px] text-[#8c8c8c]">
                  {isAr ? "لا توجد أرقام مسجلة بعد." : "No lift records logged yet."}
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[480px] text-start text-[13px]">
                    <thead>
                      <tr className="border-b border-black/5 text-[11px] font-bold uppercase tracking-[0.06em] text-[#8c8c8c]">
                        <th className="pb-2.5 font-bold pe-3">{isAr ? "التاريخ" : "Date"}</th>
                        <th className="pb-2.5 font-bold pe-3">{isAr ? "التمرين" : "Exercise"}</th>
                        <th className="pb-2.5 font-bold pe-3">{isAr ? "الوزن / التكرار" : "Load / Reps"}</th>
                        <th className="pb-2.5 font-bold">{isAr ? "ملاحظات" : "Notes"}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[...lifts].reverse().map((row) => (
                        <tr key={row.id} className="border-b border-black/5 font-medium text-[var(--gym-ink,#063434)]">
                          <td className="py-2.5 pe-3 whitespace-nowrap">{formatDate(row.recordedAt, locale)}</td>
                          <td className="py-2.5 pe-3 font-bold">{row.name}</td>
                          <td className="py-2.5 pe-3 whitespace-nowrap">
                            {row.value} {row.unit}
                          </td>
                          <td className="py-2.5 text-[12px] text-[#6B7280]">{row.notes || "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 4: Adherence */}
        {tab === "adherence" && (
          <div className="mt-5 space-y-5">
            <div>
              <h3 className="font-heading text-[16px] font-bold text-[var(--gym-ink,#063434)]">
                {isAr ? "الالتزام الأسبوعي بالتمارين والوجبات" : "Weekly Consistency Score"}
              </h3>
              <p className="text-[12px] text-[#8c8c8c]">
                {isAr ? "نسبة إتمام الحصص التدريبية والوجبات المبرمجة" : "Completion rate of programmed workout days and meals"}
              </p>
            </div>

            {weeks.length ? (
              <div className="rounded-[22px] bg-[#F9F9F9] p-4 sm:p-5">
                <div className="h-[220px] w-full sm:h-[260px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={weeks.map((w) => ({
                        date: formatChartDate(w.weekStart, locale),
                        workout: w.workoutTotal ? percent(w.workoutDone, w.workoutTotal) : 0,
                        nutrition: w.nutritionTotal ? percent(w.nutritionDone, w.nutritionTotal) : 0,
                      }))}
                      barSize={16}
                      margin={{ top: 8, right: 8, left: 0, bottom: 4 }}
                    >
                      <CartesianGrid stroke="#E8E8E8" strokeDasharray="3 3" vertical={false} />
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
                        cursor={{ fill: "rgba(6,52,52,0.04)" }}
                        contentStyle={{
                          background: "#063434",
                          border: "none",
                          borderRadius: 12,
                          color: "#fff",
                          fontSize: 12,
                          fontWeight: 600,
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
                        fill={LIME}
                        radius={[6, 6, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            ) : (
              <p className="text-[13px] text-[#8c8c8c]">
                {isAr ? "لا توجد أسابيع مسجلة بعد." : "No adherence history logged yet."}
              </p>
            )}
          </div>
        )}
      </section>

      {/* Dialog Modals */}
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
    </div>
  )
}
