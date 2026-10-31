import { useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import {
  Check,
  CheckCircle2,
  Dumbbell,
  FileText,
  Play,
} from "lucide-react"
import { ContentPreviewDialog } from "@/components/dashboard/ContentPreviewDialog"
import { StatusBadge } from "@/components/dashboard/StatusBadge"
import { useAuth } from "@/features/auth/auth-context"
import { useContentAssetsQuery } from "@/features/content/hooks"
import { useSubscribersQuery } from "@/features/subscribers/hooks"
import {
  formatRest,
  resolveBilingualText,
  trainingDayCount,
} from "@/features/workouts/demo"
import {
  useLogWorkoutSessionMutation,
  useWorkoutLogsQuery,
  useWorkoutProgramsQuery,
} from "@/features/workouts/hooks"
import { useDocumentTitle } from "@/hooks/useDocumentTitle"
import { useLocale } from "@/hooks/useLocale"
import { appToast } from "@/lib/toast"
import { cn } from "@/lib/utils"
import type { ContentAsset } from "@/types/content"

const WEEKDAY_NAMES_EN = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
const WEEKDAY_NAMES_AR = ["الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت", "الأحد"]

export function WorkoutPlanPage() {
  const { t } = useTranslation()
  const { locale } = useLocale()
  const isAr = locale === "ar"
  const { user } = useAuth()
  useDocumentTitle(t("nav.workout"))

  const { data: subscribers = [] } = useSubscribersQuery()
  const { data: allPrograms = [] } = useWorkoutProgramsQuery()
  const { data: contentAssets = [] } = useContentAssetsQuery()

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

  const activeProgram = useMemo(() => {
    if (!currentSubscriber) return null
    return (
      allPrograms.find(
        (p) => p.subscriberId === currentSubscriber.id && p.status === "active",
      ) ?? null
    )
  }, [allPrograms, currentSubscriber])

  const { data: logs = [] } = useWorkoutLogsQuery(currentSubscriber?.id)
  const logMutation = useLogWorkoutSessionMutation()

  const [weekday, setWeekday] = useState(0)
  const [previewAsset, setPreviewAsset] = useState<ContentAsset | null>(null)
  const [logging, setLogging] = useState(false)

  const selectedDay =
    activeProgram?.days.find((d) => d.weekday === weekday) ??
    activeProgram?.days[0]

  const todayIso = new Date().toISOString().slice(0, 10)
  const isTodayLogged = logs.some((l) => l.date === todayIso)

  async function handleLogTodaySession() {
    if (!activeProgram || !selectedDay || !currentSubscriber) return
    setLogging(true)
    try {
      await logMutation.mutateAsync({
        subscriberId: currentSubscriber.id,
        programId: activeProgram.id,
        dayId: selectedDay.id,
        weekday: selectedDay.weekday,
        date: todayIso,
        durationMinutes: 50,
        perceivedEffort: 8,
        notes: isAr ? "تم إكمال جلسة التمرين بالكامل" : "Completed workout session",
      })
      appToast.success(
        isAr ? "تم تسجيل إنجاز تمرين اليوم بنجاح!" : "Today's workout session logged!",
      )
    } catch {
      appToast.error(isAr ? "فشل تسجيل الجلسة" : "Failed to log session")
    } finally {
      setLogging(false)
    }
  }

  return (
    <div className="flex flex-col gap-5">
      {!activeProgram ? (
        <div className="flex min-h-60 flex-col items-center justify-center rounded-[24px] bg-white p-8 text-center shadow-xs">
          <Dumbbell className="size-10 mb-3 text-[#8c8c8c] stroke-1" />
          <h2 className="font-heading text-[18px] font-extrabold text-[var(--gym-ink,#063434)]">
            {isAr ? "لا يوجد برنامج تدريبي مخصص حالياً" : "No active workout program"}
          </h2>
          <p className="mt-1 max-w-md text-[13px] text-[#8c8c8c]">
            {isAr
              ? "يقوم المدرب بتجهيز خطتك التدريبية المخصصة وستظهر هنا بمجرد اعتمادها."
              : "Your coach will assign your personalized workout plan soon."}
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {/* Program Overview Banner */}
          <div className="rounded-[24px] bg-white p-5 sm:p-6 shadow-xs flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="font-heading text-[22px] font-extrabold text-[var(--gym-ink,#063434)]">
                  {activeProgram.title[locale]}
                </h1>
                <StatusBadge
                  label={t(`admin.workouts.format.${activeProgram.format}`)}
                  tone={activeProgram.format === "pdf" ? "info" : "success"}
                />
                <StatusBadge label={`v${activeProgram.version}`} tone="muted" />
              </div>
              <p className="mt-1 text-[13px] font-medium text-[#8c8c8c]">
                {activeProgram.description?.[locale] ||
                  t("admin.workouts.daysCount", {
                    count: trainingDayCount(activeProgram),
                  })}
              </p>
            </div>

            {/* Quick Session Log Button */}
            {activeProgram.format === "interactive" && !selectedDay?.isRest ? (
              <button
                type="button"
                onClick={handleLogTodaySession}
                disabled={logging || isTodayLogged}
                className={cn(
                  "inline-flex h-11 items-center justify-center gap-2 rounded-full px-6 text-[13px] font-bold shadow-sm transition",
                  isTodayLogged
                    ? "bg-emerald-600 text-white cursor-default"
                    : "bg-[var(--gym-ink,#063434)] text-white hover:opacity-95",
                )}
              >
                {isTodayLogged ? (
                  <>
                    <CheckCircle2 className="size-4" />
                    <span>{isAr ? "تم تسجيل تمرين اليوم" : "Today Logged"}</span>
                  </>
                ) : (
                  <>
                    <Check className="size-4" strokeWidth={2.5} />
                    <span>
                      {logging
                        ? isAr
                          ? "جاري التسجيل..."
                          : "Logging..."
                        : isAr
                          ? "تسجيل إنجاز تمرين اليوم"
                          : "Log Session Complete"}
                    </span>
                  </>
                )}
              </button>
            ) : null}
          </div>

          {/* Interactive Days / PDF */}
          {activeProgram.format === "pdf" ? (
            <div className="flex min-h-56 flex-col items-center justify-center rounded-[24px] bg-white p-8 text-center shadow-xs">
              <FileText className="size-12 text-[var(--gym-ink,#063434)] mb-3" strokeWidth={1.5} />
              <h3 className="font-heading text-[18px] font-bold text-[var(--gym-ink,#063434)]">
                {activeProgram.pdfName?.[locale] || "Workout Guide PDF"}
              </h3>
              <p className="mt-1 text-[13px] text-[#8c8c8c]">
                {t("admin.workouts.pdfHint")}
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {/* Day selector pills */}
              <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
                {activeProgram.days.map((d) => {
                  const active = d.weekday === weekday
                  const trained = !d.isRest && d.exercises.length > 0
                  return (
                    <button
                      key={d.id}
                      type="button"
                      onClick={() => setWeekday(d.weekday)}
                      className={cn(
                        "flex min-h-[70px] flex-col items-center justify-center rounded-2xl py-2 px-1 text-center transition shadow-2xs overflow-hidden",
                        active
                          ? "bg-[var(--gym-ink,#063434)] text-white"
                          : "bg-white text-[var(--gym-ink,#063434)] hover:bg-[#F9F9F9]",
                      )}
                    >
                      <span className="block w-full max-w-full truncate px-0.5 text-center text-[11px] font-extrabold uppercase">
                        {t(`admin.workouts.weekdays.${d.weekday}`, {
                          defaultValue: isAr ? WEEKDAY_NAMES_AR[d.weekday] : WEEKDAY_NAMES_EN[d.weekday],
                        })}
                      </span>
                      <span
                        className={cn(
                          "mt-1 size-2 rounded-full",
                          trained
                            ? active
                              ? "bg-[var(--gym-lime,#b8fe22)]"
                              : "bg-[var(--gym-ink,#063434)]"
                            : active
                              ? "bg-white/30"
                              : "bg-[#D9D9D9]",
                        )}
                      />
                      <span className="mt-1 text-[10px] font-semibold">
                        {trained
                          ? `${d.exercises.length} ${isAr ? "تمارين" : "ex"}`
                          : t("admin.workouts.restLabel", { defaultValue: isAr ? "راحة" : "Rest" })}
                      </span>
                    </button>
                  )
                })}
              </div>

              {/* Day Exercises List */}
              <div className="rounded-[24px] bg-white p-5 sm:p-6 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-[#F0F0F0] pb-3">
                  <h3 className="font-heading text-[17px] font-extrabold text-[var(--gym-ink,#063434)]">
                    {t(`admin.workouts.weekdays.${selectedDay?.weekday ?? 0}`, {
                      defaultValue:
                        isAr
                          ? WEEKDAY_NAMES_AR[selectedDay?.weekday ?? 0]
                          : WEEKDAY_NAMES_EN[selectedDay?.weekday ?? 0],
                    })}
                  </h3>
                  <span className="text-[12px] font-bold text-[#8c8c8c]">
                    {selectedDay?.isRest
                      ? t("admin.workouts.restDay")
                      : t("admin.workouts.exerciseCount", {
                          count: selectedDay?.exercises.length ?? 0,
                        })}
                  </span>
                </div>

                {selectedDay?.isRest || !selectedDay?.exercises.length ? (
                  <p className="rounded-2xl bg-[#F8F9FA] p-8 text-center text-[14px] font-medium text-[#8c8c8c]">
                    {t("admin.workouts.restHint")}
                  </p>
                ) : (
                  <div className="space-y-3">
                    {selectedDay.exercises.map((exercise, idx) => {
                      const name = resolveBilingualText(exercise.name, locale)
                      const desc = resolveBilingualText(exercise.description, locale)
                      const notes = resolveBilingualText(exercise.notes, locale)
                      const linkedVideo = contentAssets.find(
                        (a) => a.id === exercise.videoContentId,
                      )

                      return (
                        <div
                          key={exercise.id}
                          className="rounded-2xl border border-[#ECECEC] bg-[#FBFBFB] p-4 transition hover:bg-white space-y-2.5"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-start gap-3">
                              <span className="flex size-7 items-center justify-center rounded-full bg-[var(--gym-ink,#063434)] text-[12px] font-extrabold text-white">
                                {idx + 1}
                              </span>
                              <div>
                                <h4 className="font-heading text-[15px] font-bold text-[var(--gym-ink,#063434)]">
                                  {name}
                                </h4>
                                {desc ? (
                                  <p className="mt-1 text-[13px] leading-relaxed text-[#6B7280]">
                                    {desc}
                                  </p>
                                ) : null}
                              </div>
                            </div>

                            {/* Watch Video Link */}
                            {exercise.videoContentId ? (
                              <button
                                type="button"
                                onClick={() => {
                                  if (linkedVideo) {
                                    setPreviewAsset(linkedVideo)
                                  } else {
                                    appToast.info(
                                      isAr
                                        ? "الفيديو قيد التحديث في المكتبة"
                                        : "Video currently updating in library",
                                    )
                                  }
                                }}
                                className="inline-flex size-9 shrink-0 items-center justify-center rounded-full bg-[var(--gym-ink,#063434)] text-[var(--gym-lime,#b8fe22)] transition hover:scale-105"
                                title={isAr ? "مشاهدة الفيديو التعليمي" : "Watch video"}
                              >
                                <Play className="size-4 fill-current" />
                              </button>
                            ) : null}
                          </div>

                          {/* Exercise Parameters */}
                          <div className="flex flex-wrap gap-2 text-[12px] font-bold text-[var(--gym-ink,#063434)]">
                            <span className="rounded-full bg-white border border-[#E0E0E0] px-3 py-1">
                              {t("admin.workouts.sets", { count: exercise.sets ?? 3 })}
                            </span>
                            <span className="rounded-full bg-white border border-[#E0E0E0] px-3 py-1">
                              {t("admin.workouts.reps", { value: exercise.reps ?? "10" })}
                            </span>
                            <span className="rounded-full bg-white border border-[#E0E0E0] px-3 py-1">
                              {t("admin.workouts.restTime", {
                                value: formatRest(exercise.restSeconds),
                              })}
                            </span>
                          </div>

                          {notes ? (
                            <p className="text-[12px] font-medium text-[#8c8c8c]">
                              {notes}
                            </p>
                          ) : null}
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Video Preview Modal */}
      {previewAsset ? (
        <ContentPreviewDialog
          asset={previewAsset}
          onClose={() => setPreviewAsset(null)}
        />
      ) : null}
    </div>
  )
}
