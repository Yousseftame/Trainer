import { useState } from "react"
import { Link } from "react-router-dom"
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts"
import { Activity, Award, CheckCircle2 } from "lucide-react"
import { APP_ROUTES } from "@/config/constants"
import { useSubscriberOverviewDashboard } from "@/features/subscriber-overview/use-overview-dashboard"
import { useLocale } from "@/hooks/useLocale"
import { cn } from "@/lib/utils"

type AdherenceView = "overall" | "workouts"

type SubscriberWeeklyAdherenceCardProps = {
  className?: string
}

export function SubscriberWeeklyAdherenceCard({
  className,
}: SubscriberWeeklyAdherenceCardProps) {
  const { locale, isRtl } = useLocale()
  const isAr = locale === "ar"
  const [view, setView] = useState<AdherenceView>("overall")
  const {
    isLoading,
    canWorkout,
    canNutrition,
    currentWeek,
  } = useSubscriberOverviewDashboard(locale)

  const workoutDone = currentWeek?.workoutDone ?? 0
  const workoutTotal = currentWeek?.workoutTotal ?? 0
  const nutritionDone = currentWeek?.nutritionDone ?? 0
  const nutritionTotal = currentWeek?.nutritionTotal ?? 0
  const workoutRemaining = Math.max(0, workoutTotal - workoutDone)
  const nutritionRemaining = Math.max(0, nutritionTotal - nutritionDone)

  const overallPct =
    workoutTotal + nutritionTotal > 0
      ? Math.round(
          ((workoutDone + nutritionDone) / (workoutTotal + nutritionTotal)) *
            100,
        )
      : 0

  const overallData = [
    {
      key: "workouts",
      label: isAr ? "تمارين مكتملة" : "Completed Workouts",
      value: Math.max(workoutDone, 0.001),
      displayValue: workoutDone,
      share: workoutTotal ? `${workoutDone} / ${workoutTotal}` : "—",
      color: "#111111",
    },
    {
      key: "nutrition",
      label: isAr ? "التزام الدايت" : "Diet Adherence",
      value: Math.max(nutritionDone, 0.001),
      displayValue: nutritionDone,
      share: nutritionTotal
        ? `${Math.round((nutritionDone / nutritionTotal) * 100)}%`
        : "—",
      color: "#fb5001",
    },
    {
      key: "remaining",
      label: isAr ? "متبقي للأسبوع" : "Remaining Target",
      value: Math.max(workoutRemaining + nutritionRemaining, 0.001),
      displayValue: workoutRemaining + nutritionRemaining,
      share:
        workoutRemaining + nutritionRemaining > 0
          ? `${workoutRemaining + nutritionRemaining}`
          : isAr
            ? "مكتمل"
            : "Done",
      color: "#94a3b8",
    },
  ]

  const workoutsData = [
    {
      key: "done",
      label: isAr ? "حصص منجزة" : "Completed Sessions",
      value: Math.max(workoutDone, 0.001),
      displayValue: workoutDone,
      share: String(workoutDone),
      color: "#111111",
    },
    {
      key: "pending",
      label: isAr ? "حصص متبقية" : "Pending Sessions",
      value: Math.max(workoutRemaining, 0.001),
      displayValue: workoutRemaining,
      share: String(workoutRemaining),
      color: "#94a3b8",
    },
  ]

  const activeData = view === "overall" ? overallData : workoutsData
  const hasTargets =
    view === "overall"
      ? workoutTotal + nutritionTotal > 0
      : workoutTotal > 0
  const centerValue =
    view === "overall"
      ? hasTargets
        ? `${overallPct}%`
        : "—"
      : workoutTotal
        ? `${workoutDone} / ${workoutTotal}`
        : "—"
  const centerLabel =
    view === "overall"
      ? hasTargets
        ? overallPct >= 70
          ? isAr
            ? "ملتزم"
            : "On Track"
          : isAr
            ? "بحاجة للمتابعة"
            : "Needs focus"
        : isAr
          ? "لا يوجد برنامج"
          : "No program"
      : isAr
        ? "حصص مكتملة"
        : "Completed"

  const setupHref =
    !canWorkout && !canNutrition
      ? APP_ROUTES.subscriber.subscription
      : canWorkout
        ? APP_ROUTES.subscriber.workout
        : APP_ROUTES.subscriber.nutrition

  return (
    <div
      dir={isRtl ? "rtl" : "ltr"}
      className={cn(
        "flex h-full flex-col justify-between rounded-[22px] border border-black/[0.06] bg-white p-5 shadow-[0_4px_24px_rgba(0,0,0,0.03)] transition-all duration-300 hover:shadow-[0_10px_32px_rgba(0,0,0,0.06)] sm:rounded-[26px] sm:p-7",
        className,
      )}
    >
      <div>
        <div className="mb-1 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="flex size-7 items-center justify-center rounded-lg bg-[var(--gym-ink,#111111)]/5 text-[var(--gym-ink,#111111)]">
              <Activity className="size-4" strokeWidth={2.2} />
            </span>
            <h3
              className={cn(
                "text-[15px] font-extrabold text-[var(--gym-ink,#111111)] sm:text-[16px]",
                isAr ? "font-arabic" : "font-heading",
              )}
            >
              {isAr ? "التزام هذا الأسبوع" : "This Week's Adherence"}
            </h3>
          </div>
        </div>

        <div className="mt-3 flex w-fit items-center rounded-full border border-black/[0.04] bg-black/[0.05] p-0.5">
          <button
            type="button"
            onClick={() => setView("overall")}
            className={cn(
              "rounded-full px-3 py-1 text-[11px] font-extrabold transition",
              view === "overall"
                ? "bg-white text-[var(--gym-ink,#111111)] shadow-sm"
                : "text-[#777]",
              isAr ? "font-arabic" : "font-heading",
            )}
          >
            {isAr ? "الكل" : "Overall"}
          </button>
          <button
            type="button"
            onClick={() => setView("workouts")}
            className={cn(
              "rounded-full px-3 py-1 text-[11px] font-extrabold transition",
              view === "workouts"
                ? "bg-white text-[var(--gym-ink,#111111)] shadow-sm"
                : "text-[#777]",
              isAr ? "font-arabic" : "font-heading",
            )}
          >
            {isAr ? "تمارين" : "Workouts"}
          </button>
        </div>

        <div className="relative mt-4 h-[180px] w-full">
          {isLoading ? (
            <div className="flex h-full items-center justify-center text-[12px] font-semibold text-[#8c8c8c]">
              {isAr ? "جارٍ التحميل…" : "Loading…"}
            </div>
          ) : (
            <>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={activeData}
                    dataKey="value"
                    nameKey="label"
                    innerRadius={58}
                    outerRadius={78}
                    paddingAngle={2}
                    stroke="none"
                  >
                    {activeData.map((entry) => (
                      <Cell key={entry.key} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(_val, _name, item) => {
                      const payload = item?.payload as
                        | { share?: string; label?: string }
                        | undefined
                      return [payload?.share ?? "", payload?.label ?? ""]
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                <span
                  className={cn(
                    "text-[22px] font-black text-[var(--gym-ink,#111111)]",
                    isAr ? "font-arabic" : "font-heading",
                  )}
                >
                  {centerValue}
                </span>
                <span className="text-[11px] font-bold text-[#8c8c8c]">
                  {centerLabel}
                </span>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="mt-3 space-y-2">
        {activeData.map((item) => (
          <div
            key={item.key}
            className="flex items-center justify-between gap-2 text-[12px]"
          >
            <div className="flex min-w-0 items-center gap-2">
              <span
                className="size-2.5 shrink-0 rounded-full"
                style={{ background: item.color }}
              />
              <span
                className={cn(
                  "truncate font-semibold text-[#555]",
                  isAr && "font-arabic",
                )}
              >
                {item.label}
              </span>
            </div>
            <span className="shrink-0 font-extrabold text-[var(--gym-ink,#111111)]">
              {item.share}
            </span>
          </div>
        ))}
      </div>

      <div className="mt-4 flex items-center gap-2 rounded-xl border border-black/[0.04] bg-[#F8F9FA] px-3 py-2.5">
        {overallPct >= 70 || (view === "workouts" && workoutRemaining === 0 && hasTargets) ? (
          <Award className="size-4 shrink-0 text-[var(--gym-lime,#fb5001)]" />
        ) : (
          <CheckCircle2 className="size-4 shrink-0 text-[#8c8c8c]" />
        )}
        <p
          className={cn(
            "text-[11.5px] font-medium text-[#6B7280]",
            isAr && "font-arabic",
          )}
        >
          {hasTargets ? (
            isAr
              ? "يُحدَّث مباشرة من سجلات التمارين والتغذية الحية."
              : "Updates live from workout & nutrition logs."
          ) : (
            <>
              {isAr
                ? "لا يوجد برنامج نشط لتتبع الالتزام. "
                : "No active program to track yet. "}
              <Link
                to={setupHref}
                className="font-bold text-[var(--gym-lime,#fb5001)] hover:underline"
              >
                {isAr ? "افتح القسم المناسب" : "Open the right section"}
              </Link>
            </>
          )}
        </p>
      </div>
    </div>
  )
}
