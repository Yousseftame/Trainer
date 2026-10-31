import { useEffect, useState } from "react"
import { createPortal } from "react-dom"
import { Check, CircleCheck, CircleX, UserPlus, X } from "lucide-react"
import type { DemoRegistrationRequest } from "@/features/subscribers/requests-demo"
import type {
  CreateRegistrationRequestInput,
  ReviewRegistrationRequestInput,
} from "@/features/subscribers/service"
import type { DemoPackage } from "@/features/subscriptions/demo"
import { computeEndsAtIso } from "@/features/subscriptions/entitlements"
import { useLocale } from "@/hooks/useLocale"
import { cn } from "@/lib/utils"

export type RegistrationDialogState =
  | {
      mode: "approve" | "reject"
      request: DemoRegistrationRequest
    }
  | {
      mode: "create"
    }

type RegistrationReviewDialogProps = {
  state: RegistrationDialogState | null
  packages: DemoPackage[]
  busy?: boolean
  adminName?: string
  onClose: () => void
  onReview: (input: ReviewRegistrationRequestInput) => Promise<unknown>
  onCreate: (input: CreateRegistrationRequestInput) => Promise<unknown>
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

export function RegistrationReviewDialog({
  state,
  packages,
  busy = false,
  adminName,
  onClose,
  onReview,
  onCreate,
}: RegistrationReviewDialogProps) {
  const { locale } = useLocale()
  const isAr = locale === "ar"

  // Review state
  const [assignPackage, setAssignPackage] = useState(true)
  const [packageId, setPackageId] = useState("")
  const [subscriptionStatus, setSubscriptionStatus] = useState<
    "active" | "pending"
  >("active")
  const [startsDate, setStartsDate] = useState("")
  const [endsDate, setEndsDate] = useState("")
  const [reviewNotesAr, setReviewNotesAr] = useState("")
  const [reviewNotesEn, setReviewNotesEn] = useState("")

  // Manual create state
  const [nameAr, setNameAr] = useState("")
  const [nameEn, setNameEn] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [reqLocale, setReqLocale] = useState<"ar" | "en">("ar")
  const [goalAr, setGoalAr] = useState("")
  const [goalEn, setGoalEn] = useState("")
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!state) return
    setError(null)
    if (state.mode === "approve" || state.mode === "reject") {
      const req = state.request
      const defaultPkg =
        packages.find((p) => p.id === req.packageId) ??
        packages.find((p) => p.isActive) ??
        packages[0]
      setAssignPackage(Boolean(defaultPkg))
      setPackageId(defaultPkg?.id ?? "")
      setSubscriptionStatus("active")
      const todayIso = new Date().toISOString()
      setStartsDate(toDateInputValue(todayIso))
      setEndsDate(
        toDateInputValue(
          computeEndsAtIso(todayIso, defaultPkg?.durationDays ?? 30),
        ),
      )
      setReviewNotesAr(req.reviewNotesLocalized?.ar ?? req.reviewNotes ?? "")
      setReviewNotesEn(req.reviewNotesLocalized?.en ?? req.reviewNotes ?? "")
    } else {
      const defaultPkg =
        packages.find((p) => p.isActive && p.featured) ??
        packages.find((p) => p.isActive) ??
        packages[0]
      setNameAr("")
      setNameEn("")
      setEmail("")
      setPhone("")
      setReqLocale("ar")
      setPackageId(defaultPkg?.id ?? "")
      setGoalAr("")
      setGoalEn("")
    }
  }, [state, packages])

  if (!state) return null

  function handlePackageChange(nextPkgId: string) {
    setPackageId(nextPkgId)
    const pkg = packages.find((p) => p.id === nextPkgId)
    const baseIso = fromDateInputValue(startsDate) ?? new Date().toISOString()
    setEndsDate(toDateInputValue(computeEndsAtIso(baseIso, pkg?.durationDays ?? 30)))
  }

  function handleStartDateChange(nextStartStr: string) {
    setStartsDate(nextStartStr)
    const baseIso = fromDateInputValue(nextStartStr)
    const pkg = packages.find((p) => p.id === packageId)
    if (baseIso && pkg) {
      setEndsDate(toDateInputValue(computeEndsAtIso(baseIso, pkg.durationDays)))
    }
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    if (!state) return

    if (state.mode === "create") {
      const primaryName = (nameAr.trim() || nameEn.trim()).trim()
      const primaryGoal = (goalAr.trim() || goalEn.trim()).trim()
      if (!primaryName || !email.trim() || !phone.trim() || !primaryGoal) {
        setError(
          isAr
            ? "يرجى ملء الاسم والبريد الإلكتروني ورقم الهاتف والهدف."
            : "Please fill in name, email, phone, and goal.",
        )
        return
      }
      await onCreate({
        displayName: isAr ? nameAr.trim() || primaryName : nameEn.trim() || primaryName,
        name: {
          ar: nameAr.trim() || primaryName,
          en: nameEn.trim() || primaryName,
        },
        email: email.trim(),
        phone: phone.trim(),
        locale: reqLocale,
        packageId: packageId || null,
        goal: {
          ar: goalAr.trim() || primaryGoal,
          en: goalEn.trim() || primaryGoal,
        },
        source: "manual",
      })
      return
    }

    const trimmedAr = reviewNotesAr.trim()
    const trimmedEn = reviewNotesEn.trim()
    const primaryReview = (isAr ? trimmedAr || trimmedEn : trimmedEn || trimmedAr) || undefined

    await onReview({
      requestId: state.request.id,
      decision: state.mode === "approve" ? "approved" : "rejected",
      reviewedBy: adminName,
      reviewNotes: primaryReview,
      reviewNotesLocalized:
        trimmedAr || trimmedEn
          ? {
              ar: trimmedAr || trimmedEn,
              en: trimmedEn || trimmedAr,
            }
          : undefined,
      assignPackage: state.mode === "approve" ? assignPackage : false,
      packageId: state.mode === "approve" ? packageId || null : null,
      subscriptionStatus,
      startsAt:
        subscriptionStatus === "active"
          ? fromDateInputValue(startsDate)
          : null,
      endsAt:
        subscriptionStatus === "active" ? fromDateInputValue(endsDate) : null,
    })
  }

  const isApprove = state.mode === "approve"
  const isReject = state.mode === "reject"

  return createPortal(
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/55 p-3 backdrop-blur-[2px] sm:p-5">
      <div
        role="dialog"
        aria-modal="true"
        className="flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-[28px] bg-white shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-black/8 px-6 py-4 sm:px-7">
          <div className="flex items-center gap-3">
            <span
              className={cn(
                "inline-flex size-10 items-center justify-center rounded-2xl",
                isReject
                  ? "bg-[#FFE8E4] text-[#C44536]"
                  : "bg-[var(--gym-ink,#111111)] text-[var(--gym-lime,#fb5001)]",
              )}
            >
              {isApprove ? (
                <CircleCheck className="size-5" strokeWidth={2} />
              ) : isReject ? (
                <CircleX className="size-5" strokeWidth={2} />
              ) : (
                <UserPlus className="size-5" strokeWidth={2} />
              )}
            </span>
            <div>
              <h2 className="font-heading text-[18px] font-extrabold text-[var(--gym-ink,#111111)]">
                {isApprove
                  ? isAr
                    ? "الموافقة على طلب التسجيل"
                    : "Approve registration request"
                  : isReject
                    ? isAr
                      ? "رفض طلب التسجيل"
                      : "Reject registration request"
                    : isAr
                      ? "تسجيل طلب انضمام يدوي"
                      : "New manual registration request"}
              </h2>
              <p className="text-[12px] font-medium text-[#8c8c8c]">
                {isApprove
                  ? isAr
                    ? "تفعيل حساب المشترك وربطه بباقة الاشتراك المختارة"
                    : "Activate subscriber account and assign their subscription package"
                  : isReject
                    ? isAr
                      ? "تحديث حالة الطلب إلى مرفوض مع حفظ سبب الرفض"
                      : "Mark request as rejected and record review notes"
                    : isAr
                      ? "إضافة طلب تسجيل جديد (عربي / إنجليزي) لمراجعته وتفعيله"
                      : "Add a manual registration request (Arabic & English) for review"}
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

        <form
          onSubmit={handleSubmit}
          className="no-scrollbar flex-1 space-y-5 overflow-y-auto px-6 py-5 sm:px-7"
        >
          {error ? (
            <div className="rounded-2xl bg-[#FFE8E4] px-4 py-3 text-[13px] font-semibold text-[#C44536]">
              {error}
            </div>
          ) : null}

          {state.mode === "create" ? (
            <>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="flex flex-col gap-1.5">
                  <span className="text-[12px] font-bold text-[#6B7280]">
                    {isAr ? "الاسم الكامل (عربي) *" : "Full name (Arabic) *"}
                  </span>
                  <input
                    dir="rtl"
                    value={nameAr}
                    onChange={(e) => setNameAr(e.target.value)}
                    placeholder="مثال: طارق سليم"
                    className="h-11 rounded-2xl bg-[#F4F4F4] px-4 text-[14px] font-medium text-[var(--gym-ink,#111111)] outline-none [font-family:var(--font-arabic)]"
                  />
                </label>
                <label className="flex flex-col gap-1.5">
                  <span className="text-[12px] font-bold text-[#6B7280]">
                    {isAr ? "الاسم الكامل (إنجليزي) *" : "Full name (English) *"}
                  </span>
                  <input
                    dir="ltr"
                    value={nameEn}
                    onChange={(e) => setNameEn(e.target.value)}
                    placeholder="e.g. Tarek Selim"
                    className="h-11 rounded-2xl bg-[#F4F4F4] px-4 text-[14px] font-medium text-[var(--gym-ink,#111111)] outline-none"
                  />
                </label>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="flex flex-col gap-1.5">
                  <span className="text-[12px] font-bold text-[#6B7280]">
                    {isAr ? "البريد الإلكتروني *" : "Email *"}
                  </span>
                  <input
                    type="email"
                    dir="ltr"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="h-11 rounded-2xl bg-[#F4F4F4] px-4 text-[14px] font-medium text-[var(--gym-ink,#111111)] outline-none"
                  />
                </label>
                <label className="flex flex-col gap-1.5">
                  <span className="text-[12px] font-bold text-[#6B7280]">
                    {isAr ? "رقم الهاتف *" : "Phone *"}
                  </span>
                  <input
                    dir="ltr"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+20 100 000 0000"
                    className="h-11 rounded-2xl bg-[#F4F4F4] px-4 text-[14px] font-medium text-[var(--gym-ink,#111111)] outline-none"
                  />
                </label>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="flex flex-col gap-1.5">
                  <span className="text-[12px] font-bold text-[#6B7280]">
                    {isAr ? "الباقة المطلوبة" : "Requested package"}
                  </span>
                  <select
                    value={packageId}
                    onChange={(e) => setPackageId(e.target.value)}
                    className="h-11 rounded-2xl bg-[#F4F4F4] px-3 text-[13px] font-bold text-[var(--gym-ink,#111111)] outline-none"
                  >
                    {packages.map((pkg) => (
                      <option key={pkg.id} value={pkg.id}>
                        {pkg.name[locale]}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="flex flex-col gap-1.5">
                  <span className="text-[12px] font-bold text-[#6B7280]">
                    {isAr ? "اللغة المفضلة" : "Preferred language"}
                  </span>
                  <select
                    value={reqLocale}
                    onChange={(e) =>
                      setReqLocale(e.target.value as "ar" | "en")
                    }
                    className="h-11 rounded-2xl bg-[#F4F4F4] px-3 text-[13px] font-bold text-[var(--gym-ink,#111111)] outline-none"
                  >
                    <option value="ar">العربية (AR)</option>
                    <option value="en">English (EN)</option>
                  </select>
                </label>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="flex flex-col gap-1.5">
                  <span className="text-[12px] font-bold text-[#6B7280]">
                    {isAr ? "الهدف / تفاصيل الطلب (عربي) *" : "Goal / Inquiry (Arabic) *"}
                  </span>
                  <textarea
                    rows={3}
                    dir="rtl"
                    value={goalAr}
                    onChange={(e) => setGoalAr(e.target.value)}
                    placeholder="تفاصيل هدف المشترك أو احتياجاته بالعربية..."
                    className="rounded-2xl bg-[#F4F4F4] p-3 text-[13px] font-medium text-[var(--gym-ink,#111111)] outline-none [font-family:var(--font-arabic)]"
                  />
                </label>
                <label className="flex flex-col gap-1.5">
                  <span className="text-[12px] font-bold text-[#6B7280]">
                    {isAr ? "الهدف / تفاصيل الطلب (إنجليزي)" : "Goal / Inquiry (English) *"}
                  </span>
                  <textarea
                    rows={3}
                    dir="ltr"
                    value={goalEn}
                    onChange={(e) => setGoalEn(e.target.value)}
                    placeholder="Applicant's fitness goal and training preferences..."
                    className="rounded-2xl bg-[#F4F4F4] p-3 text-[13px] font-medium text-[var(--gym-ink,#111111)] outline-none"
                  />
                </label>
              </div>
            </>
          ) : (
            <>
              {/* Applicant Summary Card */}
              <div className="rounded-2xl bg-[#F4F4F4] p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="font-heading text-[16px] font-extrabold text-[var(--gym-ink,#111111)]">
                      {state.request.name?.[locale] || state.request.displayName}
                    </p>
                    <p className="text-[12px] font-medium text-[#6B7280]">
                      {state.request.email} · {state.request.phone}
                    </p>
                  </div>
                  <span className="rounded-full bg-white px-3 py-1 text-[11px] font-bold text-[var(--gym-ink,#111111)]">
                    {state.request.locale.toUpperCase()}
                  </span>
                </div>
                <p className="mt-3 border-t border-black/8 pt-2.5 text-[13px] font-medium leading-relaxed text-[var(--gym-ink,#111111)]">
                  {state.request.goal[locale]}
                </p>
              </div>

              {isApprove ? (
                <div className="rounded-2xl border border-black/8 bg-[#FAFAFA] p-4">
                  <label className="flex cursor-pointer items-center justify-between gap-3">
                    <div>
                      <span className="block text-[13px] font-extrabold text-[var(--gym-ink,#111111)]">
                        {isAr
                          ? "تعيين وتفعيل باقة الاشتراك الآن"
                          : "Assign subscription package now"}
                      </span>
                      <span className="text-[12px] font-medium text-[#8c8c8c]">
                        {isAr
                          ? "إنشاء سجل الاشتراك للمشترك فور الموافقة على الطلب"
                          : "Automatically create the subscriber's subscription upon approval"}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setAssignPackage((v) => !v)}
                      className={cn(
                        "inline-flex size-6 shrink-0 items-center justify-center rounded-lg border transition",
                        assignPackage
                          ? "border-[var(--gym-lime,#fb5001)] bg-[var(--gym-lime,#fb5001)] text-white"
                          : "border-black/20 bg-white text-transparent",
                      )}
                    >
                      <Check className="size-3.5" strokeWidth={3} />
                    </button>
                  </label>

                  {assignPackage ? (
                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                      <label className="flex flex-col gap-1">
                        <span className="text-[11px] font-bold text-[#6B7280]">
                          {isAr ? "الباقة" : "Package"}
                        </span>
                        <select
                          value={packageId}
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
                          value={subscriptionStatus}
                          onChange={(e) =>
                            setSubscriptionStatus(
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
                              ? "بانتظار الدفع/التفعيل (Pending)"
                              : "Pending activation"}
                          </option>
                        </select>
                      </label>

                      {subscriptionStatus === "active" ? (
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

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="flex flex-col gap-1.5">
                  <span className="text-[12px] font-bold text-[#6B7280]">
                    {isReject
                      ? isAr
                        ? "سبب الرفض / الملاحظات (عربي)"
                        : "Rejection reason (Arabic)"
                      : isAr
                        ? "ملاحظات المراجعة (عربي)"
                        : "Review notes (Arabic)"}
                  </span>
                  <textarea
                    rows={3}
                    dir="rtl"
                    value={reviewNotesAr}
                    onChange={(e) => setReviewNotesAr(e.target.value)}
                    placeholder={
                      isReject
                        ? "مثال: خارج نطاق التدريب الحالي..."
                        : "مثال: تم تأكيد الدفع وتفعيل الباقة..."
                    }
                    className="rounded-2xl bg-[#F4F4F4] p-3 text-[13px] font-medium text-[var(--gym-ink,#111111)] outline-none [font-family:var(--font-arabic)]"
                  />
                </label>
                <label className="flex flex-col gap-1.5">
                  <span className="text-[12px] font-bold text-[#6B7280]">
                    {isReject
                      ? isAr
                        ? "سبب الرفض / الملاحظات (إنجليزي)"
                        : "Rejection reason (English)"
                      : isAr
                        ? "ملاحظات المراجعة (إنجليزي)"
                        : "Review notes (English)"}
                  </span>
                  <textarea
                    rows={3}
                    dir="ltr"
                    value={reviewNotesEn}
                    onChange={(e) => setReviewNotesEn(e.target.value)}
                    placeholder={
                      isReject
                        ? "e.g. Outside current coaching scope..."
                        : "e.g. Payment confirmed, onboarding scheduled..."
                    }
                    className="rounded-2xl bg-[#F4F4F4] p-3 text-[13px] font-medium text-[var(--gym-ink,#111111)] outline-none"
                  />
                </label>
              </div>
            </>
          )}

          <div className="flex items-center justify-end gap-2.5 border-t border-black/8 pt-4">
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
              className={cn(
                "inline-flex h-11 items-center justify-center rounded-full px-6 text-[13px] font-bold text-white transition hover:opacity-95 disabled:opacity-50",
                isReject
                  ? "bg-[#C44536]"
                  : "bg-[var(--gym-ink,#111111)]",
              )}
            >
              {busy
                ? isAr
                  ? "جارٍ الحفظ..."
                  : "Saving..."
                : isApprove
                  ? isAr
                    ? "تأكيد الموافقة وتفعيل الحساب"
                    : "Approve & activate subscriber"
                  : isReject
                    ? isAr
                      ? "تأكيد رفض الطلب"
                      : "Confirm rejection"
                    : isAr
                      ? "إضافة الطلب"
                      : "Add request"}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body,
  )
}

