import { useState } from "react"
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts"
import { Activity, Award, CheckCircle2 } from "lucide-react"
import { useLocale } from "@/hooks/useLocale"
import { cn } from "@/lib/utils"

type AdherenceView = "overall" | "workouts"

type SubscriberWeeklyAdherenceCardProps = {
  className?: string
}

export function SubscriberWeeklyAdherenceCard({ className }: SubscriberWeeklyAdherenceCardProps) {
  const { locale, isRtl } = useLocale()
  const isAr = locale === "ar"
  const [view, setView] = useState<AdherenceView>("overall")

  // Overall Adherence Composition (Workouts, Diet, Remaining)
  const overallData = [
    {
      key: "workouts",
      label: isAr ? "تمارين مكتملة" : "Completed Workouts",
      value: 4,
      share: "4 / 5",
      color: "#063434", // Deep Gym Ink
    },
    {
      key: "nutrition",
      label: isAr ? "التزام الدايت" : "Diet Adherence",
      value: 6,
      share: "96%",
      color: "#fb5001", // Brand Orange
    },
    {
      key: "remaining",
      label: isAr ? "متبقي للأسبوع" : "Remaining Target",
      value: 1,
      share: isAr ? "حصة 1" : "1 session",
      color: "#94a3b8", // Slate Muted
    },
  ]

  // Workouts-Only Composition (4 Done vs 1 Remaining)
  const workoutsData = [
    {
      key: "done",
      label: isAr ? "حصص منجزة" : "Completed Sessions",
      value: 4,
      share: "4",
      color: "#063434",
    },
    {
      key: "pending",
      label: isAr ? "حصص متبقية" : "Pending Sessions",
      value: 1,
      share: "1",
      color: "#94a3b8",
    },
  ]

  const activeData = view === "overall" ? overallData : workoutsData
  const centerValue = view === "overall" ? "94%" : "4 / 5"
  const centerLabel = view === "overall" ? (isAr ? "ملتزم" : "On Track") : (isAr ? "حصص مكتملة" : "Completed")

  return (
    <div
      dir={isRtl ? "rtl" : "ltr"}
      className={cn(
        "flex h-full flex-col justify-between rounded-[22px] sm:rounded-[26px] bg-white p-5 sm:p-7 border border-black/[0.06] shadow-[0_4px_24px_rgba(0,0,0,0.03)] hover:shadow-[0_10px_32px_rgba(0,0,0,0.06)] transition-all duration-300",
        className,
      )}
    >
      {/* Top Header: Title + View Switcher */}
      <div>
        <div className="flex items-center justify-between gap-2 mb-1">
          <div className="flex items-center gap-2">
            <span className="flex size-7 items-center justify-center rounded-lg bg-[var(--gym-ink,#063434)]/5 text-[var(--gym-ink,#063434)]">
              <Activity className="size-4" strokeWidth={2.2} />
            </span>
            <h3
              className={cn(
                "text-[14.5px] sm:text-[15.5px] font-extrabold text-[var(--gym-ink,#063434)] tracking-tight",
                isAr ? "font-arabic" : "font-heading",
              )}
            >
              {isAr ? "معدل الالتزام الأسبوعي" : "Weekly Adherence Rate"}
            </h3>
          </div>

          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700 border border-emerald-200/60">
            <CheckCircle2 className="size-3 text-emerald-600" />
            <span>{isAr ? "ممتاز" : "Optimal"}</span>
          </span>
        </div>

        <p className="text-[12px] font-medium text-[#8c8c8c] ps-9">
          {isAr ? "نسبة إنجاز خطتك الرياضية والغذائية لهذا الأسبوع" : "Completion rate of your weekly workouts & nutrition plan"}
        </p>

        {/* View Toggle Tabs */}
        <div className="mt-3.5 flex items-center justify-center rounded-full bg-black/[0.04] p-1 border border-black/[0.03] w-fit mx-auto">
          <button
            type="button"
            onClick={() => setView("overall")}
            className={cn(
              "rounded-full px-3 py-1 text-[11px] font-bold transition-all duration-200",
              view === "overall"
                ? "bg-white text-[var(--gym-ink,#063434)] shadow-xs"
                : "text-[#777] hover:text-[#111]",
              isAr ? "font-arabic" : "font-heading",
            )}
          >
            {isAr ? "الالتزام الشامل" : "Overall"}
          </button>
          <button
            type="button"
            onClick={() => setView("workouts")}
            className={cn(
              "rounded-full px-3 py-1 text-[11px] font-bold transition-all duration-200",
              view === "workouts"
                ? "bg-white text-[var(--gym-ink,#063434)] shadow-xs"
                : "text-[#777] hover:text-[#111]",
              isAr ? "font-arabic" : "font-heading",
            )}
          >
            {isAr ? "الحصص التدريبية" : "Workouts"}
          </button>
        </div>
      </div>

      {/* Center Donut Chart Ring (Scaled proportionally to fill vertical space) */}
      <div className="relative mx-auto my-auto py-3 h-[210px] w-[210px] sm:h-[230px] sm:w-[230px] select-none flex items-center justify-center">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={activeData}
              dataKey="value"
              nameKey="label"
              innerRadius={68}
              outerRadius={94}
              paddingAngle={3.5}
              stroke="none"
              startAngle={90}
              endAngle={-270}
            >
              {activeData.map((item) => (
                <Cell key={item.key} fill={item.color} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: "#063434",
                border: "none",
                borderRadius: "14px",
                color: "#ffffff",
                fontSize: "12px",
                fontWeight: 700,
                boxShadow: "0 8px 24px rgba(6,52,52,0.2)",
              }}
              formatter={(value, name) => [value ?? 0, String(name)]}
            />
          </PieChart>
        </ResponsiveContainer>

        {/* Center Overlay Stats */}
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
          <p
            className={cn(
              "text-[32px] sm:text-[36px] font-black leading-none text-[var(--gym-ink,#063434)] tracking-tight",
              isAr ? "font-arabic" : "font-heading",
            )}
          >
            {centerValue}
          </p>
          <p
            className={cn(
              "mt-1.5 text-[12px] font-bold text-[#8c8c8c]",
              isAr ? "font-arabic" : "font-sans",
            )}
          >
            {centerLabel}
          </p>
        </div>
      </div>

      {/* Legend Rows: Polished Card Pills */}
      <ul className="mx-auto w-full max-w-[280px] flex flex-col gap-2 pt-2 pb-2">
        {activeData.map((item) => (
          <li
            key={item.key}
            className="flex items-center justify-between rounded-xl bg-[#fafafa] px-3.5 py-2 border border-black/[0.03] text-[13px]"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <span
                className="size-2.5 shrink-0 rounded-full"
                style={{ background: item.color }}
              />
              <span
                className={cn(
                  "truncate font-bold text-[var(--gym-ink,#063434)] text-[12.5px]",
                  isAr ? "font-arabic" : "font-sans",
                )}
              >
                {item.label}
              </span>
            </div>
            <span className="font-extrabold text-[12.5px] text-[var(--gym-ink,#063434)] shrink-0 ps-2">
              {item.share}
            </span>
          </li>
        ))}
      </ul>

      {/* Motivation Note at Bottom (Matches height and baseline of graph card bottom row) */}
      <div className="mt-auto pt-4 border-t border-black/[0.05] flex items-center justify-center gap-1.5 text-center">
        <Award className="size-4 text-[var(--gym-lime,#fb5001)] shrink-0" />
        <span
          className={cn(
            "text-[12px] font-semibold text-[#666]",
            isAr ? "font-arabic" : "font-sans",
          )}
        >
          {isAr
            ? "متبقي حصة واحدة لتحقيق التزام 100% هذا الأسبوع! 🎯"
            : "1 session remaining to hit 100% weekly goal! 🎯"}
        </span>
      </div>
    </div>
  )
}

