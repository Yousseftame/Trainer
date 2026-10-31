import { useEffect, useState } from "react"
import { createPortal } from "react-dom"
import { Check, UserPlus, UserRoundPen, X } from "lucide-react"
import type { DemoSubscriber } from "@/features/subscribers/demo"
import type { SaveSubscriberInput } from "@/features/subscribers/service"
import type { DemoPackage } from "@/features/subscriptions/demo"
import { computeEndsAtIso } from "@/features/subscriptions/entitlements"
import { useLocale } from "@/hooks/useLocale"
import { cn } from "@/lib/utils"
import type { UserStatus } from "@/types/user"

type SubscriberFormDialogProps = {
  open: boolean
  subscriber?: DemoSubscriber | null
  packages?: DemoPackage[]
  busy?: boolean
  adminName?: string
  onClose: () => void
  onSave: (input: SaveSubscriberInput) => Promise<unknown>
}

function toDateInputValue(iso: string | null | undefined): string {
  if (!iso) return ""
  const dt = new Date(iso)
  if (Number.isNaN(dt.getTime())) return ""
  return dt.toISOString().slice(0, 10)
}

function fromDateInputValue(dateStr: string): string | null {
  if (!dateStr) return null
  const dt = new Date(`${dateStr}T00:00:00.000Z`)
  if (Number.isNaN(dt.getTime())) return null
  return dt.toISOString()
}

