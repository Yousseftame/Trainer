import { useEffect, useMemo, useState } from "react"
import { createPortal } from "react-dom"
import {
  Activity,
  AlertTriangle,
  Check,
  ChevronDown,
  Plus,
  Trash2,
  X,
} from "lucide-react"
import { buildRestrictionMatchTokens } from "@/features/physicalTherapy/paths"
import type { SavePTRecordInput } from "@/features/physicalTherapy/service"
import { useContentAssetsQuery } from "@/features/content/hooks"
import { subscriberDisplayName } from "@/features/subscribers/types"
import { useSubscribersQuery } from "@/features/subscribers/hooks"
import { useLocale } from "@/hooks/useLocale"
import { allocateFirestoreId } from "@/lib/firebase/ids"
import { appToast } from "@/lib/toast"
import type {
  PhysicalTherapyRecord,
  PTAffectedArea,
  PTMovementRestriction,
  PTRehabExercise,
  PTSeverity,
  PTStatus,
} from "@/types/physicalTherapy"

interface PTRecordFormDialogProps {
  open: boolean
  onClose: () => void
  initialRecord?: PhysicalTherapyRecord | null
  /** Prefill subscriber when creating from subscriber detail */
  defaultSubscriberId?: string
  onSave: (record: SavePTRecordInput) => Promise<unknown>
}

function blankRestriction(): PTMovementRestriction {
  return {
    id: allocateFirestoreId(),
    prohibited: { en: "", ar: "" },
    safeAlternative: { en: "", ar: "" },
    reason: { en: "", ar: "" },
    equipment: "",
  }
}

function blankRehab(): PTRehabExercise {
  return {
    id: allocateFirestoreId(),
    name: { en: "", ar: "" },
    sets: 3,
    reps: "12-15 reps",
    frequency: "3x / week",
    notes: { en: "", ar: "" },
  }
}

const AFFECTED_AREAS: { key: PTAffectedArea; en: string; ar: string }[] = [
  { key: "shoulder", en: "Shoulder", ar: "الكتف" },
  { key: "knee", en: "Knee", ar: "الركبة" },
  { key: "lower_back", en: "Lower Back", ar: "أسفل الظهر / الفقرات القطنية" },
  { key: "neck", en: "Neck / Cervical", ar: "الرقبة / الفقرات العنقية" },
  { key: "ankle", en: "Ankle / Foot", ar: "الكاحل / القدم" },
  { key: "hip", en: "Hip / Pelvis", ar: "الحوض / مفصل الفخذ" },
  { key: "elbow", en: "Elbow", ar: "المرفق" },
  { key: "wrist", en: "Wrist / Hand", ar: "المعصم / اليد" },
  { key: "other", en: "Other", ar: "أخرى" },
]

