import { useEffect, useMemo, useState } from "react"
import { Link } from "react-router-dom"
import { useTranslation } from "react-i18next"
import {
  KeyRound,
  Languages,
  Mail,
  Phone,
  Ruler,
  ShieldCheck,
  Target,
  UserRound,
} from "lucide-react"
import {
  StatusBadge,
  accountStatusTone,
  subscriptionStatusTone,
} from "@/components/dashboard/StatusBadge"
import { APP_ROUTES } from "@/config/constants"
import { useAuth } from "@/features/auth/auth-context"
import { firebaseAuthErrorKey } from "@/features/auth/errors"
import {
  buildSubscriberRow,
  subscriberDisplayName,
} from "@/features/subscribers"
import { useUpdateMyProfileMutation } from "@/features/subscribers/hooks"
import { usePanelSubscriber } from "@/features/subscribers/use-panel-subscriber"
import {
  pickCurrentSubscription,
  resolveEffectiveSubscriptionStatus,
} from "@/features/subscriptions/entitlements"
import {
  usePackageByIdQuery,
  useSubscriberSubscriptionsQuery,
} from "@/features/subscriptions/hooks"
import { useDocumentTitle } from "@/hooks/useDocumentTitle"
import { useLocale } from "@/hooks/useLocale"
import { formatDate, initials } from "@/lib/format"
import { appToast } from "@/lib/toast"

function parseOptionalNumber(raw: string): number | null {
  const trimmed = raw.trim()
  if (!trimmed) return null
  const n = Number(trimmed)
  return Number.isFinite(n) ? n : null
}

