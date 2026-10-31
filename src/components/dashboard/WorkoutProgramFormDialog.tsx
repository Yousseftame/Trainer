import { useEffect, useMemo, useState } from "react"
import { createPortal } from "react-dom"
import {
  Check,
  ChevronDown,
  Dumbbell,
  FileText,
  Layers,
  Play,
  Plus,
  Trash2,
  X,
} from "lucide-react"
import { ContentPreviewDialog } from "@/components/dashboard/ContentPreviewDialog"
import { useContentAssetsQuery } from "@/features/content/hooks"
import { useSubscribersQuery } from "@/features/subscribers/hooks"
import { currentSubscriptionFor } from "@/features/subscriptions/demo"
import { useSubscriptionsQuery } from "@/features/subscriptions/hooks"
import type {
  AssignWorkoutInput,
  SaveWorkoutProgramInput,
} from "@/features/workouts/service"
import { useLocale } from "@/hooks/useLocale"
import { cn } from "@/lib/utils"
import type { ContentAsset } from "@/types/content"
import type {
  BilingualText,
  ProgramFormat,
  WorkoutDay,
  WorkoutExercise,
  WorkoutProgram,
} from "@/types/program"

export type WorkoutDialogMode =
  | { type: "create-template" }
  | { type: "edit-template"; program: WorkoutProgram }
  | { type: "assign"; subscriberId?: string; templateId?: string }
  | { type: "edit-assignment"; program: WorkoutProgram }

type WorkoutProgramFormDialogProps = {
  open: boolean
  mode: WorkoutDialogMode | null
  templates: WorkoutProgram[]
  onClose: () => void
  onSaveProgram: (input: SaveWorkoutProgramInput) => Promise<unknown>
  onAssignProgram: (input: AssignWorkoutInput) => Promise<unknown>
}

const WEEKDAY_NAMES_EN = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
const WEEKDAY_NAMES_AR = ["الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت", "الأحد"]

function emptyWeek(): WorkoutDay[] {
  return Array.from({ length: 7 }, (_, weekday) => ({
    id: `day-${weekday}-${Date.now().toString(36)}`,
    weekday,
    isRest: weekday === 2 || weekday === 6, // default wed/sun rest
    exercises: [],
  }))
}

