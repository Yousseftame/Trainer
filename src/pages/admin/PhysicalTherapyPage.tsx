import { useMemo, useState } from "react"
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  HeartPulse,
  Pencil,
  Plus,
  Search,
  ShieldAlert,
  Trash2,
} from "lucide-react"
import { PTRecordFormDialog } from "@/components/dashboard/PTRecordFormDialog"
import { FilterChip, StatCard } from "@/components/dashboard/StatCard"
import { StatusBadge } from "@/components/dashboard/StatusBadge"
import {
  useDeletePTRecordMutation,
  usePTRecordsQuery,
  useSavePTRecordMutation,
} from "@/features/physicalTherapy/hooks"
import { useSubscribersQuery } from "@/features/subscribers/hooks"
import { useDocumentTitle } from "@/hooks/useDocumentTitle"
import { useLocale } from "@/hooks/useLocale"
import { formatDate } from "@/lib/format"
import { appToast } from "@/lib/toast"
import { cn } from "@/lib/utils"
import type {
  PhysicalTherapyRecord,
  PTAffectedArea,
  PTStatus,
} from "@/types/physicalTherapy"

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
  const { locale } = useLocale()
  const isAr = locale === "ar"
  useDocumentTitle(isAr ? "العلاج الطبيعي والتأهيل الحركي" : "Physical Therapy & Rehabilitation")

  const [query, setQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<PTStatus | "all">("all")
  const [areaFilter, setAreaFilter] = useState<PTAffectedArea | "all">("all")
  const [selectedRecordId, setSelectedRecordId] = useState<string>("")

  // Form Dialog
  const [formOpen, setFormOpen] = useState(false)
  const [editingRecord, setEditingRecord] = useState<PhysicalTherapyRecord | null>(null)

  const { data: records = [] } = usePTRecordsQuery()
  const { data: subscribers = [] } = useSubscribersQuery()

  const saveMutation = useSavePTRecordMutation()
  const deleteMutation = useDeletePTRecordMutation()

  // Stats
  const stats = useMemo(() => {
    const total = records.length
    const active = records.filter((r) => r.status === "active").length
    const recovering = records.filter((r) => r.status === "recovering").length
    const cleared = records.filter((r) => r.status === "cleared").length
    return { total, active, recovering, cleared }
  }, [records])

  // Filtered List
  const filteredRecords = useMemo(() => {
    const q = query.trim().toLowerCase()
    return records.filter((item) => {
      if (statusFilter !== "all" && item.status !== statusFilter) return false
      if (areaFilter !== "all" && item.affectedArea !== areaFilter) return false
      if (!q) return true

      const sub = subscribers.find((s) => s.id === item.subscriberId)
      const subName = sub?.displayName.toLowerCase() || item.subscriberName?.toLowerCase() || ""
      const titleEn = item.injuryTitle.en.toLowerCase()
      const titleAr = item.injuryTitle.ar

      return (
        subName.includes(q) ||
        titleEn.includes(q) ||
        titleAr.includes(q) ||
        item.affectedArea.toLowerCase().includes(q)
      )
    })
  }, [records, statusFilter, areaFilter, query, subscribers])

  const selectedRecord =
    filteredRecords.find((r) => r.id === selectedRecordId) ?? filteredRecords[0]

  async function handleToggleCleared(record: PhysicalTherapyRecord) {
    const nextStatus: PTStatus = record.status === "cleared" ? "active" : "cleared"
    await saveMutation.mutateAsync({
      ...record,
      status: nextStatus,
      clearanceDate: nextStatus === "cleared" ? new Date().toISOString().slice(0, 10) : null,
    })
    appToast.success(
      nextStatus === "cleared"
        ? isAr
          ? "تم تسجيل التعافي التام للمشترك"
          : "Subscriber marked as medically cleared"
        : isAr
          ? "تم إعادة فتح ملف التأهيل الحركي"
          : "Physical therapy record reopened",
    )
  }

  async function handleDelete(record: PhysicalTherapyRecord) {
    const confirmMsg = isAr
      ? `هل أنت متأكد من حذف ملف العلاج الطبيعي لـ "${record.subscriberName || record.subscriberId}"؟`
      : `Are you sure you want to delete the physical therapy record for "${record.subscriberName || record.subscriberId}"?`
    if (!window.confirm(confirmMsg)) return

    await deleteMutation.mutateAsync(record.id)
    appToast.success(isAr ? "تم حذف السجل بنجاح" : "Record deleted successfully")
  }

  return (
    <div className="flex flex-col gap-4 sm:gap-5">
      {/* Stat Cards */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
        <StatCard
          label={isAr ? "إجمالي الحالات المتابعة" : "Monitored Cases"}
          value={stats.total}
          icon={<HeartPulse className="size-4" strokeWidth={1.8} />}
        />
        <StatCard
          label={isAr ? "تأهيل حركي نشط" : "Active Rehabilitation"}
          value={stats.active}
          icon={<AlertTriangle className="size-4 text-amber-500" strokeWidth={1.8} />}
        />
        <StatCard
          label={isAr ? "في مرحلة الاستشفاء" : "In Recovery"}
          value={stats.recovering}
          icon={<Activity className="size-4 text-blue-500" strokeWidth={1.8} />}
        />
        <StatCard
          label={isAr ? "تعافي تام ومكتمل" : "Medically Cleared"}
          value={stats.cleared}
          icon={<CheckCircle2 className="size-4 text-emerald-500" strokeWidth={1.8} />}
        />
      </div>

      {/* Main Section */}
      <section className="rounded-[24px] bg-white p-4 sm:p-6 lg:p-7">
        <div className="flex flex-col gap-3.5">
          {/* Top row: Search input + Area filter dropdown + Action button */}
          <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
            <label className="relative w-full sm:max-w-[340px]">
              <Search className="pointer-events-none absolute start-3.5 top-1/2 size-4 -translate-y-1/2 text-[#8c8c8c]" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={isAr ? "بحث بالاسم أو الإصابة أو المنطقة..." : "Search subscriber, injury, or area..."}
                className="h-11 w-full rounded-full bg-[#F4F4F4] pe-4 ps-10 text-[14px] font-medium text-[var(--gym-ink,#063434)] outline-none placeholder:font-normal placeholder:text-[#8c8c8c]"
              />
            </label>

            <div className="flex shrink-0 items-center gap-2 sm:gap-2.5">
              <div className="relative inline-flex items-center">
                <select
                  value={areaFilter}
                  onChange={(e) => setAreaFilter(e.target.value as PTAffectedArea | "all")}
                  className="h-11 w-auto min-w-[130px] max-w-[170px] cursor-pointer appearance-none rounded-full bg-[#F4F4F4] pe-8 ps-4 text-[13px] font-bold text-[var(--gym-ink,#111111)] outline-none transition hover:bg-black/5 truncate"
                >
                  <option value="all">{isAr ? "كل المناطق" : "All Areas"}</option>
                  {Object.entries(AREA_LABELS).map(([key, label]) => (
                    <option key={key} value={key}>
                      {isAr ? label.ar : label.en}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute end-3 size-4 text-[#8c8c8c]" />
              </div>

              <button
                type="button"
                onClick={() => {
                  setEditingRecord(null)
                  setFormOpen(true)
                }}
                className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-full bg-[var(--gym-ink,#063434)] px-5 text-[13px] font-bold text-white transition hover:opacity-95"
              >
                <Plus className="size-4" strokeWidth={2} />
                {isAr ? "تقييم تأهيلي جديد" : "New Assessment"}
              </button>
            </div>
          </div>

          {/* Bottom row: Status Filter Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 pt-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <FilterChip active={statusFilter === "all"} onClick={() => setStatusFilter("all")}>
              {isAr ? "الكل" : "All"} ({records.length})
            </FilterChip>
            <FilterChip active={statusFilter === "active"} onClick={() => setStatusFilter("active")}>
              {isAr ? "تأهيل نشط" : "Active Rehab"} ({stats.active})
            </FilterChip>
            <FilterChip active={statusFilter === "recovering"} onClick={() => setStatusFilter("recovering")}>
              {isAr ? "في مرحلة الشفاء" : "Recovering"} ({stats.recovering})
            </FilterChip>
            <FilterChip active={statusFilter === "cleared"} onClick={() => setStatusFilter("cleared")}>
              {isAr ? "تعافي تام" : "Cleared"} ({stats.cleared})
            </FilterChip>
          </div>
        </div>

        {filteredRecords.length === 0 ? (
          <div className="mt-5 flex min-h-40 flex-col items-center justify-center rounded-[20px] bg-[#F4F4F4] p-6 text-center">
            <Activity className="size-8 text-[#8c8c8c] mb-2" strokeWidth={1.5} />
            <p className="text-[14px] font-bold text-[var(--gym-ink,#063434)]">
              {isAr ? "لا توجد سجلات علاج طبيعي تطابق هذا البحث" : "No physical therapy records found"}
            </p>
            <p className="mt-1 text-[12px] text-[#8c8c8c]">
              {isAr
                ? "يمكنك إنشاء تقييم جديد للمشتركين لتوثيق الإصابات وبدائل التمارين"
                : "Create a new assessment to document injuries and exercise substitutions"}
            </p>
          </div>
        ) : (
          <div className="mt-5 grid gap-4 lg:grid-cols-[280px_minmax(0,1fr)] xl:grid-cols-[300px_minmax(0,1fr)]">
            {/* Left list */}
            <div className="flex max-h-[620px] flex-col gap-2 overflow-y-auto pe-1">
              {filteredRecords.map((rec) => {
                const sub = subscribers.find((s) => s.id === rec.subscriberId)
                const active = rec.id === (selectedRecord?.id ?? "")
                const area = AREA_LABELS[rec.affectedArea]

                return (
                  <button
                    key={rec.id}
                    type="button"
                    onClick={() => setSelectedRecordId(rec.id)}
                    className={cn(
                      "rounded-2xl p-3.5 text-start transition-colors",
                      active
                        ? "bg-[var(--gym-ink,#063434)] text-white shadow-sm"
                        : "bg-[#F4F4F4] text-[var(--gym-ink,#063434)] hover:bg-[#ececec]",
                    )}
                  >
                    <div className="flex items-center justify-between gap-1">
                      <p className="truncate text-[14px] font-bold">
                        {sub?.displayName || rec.subscriberName || rec.subscriberId}
                      </p>
                      <span
                        className={cn(
                          "rounded-full px-2 py-0.5 text-[10px] font-bold shrink-0",
                          rec.status === "active"
                            ? "bg-red-500/20 text-red-700"
                            : rec.status === "recovering"
                              ? "bg-amber-500/20 text-amber-700"
                              : "bg-emerald-500/20 text-emerald-700",
                          active && "bg-white/20 text-white",
                        )}
                      >
                        {rec.status === "active"
                          ? isAr
                            ? "نشط"
                            : "Active"
                          : rec.status === "recovering"
                            ? isAr
                              ? "شفاء"
                              : "Recovering"
                            : isAr
                              ? "جاهز"
                              : "Cleared"}
                      </span>
                    </div>

                    <p
                      className={cn(
                        "mt-1 truncate text-[12px] font-medium",
                        active ? "text-white/80" : "text-[#555]",
                      )}
                    >
                      {rec.injuryTitle[locale] || rec.injuryTitle.en}
                    </p>

                    <div className="mt-2 flex items-center justify-between text-[11px] font-medium">
                      <span className={active ? "text-white/60" : "text-[#8c8c8c]"}>
                        {isAr ? area?.ar : area?.en} · {rec.restrictions.length} {isAr ? "موانع" : "restrictions"}
                      </span>
                      <span
                        className={cn(
                          "font-bold",
                          active ? "text-[var(--gym-lime,#b8fe22)]" : "text-emerald-700",
                        )}
                      >
                        {rec.rehabExercises.length} {isAr ? "تمارين تأهيل" : "rehab"}
                      </span>
                    </div>
                  </button>
                )
              })}
            </div>

            {/* Right: Selected PT Record Detail */}
            {selectedRecord ? (
              <div className="min-w-0 rounded-[22px] bg-[#F4F4F4] p-4 sm:p-6 flex flex-col gap-4">
                {/* Header */}
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between border-b border-black/5 pb-4">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="font-heading text-[20px] font-extrabold tracking-tight text-[var(--gym-ink,#063434)]">
                        {selectedRecord.subscriberName ||
                          subscribers.find((s) => s.id === selectedRecord.subscriberId)?.displayName}
                      </h2>
                      <StatusBadge
                        label={isAr ? AREA_LABELS[selectedRecord.affectedArea]?.ar : AREA_LABELS[selectedRecord.affectedArea]?.en}
                        tone="info"
                      />
                      <StatusBadge
                        label={
                          selectedRecord.severity === "mild"
                            ? isAr
                              ? "إصابة خفيفة"
                              : "Mild"
                            : selectedRecord.severity === "moderate"
                              ? isAr
                                ? "إصابة متوسطة"
                                : "Moderate"
                              : isAr
                                ? "إصابة شديدة"
                                : "Severe"
                        }
                        tone={selectedRecord.severity === "severe" ? "danger" : "warning"}
                      />
                      <StatusBadge
                        label={
                          selectedRecord.status === "active"
                            ? isAr
                              ? "تأهيل نشط"
                              : "Active Rehab"
                            : selectedRecord.status === "recovering"
                              ? isAr
                                ? "في مرحلة الشفاء"
                                : "Recovering"
                              : isAr
                                ? "معافى / مصرح بالتمرين"
                                : "Cleared"
                        }
                        tone={selectedRecord.status === "cleared" ? "success" : "muted"}
                      />
                    </div>

                    <p className="mt-1 font-heading text-[15px] font-bold text-[var(--gym-ink,#063434)]">
                      {selectedRecord.injuryTitle[locale] || selectedRecord.injuryTitle.en}
                    </p>

                    <div className="mt-1 flex flex-wrap items-center gap-3 text-[12px] text-[#8c8c8c]">
                      <span>
                        {isAr ? "تاريخ التشخيص: " : "Diagnosed: "}
                        {formatDate(selectedRecord.diagnosisDate, locale)}
                      </span>
                      {selectedRecord.nextEvaluationDate ? (
                        <span>
                          · {isAr ? "التقييم القادم: " : "Next eval: "}
                          {formatDate(selectedRecord.nextEvaluationDate, locale)}
                        </span>
                      ) : null}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleToggleCleared(selectedRecord)}
                      className={cn(
                        "inline-flex h-9 items-center gap-1.5 rounded-full px-3.5 text-[12px] font-bold transition shadow-xs",
                        selectedRecord.status === "cleared"
                          ? "bg-amber-50 text-amber-800 hover:bg-amber-100"
                          : "bg-emerald-50 text-emerald-800 hover:bg-emerald-100",
                      )}
                    >
                      <CheckCircle2 className="size-3.5" />
                      {selectedRecord.status === "cleared"
                        ? isAr
                          ? "إعادة فتح"
                          : "Reopen"
                        : isAr
                          ? "اعتماد التعافي"
                          : "Mark Cleared"}
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setEditingRecord(selectedRecord)
                        setFormOpen(true)
                      }}
                      className="flex size-9 items-center justify-center rounded-full bg-white text-[var(--gym-ink,#063434)] shadow-xs hover:bg-black/5"
                      title={isAr ? "تعديل الملف" : "Edit record"}
                    >
                      <Pencil className="size-4" />
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDelete(selectedRecord)}
                      className="flex size-9 items-center justify-center rounded-full bg-white text-red-500 shadow-xs hover:bg-red-50"
                      title={isAr ? "حذف السجل" : "Delete"}
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                </div>

                {/* Contraindications & Exercise Alternatives */}
                <div className="rounded-2xl bg-white p-4 sm:p-5 shadow-xs border border-red-100">
                  <div className="flex items-center gap-2 mb-3">
                    <ShieldAlert className="size-4 text-red-600" />
                    <h3 className="font-heading text-[15px] font-extrabold text-red-950">
                      {isAr ? "موانع الحركة والبدائل الآمنة الموصى بها في التمارين" : "Movement Contraindications & Exercise Substitutes"}
                    </h3>
                  </div>

                  {selectedRecord.restrictions.length === 0 ? (
                    <p className="text-[12px] text-[#8c8c8c]">
                      {isAr ? "لا توجد موانع حركة مسجلة حالياً." : "No specific movement restrictions recorded."}
                    </p>
                  ) : (
                    <div className="grid gap-3 sm:grid-cols-2">
                      {selectedRecord.restrictions.map((res) => (
                        <div
                          key={res.id}
                          className="flex flex-col gap-2 rounded-xl bg-red-50/40 p-3.5 border border-red-100"
                        >
                          <div className="flex items-start gap-2">
                            <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-red-100 text-[11px] font-black text-red-700">
                              ✕
                            </span>
                            <div>
                              <p className="text-[11px] font-bold uppercase tracking-wider text-red-600">
                                {isAr ? "ممنوع أداءه:" : "Prohibited:"}
                              </p>
                              <p className="text-[13px] font-bold text-red-900">
                                {res.prohibited[locale] || res.prohibited.en}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-start gap-2 pt-2 border-t border-red-100/80">
                            <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-[11px] font-black text-emerald-700">
                              ✓
                            </span>
                            <div>
                              <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">
                                {isAr ? "البديل الآمن المعتمد:" : "Approved Alternative:"}
                              </p>
                              <p className="text-[13px] font-bold text-emerald-950">
                                {res.safeAlternative[locale] || res.safeAlternative.en}
                              </p>
                              {res.equipment ? (
                                <p className="text-[11px] font-medium text-[#666] mt-0.5">
                                  {isAr ? "الأدوات: " : "Equipment: "}{res.equipment}
                                </p>
                              ) : null}
                            </div>
                          </div>

                          {res.reason ? (
                            <p className="text-[11px] text-[#777] italic ps-7">
                              {res.reason[locale] || res.reason.en}
                            </p>
                          ) : null}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Prescribed Rehab Protocol */}
                <div className="rounded-2xl bg-white p-4 sm:p-5 shadow-xs border border-blue-100">
                  <div className="flex items-center gap-2 mb-3">
                    <Activity className="size-4 text-blue-600" />
                    <h3 className="font-heading text-[15px] font-extrabold text-blue-950">
                      {isAr ? "بروتوكول تمارين التأهيل الحركي والعلاج الطبيعي" : "Prescribed Rehab & Mobility Protocol"}
                    </h3>
                  </div>

                  {selectedRecord.rehabExercises.length === 0 ? (
                    <p className="text-[12px] text-[#8c8c8c]">
                      {isAr ? "لم يتم إدراج تمارين تأهيل مخصصة." : "No specific rehab exercises listed."}
                    </p>
                  ) : (
                    <div className="grid gap-3 sm:grid-cols-3">
                      {selectedRecord.rehabExercises.map((reh) => (
                        <div
                          key={reh.id}
                          className="rounded-xl border border-blue-100 bg-blue-50/30 p-3.5 flex flex-col justify-between gap-2"
                        >
                          <div>
                            <p className="font-heading text-[13px] font-bold text-blue-950">
                              {reh.name[locale] || reh.name.en}
                            </p>
                            <div className="mt-1 flex items-center gap-2 text-[12px] font-bold text-blue-700">
                              <span>{reh.sets} {isAr ? "مجموعات" : "sets"} × {reh.reps}</span>
                              <span>·</span>
                              <span>{reh.frequency}</span>
                            </div>
                          </div>

                          {reh.notes ? (
                            <p className="text-[11px] text-[#666] leading-relaxed pt-2 border-t border-blue-100/80">
                              {reh.notes[locale] || reh.notes.en}
                            </p>
                          ) : null}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Therapist Clinical Notes */}
                {selectedRecord.therapistNotes ? (
                  <div className="rounded-2xl bg-white p-4 sm:p-5 shadow-xs">
                    <h4 className="text-[12px] font-bold uppercase tracking-wider text-[#8c8c8c] mb-1.5">
                      {isAr ? "ملاحظات وتوصيات أخصائي العلاج الطبيعي" : "Therapist Clinical Notes"}
                    </h4>
                    <p className="text-[13px] font-medium leading-relaxed text-[var(--gym-ink,#063434)]">
                      {selectedRecord.therapistNotes[locale] || selectedRecord.therapistNotes.en}
                    </p>
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>
        )}
      </section>

      {/* Form Dialog Modal */}
      <PTRecordFormDialog
        open={formOpen}
        onClose={() => setFormOpen(false)}
        initialRecord={editingRecord}
        onSave={async (record) => {
          await saveMutation.mutateAsync(record)
        }}
      />
    </div>
  )
}
