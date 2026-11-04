import { useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { Link } from "react-router-dom"
import {
  Calendar,
  CheckCircle2,
  Dumbbell,
  FileDown,
  HeartPulse,
  History,
  Play,
  RefreshCw,
  ShieldAlert,
} from "lucide-react"
import authImage from "@/assets/auth.avif"
import heroPattern from "@/assets/hero-pattern.avif"
import { BRAND_LOGO_ON_DARK } from "@/components/shared/BrandLogo"
import { ContentPreviewDialog } from "@/components/dashboard/ContentPreviewDialog"
import { ExerciseChangeModal } from "@/components/subscriber/ExerciseChangeModal"
import { WorkoutFeedbackModal } from "@/components/subscriber/WorkoutFeedbackModal"
import { WorkoutLiveSessionModal } from "@/components/subscriber/WorkoutLiveSessionModal"
import { WorkoutSummaryModal } from "@/components/subscriber/WorkoutSummaryModal"
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
import { useSubscriberPTQuery } from "@/features/physicalTherapy/hooks"
import { useDocumentTitle } from "@/hooks/useDocumentTitle"
import { useLocale } from "@/hooks/useLocale"
import { formatDate } from "@/lib/format"
import { appToast } from "@/lib/toast"
import { cn } from "@/lib/utils"
import type { ContentAsset } from "@/types/content"
import type {
  CompletedExerciseRecord,
  ExerciseAlternative,
  WorkoutDay,
  WorkoutExercise,
} from "@/types/program"

const WEEKDAY_NAMES_EN = ["Day 1", "Day 2", "Day 3", "Day 4", "Day 5", "Day 6", "Day 7"]
const WEEKDAY_NAMES_AR = ["يوم 1", "يوم 2", "يوم 3", "يوم 4", "يوم 5", "يوم 6", "يوم 7"]

export function WorkoutPlanPage() {
  const { t } = useTranslation()
  const { locale, isRtl } = useLocale()
  const isAr = locale === "ar"
  const { user } = useAuth()
  useDocumentTitle(isAr ? "التمارين" : "Workout Schedule")

  const todayFormatted = formatDate(new Date().toISOString(), locale)

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
    if (!currentSubscriber) {
      return (
        allPrograms.find((p) => p.status === "active") ?? allPrograms[0] ?? null
      )
    }
    return (
      allPrograms.find(
        (p) => p.subscriberId === currentSubscriber.id && p.status === "active",
      ) ??
      allPrograms.find((p) => p.status === "active") ??
      allPrograms[0] ??
      null
    )
  }, [allPrograms, currentSubscriber])

  const { data: logs = [] } = useWorkoutLogsQuery(currentSubscriber?.id)
  const { data: ptRecord } = useSubscriberPTQuery(currentSubscriber?.id)
  const logMutation = useLogWorkoutSessionMutation()

  const hasActivePTContraindications = Boolean(
    ptRecord &&
    ptRecord.status !== "cleared" &&
    ptRecord.restrictions &&
    ptRecord.restrictions.length > 0,
  )

  const [selectedDayIdx, setSelectedDayIdx] = useState(0)

  // Local exercise overrides (e.g. when subscriber substitutes an exercise in today's day)
  const [exerciseOverrides, setExerciseOverrides] = useState<
    Record<string, WorkoutExercise>
  >({})

  // Modals state
  const [changeModalExercise, setChangeModalExercise] =
    useState<WorkoutExercise | null>(null)
  const [isLivePlayerOpen, setIsLivePlayerOpen] = useState(false)
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false)
  const [isSummaryOpen, setIsSummaryOpen] = useState(false)
  const [previewAsset, setPreviewAsset] = useState<ContentAsset | null>(null)

  // Pending session summary for feedback & result dialog
  const [pendingSessionSummary, setPendingSessionSummary] = useState<{
    durationMinutes: number
    activeMinutes: number
    restMinutes: number
    totalVolumeKg: number
    exercisesCompleted: CompletedExerciseRecord[]
    perceivedEffort?: number
    energyLevel?: "great" | "good" | "tired" | "exhausted"
    notes?: string
  } | null>(null)

  const programDays = activeProgram?.days ?? []
  const rawSelectedDay = programDays[selectedDayIdx] ?? programDays[0]

  // Construct active day with any local substituted exercises
  const selectedDay: WorkoutDay | undefined = useMemo(() => {
    if (!rawSelectedDay) return undefined
    return {
      ...rawSelectedDay,
      exercises: rawSelectedDay.exercises.map(
        (ex) => exerciseOverrides[ex.id] ?? ex,
      ),
    }
  }, [rawSelectedDay, exerciseOverrides])

  const todayIso = new Date().toISOString().slice(0, 10)
  const isTodayLogged = logs.some((l) => l.date === todayIso)

  // 1. Substitute Exercise Handler
  function handleSwapExercise(substitute: ExerciseAlternative, _reason: string) {
    if (!changeModalExercise) return
    const updated: WorkoutExercise = {
      ...changeModalExercise,
      name: substitute.name,
      equipment: substitute.equipment || changeModalExercise.equipment,
      notes: substitute.notes || changeModalExercise.notes,
      description: substitute.reason || changeModalExercise.description,
    }
    setExerciseOverrides((prev) => ({
      ...prev,
      [changeModalExercise.id]: updated,
    }))
  }

  // 2. Complete Live Workout Handler
  function handleLiveWorkoutComplete(results: {
    durationMinutes: number
    activeMinutes: number
    restMinutes: number
    totalVolumeKg: number
    exercisesCompleted: CompletedExerciseRecord[]
  }) {
    setIsLivePlayerOpen(false)
    setPendingSessionSummary(results)
    setIsFeedbackOpen(true)
  }

  // 3. Submit Feedback Handler & Save to DB
  async function handleFeedbackSubmit(feedback: {
    perceivedEffort: number
    energyLevel: "great" | "good" | "tired" | "exhausted"
    notes: string
  }) {
    if (!pendingSessionSummary || !activeProgram || !selectedDay || !currentSubscriber)
      return

    const finalSummary = {
      ...pendingSessionSummary,
      ...feedback,
    }

    try {
      await logMutation.mutateAsync({
        subscriberId: currentSubscriber.id,
        programId: activeProgram.id,
        dayId: selectedDay.id,
        weekday: selectedDay.weekday,
        date: todayIso,
        workoutTitle:
          resolveBilingualText(selectedDay.label, locale) ||
          activeProgram.title[locale],
        durationMinutes: finalSummary.durationMinutes,
        activeMinutes: finalSummary.activeMinutes,
        restMinutes: finalSummary.restMinutes,
        totalVolumeKg: finalSummary.totalVolumeKg,
        perceivedEffort: finalSummary.perceivedEffort,
        energyLevel: finalSummary.energyLevel,
        exercisesCompleted: finalSummary.exercisesCompleted,
        notes: finalSummary.notes,
      })

      setPendingSessionSummary(finalSummary)
      setIsFeedbackOpen(false)
      setIsSummaryOpen(true)
      appToast.success(
        isAr ? "تم حفظ التمرين وسجل الأداء بنجاح!" : "Workout record saved successfully!",
      )
    } catch {
      appToast.error(isAr ? "فشل حفظ جلسة التمرين" : "Failed to save workout session")
    }
  }

  // 4. Download / Print PDF Handler
  function handleDownloadPdf() {
    if (activeProgram?.format === "pdf" && activeProgram.pdfContentId) {
      const asset = contentAssets.find((a) => a.id === activeProgram.pdfContentId)
      if (asset?.fileUrl) {
        window.open(asset.fileUrl, "_blank")
        return
      }
    }
    // Interactive print/save as PDF
    window.print()
  }

  // 5. Open exercise video demo
  function handlePlayExerciseVideo(exercise: WorkoutExercise) {
    if (exercise.videoContentId) {
      const asset = contentAssets.find((a) => a.id === exercise.videoContentId)
      if (asset) {
        setPreviewAsset(asset)
        return
      }
    }
    const name = resolveBilingualText(exercise.name, locale)
    const desc = resolveBilingualText(exercise.description, locale)
    setPreviewAsset({
      id: exercise.id,
      category: "exerciseVideo",
      kind: "video",
      title: { en: name, ar: name },
      description: { en: desc || "", ar: desc || "" },
      streamUrl: exercise.videoUrl,
      storagePath: `content/videos/${exercise.id}.mp4`,
      tags: ["workout", "exercise"],
      sizeLabel: "1080p HD",
      visibility: "assigned",
      requiredEntitlement: "exerciseVideos",
      packageIds: [],
      subscriberIds: [],
      programIds: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })
  }

  return (
    <div className="flex flex-col gap-5 pb-12">
      {!activeProgram ? (
        <div className="flex min-h-60 flex-col items-center justify-center rounded-[28px] bg-white p-8 text-center shadow-xs">
          <Dumbbell className="size-12 mb-3 text-[var(--gym-orange,#fb5001)] stroke-1" />
          <h2 className="font-heading text-[19px] font-extrabold text-[var(--gym-ink,#111111)]">
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
          {/* Flagship Hero Banner (Exact match with Files / Playbooks section banner) */}
          <div
            dir={isRtl ? "rtl" : "ltr"}
            aria-label={isAr ? "برنامج التمارين" : "Workout Schedule"}
            className="group relative block w-full overflow-hidden rounded-[22px] sm:rounded-[26px] bg-gradient-to-r from-[#1a040b] via-[#24030c] to-[#120206] shadow-[0_12px_36px_rgba(26,4,11,0.22)] border border-white/10 select-none"
          >
            {/* Fitness Athlete Image at Trailing End with Smooth Alpha Mask Fade */}
            <div
              className={cn(
                "pointer-events-none absolute inset-y-0 end-0 z-[1] h-full select-none overflow-hidden",
                "w-[50%] xs:w-[52%] sm:w-[55%] lg:w-[48%]",
              )}
              style={{
                maskImage: isRtl
                  ? "linear-gradient(to right, black 0%, black 20%, rgba(0,0,0,0.7) 60%, transparent 98%)"
                  : "linear-gradient(to left, black 0%, black 20%, rgba(0,0,0,0.7) 60%, transparent 98%)",
                WebkitMaskImage: isRtl
                  ? "linear-gradient(to right, black 0%, black 20%, rgba(0,0,0,0.7) 60%, transparent 98%)"
                  : "linear-gradient(to left, black 0%, black 20%, rgba(0,0,0,0.7) 60%, transparent 98%)",
              }}
            >
              <img
                src={authImage}
                alt=""
                draggable={false}
                className="size-full object-cover object-[25%_12%] sm:object-[center_20%] opacity-80 sm:opacity-90 transition-transform duration-700 group-hover:scale-105"
              />
            </div>

            {/* Soft Fade Gradient — Solid Behind Text, Seamlessly Blends Over Athlete */}
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 z-[2]"
              style={{
                background: isRtl
                  ? "linear-gradient(270deg, #1a040b 0%, #1a040b 42%, rgba(26,4,11,0.88) 60%, rgba(26,4,11,0.25) 82%, rgba(26,4,11,0) 100%)"
                  : "linear-gradient(90deg, #1a040b 0%, #1a040b 42%, rgba(26,4,11,0.88) 60%, rgba(26,4,11,0.25) 82%, rgba(26,4,11,0) 100%)",
              }}
            />

            {/* Hero Pattern Overlay (Signature Website Dark Texture) */}
            <img
              src={heroPattern}
              alt=""
              aria-hidden
              draggable={false}
              className="pointer-events-none absolute inset-0 z-[3] size-full object-cover opacity-20 mix-blend-screen select-none rtl:-scale-x-100"
            />

            {/* Ambient Backlight Glow behind Brand Badge */}
            <div
              aria-hidden
              className="pointer-events-none absolute -start-10 -top-10 size-36 rounded-full bg-[var(--gym-lime,#fb5001)]/20 blur-2xl"
            />

            {/* Top Specular Rim Line */}
            <div
              aria-hidden
              className="pointer-events-none absolute inset-x-0 top-0 z-[4] h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent"
            />

            {/* Card Foreground Content */}
            <div className="relative z-10 flex min-h-[190px] sm:min-h-[225px] flex-col justify-between p-4 sm:p-7 lg:p-8 max-w-[80%] xs:max-w-[74%] sm:max-w-[70%] lg:max-w-[62%]">
              {/* Top Row: Brand & Program Badges */}
              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2.5">
                {/* DerpyFit Logo Pill */}
                <div className="flex items-center rounded-full bg-black/60 px-2.5 py-0.5 sm:px-3 sm:py-1 backdrop-blur-md border border-white/15 shadow-sm">
                  <img
                    src={BRAND_LOGO_ON_DARK}
                    alt="DerpyFit"
                    className="h-3.5 sm:h-4.5 w-auto object-contain"
                  />
                </div>

                {/* Sessions per week pill */}
                <span
                  className={cn(
                    "inline-flex items-center gap-1 rounded-full bg-[var(--gym-lime,#fb5001)]/15 px-2.5 py-0.5 sm:px-3 sm:py-1 text-[10.5px] sm:text-[11.5px] font-bold text-[var(--gym-lime,#fb5001)] border border-[var(--gym-lime,#fb5001)]/30 backdrop-blur-sm",
                    isAr ? "font-arabic" : "font-sans",
                  )}
                >
                  <Dumbbell className="size-3 sm:size-3.5" strokeWidth={2.2} />
                  <span>
                    {trainingDayCount(activeProgram)} {isAr ? "حصص" : "days"}
                  </span>
                </span>

                {/* Format pill */}
                {activeProgram.format ? (
                  <span className="inline-flex items-center rounded-full bg-white/10 px-2 py-0.5 text-[10px] sm:text-[10.5px] font-extrabold text-white/80 backdrop-blur-sm border border-white/10">
                    {t(`admin.workouts.format.${activeProgram.format}`)}
                  </span>
                ) : null}

                {/* Today Logged Badge if completed (Brand styling, zero green) */}
                {isTodayLogged ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-2.5 py-0.5 text-[10px] sm:text-[11px] font-bold text-white backdrop-blur-sm border border-white/20">
                    <CheckCircle2 className="size-3 text-[var(--gym-orange,#fb5001)]" />
                    <span>{isAr ? "تم إنجاز تمرين اليوم" : "Today Completed"}</span>
                  </span>
                ) : null}

                {/* Date (hidden on small mobile to avoid wrapping, visible on sm+) */}
                <span
                  className={cn(
                    "hidden sm:inline-block text-[11px] font-bold text-white/60",
                    isAr ? "font-arabic" : "font-sans",
                  )}
                >
                  {todayFormatted}
                </span>
              </div>

              {/* Middle: Title & Description */}
              <div className="my-1.5 sm:my-3">
                <h1
                  className={cn(
                    "text-[17px] sm:text-[24px] lg:text-[28px] font-black text-white tracking-tight leading-snug",
                    isAr ? "font-arabic" : "font-heading",
                  )}
                >
                  {isAr ? "التمارين" : "Workouts"}
                  <span className="ms-1.5 text-[13px] sm:text-[19px] font-semibold text-white/75">
                    — {activeProgram.title[locale]}
                  </span>
                </h1>

                <p
                  className={cn(
                    "mt-0.5 sm:mt-1.5 text-[11.5px] sm:text-[13.5px] font-medium leading-relaxed text-white/80 line-clamp-2",
                    isAr ? "font-arabic" : "font-sans",
                  )}
                >
                  {activeProgram.description?.[locale] ||
                    (isAr
                      ? `جدول تدريبي مخصص يتضمن ${trainingDayCount(activeProgram)} حصص تدريبية أسبوعياً مصممة لبناء القوة والكتلة العضلية.`
                      : `Personalized program with ${trainingDayCount(activeProgram)} training days designed for strength and muscle hypertrophy.`)}
                </p>
              </div>

              {/* Bottom: Actions Row */}
              <div className="flex flex-wrap items-center gap-2 pt-0.5 sm:pt-1">
                {/* 1. Primary Action: Start Workout (ابدأ التمرين) */}
                <button
                  type="button"
                  onClick={() => setIsLivePlayerOpen(true)}
                  disabled={selectedDay?.isRest || !selectedDay?.exercises?.length}
                  className={cn(
                    "group/btn inline-flex items-center gap-2 rounded-full bg-[var(--gym-orange,#fb5001)] hover:bg-[#e04500] text-white px-4 py-2 sm:px-6 sm:py-3 text-[12px] sm:text-[14px] font-black shadow-[0_8px_24px_rgba(251,80,1,0.45)] border border-white/20 transition-all duration-300 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:pointer-events-none disabled:shadow-none",
                    isAr ? "font-arabic" : "font-heading",
                  )}
                >
                  <Play className="size-3.5 sm:size-4 fill-white text-white" />
                  <span>{isAr ? "ابدأ التمرين" : "Start Workout"}</span>
                </button>

                {/* 2. Secondary Action: Download PDF (تحميل PDF) */}
                <button
                  type="button"
                  onClick={handleDownloadPdf}
                  className={cn(
                    "group/btn inline-flex items-center gap-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white px-3.5 py-2 sm:px-5 sm:py-3 text-[11.5px] sm:text-[13px] font-bold backdrop-blur-sm border border-white/15 transition-all duration-200 active:scale-95",
                    isAr ? "font-arabic" : "font-heading",
                  )}
                >
                  <FileDown className="size-3.5 sm:size-4 text-white/90" strokeWidth={2.2} />
                  <span>{isAr ? "تحميل PDF" : "Download PDF"}</span>
                </button>

                {/* 3. Secondary Action: Workout Log (سجل التمارين) */}
                <Link
                  to="/app/workout-log"
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white px-3.5 py-2 sm:px-5 sm:py-3 text-[11.5px] sm:text-[13px] font-bold backdrop-blur-sm border border-white/15 transition-all duration-200 active:scale-95",
                    isAr ? "font-arabic" : "font-heading",
                  )}
                >
                  <History className="size-3.5 sm:size-4 text-[var(--gym-orange,#fb5001)]" />
                  <span>{isAr ? "سجل التمارين" : "Workout Log"}</span>
                </Link>
              </div>
            </div>
          </div>

          {/* Active Rehab & Movement Contraindications Alert Banner */}
          {hasActivePTContraindications && ptRecord ? (
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-[22px] bg-white border border-rose-200/80 p-3.5 sm:p-4 shadow-2xs">
              <div className="flex items-center gap-3">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-rose-50 border border-rose-200 text-rose-600">
                  <HeartPulse className="size-5" />
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-heading text-[13.5px] sm:text-[14px] font-black text-[var(--gym-ink,#111111)]">
                      {isAr
                        ? `تنبيه علاجي وتأهيلي: لديك موانع حركة معتمدة`
                        : `Certified Movement Restriction Notice`}
                    </p>
                    <span className="rounded-full bg-rose-100 px-2 py-0.5 text-[10.5px] font-bold text-rose-800">
                      {ptRecord.restrictions.length} {isAr ? "بدائل آمنة" : "safe substitutes"}
                    </span>
                  </div>
                  <p className="text-[12px] text-[#6B7280] mt-0.5">
                    {isAr
                      ? `تم اعتماد بدائل آمنة للتمارين لحماية (${ptRecord.injuryTitle[locale] || ptRecord.injuryTitle.en}). راجع التوجيهات الطبية قبل البدء.`
                      : `Approved substitutes are active to safeguard your (${ptRecord.injuryTitle[locale] || ptRecord.injuryTitle.en}). Review guidance before starting.`}
                  </p>
                </div>
              </div>

              <Link
                to="/app/physical-therapy"
                className="inline-flex items-center justify-center gap-1.5 self-start sm:self-auto rounded-full bg-[var(--gym-ink,#111111)] hover:bg-black text-white px-4 py-2 text-[12px] font-bold transition shrink-0 shadow-2xs"
              >
                <span>{isAr ? "عرض البدائل المعتمدة" : "View Safe Alternatives"}</span>
              </Link>
            </div>
          ) : null}

          {/* 1. Days Carousel / Tabs Strip (Matching Images 1 & 2) */}
          <div className="flex items-center gap-2.5 overflow-x-auto pb-1 pt-0.5 no-scrollbar">
            {programDays.map((d, idx) => {
              const active = idx === selectedDayIdx
              const isTrained = !d.isRest && d.exercises.length > 0
              const dayTitle = isAr ? WEEKDAY_NAMES_AR[idx] : WEEKDAY_NAMES_EN[idx]

              return (
                <button
                  key={d.id || idx}
                  type="button"
                  onClick={() => setSelectedDayIdx(idx)}
                  className={cn(
                    "flex min-w-[76px] sm:min-w-[90px] h-[82px] sm:h-[90px] shrink-0 flex-col items-center justify-center rounded-2xl p-2 text-center transition shadow-2xs border select-none",
                    active
                      ? "bg-[var(--gym-orange,#fb5001)] border-[var(--gym-orange,#fb5001)] text-white shadow-md scale-[1.02]"
                      : "bg-[#181818] border-transparent text-white/80 hover:bg-[#222222] hover:text-white",
                  )}
                >
                  <span className="text-[11px] font-bold uppercase tracking-wider opacity-80">
                    {dayTitle}
                  </span>
                  <span
                    className="font-heading text-[20px] sm:text-[22px] font-black leading-tight text-white"
                  >
                    {idx + 1}
                  </span>
                  <span
                    className={cn(
                      "mt-0.5 text-[10px] font-bold truncate max-w-full px-1",
                      active ? "text-white/90" : "text-white/60",
                    )}
                  >
                    {isTrained
                      ? `${d.exercises.length} ${isAr ? "تمارين" : "ex"}`
                      : isAr
                        ? "راحة"
                        : "Rest"}
                  </span>
                </button>
              )
            })}
          </div>

          {/* 2. Selected Day Details Sheet (Matching Images 1 & 2) */}
          <div className="rounded-[28px] bg-white p-5 sm:p-7 shadow-xs border border-black/[0.04] space-y-5">
            {/* Day Title & Focus Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-black/[0.06] pb-4">
              <div>
                <h2 className="font-heading text-[19px] sm:text-[21px] font-black text-[var(--gym-ink,#111111)]">
                  {resolveBilingualText(selectedDay?.label, locale) ||
                    (isAr
                      ? `يوم ${selectedDayIdx + 1} (${selectedDay?.exercises.length ?? 0} تمارين)`
                      : `Day ${selectedDayIdx + 1} (${selectedDay?.exercises.length ?? 0} exercises)`)}
                </h2>
                {selectedDay?.focus ? (
                  <p className="mt-0.5 text-[12.5px] font-medium text-[#8c8c8c]">
                    {resolveBilingualText(selectedDay.focus, locale)}
                  </p>
                ) : null}
              </div>

              <div className="flex items-center gap-2 self-start sm:self-auto">
                <span className="rounded-full bg-[var(--gym-orange,#fb5001)]/10 px-3 py-1 text-[12px] font-extrabold text-[var(--gym-orange,#fb5001)]">
                  {selectedDay?.isRest
                    ? isAr
                      ? "يوم استرجاع وراحة"
                      : "Rest Day"
                    : `${selectedDay?.exercises.length ?? 0} ${isAr ? "تمارين" : "exercises"}`}
                </span>
              </div>
            </div>

            {/* Exercises List or Rest State */}
            {selectedDay?.isRest || !selectedDay?.exercises.length ? (
              <div className="flex flex-col items-center justify-center rounded-2xl bg-[#F8F9FA] p-10 text-center text-[#8c8c8c] space-y-2">
                <Calendar className="size-10 stroke-1 text-gray-400" />
                <h4 className="font-heading text-[16px] font-bold text-[var(--gym-ink,#111111)]">
                  {isAr ? "اليوم مخصص للراحة والاستشفاء العضلي" : "Scheduled Rest & Recovery Day"}
                </h4>
                <p className="max-w-md text-[13px] text-gray-500">
                  {isAr
                    ? "الراحة جزء أساسي من بناء العضلات والوقاية من الإصابات. حافظ على ترطيب جسمك وتناول وجباتك المتوازنة."
                    : "Active recovery and quality sleep are essential for muscular hypertrophy and performance."}
                </p>
              </div>
            ) : (
              <div className="space-y-3.5">
                {selectedDay.exercises.map((exercise, idx) => {
                  const name = resolveBilingualText(exercise.name, locale)
                  const desc = resolveBilingualText(exercise.description, locale)
                  const notes = resolveBilingualText(exercise.notes, locale)
                  const hasVideo = Boolean(exercise.videoUrl || exercise.videoContentId)

                  const ptContraindication = ptRecord?.restrictions?.find((r) => {
                    const probEn = (r.prohibited?.en || "").toLowerCase()
                    const probAr = r.prohibited?.ar || ""
                    const exNameEn = (typeof exercise.name === "string" ? exercise.name : exercise.name?.en || "").toLowerCase()
                    const exNameAr = typeof exercise.name === "string" ? "" : exercise.name?.ar || ""
                    return (
                      Boolean(probEn && (exNameEn.includes(probEn) || probEn.includes(exNameEn))) ||
                      Boolean(probAr && (exNameAr.includes(probAr) || probAr.includes(exNameAr)))
                    )
                  })

                  return (
                    <div
                      key={exercise.id || idx}
                      className="group rounded-2xl border border-black/[0.06] bg-[#FAFAFA] p-3.5 sm:p-4 transition hover:bg-white hover:border-black/15 hover:shadow-2xs space-y-3"
                    >
                      <div className="flex items-center justify-between gap-3">
                        {/* Right: Exercise Info & Metrics */}
                        <div className="flex-1 space-y-2 min-w-0">
                          <div className="flex items-start gap-2.5">
                            <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-[var(--gym-ink,#111111)] text-[11px] font-black text-white mt-0.5">
                              {idx + 1}
                            </span>
                            <div className="min-w-0">
                              <h4 className="font-heading text-[15px] sm:text-[16px] font-extrabold text-[var(--gym-ink,#111111)] truncate">
                                {name}
                              </h4>
                              {desc ? (
                                <p className="text-[12px] text-[#6B7280] line-clamp-1 mt-0.5">
                                  {desc}
                                </p>
                              ) : null}
                            </div>
                          </div>

                          {/* Exercise Badges (Matching Images 1 & 2) */}
                          <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-bold text-[var(--gym-ink,#111111)]">
                            <span className="rounded-lg bg-white border border-black/[0.08] px-2.5 py-1 shadow-2xs">
                              {isAr
                                ? `مجموعة : ${exercise.sets ?? 3}`
                                : `Sets: ${exercise.sets ?? 3}`}
                            </span>
                            <span className="rounded-lg bg-white border border-black/[0.08] px-2.5 py-1 shadow-2xs">
                              {exercise.reps === "max"
                                ? isAr
                                  ? "وقت : max"
                                  : "Time: max"
                                : isAr
                                  ? `عدات : ( ${exercise.reps ?? "10 - 15"} )`
                                  : `Reps: ${exercise.reps ?? "10 - 15"}`}
                            </span>
                            <span className="rounded-lg bg-white border border-black/[0.08] px-2.5 py-1 shadow-2xs text-[#6B7280]">
                              {isAr
                                ? `وقت الراحة : ${formatRest(exercise.restSeconds ?? 60)}`
                                : `Rest: ${formatRest(exercise.restSeconds ?? 60)}`}
                            </span>
                          </div>
                        </div>

                        {/* Action Buttons: Swap + Video + Optional real photo */}
                        <div className="flex items-center gap-2 shrink-0">
                          {/* Swap Exercise Button (opens Change Modal) */}
                          <button
                            type="button"
                            onClick={() => setChangeModalExercise(exercise)}
                            className="flex size-9 sm:size-10 items-center justify-center rounded-xl bg-black/5 text-[var(--gym-ink,#111111)] hover:bg-[var(--gym-orange,#fb5001)] hover:text-white transition shadow-2xs"
                            title={isAr ? "طلب استبدال هذا التمرين" : "Substitute exercise"}
                          >
                            <RefreshCw className="size-4" />
                          </button>

                          {/* Quick Info / Video preview button */}
                          {hasVideo ? (
                            <button
                              type="button"
                              onClick={() => handlePlayExerciseVideo(exercise)}
                              className="flex size-9 sm:size-10 items-center justify-center rounded-xl bg-[var(--gym-ink,#111111)] text-[var(--gym-orange,#fb5001)] hover:bg-[var(--gym-orange,#fb5001)] hover:text-white transition shadow-2xs"
                              title={isAr ? "مشاهدة الفيديو التعليمي" : "Watch demo"}
                            >
                              <Play className="size-4 fill-current" />
                            </button>
                          ) : null}

                          {/* Real Photo Thumbnail (ONLY if an actual photo URL is provided - NO placeholder box) */}
                          {exercise.thumbnailUrl ? (
                            <button
                              type="button"
                              onClick={() => {
                                if (hasVideo) handlePlayExerciseVideo(exercise)
                              }}
                              className="size-12 sm:size-14 rounded-xl overflow-hidden bg-black/10 shrink-0 border border-black/10 relative group/thumb cursor-pointer"
                              title={hasVideo ? (isAr ? "مشاهدة الفيديو" : "Watch video") : name}
                            >
                              <img
                                src={exercise.thumbnailUrl}
                                alt={name}
                                className="w-full h-full object-cover group-hover/thumb:scale-105 transition duration-300"
                              />
                              {hasVideo ? (
                                <div className="absolute inset-0 bg-black/35 flex items-center justify-center opacity-0 group-hover/thumb:opacity-100 transition">
                                  <Play className="size-4 fill-white text-white drop-shadow" />
                                </div>
                              ) : null}
                            </button>
                          ) : null}
                        </div>
                      </div>

                      {/* Movement Contraindication / Safe Alternative Teaser */}
                      {ptContraindication ? (
                        <div className="flex items-center justify-between rounded-xl bg-rose-50 border border-rose-200/80 px-3 py-2 text-[12px] text-rose-950">
                          <div className="flex items-center gap-2 min-w-0">
                            <ShieldAlert className="size-4 text-rose-600 shrink-0" />
                            <span className="truncate">
                              <strong>{isAr ? "موانع حركة تأهيلية: " : "Rehab Restriction: "}</strong>
                              {isAr ? "البديل المعتمد: " : "Use substitute: "}
                              <strong className="underline text-[var(--gym-ink,#111111)]">
                                {ptContraindication.safeAlternative[locale] || ptContraindication.safeAlternative.en}
                              </strong>
                            </span>
                          </div>
                          <Link
                            to="/app/physical-therapy"
                            className="text-[11px] font-bold text-rose-700 hover:underline shrink-0 ms-2"
                          >
                            {isAr ? "التفاصيل" : "Details"}
                          </Link>
                        </div>
                      ) : null}

                      {/* Coach Note / Alternatives teaser if present */}
                      {notes ? (
                        <p className="text-[11.5px] font-medium text-[#8c8c8c] bg-white rounded-lg p-2 border border-black/[0.04]">
                          💡 {notes}
                        </p>
                      ) : null}
                    </div>
                  )
                })}
              </div>
            )}

            {/* 3. Bottom Sticky / Action Bar (Matching Image 1) */}
            {!selectedDay?.isRest && selectedDay?.exercises.length ? (
              <div className="pt-4 border-t border-black/[0.06] flex flex-col sm:flex-row items-center gap-3">
                {/* Primary Button: Start Workout */}
                <button
                  type="button"
                  onClick={() => setIsLivePlayerOpen(true)}
                  className="w-full sm:flex-1 inline-flex h-12 sm:h-13 items-center justify-center gap-2 rounded-2xl bg-[var(--gym-orange,#fb5001)] px-6 text-[15px] sm:text-[16px] font-black text-white shadow-md hover:opacity-95 active:scale-[0.98] transition"
                >
                  <Play className="size-5 fill-white text-white" />
                  <span>{isAr ? "ابدأ التمرين" : "Start Workout"}</span>
                </button>

                {/* Secondary Button: Download PDF */}
                <button
                  type="button"
                  onClick={handleDownloadPdf}
                  className="w-full sm:w-auto inline-flex h-12 sm:h-13 items-center justify-center gap-2 rounded-2xl border-2 border-[var(--gym-orange,#fb5001)] bg-white px-6 text-[14px] sm:text-[15px] font-black text-[var(--gym-orange,#fb5001)] shadow-sm hover:bg-[var(--gym-orange,#fb5001)]/5 active:scale-[0.98] transition"
                >
                  <FileDown className="size-4 stroke-[2.5]" />
                  <span>{isAr ? "تحميل PDF" : "Download PDF"}</span>
                </button>
              </div>
            ) : null}
          </div>
        </div>
      )}

      {/* 4. Interactive Live Workout Player Modal */}
      {selectedDay && (
        <WorkoutLiveSessionModal
          isOpen={isLivePlayerOpen}
          onClose={() => setIsLivePlayerOpen(false)}
          day={selectedDay}
          programTitle={activeProgram?.title[locale]}
          onCompleteWorkout={handleLiveWorkoutComplete}
        />
      )}

      {/* 5. Post-Workout Feedback Modal */}
      <WorkoutFeedbackModal
        isOpen={isFeedbackOpen}
        onClose={() => setIsFeedbackOpen(false)}
        workoutTitle={
          resolveBilingualText(selectedDay?.label, locale) ||
          activeProgram?.title[locale]
        }
        onSubmit={handleFeedbackSubmit}
      />

      {/* 6. Workout Summary / Results Modal */}
      {pendingSessionSummary && (
        <WorkoutSummaryModal
          isOpen={isSummaryOpen}
          onClose={() => setIsSummaryOpen(false)}
          workoutTitle={
            resolveBilingualText(selectedDay?.label, locale) ||
            activeProgram?.title[locale]
          }
          durationMinutes={pendingSessionSummary.durationMinutes}
          activeMinutes={pendingSessionSummary.activeMinutes}
          restMinutes={pendingSessionSummary.restMinutes}
          totalVolumeKg={pendingSessionSummary.totalVolumeKg}
          exercisesCompleted={pendingSessionSummary.exercisesCompleted}
          perceivedEffort={pendingSessionSummary.perceivedEffort}
          energyLevel={pendingSessionSummary.energyLevel}
          notes={pendingSessionSummary.notes}
        />
      )}

      {/* 7. Change Exercise Modal */}
      <ExerciseChangeModal
        isOpen={Boolean(changeModalExercise)}
        onClose={() => setChangeModalExercise(null)}
        exercise={changeModalExercise}
        onSwapExercise={handleSwapExercise}
      />

      {/* 8. Video Preview Dialog */}
      {previewAsset ? (
        <ContentPreviewDialog
          asset={previewAsset}
          onClose={() => setPreviewAsset(null)}
        />
      ) : null}
    </div>
  )
}
