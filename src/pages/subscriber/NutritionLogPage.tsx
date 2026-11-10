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
import { useNutritionLogsQuery } from "@/features/nutrition/hooks"
import { usePanelSubscriber } from "@/features/subscribers/use-panel-subscriber"
import { useDocumentTitle } from "@/hooks/useDocumentTitle"
import { useLocale } from "@/hooks/useLocale"
import { formatDate } from "@/lib/format"
import { NUTRITION_DISCLAIMER } from "@/lib/program-text"

export function NutritionLogPage({
  subscriberId: explicitSubId,
  embedded = false,
}: { subscriberId?: string; embedded?: boolean } = {}) {
  const { t } = useTranslation()
  const { locale } = useLocale()
  const isAr = locale === "ar"
  const { subscriberId: panelSubscriberId } = usePanelSubscriber()
  useDocumentTitle(embedded ? null : t("nav.nutritionLog"))

  const targetSubscriberId = explicitSubId || panelSubscriberId
  const {
    data: logs = [],
    isLoading,
    isError,
    refetch,
  } = useNutritionLogsQuery({
    subscriberId: targetSubscriberId,
    enabled: Boolean(targetSubscriberId),
  })

  const stats = useMemo(() => {
    const totalLoggedDays = logs.length
    const fullAdherence = logs.filter((l) => l.status === "adhered").length
    const mostly = logs.filter((l) => l.status === "mostly").length
    const rate =
      totalLoggedDays > 0
        ? Math.round(((fullAdherence + mostly) / totalLoggedDays) * 100)
        : 0
    const avgCalories =
      totalLoggedDays > 0
        ? Math.round(
            logs.reduce((sum, l) => sum + (l.caloriesActual ?? 0), 0) /
              totalLoggedDays,
          )
        : 0
    return { totalLoggedDays, fullAdherence, rate, avgCalories }
  }, [logs])

  if (!targetSubscriberId || isLoading) {
    return (
      <div className="flex min-h-60 flex-col items-center justify-center rounded-[28px] bg-white p-8 text-center shadow-xs">
        <Apple className="size-10 mb-3 animate-pulse text-[var(--gym-orange,#fb5001)] stroke-1" />
        <p className="text-[13px] font-medium text-[#8c8c8c]">
          {isAr ? "جاري تحميل سجل التغذية..." : "Loading nutrition history..."}
        </p>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="flex min-h-60 flex-col items-center justify-center gap-3 rounded-[28px] bg-white p-8 text-center shadow-xs">
        <p className="font-heading text-[16px] font-extrabold text-[var(--gym-ink,#111111)]">
          {isAr ? "تعذر تحميل سجل التغذية" : "Could not load nutrition history"}
        </p>
        <button
          type="button"
          onClick={() => void refetch()}
          className="rounded-full bg-[var(--gym-ink,#111111)] px-4 py-2 text-[12px] font-bold text-white"
        >
          {isAr ? "إعادة المحاولة" : "Retry"}
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
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
        <StatCard
          label={isAr ? "متوسط السعرات" : "Avg Calories"}
          value={stats.avgCalories > 0 ? stats.avgCalories : "—"}
          icon={<Droplet className="size-4" strokeWidth={1.8} />}
        />
      </div>

      <div className="rounded-2xl border border-amber-200/90 bg-amber-50/80 p-4">
        <div className="flex items-start gap-3">
          <ShieldAlert className="size-5 shrink-0 text-amber-700 mt-0.5" />
          <p className="text-[12px] leading-relaxed text-amber-900">
            {NUTRITION_DISCLAIMER[locale]}
          </p>
        </div>
      </div>

      <div className="rounded-[24px] bg-white p-5 sm:p-6 shadow-xs space-y-4">
        <div>
          <h2 className="font-heading text-[18px] font-extrabold text-[var(--gym-ink,#111111)]">
            {isAr ? "سجل الالتزام بالخطة الغذائية" : "Nutrition Adherence Log"}
          </h2>
          <p className="mt-0.5 text-[12.5px] text-[#8c8c8c]">
            {isAr
              ? "سجلاتك محفوظة مع معرّف الخطة وتبقى بعد تحديث أو إعادة تعيين البرنامج."
              : "Your records keep the program id and stay preserved after plan updates."}
          </p>
        </div>

        {logs.length === 0 ? (
          <div className="flex min-h-40 flex-col items-center justify-center rounded-2xl bg-[#F8F9FA] p-8 text-center text-[#8c8c8c]">
            <Apple className="size-8 stroke-1 mb-2" />
            <p className="text-[13px] font-medium">
              {isAr
                ? "لا توجد سجلات التزام غذائي بعد. سجّل التزامك اليومي من صفحة خطة التغذية."
                : "No nutrition adherence entries yet. Log daily adherence from your Nutrition Plan page."}
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
                    : "Fully adhered"
                  : log.status === "mostly"
                    ? isAr
                      ? "التزام جزئي"
                      : "Mostly adhered"
                    : log.status === "deviated"
                      ? isAr
                        ? "انحراف"
                        : "Deviated"
                      : isAr
                        ? "تخطّي"
                        : "Skipped"

              return (
                <div
                  key={log.id}
                  className="rounded-2xl border border-black/[0.06] bg-[#FAFAFA] p-4 space-y-2"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="font-heading text-[14px] font-extrabold text-[var(--gym-ink,#111111)]">
                        {formatDate(log.date || log.loggedAt, locale)}
                      </p>
                      <p className="text-[11.5px] text-[#8c8c8c]">
                        {isAr ? "تم التسجيل:" : "Logged:"}{" "}
                        {formatDate(log.loggedAt, locale)}
                      </p>
                    </div>
                    <StatusBadge label={statusLabel} tone={statusTone} />
                  </div>

                  <div className="flex flex-wrap gap-2 text-[11.5px] font-bold text-[var(--gym-ink,#111111)]">
                    {log.caloriesActual != null ? (
                      <span className="rounded-lg bg-white border border-black/[0.06] px-2.5 py-1">
                        {log.caloriesActual} {isAr ? "سعرة" : "kcal"}
                      </span>
                    ) : null}
                    {log.waterLitersActual != null ? (
                      <span className="rounded-lg bg-white border border-black/[0.06] px-2.5 py-1">
                        {log.waterLitersActual}L {isAr ? "ماء" : "water"}
                      </span>
                    ) : null}
                  </div>

                  {log.notes ? (
                    <p className="text-[12px] text-[#6B7280]">{log.notes}</p>
                  ) : null}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
