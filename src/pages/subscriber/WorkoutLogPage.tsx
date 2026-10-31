import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import {
  CheckCircle2,
  Clock,
  Dumbbell,
  Flame,
} from "lucide-react"
import { StatCard } from "@/components/dashboard/StatCard"
import { useAuth } from "@/features/auth/auth-context"
import { useWorkoutLogsQuery } from "@/features/workouts/hooks"
import { useSubscribersQuery } from "@/features/subscribers/hooks"
import { useDocumentTitle } from "@/hooks/useDocumentTitle"
import { useLocale } from "@/hooks/useLocale"
import { formatDate } from "@/lib/format"

export function WorkoutLogPage() {
  const { t } = useTranslation()
  const { locale } = useLocale()
  const isAr = locale === "ar"
  const { user } = useAuth()
  useDocumentTitle(t("nav.workoutLog"))

  const { data: subscribers = [] } = useSubscribersQuery()

  const currentSubscriber = useMemo(() => {
    if (!user) return subscribers[0]
    return (
      subscribers.find(
        (s) =>
          s.id === user.uid ||
          s.email.toLowerCase() === (user.email ?? "").toLowerCase(),
      ) ?? subscribers[0]
    )
  }, [subscribers, user])

  const { data: logs = [] } = useWorkoutLogsQuery(currentSubscriber?.id)

  const stats = useMemo(() => {
    const totalSessions = logs.length
    const totalMinutes = logs.reduce((sum, l) => sum + (l.durationMinutes ?? 0), 0)
    const avgRpe =
      totalSessions > 0
        ? (logs.reduce((sum, l) => sum + (l.perceivedEffort ?? 0), 0) / totalSessions).toFixed(1)
        : "—"
    return { totalSessions, totalMinutes, avgRpe }
  }, [logs])

  return (
    <div className="flex flex-col gap-5">
      {/* Stat Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <StatCard
          label={isAr ? "إجمالي الجلسات المنجزة" : "Completed Sessions"}
          value={stats.totalSessions}
          icon={<Dumbbell className="size-4" strokeWidth={1.8} />}
        />
        <StatCard
          label={isAr ? "وقت التدريب الإجمالي" : "Total Training Time"}
          value={`${stats.totalMinutes} ${isAr ? "دقيقة" : "mins"}`}
          icon={<Clock className="size-4" strokeWidth={1.8} />}
        />
        <StatCard
          label={isAr ? "متوسط شدة الجهد (RPE)" : "Average Effort (RPE)"}
          value={stats.avgRpe}
          icon={<Flame className="size-4" strokeWidth={1.8} />}
        />
      </div>

      {/* Logs Table / List */}
      <div className="rounded-[24px] bg-white p-5 sm:p-6 shadow-xs space-y-4">
        <h2 className="font-heading text-[18px] font-extrabold text-[var(--gym-ink,#063434)]">
          {isAr ? "سجل التمارين المكتملة" : "Completed Workout History"}
        </h2>

        {logs.length === 0 ? (
          <div className="flex min-h-40 flex-col items-center justify-center rounded-2xl bg-[#F8F9FA] p-8 text-center text-[#8c8c8c]">
            <Clock className="size-8 stroke-1 mb-2" />
            <p className="text-[13px] font-medium">
              {isAr
                ? "لم تقم بتسجيل أي جلسات تدريبية بعد. انتقل إلى خطة التمارين لتسجيل أول جلسة!"
                : "No workout sessions logged yet. Head to your Workout Plan to log today's session!"}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {logs.map((log) => (
              <div
                key={log.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-[#ECECEC] bg-[#FBFBFB] p-4 transition hover:bg-white"
              >
                <div className="flex items-center gap-3">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-800">
                    <CheckCircle2 className="size-5" />
                  </div>
                  <div>
                    <h3 className="font-heading text-[15px] font-bold text-[var(--gym-ink,#063434)]">
                      {formatDate(log.date, locale)}
                    </h3>
                    {log.notes ? (
                      <p className="mt-0.5 text-[12px] text-[#6B7280]">
                        {log.notes}
                      </p>
                    ) : null}
                  </div>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-auto text-[12px] font-bold">
                  {log.durationMinutes ? (
                    <span className="rounded-full bg-[#EAEAEA] px-3 py-1 text-[var(--gym-ink,#063434)]">
                      {log.durationMinutes} {isAr ? "دقيقة" : "mins"}
                    </span>
                  ) : null}
                  {log.perceivedEffort ? (
                    <span className="rounded-full bg-amber-100 px-3 py-1 text-amber-900">
                      RPE {log.perceivedEffort}/10
                    </span>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