export function WorkoutProgramFormDialog({
  open,
  mode,
  templates,
  onClose,
  onSaveProgram,
  onAssignProgram,
}: WorkoutProgramFormDialogProps) {
  const { locale } = useLocale()
  const isAr = locale === "ar"

  const { data: subscribers = [] } = useSubscribersQuery()
  const { data: subscriptions = [] } = useSubscriptionsQuery()
  const { data: contentAssets = [] } = useContentAssetsQuery()

  // Video library assets for association
  const videoAssets = contentAssets.filter(
    (asset) => asset.category === "exerciseVideo" || asset.kind === "video",
  )
  const pdfAssets = contentAssets.filter(
    (asset) => asset.category === "workoutPdf" || asset.kind === "pdf",
  )

  const [activeLangTab, setActiveLangTab] = useState<"ar" | "en">(
    locale === "ar" ? "ar" : "en",
  )
  const [selectedWeekday, setSelectedWeekday] = useState(0)
  const [previewVideo, setPreviewVideo] = useState<ContentAsset | null>(null)
  const [busy, setBusy] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  // Form State
  const [titleEn, setTitleEn] = useState("")
  const [titleAr, setTitleAr] = useState("")
  const [descEn, setDescEn] = useState("")
  const [descAr, setDescAr] = useState("")
  const [notesEn, setNotesEn] = useState("")
  const [notesAr, setNotesAr] = useState("")
  const [format, setFormat] = useState<ProgramFormat>("interactive")
  const [selectedSubscriberId, setSelectedSubscriberId] = useState("")
  const [selectedTemplateId, setSelectedTemplateId] = useState("")
  const [createNewVersion, setCreateNewVersion] = useState(true)
  const [pdfContentId, setPdfContentId] = useState("")
  const [pdfNameEn, setPdfNameEn] = useState("")
  const [pdfNameAr, setPdfNameAr] = useState("")
  const [days, setDays] = useState<WorkoutDay[]>(emptyWeek())

  useEffect(() => {
    if (!open || !mode) return
    setErrorMsg(null)

    if (mode.type === "create-template") {
      setTitleEn("New Workout Template")
      setTitleAr("قالب تدريب جديد")
      setDescEn("")
      setDescAr("")
      setNotesEn("")
      setNotesAr("")
      setFormat("interactive")
      setSelectedSubscriberId("")
      setSelectedTemplateId("")
      setDays(emptyWeek())
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
      setFormat(mode.program.format)
      setSelectedSubscriberId("")
      setSelectedTemplateId("")
      setDays(JSON.parse(JSON.stringify(mode.program.days || emptyWeek())))
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
        setFormat(tpl.format)
        setDays(JSON.parse(JSON.stringify(tpl.days || emptyWeek())))
        setPdfContentId(tpl.pdfContentId || "")
        setPdfNameEn(tpl.pdfName?.en || "")
        setPdfNameAr(tpl.pdfName?.ar || "")
      } else {
        setTitleEn("Custom Workout Plan")
        setTitleAr("خطة تدريب مخصصة")
        setFormat("interactive")
        setDays(emptyWeek())
      }
    } else if (mode.type === "edit-assignment") {
      setTitleEn(mode.program.title.en)
      setTitleAr(mode.program.title.ar)
      setDescEn(mode.program.description?.en || "")
      setDescAr(mode.program.description?.ar || "")
      setNotesEn(mode.program.notes?.en || "")
      setNotesAr(mode.program.notes?.ar || "")
      setFormat(mode.program.format)
      setSelectedSubscriberId(mode.program.subscriberId || "")
      setSelectedTemplateId(mode.program.templateId || "")
      setDays(JSON.parse(JSON.stringify(mode.program.days || emptyWeek())))
      setPdfContentId(mode.program.pdfContentId || "")
      setPdfNameEn(mode.program.pdfName?.en || "")
      setPdfNameAr(mode.program.pdfName?.ar || "")
      setCreateNewVersion(true)
    }
  }, [open, mode, subscribers, templates])

  // Handle template selection change in assign mode
  function handleTemplatePickerChange(tplId: string) {
    setSelectedTemplateId(tplId)
    const tpl = templates.find((t) => t.id === tplId)
    if (tpl) {
      setTitleEn(tpl.title.en)
      setTitleAr(tpl.title.ar)
      setFormat(tpl.format)
      setDays(JSON.parse(JSON.stringify(tpl.days || emptyWeek())))
      setPdfContentId(tpl.pdfContentId || "")
      setPdfNameEn(tpl.pdfName?.en || "")
      setPdfNameAr(tpl.pdfName?.ar || "")
    }
  }

  // Days and exercises manipulation
  const currentDay = days.find((d) => d.weekday === selectedWeekday) || days[0]

  function toggleCurrentDayRest() {
    setDays((prev) =>
      prev.map((d) =>
        d.weekday === selectedWeekday ? { ...d, isRest: !d.isRest } : d,
      ),
    )
  }

  function addExerciseToCurrentDay() {
    const newEx: WorkoutExercise = {
      id: `ex-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 5)}`,
      name: { en: "New Exercise", ar: "تمرين جديد" },
      description: { en: "", ar: "" },
      sets: 3,
      reps: "10-12",
      restSeconds: 60,
      notes: { en: "", ar: "" },
    }
    setDays((prev) =>
      prev.map((d) =>
        d.weekday === selectedWeekday
          ? { ...d, isRest: false, exercises: [...d.exercises, newEx] }
          : d,
      ),
    )
  }

  function updateExercise(
    exerciseId: string,
    field: keyof WorkoutExercise,
    value: unknown,
  ) {
    setDays((prev) =>
      prev.map((d) => {
        if (d.weekday !== selectedWeekday) return d
        return {
          ...d,
          exercises: d.exercises.map((ex) => {
            if (ex.id !== exerciseId) return ex
            return { ...ex, [field]: value }
          }),
        }
      }),
    )
  }

  function removeExercise(exerciseId: string) {
    setDays((prev) =>
      prev.map((d) => {
        if (d.weekday !== selectedWeekday) return d
        return {
          ...d,
          exercises: d.exercises.filter((ex) => ex.id !== exerciseId),
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

  const hasWorkoutEntitlement =
    subActiveSubscription?.entitlementsSnapshot?.workoutProgram ?? false

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!mode) return

    const finalTitle: BilingualText = {
      en: titleEn.trim() || titleAr.trim() || "Workout Program",
      ar: titleAr.trim() || titleEn.trim() || "برنامج تدريبي",
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
          pdfContentId: pdfContentId || undefined,
          pdfName: finalPdfName,
          notes: finalNotes,
          createNewVersion,
        })
      } else {
        // Template mode (create or edit)
        await onSaveProgram({
          id: mode.type === "edit-template" ? mode.program.id : undefined,
          title: finalTitle,
          description: finalDesc,
          format,
          status: "template",
          days,
          pdfContentId: pdfContentId || undefined,
          pdfName: finalPdfName,
          notes: finalNotes,
        })
      }
      onClose()
    } catch (err) {
      setErrorMsg(
        err instanceof Error
          ? err.message
          : isAr
            ? "حدث خطأ أثناء حفظ البرنامج"
            : "Failed to save workout program",
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
              <Dumbbell className="size-5" />
            </div>
            <div>
              <h2 className="font-heading text-[18px] font-extrabold text-[var(--gym-ink,#063434)]">
                {mode.type === "create-template"
                  ? isAr
                    ? "إنشاء قالب تدريب جديد"
                    : "Create Workout Template"
                  : mode.type === "edit-template"
                    ? isAr
                      ? "تعديل قالب التدريب"
                      : "Edit Workout Template"
                    : mode.type === "assign"
                      ? isAr
                        ? "تخصيص برنامج تدريبي لمشترك"
                        : "Assign Workout to Subscriber"
                      : isAr
                        ? "تعديل برنامج المشترك المخصص"
                        : "Edit Assigned Workout Program"}
              </h2>
              <p className="text-[12px] font-medium text-[#8c8c8c]">
                {isAssignMode
                  ? isAr
                    ? "البرنامج المخصص مستقل تماماً عن القوالب ولن يؤثر على المشتركين الآخرين"
                    : "Assigned programs are independent copies; editing them won't affect base templates"
                  : isAr
                    ? "القوالب القابلة لإعادة الاستخدام لإنشاء نسخ للمشتركين"
                    : "Reusable templates for fast one-click assignments"}
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

        {/* Form Body (Scrollable) */}
        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
            {errorMsg ? (
              <div className="rounded-2xl bg-red-50 p-3 text-[13px] font-medium text-red-600">
                {errorMsg}
              </div>
            ) : null}

            {/* Subscriber & Template Picker row (if in assign or edit-assignment mode) */}
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
                          <option value="">{isAr ? "إنشاء برنامج فارغ مخصص" : "Start from blank custom"}</option>
                          {templates.map((tpl) => (
                            <option key={tpl.id} value={tpl.id}>
                              {tpl.title[locale]} ({tpl.format})
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="pointer-events-none absolute end-3 top-3 size-4 text-[#8c8c8c]" />
                      </div>
                    </div>
                  ) : (
                    <div>
                      <label className="block text-[12px] font-bold text-[#8c8c8c] mb-1">
                        {isAr ? "حفظ كإصدار جديد (الاحتفاظ بالأرشيف)" : "Version Control"}
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
                            ? `إنشاء إصدار جديد (v${(mode.program.version || 1) + 1}) وحفظ السجل الحالي`
                            : `Bump to new version (v${(mode.program.version || 1) + 1}) & retain history`}
                        </span>
                      </label>
                    </div>
                  )}
                </div>

                {/* Subscription & Entitlement pill */}
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
                        hasWorkoutEntitlement
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-amber-100 text-amber-800",
                      )}
                    >
                      {hasWorkoutEntitlement
                        ? isAr
                          ? "مخول للتمارين التدريبية"
                          : "Workout Entitled"
                        : isAr
                          ? "تنبيه: الباقة لا تتضمن برامج التمارين"
                          : "Note: Package has no workout entitlement"}
                    </span>
                  </div>
                ) : null}
              </div>
            ) : null}

            {/* Basic Program Info */}
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="block text-[12px] font-bold text-[#8c8c8c] mb-1">
                  {activeLangTab === "ar" ? "عنوان البرنامج (عربي) *" : "Program Title (English) *"}
                </label>
                {activeLangTab === "ar" ? (
                  <input
                    required
                    value={titleAr}
                    onChange={(e) => setTitleAr(e.target.value)}
                    placeholder="مثال: تضخم عضلي 4 أيام"
                    className="h-10 w-full rounded-xl border border-[#E0E0E0] bg-white px-3 text-[13px] font-semibold text-[var(--gym-ink,#063434)] outline-none focus:border-black"
                  />
                ) : (
                  <input
                    required
                    value={titleEn}
                    onChange={(e) => setTitleEn(e.target.value)}
                    placeholder="e.g. Hypertrophy 4-day Block"
                    className="h-10 w-full rounded-xl border border-[#E0E0E0] bg-white px-3 text-[13px] font-semibold text-[var(--gym-ink,#063434)] outline-none focus:border-black"
                  />
                )}
              </div>

              <div>
                <label className="block text-[12px] font-bold text-[#8c8c8c] mb-1">
                  {isAr ? "صيغة البرنامج" : "Program Format"}
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
                    {isAr ? "تفاعلي (أيام وتمارين)" : "Interactive (Days)"}
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

            {/* Description / Instructions */}
            <div>
              <label className="block text-[12px] font-bold text-[#8c8c8c] mb-1">
                {activeLangTab === "ar" ? "الوصف والإرشادات العامة (عربي)" : "General Description / Instructions (English)"}
              </label>
              {activeLangTab === "ar" ? (
                <textarea
                  rows={2}
                  value={descAr}
                  onChange={(e) => setDescAr(e.target.value)}
                  placeholder="تعليمات البرنامج، وتيرة التدريب، والإحماء..."
                  className="w-full rounded-xl border border-[#E0E0E0] bg-white p-2.5 text-[13px] text-[var(--gym-ink,#063434)] outline-none focus:border-black"
                />
              ) : (
                <textarea
                  rows={2}
                  value={descEn}
                  onChange={(e) => setDescEn(e.target.value)}
                  placeholder="Program overview, progression rules, and warm-up notes..."
                  className="w-full rounded-xl border border-[#E0E0E0] bg-white p-2.5 text-[13px] text-[var(--gym-ink,#063434)] outline-none focus:border-black"
                />
              )}
            </div>

            {/* If format is PDF: Content library PDF Picker */}
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
                      placeholder="e.g. Travel_Workouts_Guide.pdf"
                      className="h-10 w-full rounded-xl border border-[#E0E0E0] bg-white px-3 text-[13px] font-semibold text-[var(--gym-ink,#063434)] outline-none focus:border-black"
                    />
                  </div>
                </div>
              </div>
            ) : (
              /* If format is Interactive: Days & Exercises Manager */
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-[14px] font-extrabold text-[var(--gym-ink,#063434)]">
                    {isAr ? "جدول أيام التمارين الأسبوعي" : "Weekly Training Schedule"}
                  </span>
                  <button
                    type="button"
                    onClick={toggleCurrentDayRest}
                    className={cn(
                      "rounded-full px-3 py-1 text-[11px] font-bold transition",
                      currentDay.isRest
                        ? "bg-amber-100 text-amber-900"
                        : "bg-[#F4F4F4] text-[#8c8c8c] hover:bg-black/5",
                    )}
                  >
                    {currentDay.isRest
                      ? isAr
                        ? "يوم راحة (استشفاء)"
                        : "Rest Day"
                      : isAr
                        ? "تحويل ليوم راحة"
                        : "Set as Rest Day"}
                  </button>
                </div>

                {/* Day selector pills */}
                <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
                  {days.map((d) => {
                    const active = d.weekday === selectedWeekday
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
                            active
                              ? "text-white/70"
                              : d.isRest
                                ? "text-amber-600"
                                : "text-[#8c8c8c]",
                          )}
                        >
                          {d.isRest
                            ? isAr
                              ? "راحة"
                              : "Rest"
                            : `${d.exercises.length} ${isAr ? "تمارين" : "ex"}`}
                        </span>
                      </button>
                    )
                  })}
                </div>

                {/* Current Day Exercises Box */}
                <div className="rounded-2xl border border-[#EBEBEB] bg-[#FAFAFA] p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-heading text-[15px] font-extrabold text-[var(--gym-ink,#063434)]">
                        {isAr ? WEEKDAY_NAMES_AR[selectedWeekday] : WEEKDAY_NAMES_EN[selectedWeekday]}
                      </h4>
                      <p className="text-[12px] font-medium text-[#8c8c8c]">
                        {currentDay.isRest
                          ? isAr
                            ? "تم تعيين هذا اليوم كيوم استشفاء وراحة."
                            : "Rest day programmed for recovery."
                          : isAr
                            ? `${currentDay.exercises.length} تمارين مبرمجة لهذا اليوم.`
                            : `${currentDay.exercises.length} exercises programmed for this session.`}
                      </p>
                    </div>

                    {!currentDay.isRest ? (
                      <button
                        type="button"
                        onClick={addExerciseToCurrentDay}
                        className="inline-flex items-center gap-1.5 rounded-full bg-[var(--gym-ink,#063434)] px-3.5 py-1.5 text-[12px] font-bold text-white transition hover:opacity-95"
                      >
                        <Plus className="size-3.5" />
                        {isAr ? "إضافة تمرين" : "Add exercise"}
                      </button>
                    ) : null}
                  </div>

                  {/* Exercise items list */}
                  {!currentDay.isRest ? (
                    currentDay.exercises.length === 0 ? (
                      <div className="flex min-h-24 flex-col items-center justify-center rounded-xl bg-white p-4 text-center text-[13px] text-[#8c8c8c]">
                        <p>{isAr ? "لا توجد تمارين مضافة بعد لهذا اليوم." : "No exercises added to this session yet."}</p>
                        <button
                          type="button"
                          onClick={addExerciseToCurrentDay}
                          className="mt-2 text-[12px] font-bold text-[var(--gym-ink,#063434)] underline"
                        >
                          {isAr ? "+ إضافة أول تمرين" : "+ Add first exercise"}
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {currentDay.exercises.map((ex, idx) => {
                          const exName =
                            typeof ex.name === "string"
                              ? ex.name
                              : activeLangTab === "ar"
                                ? ex.name.ar
                                : ex.name.en

                          const exDesc =
                            typeof ex.description === "string"
                              ? ex.description
                              : activeLangTab === "ar"
                                ? ex.description?.ar
                                : ex.description?.en

                          const exNotes =
                            typeof ex.notes === "string"
                              ? ex.notes
                              : activeLangTab === "ar"
                                ? ex.notes?.ar
                                : ex.notes?.en

                          const linkedVideo = videoAssets.find(
                            (v) => v.id === ex.videoContentId,
                          )

                          return (
                            <div
                              key={ex.id}
                              className="rounded-2xl border border-[#E5E5E5] bg-white p-4 shadow-sm space-y-3"
                            >
                              <div className="flex items-center justify-between gap-2">
                                <span className="flex size-6 items-center justify-center rounded-full bg-[var(--gym-ink,#063434)] text-[11px] font-extrabold text-white">
                                  {idx + 1}
                                </span>
                                <input
                                  required
                                  value={exName}
                                  onChange={(e) => {
                                    const val = e.target.value
                                    const currentObj =
                                      typeof ex.name === "object"
                                        ? ex.name
                                        : { en: ex.name, ar: ex.name }
                                    updateExercise(ex.id, "name", {
                                      ...currentObj,
                                      [activeLangTab]: val,
                                    })
                                  }}
                                  placeholder={isAr ? "اسم التمرين (مثال: ضغط بنش)" : "Exercise name (e.g. Barbell Bench Press)"}
                                  className="h-9 flex-1 rounded-xl border border-[#E0E0E0] px-3 text-[13px] font-bold text-[var(--gym-ink,#063434)] outline-none focus:border-black"
                                />

                                <button
                                  type="button"
                                  onClick={() => removeExercise(ex.id)}
                                  className="flex size-8 shrink-0 items-center justify-center rounded-full text-red-500 hover:bg-red-50"
                                >
                                  <Trash2 className="size-4" />
                                </button>
                              </div>

                              {/* Numeric parameters: Sets, Reps, Rest */}
                              <div className="grid grid-cols-3 gap-2.5">
                                <div>
                                  <label className="block text-[11px] font-bold text-[#8c8c8c] mb-0.5">
                                    {isAr ? "المجموعات (Sets)" : "Sets"}
                                  </label>
                                  <input
                                    type="number"
                                    min={1}
                                    max={20}
                                    value={ex.sets ?? 3}
                                    onChange={(e) =>
                                      updateExercise(
                                        ex.id,
                                        "sets",
                                        parseInt(e.target.value, 10) || 3,
                                      )
                                    }
                                    className="h-8 w-full rounded-lg border border-[#E0E0E0] px-2 text-center text-[12px] font-bold text-[var(--gym-ink,#063434)]"
                                  />
                                </div>

                                <div>
                                  <label className="block text-[11px] font-bold text-[#8c8c8c] mb-0.5">
                                    {isAr ? "التكرار (Reps)" : "Reps"}
                                  </label>
                                  <input
                                    value={ex.reps ?? "10"}
                                    onChange={(e) =>
                                      updateExercise(ex.id, "reps", e.target.value)
                                    }
                                    placeholder="e.g. 8-10"
                                    className="h-8 w-full rounded-lg border border-[#E0E0E0] px-2 text-center text-[12px] font-bold text-[var(--gym-ink,#063434)]"
                                  />
                                </div>

                                <div>
                                  <label className="block text-[11px] font-bold text-[#8c8c8c] mb-0.5">
                                    {isAr ? "فترة الراحة" : "Rest Period"}
                                  </label>
                                  <select
                                    value={ex.restSeconds ?? 60}
                                    onChange={(e) =>
                                      updateExercise(
                                        ex.id,
                                        "restSeconds",
                                        parseInt(e.target.value, 10),
                                      )
                                    }
                                    className="h-8 w-full rounded-lg border border-[#E0E0E0] px-1 text-center text-[12px] font-bold text-[var(--gym-ink,#063434)]"
                                  >
                                    <option value={30}>30s</option>
                                    <option value={45}>45s</option>
                                    <option value={60}>60s (1m)</option>
                                    <option value={75}>75s</option>
                                    <option value={90}>90s (1.5m)</option>
                                    <option value={120}>120s (2m)</option>
                                    <option value={180}>180s (3m)</option>
                                  </select>
                                </div>
                              </div>

                              {/* Instructional Video selector from Content Library */}
                              <div>
                                <label className="block text-[11px] font-bold text-[#8c8c8c] mb-0.5">
                                  {isAr
                                    ? "فيديو تعليمي من مكتبة المحتوى"
                                    : "Instructional Video (Content Library)"}
                                </label>
                                <div className="flex items-center gap-2">
                                  <div className="relative flex-1">
                                    <select
                                      value={ex.videoContentId || ""}
                                      onChange={(e) =>
                                        updateExercise(
                                          ex.id,
                                          "videoContentId",
                                          e.target.value || undefined,
                                        )
                                      }
                                      className="h-8 w-full rounded-lg border border-[#E0E0E0] bg-white px-2 text-[12px] font-semibold text-[var(--gym-ink,#063434)] outline-none appearance-none pe-7"
                                    >
                                      <option value="">
                                        {isAr ? "بدون فيديو تعليمي" : "No video linked"}
                                      </option>
                                      {videoAssets.map((vid) => (
                                        <option key={vid.id} value={vid.id}>
                                          {vid.title[locale]} ({vid.durationSeconds ? `${vid.durationSeconds}s` : vid.fileName})
                                        </option>
                                      ))}
                                    </select>
                                    <ChevronDown className="pointer-events-none absolute end-2 top-2 size-4 text-[#8c8c8c]" />
                                  </div>

                                  {linkedVideo ? (
                                    <button
                                      type="button"
                                      onClick={() => setPreviewVideo(linkedVideo)}
                                      className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-[var(--gym-ink,#063434)] text-white hover:opacity-90"
                                      title={isAr ? "مشاهدة الفيديو" : "Preview video"}
                                    >
                                      <Play className="size-3.5 fill-current" />
                                    </button>
                                  ) : null}
                                </div>
                              </div>

                              {/* Instructions & Coaching notes */}
                              <div className="grid gap-2 sm:grid-cols-2">
                                <input
                                  value={exDesc || ""}
                                  onChange={(e) => {
                                    const val = e.target.value
                                    const cur =
                                      typeof ex.description === "object"
                                        ? ex.description
                                        : { en: "", ar: "" }
                                    updateExercise(ex.id, "description", {
                                      ...cur,
                                      [activeLangTab]: val,
                                    })
                                  }}
                                  placeholder={isAr ? "إرشادات الأداء والحركة..." : "Form cues / technique notes..."}
                                  className="h-8 w-full rounded-lg border border-[#E0E0E0] px-2 text-[11px] text-[var(--gym-ink,#063434)] outline-none focus:border-black"
                                />

                                <input
                                  value={exNotes || ""}
                                  onChange={(e) => {
                                    const val = e.target.value
                                    const cur =
                                      typeof ex.notes === "object"
                                        ? ex.notes
                                        : { en: "", ar: "" }
                                    updateExercise(ex.id, "notes", {
                                      ...cur,
                                      [activeLangTab]: val,
                                    })
                                  }}
                                  placeholder={isAr ? "ملاحظات إضافية (RPE، الحمل...)" : "Coaching note (e.g. RPE 8, drop set)..."}
                                  className="h-8 w-full rounded-lg border border-[#E0E0E0] px-2 text-[11px] text-[#8c8c8c] outline-none focus:border-black"
                                />
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )
                  ) : null}
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
                        ? "تأكيد وتعيين البرنامج"
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

      {/* Video Preview Modal integration */}
      {previewVideo ? (
        <ContentPreviewDialog
          asset={previewVideo}
          onClose={() => setPreviewVideo(null)}
        />
      ) : null}
    </div>,
    document.body,
  )
}