export function SubscriberFormDialog({
  open,
  subscriber,
  packages = [],
  busy = false,
  adminName,
  onClose,
  onSave,
}: SubscriberFormDialogProps) {
  const { locale, isRtl } = useLocale()
  const isAr = locale === "ar"
  const isEditing = Boolean(subscriber)

  const [nameAr, setNameAr] = useState("")
  const [nameEn, setNameEn] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [status, setStatus] = useState<UserStatus>("active")
  const [subLocale, setSubLocale] = useState<"ar" | "en">("ar")
  const [sex, setSex] = useState<"" | "male" | "female">("")
  const [age, setAge] = useState("")
  const [heightCm, setHeightCm] = useState("")
  const [startingWeightKg, setStartingWeightKg] = useState("")
  const [targetWeightKg, setTargetWeightKg] = useState("")
  const [goalAr, setGoalAr] = useState("")
  const [goalEn, setGoalEn] = useState("")
  const [healthNotesAr, setHealthNotesAr] = useState("")
  const [healthNotesEn, setHealthNotesEn] = useState("")
  const [coachNotesAr, setCoachNotesAr] = useState("")
  const [coachNotesEn, setCoachNotesEn] = useState("")

  // Initial package assignment when creating a new subscriber
  const [assignInitialPackage, setAssignInitialPackage] = useState(false)
  const [initialPackageId, setInitialPackageId] = useState("")
  const [initialSubStatus, setInitialSubStatus] = useState<"active" | "pending">(
    "active",
  )
  const [startsDate, setStartsDate] = useState("")
  const [endsDate, setEndsDate] = useState("")
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    setError(null)
    if (subscriber) {
      setNameAr(subscriber.name?.ar ?? subscriber.displayName)
      setNameEn(subscriber.name?.en ?? subscriber.displayName)
      setEmail(subscriber.email)
      setPhone(subscriber.phone)
      setStatus(subscriber.status)
      setSubLocale(subscriber.locale)
      setSex(subscriber.sex ?? "")
      setAge(subscriber.age ? String(subscriber.age) : "")
      setHeightCm(subscriber.heightCm ? String(subscriber.heightCm) : "")
      setStartingWeightKg(
        subscriber.startingWeightKg ? String(subscriber.startingWeightKg) : "",
      )
      setTargetWeightKg(
        subscriber.targetWeightKg ? String(subscriber.targetWeightKg) : "",
      )
      setGoalAr(subscriber.goal?.ar ?? "")
      setGoalEn(subscriber.goal?.en ?? "")
      setHealthNotesAr(subscriber.healthNotes?.ar ?? "")
      setHealthNotesEn(subscriber.healthNotes?.en ?? "")
      setCoachNotesAr(subscriber.coachNotes?.ar ?? "")
      setCoachNotesEn(subscriber.coachNotes?.en ?? "")
      setAssignInitialPackage(false)
    } else {
      setNameAr("")
      setNameEn("")
      setEmail("")
      setPhone("")
      setStatus("active")
      setSubLocale("ar")
      setSex("")
      setAge("")
      setHeightCm("")
      setStartingWeightKg("")
      setTargetWeightKg("")
      setGoalAr("")
      setGoalEn("")
      setHealthNotesAr("")
      setHealthNotesEn("")
      setCoachNotesAr("")
      setCoachNotesEn("")
      const defaultPkg =
        packages.find((p) => p.isActive && p.featured) ??
        packages.find((p) => p.isActive) ??
        packages[0]
      setAssignInitialPackage(Boolean(defaultPkg))
      setInitialPackageId(defaultPkg?.id ?? "")
      setInitialSubStatus("active")
      const todayIso = new Date().toISOString()
      setStartsDate(toDateInputValue(todayIso))
      setEndsDate(
        toDateInputValue(
          computeEndsAtIso(todayIso, defaultPkg?.durationDays ?? 30),
        ),
      )
    }
  }, [open, subscriber, packages])

  useEffect(() => {
    if (!open) return
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && !busy) onClose()
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [open, busy, onClose])

  if (!open || typeof document === "undefined") return null

  function handlePackageChange(nextPkgId: string) {
    setInitialPackageId(nextPkgId)
    const pkg = packages.find((p) => p.id === nextPkgId)
    const baseIso = fromDateInputValue(startsDate) ?? new Date().toISOString()
    setEndsDate(
      toDateInputValue(computeEndsAtIso(baseIso, pkg?.durationDays ?? 30)),
    )
  }

  function handleStartDateChange(nextStartStr: string) {
    setStartsDate(nextStartStr)
    const baseIso = fromDateInputValue(nextStartStr)
    const pkg = packages.find((p) => p.id === initialPackageId)
    if (baseIso && pkg) {
      setEndsDate(toDateInputValue(computeEndsAtIso(baseIso, pkg.durationDays)))
    }
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    const cleanNameAr = nameAr.trim() || nameEn.trim()
    const cleanNameEn = nameEn.trim() || nameAr.trim()
    if (!cleanNameAr && !cleanNameEn) {
      setError(
        isAr
          ? "يرجى إدخال اسم المشترك الكامل."
          : "Please enter the subscriber's full name.",
      )
      return
    }
    if (!email.trim() || !email.includes("@")) {
      setError(
        isAr
          ? "يرجى إدخال بريد إلكتروني صحيح."
          : "Please enter a valid email address.",
      )
      return
    }
    if (!phone.trim()) {
      setError(
        isAr ? "يرجى إدخال رقم الهاتف." : "Please enter a phone number.",
      )
      return
    }

    setError(null)
    await onSave({
      id: subscriber?.id,
      displayName: cleanNameEn || cleanNameAr,
      name: {
        ar: cleanNameAr,
        en: cleanNameEn,
      },
      email: email.trim(),
      phone: phone.trim(),
      status,
      locale: subLocale,
      sex: sex || undefined,
      age: age ? Number(age) : undefined,
      heightCm: heightCm ? Number(heightCm) : undefined,
      startingWeightKg: startingWeightKg ? Number(startingWeightKg) : undefined,
      targetWeightKg: targetWeightKg ? Number(targetWeightKg) : undefined,
      goal:
        goalAr.trim() || goalEn.trim()
          ? {
              ar: goalAr.trim() || goalEn.trim(),
              en: goalEn.trim() || goalAr.trim(),
            }
          : undefined,
      healthNotes:
        healthNotesAr.trim() || healthNotesEn.trim()
          ? {
              ar: healthNotesAr.trim() || healthNotesEn.trim(),
              en: healthNotesEn.trim() || healthNotesAr.trim(),
            }
          : undefined,
      coachNotes:
        coachNotesAr.trim() || coachNotesEn.trim()
          ? {
              ar: coachNotesAr.trim() || coachNotesEn.trim(),
              en: coachNotesEn.trim() || coachNotesAr.trim(),
            }
          : undefined,
      initialSubscription:
        !isEditing && assignInitialPackage && initialPackageId
          ? {
              packageId: initialPackageId,
              status: initialSubStatus,
              startsAt:
                initialSubStatus === "active"
                  ? fromDateInputValue(startsDate)
                  : null,
              endsAt:
                initialSubStatus === "active"
                  ? fromDateInputValue(endsDate)
                  : null,
              activatedBy: adminName,
              notes: isAr
                ? "تم التعيين عند إنشاء حساب المشترك"
                : "Assigned on subscriber account creation",
            }
          : undefined,
    })
  }

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
        className="flex max-h-[90dvh] w-full max-w-2xl flex-col overflow-hidden rounded-[28px] bg-white shadow-[0_24px_70px_rgba(0,0,0,0.25)]"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-black/8 px-6 py-4 sm:px-7">
          <div className="flex items-center gap-3">
            <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-2xl bg-[var(--gym-ink,#111111)] text-[var(--gym-lime,#fb5001)]">
              {isEditing ? (
                <UserRoundPen className="size-5" strokeWidth={2} />
              ) : (
                <UserPlus className="size-5" strokeWidth={2} />
              )}
            </span>
            <div>
              <h2 className="font-heading text-[18px] font-extrabold text-[var(--gym-ink,#111111)]">
                {isEditing
                  ? isAr
                    ? "تعديل بيانات المشترك"
                    : "Edit subscriber account"
                  : isAr
                    ? "إنشاء حساب مشترك جديد"
                    : "Create subscriber account"}
              </h2>
              <p className="text-[12px] font-medium text-[#8c8c8c]">
                {isAr
                  ? "إدارة الهوية (عربي / إنجليزي) وحالة الحساب والبيانات الجسدية وأهداف التدريب"
                  : "Manage bilingual identity, account status, physical metrics, and coaching goals"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex size-9 items-center justify-center rounded-full bg-[#F4F4F4] text-[#6B7280] transition hover:bg-black/10"
          >
            <X className="size-4" strokeWidth={2} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
          <div className="no-scrollbar flex-1 space-y-5 overflow-y-auto px-6 py-5 sm:px-7">
            {error ? (
              <div className="rounded-2xl bg-[#FFE8E4] px-4 py-3 text-[13px] font-semibold text-[#C44536]">
                {error}
              </div>
            ) : null}

            {/* Bilingual Name */}
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="flex flex-col gap-1.5">
                <span className="text-[12px] font-bold text-[#6B7280]">
                  {isAr ? "الاسم الكامل (عربي) *" : "Full name (Arabic) *"}
                </span>
                <input
                  dir="rtl"
                  value={nameAr}
                  onChange={(e) => setNameAr(e.target.value)}
                  placeholder="مثال: أحمد طارق"
                  className="h-11 rounded-2xl bg-[#F4F4F4] px-4 text-[14px] font-medium text-[var(--gym-ink,#111111)] outline-none focus:ring-2 focus:ring-[var(--gym-lime,#fb5001)]"
                />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="text-[12px] font-bold text-[#6B7280]">
                  {isAr ? "الاسم الكامل (English) *" : "Full name (English) *"}
                </span>
                <input
                  dir="ltr"
                  value={nameEn}
                  onChange={(e) => setNameEn(e.target.value)}
                  placeholder="e.g. Alex Haddad"
                  className="h-11 rounded-2xl bg-[#F4F4F4] px-4 text-[14px] font-medium text-[var(--gym-ink,#111111)] outline-none focus:ring-2 focus:ring-[var(--gym-lime,#fb5001)]"
                />
              </label>
            </div>

            {/* Email & Phone */}
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="flex flex-col gap-1.5">
                <span className="text-[12px] font-bold text-[#6B7280]">
                  {isAr ? "البريد الإلكتروني *" : "Email address *"}
                </span>
                <input
                  dir="ltr"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="h-11 rounded-2xl bg-[#F4F4F4] px-4 text-[14px] font-medium text-[var(--gym-ink,#111111)] outline-none focus:ring-2 focus:ring-[var(--gym-lime,#fb5001)]"
                />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="text-[12px] font-bold text-[#6B7280]">
                  {isAr ? "رقم الهاتف *" : "Phone number *"}
                </span>
                <input
                  dir="ltr"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+20 100 000 0000"
                  className="h-11 rounded-2xl bg-[#F4F4F4] px-4 text-[14px] font-medium text-[var(--gym-ink,#111111)] outline-none focus:ring-2 focus:ring-[var(--gym-lime,#fb5001)]"
                />
              </label>
            </div>

            {/* Account Status & Preferred Language */}
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="flex flex-col gap-1.5">
                <span className="text-[12px] font-bold text-[#6B7280]">
                  {isAr ? "حالة الحساب" : "Account status"}
                </span>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as UserStatus)}
                  className="h-11 rounded-2xl bg-[#F4F4F4] px-3.5 text-[13px] font-bold text-[var(--gym-ink,#111111)] outline-none"
                >
                  <option value="active">
                    {isAr ? "نشط (Active)" : "Active"}
                  </option>
                  <option value="pending">
                    {isAr ? "قيد المراجعة (Pending)" : "Pending"}
                  </option>
                  <option value="suspended">
                    {isAr ? "معلّق (Suspended)" : "Suspended"}
                  </option>
                  <option value="rejected">
                    {isAr ? "مرفوض (Rejected)" : "Rejected"}
                  </option>
                </select>
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="text-[12px] font-bold text-[#6B7280]">
                  {isAr ? "اللغة المفضلة" : "Preferred language"}
                </span>
                <select
                  value={subLocale}
                  onChange={(e) =>
                    setSubLocale(e.target.value as "ar" | "en")
                  }
                  className="h-11 rounded-2xl bg-[#F4F4F4] px-3.5 text-[13px] font-bold text-[var(--gym-ink,#111111)] outline-none"
                >
                  <option value="ar">العربية (AR)</option>
                  <option value="en">English (EN)</option>
                </select>
              </label>
            </div>

            {/* Physical Metrics */}
            <div className="rounded-2xl border border-black/8 bg-[#FAFAFA] p-4">
              <h3 className="text-[13px] font-extrabold text-[var(--gym-ink,#111111)]">
                {isAr
                  ? "القياسات والبيانات الجسدية"
                  : "Physical profile & baseline"}
              </h3>
              <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
                <label className="flex flex-col gap-1">
                  <span className="text-[11px] font-bold text-[#6B7280]">
                    {isAr ? "الجنس" : "Sex"}
                  </span>
                  <select
                    value={sex}
                    onChange={(e) =>
                      setSex(e.target.value as "" | "male" | "female")
                    }
                    className="h-10 rounded-xl bg-white px-3 text-[13px] font-semibold text-[var(--gym-ink,#111111)] outline-none ring-1 ring-black/8"
                  >
                    <option value="">
                      {isAr ? "غير محدد" : "Unspecified"}
                    </option>
                    <option value="male">{isAr ? "ذكر" : "Male"}</option>
                    <option value="female">{isAr ? "أنثى" : "Female"}</option>
                  </select>
                </label>
                <label className="flex flex-col gap-1">
                  <span className="text-[11px] font-bold text-[#6B7280]">
                    {isAr ? "العمر" : "Age"}
                  </span>
                  <input
                    type="number"
                    min={12}
                    max={100}
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    placeholder="28"
                    className="h-10 rounded-xl bg-white px-3 text-[13px] font-semibold text-[var(--gym-ink,#111111)] outline-none ring-1 ring-black/8"
                  />
                </label>
                <label className="flex flex-col gap-1">
                  <span className="text-[11px] font-bold text-[#6B7280]">
                    {isAr ? "الطول (سم)" : "Height (cm)"}
                  </span>
                  <input
                    type="number"
                    min={100}
                    max={250}
                    value={heightCm}
                    onChange={(e) => setHeightCm(e.target.value)}
                    placeholder="175"
                    className="h-10 rounded-xl bg-white px-3 text-[13px] font-semibold text-[var(--gym-ink,#111111)] outline-none ring-1 ring-black/8"
                  />
                </label>
                <label className="flex flex-col gap-1">
                  <span className="text-[11px] font-bold text-[#6B7280]">
                    {isAr ? "وزن البداية (كجم)" : "Start wt (kg)"}
                  </span>
                  <input
                    type="number"
                    step="0.1"
                    min={30}
                    max={300}
                    value={startingWeightKg}
                    onChange={(e) => setStartingWeightKg(e.target.value)}
                    placeholder="82"
                    className="h-10 rounded-xl bg-white px-3 text-[13px] font-semibold text-[var(--gym-ink,#111111)] outline-none ring-1 ring-black/8"
                  />
                </label>
                <label className="flex flex-col gap-1 sm:col-span-2">
                  <span className="text-[11px] font-bold text-[#6B7280]">
                    {isAr ? "الوزن المستهدف (كجم)" : "Target wt (kg)"}
                  </span>
                  <input
                    type="number"
                    step="0.1"
                    min={30}
                    max={300}
                    value={targetWeightKg}
                    onChange={(e) => setTargetWeightKg(e.target.value)}
                    placeholder="75"
                    className="h-10 rounded-xl bg-white px-3 text-[13px] font-semibold text-[var(--gym-ink,#111111)] outline-none ring-1 ring-black/8"
                  />
                </label>
              </div>
            </div>

            {/* Goal & Health Notes & Coach Notes */}
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="flex flex-col gap-1.5">
                <span className="text-[12px] font-bold text-[#6B7280]">
                  {isAr ? "الهدف التدريبي (عربي)" : "Training goal (Arabic)"}
                </span>
                <input
                  dir="rtl"
                  value={goalAr}
                  onChange={(e) => setGoalAr(e.target.value)}
                  placeholder="خسارة دهون وبناء كتلة عضلية..."
                  className="h-11 rounded-2xl bg-[#F4F4F4] px-4 text-[13px] font-medium text-[var(--gym-ink,#111111)] outline-none"
                />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="text-[12px] font-bold text-[#6B7280]">
                  {isAr ? "الهدف التدريبي (English)" : "Training goal (English)"}
                </span>
                <input
                  dir="ltr"
                  value={goalEn}
                  onChange={(e) => setGoalEn(e.target.value)}
                  placeholder="Fat loss while building lean muscle..."
                  className="h-11 rounded-2xl bg-[#F4F4F4] px-4 text-[13px] font-medium text-[var(--gym-ink,#111111)] outline-none"
                />
              </label>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="flex flex-col gap-1.5">
                <span className="text-[12px] font-bold text-[#6B7280]">
                  {isAr
                    ? "ملاحظات صحية أو إصابات (عربي)"
                    : "Health / injury notes (Arabic)"}
                </span>
                <textarea
                  dir="rtl"
                  rows={2}
                  value={healthNotesAr}
                  onChange={(e) => setHealthNotesAr(e.target.value)}
                  placeholder="أي إصابات أو حساسية غذائية..."
                  className="rounded-2xl bg-[#F4F4F4] p-3 text-[13px] font-medium text-[var(--gym-ink,#111111)] outline-none"
                />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="text-[12px] font-bold text-[#6B7280]">
                  {isAr
                    ? "ملاحظات صحية أو إصابات (English)"
                    : "Health / injury notes (English)"}
                </span>
                <textarea
                  dir="ltr"
                  rows={2}
                  value={healthNotesEn}
                  onChange={(e) => setHealthNotesEn(e.target.value)}
                  placeholder="Any injuries or dietary restrictions..."
                  className="rounded-2xl bg-[#F4F4F4] p-3 text-[13px] font-medium text-[var(--gym-ink,#111111)] outline-none"
                />
              </label>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="flex flex-col gap-1.5">
                <span className="text-[12px] font-bold text-[#6B7280]">
                  {isAr ? "ملاحظات المدرب (عربي)" : "Coach notes (Arabic)"}
                </span>
                <textarea
                  dir="rtl"
                  rows={2}
                  value={coachNotesAr}
                  onChange={(e) => setCoachNotesAr(e.target.value)}
                  placeholder="ملاحظات داخلية للمدرب..."
                  className="rounded-2xl bg-[#F4F4F4] p-3 text-[13px] font-medium text-[var(--gym-ink,#111111)] outline-none"
                />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="text-[12px] font-bold text-[#6B7280]">
                  {isAr ? "ملاحظات المدرب (English)" : "Coach notes (English)"}
                </span>
                <textarea
                  dir="ltr"
                  rows={2}
                  value={coachNotesEn}
                  onChange={(e) => setCoachNotesEn(e.target.value)}
                  placeholder="Internal coach notes..."
                  className="rounded-2xl bg-[#F4F4F4] p-3 text-[13px] font-medium text-[var(--gym-ink,#111111)] outline-none"
                />
              </label>
            </div>

            {/* Optional Initial Subscription Assignment when creating a subscriber */}
            {!isEditing && packages.length > 0 ? (
              <div className="rounded-2xl border border-black/8 bg-[#FAFAFA] p-4">
                <label className="flex cursor-pointer items-center justify-between gap-3">
                  <div>
                    <span className="block text-[13px] font-extrabold text-[var(--gym-ink,#111111)]">
                      {isAr
                        ? "تعيين باقة اشتراك للمشترك الآن"
                        : "Assign subscription package now"}
                    </span>
                    <span className="text-[12px] font-medium text-[#8c8c8c]">
                      {isAr
                        ? "ربط الحساب بباقة وتحديد تاريخ البدء والانتهاء مباشرة"
                        : "Link this new subscriber directly to a package and set start/end dates"}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setAssignInitialPackage((v) => !v)}
                    className={cn(
                      "inline-flex size-6 shrink-0 items-center justify-center rounded-lg border transition",
                      assignInitialPackage
                        ? "border-[var(--gym-lime,#fb5001)] bg-[var(--gym-lime,#fb5001)] text-white"
                        : "border-black/20 bg-white text-transparent",
                    )}
                  >
                    <Check className="size-3.5" strokeWidth={3} />
                  </button>
                </label>

                {assignInitialPackage ? (
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <label className="flex flex-col gap-1">
                      <span className="text-[11px] font-bold text-[#6B7280]">
                        {isAr ? "الباقة" : "Package"}
                      </span>
                      <select
                        value={initialPackageId}
                        onChange={(e) => handlePackageChange(e.target.value)}
                        className="h-10 rounded-xl bg-white px-3 text-[13px] font-bold text-[var(--gym-ink,#111111)] outline-none ring-1 ring-black/8"
                      >
                        {packages.map((pkg) => (
                          <option key={pkg.id} value={pkg.id}>
                            {pkg.name[locale]} — {pkg.price[locale]}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="flex flex-col gap-1">
                      <span className="text-[11px] font-bold text-[#6B7280]">
                        {isAr ? "حالة الاشتراك" : "Subscription status"}
                      </span>
                      <select
                        value={initialSubStatus}
                        onChange={(e) =>
                          setInitialSubStatus(
                            e.target.value as "active" | "pending",
                          )
                        }
                        className="h-10 rounded-xl bg-white px-3 text-[13px] font-bold text-[var(--gym-ink,#111111)] outline-none ring-1 ring-black/8"
                      >
                        <option value="active">
                          {isAr
                            ? "تفعيل فوري (Active)"
                            : "Activate immediately"}
                        </option>
                        <option value="pending">
                          {isAr
                            ? "بانتظار التفعيل (Pending)"
                            : "Pending activation"}
                        </option>
                      </select>
                    </label>
                    {initialSubStatus === "active" ? (
                      <>
                        <label className="flex flex-col gap-1">
                          <span className="text-[11px] font-bold text-[#6B7280]">
                            {isAr ? "تاريخ البدء" : "Start date"}
                          </span>
                          <input
                            type="date"
                            value={startsDate}
                            onChange={(e) =>
                              handleStartDateChange(e.target.value)
                            }
                            className="h-10 rounded-xl bg-white px-3 text-[13px] font-semibold text-[var(--gym-ink,#111111)] outline-none ring-1 ring-black/8"
                          />
                        </label>
                        <label className="flex flex-col gap-1">
                          <span className="text-[11px] font-bold text-[#6B7280]">
                            {isAr ? "تاريخ الانتهاء" : "Expiration date"}
                          </span>
                          <input
                            type="date"
                            value={endsDate}
                            onChange={(e) => setEndsDate(e.target.value)}
                            className="h-10 rounded-xl bg-white px-3 text-[13px] font-semibold text-[var(--gym-ink,#111111)] outline-none ring-1 ring-black/8"
                          />
                        </label>
                      </>
                    ) : null}
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>

          <div className="flex items-center justify-end gap-2.5 border-t border-black/8 bg-white px-6 py-4 sm:px-7">
            <button
              type="button"
              onClick={onClose}
              disabled={busy}
              className="inline-flex h-11 items-center justify-center rounded-full bg-[#F4F4F4] px-5 text-[13px] font-bold text-[var(--gym-ink,#111111)] transition hover:bg-black/10"
            >
              {isAr ? "إلغاء" : "Cancel"}
            </button>
            <button
              type="submit"
              disabled={busy}
              className="inline-flex h-11 items-center justify-center rounded-full bg-[var(--gym-ink,#111111)] px-6 text-[13px] font-bold text-white transition hover:opacity-95 disabled:opacity-50"
            >
              {busy
                ? isAr
                  ? "جارٍ الحفظ..."
                  : "Saving..."
                : isEditing
                  ? isAr
                    ? "حفظ التغييرات"
                    : "Save changes"
                  : isAr
                    ? "إنشاء حساب المشترك"
                    : "Create subscriber"}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body,
  )
}
