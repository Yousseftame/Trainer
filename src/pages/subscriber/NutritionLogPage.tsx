import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import {
  Apple,
  CalendarDays,
  CheckCircle2,
  Droplet,
  Flame,
  ShieldAlert,
} from "lucide-react"
import { StatCard } from "@/components/dashboard/StatCard"
import { StatusBadge } from "@/components/dashboard/StatusBadge"
import { useAuth } from "@/features/auth/auth-context"
import { NUTRITION_DISCLAIMER } from "@/features/nutrition/demo"
import { useNutritionLogsQuery } from "@/features/nutrition/hooks"
import { useSubscribersQuery } from "@/features/subscribers/hooks"
import { useDocumentTitle } from "@/hooks/useDocumentTitle"
import { useLocale } from "@/hooks/useLocale"
import { formatDate } from "@/lib/format"

export function NutritionLogPage() {
  const { t } = useTranslation()
  const { locale } = useLocale()
  const isAr = locale === "ar"
  const { user } = useAuth()
  useDocumentTitle(t("nav.nutritionLog"))

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

  const { data: logs = [] } = useNutritionLogsQuery(currentSubscriber?.id)

  const stats = useMemo(() => {
    const totalLoggedDays = logs.length
    const fullAdherence = logs.filter((l) => l.status === "adhered").length
    const rate =
      totalLoggedDays > 0
        ? Math.round((fullAdherence / totalLoggedDays) * 100)
        : 100
    return { totalLoggedDays, fullAdherence, rate }
  }, [logs])

  return (
    <div className="flex flex-col gap-5">
      {/* Stat Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <StatCard
          label={isAr ? "الأيام المسجلة" : "Logged Days"}
          value={stats.totalLoggedDays}
          icon={<CalendarDays className="size-4" strokeWidth={1.8} />}
        />
        <StatCard
          label={isAr ? "أيام الالتزام الكامل" : "Full Adherence Days"}
          value={stats.fullAdherence}
          icon={<CheckCircle2 className="size-4" strokeWidth={1.8} />}
        />
        <StatCard
          label={isAr ? "نسبة الالتزام" : "Adherence Rate"}
          value={`${stats.rate}%`}
          icon={<Flame className="size-4" strokeWidth={1.8} />}
        />
      </div>

      {/* Medical Disclaimer Banner */}
      <div className="rounded-2xl border border-amber-200/90 bg-amber-50/80 p-4">
        <div className="flex items-start gap-3">
          <ShieldAlert className="size-5 shrink-0 text-amber-700 mt-0.5" />
          <p className="text-[12px] leading-relaxed text-amber-900">
            {NUTRITION_DISCLAIMER[locale]}
          </p>
        </div>
      </div>

      {/* Logs Table / List */}
      <div className="rounded-[24px] bg-white p-5 sm:p-6 shadow-xs space-y-4">
        <h2 className="font-heading text-[18px] font-extrabold text-[var(--gym-ink,#063434)]">
          {isAr ? "سجل الالتزام بالخطة الغذائية" : "Nutrition Adherence Log"}
        </h2>

        {logs.length === 0 ? (
          <div className="flex min-h-40 flex-col items-center justify-center rounded-2xl bg-[#F8F9FA] p-8 text-center text-[#8c8c8c]">
            <Apple className="size-8 stroke-1 mb-2" />
            <p className="text-[13px] font-medium">
              {isAr
                ? "لا توجد سجلات التزام غذائي مسجلة بعد. يمكنك تسجيل التزامك يومياً من صفحة خطة التغذية!"
                : "No nutrition adherence entries logged yet. You can log your daily adherence from your Nutrition Plan page!"}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {logs.map((log) => {
              const statusTone =
                log.status === "adhered"
                  ? "success"
                  : log.status === "mostly"
                    ? "info"
                    : log.status === "deviated"
                      ? "warning"
                      : "danger"

              const statusLabel =
                log.status === "adhered"
                  ? isAr
                    ? "التزام كامل"
                    : "Full adherence"
                  : log.status === "mostly"
                    ? isAr
                      ? "التزام جزئي"
                      : "Mostly followed"
                    : log.status === "deviated"
                      ? isAr
                        ? "تجاوز في الوجبات"
                        : "Deviated"
                      : isAr
                        ? "لم يلتزم"
                        : "Skipped"

              return (
                <div
                  key={log.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-[#ECECEC] bg-[#FBFBFB] p-4 transition hover:bg-white"
                >
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

                  <div className="flex items-center gap-2 self-start sm:self-auto text-[12px] font-bold">
                    {log.caloriesActual ? (
                      <span className="rounded-full bg-[#EAEAEA] px-3 py-1 text-[var(--gym-ink,#063434)]">
                        {log.caloriesActual} kcal
                      </span>
                    ) : null}
                    {log.waterLitersActual ? (
                      <span className="flex items-center gap-1 rounded-full bg-blue-100 px-3 py-1 text-blue-900">
                        <Droplet className="size-3" />
                        {log.waterLitersActual} L
                      </span>
                    ) : null}
                    <StatusBadge label={statusLabel} tone={statusTone} />
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