export function ProfilePage() {
  const { t } = useTranslation()
  const { locale, setLocale } = useLocale()
  const { user, changePassword, sendPasswordResetLink, refreshProfile } =
    useAuth()
  useDocumentTitle(t("nav.profile"))

  const isAr = locale === "ar"
  const {
    subscriber: subscriberRecord,
    subscriberId,
    isLoading: profileLoading,
  } = usePanelSubscriber()
  const { data: subscriptions = [], isLoading: subsLoading } =
    useSubscriberSubscriptionsQuery(subscriberId)
  const updateProfileMutation = useUpdateMyProfileMutation()

  const currentSub = useMemo(() => {
    if (!subscriberRecord) return undefined
    return (
      pickCurrentSubscription(subscriptions) ??
      buildSubscriberRow(subscriberRecord, subscriptions).subscription ??
      undefined
    )
  }, [subscriberRecord, subscriptions])

  const effectiveStatus = currentSub
    ? resolveEffectiveSubscriptionStatus(currentSub)
    : null
  const { data: currentPkg } = usePackageByIdQuery(currentSub?.packageId)

  const [displayName, setDisplayName] = useState("")
  const [phone, setPhone] = useState("")
  const [sex, setSex] = useState<"" | "male" | "female">("")
  const [heightCm, setHeightCm] = useState("")
  const [age, setAge] = useState("")
  const [startingWeightKg, setStartingWeightKg] = useState("")
  const [targetWeightKg, setTargetWeightKg] = useState("")
  const [goalText, setGoalText] = useState("")
  const [healthText, setHealthText] = useState("")

  const [currentPassword, setCurrentPassword] = useState("")
  const [nextPassword, setNextPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [savingPassword, setSavingPassword] = useState(false)
  const [sendingReset, setSendingReset] = useState(false)

  useEffect(() => {
    if (!subscriberRecord) return
    setDisplayName(
      subscriberRecord.name?.[locale]?.trim() ||
        subscriberRecord.displayName ||
        user?.displayName ||
        "",
    )
    setPhone(subscriberRecord.phone || user?.phone || "")
    setSex(subscriberRecord.sex ?? "")
    setHeightCm(
      subscriberRecord.heightCm != null
        ? String(subscriberRecord.heightCm)
        : "",
    )
    setAge(subscriberRecord.age != null ? String(subscriberRecord.age) : "")
    setStartingWeightKg(
      subscriberRecord.startingWeightKg != null
        ? String(subscriberRecord.startingWeightKg)
        : "",
    )
    setTargetWeightKg(
      subscriberRecord.targetWeightKg != null
        ? String(subscriberRecord.targetWeightKg)
        : "",
    )
    setGoalText(
      subscriberRecord.goal?.[locale] ||
        subscriberRecord.goal?.en ||
        subscriberRecord.goal?.ar ||
        "",
    )
    setHealthText(
      subscriberRecord.healthNotes?.[locale] ||
        subscriberRecord.healthNotes?.en ||
        subscriberRecord.healthNotes?.ar ||
        "",
    )
  }, [user, subscriberRecord, locale])

  const shownName = subscriberRecord
    ? subscriberDisplayName(subscriberRecord, locale)
    : displayName || user?.email || ""

  async function handleProfileSubmit(event: React.FormEvent) {
    event.preventDefault()
    const name = displayName.trim()
    if (!name) {
      appToast.error(
        isAr ? "الاسم مطلوب" : "Full name is required",
      )
      return
    }

    try {
      await updateProfileMutation.mutateAsync({
        displayName: name,
        phone: phone.trim(),
        locale,
        sex: sex || null,
        age: parseOptionalNumber(age),
        heightCm: parseOptionalNumber(heightCm),
        startingWeightKg: parseOptionalNumber(startingWeightKg),
        targetWeightKg: parseOptionalNumber(targetWeightKg),
        goalText: goalText.trim(),
        healthNotesText: healthText.trim(),
      })
      await refreshProfile().catch(() => undefined)
      appToast.success(
        isAr
          ? "تم حفظ بيانات الملف الشخصي بنجاح"
          : "Profile updated successfully",
      )
    } catch (err) {
      const code =
        typeof err === "object" && err && "code" in err
          ? String((err as { code: unknown }).code)
          : ""
      appToast.error(
        code.startsWith("auth/")
          ? t(firebaseAuthErrorKey(err))
          : isAr
            ? "تعذر حفظ التغييرات"
            : "Could not update profile",
      )
    }
  }

  async function handlePasswordSubmit(event: React.FormEvent) {
    event.preventDefault()
    if (!currentPassword || nextPassword.length < 6) {
      appToast.error(
        isAr
          ? "يرجى إدخال كلمة المرور الحالية وكلمة مرور جديدة من 6 أحرف على الأقل."
          : "Enter your current password and a new password of at least 6 characters.",
      )
      return
    }
    if (nextPassword !== confirmPassword) {
      appToast.error(
        isAr
          ? "كلمة المرور الجديدة وتأكيدها غير متطابقين."
          : "New password and confirmation do not match.",
      )
      return
    }
    setSavingPassword(true)
    try {
      await changePassword(currentPassword, nextPassword)
      setCurrentPassword("")
      setNextPassword("")
      setConfirmPassword("")
      appToast.success(
        isAr ? "تم تحديث كلمة المرور بنجاح" : "Password updated successfully",
      )
    } catch (err) {
      appToast.error(t(firebaseAuthErrorKey(err)))
    } finally {
      setSavingPassword(false)
    }
  }

  async function handleSendResetEmail() {
    const targetEmail = user?.email || subscriberRecord?.email
    if (!targetEmail) return
    setSendingReset(true)
    try {
      await sendPasswordResetLink(targetEmail)
      appToast.success(
        isAr
          ? `تم إرسال رابط إعادة تعيين كلمة المرور إلى ${targetEmail}`
          : `Password reset link sent to ${targetEmail}`,
      )
    } catch (err) {
      appToast.error(t(firebaseAuthErrorKey(err)))
    } finally {
      setSendingReset(false)
    }
  }

  const accountStatus = subscriberRecord?.status ?? user?.status ?? "active"
  const savingProfile = updateProfileMutation.isPending
  const loading = profileLoading || (Boolean(subscriberId) && subsLoading)

  if (loading && !subscriberRecord) {
    return (
      <div className="rounded-[24px] border border-black/5 bg-white p-8 text-[14px] text-[#8c8c8c]">
        {isAr ? "جارٍ تحميل الملف الشخصي…" : "Loading profile…"}
      </div>
    )
  }

  if (!subscriberRecord) {
    return (
      <div className="rounded-[24px] border border-black/5 bg-white p-8 text-[14px] text-[#8c8c8c]">
        {isAr
          ? "تعذر العثور على ملف المشترك. تواصل مع المدرب إن استمرت المشكلة."
          : "Subscriber profile not found. Contact your coach if this continues."}
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4 sm:gap-5 pb-10">
      <section className="rounded-[24px] border border-black/5 bg-white p-5 shadow-xs sm:p-7">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-center gap-3.5 sm:gap-4">
            <span className="inline-flex size-13 shrink-0 items-center justify-center rounded-2xl bg-[var(--gym-ink,#111111)] font-heading text-[17px] font-bold text-[var(--gym-lime,#fb5001)] shadow-xs sm:size-14 sm:text-[18px]">
              {initials(shownName || "DF")}
            </span>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="truncate font-heading text-[18px] font-extrabold text-[var(--gym-ink,#111111)] sm:text-[20px]">
                  {shownName}
                </h2>
                <StatusBadge
                  label={t(`admin.status.${accountStatus}`)}
                  tone={accountStatusTone(accountStatus)}
                />
                {effectiveStatus && effectiveStatus !== accountStatus ? (
                  <StatusBadge
                    label={`${isAr ? "الاشتراك: " : "Sub: "}${t(`admin.status.${effectiveStatus}`)}`}
                    tone={subscriptionStatusTone(effectiveStatus)}
                  />
                ) : null}
              </div>
              <p className="mt-1 truncate text-[12.5px] font-medium text-[#8c8c8c] sm:text-[13px]">
                {user?.email || subscriberRecord.email}
                {currentPkg ? ` · ${currentPkg.name[locale]}` : ""}
              </p>
            </div>
          </div>

          <div className="flex shrink-0 flex-wrap items-center gap-2 self-start sm:self-auto">
            <Link
              to={APP_ROUTES.subscriber.subscription}
              className="inline-flex h-9.5 items-center rounded-full bg-[#F4F4F4] px-4 text-[12px] font-bold text-[var(--gym-ink,#111111)] shadow-2xs transition hover:bg-[#ECECEC] sm:h-10"
            >
              {isAr ? "اشتراكي" : "My subscription"}
            </Link>
            <button
              type="button"
              onClick={() => {
                const next = locale === "ar" ? "en" : "ar"
                setLocale(next)
                void updateProfileMutation
                  .mutateAsync({ locale: next })
                  .catch(() => undefined)
              }}
              className="inline-flex h-9.5 items-center rounded-full bg-[#F4F4F4] px-4 text-[12px] font-bold text-[var(--gym-ink,#111111)] shadow-2xs transition hover:bg-[#ECECEC] sm:h-10"
            >
              {isAr ? "Switch to English" : "التبديل إلى العربية"}
            </button>
          </div>
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-[1.35fr_1fr]">
        <section className="rounded-[24px] border border-black/5 bg-white p-5 shadow-xs sm:p-7">
          <div className="flex items-center gap-2.5">
            <UserRound
              className="size-5 text-[var(--gym-lime,#fb5001)]"
              strokeWidth={2}
            />
            <h3 className="font-heading text-[16px] font-extrabold text-[var(--gym-ink,#111111)]">
              {isAr ? "المعلومات الشخصية والتدريبية" : "Personal & training details"}
            </h3>
          </div>
          <p className="mt-1.5 text-[12px] leading-relaxed text-[#8c8c8c]">
            {isAr
              ? "يمكنك تحديث بياناتك المسموح بها فقط. البريد الإلكتروني وحالة الحساب يُداران من لوحة المدرب."
              : "You can update permitted details only. Email and account status are managed by your coach."}
          </p>

          <form onSubmit={handleProfileSubmit} className="mt-5 space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="flex flex-col gap-1.5">
                <span className="text-[12px] font-bold text-[#6B7280]">
                  {isAr ? "الاسم الكامل" : "Full name"}
                </span>
                <input
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  maxLength={80}
                  required
                  className="h-11 rounded-2xl border border-transparent bg-[#F4F4F4] px-4 text-[14px] font-medium text-[var(--gym-ink,#111111)] outline-none transition-all focus:border-black/20 focus:bg-white focus:ring-2 focus:ring-[var(--gym-lime,#fb5001)]/30"
                />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="text-[12px] font-bold text-[#6B7280]">
                  {isAr ? "رقم الهاتف" : "Phone number"}
                </span>
                <input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  maxLength={40}
                  className="h-11 rounded-2xl border border-transparent bg-[#F4F4F4] px-4 text-[14px] font-medium text-[var(--gym-ink,#111111)] outline-none transition-all focus:border-black/20 focus:bg-white focus:ring-2 focus:ring-[var(--gym-lime,#fb5001)]/30"
                />
              </label>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <label className="flex flex-col gap-1.5">
                <span className="truncate text-[12px] font-bold text-[#6B7280]">
                  {isAr ? "الجنس" : "Sex"}
                </span>
                <select
                  value={sex}
                  onChange={(e) =>
                    setSex(e.target.value as "" | "male" | "female")
                  }
                  className="h-11 rounded-2xl border border-transparent bg-[#F4F4F4] px-3 text-[14px] font-medium text-[var(--gym-ink,#111111)] outline-none transition-all focus:border-black/20 focus:bg-white focus:ring-2 focus:ring-[var(--gym-lime,#fb5001)]/30"
                >
                  <option value="">—</option>
                  <option value="male">{isAr ? "ذكر" : "Male"}</option>
                  <option value="female">{isAr ? "أنثى" : "Female"}</option>
                </select>
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="truncate text-[12px] font-bold text-[#6B7280]">
                  {isAr ? "العمر" : "Age"}
                </span>
                <input
                  type="number"
                  min={10}
                  max={100}
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  className="h-11 rounded-2xl border border-transparent bg-[#F4F4F4] px-4 text-[14px] font-medium text-[var(--gym-ink,#111111)] outline-none transition-all focus:border-black/20 focus:bg-white focus:ring-2 focus:ring-[var(--gym-lime,#fb5001)]/30"
                />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="truncate text-[12px] font-bold text-[#6B7280]">
                  {isAr ? "الطول (سم)" : "Height (cm)"}
                </span>
                <input
                  type="number"
                  min={100}
                  max={250}
                  value={heightCm}
                  onChange={(e) => setHeightCm(e.target.value)}
                  className="h-11 rounded-2xl border border-transparent bg-[#F4F4F4] px-4 text-[14px] font-medium text-[var(--gym-ink,#111111)] outline-none transition-all focus:border-black/20 focus:bg-white focus:ring-2 focus:ring-[var(--gym-lime,#fb5001)]/30"
                />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="truncate text-[12px] font-bold text-[#6B7280]">
                  {isAr ? "الوزن الابتدائي" : "Start wt (kg)"}
                </span>
                <input
                  type="number"
                  min={30}
                  max={400}
                  step="0.1"
                  value={startingWeightKg}
                  onChange={(e) => setStartingWeightKg(e.target.value)}
                  className="h-11 rounded-2xl border border-transparent bg-[#F4F4F4] px-4 text-[14px] font-medium text-[var(--gym-ink,#111111)] outline-none transition-all focus:border-black/20 focus:bg-white focus:ring-2 focus:ring-[var(--gym-lime,#fb5001)]/30"
                />
              </label>
            </div>

            <label className="flex flex-col gap-1.5">
              <span className="text-[12px] font-bold text-[#6B7280]">
                {isAr ? "الوزن المستهدف (كجم)" : "Target weight (kg)"}
              </span>
              <input
                type="number"
                min={30}
                max={400}
                step="0.1"
                value={targetWeightKg}
                onChange={(e) => setTargetWeightKg(e.target.value)}
                className="h-11 rounded-2xl border border-transparent bg-[#F4F4F4] px-4 text-[14px] font-medium text-[var(--gym-ink,#111111)] outline-none transition-all focus:border-black/20 focus:bg-white focus:ring-2 focus:ring-[var(--gym-lime,#fb5001)]/30"
              />
            </label>

            <label className="flex flex-col gap-1.5">
              <span className="text-[12px] font-bold text-[#6B7280]">
                {isAr ? "الهدف التدريبي" : "Training goal"}
              </span>
              <input
                value={goalText}
                onChange={(e) => setGoalText(e.target.value)}
                maxLength={500}
                className="h-11 rounded-2xl border border-transparent bg-[#F4F4F4] px-4 text-[14px] font-medium text-[var(--gym-ink,#111111)] outline-none transition-all focus:border-black/20 focus:bg-white focus:ring-2 focus:ring-[var(--gym-lime,#fb5001)]/30"
              />
            </label>

            <label className="flex flex-col gap-1.5">
              <span className="text-[12px] font-bold text-[#6B7280]">
                {isAr ? "ملاحظات صحية أو إصابات" : "Health or injury notes"}
              </span>
              <textarea
                rows={2}
                value={healthText}
                onChange={(e) => setHealthText(e.target.value)}
                maxLength={2000}
                className="rounded-2xl border border-transparent bg-[#F4F4F4] p-3 text-[13px] font-medium text-[var(--gym-ink,#111111)] outline-none transition-all focus:border-black/20 focus:bg-white focus:ring-2 focus:ring-[var(--gym-lime,#fb5001)]/30"
              />
            </label>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={savingProfile}
                className="inline-flex h-11 items-center justify-center rounded-full bg-[var(--gym-ink,#111111)] px-6 text-[13px] font-bold text-white shadow-2xs transition hover:bg-[var(--gym-lime,#fb5001)] hover:opacity-95 active:scale-95 disabled:opacity-50"
              >
                {savingProfile
                  ? isAr
                    ? "جارٍ الحفظ..."
                    : "Saving..."
                  : isAr
                    ? "حفظ التغييرات"
                    : "Save changes"}
              </button>
            </div>
          </form>
        </section>

        <div className="flex h-full flex-col gap-4">
          <section className="rounded-[24px] border border-black/5 bg-white p-5 shadow-xs sm:p-7">
            <div className="flex items-center gap-2.5">
              <ShieldCheck
                className="size-5 text-[var(--gym-lime,#fb5001)]"
                strokeWidth={2}
              />
              <h3 className="font-heading text-[16px] font-extrabold text-[var(--gym-ink,#111111)]">
                {isAr ? "حالة الحساب والاشتراك" : "Account & subscription"}
              </h3>
            </div>
            <dl className="mt-4 space-y-3 text-[13px]">
              <div className="flex items-center justify-between gap-2">
                <dt className="inline-flex items-center gap-1.5 text-[#8c8c8c]">
                  <Mail className="size-3.5" />
                  {t("admin.subscribers.columns.email")}
                </dt>
                <dd className="max-w-[200px] truncate font-bold text-[var(--gym-ink,#111111)]">
                  {user?.email || subscriberRecord.email || "—"}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-2">
                <dt className="inline-flex items-center gap-1.5 text-[#8c8c8c]">
                  <Phone className="size-3.5" />
                  {t("admin.subscribers.columns.phone")}
                </dt>
                <dd className="font-bold text-[var(--gym-ink,#111111)]">
                  {phone || "—"}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-2">
                <dt className="inline-flex items-center gap-1.5 text-[#8c8c8c]">
                  <Languages className="size-3.5" />
                  {t("admin.subscribers.language")}
                </dt>
                <dd className="font-bold text-[var(--gym-ink,#111111)]">
                  {locale.toUpperCase()}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-2">
                <dt className="inline-flex items-center gap-1.5 text-[#8c8c8c]">
                  <UserRound className="size-3.5" />
                  {t("admin.subscribers.sex")}
                </dt>
                <dd className="font-bold text-[var(--gym-ink,#111111)]">
                  {sex
                    ? t(`admin.subscribers.sexValue.${sex}`)
                    : "—"}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-2">
                <dt className="inline-flex items-center gap-1.5 text-[#8c8c8c]">
                  <Ruler className="size-3.5" />
                  {t("admin.subscribers.columns.package")}
                </dt>
                <dd className="font-bold text-[var(--gym-ink,#111111)]">
                  {currentPkg?.name[locale] ?? "—"}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-2">
                <dt className="inline-flex items-center gap-1.5 text-[#8c8c8c]">
                  <Target className="size-3.5" />
                  {t("admin.subscriptions.columns.ends")}
                </dt>
                <dd className="font-bold text-[var(--gym-ink,#111111)]">
                  {formatDate(currentSub?.endsAt, locale)}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-2">
                <dt className="text-[#8c8c8c]">
                  {isAr ? "تاريخ الانضمام" : "Joined"}
                </dt>
                <dd className="font-bold text-[var(--gym-ink,#111111)]">
                  {formatDate(subscriberRecord.createdAt, locale)}
                </dd>
              </div>
            </dl>
            {subscriberRecord.coachNotes?.[locale] ||
            subscriberRecord.coachNotes?.en ? (
              <div className="mt-4 rounded-2xl bg-[#F4F4F4] p-3.5">
                <p className="text-[11px] font-bold tracking-wide text-[#8c8c8c] uppercase">
                  {isAr ? "ملاحظة المدرب" : "Coach note"}
                </p>
                <p className="mt-1.5 text-[13px] leading-relaxed text-[var(--gym-ink,#111111)]">
                  {subscriberRecord.coachNotes[locale] ||
                    subscriberRecord.coachNotes.en}
                </p>
              </div>
            ) : null}
            <p className="mt-3 text-[11px] leading-relaxed text-[#8c8c8c]">
              {isAr
                ? "تغيير الباقة أو التفعيل يتم من المدرب عبر صفحة الاشتراكات."
                : "Package changes and activation are handled by your coach in Subscriptions."}
            </p>
          </section>

          <section className="flex flex-1 flex-col justify-between rounded-[24px] border border-black/5 bg-white p-5 shadow-xs sm:p-7">
            <div>
              <div className="flex items-center gap-2.5">
                <KeyRound
                  className="size-5 text-[var(--gym-lime,#fb5001)]"
                  strokeWidth={2}
                />
                <h3 className="font-heading text-[16px] font-extrabold text-[var(--gym-ink,#111111)]">
                  {isAr ? "تغيير كلمة المرور" : "Change password"}
                </h3>
              </div>
              <form onSubmit={handlePasswordSubmit} className="mt-4 space-y-3.5">
                <label className="flex flex-col gap-1.5">
                  <span className="text-[12px] font-bold text-[#6B7280]">
                    {isAr ? "كلمة المرور الحالية" : "Current password"}
                  </span>
                  <input
                    type="password"
                    autoComplete="current-password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="h-11 rounded-2xl border border-transparent bg-[#F4F4F4] px-4 text-[13.5px] font-medium text-[var(--gym-ink,#111111)] outline-none transition-all focus:border-black/20 focus:bg-white focus:ring-2 focus:ring-[var(--gym-lime,#fb5001)]/30"
                  />
                </label>
                <label className="flex flex-col gap-1.5">
                  <span className="text-[12px] font-bold text-[#6B7280]">
                    {isAr ? "كلمة المرور الجديدة" : "New password"}
                  </span>
                  <input
                    type="password"
                    autoComplete="new-password"
                    value={nextPassword}
                    onChange={(e) => setNextPassword(e.target.value)}
                    className="h-11 rounded-2xl border border-transparent bg-[#F4F4F4] px-4 text-[13.5px] font-medium text-[var(--gym-ink,#111111)] outline-none transition-all focus:border-black/20 focus:bg-white focus:ring-2 focus:ring-[var(--gym-lime,#fb5001)]/30"
                  />
                </label>
                <label className="flex flex-col gap-1.5">
                  <span className="text-[12px] font-bold text-[#6B7280]">
                    {isAr ? "تأكيد كلمة المرور" : "Confirm password"}
                  </span>
                  <input
                    type="password"
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="h-11 rounded-2xl border border-transparent bg-[#F4F4F4] px-4 text-[13.5px] font-medium text-[var(--gym-ink,#111111)] outline-none transition-all focus:border-black/20 focus:bg-white focus:ring-2 focus:ring-[var(--gym-lime,#fb5001)]/30"
                  />
                </label>
                <div className="flex justify-end pt-1">
                  <button
                    type="submit"
                    disabled={savingPassword}
                    className="inline-flex h-10.5 items-center justify-center rounded-full bg-[#F4F4F4] px-5 text-[12px] font-bold text-[var(--gym-ink,#111111)] shadow-2xs transition-all hover:bg-[var(--gym-ink,#111111)] hover:text-white active:scale-95 disabled:opacity-50"
                  >
                    {savingPassword
                      ? isAr
                        ? "جارٍ التحديث..."
                        : "Updating..."
                      : isAr
                        ? "تحديث كلمة المرور"
                        : "Update password"}
                  </button>
                </div>
              </form>
            </div>

            <div className="mt-5 flex flex-col gap-2 border-t border-black/5 pt-3.5">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[12px] text-[#8c8c8c]">
                  {isAr ? "هل نسيت كلمة المرور؟" : "Forgot your password?"}
                </span>
                <button
                  type="button"
                  onClick={handleSendResetEmail}
                  disabled={sendingReset}
                  className="text-[12px] font-bold text-[var(--gym-lime,#fb5001)] hover:underline disabled:opacity-50"
                >
                  {sendingReset
                    ? isAr
                      ? "جارٍ الإرسال..."
                      : "Sending..."
                    : isAr
                      ? "إرسال رابط إعادة التعيين"
                      : "Send reset link"}
                </button>
              </div>
              <p className="text-[11px] leading-relaxed text-[#8c8c8c]">
                {isAr
                  ? "تغيير كلمة المرور يتطلب التحقق من الهوية. العمليات الحساسة لا يمكن تجاوزها من أدوات المطوّر."
                  : "Password changes require re-authentication. Sensitive fields cannot be escalated from DevTools."}
              </p>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
