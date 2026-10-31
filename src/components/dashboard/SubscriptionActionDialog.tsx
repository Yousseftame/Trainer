import { useEffect, useMemo, useState } from "react"
import { createPortal } from "react-dom"
import { Calendar, Check, RefreshCw, ShieldAlert, PauseCircle, PlayCircle, X } from "lucide-react"
import { StatusBadge, subscriptionStatusTone } from "@/components/dashboard/StatusBadge"
import {
  DEMO_SUBSCRIBERS,
  subscriberDisplayName,
} from "@/features/subscribers/demo"
import { useSubscribersQuery } from "@/features/subscribers/hooks"
import type { DemoPackage } from "@/features/subscriptions/demo"
import {
  ENTITLEMENT_KEYS,
  computeEndsAtIso,
  normalizeEntitlements,
} from "@/features/subscriptions/entitlements"
import { useLocale } from "@/hooks/useLocale"
import { cn } from "@/lib/utils"
import type {
  PackageEntitlementKey,
  SubscriberSubscription,
  SubscriptionStatus,
} from "@/types/subscription"

export type SubscriptionDialogState =
  | {
      mode: "assign"
      defaultSubscriberId?: string
      defaultPackageId?: string
    }
  | {
      mode: "manage"
      subscription: SubscriberSubscription
      initialAction?: "activate" | "renew" | "suspend" | "terminate" | "edit"
    }

type SubscriptionActionDialogProps = {
  state: SubscriptionDialogState | null
  packages: DemoPackage[]
  busy?: boolean
  adminName?: string
  onClose: () => void
  onAssign: (payload: {
    subscriberId: string
    subscriberName?: string
    subscriberEmail?: string
    packageId: string
    status: "active" | "pending"
    startsAt: string | null
    endsAt: string | null
    activatedBy?: string
    notes?: string
    notesLocalized?: { en: string; ar: string }
  }) => Promise<void> | void
  onLifecycle: (payload: {
    subscriptionId: string
    action: "activate" | "renew" | "suspend" | "terminate" | "edit"
    packageId?: string
    status?: SubscriptionStatus
    startsAt?: string | null
    endsAt?: string | null
    activatedBy?: string
    notes?: string
    notesLocalized?: { en: string; ar: string }
  }) => Promise<void> | void
}

const ENTITLEMENT_SHORT_LABELS: Record<
  PackageEntitlementKey,
  { ar: string; en: string }
> = {
  workoutProgram: { ar: "التمارين", en: "Workouts" },
  nutritionProgram: { ar: "التغذية", en: "Nutrition" },
  exerciseVideos: { ar: "الفيديوهات", en: "Videos" },
  pdfDocuments: { ar: "ملفات PDF", en: "PDFs" },
  progressTracking: { ar: "التقدم", en: "Progress" },
}

function toDateInputValue(iso: string | null | undefined): string {
  if (!iso) return ""
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ""
  return d.toISOString().slice(0, 10)
}

function fromDateInputValue(val: string): string | null {
  if (!val.trim()) return null
  const d = new Date(`${val}T00:00:00.000Z`)
  return Number.isNaN(d.getTime()) ? null : d.toISOString()
}

