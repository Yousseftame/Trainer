import { useEffect, useState } from "react"
import { createPortal } from "react-dom"
import { Check, Plus, Trash2, X } from "lucide-react"
import type { DemoPackage } from "@/features/subscriptions/demo"
import {
  ENTITLEMENT_KEYS,
  normalizeEntitlements,
} from "@/features/subscriptions/entitlements"
import type { SavePackageInput } from "@/features/subscriptions/service"
import { useLocale } from "@/hooks/useLocale"
import { cn } from "@/lib/utils"
import type {
  PackageEntitlementKey,
  PackageEntitlements,
  PackageTone,
} from "@/types/subscription"

type PackageFormDialogProps = {
  open: boolean
  initialPackage?: DemoPackage | null
  busy?: boolean
  onClose: () => void
  onSubmit: (input: SavePackageInput) => Promise<void> | void
}

const DURATION_PRESETS = [30, 60, 90, 180, 365] as const

const ENTITLEMENT_LABELS: Record<
  PackageEntitlementKey,
  { ar: string; en: string }
> = {
  workoutProgram: { ar: "برامج التمارين", en: "Workout programs" },
  nutritionProgram: { ar: "خطط التغذية", en: "Nutrition plans" },
  exerciseVideos: { ar: "فيديوهات التمارين", en: "Exercise videos" },
  pdfDocuments: { ar: "ملفات ومستندات PDF", en: "PDF documents" },
  progressTracking: { ar: "تتبع التقدم والقياسات", en: "Progress tracking" },
}

const TONE_OPTIONS: Array<{
  value: PackageTone
  ar: string
  en: string
  swatch: string
}> = [
  { value: "light", ar: "فاتح", en: "Light", swatch: "bg-[#f5f5f5] border-black/15" },
  { value: "dark", ar: "داكن", en: "Dark", swatch: "bg-[#111111] border-[#111111]" },
  { value: "sage", ar: "بيج دافئ", en: "Warm neutral", swatch: "bg-[#eef1e8] border-black/15" },
]