export function PTRecordFormDialog({
  open,
  onClose,
  initialRecord,
  defaultSubscriberId,
  onSave,
}: PTRecordFormDialogProps) {
  const { locale } = useLocale()
  const isAr = locale === "ar"

  const { data: subscribers = [] } = useSubscribersQuery({ enabled: open })
  const { data: contentAssets = [] } = useContentAssetsQuery({ enabled: open })
  const videoAssets = useMemo(
    () =>
      contentAssets.filter(
        (asset) => asset.category === "exerciseVideo" || asset.kind === "video",
      ),
    [contentAssets],
  )

  const [subscriberId, setSubscriberId] = useState("")
  const [injuryEn, setInjuryEn] = useState("")
  const [injuryAr, setInjuryAr] = useState("")
  const [affectedArea, setAffectedArea] = useState<PTAffectedArea>("shoulder")
  const [severity, setSeverity] = useState<PTSeverity>("mild")
  const [status, setStatus] = useState<PTStatus>("active")
  const [diagnosisDate, setDiagnosisDate] = useState(
    new Date().toISOString().slice(0, 10),
  )
  const [nextEvaluationDate, setNextEvaluationDate] = useState("")
  const [notesEn, setNotesEn] = useState("")
  const [notesAr, setNotesAr] = useState("")
  const [restrictions, setRestrictions] = useState<PTMovementRestriction[]>([
    blankRestriction(),
  ])
  const [rehabExercises, setRehabExercises] = useState<PTRehabExercise[]>([
    blankRehab(),
  ])
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!open) return
    setSaving(false)
    if (initialRecord) {
      setSubscriberId(initialRecord.subscriberId)
      setInjuryEn(initialRecord.injuryTitle.en || "")
      setInjuryAr(initialRecord.injuryTitle.ar || "")
      setAffectedArea(initialRecord.affectedArea)
      setSeverity(initialRecord.severity)
      setStatus(initialRecord.status)
      setDiagnosisDate(initialRecord.diagnosisDate)
      setNextEvaluationDate(initialRecord.nextEvaluationDate || "")
      setNotesEn(initialRecord.therapistNotes?.en || "")
      setNotesAr(initialRecord.therapistNotes?.ar || "")
      setRestrictions(
        initialRecord.restrictions.length
          ? initialRecord.restrictions
          : [blankRestriction()],
      )
      setRehabExercises(
        initialRecord.rehabExercises.length
          ? initialRecord.rehabExercises
          : [blankRehab()],
      )
    } else {
      setSubscriberId(defaultSubscriberId || subscribers[0]?.id || "")
      setInjuryEn("")
      setInjuryAr("")
      setAffectedArea("shoulder")
      setSeverity("mild")
      setStatus("active")
      setDiagnosisDate(new Date().toISOString().slice(0, 10))
      setNextEvaluationDate("")
      setNotesEn("")
      setNotesAr("")
      setRestrictions([blankRestriction()])
      setRehabExercises([blankRehab()])
    }
  }, [open, initialRecord, defaultSubscriberId, subscribers])

  if (!open) return null

  function addRestriction() {
    setRestrictions((prev) => [...prev, blankRestriction()])
  }

  function removeRestriction(index: number) {
    setRestrictions((prev) => prev.filter((_, i) => i !== index))
  }

  function addRehabExercise() {
    setRehabExercises((prev) => [...prev, blankRehab()])
  }

  function removeRehabExercise(index: number) {
    setRehabExercises((prev) => prev.filter((_, i) => i !== index))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!subscriberId) {
      appToast.error(isAr ? "يرجى اختيار المشترك" : "Please select a subscriber")
      return
    }
    if (!injuryEn.trim() && !injuryAr.trim()) {
      appToast.error(
        isAr
          ? "يرجى إدخال اسم الإصابة أو الحالة"
          : "Please enter the injury name",
      )
      return
    }
    if (!diagnosisDate) {
      appToast.error(
        isAr ? "يرجى إدخال تاريخ التشخيص" : "Please enter the diagnosis date",
      )
      return
    }

    const cleanRestrictions = restrictions
      .filter((r) => r.prohibited.en.trim() || r.prohibited.ar.trim())
      .map((r) => ({
        ...r,
        prohibited: {
          en: r.prohibited.en.trim() || r.prohibited.ar.trim(),
          ar: r.prohibited.ar.trim() || r.prohibited.en.trim(),
        },
        safeAlternative: {
          en: r.safeAlternative.en.trim() || r.safeAlternative.ar.trim(),
          ar: r.safeAlternative.ar.trim() || r.safeAlternative.en.trim(),
        },
        matchTokens: buildRestrictionMatchTokens(r.prohibited),
      }))

    setSaving(true)
    try {
      await onSave({
        id: initialRecord?.id,
        subscriberId,
        injuryTitle: {
          en: injuryEn.trim() || injuryAr.trim(),
          ar: injuryAr.trim() || injuryEn.trim(),
        },
        affectedArea,
        severity,
        status,
        diagnosisDate,
        nextEvaluationDate: nextEvaluationDate || null,
        clearanceDate:
          status === "cleared"
            ? initialRecord?.clearanceDate ||
              new Date().toISOString().slice(0, 10)
            : null,
        restrictions: cleanRestrictions,
        rehabExercises: rehabExercises
          .filter((rx) => rx.name.en.trim() || rx.name.ar.trim())
          .map((rx) => ({
            ...rx,
            name: {
              en: rx.name.en.trim() || rx.name.ar.trim(),
              ar: rx.name.ar.trim() || rx.name.en.trim(),
            },
            sets: Math.max(1, Number(rx.sets) || 1),
            reps: rx.reps.trim() || "12-15",
            frequency: rx.frequency.trim() || "3x / week",
            videoContentId: rx.videoContentId?.trim() || undefined,
            videoUrl: rx.videoContentId?.trim()
              ? undefined
              : rx.videoUrl?.trim() || undefined,
          })),
        therapistNotes: {
          en: notesEn.trim(),
          ar: notesAr.trim() || notesEn.trim(),
        },
      })
      appToast.success(
        isAr
          ? "تم حفظ ملف العلاج الطبيعي والتأهيل بنجاح"
          : "Physical therapy record saved successfully",
      )
      onClose()
    } catch (err) {
      appToast.error(
        err instanceof Error
          ? err.message
          : isAr
            ? "فشل حفظ السجل"
            : "Failed to save record",
      )
    } finally {
      setSaving(false)
    }
  }

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-5">
      <div
        className="fixed inset-0 bg-black/60"
        onClick={onClose}
      />
      <div className="relative flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-[26px] bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-black/5 px-6 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex size-9 items-center justify-center rounded-full bg-[var(--gym-ink,#111111)] text-white">
              <Activity className="size-4" />
            </div>
            <div>
              <h2 className="font-heading text-[18px] font-extrabold text-[var(--gym-ink,#111111)]">
                {initialRecord
                  ? isAr
                    ? "تعديل ملف العلاج الطبيعي والتأهيل"
                    : "Edit Physical Therapy Record"
                  : isAr
                    ? "إضافة تقييم علاج طبيعي وتأهيل جديد"
                    : "New Physical Therapy & Rehab Record"}
              </h2>
              <p className="text-[12px] font-medium text-[#8c8c8c]">
                {isAr
                  ? "تسجيل الإصابات، موانع الحركة، البدائل الآمنة، وتمارين التأهيل"
                  : "Track injuries, contraindications, safe substitutes, and rehab protocol"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex size-8 items-center justify-center rounded-full text-[#8c8c8c] hover:bg-black/5 hover:text-black"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex flex-1 flex-col overflow-y-auto p-6 space-y-6">
          {/* Section 1: Subscriber & Core Status */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-[12px] font-bold text-[var(--gym-ink,#111111)]">
                {isAr ? "المشترك" : "Subscriber"} *
              </label>
              <select
                value={subscriberId}
                onChange={(e) => setSubscriberId(e.target.value)}
                disabled={Boolean(initialRecord)}
                className="h-11 w-full rounded-xl border border-black/10 bg-[#F8F8F8] px-3.5 text-[14px] font-medium text-[var(--gym-ink,#111111)] outline-none focus:border-[var(--gym-ink,#111111)]"
              >
                {subscribers
                  .filter((s) => s.status !== "rejected")
                  .map((s) => (
                    <option key={s.id} value={s.id}>
                      {subscriberDisplayName(s, locale)} ({s.email})
                    </option>
                  ))}
              </select>
            </div>

            <div>
              <label className="mb-1.5 block text-[12px] font-bold text-[var(--gym-ink,#111111)]">
                {isAr ? "المنطقة المصابة" : "Affected Area"} *
              </label>
              <select
                value={affectedArea}
                onChange={(e) => setAffectedArea(e.target.value as PTAffectedArea)}
                className="h-11 w-full rounded-xl border border-black/10 bg-[#F8F8F8] px-3.5 text-[14px] font-medium text-[var(--gym-ink,#111111)] outline-none focus:border-[var(--gym-ink,#111111)]"
              >
                {AFFECTED_AREAS.map((a) => (
                  <option key={a.key} value={a.key}>
                    {isAr ? a.ar : a.en}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Section 2: Injury Name Bilingual */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-[12px] font-bold text-[var(--gym-ink,#111111)]">
                {isAr ? "تشخيص الإصابة (إنجليزي)" : "Injury Diagnosis (EN)"} *
              </label>
              <input
                type="text"
                value={injuryEn}
                onChange={(e) => setInjuryEn(e.target.value)}
                placeholder="e.g. Right Rotator Cuff Tendonitis"
                className="h-11 w-full rounded-xl border border-black/10 bg-[#F8F8F8] px-3.5 text-[14px] font-medium text-[var(--gym-ink,#111111)] outline-none focus:border-[var(--gym-ink,#111111)]"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-[12px] font-bold text-[var(--gym-ink,#111111)]">
                {isAr ? "تشخيص الإصابة (عربي)" : "Injury Diagnosis (AR)"}
              </label>
              <input
                type="text"
                value={injuryAr}
                onChange={(e) => setInjuryAr(e.target.value)}
                placeholder="مثال: التهاب أوتار الكفة المدورة للكتف الأيمن"
                className="h-11 w-full rounded-xl border border-black/10 bg-[#F8F8F8] px-3.5 text-[14px] font-medium text-[var(--gym-ink,#111111)] outline-none focus:border-[var(--gym-ink,#111111)]"
              />
            </div>
          </div>

          {/* Section 3: Severity, Status & Dates */}
          <div className="grid gap-4 sm:grid-cols-4">
            <div>
              <label className="mb-1.5 block text-[12px] font-bold text-[var(--gym-ink,#111111)]">
                {isAr ? "درجة الإصابة" : "Severity"}
              </label>
              <select
                value={severity}
                onChange={(e) => setSeverity(e.target.value as PTSeverity)}
                className="h-11 w-full rounded-xl border border-black/10 bg-[#F8F8F8] px-3 text-[13px] font-bold text-[var(--gym-ink,#111111)] outline-none"
              >
                <option value="mild">{isAr ? "خفيفة (Mild)" : "Mild"}</option>
                <option value="moderate">{isAr ? "متوسطة (Moderate)" : "Moderate"}</option>
                <option value="severe">{isAr ? "شديدة (Severe)" : "Severe"}</option>
              </select>
            </div>

            <div>
              <label className="mb-1.5 block text-[12px] font-bold text-[var(--gym-ink,#111111)]">
                {isAr ? "حالة التأهيل" : "Rehab Status"}
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as PTStatus)}
                className="h-11 w-full rounded-xl border border-black/10 bg-[#F8F8F8] px-3 text-[13px] font-bold text-[var(--gym-ink,#111111)] outline-none"
              >
                <option value="active">{isAr ? "تأهيل نشط (Active)" : "Active Rehab"}</option>
                <option value="recovering">{isAr ? "في مرحلة الشفاء (Recovering)" : "Recovering"}</option>
                <option value="cleared">{isAr ? "تم الشفاء / جاهز (Cleared)" : "Cleared"}</option>
              </select>
            </div>

            <div>
              <label className="mb-1.5 block text-[12px] font-bold text-[var(--gym-ink,#111111)]">
                {isAr ? "تاريخ التشخيص" : "Diagnosis Date"}
              </label>
              <input
                type="date"
                value={diagnosisDate}
                onChange={(e) => setDiagnosisDate(e.target.value)}
                className="h-11 w-full rounded-xl border border-black/10 bg-[#F8F8F8] px-3 text-[13px] font-medium text-[var(--gym-ink,#111111)] outline-none"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-[12px] font-bold text-[var(--gym-ink,#111111)]">
                {isAr ? "موعد التقييم القادم" : "Next Evaluation"}
              </label>
              <input
                type="date"
                value={nextEvaluationDate}
                onChange={(e) => setNextEvaluationDate(e.target.value)}
                className="h-11 w-full rounded-xl border border-black/10 bg-[#F8F8F8] px-3 text-[13px] font-medium text-[var(--gym-ink,#111111)] outline-none"
              />
            </div>
          </div>

          {/* Section 4: Movement Restrictions & Safe Alternatives */}
          <div className="rounded-2xl border border-red-200/60 bg-red-50/30 p-4">
            <div className="flex items-center justify-between pb-3 border-b border-red-100">
              <div className="flex items-center gap-2">
                <AlertTriangle className="size-4 text-red-600" />
                <h3 className="font-heading text-[14px] font-extrabold text-red-900">
                  {isAr ? "موانع الحركة والبدائل الآمنة المقترحة" : "Contraindications & Safe Alternatives"}
                </h3>
              </div>
              <button
                type="button"
                onClick={addRestriction}
                className="inline-flex items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 text-[11px] font-bold text-red-700 shadow-xs hover:bg-red-50"
              >
                <Plus className="size-3.5" />
                {isAr ? "إضافة مانع / بديل" : "Add Restriction"}
              </button>
            </div>

            <div className="mt-3 space-y-3">
              {restrictions.map((res, idx) => (
                <div key={res.id} className="relative rounded-xl bg-white p-3.5 shadow-xs border border-red-100/80">
                  {restrictions.length > 1 ? (
                    <button
                      type="button"
                      onClick={() => removeRestriction(idx)}
                      className="absolute end-2.5 top-2.5 text-red-400 hover:text-red-700"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  ) : null}

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <label className="text-[11px] font-bold text-red-700 block mb-1">
                        {isAr ? "الحركة / التمرين الممنوع" : "Prohibited Exercise / Movement"}
                      </label>
                      <input
                        type="text"
                        value={res.prohibited.en}
                        onChange={(e) => {
                          const val = e.target.value
                          setRestrictions((prev) =>
                            prev.map((r, i) =>
                              i === idx
                                ? { ...r, prohibited: { ...r.prohibited, en: val, ar: r.prohibited.ar || val } }
                                : r,
                            ),
                          )
                        }}
                        placeholder="e.g. Overhead Barbell Shoulder Press"
                        className="h-9 w-full rounded-lg border border-black/10 bg-[#FAFAFA] px-2.5 text-[12px] outline-none"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-neutral-800 block mb-1">
                        {isAr ? "البديل الآمن المعتمد" : "Safe Prescribed Alternative"}
                      </label>
                      <input
                        type="text"
                        value={res.safeAlternative.en}
                        onChange={(e) => {
                          const val = e.target.value
                          setRestrictions((prev) =>
                            prev.map((r, i) =>
                              i === idx
                                ? { ...r, safeAlternative: { ...r.safeAlternative, en: val, ar: r.safeAlternative.ar || val } }
                                : r,
                            ),
                          )
                        }}
                        placeholder="e.g. Neutral-grip DB Press or Landmine Press"
                        className="h-9 w-full rounded-lg border border-black/10 bg-[#FAFAFA] px-2.5 text-[12px] outline-none"
                      />
                    </div>
                  </div>

                  <div className="mt-2.5">
                    <input
                      type="text"
                      value={res.reason?.en || ""}
                      onChange={(e) => {
                        const val = e.target.value
                        setRestrictions((prev) =>
                          prev.map((r, i) =>
                            i === idx
                              ? { ...r, reason: { en: val, ar: val } }
                              : r,
                          ),
                        )
                      }}
                      placeholder={isAr ? "السبب الطبي أو الميكانيكي الحيوي (اختياري)" : "Biomechanical or safety rationale (optional)"}
                      className="h-8 w-full rounded-lg border border-black/5 bg-[#FAFAFA] px-2.5 text-[11px] text-[#666] outline-none"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section 5: Prescribed Rehab Exercises */}
          <div className="rounded-2xl border border-blue-200/60 bg-blue-50/30 p-4">
            <div className="flex items-center justify-between pb-3 border-b border-blue-100">
              <div className="flex items-center gap-2">
                <Activity className="size-4 text-blue-600" />
                <h3 className="font-heading text-[14px] font-extrabold text-blue-900">
                  {isAr ? "تمارين التأهيل والعلاج الطبيعي الموصوفة" : "Prescribed Rehab & Mobility Exercises"}
                </h3>
              </div>
              <button
                type="button"
                onClick={addRehabExercise}
                className="inline-flex items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 text-[11px] font-bold text-blue-700 shadow-xs hover:bg-blue-50"
              >
                <Plus className="size-3.5" />
                {isAr ? "إضافة تمرين تأهيلي" : "Add Rehab Exercise"}
              </button>
            </div>

            <div className="mt-3 space-y-3">
              {rehabExercises.map((reh, idx) => (
                <div key={reh.id} className="relative rounded-xl bg-white p-3.5 shadow-xs border border-blue-100/80">
                  {rehabExercises.length > 1 ? (
                    <button
                      type="button"
                      onClick={() => removeRehabExercise(idx)}
                      className="absolute end-2.5 top-2.5 text-blue-400 hover:text-blue-700"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  ) : null}

                  <div className="grid gap-3 sm:grid-cols-3">
                    <div className="sm:col-span-1">
                      <label className="text-[11px] font-bold text-blue-900 block mb-1">
                        {isAr ? "اسم التمرين التأهيلي" : "Exercise Name"}
                      </label>
                      <input
                        type="text"
                        value={reh.name.en}
                        onChange={(e) => {
                          const val = e.target.value
                          setRehabExercises((prev) =>
                            prev.map((r, i) =>
                              i === idx
                                ? { ...r, name: { en: val, ar: r.name.ar || val } }
                                : r,
                            ),
                          )
                        }}
                        placeholder="e.g. Side-lying External Rotation"
                        className="h-9 w-full rounded-lg border border-black/10 bg-[#FAFAFA] px-2.5 text-[12px] outline-none"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-blue-900 block mb-1">
                        {isAr ? "المجموعات والتكرارات" : "Sets & Reps"}
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="number"
                          value={reh.sets}
                          onChange={(e) => {
                            const val = Number(e.target.value)
                            setRehabExercises((prev) =>
                              prev.map((r, i) => (i === idx ? { ...r, sets: val } : r)),
                            )
                          }}
                          className="h-9 w-16 rounded-lg border border-black/10 bg-[#FAFAFA] px-2 text-center text-[12px] outline-none"
                        />
                        <input
                          type="text"
                          value={reh.reps}
                          onChange={(e) => {
                            const val = e.target.value
                            setRehabExercises((prev) =>
                              prev.map((r, i) => (i === idx ? { ...r, reps: val } : r)),
                            )
                          }}
                          placeholder="e.g. 15 reps"
                          className="h-9 flex-1 rounded-lg border border-black/10 bg-[#FAFAFA] px-2.5 text-[12px] outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-blue-900 block mb-1">
                        {isAr ? "التكرار / الجدول" : "Frequency"}
                      </label>
                      <input
                        type="text"
                        value={reh.frequency}
                        onChange={(e) => {
                          const val = e.target.value
                          setRehabExercises((prev) =>
                            prev.map((r, i) => (i === idx ? { ...r, frequency: val } : r)),
                          )
                        }}
                        placeholder="e.g. Daily / 3x week"
                        className="h-9 w-full rounded-lg border border-black/10 bg-[#FAFAFA] px-2.5 text-[12px] outline-none"
                      />
                    </div>
                  </div>

                  <div className="mt-2.5 grid gap-2 sm:grid-cols-2">
                    <input
                      type="text"
                      value={reh.notes?.en || ""}
                      onChange={(e) => {
                        const val = e.target.value
                        setRehabExercises((prev) =>
                          prev.map((r, i) =>
                            i === idx
                              ? { ...r, notes: { en: val, ar: val } }
                              : r,
                          ),
                        )
                      }}
                      placeholder={isAr ? "تعليمات خاصة بالأداء والتكنيك" : "Cues, form notes, or tempo"}
                      className="h-8 w-full rounded-lg border border-black/5 bg-[#FAFAFA] px-2.5 text-[11px] text-[#666] outline-none"
                    />
                    <div className="relative">
                      <select
                        value={reh.videoContentId || ""}
                        onChange={(e) => {
                          const val = e.target.value || undefined
                          setRehabExercises((prev) =>
                            prev.map((r, i) =>
                              i === idx
                                ? {
                                    ...r,
                                    videoContentId: val,
                                    // Prefer library delivery — drop stale external URLs
                                    videoUrl: val ? undefined : r.videoUrl,
                                  }
                                : r,
                            ),
                          )
                        }}
                        className="h-8 w-full appearance-none rounded-lg border border-black/5 bg-[#FAFAFA] pe-7 ps-2.5 text-[11px] font-semibold text-[var(--gym-ink,#111111)] outline-none"
                      >
                        <option value="">
                          {isAr
                            ? "بدون فيديو من المكتبة"
                            : "No library video linked"}
                        </option>
                        {videoAssets.map((vid) => (
                          <option key={vid.id} value={vid.id}>
                            {vid.title[locale]}
                            {vid.durationSeconds
                              ? ` (${vid.durationSeconds}s)`
                              : ""}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="pointer-events-none absolute end-2 top-2 size-3.5 text-[#8c8c8c]" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section 6: Clinical Therapist Notes */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-[12px] font-bold text-[var(--gym-ink,#111111)]">
                {isAr ? "ملاحظات وتوصيات المعالج (إنجليزي)" : "Therapist Notes & Clinical Advice (EN)"}
              </label>
              <textarea
                value={notesEn}
                onChange={(e) => setNotesEn(e.target.value)}
                rows={3}
                placeholder="Clinical observations, progression criteria, next steps..."
                className="w-full rounded-xl border border-black/10 bg-[#F8F8F8] p-3 text-[13px] outline-none focus:border-[var(--gym-ink,#111111)]"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-[12px] font-bold text-[var(--gym-ink,#111111)]">
                {isAr ? "ملاحظات وتوصيات المعالج (عربي)" : "Therapist Notes & Clinical Advice (AR)"}
              </label>
              <textarea
                value={notesAr}
                onChange={(e) => setNotesAr(e.target.value)}
                rows={3}
                placeholder="ملاحظات سريرية، معايير التدرج في الأوزان، وخطة المرحلة التالية..."
                className="w-full rounded-xl border border-black/10 bg-[#F8F8F8] p-3 text-[13px] outline-none focus:border-[var(--gym-ink,#111111)]"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-black/5">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="h-11 rounded-full px-5 text-[13px] font-bold text-[#8c8c8c] hover:bg-black/5"
            >
              {isAr ? "إلغاء" : "Cancel"}
            </button>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-[var(--gym-ink,#111111)] px-6 text-[13px] font-bold text-white transition hover:opacity-95 disabled:opacity-50"
            >
              <Check className="size-4" />
              {saving
                ? isAr
                  ? "جارٍ الحفظ..."
                  : "Saving..."
                : isAr
                  ? "حفظ الملف"
                  : "Save Record"}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body,
  )
}
