import { useEffect, useMemo, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import {
  AlertCircle,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock,
  Dumbbell,
  Info,
  Pause,
  Play,
  RefreshCw,
  Volume2,
  VolumeX,
  X,
} from "lucide-react"
import { useLocale } from "@/hooks/useLocale"
import { resolveBilingualText } from "@/features/workouts/demo"
import { cn } from "@/lib/utils"
import type {
  CompletedExerciseRecord,
  ExerciseAlternative,
  WorkoutDay,
  WorkoutExercise,
} from "@/types/program"
import { ExerciseChangeModal } from "./ExerciseChangeModal"

interface WorkoutLiveSessionModalProps {
  isOpen: boolean
  onClose: () => void
  day: WorkoutDay
  programTitle?: string
  onCompleteWorkout: (results: {
    durationMinutes: number
    activeMinutes: number
    restMinutes: number
    totalVolumeKg: number
    exercisesCompleted: CompletedExerciseRecord[]
  }) => void
}

type SetLog = {
  setNumber: number
  reps: number | string
  weightKg: number
  completed: boolean
}

export function WorkoutLiveSessionModal({
  isOpen,
  onClose,
  day,
  programTitle: _programTitle,
  onCompleteWorkout,
}: WorkoutLiveSessionModalProps) {
  const { t: _t } = useTranslation()
  const { locale, isRtl } = useLocale()
  const isAr = locale === "ar"

  // Working copy of exercises allowing local substitution
  const [exercisesList, setExercisesList] = useState<WorkoutExercise[]>(day.exercises)

  useEffect(() => {
    setExercisesList(day.exercises)
  }, [day])

  const [currentIdx, setCurrentIdx] = useState(0)
  const currentExercise = exercisesList[currentIdx] ?? exercisesList[0]

  // Overall workout elapsed time in seconds
  const [totalSeconds, setTotalSeconds] = useState(0)
  const [isTimerRunning, setIsTimerRunning] = useState(true)

  // Active work seconds vs Rest seconds
  const [activeSeconds, setActiveSeconds] = useState(0)
  const [restSecondsTotal, setRestSecondsTotal] = useState(0)

  // Rest countdown state
  const [isResting, setIsResting] = useState(false)
  const [restCountdown, setRestCountdown] = useState(60)

  // Per-exercise set tracking: Record<exerciseId, SetLog[]>
  const [exerciseLogs, setExerciseLogs] = useState<Record<string, SetLog[]>>({})
  const [currentSetIdx, setCurrentSetIdx] = useState(0)

  // Quick inputs for current set weight/reps
  const [currentWeight, setCurrentWeight] = useState<number>(0)
  const [currentReps, setCurrentReps] = useState<number>(10)

  // Modals inside session
  const [showExitConfirm, setShowExitConfirm] = useState(false)
  const [showInfoModal, setShowInfoModal] = useState(false)
  const [showWeightModal, setShowWeightModal] = useState(false)
  const [showChangeModal, setShowChangeModal] = useState(false)
  const [isMuted, setIsMuted] = useState(true)

  // Audio tone cue for timer
  const audioContextRef = useRef<AudioContext | null>(null)

  function playTone(freq = 880, duration = 0.15) {
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
      }
      const ctx = audioContextRef.current
      if (ctx.state === "suspended") {
        void ctx.resume()
      }
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = "sine"
      osc.frequency.value = freq
      gain.gain.setValueAtTime(0.1, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration)
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start()
      osc.stop(ctx.currentTime + duration)
    } catch {
      // Audio not permitted or supported
    }
  }

  // Initialize set logs for all exercises
  useEffect(() => {
    if (!exercisesList.length) return
    const initial: Record<string, SetLog[]> = {}
    exercisesList.forEach((ex) => {
      const setsCount = ex.sets ?? 3
      const defaultReps = parseInt(String(ex.reps ?? "10"), 10) || 10
      initial[ex.id] = Array.from({ length: setsCount }, (_, i) => ({
        setNumber: i + 1,
        reps: defaultReps,
        weightKg: 0,
        completed: false,
      }))
    })
    setExerciseLogs(initial)
    setCurrentIdx(0)
    setCurrentSetIdx(0)
    setTotalSeconds(0)
    setActiveSeconds(0)
    setRestSecondsTotal(0)
    setIsTimerRunning(true)
  }, [exercisesList])

  // Workout Elapsed Timer
  useEffect(() => {
    if (!isOpen || !isTimerRunning) return
    const interval = setInterval(() => {
      setTotalSeconds((s) => s + 1)
      if (isResting) {
        setRestSecondsTotal((s) => s + 1)
      } else {
        setActiveSeconds((s) => s + 1)
      }
    }, 1000)
    return () => clearInterval(interval)
  }, [isOpen, isTimerRunning, isResting])

  // Rest Countdown Timer
  useEffect(() => {
    if (!isResting || !isTimerRunning) return
    const interval = setInterval(() => {
      setRestCountdown((prev) => {
        if (prev <= 1) {
          setIsResting(false)
          playTone(1050, 0.3)
          return 0
        }
        if (prev <= 4) {
          playTone(650, 0.08)
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [isResting, isTimerRunning])

  // Current exercise set logs
  const currentLogs = useMemo(() => {
    if (!currentExercise) return []
    return exerciseLogs[currentExercise.id] ?? []
  }, [currentExercise, exerciseLogs])

  const totalSets = currentLogs.length || (currentExercise?.sets ?? 3)

  function formatTime(secs: number) {
    const m = Math.floor(secs / 60)
    const s = secs % 60
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
  }

  function handleCompleteSet() {
    if (!currentExercise) return

    // Mark current set as complete
    const updated = [...(exerciseLogs[currentExercise.id] || [])]
    if (updated[currentSetIdx]) {
      updated[currentSetIdx] = {
        ...updated[currentSetIdx],
        completed: true,
        weightKg: currentWeight > 0 ? currentWeight : updated[currentSetIdx].weightKg,
        reps: currentReps > 0 ? currentReps : updated[currentSetIdx].reps,
      }
      setExerciseLogs((prev) => ({ ...prev, [currentExercise.id]: updated }))
    }

    playTone(900, 0.15)

    // Check if more sets remain in this exercise
    if (currentSetIdx + 1 < totalSets) {
      setCurrentSetIdx((prev) => prev + 1)
      // Start rest timer
      const restTime = currentExercise.restSeconds ?? 60
      setRestCountdown(restTime)
      setIsResting(true)
    } else {
      // All sets done for this exercise, move to next exercise or finish
      if (currentIdx + 1 < exercisesList.length) {
        setCurrentIdx((prev) => prev + 1)
        setCurrentSetIdx(0)
        const restTime = currentExercise.restSeconds ?? 60
        setRestCountdown(restTime)
        setIsResting(true)
      } else {
        // Last exercise completed!
        handleFinishWorkout()
      }
    }
  }

  function handleFinishWorkout() {
    setIsTimerRunning(false)
    setIsResting(false)

    // Compute volume & summary records
    let totalVolume = 0
    const records: CompletedExerciseRecord[] = exercisesList.map((ex) => {
      const logs = exerciseLogs[ex.id] || []
      const completedSets = logs.filter((s) => s.completed).length || (ex.sets ?? 1)
      const avgWeight = logs.reduce((sum, s) => sum + s.weightKg, 0)
      const avgReps = logs.reduce((sum, s) => sum + (Number(s.reps) || 0), 0)
      totalVolume += avgWeight * avgReps

      return {
        exerciseId: ex.id,
        name: resolveBilingualText(ex.name, locale),
        targetSets: ex.sets ?? 3,
        completedSets,
        weightKg: avgWeight,
        repsDone: ex.reps ?? "10",
        durationSeconds: Math.round(activeSeconds / Math.max(1, exercisesList.length)),
        restSeconds: ex.restSeconds ?? 60,
      }
    })

    onCompleteWorkout({
      durationMinutes: Math.max(1, Math.round(totalSeconds / 60)),
      activeMinutes: Math.max(1, Math.round(activeSeconds / 60)),
      restMinutes: Math.round(restSecondsTotal / 60),
      totalVolumeKg: totalVolume,
      exercisesCompleted: records,
    })
  }

  function handleSwapFromModal(substitute: ExerciseAlternative, _reason: string) {
    const updated = [...exercisesList]
    const current = updated[currentIdx]
    if (current) {
      updated[currentIdx] = {
        ...current,
        name: substitute.name,
        equipment: substitute.equipment || current.equipment,
        notes: substitute.notes || current.notes,
      }
      setExercisesList(updated)
    }
  }

  if (!isOpen || !currentExercise) return null

  const exerciseName = resolveBilingualText(currentExercise.name, locale)
  const exerciseDesc = resolveBilingualText(currentExercise.description, locale)
  const exerciseNotes = resolveBilingualText(currentExercise.notes, locale)

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex flex-col bg-[#111111] text-white overflow-hidden animate-in fade-in duration-200"
    >
      {/* 1. Top Stories Progress Bar */}
      <div className="flex w-full items-center gap-1.5 px-3 pt-3 pb-2 z-20">
        {exercisesList.map((ex, idx) => {
          const isDone = idx < currentIdx
          const isCurrent = idx === currentIdx
          return (
            <div
              key={ex.id || idx}
              className="h-1.5 flex-1 rounded-full bg-white/20 overflow-hidden"
            >
              <div
                className={cn(
                  "h-full transition-all duration-300",
                  isDone
                    ? "w-full bg-[var(--gym-orange,#fb5001)]"
                    : isCurrent
                      ? "w-full bg-[var(--gym-orange,#fb5001)] animate-pulse"
                      : "w-0",
                )}
              />
            </div>
          )
        })}
      </div>

      {/* 2. Top Header Navigation Bar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-white/10 z-20">
        {/* Close Button */}
        <button
          type="button"
          onClick={() => setShowExitConfirm(true)}
          className="flex size-9 items-center justify-center rounded-full bg-white/10 text-white/80 hover:bg-white/20 hover:text-white transition"
          title={isAr ? "إغلاق التمرين" : "Exit workout"}
        >
          <X className="size-5" />
        </button>

        {/* Workout Progress Counter & Timer */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-[12px] font-bold">
            <Clock className="size-3.5 text-[var(--gym-orange,#fb5001)]" />
            <span className="font-mono text-[13px] tracking-wide font-extrabold text-white">
              {formatTime(totalSeconds)}
            </span>
          </div>

          <button
            type="button"
            onClick={() => setIsTimerRunning(!isTimerRunning)}
            className="flex size-8 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition"
            title={isTimerRunning ? (isAr ? "إيقاف مؤقت" : "Pause") : (isAr ? "استئناف" : "Resume")}
          >
            {isTimerRunning ? <Pause className="size-3.5 fill-current" /> : <Play className="size-3.5 fill-current" />}
          </button>
        </div>

        {/* Exercise Counter Badge */}
        <span className="rounded-full bg-[var(--gym-orange,#fb5001)]/20 border border-[var(--gym-orange,#fb5001)]/40 px-3 py-1 text-[11px] font-extrabold text-[var(--gym-orange,#fb5001)]">
          {isAr ? `تمرين ${currentIdx + 1} من ${exercisesList.length}` : `Ex ${currentIdx + 1} of ${exercisesList.length}`}
        </span>
      </div>

      {/* 3. Main Stage: Video / Visual Demonstration */}
      <div className="relative flex-1 flex flex-col justify-center items-center overflow-hidden bg-black/40">
        {/* Video Player or Fallback Poster */}
        {currentExercise.videoUrl ? (
          <div className="relative w-full h-full max-h-[50vh] sm:max-h-[58vh] flex items-center justify-center bg-black">
            <iframe
              src={`${currentExercise.videoUrl}?autoplay=1&mute=1&controls=0&loop=1`}
              title={exerciseName}
              allow="autoplay; encrypted-media; picture-in-picture"
              className="w-full h-full object-cover border-0 pointer-events-none"
            />
          </div>
        ) : (
          <div className="relative w-full h-full max-h-[50vh] sm:max-h-[58vh] flex items-center justify-center bg-gradient-to-b from-[#222222] to-[#121212]">
            {currentExercise.thumbnailUrl ? (
              <img
                src={currentExercise.thumbnailUrl}
                alt={exerciseName}
                className="w-full h-full object-cover opacity-85"
              />
            ) : (
              <div className="flex flex-col items-center justify-center text-center p-6 space-y-3">
                <div className="flex size-24 items-center justify-center rounded-3xl bg-white/5 border border-white/10 shadow-2xl">
                  <Dumbbell className="size-12 text-[var(--gym-orange,#fb5001)]" />
                </div>
                <h4 className="font-heading text-[20px] font-extrabold text-white">
                  {exerciseName}
                </h4>
                <p className="max-w-xs text-[13px] text-white/70">
                  {exerciseDesc || (isAr ? "تحكم في مسار الحركة وحافظ على ثبات الجذع والتنفس" : "Controlled tempo, brace core")}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Video Action Overlay Icons (matching image 4) */}
        <div className="absolute top-4 start-4 flex items-center gap-2 z-20">
          {/* Info Button */}
          <button
            type="button"
            onClick={() => setShowInfoModal(true)}
            className="flex size-10 items-center justify-center rounded-full bg-black/60 backdrop-blur-md border border-white/20 text-white shadow-lg hover:scale-110 active:scale-95 transition"
            title={isAr ? "تعليمات التمرين" : "Instructions"}
          >
            <Info className="size-5" />
          </button>

          {/* Weight / Reps Logger Button */}
          <button
            type="button"
            onClick={() => setShowWeightModal(true)}
            className="flex size-10 items-center justify-center rounded-full bg-black/60 backdrop-blur-md border border-white/20 text-white shadow-lg hover:scale-110 active:scale-95 transition"
            title={isAr ? "تسجيل الوزن والتكرار" : "Log Weight/Reps"}
          >
            <span className="text-[12px] font-black tracking-tighter">KG</span>
          </button>

          {/* Swap Exercise Button */}
          <button
            type="button"
            onClick={() => setShowChangeModal(true)}
            className="flex size-10 items-center justify-center rounded-full bg-black/60 backdrop-blur-md border border-white/20 text-white shadow-lg hover:scale-110 active:scale-95 transition"
            title={isAr ? "تبديل التمرين" : "Substitute Exercise"}
          >
            <RefreshCw className="size-4" />
          </button>
        </div>

        {/* Sound toggle overlay */}
        <button
          type="button"
          onClick={() => setIsMuted(!isMuted)}
          className="absolute top-4 end-4 flex size-9 items-center justify-center rounded-full bg-black/60 backdrop-blur-md border border-white/20 text-white hover:scale-105 transition z-20"
        >
          {isMuted ? <VolumeX className="size-4" /> : <Volume2 className="size-4 text-[var(--gym-orange,#fb5001)]" />}
        </button>

        {/* Navigation Arrows for Previous / Next Exercise */}
        <button
          type="button"
          disabled={currentIdx === 0}
          onClick={() => {
            if (currentIdx > 0) {
              setCurrentIdx(currentIdx - 1)
              setCurrentSetIdx(0)
            }
          }}
          className={cn(
            "absolute start-3 top-1/2 -translate-y-1/2 flex size-11 items-center justify-center rounded-full bg-black/60 backdrop-blur-md border border-white/20 text-white shadow-xl transition z-20",
            currentIdx === 0 ? "opacity-25 pointer-events-none" : "hover:scale-110 active:scale-90",
          )}
        >
          {isRtl ? <ChevronRight className="size-6" /> : <ChevronLeft className="size-6" />}
        </button>

        <button
          type="button"
          disabled={currentIdx === exercisesList.length - 1}
          onClick={() => {
            if (currentIdx < exercisesList.length - 1) {
              setCurrentIdx(currentIdx + 1)
              setCurrentSetIdx(0)
            }
          }}
          className={cn(
            "absolute end-3 top-1/2 -translate-y-1/2 flex size-11 items-center justify-center rounded-full bg-black/60 backdrop-blur-md border border-white/20 text-white shadow-xl transition z-20",
            currentIdx === exercisesList.length - 1 ? "opacity-25 pointer-events-none" : "hover:scale-110 active:scale-90",
          )}
        >
          {isRtl ? <ChevronLeft className="size-6" /> : <ChevronRight className="size-6" />}
        </button>

        {/* Rest Overlay Countdown */}
        {isResting ? (
          <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-black/85 backdrop-blur-md animate-in fade-in duration-200 p-6 text-center">
            <span className="text-[14px] font-extrabold uppercase tracking-widest text-[var(--gym-orange,#fb5001)]">
              {isAr ? "وقت الراحة والاسترجاع" : "Rest Period"}
            </span>
            <div className="my-4 font-mono text-[64px] sm:text-[76px] font-black tracking-tight text-white animate-pulse">
              {formatTime(restCountdown)}
            </div>

            <p className="text-[13px] text-white/70 max-w-xs mb-6">
              {isAr
                ? `التالي: المجموعة ${currentSetIdx + 1} من ${totalSets} - استعد وتنفس بعمق`
                : `Next: Set ${currentSetIdx + 1} of ${totalSets} - Breathe and hydrate`}
            </p>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setRestCountdown((prev) => prev + 15)}
                className="inline-flex h-10 items-center justify-center rounded-full bg-white/10 px-4 text-[12px] font-bold text-white hover:bg-white/20 transition"
              >
                +15 {isAr ? "ثانية" : "sec"}
              </button>
              <button
                type="button"
                onClick={() => setIsResting(false)}
                className="inline-flex h-11 items-center justify-center rounded-full bg-[var(--gym-orange,#fb5001)] px-6 text-[13px] font-black text-white shadow-lg hover:opacity-95 transition"
              >
                {isAr ? "تخطي الراحة والبدء" : "Skip Rest"}
              </button>
            </div>
          </div>
        ) : null}
      </div>

      {/* 4. Bottom Control Deck & Exercise Details */}
      <div className="bg-[#161616] border-t border-white/10 p-4 sm:p-6 space-y-4 z-20">
        {/* Exercise Title & Current Set Indicator */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="font-heading text-[19px] sm:text-[22px] font-extrabold text-white">
              {exerciseName}
            </h3>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-[12px] font-bold text-white/70">
              <span className="rounded-md bg-white/10 px-2 py-0.5">
                {isAr ? `مجموعة ${currentSetIdx + 1} من ${totalSets}` : `Set ${currentSetIdx + 1} of ${totalSets}`}
              </span>
              <span className="rounded-md bg-white/10 px-2 py-0.5">
                {isAr ? `تكرار: ${currentExercise.reps ?? "10"}` : `Reps: ${currentExercise.reps ?? "10"}`}
              </span>
              <span className="rounded-md bg-white/10 px-2 py-0.5">
                {isAr ? `راحة: ${currentExercise.restSeconds ?? 60}ث` : `Rest: ${currentExercise.restSeconds ?? 60}s`}
              </span>
              {currentExercise.equipment ? (
                <span className="rounded-md bg-[var(--gym-orange,#fb5001)]/20 text-[var(--gym-orange,#fb5001)] px-2 py-0.5">
                  {currentExercise.equipment}
                </span>
              ) : null}
            </div>
          </div>

          {/* Set Visual Check Bullets */}
          <div className="flex items-center gap-1.5 self-start sm:self-auto">
            {currentLogs.map((log, idx) => (
              <div
                key={log.setNumber || idx}
                className={cn(
                  "flex size-7 items-center justify-center rounded-full text-[11px] font-black border transition",
                  log.completed
                    ? "border-[var(--gym-orange,#fb5001)] bg-[var(--gym-orange,#fb5001)] text-white"
                    : idx === currentSetIdx
                      ? "border-[var(--gym-orange,#fb5001)] bg-[var(--gym-orange,#fb5001)]/20 text-[var(--gym-orange,#fb5001)] ring-2 ring-[var(--gym-orange,#fb5001)]/30"
                      : "border-white/20 bg-white/5 text-white/40",
                )}
              >
                {log.completed ? <Check className="size-3.5 stroke-[3]" /> : idx + 1}
              </div>
            ))}
          </div>
        </div>

        {/* Big Action Buttons Deck */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleCompleteSet}
            className="flex-1 inline-flex h-12 sm:h-13 items-center justify-center gap-2 rounded-2xl bg-[var(--gym-orange,#fb5001)] px-6 text-[15px] sm:text-[16px] font-black text-white shadow-xl hover:opacity-95 active:scale-[0.98] transition"
          >
            <Check className="size-5 stroke-[2.5]" />
            <span>
              {currentSetIdx + 1 < totalSets
                ? isAr
                  ? `أكملت المجموعة (${currentSetIdx + 1}/${totalSets})`
                  : `Complete Set (${currentSetIdx + 1}/${totalSets})`
                : currentIdx + 1 < exercisesList.length
                  ? isAr
                    ? "إكمال والتالي ➡"
                    : "Complete & Next ➡"
                  : isAr
                    ? "إنهاء التمرين وتسجيل الإنجاز 🎉"
                    : "Finish Workout 🎉"}
            </span>
          </button>
        </div>
      </div>

      {/* Exit Confirmation Dialog */}
      {showExitConfirm ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="w-full max-w-sm rounded-[24px] bg-white p-6 text-center text-[var(--gym-ink,#111111)] shadow-2xl space-y-4">
            <AlertCircle className="size-12 text-amber-500 mx-auto" />
            <h4 className="font-heading text-[18px] font-black">
              {isAr ? "هل تريد الخروج من التمرين؟" : "Leave Workout Session?"}
            </h4>
            <p className="text-[13px] text-[#6B7280]">
              {isAr
                ? "يمكنك إنهاء التمرين الآن لتسجيل ما أنجزته، أو المتابعة لإتمام كامل البرنامج."
                : "You can save what you completed so far or resume training."}
            </p>
            <div className="flex flex-col gap-2 pt-2">
              <button
                type="button"
                onClick={handleFinishWorkout}
                className="h-11 w-full rounded-full bg-[var(--gym-orange,#fb5001)] text-[13px] font-black text-white shadow-sm"
              >
                {isAr ? "إنهاء وحفظ ما تم إنجازه" : "End & Save Progress"}
              </button>
              <button
                type="button"
                onClick={() => setShowExitConfirm(false)}
                className="h-11 w-full rounded-full bg-gray-100 text-[13px] font-bold text-gray-700 hover:bg-gray-200"
              >
                {isAr ? "متابعة التمرين" : "Resume Workout"}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="text-[12px] font-bold text-red-600 hover:underline pt-1"
              >
                {isAr ? "إلغاء التمرين دون حفظ" : "Discard without saving"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {/* Info / Instructions Modal */}
      {showInfoModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="w-full max-w-md rounded-[24px] bg-white p-6 text-[var(--gym-ink,#111111)] shadow-2xl space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-3">
              <h4 className="font-heading text-[17px] font-extrabold">
                {exerciseName}
              </h4>
              <button
                type="button"
                onClick={() => setShowInfoModal(false)}
                className="flex size-7 items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200"
              >
                <X className="size-4" />
              </button>
            </div>
            {exerciseDesc ? (
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500">
                  {isAr ? "طريقة الأداء والتكنيك:" : "Form & Instructions:"}
                </span>
                <p className="mt-1 text-[13px] text-gray-700 leading-relaxed">
                  {exerciseDesc}
                </p>
              </div>
            ) : null}
            {exerciseNotes ? (
              <div className="rounded-xl bg-amber-50 p-3 border border-amber-200 text-[12px] text-amber-900 font-medium">
                💡 {exerciseNotes}
              </div>
            ) : null}
            <button
              type="button"
              onClick={() => setShowInfoModal(false)}
              className="w-full h-10 rounded-full bg-[var(--gym-ink,#111111)] text-white text-[13px] font-bold mt-2"
            >
              {isAr ? "فهمت، عودة للتمرين" : "Got it"}
            </button>
          </div>
        </div>
      ) : null}

      {/* Performance / Weight Logger Modal */}
      {showWeightModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="w-full max-w-sm rounded-[24px] bg-white p-6 text-[var(--gym-ink,#111111)] shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h4 className="font-heading text-[17px] font-extrabold">
                {isAr ? "تسجيل أداء المجموعة" : "Log Set Performance"}
              </h4>
              <button
                type="button"
                onClick={() => setShowWeightModal(false)}
                className="flex size-7 items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200"
              >
                <X className="size-4" />
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-[12px] font-bold text-gray-600 block mb-1">
                  {isAr ? "الوزن المستخدم (كجم):" : "Weight used (kg):"}
                </label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setCurrentWeight(Math.max(0, currentWeight - 2.5))}
                    className="flex size-10 items-center justify-center rounded-xl bg-gray-100 font-bold text-gray-700 hover:bg-gray-200"
                  >
                    -2.5
                  </button>
                  <input
                    type="number"
                    step="0.5"
                    value={currentWeight || ""}
                    onChange={(e) => setCurrentWeight(parseFloat(e.target.value) || 0)}
                    placeholder="0"
                    className="flex-1 text-center font-mono text-[20px] font-black h-10 rounded-xl border border-gray-300 focus:border-[var(--gym-orange,#fb5001)] focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setCurrentWeight(currentWeight + 2.5)}
                    className="flex size-10 items-center justify-center rounded-xl bg-gray-100 font-bold text-gray-700 hover:bg-gray-200"
                  >
                    +2.5
                  </button>
                </div>
              </div>

              <div>
                <label className="text-[12px] font-bold text-gray-600 block mb-1">
                  {isAr ? "التكرارات المنجزة:" : "Reps completed:"}
                </label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setCurrentReps(Math.max(1, currentReps - 1))}
                    className="flex size-10 items-center justify-center rounded-xl bg-gray-100 font-bold text-gray-700 hover:bg-gray-200"
                  >
                    -1
                  </button>
                  <input
                    type="number"
                    value={currentReps || ""}
                    onChange={(e) => setCurrentReps(parseInt(e.target.value, 10) || 0)}
                    placeholder="10"
                    className="flex-1 text-center font-mono text-[20px] font-black h-10 rounded-xl border border-gray-300 focus:border-[var(--gym-orange,#fb5001)] focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setCurrentReps(currentReps + 1)}
                    className="flex size-10 items-center justify-center rounded-xl bg-gray-100 font-bold text-gray-700 hover:bg-gray-200"
                  >
                    +1
                  </button>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowWeightModal(false)}
              className="w-full h-11 rounded-full bg-[var(--gym-orange,#fb5001)] text-white text-[13px] font-black shadow-sm"
            >
              {isAr ? "حفظ للمجموعة الحالية" : "Save For Current Set"}
            </button>
          </div>
        </div>
      ) : null}

      {/* In-Session Swap Exercise Modal */}
      <ExerciseChangeModal
        isOpen={showChangeModal}
        onClose={() => setShowChangeModal(false)}
        exercise={currentExercise}
        onSwapExercise={handleSwapFromModal}
      />
    </div>
  )
}