export function SubscriptionActionDialog({
  state,
  packages,
  busy = false,
  adminName = "Head Coach",
  onClose,
  onAssign,
  onLifecycle,
}: SubscriptionActionDialogProps) {
  const { locale, isRtl } = useLocale()
  const isAr = locale === "ar"
  const { data: subscribers = DEMO_SUBSCRIBERS } = useSubscribersQuery()

  const livePackages = useMemo(
    () => packages.filter((p) => p.isActive),
    [packages],
  )

  const [subscriberId, setSubscriberId] = useState("")
  const [packageId, setPackageId] = useState("")
  const [assignStatus, setAssignStatus] = useState<"active" | "pending">("active")
  const [manageAction, setManageAction] = useState<
    "activate" | "renew" | "suspend" | "terminate" | "edit"
  >("edit")
  const [editStatus, setEditStatus] = useState<SubscriptionStatus>("active")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [notesAr, setNotesAr] = useState("")
  const [notesEn, setNotesEn] = useState("")

  const selectedPackage = useMemo(
    () => packages.find((p) => p.id === packageId) ?? livePackages[0] ?? packages[0],
    [packages, livePackages, packageId],
  )

  useEffect(() => {
    if (!state) return
    const todayStr = new Date().toISOString().slice(0, 10)

    if (state.mode === "assign") {
      const subId = state.defaultSubscriberId || subscribers[0]?.id || ""
      const pkg =
        packages.find((p) => p.id === state.defaultPackageId) ??
        livePackages[0] ??
        packages[0]
      const pkgId = pkg?.id ?? ""
      setSubscriberId(subId)
      setPackageId(pkgId)
      setAssignStatus("active")
      setStartDate(todayStr)
      const computedEnd = pkg
        ? toDateInputValue(computeEndsAtIso(`${todayStr}T00:00:00.000Z`, pkg.durationDays))
        : ""
      setEndDate(computedEnd)
      setNotesAr("")
      setNotesEn("")
    } else {
      const sub = state.subscription
      const defaultAction =
        state.initialAction ??
        (sub.status === "pending"
          ? "activate"
          : sub.status === "active"
            ? "renew"
            : "activate")

      setSubscriberId(sub.subscriberId)
      setPackageId(sub.packageId)
      setManageAction(defaultAction)
      setEditStatus(sub.status)
      setNotesAr(sub.notesLocalized?.ar ?? sub.notes ?? "")
      setNotesEn(sub.notesLocalized?.en ?? sub.notes ?? "")

      const pkg = packages.find((p) => p.id === sub.packageId) ?? packages[0]
      if (defaultAction === "renew" || defaultAction === "activate") {
        const baseStart =
          defaultAction === "activate" && sub.startsAt
            ? toDateInputValue(sub.startsAt)
            : todayStr
        setStartDate(baseStart)
        setEndDate(
          toDateInputValue(
            computeEndsAtIso(`${baseStart}T00:00:00.000Z`, pkg?.durationDays ?? 30),
          ),
        )
      } else {
        setStartDate(toDateInputValue(sub.startsAt) || todayStr)
        setEndDate(
          toDateInputValue(sub.endsAt) ||
            toDateInputValue(
              computeEndsAtIso(`${todayStr}T00:00:00.000Z`, pkg?.durationDays ?? 30),
            ),
        )
      }
    }
  }, [state, packages, livePackages])

  useEffect(() => {
    if (!state) return
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && !busy) onClose()
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [state, busy, onClose])

  if (!state) return null

  function handlePackageChange(nextPkgId: string) {
    setPackageId(nextPkgId)
    const pkg = packages.find((p) => p.id === nextPkgId)
    if (pkg && startDate) {
      setEndDate(
        toDateInputValue(
          computeEndsAtIso(`${startDate}T00:00:00.000Z`, pkg.durationDays),
        ),
      )
    }
  }

  function handleStartDateChange(nextStart: string) {
    setStartDate(nextStart)
    if (selectedPackage && nextStart) {
      setEndDate(
        toDateInputValue(
          computeEndsAtIso(`${nextStart}T00:00:00.000Z`, selectedPackage.durationDays),
        ),
      )
    }
  }

  function handleSwitchManageAction(
    nextAction: "activate" | "renew" | "suspend" | "terminate" | "edit",
  ) {
    setManageAction(nextAction)
    if (state?.mode !== "manage") return
    const sub = state.subscription
    const todayStr = new Date().toISOString().slice(0, 10)
    const pkg = packages.find((p) => p.id === packageId) ?? selectedPackage

    if (nextAction === "renew" || nextAction === "activate") {
      setStartDate(todayStr)
      setEndDate(
        toDateInputValue(
          computeEndsAtIso(`${todayStr}T00:00:00.000Z`, pkg?.durationDays ?? 30),
        ),
      )
    } else if (nextAction === "terminate") {
      setEndDate(todayStr)
    } else {
      setStartDate(toDateInputValue(sub.startsAt) || todayStr)
      setEndDate(toDateInputValue(sub.endsAt) || todayStr)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!state) return

    const cleanAr = notesAr.trim() || notesEn.trim()
    const cleanEn = notesEn.trim() || notesAr.trim()
    const notesLocalized =
      cleanAr || cleanEn ? { ar: cleanAr, en: cleanEn } : undefined

    if (state.mode === "assign") {
      const subPerson = subscribers.find((s) => s.id === subscriberId)
      await onAssign({
        subscriberId,
        subscriberName: subPerson?.displayName,
        subscriberEmail: subPerson?.email,
        packageId: selectedPackage?.id ?? packageId,
        status: assignStatus,
        startsAt: assignStatus === "active" ? fromDateInputValue(startDate) : null,
        endsAt: assignStatus === "active" ? fromDateInputValue(endDate) : null,
        activatedBy: adminName,
        notes: cleanEn || undefined,
        notesLocalized,
      })
    } else {
      await onLifecycle({
        subscriptionId: state.subscription.id,
        action: manageAction,
        packageId: selectedPackage?.id ?? packageId,
        status: manageAction === "edit" ? editStatus : undefined,
        startsAt: fromDateInputValue(startDate),
        endsAt: fromDateInputValue(endDate),
        activatedBy: adminName,
        notes: cleanEn || undefined,
        notesLocalized,
      })
    }
  }

  const subscriberObj = subscribers.find((s) => s.id === subscriberId)
  const entitlements = normalizeEntitlements(selectedPackage?.entitlements)

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
        className="flex max-h-[90dvh] w-full max-w-[620px] flex-col overflow-hidden rounded-[28px] bg-white shadow-[0_24px_70px_rgba(0,0,0,0.25)]"
      >
        <div className="flex items-center justify-between border-b border-black/[0.07] px-6 py-4 sm:px-7 sm:py-5">
          <div>
            <h2 className="text-[20px] font-bold tracking-tight text-[#0d1117] sm:text-[22px]">
              {state.mode === "assign"
                ? isAr
                  ? "تعيين باقة واشتراك للمشترك"
                  : "Assign package & subscription"
                : isAr
                  ? "إدارة الاشتراك"
                  : "Manage subscription"}
            </h2>
            <p className="mt-0.5 text-[13px] font-medium text-[#6B7280]">
              {state.mode === "assign"
                ? isAr
                  ? "اختر المشترك والباقة وحدد تاريخ البدء والانتهاء."
                  : "Select subscriber and package, and configure start & expiration dates."
                : isAr
                  ? "تفعيل، تجديد، إيقاف مؤقت، أو إنهاء الاشتراك يدوياً."
                  : "Manually activate, renew, suspend, or terminate this subscription."}
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
            {/* Subscriber selector or header */}
            {state.mode === "assign" ? (
              <label className="flex flex-col gap-1.5">
                <span className="text-[12px] font-bold text-[#374151]">
                  {isAr ? "المشترك *" : "Subscriber *"}
                </span>
                <select
                  value={subscriberId}
                  onChange={(e) => setSubscriberId(e.target.value)}
                  className={inputClass}
                >
                  {subscribers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {subscriberDisplayName(s, locale)} ({s.email})
                    </option>
                  ))}
                </select>
              </label>
            ) : (
              <div className="flex items-center justify-between gap-3 rounded-[20px] bg-[#F7F7F7] px-4 py-3.5">
                <div className="min-w-0">
                  <p className="truncate text-[15px] font-bold text-[#111111]">
                    {subscriberDisplayName(subscriberObj, locale) ||
                      state.subscription.subscriberName ||
                      state.subscription.subscriberId}
                  </p>
                  <p className="truncate text-[12px] font-medium text-[#6B7280]">
                    {subscriberObj?.email ?? state.subscription.subscriberEmail ?? ""}
                  </p>
                </div>
                <StatusBadge
                  label={
                    isAr
                      ? {
                          active: "نشط",
                          pending: "قيد الانتظار",
                          expired: "منتهٍ",
                          suspended: "موقوف",
                          cancelled: "ملغى",
                        }[state.subscription.status]
                      : state.subscription.status
                  }
                  tone={subscriptionStatusTone(state.subscription.status)}
                />
              </div>
            )}

            {/* Action Tabs for Manage Mode */}
            {state.mode === "manage" ? (
              <div className="flex flex-col gap-1.5">
                <span className="text-[12px] font-bold text-[#374151]">
                  {isAr ? "الإجراء المطلوب" : "Action"}
                </span>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
                  {(
                    [
                      {
                        id: "activate",
                        ar: "تفعيل",
                        en: "Activate",
                        icon: PlayCircle,
                      },
                      {
                        id: "renew",
                        ar: "تجديد",
                        en: "Renew",
                        icon: RefreshCw,
                      },
                      {
                        id: "suspend",
                        ar: "إيقاف مؤقت",
                        en: "Suspend",
                        icon: PauseCircle,
                      },
                      {
                        id: "terminate",
                        ar: "إنهاء",
                        en: "Terminate",
                        icon: ShieldAlert,
                      },
                      {
                        id: "edit",
                        ar: "تعديل التواريخ",
                        en: "Edit dates",
                        icon: Calendar,
                      },
                    ] as const
                  ).map((item) => {
                    const Icon = item.icon
                    const active = manageAction === item.id
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => handleSwitchManageAction(item.id)}
                        className={cn(
                          "inline-flex h-10 items-center justify-center gap-1.5 rounded-full border px-3 text-[12px] font-bold transition-colors",
                          active
                            ? item.id === "terminate"
                              ? "border-rose-600 bg-rose-600 text-white"
                              : item.id === "suspend"
                                ? "border-amber-600 bg-amber-600 text-white"
                                : "border-[#111111] bg-[#111111] text-white"
                            : "border-black/10 bg-[#F7F7F7] text-[#374151] hover:bg-black/5",
                        )}
                      >
                        <Icon className="size-3.5 shrink-0" strokeWidth={2} />
                        <span className="truncate">{item[locale]}</span>
                      </button>
                    )
                  })}
                </div>
              </div>
            ) : null}

            {/* Package Selection */}
            <div className="flex flex-col gap-1.5">
              <span className="text-[12px] font-bold text-[#374151]">
                {isAr ? "الباقة *" : "Subscription package *"}
              </span>
              <select
                value={selectedPackage?.id ?? ""}
                onChange={(e) => handlePackageChange(e.target.value)}
                disabled={
                  state.mode === "manage" &&
                  (manageAction === "suspend" || manageAction === "terminate")
                }
                className={cn(
                  inputClass,
                  state.mode === "manage" &&
                    (manageAction === "suspend" || manageAction === "terminate") &&
                    "opacity-60",
                )}
              >
                {packages.map((pkg) => (
                  <option key={pkg.id} value={pkg.id}>
                    {pkg.name[locale]} — {pkg.price[locale]} ({pkg.durationDays}{" "}
                    {isAr ? "يوم" : "days"})
                    {!pkg.isActive ? (isAr ? " [مؤرشفة]" : " [Archived]") : ""}
                  </option>
                ))}
              </select>

              {/* Package Entitlements Preview */}
              {selectedPackage ? (
                <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                  <span className="text-[11px] font-bold text-[#6B7280]">
                    {isAr ? "صلاحيات الباقة:" : "Included access:"}
                  </span>
                  {ENTITLEMENT_KEYS.map((key) => {
                    const allowed = entitlements[key]
                    return (
                      <span
                        key={key}
                        className={cn(
                          "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold",
                          allowed
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-black/5 text-[#8c8c8c] line-through",
                        )}
                      >
                        {allowed ? <Check className="size-3" strokeWidth={2.5} /> : null}
                        {ENTITLEMENT_SHORT_LABELS[key][locale]}
                      </span>
                    )
                  })}
                </div>
              ) : null}
            </div>

            {/* Initial status when assigning */}
            {state.mode === "assign" ? (
              <div className="flex flex-col gap-1.5">
                <span className="text-[12px] font-bold text-[#374151]">
                  {isAr ? "حالة التفعيل" : "Activation status"}
                </span>
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setAssignStatus("active")}
                    className={cn(
                      "inline-flex h-10 items-center justify-center rounded-full border px-4 text-[13px] font-bold transition-colors",
                      assignStatus === "active"
                        ? "border-[#111111] bg-[#111111] text-white"
                        : "border-black/10 bg-[#F7F7F7] text-[#374151]",
                    )}
                  >
                    {isAr ? "تفعيل فوري (نشط)" : "Activate now (Active)"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setAssignStatus("pending")}
                    className={cn(
                      "inline-flex h-10 items-center justify-center rounded-full border px-4 text-[13px] font-bold transition-colors",
                      assignStatus === "pending"
                        ? "border-[#111111] bg-[#111111] text-white"
                        : "border-black/10 bg-[#F7F7F7] text-[#374151]",
                    )}
                  >
                    {isAr ? "قيد الانتظار (يُفعّل لاحقاً)" : "Pending activation"}
                  </button>
                </div>
              </div>
            ) : null}

            {/* Status dropdown when in "edit" tab */}
            {state.mode === "manage" && manageAction === "edit" ? (
              <label className="flex flex-col gap-1.5">
                <span className="text-[12px] font-bold text-[#374151]">
                  {isAr ? "حالة الاشتراك" : "Subscription status"}
                </span>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value as SubscriptionStatus)}
                  className={inputClass}
                >
                  <option value="active">{isAr ? "نشط" : "Active"}</option>
                  <option value="pending">{isAr ? "قيد الانتظار" : "Pending"}</option>
                  <option value="suspended">{isAr ? "موقوف مؤقتاً" : "Suspended"}</option>
                  <option value="expired">{isAr ? "منتهٍ" : "Expired"}</option>
                  <option value="cancelled">{isAr ? "ملغى / منتهي" : "Cancelled"}</option>
                </select>
              </label>
            ) : null}

            {/* Start & Expiration Dates */}
            {(state.mode === "assign" && assignStatus === "active") ||
            state.mode === "manage" ? (
              <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
                <label className="flex flex-col gap-1.5">
                  <span className="text-[12px] font-bold text-[#374151]">
                    {isAr ? "تاريخ البدء" : "Start date"}
                  </span>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => handleStartDateChange(e.target.value)}
                    disabled={
                      state.mode === "manage" &&
                      (manageAction === "suspend" || manageAction === "terminate")
                    }
                    className={inputClass}
                  />
                </label>
                <label className="flex flex-col gap-1.5">
                  <span className="text-[12px] font-bold text-[#374151]">
                    {isAr ? "تاريخ الانتهاء" : "Expiration date"}
                  </span>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className={inputClass}
                  />
                </label>
              </div>
            ) : null}

            {/* Bilingual Notes */}
            <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
              <label className="flex flex-col gap-1.5">
                <span className="text-[12px] font-bold text-[#374151]">
                  {isAr ? "ملاحظات الإدارة (عربي)" : "Admin notes (Arabic)"}
                </span>
                <textarea
                  dir="rtl"
                  rows={2}
                  value={notesAr}
                  onChange={(e) => setNotesAr(e.target.value)}
                  placeholder="مثال: تم تأكيد الدفع نقداً…"
                  className="w-full rounded-[16px] border border-black/10 bg-[#F7F7F7] px-3.5 py-2.5 text-[13px] font-medium text-[#111111] outline-none transition-colors focus:border-[#111111] focus:bg-white"
                />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="text-[12px] font-bold text-[#374151]">
                  {isAr ? "ملاحظات الإدارة (English)" : "Admin notes (English)"}
                </span>
                <textarea
                  dir="ltr"
                  rows={2}
                  value={notesEn}
                  onChange={(e) => setNotesEn(e.target.value)}
                  placeholder="e.g. Manual renewal confirmed…"
                  className="w-full rounded-[16px] border border-black/10 bg-[#F7F7F7] px-3.5 py-2.5 text-[13px] font-medium text-[#111111] outline-none transition-colors focus:border-[#111111] focus:bg-white"
                />
              </label>
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
              className={cn(
                "inline-flex h-11 items-center justify-center rounded-full px-7 text-[14px] font-bold text-white transition-colors disabled:opacity-60",
                state.mode === "manage" && manageAction === "terminate"
                  ? "bg-rose-600 hover:bg-rose-700"
                  : state.mode === "manage" && manageAction === "suspend"
                    ? "bg-amber-600 hover:bg-amber-700"
                    : "bg-[#0d1117] hover:bg-[#0d1117]/90",
              )}
            >
              {busy
                ? isAr
                  ? "جاري الحفظ…"
                  : "Saving…"
                : state.mode === "assign"
                  ? assignStatus === "active"
                    ? isAr
                      ? "تعيين وتفعيل الاشتراك"
                      : "Assign & activate"
                    : isAr
                      ? "حفظ كاشتراك معلّق"
                      : "Save as pending"
                  : manageAction === "activate"
                    ? isAr
                      ? "تفعيل الاشتراك الآن"
                      : "Activate subscription"
                    : manageAction === "renew"
                      ? isAr
                        ? "تجديد الاشتراك"
                        : "Renew subscription"
                      : manageAction === "suspend"
                        ? isAr
                           ? "تأكيد الإيقاف المؤقت"
                          : "Confirm suspension"
                        : manageAction === "terminate"
                          ? isAr
                            ? "تأكيد إنهاء الاشتراك"
                            : "Confirm termination"
                          : isAr
                            ? "حفظ التغييرات"
                            : "Save changes"}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body,
  )
}

