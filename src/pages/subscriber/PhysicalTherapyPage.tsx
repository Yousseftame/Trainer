import { useEffect, useMemo, useState } from "react"
import { Link, useSearchParams } from "react-router-dom"
import {
  Activity,
  ArrowRight,
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Clapperboard,
  Dumbbell,
  HeartPulse,
  Info,
  Play,
  RefreshCw,
  ShieldAlert,
  Sparkles,
  UserCheck,
} from "lucide-react"
import { ContentPreviewDialog } from "@/components/dashboard/ContentPreviewDialog"
import { APP_ROUTES } from "@/config/constants"
import { useContentAssetsQuery } from "@/features/content/hooks"
import { useSubscriberPTRecordsQuery } from "@/features/physicalTherapy/hooks"
import { usePanelSubscriber } from "@/features/subscribers/use-panel-subscriber"
import { useDocumentTitle } from "@/hooks/useDocumentTitle"
import { useLocale } from "@/hooks/useLocale"
import type { ContentAsset } from "@/types/content"
import { formatDate } from "@/lib/format"
import { appToast } from "@/lib/toast"
import { cn } from "@/lib/utils"
import type { PTAffectedArea, PhysicalTherapyRecord } from "@/types/physicalTherapy"

const AREA_LABELS: Record<PTAffectedArea, { en: string; ar: string }> = {
  shoulder: { en: "Shoulder", ar: "الكتف" },
  knee: { en: "Knee", ar: "الركبة" },
  lower_back: { en: "Lower Back", ar: "أسفل الظهر" },
  neck: { en: "Neck", ar: "الرقبة" },
  ankle: { en: "Ankle", ar: "الكاحل" },
  hip: { en: "Hip", ar: "الحوض" },
  elbow: { en: "Elbow", ar: "المرفق" },
  wrist: { en: "Wrist", ar: "المعصم" },
  other: { en: "Other", ar: "أخرى" },
}