export function PackageFormDialog({
  open,
  initialPackage,
  busy = false,
  onClose,
  onSubmit,
}: PackageFormDialogProps) {
  const { locale, isRtl } = useLocale()
  const isAr = locale === "ar"
  const isEditing = Boolean(initialPackage)

  const [nameAr, setNameAr] = useState("")
  const [nameEn, setNameEn] = useState("")
  const [descAr, setDescAr] = useState("")
  const [descEn, setDescEn] = useState("")
  const [priceAr, setPriceAr] = useState("")
  const [priceEn, setPriceEn] = useState("")
  const [periodAr, setPeriodAr] = useState("/شهر")
  const [periodEn, setPeriodEn] = useState("/month")
  const [durationDays, setDurationDays] = useState(30)
  const [tone, setTone] = useState<PackageTone>("light")
  const [featured, setFeatured] = useState(false)
  const [isActive, setIsActive] = useState(true)
  const [entitlements, setEntitlements] = useState<PackageEntitlements>(
    normalizeEntitlements(null),
  )
  const [featuresAr, setFeaturesAr] = useState<string[]>([""])
  const [featuresEn, setFeaturesEn] = useState<string[]>([""])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    setError(null)
    if (initialPackage) {
      setNameAr(initialPackage.name.ar)
      setNameEn(initialPackage.name.en)
      setDescAr(initialPackage.description.ar)
      setDescEn(initialPackage.description.en)
      setPriceAr(initialPackage.price.ar)
      setPriceEn(initialPackage.price.en)
      setPeriodAr(initialPackage.period.ar)
      setPeriodEn(initialPackage.period.en)
      setDurationDays(initialPackage.durationDays)
      setTone(initialPackage.tone)
      setFeatured(initialPackage.featured)
      setIsActive(initialPackage.isActive)
      setEntitlements(normalizeEntitlements(initialPackage.entitlements))
      const count = Math.max(
        1,
        initialPackage.featureList.ar.length,
        initialPackage.featureList.en.length,
      )
      setFeaturesAr(
        Array.from({ length: count }, (_, i) => initialPackage.featureList.ar[i] ?? ""),
      )
      setFeaturesEn(
        Array.from({ length: count }, (_, i) => initialPackage.featureList.en[i] ?? ""),
      )
    } else {
      setNameAr("")
      setNameEn("")
      setDescAr("")
      setDescEn("")
      setPriceAr("١٨٩ ج.م")
      setPriceEn("EGP 189")
      setPeriodAr("/شهر")
      setPeriodEn("/month")
      setDurationDays(30)
      setTone("light")
      setFeatured(false)
      setIsActive(true)
      setEntitlements(normalizeEntitlements(null))
      setFeaturesAr(["خطة تمارين وتغذية مخصصة", "متابعة أسبوعية للنتائج"])
      setFeaturesEn([
        "Customized workout & nutrition plan",
        "Weekly progress check-ins",
      ])
    }
  }, [open, initialPackage])

  useEffect(() => {
    if (!open) return
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && !busy) onClose()
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [open, busy, onClose])

  if (!open) return null

  function toggleEntitlement(key: PackageEntitlementKey) {
    setEntitlements((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  function addFeatureRow() {
    setFeaturesAr((prev) => [...prev, ""])
    setFeaturesEn((prev) => [...prev, ""])
  }

  function removeFeatureRow(index: number) {
    setFeaturesAr((prev) => (prev.length > 1 ? prev.filter((_, i) => i !== index) : [""]))
    setFeaturesEn((prev) => (prev.length > 1 ? prev.filter((_, i) => i !== index) : [""]))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!nameAr.trim() && !nameEn.trim()) {
      setError(
        isAr
          ? "يرجى إدخال اسم الباقة بالعربية أو الإنجليزية."
          : "Please enter the package name.",
      )
      return
    }
    if (!priceAr.trim() && !priceEn.trim()) {
      setError(
        isAr ? "يرجى إدخال سعر الباقة." : "Please enter the package price.",
      )
      return
    }

    const cleanAr = featuresAr.map((s) => s.trim())
    const cleanEn = featuresEn.map((s) => s.trim())
    const finalAr: string[] = []
    const finalEn: string[] = []

    for (let i = 0; i < Math.max(cleanAr.length, cleanEn.length); i++) {
      const a = cleanAr[i] || cleanEn[i] || ""
      const b = cleanEn[i] || cleanAr[i] || ""
      if (a || b) {
        finalAr.push(a)
        finalEn.push(b)
      }
    }

    await onSubmit({
      id: initialPackage?.id,
      name: {
        ar: nameAr.trim() || nameEn.trim(),
        en: nameEn.trim() || nameAr.trim(),
      },
      description: {
        ar: descAr.trim() || descEn.trim(),
        en: descEn.trim() || descAr.trim(),
      },
      price: {
        ar: priceAr.trim() || priceEn.trim(),
        en: priceEn.trim() || priceAr.trim(),
      },
      period: {
        ar: periodAr.trim() || periodEn.trim() || "/شهر",
        en: periodEn.trim() || periodAr.trim() || "/month",
      },
      durationDays: Math.max(1, Number(durationDays) || 30),
      tone,
      featured,
      isActive,
      sortOrder: initialPackage?.sortOrder,
      featureList: {
        ar: finalAr,
        en: finalEn,
      },
      entitlements,
    })
  }

  const inputClass =
    "h-11 w-full rounded-[16px] border border-black/10 bg-[#F7F7F7] px-3.5 text-[14px] font-medium text-[#111111] outline-none transition-colors focus:border-[#111111] focus:bg-white"

  if (typeof document === "undefined") return null

  return createPortal(
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center bg-black/50 p-3 backdrop-blur-[3px] sm:p-5"
      onClick={() => {
        if (!busy) onClose()
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        dir={isRtl ? "rtl" : "ltr"}
        style={{
          fontFamily: isAr ? "var(--font-arabic)" : "var(--font-sans)",
        }}
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[90dvh] w-full max-w-[660px] flex-col overflow-hidden rounded-[28px] bg-white shadow-[0_24px_70px_rgba(0,0,0,0.25)]"
      >
        <div className="flex items-center justify-between border-b border-black/[0.07] px-6 py-4 sm:px-7 sm:py-5">
          <div>
            <h2 className="text-[20px] font-bold tracking-tight text-[#0d1117] sm:text-[22px]">
              {isEditing
                ? isAr
                  ? "تعديل الباقة"
                  : "Edit package"
                : isAr
                  ? "إنشاء باقة جديدة"
                  : "Create new package"}
            </h2>
            <p className="mt-0.5 text-[13px] font-medium text-[#6B7280]">
              {isAr
                ? "حدد تفاصيل الباقة بالعربية والإنجليزية، المدة بالأيام، وصلاحيات الوصول للمحتوى."
                : "Configure bilingual package details, duration in days, and content access rules."}
            </p>
          </div>
          <button
            type="button"
            disabled={busy}
            onClick={onClose}
            className="inline-flex size-9 items-center justify-center rounded-full bg-[#F4F4F4] text-[#111111] transition-colors hover:bg-black/10"
            aria-label={isAr ? "إغلاق" : "Close"}
          >
            <X className="size-4" strokeWidth={2} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
          <div className="no-scrollbar flex-1 space-y-5 overflow-y-auto px-6 py-5 sm:px-7">
            {error ? (
              <div className="rounded-[16px] bg-rose-50 px-4 py-3 text-[13px] font-semibold text-rose-700">
                {error}
              </div>
            ) : null}

            {/* Bilingual Name */}
            <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
              <label className="flex flex-col gap-1.5">
                <span className="text-[12px] font-bold text-[#374151]">
                  {isAr ? "اسم الباقة (بالعربية) *" : "Package name (Arabic) *"}
                </span>
                <input
                  dir="rtl"
                  value={nameAr}
                  onChange={(e) => setNameAr(e.target.value)}
                  placeholder="مثال: تحوّل"
                  className={inputClass}
                />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="text-[12px] font-bold text-[#374151]">
                  {isAr ? "اسم الباقة (بالإنجليزية)" : "Package name (English) *"}
                </span>
                <input
                  dir="ltr"
                  value={nameEn}
                  onChange={(e) => setNameEn(e.target.value)}
                  placeholder="e.g. Transform"
                  className={inputClass}
                />
              </label>
            </div>

            {/* Bilingual Description */}
            <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
              <label className="flex flex-col gap-1.5">
                <span className="text-[12px] font-bold text-[#374151]">
                  {isAr ? "الوصف المختصر (بالعربية)" : "Short description (Arabic)"}
                </span>
                <input
                  dir="rtl"
                  value={descAr}
                  onChange={(e) => setDescAr(e.target.value)}
                  placeholder="تدريب 12 أسبوعاً مع التمارين والتغذية"
                  className={inputClass}
                />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="text-[12px] font-bold text-[#374151]">
                  {isAr ? "الوصف المختصر (بالإنجليزية)" : "Short description (English)"}
                </span>
                <input
                  dir="ltr"
                  value={descEn}
                  onChange={(e) => setDescEn(e.target.value)}
                  placeholder="12-week coaching with workouts & nutrition"
                  className={inputClass}
                />
              </label>
            </div>

            {/* Price & Period */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <label className="flex flex-col gap-1.5">
                <span className="text-[12px] font-bold text-[#374151]">
                  {isAr ? "السعر (عربي)" : "Price (AR)"}
                </span>
                <input
                  dir="rtl"
                  value={priceAr}
                  onChange={(e) => setPriceAr(e.target.value)}
                  placeholder="١٨٩ ج.م"
                  className={inputClass}
                />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="text-[12px] font-bold text-[#374151]">
                  {isAr ? "الفترة (عربي)" : "Period (AR)"}
                </span>
                <input
                  dir="rtl"
                  value={periodAr}
                  onChange={(e) => setPeriodAr(e.target.value)}
                  placeholder="/شهر"
                  className={inputClass}
                />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="text-[12px] font-bold text-[#374151]">
                  {isAr ? "السعر (إنجليزي)" : "Price (EN)"}
                </span>
                <input
                  dir="ltr"
                  value={priceEn}
                  onChange={(e) => setPriceEn(e.target.value)}
                  placeholder="EGP 189"
                  className={inputClass}
                />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="text-[12px] font-bold text-[#374151]">
                  {isAr ? "الفترة (إنجليزي)" : "Period (EN)"}
                </span>
                <input
                  dir="ltr"
                  value={periodEn}
                  onChange={(e) => setPeriodEn(e.target.value)}
                  placeholder="/month"
                  className={inputClass}
                />
              </label>
            </div>

            {/* Duration in days */}
            <div className="flex flex-col gap-2">
              <span className="text-[12px] font-bold text-[#374151]">
                {isAr ? "مدة الاشتراك (بالأيام)" : "Subscription duration (days)"}
              </span>
              <div className="flex flex-wrap items-center gap-2">
                <input
                  type="number"
                  min={1}
                  max={1095}
                  value={durationDays}
                  onChange={(e) => setDurationDays(Math.max(1, Number(e.target.value) || 1))}
                  className="h-10 w-24 rounded-full border border-black/10 bg-[#F7F7F7] px-3.5 text-center text-[14px] font-bold text-[#111111] outline-none focus:border-[#111111] focus:bg-white"
                />
                {DURATION_PRESETS.map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setDurationDays(preset)}
                    className={cn(
                      "inline-flex h-9 items-center rounded-full px-3.5 text-[12px] font-bold transition-colors",
                      durationDays === preset
                        ? "bg-[#111111] text-white"
                        : "bg-[#F4F4F4] text-[#374151] hover:bg-black/10",
                    )}
                  >
                    {isAr ? `${preset} يوم` : `${preset}d`}
                  </button>
                ))}
              </div>
            </div>

            {/* Content Access Rules (Entitlements) */}
            <div className="rounded-[20px] border border-black/[0.08] bg-[#FAFAFA] p-4">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <h3 className="text-[13px] font-bold text-[#111111]">
                    {isAr
                      ? "صلاحيات الوصول للمحتوى (قواعد الباقة)"
                      : "Package content access rules (entitlements)"}
                  </h3>
                  <p className="text-[12px] font-medium text-[#6B7280]">
                    {isAr
                      ? "حدد الأقسام والمحتوى المتاح للمشتركين في هذه الباقة."
                      : "Select which platform modules subscribers on this package can access."}
                  </p>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {ENTITLEMENT_KEYS.map((key) => {
                  const enabled = entitlements[key]
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => toggleEntitlement(key)}
                      className={cn(
                        "inline-flex h-9 items-center gap-2 rounded-full border px-3.5 text-[12px] font-bold transition-colors",
                        enabled
                          ? "border-[#111111] bg-[#111111] text-white"
                          : "border-black/12 bg-white text-[#6B7280] hover:border-black/25",
                      )}
                    >
                      <span
                        className={cn(
                          "inline-flex size-4 items-center justify-center rounded-full",
                          enabled ? "bg-[#fb5001] text-white" : "bg-black/10 text-transparent",
                        )}
                      >
                        <Check className="size-2.5" strokeWidth={3} />
                      </span>
                      {ENTITLEMENT_LABELS[key][locale]}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Card Style & Status */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <span className="text-[12px] font-bold text-[#374151]">
                  {isAr ? "مظهر البطاقة" : "Card appearance"}
                </span>
                <div className="flex gap-2">
                  {TONE_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setTone(opt.value)}
                      className={cn(
                        "inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-full border px-3 text-[12px] font-bold transition-colors",
                        tone === opt.value
                          ? "border-[#111111] bg-[#111111] text-white"
                          : "border-black/10 bg-[#F7F7F7] text-[#374151]",
                      )}
                    >
                      <span className={cn("size-3 rounded-full border", opt.swatch)} />
                      {opt[locale]}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <span className="text-[12px] font-bold text-[#374151]">
                  {isAr ? "التمييز والحالة" : "Badge & visibility"}
                </span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setFeatured((v) => !v)}
                    className={cn(
                      "inline-flex h-10 flex-1 items-center justify-center rounded-full border px-3 text-[12px] font-bold transition-colors",
                      featured
                        ? "border-[#fb5001] bg-[#fb5001] text-white"
                        : "border-black/10 bg-[#F7F7F7] text-[#374151]",
                    )}
                  >
                    {isAr ? "الأفضل قيمة ★" : "Best value ★"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsActive((v) => !v)}
                    className={cn(
                      "inline-flex h-10 flex-1 items-center justify-center rounded-full border px-3 text-[12px] font-bold transition-colors",
                      isActive
                        ? "border-emerald-600 bg-emerald-600 text-white"
                        : "border-black/10 bg-[#F7F7F7] text-[#6B7280]",
                    )}
                  >
                    {isActive
                      ? isAr
                        ? "منشورة (نشطة)"
                        : "Live (Active)"
                      : isAr
                        ? "مؤرشفة"
                        : "Archived"}
                  </button>
                </div>
              </div>
            </div>

            {/* Feature bullet rows */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-[12px] font-bold text-[#374151]">
                  {isAr ? "مميزات الباقة" : "Package features"}
                </span>
                <button
                  type="button"
                  onClick={addFeatureRow}
                  className="inline-flex h-8 items-center gap-1 rounded-full bg-[#F4F4F4] px-3 text-[12px] font-bold text-[#111111] hover:bg-black/10"
                >
                  <Plus className="size-3.5" strokeWidth={2.2} />
                  {isAr ? "إضافة ميزة" : "Add feature"}
                </button>
              </div>
              <div className="space-y-2">
                {featuresAr.map((featAr, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <input
                      dir="rtl"
                      value={featAr}
                      onChange={(e) => {
                        const val = e.target.value
                        setFeaturesAr((prev) =>
                          prev.map((item, i) => (i === idx ? val : item)),
                        )
                      }}
                      placeholder={isAr ? "الميزة بالعربية" : "Feature (Arabic)"}
                      className={cn(inputClass, "h-10 text-[13px]")}
                    />
                    <input
                      dir="ltr"
                      value={featuresEn[idx] ?? ""}
                      onChange={(e) => {
                        const val = e.target.value
                        setFeaturesEn((prev) =>
                          prev.map((item, i) => (i === idx ? val : item)),
                        )
                      }}
                      placeholder={isAr ? "الميزة بالإنجليزية" : "Feature (English)"}
                      className={cn(inputClass, "h-10 text-[13px]")}
                    />
                    <button
                      type="button"
                      onClick={() => removeFeatureRow(idx)}
                      className="inline-flex size-9 shrink-0 items-center justify-center rounded-full text-[#8c8c8c] hover:bg-rose-50 hover:text-rose-600"
                      aria-label={isAr ? "حذف الميزة" : "Remove feature"}
                    >
                      <Trash2 className="size-4" strokeWidth={1.8} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2.5 border-t border-black/[0.07] bg-white px-6 py-4 sm:px-7">
            <button
              type="button"
              disabled={busy}
              onClick={onClose}
              className="inline-flex h-11 items-center justify-center rounded-full border border-black/12 bg-white px-6 text-[14px] font-bold text-[#111111] transition-colors hover:bg-black/[0.03]"
            >
              {isAr ? "إلغاء" : "Cancel"}
            </button>
            <button
              type="submit"
              disabled={busy}
              className="inline-flex h-11 items-center justify-center rounded-full bg-[#0d1117] px-7 text-[14px] font-bold text-white transition-colors hover:bg-[#0d1117]/90 disabled:opacity-60"
            >
              {busy
                ? isAr
                  ? "جاري الحفظ…"
                  : "Saving…"
                : isEditing
                  ? isAr
                    ? "حفظ التعديلات"
                    : "Save changes"
                  : isAr
                    ? "إنشاء الباقة"
                    : "Create package"}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body,
  )
}

