import { useEffect, useMemo, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import { Link } from "react-router-dom"
import {
  Apple,
  Camera,
  Check,
  CheckCircle2,
  Droplet,
  FileDown,
  FileText,
  Flame,
  History,
  Info,
  RefreshCw,
  Scale,
  ShieldAlert,
  Utensils,
} from "lucide-react"
import adminBanner from "@/assets/admin.webp"
import { StatCard } from "@/components/dashboard/StatCard"
import { MealChangeModal } from "@/components/subscriber/MealChangeModal"
import { MealDetailSheet } from "@/components/subscriber/MealDetailSheet"
import { MealPhotoUploadDialog } from "@/components/subscriber/MealPhotoUploadDialog"
import { MealSlotSubstituteModal } from "@/components/subscriber/MealSlotSubstituteModal"
import { useContentAssetsQuery } from "@/features/content/hooks"
import {
  useLogNutritionAdherenceMutation,
  useNutritionLogsQuery,
  useNutritionProgramsQuery,
  useRequestMealChangeMutation,
  useUpsertNutritionMealProgressMutation,
} from "@/features/nutrition/hooks"
import { uploadMealVerificationPhoto } from "@/features/nutrition/service"
import { usePanelSubscriber } from "@/features/subscribers/use-panel-subscriber"
import { useDocumentTitle } from "@/hooks/useDocumentTitle"
import { useLocale } from "@/hooks/useLocale"
import { formatDate } from "@/lib/format"
import { dayMacros, resolveBilingualText } from "@/lib/program-text"
import { appToast } from "@/lib/toast"
import { cn } from "@/lib/utils"
import type {
  MealAlternative,
  MealItem,
  MealSlot,
  NutritionDay,
} from "@/types/program"

const WEEKDAY_NAMES_EN = ["Day 1", "Day 2", "Day 3", "Day 4", "Day 5", "Day 6", "Day 7"]
const WEEKDAY_NAMES_AR = ["يوم 1", "يوم 2", "يوم 3", "يوم 4", "يوم 5", "يوم 6", "يوم 7"]

export function NutritionPlanPage() {
  const { t } = useTranslation()
  const { locale, isRtl } = useLocale()
  const isAr = locale === "ar"
  useDocumentTitle(isAr ? "النظام الغذائي" : "Nutrition Plan")

  const todayFormatted = formatDate(new Date().toISOString(), locale)

  const { subscriber: currentSubscriber, subscriberId } = usePanelSubscriber()
  const {
    data: allPrograms = [],
    isLoading: programsLoading,
    isError: programsError,
    refetch: refetchPrograms,
  } = useNutritionProgramsQuery({
    subscriberId,
    enabled: Boolean(subscriberId),
  })
  const { data: contentAssets = [] } = useContentAssetsQuery({
    audience: "subscriber",
    enabled: Boolean(subscriberId),
  })

  const activePlan = useMemo(() => {
    return allPrograms.find((p) => p.status === "active") ?? null
  }, [allPrograms])

  const entitledAssets = useMemo(
    () => contentAssets.filter((asset) => asset.accessAllowed !== false),
    [contentAssets],
  )

  const { data: logs = [], isLoading: logsLoading } = useNutritionLogsQuery({
    subscriberId,
    enabled: Boolean(subscriberId),
  })
  const logMutation = useLogNutritionAdherenceMutation()
  const mealChangeMutation = useRequestMealChangeMutation()
  const mealProgressMutation = useUpsertNutritionMealProgressMutation()

  const [selectedDayIdx, setSelectedDayIdx] = useState(0)
  const [didAutoSelectToday, setDidAutoSelectToday] = useState(false)
  const [hydratedLogKey, setHydratedLogKey] = useState<string | null>(null)
  const [logging, setLogging] = useState(false)
  const toggleLockRef = useRef<string | null>(null)
  const [detailSlot, setDetailSlot] = useState<{
    slot: MealSlot
    slotTitle: string
  } | null>(null)

  // Local UI meal tracking (synced to coach nutrition logs)
  const [completedSlots, setCompletedSlots] = useState<Record<string, boolean>>({})
  const [swappedItems, setSwappedItems] = useState<
    Record<string, { substitute: MealAlternative; reason: string }>
  >({})
  const [slotPhotos, setSlotPhotos] = useState<
    Record<string, { photoUrl: string; note?: string }>
  >({})
  const [expandedNotes, setExpandedNotes] = useState<Record<string, boolean>>({})

  useEffect(() => {
    setCompletedSlots({})
    setSwappedItems({})
    setSlotPhotos({})
    setDidAutoSelectToday(false)
    setHydratedLogKey(null)
    setSelectedDayIdx(0)
  }, [activePlan?.id])

  useEffect(() => {
    if (!activePlan?.days?.length || didAutoSelectToday) return
    const todayWeekday = (new Date().getDay() + 6) % 7
    const idx = activePlan.days.findIndex((d) => d.weekday === todayWeekday)
    if (idx >= 0) setSelectedDayIdx(idx)
    setDidAutoSelectToday(true)
  }, [activePlan, didAutoSelectToday])

  // Modal states
  const [changeModalItem, setChangeModalItem] = useState<{
    item: MealItem
    slotTitle: string
  } | null>(null)

  const [substituteSlot, setSubstituteSlot] = useState<{
    slot: MealSlot
    slotTitle: string
  } | null>(null)

  const [photoDialogSlot, setPhotoDialogSlot] = useState<{
    slotId: string
    slotTitle: string
    existingPhotoUrl?: string
  } | null>(null)

  // Selected Day resolution
  const programDays = activePlan?.days ?? []
  const rawSelectedDay: NutritionDay | undefined =
    programDays[selectedDayIdx] ?? programDays[0]

  // Construct active day with any local substituted items
  const selectedDay: NutritionDay | undefined = useMemo(() => {
    if (!rawSelectedDay) return undefined
    return {
      ...rawSelectedDay,
      meals: rawSelectedDay.meals.map((slot) => ({
        ...slot,
        completed: completedSlots[slot.id] ?? slot.completed ?? false,
        photoUrl: slotPhotos[slot.id]?.photoUrl ?? slot.photoUrl,
        items: slot.items.map((item) => {
          const swap = swappedItems[item.id]
          if (!swap) return item
          const sub = swap.substitute
          return {
            ...item,
            name: sub.name,
            quantity: sub.quantity || item.quantity,
            calories: sub.calories ?? item.calories,
            protein: sub.protein ?? item.protein,
            carbs: sub.carbs ?? item.carbs,
            fats: sub.fats ?? item.fats,
            thumbnailUrl: sub.thumbnailUrl || item.thumbnailUrl,
            notes: sub.reason || item.notes,
          }
        }),
      })),
    }
  }, [rawSelectedDay, swappedItems, completedSlots, slotPhotos])

  const dayMacroSummary = dayMacros(selectedDay)
  const todayIso = new Date().toISOString().slice(0, 10)
  const isPdfPlan = activePlan?.format === "pdf"
  const pdfAsset = useMemo(() => {
    if (!activePlan?.pdfContentId) return null
    return entitledAssets.find((a) => a.id === activePlan.pdfContentId) ?? null
  }, [activePlan?.pdfContentId, entitledAssets])

  const loggedDayIds = useMemo(() => {
    if (!activePlan) return new Set<string>()
    return new Set(
      logs
        .filter(
          (l) =>
            l.programId === activePlan.id &&
            (l.status === "adhered" || l.status === "mostly"),
        )
        .map((l) => l.dayId)
        .filter((id): id is string => Boolean(id)),
    )
  }, [logs, activePlan])

  const isTodayLogged = Boolean(
    activePlan &&
      logs.some(
        (l) =>
          l.programId === activePlan.id &&
          l.date === todayIso &&
          (!selectedDay?.id || !l.dayId || l.dayId === selectedDay.id),
      ),
  )

  const todayLog = useMemo(() => {
    if (!activePlan) return null
    return (
      logs.find(
        (l) => l.programId === activePlan.id && l.date === todayIso,
      ) ?? null
    )
  }, [logs, activePlan, todayIso])

  useEffect(() => {
    if (!activePlan || !todayLog) return
    const key = `${activePlan.id}:${todayLog.id}:${todayLog.loggedAt}`
    if (hydratedLogKey === key) return
    if (todayLog.mealChecks?.length) {
      const next: Record<string, boolean> = {}
      for (const check of todayLog.mealChecks) {
        next[check.slotId] = check.completed
      }
      setCompletedSlots((prev) => ({ ...next, ...prev }))
    }
    if (todayLog.mealPhotos?.length) {
      const next: Record<string, { photoUrl: string; note?: string }> = {}
      for (const photo of todayLog.mealPhotos) {
        next[photo.slotId] = {
          photoUrl: photo.photoUrl,
          note: photo.note,
        }
      }
      setSlotPhotos((prev) => ({ ...next, ...prev }))
    }
    setHydratedLogKey(key)
  }, [activePlan, todayLog, hydratedLogKey])

  function resolveSlotTitle(slotId: string): string {
    const slot = selectedDay?.meals.find((m) => m.id === slotId)
    if (!slot) return slotId
    return (
      (typeof slot.label === "object"
        ? resolveBilingualText(slot.label, locale)
        : slot.label) || t(`admin.nutrition.slots.${slot.slot}`)
    )
  }

  async function persistMealCheck(slotId: string, completed: boolean) {
    if (!activePlan || !currentSubscriber) return
    try {
      await mealProgressMutation.mutateAsync({
        programId: activePlan.id,
        date: todayIso,
        dayId: selectedDay?.id,
        weekday: selectedDay?.weekday,
        mealCheck: {
          slotId,
          slotTitle: resolveSlotTitle(slotId),
          completed,
        },
      })
    } catch {
      // Local UI already updated; coach sync can retry on next toggle/log
    }
  }

  // Handlers — toast outside setState (Strict Mode runs updaters twice in dev)
  function toggleSlotCompleted(slotId: string) {
    if (toggleLockRef.current === slotId) return
    toggleLockRef.current = slotId
    window.setTimeout(() => {
      if (toggleLockRef.current === slotId) toggleLockRef.current = null
    }, 350)

    const currentlyDone = Boolean(completedSlots[slotId])
    const nextDone = !currentlyDone
    setCompletedSlots((prev) => ({ ...prev, [slotId]: nextDone }))
    if (nextDone) {
      appToast.success(isAr ? "تم تسجيل تناول الوجبة!" : "Meal marked as eaten!")
    }
    void persistMealCheck(slotId, nextDone)
  }

  function handleSwapMealItem(substitute: MealAlternative, reason: string) {
    if (!changeModalItem) return
    const originalItemId = changeModalItem.item.id
    setSwappedItems((prev) => ({
      ...prev,
      [originalItemId]: { substitute, reason },
    }))
  }

  function handleRevertItem(originalItemId: string) {
    setSwappedItems((prev) => {
      const updated = { ...prev }
      delete updated[originalItemId]
      return updated
    })
    appToast.success(isAr ? "تمت استعادة الصنف الأصلي" : "Original food item restored")
  }

  async function handlePhotoUploaded(payload: {
    slotId: string
    file: File
    previewUrl: string
    note?: string
  }) {
    if (!activePlan || !currentSubscriber) {
      throw new Error(isAr ? "لا توجد خطة نشطة" : "No active plan")
    }

    setSlotPhotos((prev) => ({
      ...prev,
      [payload.slotId]: { photoUrl: payload.previewUrl, note: payload.note },
    }))

    const uploaded = await uploadMealVerificationPhoto({
      subscriberId: currentSubscriber.id,
      programId: activePlan.id,
      date: todayIso,
      slotId: payload.slotId,
      file: payload.file,
    })

    setSlotPhotos((prev) => ({
      ...prev,
      [payload.slotId]: { photoUrl: uploaded.photoUrl, note: payload.note },
    }))

    await mealProgressMutation.mutateAsync({
      programId: activePlan.id,
      date: todayIso,
      dayId: selectedDay?.id,
      weekday: selectedDay?.weekday,
      mealPhoto: {
        slotId: payload.slotId,
        slotTitle: resolveSlotTitle(payload.slotId),
        photoUrl: uploaded.photoUrl,
        storagePath: uploaded.storagePath,
        note: payload.note,
      },
      mealCheck: {
        slotId: payload.slotId,
        slotTitle: resolveSlotTitle(payload.slotId),
        completed: true,
      },
    })

    setCompletedSlots((prev) => ({ ...prev, [payload.slotId]: true }))
    appToast.success(
      isAr
        ? "تم رفع صورة الوجبة وإرسالها للمدرب بنجاح!"
        : "Meal verification photo sent to your coach!",
    )
  }

  async function handleMealSlotCoachRequest(reason: string, notes: string) {
    if (!substituteSlot || !activePlan) return
    try {
      await mealChangeMutation.mutateAsync({
        mealItemId: `meal:${substituteSlot.slot.id}`,
        mealItemName: substituteSlot.slotTitle,
        reason,
        notes: notes.trim() || undefined,
        programId: activePlan.id,
        dayId: selectedDay?.id,
        programTitle: activePlan.title[locale],
        dayLabel:
          resolveBilingualText(selectedDay?.label, locale) || undefined,
        mealSlotId: substituteSlot.slot.id,
        mealSlotTitle: substituteSlot.slotTitle,
      })
      appToast.success(
        isAr
          ? "تم إرسال طلب استبدال الوجبة إلى المدرب"
          : "Meal substitute request sent to your coach",
      )
    } catch (err) {
      appToast.error(
        err instanceof Error
          ? err.message
          : isAr
            ? "تعذر إرسال الطلب"
            : "Could not send the request",
      )
      throw err
    }
  }

  function toggleNoteExpanded(slotId: string) {
    setExpandedNotes((prev) => ({
      ...prev,
      [slotId]: !prev[slotId],
    }))
  }

  function handleDownloadPdf() {
    if (pdfAsset?.fileUrl) {
      window.open(pdfAsset.fileUrl, "_blank", "noopener,noreferrer")
      return
    }
    if (isPdfPlan) {
      appToast.error(
        isAr
          ? "ملف PDF غير متاح حالياً. تأكد من صلاحية الباقة أو تواصل مع المدرب."
          : "PDF is unavailable. Check your package access or contact your coach.",
      )
      return
    }
    window.print()
  }

  async function handleLogTodayAdherence(status: "adhered" | "mostly") {
    if (!activePlan || !currentSubscriber || !selectedDay) return
    setLogging(true)
    try {
      await logMutation.mutateAsync({
        subscriberId: currentSubscriber.id,
        programId: activePlan.id,
        date: todayIso,
        dayId: selectedDay.id,
        weekday: selectedDay.weekday,
        status,
        caloriesActual:
          dayMacroSummary?.calories || activePlan.targetCalories || undefined,
        waterLitersActual: activePlan.targetWaterLiters || undefined,
        notes:
          status === "adhered"
            ? isAr
              ? "التزام كامل بجميع الوجبات والماء والمكملات"
              : "Followed all meals, macros, and hydration fully"
            : isAr
              ? "التزام جزئي بمعظم الوجبات"
              : "Mostly followed meals",
      })
      // Mark all slots complete locally + sync meal checks for coach panel
      if (selectedDay.meals.length) {
        const next: Record<string, boolean> = {}
        for (const slot of selectedDay.meals) next[slot.id] = true
        setCompletedSlots((prev) => ({ ...prev, ...next }))
        await mealProgressMutation.mutateAsync({
          programId: activePlan.id,
          date: todayIso,
          dayId: selectedDay.id,
          weekday: selectedDay.weekday,
          mealChecks: selectedDay.meals.map((slot) => {
            const slotTitle =
              (typeof slot.label === "object"
                ? resolveBilingualText(slot.label, locale)
                : slot.label) || t(`admin.nutrition.slots.${slot.slot}`)
            return {
              slotId: slot.id,
              slotTitle,
              completed: true,
            }
          }),
        })
      }
      appToast.success(
        isAr ? "تم تسجيل الالتزام بنجاح في سجلك!" : "Today's nutrition adherence logged!",
      )
    } catch {
      appToast.error(isAr ? "فشل تسجيل الالتزام" : "Failed to log adherence")
    } finally {
      setLogging(false)
    }
  }

  const mealsCount = selectedDay?.meals.length ?? 0
  const completedCount =
    selectedDay?.meals.filter((m) => m.completed).length ?? 0
  const completionPercent =
    mealsCount > 0 ? Math.round((completedCount / mealsCount) * 100) : 0

  if (!subscriberId || programsLoading || logsLoading) {
    return (
      <div className="flex min-h-64 flex-col items-center justify-center rounded-[28px] bg-white p-8 text-center shadow-xs border border-black/[0.04]">
        <Apple className="size-10 mb-3 animate-pulse text-[#fb5001] stroke-1" />
        <p className="text-[13px] font-medium text-[#8c8c8c]">
          {isAr ? "جاري تحميل الخطة الغذائية..." : "Loading your nutrition plan..."}
        </p>
      </div>
    )
  }

  if (programsError) {
    return (
      <div className="flex min-h-64 flex-col items-center justify-center gap-3 rounded-[28px] bg-white p-8 text-center shadow-xs border border-black/[0.04]">
        <ShieldAlert className="size-10 text-rose-500 stroke-1" />
        <h2 className="font-heading text-[18px] font-extrabold text-[#111111]">
          {isAr ? "تعذر تحميل الخطة الغذائية" : "Could not load nutrition plan"}
        </h2>
        <button
          type="button"
          onClick={() => void refetchPrograms()}
          className="inline-flex items-center gap-2 rounded-full bg-[#111111] px-4 py-2 text-[12px] font-bold text-white"
        >
          <RefreshCw className="size-3.5" />
          {isAr ? "إعادة المحاولة" : "Retry"}
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4 pb-14">
      {!activePlan ? (
        <div className="flex min-h-64 flex-col items-center justify-center rounded-[28px] bg-white p-8 text-center shadow-xs border border-black/[0.04]">
          <Apple className="size-12 mb-3 text-[#fb5001] stroke-1" />
          <h2 className="font-heading text-[19px] font-black text-[#111111]">
            {isAr ? "لا توجد خطة تغذية مخصصة حالياً" : "No active nutrition plan"}
          </h2>
          <p className="mt-1 max-w-md text-[13px] text-[#8c8c8c]">
            {isAr
              ? "يقوم المدرب بتجهيز خطتك الغذائية والسعرات المناسبة لأهدافك البدنية. يمكنك مراجعة الخطط السابقة من السجل."
              : "Your coach will assign your customized nutrition plan soon. Previous plans stay in History."}
          </p>
          <Link
            to="/app/history"
            className="mt-4 inline-flex items-center gap-2 rounded-full bg-[#111111] px-4 py-2 text-[12px] font-bold text-white"
          >
            <History className="size-3.5" />
            {isAr ? "عرض السجل" : "View history"}
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {/* 1. Flagship Hero Banner (Matching Overview Banners with Background Image & Overlays) */}
          <section
            dir={isRtl ? "rtl" : "ltr"}
            aria-label={isAr ? "الخطة الغذائية" : "Nutrition Plan"}
            className="relative isolate overflow-hidden rounded-[22px] bg-[var(--gym-ink,#111111)] sm:rounded-[28px] shadow-[0_12px_36px_rgba(0,0,0,0.18)] select-none border border-white/10"
          >
            {/* Background Athlete Image */}
            <img
              src={adminBanner}
              alt=""
              className="absolute inset-0 size-full object-cover object-[68%_center] select-none sm:object-[center_42%]"
              draggable={false}
            />

            {/* Mobile Dark Overlay */}
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 sm:hidden"
              style={{
                background:
                  "linear-gradient(180deg, rgba(17,17,17,0.3) 0%, rgba(17,17,17,0.65) 40%, rgba(17,17,17,0.95) 100%)",
              }}
            />

            {/* Desktop Horizontal Dark Overlay */}
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 hidden sm:block rtl:-scale-x-100"
              style={{
                background:
                  "linear-gradient(90deg, #111111 0%, rgba(17,17,17,0.92) 38%, rgba(17,17,17,0.52) 65%, rgba(17,17,17,0.18) 100%)",
              }}
            />

            {/* Desktop Vertical Dark Tint */}
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 hidden sm:block bg-[linear-gradient(180deg,rgba(17,17,17,0.15)_0%,rgba(17,17,17,0.55)_100%)]"
            />

            {/* Content Layer */}
            <div className="relative z-10 flex flex-col justify-end gap-4 p-5 sm:min-h-[220px] sm:flex-row sm:items-end sm:justify-between sm:gap-6 sm:p-7 lg:min-h-[240px] lg:p-8">
              <div className="min-w-0 max-w-2xl">
                {/* Date & Target Calories Pill Row */}
                <div className="flex flex-wrap items-center gap-2">
                  <p
                    className={cn(
                      "text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--gym-orange,#fb5001)] sm:text-[12px]",
                      isAr ? "font-arabic" : "font-sans",
                    )}
                  >
                    {todayFormatted}
                  </p>
                  <span className="text-white/30">•</span>
                  <div className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-0.5 text-[12px] font-black text-white backdrop-blur-xs border border-white/15">
                    <span>
                      {activePlan.targetCalories != null
                        ? `kCal ${activePlan.targetCalories}`
                        : isAr
                          ? "سعرات حسب الخطة"
                          : "Plan calories"}
                    </span>
                    <Flame className="size-3.5 text-[var(--gym-orange,#fb5001)] fill-[var(--gym-orange,#fb5001)]" />
                  </div>
                  {isTodayLogged ? (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-2.5 py-0.5 text-[11px] font-bold text-white border border-white/20">
                      <CheckCircle2 className="size-3 text-[var(--gym-orange,#fb5001)]" />
                      {isAr ? "تم تسجيل اليوم" : "Today logged"}
                    </span>
                  ) : null}
                </div>

                {/* Main Title */}
                <h1
                  className={cn(
                    "mt-1.5 text-[22px] font-extrabold leading-[1.15] tracking-tight text-white sm:mt-2 sm:text-[32px] lg:text-[38px]",
                    isAr ? "font-arabic" : "font-heading",
                  )}
                >
                  {isAr ? "النظام الغذائي" : "Nutrition Plan"}
                  <span className="ms-2 text-[15px] sm:text-[20px] font-semibold text-white/75">
                    — {activePlan.title[locale]}
                  </span>
                </h1>

                {/* Subtitle / Description */}
                <p
                  className={cn(
                    "mt-1.5 max-w-lg text-[13px] font-medium leading-relaxed text-white/85 sm:mt-2 sm:text-[15px]",
                    isAr ? "font-arabic" : "font-sans",
                  )}
                >
                  {activePlan.description?.[locale] ||
                    (isAr
                      ? "خطة غذائية متكاملة ومحسوبة الماكروز لدعم أهدافك البدنية والوصول للوزن المثالي."
                      : "Targeted macronutrient meal plan designed to fuel your fitness transformation.")}
                </p>
              </div>

              {/* Action Buttons: PDF & History */}
              <div className="flex flex-wrap items-center gap-2.5 self-start rtl:self-end sm:self-auto sm:rtl:self-auto shrink-0">
                <Link
                  to="/app/nutrition-log"
                  className={cn(
                    "inline-flex h-10 sm:h-11 items-center gap-2 rounded-full bg-white/10 px-4 sm:px-5 text-[12.5px] sm:text-[13px] font-bold text-white backdrop-blur-xs hover:bg-white/20 transition-all border border-white/15 active:scale-95",
                    isAr ? "font-arabic" : "font-heading",
                  )}
                >
                  <History className="size-4 text-[var(--gym-orange,#fb5001)]" />
                  <span>{isAr ? "سجل الالتزام" : "History"}</span>
                </Link>

                <button
                  type="button"
                  onClick={handleDownloadPdf}
                  className={cn(
                    "inline-flex h-10 sm:h-11 items-center justify-center gap-1.5 rounded-full bg-[var(--gym-lime,#fb5001)] px-5 sm:px-6 text-[13px] sm:text-[14px] font-extrabold text-white shadow-[0_10px_28px_rgba(251,80,1,0.38)] hover:bg-[#e04500] hover:scale-105 active:scale-95 transition-all duration-200 border border-white/15",
                    isAr ? "font-arabic" : "font-heading",
                  )}
                >
                  <FileDown className="size-4" strokeWidth={2.5} />
                  <span>{isAr ? "تحميل PDF" : "Download PDF"}</span>
                </button>
              </div>
            </div>
          </section>

          {/* 2. Daily Targets from assigned plan (no dummy defaults) */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatCard
              label={isAr ? "السعرات اليومية" : "Daily Calories"}
              value={activePlan.targetCalories ?? "—"}
              hint={isAr ? "كيلو كالوري / يوم" : "kcal / day"}
              icon={<Flame className="size-4" strokeWidth={1.8} />}
            />
            <StatCard
              label={isAr ? "البروتين" : "Protein Target"}
              value={
                activePlan.macros?.proteinGrams != null
                  ? `${activePlan.macros.proteinGrams}g`
                  : "—"
              }
              hint={isAr ? "جرام بروتين يومياً" : "Grams per day"}
              icon={<Utensils className="size-4" strokeWidth={1.8} />}
            />
            <StatCard
              label={isAr ? "الكاربوهيدرات" : "Carbohydrates"}
              value={
                activePlan.macros?.carbsGrams != null
                  ? `${activePlan.macros.carbsGrams}g`
                  : "—"
              }
              hint={isAr ? "جرام كاربوهيدرات" : "Grams per day"}
              icon={<Apple className="size-4" strokeWidth={1.8} />}
            />
            <StatCard
              label={isAr ? "الماء المستهدف" : "Hydration"}
              value={
                activePlan.targetWaterLiters != null
                  ? `${activePlan.targetWaterLiters}L`
                  : "—"
              }
              hint={isAr ? "لتر ماء / يوم" : "Liters per day"}
              icon={<Droplet className="size-4" strokeWidth={1.8} />}
            />
          </div>

          {/* 3. Days Horizontal Strip */}
          {!isPdfPlan ? (
          <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-0.5 no-scrollbar">
            {programDays.map((d, idx) => {
              const active = idx === selectedDayIdx
              const dayDone = Boolean(d.id && loggedDayIds.has(d.id))
              const dayTitle = isAr ? WEEKDAY_NAMES_AR[idx] : WEEKDAY_NAMES_EN[idx]

              return (
                <button
                  key={d.id || idx}
                  type="button"
                  onClick={() => setSelectedDayIdx(idx)}
                  className={cn(
                    "relative flex min-w-[74px] sm:min-w-[88px] h-[78px] sm:h-[86px] shrink-0 flex-col items-center justify-center rounded-2xl p-2 text-center transition shadow-2xs border select-none",
                    active
                      ? "bg-[#fb5001] border-[#fb5001] text-white shadow-md scale-[1.02]"
                      : dayDone
                        ? "bg-[#181818] border-[#fb5001]/50 text-white/90 hover:bg-[#222222]"
                        : "bg-[#181818] border-transparent text-white/80 hover:bg-[#222222] hover:text-white",
                  )}
                >
                  {dayDone ? (
                    <CheckCircle2
                      className={cn(
                        "absolute top-1.5 end-1.5 size-3.5",
                        active ? "text-white" : "text-[#fb5001]",
                      )}
                    />
                  ) : null}
                  <span className="text-[11px] font-bold uppercase tracking-wider opacity-80">
                    {dayTitle}
                  </span>
                  <span className="font-heading text-[20px] sm:text-[22px] font-black leading-tight text-white">
                    {idx + 1}
                  </span>
                  <span
                    className={cn(
                      "mt-0.5 text-[10px] font-bold truncate max-w-full px-1",
                      active ? "text-white/95" : "text-white/60",
                    )}
                  >
                    {dayDone
                      ? isAr
                        ? "تم"
                        : "Done"
                      : `${d.meals.length} ${isAr ? "وجبات" : "meals"}`}
                  </span>
                </button>
              )
            })}
          </div>
          ) : null}

          {/* 4. Day Adherence Tracker Bar */}
          <div className="rounded-[22px] bg-white p-4 shadow-2xs border border-black/[0.04] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-xl bg-orange-50 text-[#fb5001]">
                <Utensils className="size-5" />
              </div>
              <div>
                <p className="font-heading text-[14px] font-extrabold text-[#111111]">
                  {isAr
                    ? `إنجاز وجبات اليوم: ${completedCount} من ${mealsCount} وجبات`
                    : `Today's Meals: ${completedCount} of ${mealsCount} completed`}
                </p>
                <div className="mt-1 flex items-center gap-2">
                  <div className="h-1.5 w-32 rounded-full bg-neutral-100 overflow-hidden">
                    <div
                      className="h-full bg-[#fb5001] rounded-full transition-all duration-300"
                      style={{ width: `${completionPercent}%` }}
                    />
                  </div>
                  <span className="text-[11px] font-bold text-[#8c8c8c]">
                    {completionPercent}%
                  </span>
                </div>
              </div>
            </div>

            {/* Quick status */}
            <div className="flex items-center gap-2">
              {isTodayLogged ? (
                <div className="inline-flex items-center gap-1.5 rounded-full bg-neutral-100 px-3 py-1 text-[11px] font-extrabold text-[#111111] border border-black/10">
                  <CheckCircle2 className="size-3.5 text-[#fb5001]" />
                  <span>{isAr ? "تم تسجيل التزام اليوم بالسجل" : "Adherence Logged Today"}</span>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => handleLogTodayAdherence("adhered")}
                  disabled={logging}
                  className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-[#111111] px-4 text-[12px] font-bold text-white shadow-xs hover:bg-black transition disabled:opacity-50"
                >
                  <Check className="size-3.5" strokeWidth={2.5} />
                  <span>
                    {logging
                      ? isAr
                        ? "جاري الحفظ..."
                        : "Logging..."
                      : isAr
                        ? "تسجيل الالتزام الكامل"
                        : "Log Full Adherence"}
                  </span>
                </button>
              )}
            </div>
          </div>

          {/* 5. PDF Mode Display (if format is PDF) */}
          {activePlan.format === "pdf" ? (
            <div className="flex min-h-60 flex-col items-center justify-center rounded-[28px] bg-white p-8 text-center shadow-xs border border-black/[0.04]">
              <FileText className="size-14 text-[#111111] mb-3" strokeWidth={1.5} />
              <h3 className="font-heading text-[18px] font-bold text-[#111111]">
                {activePlan.pdfName?.[locale] || "Nutrition Plan PDF"}
              </h3>
              <p className="mt-1 max-w-md text-[13px] text-[#8c8c8c]">
                {t("admin.nutrition.pdfHint")}
              </p>
              <button
                type="button"
                onClick={handleDownloadPdf}
                className="mt-4 inline-flex h-11 items-center gap-2 rounded-2xl bg-[#fb5001] px-6 text-[13px] font-bold text-white shadow-sm hover:bg-[#e04800] transition"
              >
                <FileDown className="size-4" />
                <span>{isAr ? "فتح وتحميل الملف" : "Open and Download PDF"}</span>
              </button>
            </div>
          ) : (
            /* 6. Meals Slots List */
            <div className="flex flex-col gap-4">
              {selectedDay?.meals.map((slot) => {
                const slotTitle =
                  (typeof slot.label === "object"
                    ? resolveBilingualText(slot.label, locale)
                    : slot.label) || t(`admin.nutrition.slots.${slot.slot}`)
                const slotCalories = slot.calories ?? 0
                const isCompleted = slot.completed
                const photo = slotPhotos[slot.id]?.photoUrl || slot.photoUrl
                const coachingNoteText =
                  typeof slot.coachingNote === "object"
                    ? resolveBilingualText(slot.coachingNote, locale)
                    : slot.coachingNote
                const isNoteExpanded = !!expandedNotes[slot.id]

                return (
                  <div
                    key={slot.id}
                    className={cn(
                      "rounded-[24px] sm:rounded-[28px] bg-white p-3.5 sm:p-6 shadow-xs border transition",
                      isCompleted
                        ? "border-emerald-200/80 bg-neutral-50/30"
                        : "border-black/[0.06]",
                    )}
                  >
                    {/* Meal Slot Header — tap opens detail */}
                    <div className="flex items-center justify-between gap-2 pb-3.5 border-b border-black/[0.05]">
                      <button
                        type="button"
                        onClick={() => setDetailSlot({ slot, slotTitle })}
                        className="min-w-0 flex-1 text-start rounded-xl -ms-1 px-1 py-0.5 hover:bg-black/[0.02] active:scale-[0.99] transition"
                      >
                        <div className="flex items-center gap-2">
                          <h3 className="font-heading text-[16px] sm:text-[18px] font-black text-[#111111]">
                            {slotTitle}
                          </h3>
                          {isCompleted ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-neutral-100 px-2.5 py-0.5 text-[10px] font-extrabold text-[#111111] border border-black/10">
                              <Check className="size-3 text-[#fb5001]" />
                              {isAr ? "تم" : "Eaten"}
                            </span>
                          ) : null}
                        </div>
                        <p className="mt-0.5 text-[12px] font-bold text-[#8c8c8c]">
                          {slot.items.length} {isAr ? "عناصر" : "items"}
                          {slotCalories > 0 ? (
                            <span>
                              {" "}
                              · {slotCalories} {isAr ? "سعرة" : "kcal"}
                            </span>
                          ) : null}
                          <span className="ms-1.5 text-[var(--gym-orange,#fb5001)] font-extrabold">
                            {isAr ? "· التفاصيل" : "· Details"}
                          </span>
                        </p>
                      </button>

                      <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            setSubstituteSlot({ slot, slotTitle })
                          }}
                          className="inline-flex size-10 sm:h-10 sm:w-auto sm:px-3.5 items-center justify-center gap-1.5 rounded-xl border border-black/10 bg-neutral-50 text-[12px] font-extrabold text-[#111111] hover:border-[var(--gym-orange,#fb5001)]/50 hover:text-[var(--gym-orange,#fb5001)] transition select-none"
                          title={isAr ? "استبدال الوجبة" : "Substitute meal"}
                        >
                          <RefreshCw className="size-4 shrink-0" />
                          <span className="hidden sm:inline">
                            {isAr ? "استبدال" : "Substitute"}
                          </span>
                        </button>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            setPhotoDialogSlot({
                              slotId: slot.id,
                              slotTitle,
                              existingPhotoUrl: photo,
                            })
                          }}
                          className={cn(
                            "inline-flex size-10 sm:h-10 sm:w-auto sm:px-3.5 items-center justify-center gap-1.5 rounded-xl border-2 border-dashed text-[12px] font-extrabold transition select-none",
                            photo
                              ? "border-[#fb5001]/60 bg-orange-50/40 text-[#fb5001]"
                              : "border-black/20 bg-neutral-50 text-[#111111]",
                          )}
                          title={isAr ? "إرفاق صورة الوجبة" : "Attach meal photo"}
                        >
                          <Camera className="size-4 shrink-0" />
                          <span className="hidden sm:inline">
                            {photo
                              ? isAr
                                ? "تعديل"
                                : "Edit"
                              : isAr
                                ? "صورة"
                                : "Photo"}
                          </span>
                        </button>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            toggleSlotCompleted(slot.id)
                          }}
                          className={cn(
                            "flex size-10 items-center justify-center rounded-xl transition select-none",
                            isCompleted
                              ? "bg-[var(--gym-orange,#fb5001)] text-white"
                              : "bg-neutral-100 text-[#666]",
                          )}
                          title={
                            isCompleted
                              ? isAr
                                ? "إلغاء التحديد"
                                : "Unmark meal"
                              : isAr
                                ? "تحديد كمنجزة"
                                : "Mark as eaten"
                          }
                        >
                          <Check className="size-4.5" strokeWidth={2.5} />
                        </button>
                      </div>
                    </div>

                    {/* Meal Photo Thumbnail Preview (if uploaded) */}
                    {photo ? (
                      <div className="mt-3 flex items-center justify-between rounded-xl bg-neutral-50 p-2.5 border border-black/5">
                        <div className="flex items-center gap-2.5">
                          <img
                            src={photo}
                            alt="Uploaded Meal"
                            className="size-11 rounded-lg object-cover border border-black/10"
                          />
                          <div className="text-[11px]">
                            <span className="font-extrabold text-[#111111] block">
                              {isAr ? "صورة الوجبة مرفقة للمدرب" : "Meal verification photo uploaded"}
                            </span>
                            {slotPhotos[slot.id]?.note ? (
                              <span className="text-[#8c8c8c] line-clamp-1">
                                {slotPhotos[slot.id]?.note}
                              </span>
                            ) : null}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() =>
                            setPhotoDialogSlot({
                              slotId: slot.id,
                              slotTitle,
                              existingPhotoUrl: photo,
                            })
                          }
                          className="text-[11px] font-bold text-[#fb5001] hover:underline"
                        >
                          {isAr ? "عرض / تغيير" : "View / Change"}
                        </button>
                      </div>
                    ) : null}

                    {/* Coaching Notes Callout Banner (Matches Reference Image) */}
                    {coachingNoteText ? (
                      <div className="mt-3 rounded-2xl bg-amber-50/70 p-3 sm:p-3.5 border border-amber-200/70 text-amber-950">
                        <div className="flex items-start gap-2.5">
                          <Info className="size-4 text-amber-700 shrink-0 mt-0.5" />
                          <div className="min-w-0 flex-1">
                            <span className="font-heading text-[12px] font-extrabold text-amber-900 block mb-0.5">
                              {isAr ? "ملاحظة :" : "Note:"}
                            </span>
                            <p
                              className={cn(
                                "text-[12px] leading-relaxed text-amber-900/90 transition-all",
                                !isNoteExpanded && "line-clamp-2",
                              )}
                            >
                              {coachingNoteText}
                            </p>
                            {coachingNoteText.length > 80 ? (
                              <button
                                type="button"
                                onClick={() => toggleNoteExpanded(slot.id)}
                                className="mt-1 text-[11px] font-extrabold text-amber-800 hover:text-amber-950 transition"
                              >
                                {isNoteExpanded
                                  ? isAr
                                    ? "اقرأ أقل"
                                    : "Read less"
                                  : isAr
                                    ? "اقرأ المزيد"
                                    : "Read more"}
                              </button>
                            ) : null}
                          </div>
                        </div>
                      </div>
                    ) : null}

                    {/* Food Items List (Matches Reference Image) */}
                    <div className="mt-3.5 space-y-2.5">
                      {slot.items.map((item) => {
                        const name = resolveBilingualText(item.name, locale)
                        const qty = resolveBilingualText(item.quantity, locale)
                        const notes = resolveBilingualText(item.notes, locale)
                        const altCount = item.alternatives?.length ?? 0
                        const isSwapped = !!swappedItems[item.id]

                        return (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => setDetailSlot({ slot, slotTitle })}
                            className={cn(
                              "relative flex w-full items-center justify-between gap-3 rounded-2xl p-3 sm:p-3.5 transition border text-start active:scale-[0.99]",
                              isSwapped
                                ? "bg-orange-50/20 border-[#fb5001]/30"
                                : "bg-white border-black/[0.06] hover:border-black/15 shadow-2xs",
                            )}
                          >
                            {/* Content Side (Right in RTL, Left in LTR): Name, Weight, Macros, Alternatives */}
                            <div className="min-w-0 flex-1 space-y-1">
                              <div className="flex flex-wrap items-center gap-1.5">
                                <h4 className="font-heading text-[14px] sm:text-[15px] font-black text-[#111111] leading-tight">
                                  {name}
                                </h4>
                                {isSwapped ? (
                                  <span className="rounded-full bg-[#fb5001]/10 px-2 py-0.5 text-[10px] font-black text-[#fb5001]">
                                    {isAr ? "بديل نشط" : "Substituted"}
                                  </span>
                                ) : null}
                              </div>

                              {/* Alternatives Count Badge */}
                              <div className="flex flex-wrap items-center gap-2 text-[11px] font-bold text-[#8c8c8c]">
                                {altCount > 0 ? (
                                  <span className="rounded-md bg-neutral-100 px-2 py-0.5 text-[#555]">
                                    {isAr ? `بدائل : ${altCount}` : `Alternatives: ${altCount}`}
                                  </span>
                                ) : null}

                                {qty ? (
                                  <span className="inline-flex items-center gap-1 text-[#111111]">
                                    <Scale className="size-3 text-[#8c8c8c]" />
                                    {qty}
                                  </span>
                                ) : null}

                                {item.calories ? (
                                  <span className="text-[#8c8c8c]">
                                    • {item.calories} kcal
                                  </span>
                                ) : null}
                              </div>

                              {/* Macronutrient breakdown */}
                              <div className="flex flex-wrap items-center gap-2 text-[10px] font-extrabold">
                                {item.protein ? (
                                  <span className="text-blue-700">P: {item.protein}g</span>
                                ) : null}
                                {item.carbs ? (
                                  <span className="text-amber-700">C: {item.carbs}g</span>
                                ) : null}
                                {item.fats ? (
                                  <span className="text-purple-700">F: {item.fats}g</span>
                                ) : null}
                              </div>

                              {notes ? (
                                <p className="text-[11px] text-[#8c8c8c] italic leading-tight">
                                  {notes}
                                </p>
                              ) : null}

                              {/* Revert link if swapped */}
                              {isSwapped ? (
                                <span
                                  role="button"
                                  tabIndex={0}
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleRevertItem(item.id)
                                  }}
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter" || e.key === " ") {
                                      e.stopPropagation()
                                      handleRevertItem(item.id)
                                    }
                                  }}
                                  className="text-[10px] font-bold text-[#8c8c8c] hover:text-[#fb5001] underline transition"
                                >
                                  {isAr
                                    ? "إلغاء الاستبدال واستعادة الأصلي"
                                    : "Restore original food"}
                                </span>
                              ) : null}
                            </div>

                            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                              <span
                                role="button"
                                tabIndex={0}
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setChangeModalItem({ item, slotTitle })
                                }}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter" || e.key === " ") {
                                    e.stopPropagation()
                                    setChangeModalItem({ item, slotTitle })
                                  }
                                }}
                                className={cn(
                                  "flex size-9 sm:size-10 items-center justify-center rounded-xl transition select-none active:scale-95",
                                  isSwapped
                                    ? "bg-[var(--gym-orange,#fb5001)] text-white"
                                    : "bg-black/5 text-[var(--gym-ink,#111111)]",
                                )}
                                title={
                                  altCount > 0
                                    ? isAr
                                      ? "استبدال"
                                      : "Substitute"
                                    : isAr
                                      ? "طلب تغيير"
                                      : "Request change"
                                }
                              >
                                <RefreshCw className="size-4" />
                              </span>

                              <div className="relative size-14 sm:size-20 shrink-0 overflow-hidden rounded-2xl border border-black/10 bg-neutral-100">
                                {item.thumbnailUrl ? (
                                  <img
                                    src={item.thumbnailUrl}
                                    alt={name}
                                    className="size-full object-cover"
                                    loading="lazy"
                                  />
                                ) : (
                                  <div className="flex size-full items-center justify-center text-[#fb5001]">
                                    <Utensils className="size-6 sm:size-7" />
                                  </div>
                                )}
                                {qty ? (
                                  <div className="absolute inset-x-0 bottom-0 bg-black/85 py-0.5 text-center text-[9px] sm:text-[10px] font-black text-white tracking-tight">
                                    {qty}
                                  </div>
                                ) : null}
                              </div>
                            </div>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* 7. Bottom Adherence & Logs Summary Card */}
          <div className="rounded-[28px] bg-white p-5 sm:p-6 shadow-xs border border-black/[0.04] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h3 className="font-heading text-[16px] font-black text-[#111111]">
                {isAr ? "تسجيل الالتزام بالخطة اليوم" : "Daily Plan Adherence"}
              </h3>
              <p className="mt-0.5 text-[12px] text-[#8c8c8c]">
                {isAr
                  ? "تسجيل التزامك اليومي يساعد المدرب على مراجعة استجابتك وتعديل السعرات بدقة."
                  : "Logging daily adherence enables your coach to review and adjust your macro targets."}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => handleLogTodayAdherence("mostly")}
                disabled={logging}
                className="inline-flex h-11 items-center justify-center rounded-2xl bg-neutral-100 px-4 text-[12px] font-bold text-[#555] hover:bg-neutral-200 transition disabled:opacity-50"
              >
                {isAr ? "التزام جزئي" : "Mostly Adhered"}
              </button>

              <button
                type="button"
                onClick={() => handleLogTodayAdherence("adhered")}
                disabled={logging}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-[#fb5001] px-5 text-[13px] font-black text-white shadow-md shadow-orange-500/20 hover:bg-[#e04800] transition disabled:opacity-50 active:scale-98"
              >
                <Check className="size-4" strokeWidth={2.5} />
                <span>
                  {logging
                    ? isAr
                      ? "جاري الحفظ..."
                      : "Logging..."
                    : isAr
                      ? "تسجيل التزام كامل 100%"
                      : "Log 100% Adherence"}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      <MealDetailSheet
        isOpen={Boolean(detailSlot)}
        slot={
          detailSlot
            ? (selectedDay?.meals.find((m) => m.id === detailSlot.slot.id) ??
              detailSlot.slot)
            : null
        }
        slotTitle={detailSlot?.slotTitle ?? ""}
        isCompleted={
          detailSlot
            ? Boolean(
                completedSlots[detailSlot.slot.id] ??
                  detailSlot.slot.completed,
              )
            : false
        }
        photoUrl={
          detailSlot
            ? slotPhotos[detailSlot.slot.id]?.photoUrl ||
              detailSlot.slot.photoUrl
            : undefined
        }
        photoNote={
          detailSlot ? slotPhotos[detailSlot.slot.id]?.note : undefined
        }
        swappedItemIds={new Set(Object.keys(swappedItems))}
        onClose={() => setDetailSlot(null)}
        onToggleCompleted={() => {
          if (detailSlot) toggleSlotCompleted(detailSlot.slot.id)
        }}
        onAddPhoto={() => {
          if (!detailSlot) return
          setPhotoDialogSlot({
            slotId: detailSlot.slot.id,
            slotTitle: detailSlot.slotTitle,
            existingPhotoUrl:
              slotPhotos[detailSlot.slot.id]?.photoUrl ||
              detailSlot.slot.photoUrl,
          })
        }}
        onSubstituteMeal={() => {
          if (!detailSlot) return
          const liveSlot =
            selectedDay?.meals.find((m) => m.id === detailSlot.slot.id) ??
            detailSlot.slot
          setDetailSlot(null)
          setSubstituteSlot({
            slot: liveSlot,
            slotTitle: detailSlot.slotTitle,
          })
        }}
        onSwapItem={(item) => {
          if (!detailSlot) return
          setChangeModalItem({
            item,
            slotTitle: detailSlot.slotTitle,
          })
        }}
        onRevertItem={handleRevertItem}
      />

      <MealSlotSubstituteModal
        isOpen={Boolean(substituteSlot)}
        onClose={() => setSubstituteSlot(null)}
        slot={substituteSlot?.slot ?? null}
        slotTitle={substituteSlot?.slotTitle ?? ""}
        onPickItem={(item) => {
          if (!substituteSlot) return
          setChangeModalItem({
            item,
            slotTitle: substituteSlot.slotTitle,
          })
        }}
        onRequestCoachChange={handleMealSlotCoachRequest}
      />

      <MealChangeModal
        isOpen={!!changeModalItem}
        onClose={() => setChangeModalItem(null)}
        mealItem={changeModalItem?.item ?? null}
        mealSlotTitle={changeModalItem?.slotTitle}
        onSwapItem={handleSwapMealItem}
        onRequestCoachChange={async (reason, notes) => {
          if (!changeModalItem) return
          try {
            await mealChangeMutation.mutateAsync({
              mealItemId: changeModalItem.item.id,
              mealItemName: resolveBilingualText(
                changeModalItem.item.name,
                locale,
              ),
              reason,
              notes: notes.trim() || undefined,
              programId: activePlan?.id,
              dayId: selectedDay?.id,
              programTitle: activePlan?.title[locale],
              dayLabel:
                resolveBilingualText(selectedDay?.label, locale) || undefined,
              mealSlotId:
                selectedDay?.meals.find((m) =>
                  m.items.some((i) => i.id === changeModalItem.item.id),
                )?.id,
              mealSlotTitle: changeModalItem.slotTitle,
            })
            appToast.success(
              isAr
                ? "تم إرسال طلب تغيير الوجبة إلى المدرب"
                : "Meal change request sent to your coach",
            )
          } catch (err) {
            appToast.error(
              err instanceof Error
                ? err.message
                : isAr
                  ? "تعذر إرسال الطلب"
                  : "Could not send the request",
            )
            throw err
          }
        }}
      />

      <MealPhotoUploadDialog
        isOpen={!!photoDialogSlot}
        onClose={() => setPhotoDialogSlot(null)}
        slotId={photoDialogSlot?.slotId ?? ""}
        slotTitle={photoDialogSlot?.slotTitle}
        existingPhotoUrl={photoDialogSlot?.existingPhotoUrl}
        onPhotoUploaded={handlePhotoUploaded}
      />
    </div>
  )
}
