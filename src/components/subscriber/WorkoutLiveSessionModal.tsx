import { useEffect, useMemo, useRef, useState } from "react"
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
import { toEmbedUrl, withEmbedPlaybackParams } from "@/lib/media/embed-url"
import { resolveBilingualText } from "@/lib/program-text"
import { cn } from "@/lib/utils"
import type {
  CompletedExerciseRecord,
  ExerciseAlternative,
  WorkoutDay,
  WorkoutExercise,
} from "@/types/program"
import { ExerciseChangeModal } from "./ExerciseChangeModal"

export type ExerciseMediaResolve = {
  playbackUrl?: string
  posterUrl?: string
}

interface WorkoutLiveSessionModalProps {
  isOpen: boolean
  onClose: () => void
  day: WorkoutDay
  programTitle?: string
  programId?: string
  /** Resolve entitled stream / embed URL for an exercise (content library + videoUrl). */
  resolveExerciseVideoUrl?: (exercise: WorkoutExercise) => string | undefined
  /** Prefer this — returns playback + poster from library entitlement. */
  resolveExerciseMedia?: (exercise: WorkoutExercise) => ExerciseMediaResolve
  /** Persist coach-review substitute request to admin inbox. */
  onRequestExerciseChange?: (
    exercise: WorkoutExercise,
    reason: string,
    notes: string,
  ) => void | Promise<void>
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

function parseDefaultReps(reps: string | number | undefined): number {
  const raw = String(reps ?? "10")
  const match = raw.match(/\d+/)
  return match ? parseInt(match[0], 10) || 10 : 10
}

function formatTime(secs: number) {
  const safe = Math.max(0, Math.floor(secs))
  const m = Math.floor(safe / 60)
  const s = safe % 60
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
}

export function WorkoutLiveSessionModal({
  isOpen,
  onClose,
  day,
  programTitle: _programTitle,
  programId: _programId,
  resolveExerciseVideoUrl,
  resolveExerciseMedia,
  onRequestExerciseChange,
  onCompleteWorkout,
}: WorkoutLiveSessionModalProps) {
  const { locale, isRtl } = useLocale()
  const isAr = locale === "ar"

  const [exercisesList, setExercisesList] = useState<WorkoutExercise[]>(day.exercises)
  /** exerciseId → original assigned name before in-session swap */
  const [substitutions, setSubstitutions] = useState<
    Record<string, { originalName: string; substituteName: string }>
  >({})
  const [currentIdx, setCurrentIdx] = useState(0)
  const currentExercise = exercisesList[currentIdx] ?? exercisesList[0]

  const currentMedia = useMemo(() => {
    if (!currentExercise) return { playbackUrl: undefined, posterUrl: undefined }
    if (resolveExerciseMedia) return resolveExerciseMedia(currentExercise)
    const playbackUrl =
      resolveExerciseVideoUrl?.(currentExercise) ||
      currentExercise.videoUrl ||
      undefined
    return {
      playbackUrl,
      posterUrl: currentExercise.thumbnailUrl,
    }
  }, [currentExercise, resolveExerciseMedia, resolveExerciseVideoUrl])

  // Mute must remount embeds — derive URL from mute state
  const [isMuted, setIsMuted] = useState(true)

  const embedSrc = useMemo(() => {
    if (!currentMedia.playbackUrl) return null
    const parsed = toEmbedUrl(currentMedia.playbackUrl)
    if (parsed.type === "iframe") {
      return {
        type: "iframe" as const,
        url: withEmbedPlaybackParams(parsed.url, { muted: isMuted }),
        key: `${parsed.url}|mute=${isMuted ? 1 : 0}`,
      }
    }
    return {
      type: "video" as const,
      url: parsed.url,
      key: parsed.url,
    }
  }, [currentMedia.playbackUrl, isMuted])

  // Overall workout elapsed (wall-clock)
  const [totalSeconds, setTotalSeconds] = useState(0)
  const [activeSeconds, setActiveSeconds] = useState(0)
  const [restSecondsTotal, setRestSecondsTotal] = useState(0)
  const [isTimerRunning, setIsTimerRunning] = useState(true)

  const [isResting, setIsResting] = useState(false)
  const [restCountdown, setRestCountdown] = useState(60)

  const runningSinceRef = useRef<number | null>(null)
  const frozenTotalRef = useRef(0)
  const frozenActiveRef = useRef(0)
  const frozenRestTotalRef = useRef(0)
  const restDeadlineRef = useRef<number | null>(null)
  const restFrozenRemainingRef = useRef(0)
  const isRestingRef = useRef(false)
  const lastRestTickToneRef = useRef<number>(-1)

  const [exerciseLogs, setExerciseLogs] = useState<Record<string, SetLog[]>>({})
  const [currentSetIdx, setCurrentSetIdx] = useState(0)
  const [currentWeight, setCurrentWeight] = useState(0)
  const [currentReps, setCurrentReps] = useState(10)

  const [showExitConfirm, setShowExitConfirm] = useState(false)
  const [showInfoModal, setShowInfoModal] = useState(false)
  const [showWeightModal, setShowWeightModal] = useState(false)
  const [showChangeModal, setShowChangeModal] = useState(false)

  const audioContextRef = useRef<AudioContext | null>(null)
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const sessionInitKeyRef = useRef<string | null>(null)

  function playTone(freq = 880, duration = 0.15) {
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext })
            .webkitAudioContext)()
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

  function freezeRunningSegment() {
    if (runningSinceRef.current == null) return
    const elapsed = Math.floor((Date.now() - runningSinceRef.current) / 1000)
    frozenTotalRef.current += elapsed
    if (isRestingRef.current) {
      frozenRestTotalRef.current += elapsed
    } else {
      frozenActiveRef.current += elapsed
    }
    runningSinceRef.current = null
  }

  function startRunningSegment() {
    runningSinceRef.current = Date.now()
  }

  function syncPrefillForSet(exercise: WorkoutExercise | undefined, setIdx: number, logs: Record<string, SetLog[]>) {
    if (!exercise) return
    const defaultReps = parseDefaultReps(exercise.reps)
    const setLog = logs[exercise.id]?.[setIdx]
    const priorCompleted = (logs[exercise.id] ?? [])
      .slice(0, setIdx)
      .filter((s) => s.completed)
      .at(-1)

    setCurrentReps(
      setLog?.reps != null && Number(setLog.reps) > 0
        ? Number(setLog.reps)
        : defaultReps,
    )
    setCurrentWeight(
      setLog?.weightKg && setLog.weightKg > 0
        ? setLog.weightKg
        : priorCompleted?.weightKg && priorCompleted.weightKg > 0
          ? priorCompleted.weightKg
          : 0,
    )
  }

  function goToExercise(nextIdx: number) {
    if (nextIdx < 0 || nextIdx >= exercisesList.length) return
    setIsResting(false)
    isRestingRef.current = false
    restDeadlineRef.current = null
    setCurrentIdx(nextIdx)
    setCurrentSetIdx(0)
    syncPrefillForSet(exercisesList[nextIdx], 0, exerciseLogs)
  }

  // Init session once per open+day (do not reset on exercise swap)
  useEffect(() => {
    if (!isOpen) {
      sessionInitKeyRef.current = null
      return
    }
    const key = `${day.id}:${day.exercises.map((e) => e.id).join(",")}`
    if (sessionInitKeyRef.current === key) return
    sessionInitKeyRef.current = key

    const list = day.exercises
    setExercisesList(list)

    const initial: Record<string, SetLog[]> = {}
    list.forEach((ex) => {
      const setsCount = ex.sets ?? 3
      const defaultReps = parseDefaultReps(ex.reps)
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
    setIsResting(false)
    isRestingRef.current = false
    setRestCountdown(60)
    setIsTimerRunning(true)
    setIsMuted(true)
    setShowExitConfirm(false)
    setShowInfoModal(false)
    setShowWeightModal(false)
    setShowChangeModal(false)
    setSubstitutions({})

    frozenTotalRef.current = 0
    frozenActiveRef.current = 0
    frozenRestTotalRef.current = 0
    restDeadlineRef.current = null
    restFrozenRemainingRef.current = 0
    lastRestTickToneRef.current = -1
    runningSinceRef.current = Date.now()

    syncPrefillForSet(list[0], 0, initial)
  }, [isOpen, day])

  // Keep resting ref in sync
  useEffect(() => {
    isRestingRef.current = isResting
  }, [isResting])

  // Wall-clock tick (session + rest countdown)
  useEffect(() => {
    if (!isOpen || !isTimerRunning) return

    if (runningSinceRef.current == null) {
      startRunningSegment()
      if (isRestingRef.current && restFrozenRemainingRef.current > 0) {
        restDeadlineRef.current = Date.now() + restFrozenRemainingRef.current * 1000
        restFrozenRemainingRef.current = 0
      }
    }

    const interval = window.setInterval(() => {
      const now = Date.now()
      const since = runningSinceRef.current
      if (since == null) return

      const segmentElapsed = Math.floor((now - since) / 1000)
      setTotalSeconds(frozenTotalRef.current + segmentElapsed)

      if (isRestingRef.current) {
        setRestSecondsTotal(frozenRestTotalRef.current + segmentElapsed)
        if (restDeadlineRef.current != null) {
          const remainingMs = restDeadlineRef.current - now
          const remaining = Math.max(0, Math.ceil(remainingMs / 1000))
          setRestCountdown(remaining)

          if (remaining > 0 && remaining <= 3 && lastRestTickToneRef.current !== remaining) {
            lastRestTickToneRef.current = remaining
            playTone(650, 0.08)
          }

          if (remaining <= 0) {
            freezeRunningSegment()
            isRestingRef.current = false
            setIsResting(false)
            restDeadlineRef.current = null
            lastRestTickToneRef.current = -1
            playTone(1050, 0.3)
            startRunningSegment()
          }
        }
      } else {
        setActiveSeconds(frozenActiveRef.current + segmentElapsed)
      }
    }, 250)

    return () => window.clearInterval(interval)
  }, [isOpen, isTimerRunning])

  // Pause / resume: freeze wall-clock bases
  useEffect(() => {
    if (!isOpen) return
    if (!isTimerRunning) {
      if (runningSinceRef.current != null) {
        freezeRunningSegment()
        setTotalSeconds(frozenTotalRef.current)
        setActiveSeconds(frozenActiveRef.current)
        setRestSecondsTotal(frozenRestTotalRef.current)
      }
      if (isRestingRef.current && restDeadlineRef.current != null) {
        restFrozenRemainingRef.current = Math.max(
          0,
          Math.ceil((restDeadlineRef.current - Date.now()) / 1000),
        )
        setRestCountdown(restFrozenRemainingRef.current)
        restDeadlineRef.current = null
      }
    }
  }, [isTimerRunning, isOpen])

  // Keep native video mute in sync
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.muted = isMuted
    }
  }, [isMuted])

  const currentLogs = useMemo(() => {
    if (!currentExercise) return []
    return exerciseLogs[currentExercise.id] ?? []
  }, [currentExercise, exerciseLogs])

  const totalSets = currentLogs.length || (currentExercise?.sets ?? 3)

  function startRest(seconds: number) {
    freezeRunningSegment()
    const restTime = Math.max(1, seconds)
    setRestCountdown(restTime)
    restFrozenRemainingRef.current = 0
    restDeadlineRef.current = Date.now() + restTime * 1000
    lastRestTickToneRef.current = -1
    isRestingRef.current = true
    setIsResting(true)
    if (isTimerRunning) {
      startRunningSegment()
    }
  }

  function skipRest() {
    freezeRunningSegment()
    isRestingRef.current = false
    setIsResting(false)
    restDeadlineRef.current = null
    restFrozenRemainingRef.current = 0
    lastRestTickToneRef.current = -1
    if (isTimerRunning) {
      startRunningSegment()
    }
  }

  function addRestSeconds(extra: number) {
    setRestCountdown((prev) => {
      const next = prev + extra
      if (restDeadlineRef.current != null) {
        restDeadlineRef.current += extra * 1000
      } else {
        restFrozenRemainingRef.current = next
      }
      return next
    })
  }

  function handleCompleteSet() {
    if (!currentExercise) return

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

    const restTime = currentExercise.restSeconds ?? 60

    if (currentSetIdx + 1 < totalSets) {
      const nextSet = currentSetIdx + 1
      setCurrentSetIdx(nextSet)
      const nextLogs = {
        ...exerciseLogs,
        [currentExercise.id]: updated,
      }
      syncPrefillForSet(currentExercise, nextSet, nextLogs)
      startRest(restTime)
    } else if (currentIdx + 1 < exercisesList.length) {
      const nextIdx = currentIdx + 1
      setCurrentIdx(nextIdx)
      setCurrentSetIdx(0)
      const nextLogs = {
        ...exerciseLogs,
        [currentExercise.id]: updated,
      }
      syncPrefillForSet(exercisesList[nextIdx], 0, nextLogs)
      startRest(restTime)
    } else {
      handleFinishWorkout({
        ...exerciseLogs,
        [currentExercise.id]: updated,
      })
    }
  }

  function handleFinishWorkout(logsOverride?: Record<string, SetLog[]>) {
    freezeRunningSegment()
    setIsTimerRunning(false)
    setIsResting(false)
    isRestingRef.current = false

    const finalTotal = frozenTotalRef.current
    const finalActive = frozenActiveRef.current
    const finalRest = frozenRestTotalRef.current
    const logsMap = logsOverride ?? exerciseLogs

    let totalVolume = 0
    const records: CompletedExerciseRecord[] = exercisesList.map((ex) => {
      const logs = logsMap[ex.id] || []
      const completed = logs.filter((s) => s.completed)
      const completedSets = completed.length
      let exerciseVolume = 0
      let weightSum = 0
      completed.forEach((s) => {
        const reps = Number(s.reps) || 0
        exerciseVolume += s.weightKg * reps
        weightSum += s.weightKg
      })
      totalVolume += exerciseVolume
      const avgWeight =
        completedSets > 0 ? Math.round((weightSum / completedSets) * 10) / 10 : 0

      const sub = substitutions[ex.id]
      return {
        exerciseId: ex.id,
        name: resolveBilingualText(ex.name, locale),
        targetSets: ex.sets ?? 3,
        completedSets: completedSets || 0,
        weightKg: avgWeight,
        repsDone: ex.reps ?? "10",
        durationSeconds: Math.round(finalActive / Math.max(1, exercisesList.length)),
        restSeconds: ex.restSeconds ?? 60,
        wasSubstituted: Boolean(sub) || undefined,
        substituteName: sub?.originalName,
      }
    })

    onCompleteWorkout({
      durationMinutes: Math.max(1, Math.round(finalTotal / 60)),
      activeMinutes: Math.max(0, Math.round(finalActive / 60)) || (finalTotal > 0 ? 1 : 0),
      restMinutes: Math.round(finalRest / 60),
      totalVolumeKg: totalVolume,
      exercisesCompleted: records,
    })
  }

  function handleSwapFromModal(substitute: ExerciseAlternative, _reason: string) {
    const current = exercisesList[currentIdx]
    if (!current) return
    const originalName =
      substitutions[current.id]?.originalName ||
      resolveBilingualText(current.name, locale)
    const substituteName = resolveBilingualText(substitute.name, locale)
    setSubstitutions((map) => ({
      ...map,
      [current.id]: { originalName, substituteName },
    }))
    setExercisesList((prev) => {
      const updated = [...prev]
      const ex = updated[currentIdx]
      if (!ex) return prev
      updated[currentIdx] = {
        ...ex,
        name: substitute.name,
        equipment: substitute.equipment || ex.equipment,
        notes: substitute.notes || ex.notes,
        videoContentId: substitute.videoContentId ?? ex.videoContentId,
        videoUrl: substitute.videoContentId ? undefined : ex.videoUrl,
      }
      return updated
    })
  }

  async function handleRequestChangeFromModal(reason: string, notes: string) {
    if (!currentExercise || !onRequestExerciseChange) return
    await onRequestExerciseChange(currentExercise, reason, notes)
    setShowChangeModal(false)
  }

  if (!isOpen || !currentExercise) return null

  const exerciseName = resolveBilingualText(currentExercise.name, locale)
  const exerciseDesc = resolveBilingualText(currentExercise.description, locale)
  const exerciseNotes = resolveBilingualText(currentExercise.notes, locale)
  const posterUrl = currentMedia.posterUrl || currentExercise.thumbnailUrl

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex flex-col bg-[#111111] text-white overflow-hidden animate-in fade-in duration-200"
    >
      {/* Progress segments */}
      <div className="flex w-full items-center gap-1.5 px-3 pt-[max(0.75rem,env(safe-area-inset-top))] pb-1.5 z-20">
        {exercisesList.map((ex, idx) => {
          const isDone = idx < currentIdx
          const isCurrent = idx === currentIdx
          return (
            <div
              key={ex.id || idx}
              className="h-1 flex-1 rounded-full bg-white/20 overflow-hidden"
            >
              <div
                className={cn(
                  "h-full transition-all duration-300",
                  isDone || isCurrent
                    ? "w-full bg-[var(--gym-orange,#fb5001)]"
                    : "w-0",
                )}
              />
            </div>
          )
        })}
      </div>

      {/* Header */}
      <div className="flex items-center justify-between gap-2 px-3 sm:px-4 py-1.5 sm:py-2 border-b border-white/10 z-20">
        <button
          type="button"
          onClick={() => setShowExitConfirm(true)}
          className="flex size-10 shrink-0 items-center justify-center rounded-full bg-white/10 text-white/80 hover:bg-white/20 hover:text-white transition"
          title={isAr ? "إغلاق التمرين" : "Exit workout"}
        >
          <X className="size-5" />
        </button>

        <div className="flex items-center gap-2 min-w-0">
          <div
            className={cn(
              "flex items-center gap-1.5 rounded-full px-2.5 py-1 transition",
              isTimerRunning ? "bg-white/10" : "bg-amber-500/20 border border-amber-400/40",
            )}
          >
            <Clock
              className={cn(
                "size-3.5 shrink-0",
                isTimerRunning
                  ? "text-[var(--gym-orange,#fb5001)]"
                  : "text-amber-300",
              )}
            />
            <div className="flex flex-col leading-none">
              <span
                className={cn(
                  "text-[9px] font-bold uppercase tracking-wider",
                  isTimerRunning ? "text-white/50" : "text-amber-200/90",
                )}
              >
                {isTimerRunning
                  ? isAr
                    ? "الجلسة"
                    : "Session"
                  : isAr
                    ? "متوقف"
                    : "Paused"}
              </span>
              <span
                className={cn(
                  "font-mono text-[13px] tracking-wide font-extrabold tabular-nums",
                  isTimerRunning ? "text-white" : "text-amber-100",
                )}
              >
                {formatTime(totalSeconds)}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsTimerRunning((v) => !v)}
            className={cn(
              "flex size-9 shrink-0 items-center justify-center rounded-full transition",
              isTimerRunning
                ? "bg-white/10 text-white hover:bg-white/20"
                : "bg-amber-500/30 text-amber-100 hover:bg-amber-500/40",
            )}
            title={
              isTimerRunning
                ? isAr
                  ? "إيقاف مؤقت"
                  : "Pause"
                : isAr
                  ? "استئناف"
                  : "Resume"
            }
          >
            {isTimerRunning ? (
              <Pause className="size-3.5 fill-current" />
            ) : (
              <Play className="size-3.5 fill-current" />
            )}
          </button>
        </div>

        <span className="shrink-0 rounded-full bg-[var(--gym-orange,#fb5001)]/20 border border-[var(--gym-orange,#fb5001)]/40 px-2.5 py-1 text-[10px] sm:text-[11px] font-extrabold text-[var(--gym-orange,#fb5001)]">
          {isAr
            ? `${currentIdx + 1}/${exercisesList.length}`
            : `Ex ${currentIdx + 1}/${exercisesList.length}`}
        </span>
      </div>

      {/* Media stage */}
      <div className="relative flex-1 min-h-0 flex flex-col justify-center items-center overflow-hidden bg-black">
        {embedSrc ? (
          <div className="relative w-full h-full flex items-center justify-center bg-black">
            {embedSrc.type === "iframe" ? (
              <iframe
                key={embedSrc.key}
                src={embedSrc.url}
                title={exerciseName}
                allow="autoplay; encrypted-media; picture-in-picture; accelerometer; gyroscope"
                allowFullScreen
                className="absolute inset-0 w-full h-full border-0"
              />
            ) : (
              <video
                key={embedSrc.key}
                ref={videoRef}
                src={embedSrc.url}
                poster={posterUrl}
                autoPlay
                loop
                playsInline
                muted={isMuted}
                controls={!isMuted}
                controlsList="nodownload noremoteplayback"
                disablePictureInPicture
                onContextMenu={(e) => e.preventDefault()}
                className="max-h-full max-w-full w-full h-full object-contain bg-black"
              />
            )}
          </div>
        ) : (
          <div className="relative w-full h-full flex items-center justify-center bg-gradient-to-b from-[#1a1a1a] to-[#0d0d0d]">
            {posterUrl ? (
              <img
                src={posterUrl}
                alt={exerciseName}
                className="max-h-full max-w-full object-contain opacity-90"
              />
            ) : (
              <div className="flex flex-col items-center justify-center text-center p-6 space-y-3">
                <div className="flex size-20 sm:size-24 items-center justify-center rounded-3xl bg-white/5 border border-white/10">
                  <Dumbbell className="size-10 sm:size-12 text-[var(--gym-orange,#fb5001)]" />
                </div>
                <h4 className="font-heading text-[18px] sm:text-[20px] font-extrabold text-white px-4">
                  {exerciseName}
                </h4>
                <p className="max-w-xs text-[12px] sm:text-[13px] text-white/65 leading-relaxed">
                  {exerciseDesc ||
                    (isAr
                      ? "تحكم في مسار الحركة وحافظ على ثبات الجذع والتنفس"
                      : "Controlled tempo, brace core")}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Tool overlays — hide under rest */}
        {!isResting ? (
          <>
            <div className="absolute top-3 start-3 flex items-center gap-2 z-20">
              <button
                type="button"
                onClick={() => setShowInfoModal(true)}
                className="flex size-10 items-center justify-center rounded-full bg-black/65 backdrop-blur-md border border-white/20 text-white shadow-lg active:scale-95 transition"
                title={isAr ? "تعليمات التمرين" : "Instructions"}
              >
                <Info className="size-5" />
              </button>
              <button
                type="button"
                onClick={() => setShowWeightModal(true)}
                className="flex size-10 items-center justify-center rounded-full bg-black/65 backdrop-blur-md border border-white/20 text-white shadow-lg active:scale-95 transition"
                title={isAr ? "تسجيل الوزن والتكرار" : "Log Weight/Reps"}
              >
                <span className="text-[12px] font-black tracking-tighter">KG</span>
              </button>
              <button
                type="button"
                onClick={() => setShowChangeModal(true)}
                className="flex size-10 items-center justify-center rounded-full bg-black/65 backdrop-blur-md border border-white/20 text-white shadow-lg active:scale-95 transition"
                title={isAr ? "تبديل التمرين" : "Substitute Exercise"}
              >
                <RefreshCw className="size-4" />
              </button>
            </div>

            <button
              type="button"
              onClick={() => setIsMuted((m) => !m)}
              className="absolute top-3 end-3 flex size-10 items-center justify-center rounded-full bg-black/65 backdrop-blur-md border border-white/20 text-white active:scale-95 transition z-20"
              title={isMuted ? (isAr ? "تشغيل الصوت" : "Unmute") : isAr ? "كتم الصوت" : "Mute"}
            >
              {isMuted ? (
                <VolumeX className="size-4" />
              ) : (
                <Volume2 className="size-4 text-[var(--gym-orange,#fb5001)]" />
              )}
            </button>

            <button
              type="button"
              disabled={currentIdx === 0}
              onClick={() => goToExercise(currentIdx - 1)}
              className={cn(
                "absolute start-2 sm:start-3 top-1/2 -translate-y-1/2 flex size-11 items-center justify-center rounded-full bg-black/65 backdrop-blur-md border border-white/20 text-white shadow-xl transition z-20",
                currentIdx === 0
                  ? "opacity-25 pointer-events-none"
                  : "active:scale-90",
              )}
            >
              {isRtl ? (
                <ChevronRight className="size-6" />
              ) : (
                <ChevronLeft className="size-6" />
              )}
            </button>

            <button
              type="button"
              disabled={currentIdx === exercisesList.length - 1}
              onClick={() => goToExercise(currentIdx + 1)}
              className={cn(
                "absolute end-2 sm:end-3 top-1/2 -translate-y-1/2 flex size-11 items-center justify-center rounded-full bg-black/65 backdrop-blur-md border border-white/20 text-white shadow-xl transition z-20",
                currentIdx === exercisesList.length - 1
                  ? "opacity-25 pointer-events-none"
                  : "active:scale-90",
              )}
            >
              {isRtl ? (
                <ChevronLeft className="size-6" />
              ) : (
                <ChevronRight className="size-6" />
              )}
            </button>
          </>
        ) : null}

        {/* Rest overlay */}
        {isResting ? (
          <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-black/88 backdrop-blur-md animate-in fade-in duration-200 px-5 py-8 text-center">
            <span className="text-[12px] sm:text-[14px] font-extrabold uppercase tracking-[0.2em] text-[var(--gym-orange,#fb5001)]">
              {isAr ? "راحة" : "Rest"}
            </span>
            <div
              className={cn(
                "my-3 sm:my-4 font-mono text-[56px] sm:text-[76px] font-black tracking-tight tabular-nums",
                isTimerRunning ? "text-white" : "text-amber-100",
              )}
            >
              {formatTime(restCountdown)}
            </div>
            {!isTimerRunning ? (
              <p className="text-[12px] font-bold text-amber-200/90 mb-3">
                {isAr ? "الجلسة متوقفة — اضغط تشغيل للمتابعة" : "Paused — tap play to continue"}
              </p>
            ) : null}
            <p className="text-[13px] text-white/70 max-w-xs mb-6 leading-relaxed">
              {isAr
                ? `التالي: المجموعة ${currentSetIdx + 1} من ${totalSets} — تنفّس وتهيأ`
                : `Next: Set ${currentSetIdx + 1} of ${totalSets} — breathe and reset`}
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => addRestSeconds(15)}
                className="inline-flex h-11 min-w-[5.5rem] items-center justify-center rounded-full bg-white/10 px-5 text-[13px] font-bold text-white hover:bg-white/20 active:scale-95 transition"
              >
                +15 {isAr ? "ث" : "sec"}
              </button>
              <button
                type="button"
                onClick={skipRest}
                className="inline-flex h-12 min-w-[9rem] items-center justify-center rounded-full bg-[var(--gym-orange,#fb5001)] px-7 text-[14px] font-black text-white shadow-lg hover:opacity-95 active:scale-95 transition"
              >
                {isAr ? "تخطي الراحة" : "Skip Rest"}
              </button>
            </div>
          </div>
        ) : null}
      </div>

      {/* Bottom deck */}
      <div className="bg-[#161616] border-t border-white/10 px-3 sm:px-5 pt-3 sm:pt-4 pb-[max(0.875rem,env(safe-area-inset-bottom))] space-y-3 z-20 shrink-0">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <h3 className="font-heading text-[17px] sm:text-[22px] font-extrabold text-white truncate">
              {exerciseName}
            </h3>
            <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-[11px] sm:text-[12px] font-bold text-white/70">
              <span className="rounded-md bg-white/10 px-2 py-0.5">
                {isAr
                  ? `مجموعة ${currentSetIdx + 1}/${totalSets}`
                  : `Set ${currentSetIdx + 1}/${totalSets}`}
              </span>
              <span className="rounded-md bg-white/10 px-2 py-0.5">
                {isAr
                  ? `تكرار: ${currentExercise.reps ?? "10"}`
                  : `Reps: ${currentExercise.reps ?? "10"}`}
              </span>
              <span className="rounded-md bg-white/10 px-2 py-0.5">
                {isAr
                  ? `راحة: ${currentExercise.restSeconds ?? 60}ث`
                  : `Rest: ${currentExercise.restSeconds ?? 60}s`}
              </span>
              {currentExercise.equipment ? (
                <span className="rounded-md bg-[var(--gym-orange,#fb5001)]/20 text-[var(--gym-orange,#fb5001)] px-2 py-0.5">
                  {currentExercise.equipment}
                </span>
              ) : null}
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0 pt-0.5">
            {currentLogs.map((log, idx) => (
              <div
                key={log.setNumber || idx}
                className={cn(
                  "flex size-7 sm:size-8 items-center justify-center rounded-full text-[11px] font-black border transition",
                  log.completed
                    ? "border-[var(--gym-orange,#fb5001)] bg-[var(--gym-orange,#fb5001)] text-white"
                    : idx === currentSetIdx
                      ? "border-[var(--gym-orange,#fb5001)] bg-[var(--gym-orange,#fb5001)]/20 text-[var(--gym-orange,#fb5001)] ring-2 ring-[var(--gym-orange,#fb5001)]/30"
                      : "border-white/20 bg-white/5 text-white/40",
                )}
              >
                {log.completed ? (
                  <Check className="size-3.5 stroke-[3]" />
                ) : (
                  idx + 1
                )}
              </div>
            ))}
          </div>
        </div>

        <button
          type="button"
          onClick={handleCompleteSet}
          disabled={isResting}
          className="w-full inline-flex min-h-12 h-12 sm:h-13 items-center justify-center gap-2 rounded-2xl bg-[var(--gym-orange,#fb5001)] px-4 text-[14px] sm:text-[16px] font-black text-white shadow-xl hover:opacity-95 active:scale-[0.98] transition disabled:opacity-40 disabled:pointer-events-none"
        >
          <Check className="size-5 stroke-[2.5] shrink-0" />
          <span className="truncate">
            {currentSetIdx + 1 < totalSets
              ? isAr
                ? `أكمل المجموعة (${currentSetIdx + 1}/${totalSets})`
                : `Complete Set (${currentSetIdx + 1}/${totalSets})`
              : currentIdx + 1 < exercisesList.length
                ? isAr
                  ? "إكمال والتمرين التالي"
                  : "Complete & Next"
                : isAr
                  ? "إنهاء التمرين"
                  : "Finish Workout"}
          </span>
        </button>
      </div>

      {/* Exit confirm */}
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
                onClick={() => handleFinishWorkout()}
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

      {/* Info */}
      {showInfoModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="w-full max-w-md rounded-[24px] bg-white p-6 text-[var(--gym-ink,#111111)] shadow-2xl space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-3">
              <h4 className="font-heading text-[17px] font-extrabold pr-2">
                {exerciseName}
              </h4>
              <button
                type="button"
                onClick={() => setShowInfoModal(false)}
                className="flex size-8 shrink-0 items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200"
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
            ) : (
              <p className="text-[13px] text-gray-500">
                {isAr
                  ? "لا توجد تعليمات مكتوبة لهذا التمرين. ركّز على التحكم والتنفس."
                  : "No written instructions for this exercise. Focus on control and breathing."}
              </p>
            )}
            {exerciseNotes ? (
              <div className="rounded-xl bg-amber-50 p-3 border border-amber-200 text-[12px] text-amber-900 font-medium">
                {exerciseNotes}
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

      {/* Weight / reps */}
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
                className="flex size-8 items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200"
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
                    onClick={() =>
                      setCurrentWeight(Math.max(0, currentWeight - 2.5))
                    }
                    className="flex size-11 items-center justify-center rounded-xl bg-gray-100 font-bold text-gray-700 hover:bg-gray-200"
                  >
                    -2.5
                  </button>
                  <input
                    type="number"
                    step="0.5"
                    inputMode="decimal"
                    value={currentWeight || ""}
                    onChange={(e) =>
                      setCurrentWeight(parseFloat(e.target.value) || 0)
                    }
                    placeholder="0"
                    className="flex-1 text-center font-mono text-[20px] font-black h-11 rounded-xl border border-gray-300 focus:border-[var(--gym-orange,#fb5001)] focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setCurrentWeight(currentWeight + 2.5)}
                    className="flex size-11 items-center justify-center rounded-xl bg-gray-100 font-bold text-gray-700 hover:bg-gray-200"
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
                    className="flex size-11 items-center justify-center rounded-xl bg-gray-100 font-bold text-gray-700 hover:bg-gray-200"
                  >
                    -1
                  </button>
                  <input
                    type="number"
                    inputMode="numeric"
                    value={currentReps || ""}
                    onChange={(e) =>
                      setCurrentReps(parseInt(e.target.value, 10) || 0)
                    }
                    placeholder="10"
                    className="flex-1 text-center font-mono text-[20px] font-black h-11 rounded-xl border border-gray-300 focus:border-[var(--gym-orange,#fb5001)] focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setCurrentReps(currentReps + 1)}
                    className="flex size-11 items-center justify-center rounded-xl bg-gray-100 font-bold text-gray-700 hover:bg-gray-200"
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

      <ExerciseChangeModal
        isOpen={showChangeModal}
        onClose={() => setShowChangeModal(false)}
        exercise={currentExercise}
        onSwapExercise={handleSwapFromModal}
        onRequestChange={
          onRequestExerciseChange ? handleRequestChangeFromModal : undefined
        }
      />
    </div>
  )
}
