import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { KeyRound, Mail, Phone, Ruler, ShieldCheck, Target, UserRound } from "lucide-react"
import {
  StatusBadge,
  accountStatusTone,
  subscriptionStatusTone,
} from "@/components/dashboard/StatusBadge"
import { useAuth } from "@/features/auth/auth-context"
import {
  getSubscriberByEmail,
  getSubscriberById,
} from "@/features/subscribers/demo"
import {
  useSaveSubscriberMutation,
  useSubscribersQuery,
} from "@/features/subscribers/hooks"
import { currentSubscriptionFor } from "@/features/subscriptions/demo"
import {
  usePackagesQuery,
  useSubscriptionsQuery,
} from "@/features/subscriptions/hooks"
import { useDocumentTitle } from "@/hooks/useDocumentTitle"
import { useLocale } from "@/hooks/useLocale"
import { formatDate, initials } from "@/lib/format"
import { appToast } from "@/lib/toast"

export function ProfilePage() {
  const { t } = useTranslation()
  const { locale, setLocale } = useLocale()
  const { user, updateAccount, changePassword } = useAuth()
  useDocumentTitle(t("nav.profile"))

  const isAr = locale === "ar"
  const { data: subscribers = [] } = useSubscribersQuery()
  const { data: packages = [] } = usePackagesQuery()
  const { data: subscriptions = [] } = useSubscriptionsQuery()
  const saveSubscriberMutation = useSaveSubscriberMutation()

  const subscriberRecord =
    (user
      ? subscribers.find(
          (s) =>
            s.id === user.uid ||
            s.email.toLowerCase() === user.email.toLowerCase(),
        ) ??
        getSubscriberById(user.uid) ??
        getSubscriberByEmail(user.email)
      : undefined) ?? subscribers[0]

  void subscriptions
  const currentSub = subscriberRecord
    ? currentSubscriptionFor(subscriberRecord.id)
    : undefined
  const currentPkg = currentSub
    ? packages.find((p) => p.id === currentSub.packageId)
    : undefined

  const [displayName, setDisplayName] = useState("")
  const [phone, setPhone] = useState("")
  const [heightCm, setHeightCm] = useState("")
  const [age, setAge] = useState("")
  const [targetWeightKg, setTargetWeightKg] = useState("")
  const [goalText, setGoalText] = useState("")
  const [healthText, setHealthText] = useState("")
  const [savingProfile, setSavingProfile] = useState(false)

  const [currentPassword, setCurrentPassword] = useState("")
  const [nextPassword, setNextPassword] = useState("")
  const [savingPassword, setSavingPassword] = useState(false)

  useEffect(() => {
    setDisplayName(
      user?.displayName || subscriberRecord?.displayName || "",
    )
    setPhone(user?.phone || subscriberRecord?.phone || "")
    setHeightCm(
      subscriberRecord?.heightCm ? String(subscriberRecord.heightCm) : "",
    )
    setAge(subscriberRecord?.age ? String(subscriberRecord.age) : "")
    setTargetWeightKg(
      subscriberRecord?.targetWeightKg
        ? String(subscriberRecord.targetWeightKg)
        : "",
    )
    setGoalText(subscriberRecord?.goal?.[locale] ?? "")
    setHealthText(subscriberRecord?.healthNotes?.[locale] ?? "")
  }, [user, subscriberRecord, locale])

  async function handleProfileSubmit(event: React.FormEvent) {
    event.preventDefault()
    if (!displayName.trim()) return

    setSavingProfile(true)
    try {
      await updateAccount({
        displayName: displayName.trim(),
        phone: phone.trim(),
      })

      if (subscriberRecord) {
        await saveSubscriberMutation.mutateAsync({
          ...subscriberRecord,
          displayName: displayName.trim(),
          phone: phone.trim() || subscriberRecord.phone,
          locale,
          age: age ? Number(age) : subscriberRecord.age,
          heightCm: heightCm ? Number(heightCm) : subscriberRecord.heightCm,
          targetWeightKg: targetWeightKg
            ? Number(targetWeightKg)
            : subscriberRecord.targetWeightKg,
          goal: goalText.trim()
            ? {
                ar:
                  locale === "ar"
                    ? goalText.trim()
                    : (subscriberRecord.goal?.ar ?? goalText.trim()),
                en:
                  locale === "en"
                    ? goalText.trim()
                    : (subscriberRecord.goal?.en ?? goalText.trim()),
              }
            : subscriberRecord.goal,
          healthNotes: healthText.trim()
            ? {
                ar:
                  locale === "ar"
                    ? healthText.trim()
                    : (subscriberRecord.healthNotes?.ar ?? healthText.trim()),
                en:
                  locale === "en"
                    ? healthText.trim()
                    : (subscriberRecord.healthNotes?.en ?? healthText.trim()),
              }
            : subscriberRecord.healthNotes,
        })
      }

      appToast.success(
        isAr
          ? "تم حفظ بيانات الملف الشخصي بنجاح"
          : "Profile updated successfully",
      )
    } catch {
      appToast.error(
        isAr ? "تعذر حفظ التغييرات" : "Could not update profile",
      )
    } finally {
      setSavingProfile(false)
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
    setSavingPassword(true)
    try {
      await changePassword(currentPassword, nextPassword)
      setCurrentPassword("")
      setNextPassword("")
      appToast.success(
        isAr ? "تم تحديث كلمة المرور بنجاح" : "Password updated successfully",
      )
    } catch {
      appToast.error(
        isAr
          ? "تعذر تغيير كلمة المرور، تحقق من كلمة المرور الحالية."
          : "Failed to change password. Check your current password.",
      )
    } finally {
      setSavingPassword(false)
    }
  }

  const accountStatus = subscriberRecord?.status ?? user?.status ?? "active"

  return (
    <div className="flex flex-col gap-4 sm:gap-5">
      {/* Identity Header Card */}
      <section className="rounded-[24px] bg-white p-5 sm:p-7">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <span className="inline-flex size-14 shrink-0 items-center justify-center rounded-2xl bg-[var(--gym-ink,#111111)] font-heading text-[18px] font-bold text-[var(--gym-lime,#fb5001)]">
              {initials(displayName || user?.email || "DF")}
            </span>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="font-heading text-[20px] font-extrabold text-[var(--gym-ink,#111111)]">
                  {displayName || user?.email}
                </h2>
                <StatusBadge
                  label={t(`admin.status.${accountStatus}`)}
                  tone={accountStatusTone(accountStatus)}
                />
                {currentSub ? (
                  <StatusBadge
                    label={t(`admin.status.${currentSub.status}`)}
                    tone={subscriptionStatusTone(currentSub.status)}
                  />
                ) : null}
              </div>
              <p className="mt-1 text-[13px] font-medium text-[#8c8c8c]">
                {user?.email || subscriberRecord?.email}
                {currentPkg ? ` · ${currentPkg.name[locale]}` : ""}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setLocale(locale === "ar" ? "en" : "ar")}
              className="inline-flex h-10 items-center rounded-full bg-[#F4F4F4] px-4 text-[12px] font-bold text-[var(--gym-ink,#111111)] transition hover:bg-black/10"
            >
              {isAr ? "Switch to English" : "التبديل إلى العربية"}
            </button>
          </div>
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-[1.35fr_1fr]">
        {/* Personal & Training Details Form */}
        <section className="rounded-[24px] bg-white p-5 sm:p-7">
          <div className="flex items-center gap-2.5">
            <UserRound className="size-5 text-[var(--gym-lime,#fb5001)]" strokeWidth={2} />
            <h3 className="font-heading text-[16px] font-extrabold text-[var(--gym-ink,#111111)]">
              {isAr ? "المعلومات الشخصية والتدريبية" : "Personal & training details"}
            </h3>
          </div>

          <form onSubmit={handleProfileSubmit} className="mt-5 space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="flex flex-col gap-1.5">
                <span className="text-[12px] font-bold text-[#6B7280]">
                  {isAr ? "الاسم الكامل" : "Full name"}
                </span>
                <input
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="h-11 rounded-2xl bg-[#F4F4F4] px-4 text-[14px] font-medium text-[var(--gym-ink,#111111)] outline-none"
                />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="text-[12px] font-bold text-[#6B7280]">
                  {isAr ? "رقم الهاتف" : "Phone number"}
                </span>
                <input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="h-11 rounded-2xl bg-[#F4F4F4] px-4 text-[14px] font-medium text-[var(--gym-ink,#111111)] outline-none"
                />
              </label>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <label className="flex flex-col gap-1.5">
                <span className="text-[12px] font-bold text-[#6B7280]">
                  {isAr ? "العمر" : "Age"}
                </span>
                <input
                  type="number"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  className="h-11 rounded-2xl bg-[#F4F4F4] px-4 text-[14px] font-medium text-[var(--gym-ink,#111111)] outline-none"
                />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="text-[12px] font-bold text-[#6B7280]">
                  {isAr ? "الطول (سم)" : "Height (cm)"}
                </span>
                <input
                  type="number"
                  value={heightCm}
                  onChange={(e) => setHeightCm(e.target.value)}
                  className="h-11 rounded-2xl bg-[#F4F4F4] px-4 text-[14px] font-medium text-[var(--gym-ink,#111111)] outline-none"
                />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="text-[12px] font-bold text-[#6B7280]">
                  {isAr ? "الوزن المستهدف (كجم)" : "Target wt (kg)"}
                </span>
                <input
                  type="number"
                  step="0.1"
                  value={targetWeightKg}
                  onChange={(e) => setTargetWeightKg(e.target.value)}
                  className="h-11 rounded-2xl bg-[#F4F4F4] px-4 text-[14px] font-medium text-[var(--gym-ink,#111111)] outline-none"
                />
              </label>
            </div>

            <label className="flex flex-col gap-1.5">
              <span className="text-[12px] font-bold text-[#6B7280]">
                {isAr ? "الهدف التدريبي" : "Training goal"}
              </span>
              <input
                value={goalText}
                onChange={(e) => setGoalText(e.target.value)}
                className="h-11 rounded-2xl bg-[#F4F4F4] px-4 text-[14px] font-medium text-[var(--gym-ink,#111111)] outline-none"
              />
            </label>

            <label className="flex flex-col gap-1.5">
              <span className="text-[12px] font-bold text-[#6B7280]">
                {isAr
                  ? "ملاحظات صحية أو إصابات"
                  : "Health or injury notes"}
              </span>
              <textarea
                rows={2}
                value={healthText}
                onChange={(e) => setHealthText(e.target.value)}
                className="rounded-2xl bg-[#F4F4F4] p-3 text-[13px] font-medium text-[var(--gym-ink,#111111)] outline-none"
              />
            </label>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={savingProfile}
                className="inline-flex h-11 items-center justify-center rounded-full bg-[var(--gym-ink,#111111)] px-6 text-[13px] font-bold text-white transition hover:opacity-95 disabled:opacity-50"
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

        <div className="flex flex-col gap-4">
          {/* Account & Subscription Summary */}
          <section className="rounded-[24px] bg-white p-5 sm:p-7">
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
                <dd className="font-bold text-[var(--gym-ink,#111111)]">
                  {user?.email || subscriberRecord?.email || "—"}
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
            </dl>
          </section>

          {/* Security & Password Change */}
          <section className="rounded-[24px] bg-white p-5 sm:p-7">
            <div className="flex items-center gap-2.5">
              <KeyRound
                className="size-5 text-[var(--gym-lime,#fb5001)]"
                strokeWidth={2}
              />
              <h3 className="font-heading text-[16px] font-extrabold text-[var(--gym-ink,#111111)]">
                {isAr ? "تغيير كلمة المرور" : "Change password"}
              </h3>
            </div>
            <form onSubmit={handlePasswordSubmit} className="mt-4 space-y-3">
              <label className="flex flex-col gap-1">
                <span className="text-[12px] font-bold text-[#6B7280]">
                  {isAr ? "كلمة المرور الحالية" : "Current password"}
                </span>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="h-10 rounded-xl bg-[#F4F4F4] px-3.5 text-[13px] font-medium text-[var(--gym-ink,#111111)] outline-none"
                />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-[12px] font-bold text-[#6B7280]">
                  {isAr ? "كلمة المرور الجديدة" : "New password"}
                </span>
                <input
                  type="password"
                  value={nextPassword}
                  onChange={(e) => setNextPassword(e.target.value)}
                  className="h-10 rounded-xl bg-[#F4F4F4] px-3.5 text-[13px] font-medium text-[var(--gym-ink,#111111)] outline-none"
                />
              </label>
              <div className="flex justify-end pt-1">
                <button
                  type="submit"
                  disabled={savingPassword}
                  className="inline-flex h-10 items-center justify-center rounded-full bg-[#F4F4F4] px-5 text-[12px] font-bold text-[var(--gym-ink,#111111)] transition hover:bg-black/10 disabled:opacity-50"
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
          </section>
        </div>
      </div>
    </div>
  )
}