export function PhysicalTherapyPage() {
  const { locale, isRtl } = useLocale()
  const isAr = locale === "ar"
  useDocumentTitle(isAr ? "العلاج الطبيعي والتأهيل الحركي" : "Physical Therapy & Movement Rehab")

  const {
    staffCanPick,
    directory: subscribers,
    subscriberId: activeSubscriberId,
    selectedSubscriberId,
    setSelectedSubscriberId,
  } = usePanelSubscriber({ allowStaffPicker: true })

  const {
    data: records = [],
    isLoading,
    isError,
    refetch,
  } = useSubscriberPTRecordsQuery(activeSubscriberId)

  const { data: contentAssets = [] } = useContentAssetsQuery({
    audience: "subscriber",
    enabled: Boolean(activeSubscriberId),
  })

  const contentById = useMemo(() => {
    const map = new Map<string, ContentAsset>()
    for (const asset of contentAssets) map.set(asset.id, asset)
    return map
  }, [contentAssets])

  const [searchParams] = useSearchParams()
  const recordFromUrl = searchParams.get("record") || ""

  const [activeRecordId, setActiveRecordId] = useState<string>(recordFromUrl)
  const [previewAsset, setPreviewAsset] = useState<ContentAsset | null>(null)

  // Reset selected case when staff switches the previewed member.
  useEffect(() => {
    setActiveRecordId(recordFromUrl)
    setPreviewAsset(null)
  }, [activeSubscriberId, recordFromUrl])

  useEffect(() => {
    if (recordFromUrl) setActiveRecordId(recordFromUrl)
  }, [recordFromUrl])

  const activeRecord: PhysicalTherapyRecord | null = useMemo(() => {
    if (!records.length) return null
    if (activeRecordId) {
      const match = records.find((r) => r.id === activeRecordId)
      if (match) return match
    }
    return (
      records.find((r) => r.status === "active" || r.status === "recovering") ||
      records[0]
    )
  }, [records, activeRecordId])

  const areaLabel = activeRecord
    ? isAr
      ? AREA_LABELS[activeRecord.affectedArea]?.ar
      : AREA_LABELS[activeRecord.affectedArea]?.en
    : ""

  function openRehabVideo(reh: PhysicalTherapyRecord["rehabExercises"][number]) {
    if (reh.videoContentId) {
      const asset = contentById.get(reh.videoContentId)
      if (!asset || asset.accessAllowed === false) {
        appToast.error(
          isAr
            ? "الفيديو غير متاح في صلاحيات باقتك الحالية."
            : "This rehab video is locked for your current package.",
        )
        return
      }
      const url = asset.streamUrl || asset.fileUrl
      if (!url) {
        appToast.error(
          isAr
            ? "رابط التشغيل غير متاح. أعد فتح الصفحة أو تواصل مع المدرب."
            : "Stream URL unavailable. Refresh or contact your coach.",
        )
        return
      }
      setPreviewAsset(asset)
      return
    }
    if (reh.videoUrl) {
      // Legacy external URL — open in a synthetic preview shell
      setPreviewAsset({
        id: reh.id,
        category: "exerciseVideo",
        kind: "video",
        title: reh.name,
        description: reh.notes ?? { en: "", ar: "" },
        tags: [],
        visibility: "assigned",
        requiredEntitlement: "exerciseVideos",
        packageIds: [],
        subscriberIds: [],
        programIds: [],
        streamUrl: reh.videoUrl,
        fileUrl: reh.videoUrl,
        storagePath: "",
        sizeLabel: "",
        createdAt: "",
        updatedAt: "",
        accessAllowed: true,
      })
      return
    }
    appToast.error(
      isAr
        ? "لا يوجد فيديو مرتبط بهذا التمرين التأهيلي."
        : "No instructional video is linked to this rehab drill.",
    )
  }

  return (
    <div className="flex flex-col gap-5 pb-14">
      {/* ======================================================== */}
      {/* 1. Clean Top Header & Metric Highlights                  */}
      {/* ======================================================== */}
      <div className="flex flex-col gap-4">
        {/* Top Header Row (Matching Progress Page layout) */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="font-heading text-[20px] sm:text-[23px] font-black text-[var(--gym-ink,#111111)] tracking-tight">
                {isAr ? "العلاج الطبيعي والتأهيل الحركي" : "Physical Therapy & Movement Rehab"}
              </h1>
              {activeRecord ? (
                <span
                  className={cn(
                    "inline-flex h-7 items-center rounded-full px-2.5 text-[12px] font-bold whitespace-nowrap",
                    activeRecord.status === "active"
                      ? "bg-rose-100 text-rose-800"
                      : activeRecord.status === "recovering"
                        ? "bg-amber-100 text-amber-900"
                        : "bg-[var(--gym-lime,#fb5001)]/35 text-[var(--gym-ink,#111111)]",
                  )}
                >
                  {activeRecord.status === "active"
                    ? isAr
                      ? "تأهيل نشط"
                      : "Active Rehab"
                    : activeRecord.status === "recovering"
                      ? isAr
                        ? "في مرحلة الاستشفاء"
                        : "Recovering"
                      : isAr
                        ? "معافى / مصرح بالتمرين"
                        : "Medically Cleared"}
                </span>
              ) : null}
            </div>
            <p className="mt-0.5 text-[12px] sm:text-[13px] font-medium text-[#6B7280]">
              {isAr
                ? "بروتوكول معتمد للوقاية من الإصابات، موانع الحركة في الجيم، وبدائل التمارين الآمنة المعتمدة"
                : "Certified injury prevention protocols, gym contraindications, and approved safe movement substitutes."}
            </p>
          </div>

          {/* Action Buttons Row */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Admin Member Switcher (Only visible to staff/admin) */}
            {staffCanPick ? (
              <div className="flex items-center gap-1.5 rounded-full bg-[#F4F4F4] px-3 py-1.5 text-[11.5px] font-bold text-[var(--gym-ink,#111111)] border border-black/8">
                <UserCheck className="size-3.5 text-[var(--gym-lime,#fb5001)]" />
                <span className="hidden xs:inline">
                  {isAr ? "معاينة:" : "Member:"}
                </span>
                <select
                  value={selectedSubscriberId || activeSubscriberId}
                  onChange={(e) => {
                    setSelectedSubscriberId(e.target.value)
                    setActiveRecordId("")
                  }}
                  className="rounded-lg bg-white px-2 py-0.5 text-[11.5px] font-bold outline-none cursor-pointer"
                >
                  {subscribers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.displayName || s.email}
                    </option>
                  ))}
                </select>
              </div>
            ) : null}

            {/* View Workout Plan Button */}
            <Link
              to={APP_ROUTES.subscriber.workout}
              className="inline-flex h-9.5 sm:h-10 items-center justify-center gap-1.5 rounded-full bg-[var(--gym-ink,#111111)] hover:bg-[var(--gym-lime,#fb5001)] px-3.5 sm:px-4.5 text-[12px] sm:text-[12.5px] font-extrabold text-white shadow-2xs transition-all active:scale-95"
            >
              <Dumbbell className="size-3.5" />
              <span>{isAr ? "جدول التمارين اليومي" : "View Workout Plan"}</span>
            </Link>
          </div>
        </div>

        {/* Multiple Records Chips (if member has more than 1 assessment/history) */}
        {records.length > 1 ? (
          <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-1 no-scrollbar">
            <span className="text-[11.5px] font-bold text-[#8c8c8c] shrink-0">
              {isAr ? "السجلات المتاحة:" : "Assessments:"}
            </span>
            {records.map((rec) => {
              const isSelected = activeRecord?.id === rec.id
              const area = isAr ? AREA_LABELS[rec.affectedArea]?.ar : AREA_LABELS[rec.affectedArea]?.en
              return (
                <button
                  key={rec.id}
                  type="button"
                  onClick={() => setActiveRecordId(rec.id)}
                  className={cn(
                    "inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-[12px] font-bold transition shrink-0 border",
                    isSelected
                      ? "bg-[var(--gym-ink,#111111)] text-white border-transparent shadow-xs"
                      : "bg-white text-[var(--gym-ink,#111111)] border-black/10 hover:bg-neutral-50",
                  )}
                >
                  <span
                    className={cn(
                      "size-2 rounded-full",
                      rec.status === "active"
                        ? "bg-rose-500"
                        : rec.status === "recovering"
                          ? "bg-amber-500"
                          : "bg-neutral-400",
                    )}
                  />
                  <span>
                    {area} · {rec.injuryTitle[locale] || rec.injuryTitle.en}
                  </span>
                  <span
                    className={cn(
                      "text-[10px] px-1.5 py-0.2 rounded-full font-semibold",
                      isSelected ? "bg-white/20 text-white" : "bg-black/5 text-[#8c8c8c]",
                    )}
                  >
                    {rec.status === "cleared" ? (isAr ? "معافى" : "Cleared") : isAr ? "جاري التأهيل" : "Active"}
                  </span>
                </button>
              )
            })}
          </div>
        ) : null}

        {/* 4 Clean Metric Cards (Eye-Comfortable, Zero Green) */}
        {activeRecord ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {/* Card 1: Rehab State */}
            <div className="rounded-[20px] bg-white p-3.5 sm:p-4 border border-black/6 shadow-2xs flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[11.5px] font-bold text-[#8c8c8c]">
                  {isAr ? "حالة التأهيل" : "Rehab Status"}
                </span>
                <span className="flex size-7 items-center justify-center rounded-xl bg-black/5 text-[var(--gym-lime,#fb5001)]">
                  <Activity className="size-3.5" />
                </span>
              </div>
              <div className="mt-2.5">
                <p className="font-heading text-[15px] sm:text-[16px] font-extrabold text-[var(--gym-ink,#111111)]">
                  {activeRecord.status === "active"
                    ? isAr
                      ? "تأهيل نشط"
                      : "Active Rehab"
                    : activeRecord.status === "recovering"
                      ? isAr
                        ? "في مرحلة الاستشفاء"
                        : "In Recovery"
                      : isAr
                        ? "معافى تماماً"
                        : "Fully Cleared"}
                </p>
                <p className="text-[11px] font-semibold text-[#8c8c8c]">
                  {activeRecord.severity === "mild"
                    ? isAr
                      ? "درجة إصابة خفيفة"
                      : "Mild severity"
                    : activeRecord.severity === "moderate"
                      ? isAr
                        ? "درجة إصابة متوسطة"
                        : "Moderate severity"
                      : isAr
                        ? "إصابة شديدة تتطلب الحذر"
                        : "Severe severity"}
                </p>
              </div>
            </div>

            {/* Card 2: Affected Joint / Area */}
            <div className="rounded-[20px] bg-white p-3.5 sm:p-4 border border-black/6 shadow-2xs flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[11.5px] font-bold text-[#8c8c8c]">
                  {isAr ? "المنطقة المتأثرة" : "Target Joint"}
                </span>
                <span className="flex size-7 items-center justify-center rounded-xl bg-black/5 text-[var(--gym-lime,#fb5001)]">
                  <HeartPulse className="size-3.5" />
                </span>
              </div>
              <div className="mt-2.5">
                <p className="font-heading text-[15px] sm:text-[16px] font-extrabold text-[var(--gym-ink,#111111)]">
                  {areaLabel}
                </p>
                <p className="text-[11px] font-semibold text-[#8c8c8c] truncate">
                  {activeRecord.injuryTitle[locale] || activeRecord.injuryTitle.en}
                </p>
              </div>
            </div>

            {/* Card 3: Contraindications count */}
            <div className="rounded-[20px] bg-white p-3.5 sm:p-4 border border-black/6 shadow-2xs flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[11.5px] font-bold text-[#8c8c8c]">
                  {isAr ? "موانع الحركة والبدائل" : "Contraindications"}
                </span>
                <span className="flex size-7 items-center justify-center rounded-xl bg-black/5 text-[var(--gym-lime,#fb5001)]">
                  <ShieldAlert className="size-3.5" />
                </span>
              </div>
              <div className="mt-2.5">
                <p className="font-heading text-[15px] sm:text-[16px] font-extrabold text-[var(--gym-ink,#111111)]">
                  {activeRecord.restrictions.length} {isAr ? "حركات مقيدة" : "restrictions"}
                </p>
                <p className="text-[11px] font-semibold text-[#8c8c8c]">
                  {activeRecord.restrictions.length} {isAr ? "بدائل آمنة معتمدة" : "approved substitutes"}
                </p>
              </div>
            </div>

            {/* Card 4: Next Checkup / Dates */}
            <div className="rounded-[20px] bg-white p-3.5 sm:p-4 border border-black/6 shadow-2xs flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[11.5px] font-bold text-[#8c8c8c]">
                  {activeRecord.status === "cleared"
                    ? isAr
                      ? "تاريخ التعافي"
                      : "Clearance Date"
                    : isAr
                      ? "التقييم الطبي القادم"
                      : "Next Evaluation"}
                </span>
                <span className="flex size-7 items-center justify-center rounded-xl bg-black/5 text-[var(--gym-lime,#fb5001)]">
                  <Calendar className="size-3.5" />
                </span>
              </div>
              <div className="mt-2.5">
                <p className="font-heading text-[15px] sm:text-[16px] font-extrabold text-[var(--gym-ink,#111111)]">
                  {activeRecord.status === "cleared" && activeRecord.clearanceDate
                    ? formatDate(activeRecord.clearanceDate, locale)
                    : activeRecord.nextEvaluationDate
                      ? formatDate(activeRecord.nextEvaluationDate, locale)
                      : formatDate(activeRecord.diagnosisDate, locale)}
                </p>
                <p className="text-[11px] font-semibold text-[#8c8c8c]">
                  {isAr ? "تاريخ بدء التشخيص: " : "Diagnosed: "}
                  {formatDate(activeRecord.diagnosisDate, locale)}
                </p>
              </div>
            </div>
          </div>
        ) : null}
      </div>

      {/* ======================================================== */}
      {/* 2. Loading State / Empty State / Main Content            */}
      {/* ======================================================== */}
      {isLoading ? (
        <div className="flex min-h-60 flex-col items-center justify-center gap-2 rounded-[24px] bg-white p-8 text-sm text-[#8c8c8c] border border-black/6">
          <HeartPulse className="size-8 animate-pulse text-[var(--gym-lime,#fb5001)]" />
          <p>
            {isAr
              ? "جارٍ تحميل بروتوكول التأهيل..."
              : "Loading rehab protocol..."}
          </p>
        </div>
      ) : isError ? (
        <div className="flex min-h-60 flex-col items-center justify-center gap-3 rounded-[28px] bg-white p-8 text-center shadow-xs border border-black/6">
          <ShieldAlert className="size-10 text-rose-500 stroke-1" />
          <h2 className="font-heading text-[18px] font-extrabold text-[var(--gym-ink,#111111)]">
            {isAr ? "تعذر تحميل ملف التأهيل" : "Could not load rehab protocol"}
          </h2>
          <p className="max-w-md text-[13px] text-[#8c8c8c]">
            {isAr
              ? "سجلات العلاج الطبيعي محمية بصلاحيات الحساب. أعد المحاولة أو تواصل مع المدرب."
              : "Physical therapy records are account-protected. Retry or contact your coach."}
          </p>
          <button
            type="button"
            onClick={() => void refetch()}
            className="inline-flex items-center gap-2 rounded-full bg-[var(--gym-ink,#111111)] px-4 py-2 text-[12px] font-bold text-white"
          >
            <RefreshCw className="size-3.5" />
            {isAr ? "إعادة المحاولة" : "Retry"}
          </button>
        </div>
      ) : !activeRecord ? (
        /* Empty State: Subscriber has no injury records */
        <div className="flex min-h-64 flex-col items-center justify-center rounded-[28px] bg-white p-8 text-center shadow-xs border border-black/6">
          <div className="flex size-14 items-center justify-center rounded-2xl bg-[#111111] text-[var(--gym-orange,#fb5001)] mb-3 shadow-xs">
            <CheckCircle2 className="size-7" />
          </div>
          <h2 className="font-heading text-[19px] font-extrabold text-[var(--gym-ink,#111111)]">
            {isAr ? "لا توجد قيود حركية أو إصابات مسجلة" : "No Active Injury Restrictions"}
          </h2>
          <p className="mt-1.5 max-w-md text-[13px] text-[#8c8c8c] leading-relaxed">
            {isAr
              ? "ملفك الطبي وتدريبك في حالة ممتازة ولا توجد أي موانع حركة معتمدة. إذا شعرت بأي ألم أو احتكاك أثناء التمرين، أبلغ مدربك لإضافة بروتوكول استشفاء وتعديل التمارين فوراً."
              : "Your physical profile is clear! If you ever feel joint discomfort or pain during your sessions, reach out to your coach to prescribe safe alternatives."}
          </p>
          <div className="mt-5 flex flex-wrap items-center justify-center gap-2.5">
            <Link
              to={APP_ROUTES.subscriber.workout}
              className="inline-flex items-center gap-2 rounded-full bg-[var(--gym-ink,#111111)] px-5 py-2.5 text-[13px] font-bold text-white transition hover:opacity-95"
            >
              <Dumbbell className="size-4 text-[var(--gym-orange,#fb5001)]" />
              <span>{isAr ? "الانتقال إلى جدول التمارين" : "View Workout Plan"}</span>
            </Link>
            {staffCanPick && activeSubscriberId ? (
              <Link
                to={`${APP_ROUTES.admin.physicalTherapy}?subscriber=${activeSubscriberId}&new=1`}
                className="inline-flex items-center gap-2 rounded-full bg-[#F4F4F4] px-4 py-2.5 text-[13px] font-bold text-[var(--gym-ink,#111111)] hover:bg-[#e9e9e9]"
              >
                <span>
                  {isAr
                    ? "إضافة سجل تأهيل جديد للمتدرب"
                    : "Add PT Record in Admin"}
                </span>
              </Link>
            ) : null}
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-5">
          {/* Section 1: Contraindications & Exercise Alternatives */}
          <section className="rounded-[26px] bg-white p-5 sm:p-7 shadow-xs border border-black/6">
            <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between mb-4 border-b border-black/5 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="flex size-8 items-center justify-center rounded-xl bg-rose-100 text-rose-700">
                  <ShieldAlert className="size-4" strokeWidth={2.2} />
                </div>
                <div>
                  <h3 className="font-heading text-[16px] sm:text-[18px] font-black text-[var(--gym-ink,#111111)]">
                    {isAr ? "موانع الحركة والبدائل الآمنة في الجيم" : "Movement Contraindications & Approved Substitutes"}
                  </h3>
                  <p className="text-[12px] text-[#8c8c8c]">
                    {isAr
                      ? "تجنب الحركات التالية تماماً، واستبدلها بالبديل الآمن المعتمد لحماية المفصل من التدهور."
                      : "Avoid prohibited exercises to protect joint integrity. Use the approved safe substitute."}
                  </p>
                </div>
              </div>

              <span className="self-start sm:self-auto rounded-full bg-black/5 px-2.5 py-1 text-[11px] font-bold text-[var(--gym-ink,#111111)]">
                {activeRecord.restrictions.length} {isAr ? "بدائل معتمدة" : "substitutes"}
              </span>
            </div>

            {activeRecord.restrictions.length === 0 ? (
              <p className="text-[13px] text-[#8c8c8c] py-4 text-center">
                {isAr ? "لا توجد موانع حركة مسجلة لهذا البروتوكول." : "No specific movement restrictions recorded."}
              </p>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {activeRecord.restrictions.map((res) => (
                  <div
                    key={res.id}
                    className="flex flex-col justify-between gap-3.5 rounded-2xl border border-black/8 bg-[#FAF9F7] p-4 sm:p-5 shadow-2xs"
                  >
                    <div className="space-y-3.5">
                      {/* Prohibited Exercise Block */}
                      <div className="rounded-xl bg-rose-50/70 border border-rose-200/60 p-3.5 flex items-start gap-3">
                        <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-rose-600 text-white text-[12px] font-black shadow-xs">
                          ✕
                        </span>
                        <div className="min-w-0">
                          <p className="text-[10.5px] font-black uppercase tracking-wider text-rose-700">
                            {isAr ? "ممنوع أداءه نهائياً في الجيم:" : "Strictly Prohibited:"}
                          </p>
                          <p className="font-heading text-[14px] font-black text-rose-950 mt-0.5 leading-snug">
                            {res.prohibited[locale] || res.prohibited.en}
                          </p>
                        </div>
                      </div>

                      {/* Approved Safe Alternative Block */}
                      <div className="rounded-xl bg-white border border-black/10 p-3.5 shadow-2xs flex items-start gap-3">
                        <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-[var(--gym-ink,#111111)] text-white text-[12px] font-black shadow-xs">
                          ✓
                        </span>
                        <div className="min-w-0">
                          <p className="text-[10.5px] font-black uppercase tracking-wider text-[var(--gym-orange,#fb5001)]">
                            {isAr ? "البديل الآمن المعتمد لبرنامجك:" : "Approved Safe Substitute:"}
                          </p>
                          <p className="font-heading text-[14px] font-black text-[var(--gym-ink,#111111)] mt-0.5 leading-snug">
                            {res.safeAlternative[locale] || res.safeAlternative.en}
                          </p>
                          {res.equipment ? (
                            <span className="mt-1.5 inline-flex items-center gap-1 rounded-md bg-black/5 px-2 py-0.5 text-[10.5px] font-bold text-[#555]">
                              <span>{isAr ? "الأداة:" : "Equipment:"}</span>
                              <strong className="text-[var(--gym-ink,#111111)]">{res.equipment}</strong>
                            </span>
                          ) : null}
                        </div>
                      </div>
                    </div>

                    {/* Biomechanical Reason */}
                    {res.reason ? (
                      <div className="flex items-start gap-2 pt-2.5 border-t border-black/6 text-[11.5px] text-[#666] leading-relaxed">
                        <Info className="size-3.5 shrink-0 text-[#8c8c8c] mt-0.5" />
                        <span>
                          <strong className="text-[var(--gym-ink,#111111)]">
                            {isAr ? "الهدف الطبي: " : "Clinical Rationale: "}
                          </strong>
                          {res.reason[locale] || res.reason.en}
                        </span>
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Section 2: Prescribed Rehab Exercises */}
          <section className="rounded-[26px] bg-white p-5 sm:p-7 shadow-xs border border-black/6">
            <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between mb-4 border-b border-black/5 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="flex size-8 items-center justify-center rounded-xl bg-[var(--gym-ink,#111111)] text-[var(--gym-orange,#fb5001)]">
                  <Activity className="size-4" strokeWidth={2.2} />
                </div>
                <div>
                  <h3 className="font-heading text-[16px] sm:text-[18px] font-black text-[var(--gym-ink,#111111)]">
                    {isAr ? "تمارين التأهيل والاستشفاء الموصوفة لك" : "Prescribed Rehab & Mobility Routine"}
                  </h3>
                  <p className="text-[12px] text-[#8c8c8c]">
                    {isAr
                      ? "احرص على أداء هذه التمارين وفق التكرارات المحددة لتقوية العضلات المساندة واستعادة ثبات المفصل."
                      : "Perform these exercises according to the prescribed sets to restore joint stability and tissue resilience."}
                  </p>
                </div>
              </div>

              <span className="self-start sm:self-auto rounded-full bg-black/5 px-2.5 py-1 text-[11px] font-bold text-[var(--gym-ink,#111111)]">
                {activeRecord.rehabExercises.length} {isAr ? "تمارين مخصصة" : "rehab drills"}
              </span>
            </div>

            {activeRecord.rehabExercises.length === 0 ? (
              <p className="text-[13px] text-[#8c8c8c] py-4 text-center">
                {isAr ? "لم يتم إدراج تمارين تأهيل مخصصة حالياً." : "No specific rehab exercises listed."}
              </p>
            ) : (
              <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
                {activeRecord.rehabExercises.map((reh, idx) => (
                  <div
                    key={reh.id}
                    className="flex flex-col justify-between gap-3 rounded-2xl border border-black/8 bg-white p-4 sm:p-5 shadow-2xs hover:border-black/20 transition"
                  >
                    <div>
                      {/* Drill Header */}
                      <div className="flex items-center justify-between gap-2 mb-2.5">
                        <span className="flex size-6 items-center justify-center rounded-full bg-[var(--gym-ink,#111111)] text-[11px] font-black text-white">
                          #{idx + 1}
                        </span>
                        <span className="rounded-full bg-amber-50 px-2.5 py-0.5 text-[11px] font-bold text-amber-900 border border-amber-200/60">
                          {reh.frequency}
                        </span>
                      </div>

                      <h4 className="font-heading text-[14.5px] font-black text-[var(--gym-ink,#111111)] leading-snug">
                        {reh.name[locale] || reh.name.en}
                      </h4>

                      {/* Sets & Reps Pill */}
                      <div className="mt-2.5 inline-flex items-center gap-1.5 rounded-lg bg-[#F4F4F4] px-2.5 py-1 text-[12px] font-bold text-[var(--gym-ink,#111111)]">
                        <span>{reh.sets} {isAr ? "مجموعات" : "sets"}</span>
                        <span className="text-[#8c8c8c]">×</span>
                        <span>{reh.reps}</span>
                      </div>
                    </div>

                    {reh.notes ? (
                      <div className="rounded-xl bg-[#F8F9FA] p-3 text-[12px] text-[#555] leading-relaxed border border-black/5 mt-1">
                        <span className="font-bold text-[var(--gym-ink,#111111)] block text-[10.5px] uppercase tracking-wider mb-0.5">
                          {isAr ? "توجيهات الأداء الصحيح:" : "Form Cue:"}
                        </span>
                        {reh.notes[locale] || reh.notes.en}
                      </div>
                    ) : null}

                    {reh.videoContentId || reh.videoUrl ? (
                      <button
                        type="button"
                        onClick={() => openRehabVideo(reh)}
                        className="mt-1 inline-flex h-9 w-full items-center justify-center gap-2 rounded-full bg-[var(--gym-ink,#111111)] px-3 text-[12px] font-extrabold text-white transition hover:bg-[var(--gym-lime,#fb5001)]"
                      >
                        {reh.videoContentId ? (
                          <Clapperboard className="size-3.5 text-[var(--gym-lime,#fb5001)]" />
                        ) : (
                          <Play className="size-3.5 fill-current" />
                        )}
                        <span className="truncate">
                          {reh.videoContentId &&
                          contentById.get(reh.videoContentId)
                            ? isAr
                              ? `مشاهدة: ${contentById.get(reh.videoContentId)!.title[locale]}`
                              : `Watch: ${contentById.get(reh.videoContentId)!.title[locale]}`
                            : isAr
                              ? "مشاهدة فيديو التأهيل"
                              : "Watch rehab video"}
                        </span>
                      </button>
                    ) : null}
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Section 3: Therapist Clinical Notes */}
          {activeRecord.therapistNotes ? (
            <section className="rounded-[26px] bg-white p-5 sm:p-6 shadow-xs border border-black/6">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="size-4 text-[var(--gym-orange,#fb5001)]" />
                <h4 className="font-heading text-[14px] font-black uppercase tracking-wider text-[var(--gym-ink,#111111)]">
                  {isAr ? "توجيهات وملاحظات أخصائي التأهيل الرياضي" : "Therapist Clinical Guidance"}
                </h4>
              </div>
              <p className="text-[13.5px] font-medium leading-relaxed text-[#333] ps-6">
                {activeRecord.therapistNotes[locale] || activeRecord.therapistNotes.en}
              </p>
            </section>
          ) : null}

          {/* Section 4: Bottom Reassurance & Direct Link to Workout */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3.5 rounded-[22px] bg-[#111111] p-4 sm:p-5 text-white shadow-xs">
            <div className="flex items-center gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-white/10 text-[var(--gym-orange,#fb5001)]">
                <Dumbbell className="size-5" />
              </div>
              <div>
                <p className="font-heading text-[14.5px] font-bold text-white">
                  {isAr ? "تمارينك مصممة لحمايتك ومتابعة تقدمك" : "Safe Training Integration"}
                </p>
                <p className="text-[12px] text-white/70">
                  {isAr
                    ? "تم ربط هذه الموانع والبدائل مع جدولك التدريبي حتى تتدرب بأمان وبدون انقطاع."
                    : "These guidelines are integrated into your training schedule to keep you injury-free."}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <Link
                to={APP_ROUTES.subscriber.library}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-white/10 hover:bg-white/15 text-white px-4 py-2.5 text-[12.5px] font-bold transition"
              >
                <Clapperboard className="size-3.5 text-[var(--gym-lime,#fb5001)]" />
                <span>{isAr ? "مكتبة الملفات" : "Media Library"}</span>
              </Link>
              <Link
                to={APP_ROUTES.subscriber.workout}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-[var(--gym-orange,#fb5001)] hover:bg-[#e04500] text-white px-5 py-2.5 text-[12.5px] font-bold transition shadow-xs"
              >
                <span>
                  {isAr ? "الانتقال إلى جدول التمارين" : "Go to Workout Plan"}
                </span>
                {isRtl ? (
                  <ArrowLeft className="size-4" />
                ) : (
                  <ArrowRight className="size-4" />
                )}
              </Link>
            </div>
          </div>
        </div>
      )}

      <ContentPreviewDialog
        asset={previewAsset}
        onClose={() => setPreviewAsset(null)}
      />
    </div>
  )
}
