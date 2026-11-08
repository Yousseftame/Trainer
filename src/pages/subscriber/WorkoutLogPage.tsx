import { useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import {
  CheckCircle2,
  ChevronDown,
  Clock,
  Dumbbell,
  Eye,
  Flame,
  Trophy,
} from "lucide-react"
import { StatCard } from "@/components/dashboard/StatCard"
import { WorkoutSummaryModal } from "@/components/subscriber/WorkoutSummaryModal"
import { useAuth } from "@/features/auth/auth-context"
import { useWorkoutLogsQuery } from "@/features/workouts/hooks"
import { useDocumentTitle } from "@/hooks/useDocumentTitle"
import { useLocale } from "@/hooks/useLocale"
import { formatDate } from "@/lib/format"
import { cn } from "@/lib/utils"
import type { WorkoutSessionLog } from "@/types/program"

export function WorkoutLogPage({ subscriberId: explicitSubId }: { subscriberId?: string } = {}) {
  const { t } = useTranslation()
  const { locale } = useLocale()
  const isAr = locale === "ar"
  const { user } = useAuth()
  useDocumentTitle(t("nav.workoutLog"))

  const targetSubscriberId = explicitSubId || user?.uid
  const { data: logs = [] } = useWorkoutLogsQuery(targetSubscriberId)

  const [expandedLogId, setExpandedLogId] = useState<string | null>(null)
  const [selectedModalLog, setSelectedModalLog] = useState<WorkoutSessionLog | null>(null)

  const stats = useMemo(() => {
    const totalSessions = logs.length
    const totalMinutes = logs.reduce((sum, l) => sum + (l.durationMinutes ?? 0), 0)
    const totalVolume = logs.reduce((sum, l) => sum + (l.totalVolumeKg ?? 0), 0)
    const avgRpe =
      totalSessions > 0
        ? (logs.reduce((sum, l) => sum + (l.perceivedEffort ?? 0), 0) / totalSessions).toFixed(1)
        : "—"
    return { totalSessions, totalMinutes, totalVolume, avgRpe }
  }, [logs])

  return (
    <div className="flex flex-col gap-5 pb-10">
      {/* 1. Stat Cards Grid */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard
          label={isAr ? "إجمالي الحصص المنجزة" : "Completed Sessions"}
          value={stats.totalSessions}
          icon={<Dumbbell className="size-4" strokeWidth={1.8} />}
        />
        <StatCard
          label={isAr ? "وقت التدريب الإجمالي" : "Total Training Time"}
          value={`${stats.totalMinutes} ${isAr ? "دقيقة" : "mins"}`}
          icon={<Clock className="size-4" strokeWidth={1.8} />}
        />
        <StatCard
          label={isAr ? "إجمالي الحجم المرفوع" : "Total Volume Lifted"}
          value={
            stats.totalVolume > 0
              ? `${stats.totalVolume.toLocaleString()} ${isAr ? "كجم" : "kg"}`
              : `0 ${isAr ? "كجم" : "kg"}`
          }
          icon={<Trophy className="size-4" strokeWidth={1.8} />}
        />
        <StatCard
          label={isAr ? "متوسط شدة الجهد (RPE)" : "Average Effort (RPE)"}
          value={stats.avgRpe}
          icon={<Flame className="size-4" strokeWidth={1.8} />}
        />
      </div>

      {/* 2. Logs History List */}
      <div className="rounded-[28px] bg-white p-5 sm:p-7 shadow-xs border border-black/[0.04] space-y-4">
        <div className="flex items-center justify-between border-b border-black/[0.06] pb-3">
          <div>
            <h2 className="font-heading text-[19px] font-black text-[var(--gym-ink,#111111)]">
              {isAr ? "سجل التمارين المكتملة والأداء التاريخي" : "Workout History & Performance Logs"}
            </h2>
            <p className="mt-0.5 text-[12.5px] text-[#8c8c8c]">
              {isAr
                ? "يتم الاحتفاظ بجميع قياساتك وأوزانك وتكراراتك السابقة بشكل دائم حتى عند تغيير البرنامج التدريبي."
                : "Your historical lifts, sets, and performance records are permanently preserved."}
            </p>
          </div>
          <span className="rounded-full bg-[var(--gym-ink,#111111)]/5 px-3 py-1 text-[12px] font-bold text-[var(--gym-ink,#111111)]">
            {logs.length} {isAr ? "سجلات" : "records"}
          </span>
        </div>

        {logs.length === 0 ? (
          <div className="flex min-h-48 flex-col items-center justify-center rounded-2xl bg-[#F8F9FA] p-8 text-center text-[#8c8c8c]">
            <Clock className="size-10 stroke-1 mb-2 text-gray-400" />
            <h4 className="font-heading text-[16px] font-bold text-[var(--gym-ink,#111111)]">
              {isAr ? "لا توجد جلسات تدريبية مسجلة بعد" : "No workout sessions logged yet"}
            </h4>
            <p className="mt-1 text-[13px] font-medium text-gray-500 max-w-sm">
              {isAr
                ? "انتقل إلى صفحة التمارين وابدأ جلستك التدريبية لتسجيل أول إنجاز!"
                : "Head to your Workout Plan and complete your first session to track history!"}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {logs.map((log) => {
              const isExpanded = expandedLogId === log.id
              const exercises = log.exercisesCompleted ?? []

              return (
                <div
                  key={log.id}
                  className="rounded-2xl border border-black/[0.06] bg-[#FAFAFA] p-4 transition hover:bg-white hover:border-black/15 shadow-2xs space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-[var(--gym-ink,#111111)] text-[var(--gym-orange,#fb5001)]">
                        <CheckCircle2 className="size-6" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-heading text-[15px] sm:text-[16px] font-black text-[var(--gym-ink,#111111)]">
                            {log.workoutTitle || (isAr ? "جلسة تدريبية" : "Workout Session")}
                          </h3>
                          <span className="text-[12px] font-bold text-[#8c8c8c]">•</span>
                          <span className="text-[12px] font-bold text-[#6B7280]">
                            {formatDate(log.date, locale)}
                          </span>
                        </div>

                        {log.notes ? (
                          <p className="mt-0.5 text-[12px] text-[#6B7280] italic">
                            "{log.notes}"
                          </p>
                        ) : null}
                      </div>
                    </div>

                    {/* Metric Pills & Actions */}
                    <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto text-[11px] font-bold">
                      {log.durationMinutes ? (
                        <span className="rounded-full bg-white border border-black/[0.08] px-3 py-1 text-[var(--gym-ink,#111111)]">
                          {log.durationMinutes} {isAr ? "دقيقة" : "min"}
                        </span>
                      ) : null}

                      {log.totalVolumeKg ? (
                        <span className="rounded-full bg-[var(--gym-orange,#fb5001)]/10 text-[var(--gym-orange,#fb5001)] px-3 py-1">
                          {log.totalVolumeKg.toLocaleString()} {isAr ? "كجم" : "kg"}
                        </span>
                      ) : null}

                      {log.perceivedEffort ? (
                        <span className="rounded-full bg-amber-100 px-3 py-1 text-amber-900">
                          RPE {log.perceivedEffort}/10
                        </span>
                      ) : null}

                      {/* View Details Button */}
                      <button
                        type="button"
                        onClick={() => setSelectedModalLog(log)}
                        className="inline-flex items-center gap-1.5 rounded-full bg-[var(--gym-ink,#111111)] px-3.5 py-1 text-white hover:bg-[#084242] transition shadow-2xs"
                      >
                        <Eye className="size-3.5" />
                        <span>{isAr ? "الملخص الكامل" : "Summary"}</span>
                      </button>

                      {/* Expand / Collapse In-Place */}
                      {exercises.length > 0 ? (
                        <button
                          type="button"
                          onClick={() => setExpandedLogId(isExpanded ? null : log.id)}
                          className="flex size-7 items-center justify-center rounded-full bg-black/5 text-gray-600 hover:bg-black/10 transition"
                          title={isAr ? "عرض التمارين" : "Toggle exercises"}
                        >
                          <ChevronDown
                            className={cn(
                              "size-4 transition-transform duration-200",
                              isExpanded && "rotate-180",
                            )}
                          />
                        </button>
                      ) : null}
                    </div>
                  </div>

                  {/* Expanded In-Place Exercise Breakdown */}
                  {isExpanded && exercises.length > 0 ? (
                    <div className="mt-3 pt-3 border-t border-black/[0.06] space-y-2 animate-in fade-in duration-200">
                      <span className="text-[11.5px] font-bold uppercase tracking-wider text-gray-500">
                        {isAr ? "التمارين والأداء المسجل في هذه الجلسة:" : "Logged Exercises & Metrics:"}
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {exercises.map((ex, idx) => (
                          <div
                            key={ex.exerciseId || idx}
                            className="flex items-center justify-between rounded-xl bg-white p-2.5 border border-black/[0.05] shadow-2xs text-[12px]"
                          >
                            <span className="font-bold text-[var(--gym-ink,#111111)] truncate">
                              {ex.name}
                            </span>
                            <span className="font-mono text-[#6B7280] shrink-0 font-bold">
                              {ex.completedSets} {isAr ? "مجموعات" : "sets"}{" "}
                              {ex.weightKg ? `• ${ex.weightKg} كجم` : ""}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Historical Workout Summary Modal */}
      {selectedModalLog && (
        <WorkoutSummaryModal
          isOpen={Boolean(selectedModalLog)}
          onClose={() => setSelectedModalLog(null)}
          workoutTitle={selectedModalLog.workoutTitle}
          durationMinutes={selectedModalLog.durationMinutes ?? 45}
          activeMinutes={selectedModalLog.activeMinutes ?? 35}
          restMinutes={selectedModalLog.restMinutes ?? 10}
          totalVolumeKg={selectedModalLog.totalVolumeKg ?? 0}
          exercisesCompleted={selectedModalLog.exercisesCompleted ?? []}
          perceivedEffort={selectedModalLog.perceivedEffort}
          energyLevel={selectedModalLog.energyLevel}
          notes={selectedModalLog.notes}
        />
      )}
    </div>
  )
}
