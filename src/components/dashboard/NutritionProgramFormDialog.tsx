import { useEffect, useMemo, useState } from "react"
import { createPortal } from "react-dom"
import {
  Apple,
  Check,
  ChevronDown,
  FileText,
  Layers,
  Plus,
  ShieldAlert,
  Trash2,
  Utensils,
  X,
} from "lucide-react"
import { useContentAssetsQuery } from "@/features/content/hooks"
import {
  NUTRITION_DISCLAIMER,
  dayMacros,
} from "@/features/nutrition/demo"
import type {
  AssignNutritionInput,
  SaveNutritionProgramInput,
} from "@/features/nutrition/service"
import { useSubscribersQuery } from "@/features/subscribers/hooks"
import { currentSubscriptionFor } from "@/features/subscriptions/demo"
import { useSubscriptionsQuery } from "@/features/subscriptions/hooks"
import { useLocale } from "@/hooks/useLocale"
import { cn } from "@/lib/utils"
import type {
  BilingualText,
  MealItem,
  MealSlot,
  MealSlotKey,
  NutritionDay,
  NutritionProgram,
  ProgramFormat,
} from "@/types/program"

export type NutritionDialogMode =
  | { type: "create-template" }
  | { type: "edit-template"; program: NutritionProgram }
  | { type: "assign"; subscriberId?: string; templateId?: string }
  | { type: "edit-assignment"; program: NutritionProgram }

type NutritionProgramFormDialogProps = {
  open: boolean
  mode: NutritionDialogMode | null
  templates: NutritionProgram[]
  onClose: () => void
  onSaveProgram: (input: SaveNutritionProgramInput) => Promise<unknown>
  onAssignProgram: (input: AssignNutritionInput) => Promise<unknown>
}

const WEEKDAY_NAMES_EN = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
const WEEKDAY_NAMES_AR = ["الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت", "الأحد"]

const MEAL_SLOT_LABELS: Record<MealSlotKey, { en: string; ar: string }> = {
  breakfast: { en: "Breakfast", ar: "وجبة الإفطار" },
  lunch: { en: "Lunch", ar: "وجبة الغداء" },
  snack: { en: "Snack", ar: "وجبة خفيفة (سناك)" },
  dinner: { en: "Dinner", ar: "وجبة العشاء" },
  pre_workout: { en: "Pre-workout", ar: "قبل التمرين" },
  post_workout: { en: "Post-workout", ar: "بعد التمرين" },
}

function emptyNutritionWeek(): NutritionDay[] {
  return Array.from({ length: 7 }, (_, weekday) => ({
    id: `nday-${weekday}-${Date.now().toString(36)}`,
    weekday,
    meals: [
      {
        id: `slot-bf-${weekday}`,
        slot: "breakfast",
        items: [],
      },
      {
        id: `slot-ln-${weekday}`,
        slot: "lunch",
        items: [],
      },
      {
        id: `slot-dn-${weekday}`,
        slot: "dinner",
        items: [],
      },
    ],
  }))
}

export function NutritionProgramFormDialog({
  open,
  mode,
  templates,
  onClose,
  onSaveProgram,
  onAssignProgram,
}: NutritionProgramFormDialogProps) {
  const { locale } = useLocale()
  const isAr = locale === "ar"

  const { data: subscribers = [] } = useSubscribersQuery()
  const { data: subscriptions = [] } = useSubscriptionsQuery()
  const { data: contentAssets = [] } = useContentAssetsQuery()

  const pdfAssets = contentAssets.filter(
    (asset) => asset.category === "nutritionPdf" || asset.kind === "pdf",
  )

  const [activeLangTab, setActiveLangTab] = useState<"ar" | "en">(
    locale === "ar" ? "ar" : "en",
  )
  const [selectedWeekday, setSelectedWeekday] = useState(0)
  const [busy, setBusy] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  // Form State
  const [titleEn, setTitleEn] = useState("")
  const [titleAr, setTitleAr] = useState("")
  const [descEn, setDescEn] = useState("")
  const [descAr, setDescAr] = useState("")
  const [notesEn, setNotesEn] = useState("")
  const [notesAr, setNotesAr] = useState("")
  const [targetCalories, setTargetCalories] = useState<number>(2000)
  const [targetWaterLiters, setTargetWaterLiters] = useState<number>(3.0)
  const [proteinGrams, setProteinGrams] = useState<number>(150)
  const [carbsGrams, setCarbsGrams] = useState<number>(200)
  const [fatsGrams, setFatsGrams] = useState<number>(65)
  const [format, setFormat] = useState<ProgramFormat>("interactive")
  const [selectedSubscriberId, setSelectedSubscriberId] = useState("")
  const [selectedTemplateId, setSelectedTemplateId] = useState("")
  const [createNewVersion, setCreateNewVersion] = useState(true)
  const disclaimerAck = true
  const [pdfContentId, setPdfContentId] = useState("")
  const [pdfNameEn, setPdfNameEn] = useState("")
  const [pdfNameAr, setPdfNameAr] = useState("")
  const [days, setDays] = useState<NutritionDay[]>(emptyNutritionWeek())

  useEffect(() => {
    if (!open || !mode) return
    setErrorMsg(null)

    if (mode.type === "create-template") {
      setTitleEn("New Nutrition Template")
      setTitleAr("قالب تغذية جديد")
      setDescEn("")
      setDescAr("")
      setNotesEn("")
      setNotesAr("")
      setTargetCalories(2000)
      setTargetWaterLiters(3.0)
      setProteinGrams(150)
      setCarbsGrams(200)
      setFatsGrams(65)
      setFormat("interactive")
      setSelectedSubscriberId("")
      setSelectedTemplateId("")
      setDays(emptyNutritionWeek())
      setPdfContentId("")
      setPdfNameEn("")
      setPdfNameAr("")
    } else if (mode.type === "edit-template") {
      setTitleEn(mode.program.title.en)
      setTitleAr(mode.program.title.ar)
      setDescEn(mode.program.description?.en || "")
      setDescAr(mode.program.description?.ar || "")
      setNotesEn(mode.program.notes?.en || "")
      setNotesAr(mode.program.notes?.ar || "")
      setTargetCalories(mode.program.targetCalories || 2000)
      setTargetWaterLiters(mode.program.targetWaterLiters || 3.0)
      setProteinGrams(mode.program.macros?.proteinGrams || 150)
      setCarbsGrams(mode.program.macros?.carbsGrams || 200)
      setFatsGrams(mode.program.macros?.fatsGrams || 65)
      setFormat(mode.program.format)
      setSelectedSubscriberId("")
      setSelectedTemplateId("")
      setDays(JSON.parse(JSON.stringify(mode.program.days || emptyNutritionWeek())))
      setPdfContentId(mode.program.pdfContentId || "")
      setPdfNameEn(mode.program.pdfName?.en || "")
      setPdfNameAr(mode.program.pdfName?.ar || "")
    } else if (mode.type === "assign") {
      const initialSubId = mode.subscriberId || subscribers[0]?.id || ""
      setSelectedSubscriberId(initialSubId)

      const initialTplId = mode.templateId || templates[0]?.id || ""
      setSelectedTemplateId(initialTplId)

      const tpl = templates.find((t) => t.id === initialTplId)
      if (tpl) {
        setTitleEn(tpl.title.en)
        setTitleAr(tpl.title.ar)
        setTargetCalories(tpl.targetCalories || 2000)
        setTargetWaterLiters(tpl.targetWaterLiters || 3.0)
        setProteinGrams(tpl.macros?.proteinGrams || 150)
        setCarbsGrams(tpl.macros?.carbsGrams || 200)
        setFatsGrams(tpl.macros?.fatsGrams || 65)
        setFormat(tpl.format)
        setDays(JSON.parse(JSON.stringify(tpl.days || emptyNutritionWeek())))
        setPdfContentId(tpl.pdfContentId || "")
        setPdfNameEn(tpl.pdfName?.en || "")
        setPdfNameAr(tpl.pdfName?.ar || "")
      } else {
        setTitleEn("Custom Nutrition Plan")
        setTitleAr("خطة تغذية مخصصة")
        setFormat("interactive")
        setDays(emptyNutritionWeek())
      }
    } else if (mode.type === "edit-assignment") {
      setTitleEn(mode.program.title.en)
      setTitleAr(mode.program.title.ar)
      setDescEn(mode.program.description?.en || "")
      setDescAr(mode.program.description?.ar || "")
      setNotesEn(mode.program.notes?.en || "")
      setNotesAr(mode.program.notes?.ar || "")
      setTargetCalories(mode.program.targetCalories || 2000)
      setTargetWaterLiters(mode.program.targetWaterLiters || 3.0)
      setProteinGrams(mode.program.macros?.proteinGrams || 150)
      setCarbsGrams(mode.program.macros?.carbsGrams || 200)
      setFatsGrams(mode.program.macros?.fatsGrams || 65)
      setFormat(mode.program.format)
      setSelectedSubscriberId(mode.program.subscriberId || "")
      setSelectedTemplateId(mode.program.templateId || "")
      setDays(JSON.parse(JSON.stringify(mode.program.days || emptyNutritionWeek())))
      setPdfContentId(mode.program.pdfContentId || "")
      setPdfNameEn(mode.program.pdfName?.en || "")
      setPdfNameAr(mode.program.pdfName?.ar || "")
      setCreateNewVersion(true)
    }
  }, [open, mode, subscribers, templates])

  function handleTemplatePickerChange(tplId: string) {
    setSelectedTemplateId(tplId)
    const tpl = templates.find((t) => t.id === tplId)
    if (tpl) {
      setTitleEn(tpl.title.en)
      setTitleAr(tpl.title.ar)
      setTargetCalories(tpl.targetCalories || 2000)
      setTargetWaterLiters(tpl.targetWaterLiters || 3.0)
      setProteinGrams(tpl.macros?.proteinGrams || 150)
      setCarbsGrams(tpl.macros?.carbsGrams || 200)
      setFatsGrams(tpl.macros?.fatsGrams || 65)
      setFormat(tpl.format)
      setDays(JSON.parse(JSON.stringify(tpl.days || emptyNutritionWeek())))
      setPdfContentId(tpl.pdfContentId || "")
      setPdfNameEn(tpl.pdfName?.en || "")
      setPdfNameAr(tpl.pdfName?.ar || "")
    }
  }

  // Days and meal slot management
  const currentDay = days.find((d) => d.weekday === selectedWeekday) || days[0]
  const currentMacros = dayMacros(currentDay)

  function addMealSlotToCurrentDay(slotKey: MealSlotKey) {
    const newSlot: MealSlot = {
      id: `slot-${slotKey}-${Date.now().toString(36)}`,
      slot: slotKey,
      items: [],
    }
    setDays((prev) =>
      prev.map((d) =>
        d.weekday === selectedWeekday
          ? { ...d, meals: [...d.meals, newSlot] }
          : d,
      ),
    )
  }

  function removeMealSlot(slotId: string) {
    setDays((prev) =>
      prev.map((d) => {
        if (d.weekday !== selectedWeekday) return d
        return {
          ...d,
          meals: d.meals.filter((s) => s.id !== slotId),
        }
      }),
    )
  }

  function addMealItem(slotId: string) {
    const newItem: MealItem = {
      id: `mitem-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 5)}`,
      name: { en: "Meal Item", ar: "عنصر غذائي" },
      quantity: { en: "1 portion", ar: "1 حصة" },
      calories: 250,
      protein: 20,
      carbs: 25,
      fats: 8,
    }
    setDays((prev) =>
      prev.map((d) => {
        if (d.weekday !== selectedWeekday) return d
        return {
          ...d,
          meals: d.meals.map((s) => {
            if (s.id !== slotId) return s
            return { ...s, items: [...s.items, newItem] }
          }),
        }
      }),
    )
  }

  function updateMealItem(
    slotId: string,
    itemId: string,
    field: keyof MealItem,
    value: unknown,
  ) {
    setDays((prev) =>
      prev.map((d) => {
        if (d.weekday !== selectedWeekday) return d
        return {
          ...d,
          meals: d.meals.map((s) => {
            if (s.id !== slotId) return s
            return {
              ...s,
              items: s.items.map((item) => {
                if (item.id !== itemId) return item
                return { ...item, [field]: value }
              }),
            }
          }),
        }
      }),
    )
  }

  function removeMealItem(slotId: string, itemId: string) {
    setDays((prev) =>
      prev.map((d) => {
        if (d.weekday !== selectedWeekday) return d
        return {
          ...d,
          meals: d.meals.map((s) => {
            if (s.id !== slotId) return s
            return {
              ...s,
              items: s.items.filter((item) => item.id !== itemId),
            }
          }),
        }
      }),
    )
  }

  // Subscriber entitlement check
  const selectedSubscriber = subscribers.find((s) => s.id === selectedSubscriberId)
  const subActiveSubscription = useMemo(() => {
    if (!selectedSubscriberId) return undefined
    return (
      subscriptions.find(
        (s) =>
          s.subscriberId === selectedSubscriberId &&
          (s.status === "active" || s.status === "suspended"),
      ) ?? currentSubscriptionFor(selectedSubscriberId)
    )
  }, [selectedSubscriberId, subscriptions])

  const hasNutritionEntitlement =
    subActiveSubscription?.entitlementsSnapshot?.nutritionProgram ?? false

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!mode) return

    const finalTitle: BilingualText = {
      en: titleEn.trim() || titleAr.trim() || "Nutrition Plan",
      ar: titleAr.trim() || titleEn.trim() || "خطة تغذية",
    }

    const finalDesc: BilingualText | undefined =
      descEn.trim() || descAr.trim()
        ? {
            en: descEn.trim() || descAr.trim(),
            ar: descAr.trim() || descEn.trim(),
          }
        : undefined

    const finalNotes: BilingualText | undefined =
      notesEn.trim() || notesAr.trim()
        ? {
            en: notesEn.trim() || notesAr.trim(),
            ar: notesAr.trim() || notesEn.trim(),
          }
        : undefined

    const finalPdfName: BilingualText | undefined =
      format === "pdf" && (pdfNameEn.trim() || pdfNameAr.trim())
        ? {
            en: pdfNameEn.trim() || pdfNameAr.trim(),
            ar: pdfNameAr.trim() || pdfNameEn.trim(),
          }
        : undefined

    setBusy(true)
    setErrorMsg(null)

    try {
      if (mode.type === "assign") {
        if (!selectedSubscriberId) {
          setErrorMsg(isAr ? "يرجى اختيار المشترك" : "Please select a subscriber")
          setBusy(false)
          return
        }

        await onAssignProgram({
          subscriberId: selectedSubscriberId,
          subscriberName: selectedSubscriber?.displayName,
          templateId: selectedTemplateId || undefined,
          customTitle: finalTitle,
          format,
          days,
          targetCalories,
          targetWaterLiters,
          macros: {
            proteinGrams,
            carbsGrams,
            fatsGrams,
          },
          pdfContentId: pdfContentId || undefined,
          pdfName: finalPdfName,
          notes: finalNotes,
        })
      } else if (mode.type === "edit-assignment") {
        await onSaveProgram({
          id: mode.program.id,
          title: finalTitle,
          description: finalDesc,
          format,
          status: mode.program.status,
          subscriberId: selectedSubscriberId || mode.program.subscriberId,
          templateId: mode.program.templateId,
          days,
          targetCalories,
          targetWaterLiters,
          macros: {
            proteinGrams,
            carbsGrams,
            fatsGrams,
          },
          pdfContentId: pdfContentId || undefined,
          pdfName: finalPdfName,
          notes: finalNotes,
          disclaimerAcknowledged: disclaimerAck,
          createNewVersion,
        })
      } else {
        // Template mode
        await onSaveProgram({
          id: mode.type === "edit-template" ? mode.program.id : undefined,
          title: finalTitle,
          description: finalDesc,
          format,
          status: "template",
          days,
          targetCalories,
          targetWaterLiters,
          macros: {
            proteinGrams,
            carbsGrams,
            fatsGrams,
          },
          pdfContentId: pdfContentId || undefined,
          pdfName: finalPdfName,
          notes: finalNotes,
          disclaimerAcknowledged: disclaimerAck,
        })
      }
      onClose()
    } catch (err) {
      setErrorMsg(
        err instanceof Error
          ? err.message
          : isAr
            ? "حدث خطأ أثناء حفظ خطة التغذية"
            : "Failed to save nutrition plan",
      )
    } finally {
      setBusy(false)
    }
  }

  if (!open || !mode) return null

  const isAssignMode = mode.type === "assign" || mode.type === "edit-assignment"

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[120] flex items-center justify-center p-3 sm:p-5"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog Card */}
      <div className="relative flex max-h-[92vh] w-full max-w-4xl flex-col rounded-[28px] bg-white shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-[#F0F0F0] px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-2xl bg-[var(--gym-ink,#063434)] text-white">
              <Apple className="size-5" />
            </div>
            <div>
              <h2 className="font-heading text-[18px] font-extrabold text-[var(--gym-ink,#063434)]">
                {mode.type === "create-template"
                  ? isAr
                    ? "إنشاء قالب خطة تغذية جديد"
                    : "Create Nutrition Template"
                  : mode.type === "edit-template"
                    ? isAr
                      ? "تعديل قالب التغذية"
                      : "Edit Nutrition Template"
                    : mode.type === "assign"
                      ? isAr
                        ? "تخصيص خطة تغذية لمشترك"
                        : "Assign Nutrition Plan to Subscriber"
                      : isAr
                        ? "تعديل خطة التغذية المخصصة للمشترك"
                        : "Edit Assigned Nutrition Plan"}
              </h2>
              <p className="text-[12px] font-medium text-[#8c8c8c]">
                {isAssignMode
                  ? isAr
                    ? "الخطة المخصصة مستقلة تماماً؛ تعديلها لا يغير القالب الأساسي"
                    : "Customized subscriber plan is isolated; template stays unchanged"
                  : isAr
                    ? "قوالب وجبات وسعرات قابلة للتكرار والتخصيص"
                    : "Reusable meal and calorie blueprints for quick assignments"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Language toggle tab */}
            <div className="flex rounded-full bg-[#F4F4F4] p-0.5 text-[11px] font-bold">
              <button
                type="button"
                onClick={() => setActiveLangTab("ar")}
                className={cn(
                  "rounded-full px-3 py-1 transition",
                  activeLangTab === "ar"
                    ? "bg-[var(--gym-ink,#063434)] text-white shadow-sm"
                    : "text-[#8c8c8c] hover:text-black",
                )}
              >
                العربية (AR)
              </button>
              <button
                type="button"
                onClick={() => setActiveLangTab("en")}
                className={cn(
                  "rounded-full px-3 py-1 transition",
                  activeLangTab === "en"
                    ? "bg-[var(--gym-ink,#063434)] text-white shadow-sm"
                    : "text-[#8c8c8c] hover:text-black",
                )}
              >
                English (EN)
              </button>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="flex size-8 items-center justify-center rounded-full bg-[#F4F4F4] text-[#8c8c8c] hover:bg-black/5 hover:text-black"
            >
              <X className="size-4" />
            </button>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
            {errorMsg ? (
              <div className="rounded-2xl bg-red-50 p-3 text-[13px] font-medium text-red-600">
                {errorMsg}
              </div>
            ) : null}

            {/* Regulatory & Safety Medical Disclaimer Banner */}
            <div className="rounded-2xl border border-amber-200 bg-amber-50/80 p-4">
              <div className="flex items-start gap-3">
                <ShieldAlert className="size-5 shrink-0 text-amber-700 mt-0.5" />
                <div className="space-y-1">
                  <p className="text-[12px] font-bold text-amber-900">
                    {isAr ? "إشعار الامتثال المهني والطبي" : "Professional Practice & Medical Disclaimer"}
                  </p>
                  <p className="text-[12px] leading-relaxed text-amber-800">
                    {NUTRITION_DISCLAIMER[locale]}
                  </p>
                </div>
              </div>
            </div>

            {/* Subscriber & Template Picker row */}
            {isAssignMode ? (
              <div className="rounded-2xl bg-[#F8F9FA] p-4 border border-[#EBEBEB] space-y-3">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="block text-[12px] font-bold text-[#8c8c8c] mb-1">
                      {isAr ? "المشترك المستهدف *" : "Target Subscriber *"}
                    </label>
                    <div className="relative">
                      <select
                        disabled={mode.type === "edit-assignment"}
                        value={selectedSubscriberId}
                        onChange={(e) => setSelectedSubscriberId(e.target.value)}
                        className="h-10 w-full rounded-xl border border-[#E0E0E0] bg-white px-3 text-[13px] font-semibold text-[var(--gym-ink,#063434)] outline-none focus:border-black appearance-none pe-8"
                      >
                        <option value="">{isAr ? "اختر مشترك..." : "Select subscriber..."}</option>
                        {subscribers.map((sub) => (
                          <option key={sub.id} value={sub.id}>
                            {sub.displayName} ({sub.email})
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="pointer-events-none absolute end-3 top-3 size-4 text-[#8c8c8c]" />
                    </div>
                  </div>

                  {mode.type === "assign" ? (
                    <div>
                      <label className="block text-[12px] font-bold text-[#8c8c8c] mb-1">
                        {isAr ? "نسخ من قالب مسبق (اختياري)" : "Copy from Template (Optional)"}
                      </label>
                      <div className="relative">
                        <select
                          value={selectedTemplateId}
                          onChange={(e) => handleTemplatePickerChange(e.target.value)}
                          className="h-10 w-full rounded-xl border border-[#E0E0E0] bg-white px-3 text-[13px] font-semibold text-[var(--gym-ink,#063434)] outline-none focus:border-black appearance-none pe-8"
                        >
                          <option value="">{isAr ? "خطة فارغة مخصصة" : "Start from blank custom"}</option>
                          {templates.map((tpl) => (
                            <option key={tpl.id} value={tpl.id}>
                              {tpl.title[locale]} ({tpl.targetCalories} kcal)
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="pointer-events-none absolute end-3 top-3 size-4 text-[#8c8c8c]" />
                      </div>
                    </div>
                  ) : (
                    <div>
                      <label className="block text-[12px] font-bold text-[#8c8c8c] mb-1">
                        {isAr ? "إدارة الإصدارات" : "Version Control"}
                      </label>
                      <label className="flex items-center gap-2 pt-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={createNewVersion}
                          onChange={(e) => setCreateNewVersion(e.target.checked)}
                          className="size-4 rounded accent-[var(--gym-ink,#063434)]"
                        />
                        <span className="text-[13px] font-bold text-[var(--gym-ink,#063434)]">
                          {isAr
                            ? `إنشاء إصدار جديد (v${(mode.program.version || 1) + 1}) وحفظ السجل السابق`
                            : `Bump to new version (v${(mode.program.version || 1) + 1}) & keep history`}
                        </span>
                      </label>
                    </div>
                  )}
                </div>

                {selectedSubscriber ? (
                  <div className="flex items-center justify-between text-[12px] pt-1 border-t border-[#ECECEC]">
                    <span className="text-[#8c8c8c]">
                      {isAr ? "حالة الاشتراك:" : "Subscription status:"}{" "}
                      <strong className="text-[var(--gym-ink,#063434)]">
                        {subActiveSubscription?.status ?? (isAr ? "بدون اشتراك نشط" : "No active plan")}
                      </strong>
                    </span>
                    <span
                      className={cn(
                        "rounded-full px-2.5 py-0.5 text-[11px] font-bold",
                        hasNutritionEntitlement
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-amber-100 text-amber-800",
                      )}
                    >
                      {hasNutritionEntitlement
                        ? isAr
                          ? "مخول للخطط الغذائية"
                          : "Nutrition Entitled"
                        : isAr
                          ? "تنبيه: الباقة الحالية لا تتضمن خطط التغذية"
                          : "Note: Package has no nutrition entitlement"}
                    </span>
                  </div>
                ) : null}
              </div>
            ) : null}

            {/* Basic Program Info */}
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="block text-[12px] font-bold text-[#8c8c8c] mb-1">
                  {activeLangTab === "ar" ? "عنوان الخطة الغذائية (عربي) *" : "Nutrition Plan Title (English) *"}
                </label>
                {activeLangTab === "ar" ? (
                  <input
                    required
                    value={titleAr}
                    onChange={(e) => setTitleAr(e.target.value)}
                    placeholder="مثال: خطة التنشيف المتوازن"
                    className="h-10 w-full rounded-xl border border-[#E0E0E0] bg-white px-3 text-[13px] font-semibold text-[var(--gym-ink,#063434)] outline-none focus:border-black"
                  />
                ) : (
                  <input
                    required
                    value={titleEn}
                    onChange={(e) => setTitleEn(e.target.value)}
                    placeholder="e.g. Fat-loss Balanced Plate"
                    className="h-10 w-full rounded-xl border border-[#E0E0E0] bg-white px-3 text-[13px] font-semibold text-[var(--gym-ink,#063434)] outline-none focus:border-black"
                  />
                )}
              </div>

              <div>
                <label className="block text-[12px] font-bold text-[#8c8c8c] mb-1">
                  {isAr ? "صيغة الخطة" : "Plan Format"}
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setFormat("interactive")}
                    className={cn(
                      "flex h-10 items-center justify-center gap-2 rounded-xl border text-[13px] font-bold transition",
                      format === "interactive"
                        ? "border-[var(--gym-ink,#063434)] bg-[var(--gym-ink,#063434)] text-white"
                        : "border-[#E0E0E0] bg-white text-[#8c8c8c] hover:bg-black/5",
                    )}
                  >
                    <Layers className="size-4" />
                    {isAr ? "تفاعلي (وجبات وسعرات)" : "Interactive (Meals)"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormat("pdf")}
                    className={cn(
                      "flex h-10 items-center justify-center gap-2 rounded-xl border text-[13px] font-bold transition",
                      format === "pdf"
                        ? "border-[var(--gym-ink,#063434)] bg-[var(--gym-ink,#063434)] text-white"
                        : "border-[#E0E0E0] bg-white text-[#8c8c8c] hover:bg-black/5",
                    )}
                  >
                    <FileText className="size-4" />
                    {isAr ? "مستند PDF" : "PDF Document"}
                  </button>
                </div>
              </div>
            </div>

            {/* Target Calories & Daily Macros Targets Bar */}
            <div className="rounded-2xl border border-[#E5E5E5] bg-[#FBFBFB] p-4 space-y-3">
              <span className="text-[13px] font-extrabold text-[var(--gym-ink,#063434)]">
                {isAr ? "الأهداف اليومية للسعرات والماكروز والماء" : "Daily Calorie, Macro & Hydration Targets"}
              </span>

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
                <div>
                  <label className="block text-[11px] font-bold text-[#8c8c8c] mb-1">
                    {isAr ? "السعرات (kcal)" : "Calories (kcal)"}
                  </label>
                  <input
                    type="number"
                    min={1000}
                    max={6000}
                    step={50}
                    value={targetCalories}
                    onChange={(e) => setTargetCalories(parseInt(e.target.value, 10) || 2000)}
                    className="h-9 w-full rounded-xl border border-[#E0E0E0] bg-white px-2.5 text-center text-[13px] font-extrabold text-[var(--gym-ink,#063434)]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#8c8c8c] mb-1">
                    {isAr ? "بروتين (جم)" : "Protein (g)"}
                  </label>
                  <input
                    type="number"
                    min={20}
                    max={400}
                    value={proteinGrams}
                    onChange={(e) => setProteinGrams(parseInt(e.target.value, 10) || 150)}
                    className="h-9 w-full rounded-xl border border-[#E0E0E0] bg-white px-2.5 text-center text-[13px] font-extrabold text-[var(--gym-ink,#063434)]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#8c8c8c] mb-1">
                    {isAr ? "كاربوهيدرات (جم)" : "Carbs (g)"}
                  </label>
                  <input
                    type="number"
                    min={20}
                    max={600}
                    value={carbsGrams}
                    onChange={(e) => setCarbsGrams(parseInt(e.target.value, 10) || 200)}
                    className="h-9 w-full rounded-xl border border-[#E0E0E0] bg-white px-2.5 text-center text-[13px] font-extrabold text-[var(--gym-ink,#063434)]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#8c8c8c] mb-1">
                    {isAr ? "دهون صحية (جم)" : "Fats (g)"}
                  </label>
                  <input
                    type="number"
                    min={10}
                    max={200}
                    value={fatsGrams}
                    onChange={(e) => setFatsGrams(parseInt(e.target.value, 10) || 65)}
                    className="h-9 w-full rounded-xl border border-[#E0E0E0] bg-white px-2.5 text-center text-[13px] font-extrabold text-[var(--gym-ink,#063434)]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#8c8c8c] mb-1">
                    {isAr ? "الماء (لتر)" : "Water (L)"}
                  </label>
                  <input
                    type="number"
                    step={0.5}
                    min={1}
                    max={8}
                    value={targetWaterLiters}
                    onChange={(e) => setTargetWaterLiters(parseFloat(e.target.value) || 3.0)}
                    className="h-9 w-full rounded-xl border border-[#E0E0E0] bg-white px-2.5 text-center text-[13px] font-extrabold text-[var(--gym-ink,#063434)]"
                  />
                </div>
              </div>
            </div>

            {/* If format is PDF */}
            {format === "pdf" ? (
              <div className="rounded-2xl bg-[#F8F9FA] p-4 border border-[#EBEBEB] space-y-3">
                <div className="flex items-center gap-2 text-[14px] font-bold text-[var(--gym-ink,#063434)]">
                  <FileText className="size-4" />
                  {isAr ? "ربط مستند PDF من مكتبة المحتوى" : "Attach PDF from Content Library"}
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="block text-[12px] font-bold text-[#8c8c8c] mb-1">
                      {isAr ? "اختر ملف من المكتبة" : "Select from Library"}
                    </label>
                    <div className="relative">
                      <select
                        value={pdfContentId}
                        onChange={(e) => {
                          setPdfContentId(e.target.value)
                          const asset = pdfAssets.find((a) => a.id === e.target.value)
                          if (asset) {
                            setPdfNameEn(asset.title.en)
                            setPdfNameAr(asset.title.ar)
                          }
                        }}
                        className="h-10 w-full rounded-xl border border-[#E0E0E0] bg-white px-3 text-[13px] font-semibold text-[var(--gym-ink,#063434)] outline-none focus:border-black appearance-none pe-8"
                      >
                        <option value="">{isAr ? "ملف خارجي / يدوي" : "Custom / External file"}</option>
                        {pdfAssets.map((asset) => (
                          <option key={asset.id} value={asset.id}>
                            {asset.title[locale]} ({asset.fileName})
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="pointer-events-none absolute end-3 top-3 size-4 text-[#8c8c8c]" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[12px] font-bold text-[#8c8c8c] mb-1">
                      {isAr ? "اسم ملف الـ PDF المعروض للمشترك" : "Display PDF File Name"}
                    </label>
                    <input
                      value={activeLangTab === "ar" ? pdfNameAr : pdfNameEn}
                      onChange={(e) =>
                        activeLangTab === "ar"
                          ? setPdfNameAr(e.target.value)
                          : setPdfNameEn(e.target.value)
                      }
                      placeholder="e.g. Ramadan_Nutrition_Guide.pdf"
                      className="h-10 w-full rounded-xl border border-[#E0E0E0] bg-white px-3 text-[13px] font-semibold text-[var(--gym-ink,#063434)] outline-none focus:border-black"
                    />
                  </div>
                </div>
              </div>
            ) : (
              /* If format is Interactive: Days & Meal Slots */
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-[14px] font-extrabold text-[var(--gym-ink,#063434)]">
                    {isAr ? "جدول الوجبات الأسبوعي" : "Weekly Meal Schedule"}
                  </span>
                  {currentMacros ? (
                    <div className="flex items-center gap-2 text-[11px] font-bold">
                      <span className="rounded-full bg-[#F4F4F4] px-2.5 py-1 text-[var(--gym-ink,#063434)]">
                        {currentMacros.calories} / {targetCalories} kcal
                      </span>
                      <span className="rounded-full bg-blue-50 px-2 py-0.5 text-blue-700">
                        P: {currentMacros.protein}g
                      </span>
                      <span className="rounded-full bg-amber-50 px-2 py-0.5 text-amber-700">
                        C: {currentMacros.carbs}g
                      </span>
                      <span className="rounded-full bg-purple-50 px-2 py-0.5 text-purple-700">
                        F: {currentMacros.fats}g
                      </span>
                    </div>
                  ) : null}
                </div>

                {/* Weekday selector */}
                <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
                  {days.map((d) => {
                    const active = d.weekday === selectedWeekday
                    const totalItems = d.meals.reduce((sum, s) => sum + s.items.length, 0)
                    return (
                      <button
                        key={d.id}
                        type="button"
                        onClick={() => setSelectedWeekday(d.weekday)}
                        className={cn(
                          "flex flex-col items-center justify-center rounded-2xl py-2 px-1 text-center transition",
                          active
                            ? "bg-[var(--gym-ink,#063434)] text-white shadow-sm"
                            : "bg-[#F4F4F4] text-[var(--gym-ink,#063434)] hover:bg-[#EBEBEB]",
                        )}
                      >
                        <span className="text-[11px] font-extrabold">
                          {isAr ? WEEKDAY_NAMES_AR[d.weekday] : WEEKDAY_NAMES_EN[d.weekday].slice(0, 3)}
                        </span>
                        <span
                          className={cn(
                            "mt-1 text-[10px] font-semibold",
                            active ? "text-white/70" : "text-[#8c8c8c]",
                          )}
                        >
                          {totalItems} {isAr ? "أطعمة" : "items"}
                        </span>
                      </button>
                    )
                  })}
                </div>

                {/* Current Day Meals Box */}
                <div className="rounded-2xl border border-[#EBEBEB] bg-[#FAFAFA] p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-heading text-[15px] font-extrabold text-[var(--gym-ink,#063434)]">
                        {isAr ? WEEKDAY_NAMES_AR[selectedWeekday] : WEEKDAY_NAMES_EN[selectedWeekday]}
                      </h4>
                      <p className="text-[12px] font-medium text-[#8c8c8c]">
                        {isAr
                          ? `${currentDay.meals.length} فترات وجبات مبرمجة.`
                          : `${currentDay.meals.length} meal slots programmed for this day.`}
                      </p>
                    </div>

                    {/* Add Slot button */}
                    <div className="flex items-center gap-1.5">
                      {(["snack", "pre_workout", "post_workout"] as const).map((extraKey) => (
                        <button
                          key={extraKey}
                          type="button"
                          onClick={() => addMealSlotToCurrentDay(extraKey)}
                          className="rounded-full bg-[#EAEAEA] px-2.5 py-1 text-[11px] font-bold text-[var(--gym-ink,#063434)] hover:bg-[#DDD]"
                        >
                          + {MEAL_SLOT_LABELS[extraKey][locale]}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Meal slots list */}
                  <div className="space-y-4">
                    {currentDay.meals.map((slot) => {
                      const slotTitle = MEAL_SLOT_LABELS[slot.slot]?.[locale] || slot.slot
                      return (
                        <div
                          key={slot.id}
                          className="rounded-2xl border border-[#E5E5E5] bg-white p-4 shadow-sm space-y-3"
                        >
                          <div className="flex items-center justify-between border-b border-[#F0F0F0] pb-2">
                            <div className="flex items-center gap-2">
                              <Utensils className="size-4 text-[var(--gym-ink,#063434)]" />
                              <span className="font-heading text-[14px] font-extrabold text-[var(--gym-ink,#063434)]">
                                {slotTitle}
                              </span>
                              <span className="text-[11px] font-bold text-[#8c8c8c]">
                                ({slot.items.length} {isAr ? "أصناف" : "items"})
                              </span>
                            </div>

                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => addMealItem(slot.id)}
                                className="inline-flex items-center gap-1 rounded-full bg-[var(--gym-ink,#063434)] px-3 py-1 text-[11px] font-bold text-white transition hover:opacity-95"
                              >
                                <Plus className="size-3" />
                                {isAr ? "إضافة صنف" : "Add food"}
                              </button>
                              <button
                                type="button"
                                onClick={() => removeMealSlot(slot.id)}
                                className="flex size-7 items-center justify-center rounded-full text-[#8c8c8c] hover:bg-red-50 hover:text-red-500"
                                title={isAr ? "حذف الوجبة" : "Remove slot"}
                              >
                                <Trash2 className="size-3.5" />
                              </button>
                            </div>
                          </div>

                          {/* Food Items in this slot */}
                          {slot.items.length === 0 ? (
                            <p className="text-center py-2 text-[12px] font-medium text-[#8c8c8c]">
                              {isAr ? "لا توجد أطعمة في هذه الوجبة. اضغط '+ إضافة صنف'." : "No foods in this meal yet. Click '+ Add food'."}
                            </p>
                          ) : (
                            <div className="space-y-2">
                              {slot.items.map((item) => {
                                const itemName =
                                  typeof item.name === "string"
                                    ? item.name
                                    : activeLangTab === "ar"
                                      ? item.name.ar
                                      : item.name.en

                                const itemQty =
                                  typeof item.quantity === "string"
                                    ? item.quantity
                                    : activeLangTab === "ar"
                                      ? item.quantity?.ar
                                      : item.quantity?.en

                                const itemNotes =
                                  typeof item.notes === "string"
                                    ? item.notes
                                    : activeLangTab === "ar"
                                      ? item.notes?.ar
                                      : item.notes?.en

                                return (
                                  <div
                                    key={item.id}
                                    className="rounded-xl bg-[#F8F9FA] p-3 border border-[#ECECEC] space-y-2"
                                  >
                                    <div className="flex items-center justify-between gap-2">
                                      <input
                                        required
                                        value={itemName}
                                        onChange={(e) => {
                                          const val = e.target.value
                                          const cur =
                                            typeof item.name === "object"
                                              ? item.name
                                              : { en: item.name, ar: item.name }
                                          updateMealItem(slot.id, item.id, "name", {
                                            ...cur,
                                            [activeLangTab]: val,
                                          })
                                        }}
                                        placeholder={isAr ? "اسم الصنف (مثال: صدور دجاج مشوية)" : "Food item (e.g. Grilled Chicken Breast)"}
                                        className="h-8 flex-1 rounded-lg border border-[#E0E0E0] bg-white px-2.5 text-[12px] font-bold text-[var(--gym-ink,#063434)] outline-none focus:border-black"
                                      />

                                      <input
                                        value={itemQty || ""}
                                        onChange={(e) => {
                                          const val = e.target.value
                                          const cur =
                                            typeof item.quantity === "object"
                                              ? item.quantity
                                              : { en: "", ar: "" }
                                          updateMealItem(slot.id, item.id, "quantity", {
                                            ...cur,
                                            [activeLangTab]: val,
                                          })
                                        }}
                                        placeholder={isAr ? "الكمية (مثال: 180 جم)" : "Portion (e.g. 180g)"}
                                        className="h-8 w-32 rounded-lg border border-[#E0E0E0] bg-white px-2 text-[12px] font-semibold text-[var(--gym-ink,#063434)] outline-none focus:border-black"
                                      />

                                      <button
                                        type="button"
                                        onClick={() => removeMealItem(slot.id, item.id)}
                                        className="flex size-7 shrink-0 items-center justify-center rounded-full text-red-500 hover:bg-red-50"
                                      >
                                        <Trash2 className="size-3.5" />
                                      </button>
                                    </div>

                                    {/* Item Nutrition Breakdown */}
                                    <div className="grid grid-cols-4 gap-2">
                                      <div>
                                        <label className="block text-[10px] font-bold text-[#8c8c8c]">
                                          {isAr ? "سعرات" : "Calories"}
                                        </label>
                                        <input
                                          type="number"
                                          min={0}
                                          value={item.calories ?? 0}
                                          onChange={(e) =>
                                            updateMealItem(
                                              slot.id,
                                              item.id,
                                              "calories",
                                              parseInt(e.target.value, 10) || 0,
                                            )
                                          }
                                          className="h-7 w-full rounded border border-[#E0E0E0] bg-white px-1 text-center text-[11px] font-bold text-[var(--gym-ink,#063434)]"
                                        />
                                      </div>

                                      <div>
                                        <label className="block text-[10px] font-bold text-[#8c8c8c]">
                                          {isAr ? "بروتين (جم)" : "Protein (g)"}
                                        </label>
                                        <input
                                          type="number"
                                          min={0}
                                          value={item.protein ?? 0}
                                          onChange={(e) =>
                                            updateMealItem(
                                              slot.id,
                                              item.id,
                                              "protein",
                                              parseInt(e.target.value, 10) || 0,
                                            )
                                          }
                                          className="h-7 w-full rounded border border-[#E0E0E0] bg-white px-1 text-center text-[11px] font-bold text-[var(--gym-ink,#063434)]"
                                        />
                                      </div>

                                      <div>
                                        <label className="block text-[10px] font-bold text-[#8c8c8c]">
                                          {isAr ? "كارب (جم)" : "Carbs (g)"}
                                        </label>
                                        <input
                                          type="number"
                                          min={0}
                                          value={item.carbs ?? 0}
                                          onChange={(e) =>
                                            updateMealItem(
                                              slot.id,
                                              item.id,
                                              "carbs",
                                              parseInt(e.target.value, 10) || 0,
                                            )
                                          }
                                          className="h-7 w-full rounded border border-[#E0E0E0] bg-white px-1 text-center text-[11px] font-bold text-[var(--gym-ink,#063434)]"
                                        />
                                      </div>

                                      <div>
                                        <label className="block text-[10px] font-bold text-[#8c8c8c]">
                                          {isAr ? "دهون (جم)" : "Fats (g)"}
                                        </label>
                                        <input
                                          type="number"
                                          min={0}
                                          value={item.fats ?? 0}
                                          onChange={(e) =>
                                            updateMealItem(
                                              slot.id,
                                              item.id,
                                              "fats",
                                              parseInt(e.target.value, 10) || 0,
                                            )
                                          }
                                          className="h-7 w-full rounded border border-[#E0E0E0] bg-white px-1 text-center text-[11px] font-bold text-[var(--gym-ink,#063434)]"
                                        />
                                      </div>
                                    </div>

                                    <input
                                      value={itemNotes || ""}
                                      onChange={(e) => {
                                        const val = e.target.value
                                        const cur =
                                          typeof item.notes === "object"
                                            ? item.notes
                                            : { en: "", ar: "" }
                                        updateMealItem(slot.id, item.id, "notes", {
                                          ...cur,
                                          [activeLangTab]: val,
                                        })
                                      }}
                                      placeholder={isAr ? "ملاحظات على الوجبة (اختياري)..." : "Meal item notes (optional)..."}
                                      className="h-7 w-full rounded-md border border-[#E0E0E0] bg-white px-2 text-[11px] text-[#6B7280] outline-none focus:border-black"
                                    />
                                  </div>
                                )
                              })}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="flex shrink-0 items-center justify-end gap-3 border-t border-[#F0F0F0] px-6 py-4 bg-white">
            <button
              type="button"
              onClick={onClose}
              disabled={busy}
              className="rounded-full px-5 py-2.5 text-[13px] font-bold text-[#8c8c8c] hover:bg-black/5"
            >
              {isAr ? "إلغاء" : "Cancel"}
            </button>
            <button
              type="submit"
              disabled={busy}
              className="inline-flex items-center gap-2 rounded-full bg-[var(--gym-ink,#063434)] px-6 py-2.5 text-[13px] font-bold text-white transition hover:opacity-95 disabled:opacity-50"
            >
              {busy ? (
                <span>{isAr ? "جاري الحفظ..." : "Saving..."}</span>
              ) : (
                <>
                  <Check className="size-4" strokeWidth={2.5} />
                  <span>
                    {isAssignMode
                      ? isAr
                        ? "تأكيد وتعيين الخطة"
                        : "Confirm & Assign"
                      : isAr
                        ? "حفظ القالب"
                        : "Save Template"}
                  </span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body,
  )
}
