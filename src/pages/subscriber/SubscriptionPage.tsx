import { useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import {
  ArrowRight,
  ArrowUpRight,
  CalendarClock,
  CalendarDays,
  Check,
  Clock,
  CreditCard,
  Lock,
  Package,
  ShieldCheck,
  Sparkles,
  UserCheck,
} from "lucide-react"
import { DataTable } from "@/components/dashboard/DataTable"
import { StatCard } from "@/components/dashboard/StatCard"
import {
  StatusBadge,
  subscriptionStatusTone,
} from "@/components/dashboard/StatusBadge"
import { useAuth } from "@/features/auth/auth-context"
import {
  useCreateRegistrationRequestMutation,
  useRegistrationRequestsQuery,
} from "@/features/subscribers/hooks"
import { usePanelSubscriber } from "@/features/subscribers/use-panel-subscriber"
import {
  ENTITLEMENT_KEYS,
  normalizeEntitlements,
} from "@/features/subscriptions/entitlements"
import {
  usePackagesQuery,
  useSubscriberSubscriptionsQuery,
  useSubscriptionsQuery,
} from "@/features/subscriptions/hooks"
import { useDocumentTitle } from "@/hooks/useDocumentTitle"
import { useLocale } from "@/hooks/useLocale"
import { daysUntil, formatDate } from "@/lib/format"
import { appToast } from "@/lib/toast"
import { cn } from "@/lib/utils"
import type { PackageEntitlementKey } from "@/types/subscription"

const ENTITLEMENT_LABELS: Record<
  PackageEntitlementKey,
  { ar: string; en: string; descAr: string; descEn: string }
> = {
  workoutProgram: {
    ar: "برامج التمارين التفاعلية",
    en: "Interactive workout programs",
    descAr: "الوصول إلى جدول التمارين اليومي والأسبوعي وتسجيل الأداء.",
    descEn: "Access daily and weekly training schedules and log performance.",
  },
  nutritionProgram: {
    ar: "خطط التغذية والوجبات",
    en: "Nutrition & meal plans",
    descAr: "الوصول إلى جداول الوجبات والسعرات وتسجيل الالتزام الغذائي.",
    descEn: "Access meal schedules, macros, and log daily meal adherence.",
  },
  exerciseVideos: {
    ar: "مكتبة فيديوهات التمارين",
    en: "Instructional exercise videos",
    descAr: "مشاهدة الشرح المرئي التفصيلي لكل تمرين.",
    descEn: "Watch step-by-step instructional form videos.",
  },
  pdfDocuments: {
    ar: "ملفات ومستندات PDF المحمية",
    en: "Protected PDF documents",
    descAr: "استعراض الأدلة والخطط التدريبية والغذائية بصيغة PDF.",
    descEn: "View authorized workout, nutrition, and educational PDFs.",
  },
  progressTracking: {
    ar: "تتبع التقدم والقياسات",
    en: "Progress & measurement tracking",
    descAr: "تسجيل الوزن والقياسات وصور التقدم والرسوم البيانية.",
    descEn: "Record body weight, measurements, progress photos, and charts.",
  },
}

export function SubscriptionPage() {
  const { t } = useTranslation()
  const { locale, isRtl } = useLocale()
  const { user } = useAuth()
  const isAr = locale === "ar"
  useDocumentTitle(t("nav.subscription"))

  const {
    staffCanPick,
    directory: subscribers,
    subscriber: currentSubscriber,
    subscriberId: activeSubscriberId,
    selectedSubscriberId,
    setSelectedSubscriberId,
  } = usePanelSubscriber({ allowStaffPicker: true })

  const { data: allPackages = [] } = usePackagesQuery()
  const { data: scopedSubscriptions = [] } = useSubscriberSubscriptionsQuery(
    staffCanPick ? undefined : activeSubscriberId,
  )
  // Staff preview may browse another member from the full list
  const { data: allSubscriptions = [] } = useSubscriptionsQuery({
    enabled: staffCanPick,
  })
  const { data: registrationRequests = [] } = useRegistrationRequestsQuery({
    enabled: staffCanPick,
  })
  const createRequestMutation = useCreateRegistrationRequestMutation()

  const packageMap = useMemo(
    () => new Map(allPackages.map((p) => [p.id, p])),
    [allPackages],
  )

  const subscriberHistory = useMemo(() => {
    const targetId = activeSubscriberId
    const targetEmail = (currentSubscriber?.email || user?.email || "").toLowerCase()
    const pool = staffCanPick ? allSubscriptions : scopedSubscriptions

    const matched = pool.filter(
      (item) =>
        (targetId && item.subscriberId === targetId) ||
        (targetEmail && item.subscriberEmail?.toLowerCase() === targetEmail),
    )
    return [...matched].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    )
  }, [
    allSubscriptions,
    scopedSubscriptions,
    staffCanPick,
    activeSubscriberId,
    currentSubscriber,
    user?.email,
  ])

  const current =
    subscriberHistory.find(
      (item) => item.status === "active" || item.status === "suspended",
    ) ?? subscriberHistory[0]

  const currentPackage = current ? packageMap.get(current.packageId) : undefined
  const entitlements = normalizeEntitlements(
    currentPackage?.entitlements ?? current?.entitlementsSnapshot,
  )
  const remaining = daysUntil(current?.endsAt)
  const isActive = current?.status === "active"

  // Package Upgrade State
  const [selectedTargetPackageId, setSelectedTargetPackageId] = useState<string>("")
  const [upgradeNote, setUpgradeNote] = useState("")
  const [submittingRequest, setSubmittingRequest] = useState(false)

  // Pending upgrade request for this subscriber if any
  const pendingUpgradeRequest = useMemo(() => {
    const subEmail = (currentSubscriber?.email || user?.email || "").toLowerCase()
    return registrationRequests.find(
      (r) =>
        r.status === "pending" &&
        (r.email.toLowerCase() === subEmail || (r.subscriberId && r.subscriberId === activeSubscriberId)),
    )
  }, [registrationRequests, currentSubscriber, user?.email, activeSubscriberId])

  const pendingPackage = pendingUpgradeRequest?.packageId
    ? packageMap.get(pendingUpgradeRequest.packageId)
    : undefined

  const selectablePackages = useMemo(() => {
    return allPackages.filter((p) => p.isActive)
  }, [allPackages])

  const selectedTargetPackage = selectedTargetPackageId
    ? packageMap.get(selectedTargetPackageId)
    : undefined

  async function handleRequestUpgradeSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedTargetPackage) return
    setSubmittingRequest(true)
    try {
      const targetName = currentSubscriber?.displayName || user?.displayName || "Subscriber"
      const targetEmail = currentSubscriber?.email || user?.email || "subscriber@trainer.app"
      const targetPhone = currentSubscriber?.phone || user?.phone || "+20 100 000 0000"

      await createRequestMutation.mutateAsync({
        displayName: targetName,
        email: targetEmail,
        phone: targetPhone,
        locale,
        packageId: selectedTargetPackage.id,
        goal: upgradeNote.trim()
          ? {
              ar: upgradeNote.trim(),
              en: upgradeNote.trim(),
            }
          : {
              ar: `طلب ترقية أو تغيير إلى باقة ${selectedTargetPackage.name.ar}`,
              en: `Requested upgrade to ${selectedTargetPackage.name.en}`,
            },
        source: "contact",
      })

      appToast.success(
        isAr
          ? "تم إرسال طلب الترقية بنجاح إلى المدرب لمراجعته واعتماده."
          : "Upgrade request submitted successfully to your coach for review.",
      )
      setUpgradeNote("")
      setSelectedTargetPackageId("")
    } catch {
      appToast.error(
        isAr ? "تعذر إرسال طلب الترقية، يرجى المحاولة لاحقاً." : "Could not submit request. Please try again.",
      )
    } finally {
      setSubmittingRequest(false)
    }
  }

  return (
    <div className="flex flex-col gap-4 sm:gap-5 pb-12">
      {/* Staff Member Switcher (Only visible to admin/staff) */}
      {staffCanPick ? (
        <div className="flex items-center justify-between rounded-[20px] bg-white p-3.5 sm:p-4 border border-black/5 shadow-2xs">
          <div className="flex items-center gap-2">
            <UserCheck className="size-4 text-[var(--gym-lime,#fb5001)]" />
            <span className="text-[12px] font-bold text-[#8c8c8c]">
              {isAr ? "معاينة اشتراك المشترك:" : "Preview Subscriber Subscription:"}
            </span>
          </div>
          <select
            value={selectedSubscriberId || activeSubscriberId}
            onChange={(e) => setSelectedSubscriberId(e.target.value)}
            className="rounded-lg bg-[#F4F4F4] px-3 py-1.5 text-[12px] font-bold text-[var(--gym-ink,#111111)] outline-none cursor-pointer"
          >
            {subscribers.map((s) => (
              <option key={s.id} value={s.id}>
                {s.displayName || s.email}
              </option>
            ))}
          </select>
        </div>
      ) : null}

      {/* 1. Stat Cards Row */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
        <StatCard
          label={isAr ? "الباقة الحالية" : "Current package"}
          value={
            currentPackage?.name[locale] ??
            current?.packageName?.[locale] ??
            "—"
          }
          icon={<Package className="size-4" strokeWidth={1.8} />}
        />
        <StatCard
          label={isAr ? "حالة الاشتراك" : "Status"}
          value={current ? t(`admin.status.${current.status}`) : "—"}
          icon={<CreditCard className="size-4" strokeWidth={1.8} />}
        />
        <StatCard
          label={isAr ? "تاريخ البدء" : "Start date"}
          value={formatDate(current?.startsAt, locale)}
          icon={<CalendarDays className="size-4" strokeWidth={1.8} />}
        />
        <StatCard
          label={isAr ? "تاريخ الانتهاء" : "Expiration date"}
          value={formatDate(current?.endsAt, locale)}
          hint={
            remaining != null
              ? remaining >= 0
                ? t("admin.subscribers.daysLeft", { count: remaining })
                : t("admin.subscribers.endedAgo", { count: Math.abs(remaining) })
              : undefined
          }
          icon={<CalendarClock className="size-4" strokeWidth={1.8} />}
        />
      </div>

      {/* 2. Middle 2-Column Grid: Details & Entitlements */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Left: Your Subscription Details */}
        <section className="rounded-[24px] bg-white p-5 sm:p-7 border border-black/5 shadow-xs">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="font-heading text-[18px] font-extrabold text-[var(--gym-ink,#111111)]">
                {isAr ? "تفاصيل اشتراكك الحالي" : "Your subscription details"}
              </h2>
              <p className="mt-1 text-[13px] font-medium text-[#6B7280]">
                {currentPackage?.description[locale] ??
                  (isAr
                    ? "يتم تفعيل وتجديد الاشتراكات يدوياً من قبل المدرب."
                    : "Subscription activation and renewals are managed by your coach.")}
              </p>
            </div>
            {current ? (
              <StatusBadge
                label={t(`admin.status.${current.status}`)}
                tone={subscriptionStatusTone(current.status)}
              />
            ) : null}
          </div>

          {current ? (
            <dl className="mt-6 space-y-3.5 text-[14px]">
              <div className="flex items-center justify-between border-b border-black/[0.06] pb-3">
                <dt className="text-[#6B7280]">
                  {isAr ? "الباقة" : "Package"}
                </dt>
                <dd className="font-bold text-[#111111]">
                  {currentPackage?.name[locale] ??
                    current.packageName?.[locale] ??
                    "—"}
                </dd>
              </div>
              {currentPackage ? (
                <div className="flex items-center justify-between border-b border-black/[0.06] pb-3">
                  <dt className="text-[#6B7280]">
                    {isAr ? "مدة الباقة" : "Package duration"}
                  </dt>
                  <dd className="font-semibold text-[#111111]">
                    {t("admin.packages.duration", {
                      count: currentPackage.durationDays,
                    })}
                  </dd>
                </div>
              ) : null}
              {currentPackage?.price ? (
                <div className="flex items-center justify-between border-b border-black/[0.06] pb-3">
                  <dt className="text-[#6B7280]">
                    {isAr ? "سعر الباقة" : "Package price"}
                  </dt>
                  <dd className="font-bold text-[var(--gym-ink,#111111)]">
                    {currentPackage.price[locale]} {currentPackage.period?.[locale] || ""}
                  </dd>
                </div>
              ) : null}
              <div className="flex items-center justify-between border-b border-black/[0.06] pb-3">
                <dt className="text-[#6B7280]">
                  {t("admin.subscriptions.columns.starts")}
                </dt>
                <dd className="font-semibold text-[#111111]">
                  {formatDate(current.startsAt, locale)}
                </dd>
              </div>
              <div className="flex items-center justify-between border-b border-black/[0.06] pb-3">
                <dt className="text-[#6B7280]">
                  {t("admin.subscriptions.columns.ends")}
                </dt>
                <dd className="font-semibold text-[#111111]">
                  {formatDate(current.endsAt, locale)}
                </dd>
              </div>
              {current.notes ? (
                <div className="flex flex-col gap-1 pt-1">
                  <dt className="text-[#6B7280]">
                    {t("admin.subscribers.notes")}
                  </dt>
                  <dd className="font-medium text-[#111111]">{current.notes}</dd>
                </div>
              ) : null}
            </dl>
          ) : (
            <p className="mt-6 text-[14px] font-medium text-[#8c8c8c]">
              {t("admin.subscribers.noSubscription")}
            </p>
          )}

          <div className="mt-6 rounded-[18px] bg-[#F4F4F4] p-4 text-[12px] font-medium leading-relaxed text-[#6B7280]">
            {isAr
              ? "ملاحظة: يتم تفعيل أو تجديد أو تعديل الباقات من خلال إدارة المدرب فقط. للتجديد أو الترقية، تواصل مع المدرب مباشرة."
              : "Note: Subscription activation, extensions, and package changes are managed by your trainer. Contact your coach directly to renew or upgrade."}
          </div>
        </section>

        {/* Right: Package Content Entitlements (Zero Green) */}
        <section className="rounded-[24px] bg-white p-5 sm:p-7 border border-black/5 shadow-xs">
          <div className="flex items-center gap-2">
            <ShieldCheck className="size-5 text-[var(--gym-lime,#fb5001)]" strokeWidth={2} />
            <h2 className="font-heading text-[18px] font-extrabold text-[var(--gym-ink,#111111)]">
              {isAr
                ? "صلاحيات الوصول للمحتوى"
                : "Package content entitlements"}
            </h2>
          </div>
          <p className="mt-1 text-[13px] font-medium text-[#6B7280]">
            {isAr
              ? "تعتمد صلاحيات الوصول على حالة اشتراكك والباقة المعيّنة لك."
              : "Your access to platform features depends on your active subscription status and package rules."}
          </p>

          <ul className="mt-5 flex flex-col gap-2.5">
            {ENTITLEMENT_KEYS.map((key) => {
              const grantedByPkg = entitlements[key]
              const allowed = Boolean(isActive && grantedByPkg)
              const meta = ENTITLEMENT_LABELS[key]
              return (
                <li
                  key={key}
                  className={cn(
                    "flex items-start justify-between gap-3 rounded-[18px] p-3.5",
                    allowed ? "bg-[#F4F4F4]" : "bg-[#FAFAFA] opacity-70",
                  )}
                >
                  <div className="min-w-0">
                    <p className="text-[14px] font-bold text-[#111111]">
                      {isAr ? meta.ar : meta.en}
                    </p>
                    <p className="mt-0.5 text-[12px] font-medium text-[#6B7280]">
                      {isAr ? meta.descAr : meta.descEn}
                    </p>
                  </div>
                  <span
                    className={cn(
                      "inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold",
                      allowed
                        ? "bg-[var(--gym-ink,#111111)] text-white shadow-2xs"
                        : "bg-black/8 text-[#6B7280]",
                    )}
                  >
                    {allowed ? (
                      <>
                        <Check className="size-3" strokeWidth={2.5} />
                        {isAr ? "متاح" : "Allowed"}
                      </>
                    ) : (
                      <>
                        <Lock className="size-3" strokeWidth={2} />
                        {isAr ? "مقيّد" : "Restricted"}
                      </>
                    )}
                  </span>
                </li>
              )
            })}
          </ul>
        </section>
      </div>

      {/* 3. New Section: Request Package Upgrade or Change (طلب ترقية أو تغيير الباقة) */}
      <section className="rounded-[24px] bg-white p-5 sm:p-7 border border-black/5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-black/5 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex size-9 items-center justify-center rounded-xl bg-[var(--gym-ink,#111111)] text-[var(--gym-lime,#fb5001)]">
              <Sparkles className="size-4.5" />
            </div>
            <div>
              <h2 className="font-heading text-[17px] sm:text-[18px] font-black text-[var(--gym-ink,#111111)]">
                {isAr ? "طلب ترقية أو تغيير الباقة" : "Request Package Upgrade or Change"}
              </h2>
              <p className="text-[12px] sm:text-[13px] text-[#6B7280]">
                {isAr
                  ? "اختر الباقة المناسبة لأهدافك وأرسل طلبك مباشرة إلى المدرب لمراجعته واعتماده."
                  : "Select the plan suited to your fitness goals and submit your request directly to your coach."}
              </p>
            </div>
          </div>

          {currentPackage ? (
            <span className="self-start sm:self-auto inline-flex items-center gap-1.5 rounded-full bg-black/5 px-3 py-1 text-[11.5px] font-bold text-[var(--gym-ink,#111111)]">
              <span>{isAr ? "باقتك الحالية:" : "Current plan:"}</span>
              <strong className="text-[var(--gym-orange,#fb5001)]">{currentPackage.name[locale]}</strong>
            </span>
          ) : null}
        </div>

        {/* If subscriber already has a pending upgrade request */}
        {pendingUpgradeRequest ? (
          <div className="mt-5 rounded-2xl bg-amber-50/70 border border-amber-200/80 p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-800">
                <Clock className="size-4" />
              </div>
              <div>
                <p className="font-heading text-[13.5px] font-bold text-amber-950">
                  {isAr ? "لديك طلب تغيير باقة قيد المراجعة حالياً من المدرب" : "You have a pending package request under coach review"}
                </p>
                <p className="text-[12px] text-amber-800/80 mt-0.5">
                  {isAr ? "الباقة المطلوبة: " : "Requested: "}
                  <strong>{pendingPackage?.name[locale] || pendingUpgradeRequest.packageId}</strong>
                  {" · "}
                  {formatDate(pendingUpgradeRequest.createdAt, locale)}
                </p>
              </div>
            </div>

            <StatusBadge
              label={isAr ? "قيد مراجعة المدرب" : "Pending Coach Review"}
              tone="warning"
              className="self-start sm:self-auto shrink-0"
            />
          </div>
        ) : null}

        {/* Package Choices Grid - Matching Public Website Architecture */}
        <div className="mt-8 grid grid-cols-1 items-stretch gap-6 pt-4 md:grid-cols-2 lg:grid-cols-3">
          {selectablePackages.map((pkg) => {
            const tone = pkg.tone ?? (pkg.featured ? "dark" : "light")
            const isDark = tone === "dark"
            const isCurrent = currentPackage?.id === pkg.id
            const isSelected = selectedTargetPackageId === pkg.id
            const features = pkg.featureList?.[locale] ?? []

            return (
              <article
                key={pkg.id}
                onClick={() => {
                  if (!isCurrent) setSelectedTargetPackageId(pkg.id)
                }}
                className={cn(
                  "relative flex h-full flex-col justify-between rounded-[30px] p-6 sm:p-7 xl:p-8 transition-all duration-300",
                  tone === "light" && "bg-[#f5f5f5]",
                  tone === "dark" && "bg-[var(--gym-dark,#24030c)]",
                  tone === "sage" && "bg-[#f3f0e8]",
                  isSelected
                    ? "ring-4 ring-[var(--gym-lime,#fb5001)] shadow-xl scale-[1.01]"
                    : "hover:shadow-md",
                  !isCurrent && "cursor-pointer",
                  isCurrent && "opacity-90 cursor-default",
                )}
              >
                {/* Floating pill badge */}
                {isCurrent ? (
                  <span className="pointer-events-none absolute left-1/2 top-0 z-10 -translate-x-1/2 -translate-y-1/2 whitespace-nowrap rounded-full bg-[var(--gym-ink,#111111)] px-5 py-[5px] text-[13px] sm:text-[14px] font-bold leading-[1.3] text-white shadow-md">
                    {isAr ? "باقتك الحالية" : "Current Plan"}
                  </span>
                ) : pkg.featured ? (
                  <span className="pointer-events-none absolute left-1/2 top-0 z-10 -translate-x-1/2 -translate-y-1/2 whitespace-nowrap rounded-full bg-[var(--gym-lime,#fb5001)] px-5 py-[5px] text-[13px] sm:text-[14px] font-bold leading-[1.3] text-white shadow-md">
                    {t("packages.bestValue")}
                  </span>
                ) : null}

                {/* Top stack: Title, description, price, and CTA */}
                <div className="flex flex-col">
                  <h3
                    className={cn(
                      "min-h-[2.2em] font-heading text-[21px] font-bold leading-[1.25] sm:text-[23px] xl:text-[24px]",
                      isDark ? "text-white" : "text-[var(--gym-ink,#111111)]",
                    )}
                  >
                    {pkg.name[locale]}
                  </h3>

                  <p
                    className={cn(
                      "mt-2 min-h-[2.6em] text-[13px] font-medium leading-relaxed line-clamp-2",
                      isDark ? "text-white/75" : "text-[#666]",
                    )}
                  >
                    {pkg.description[locale]}
                  </p>

                  <div className="mt-4 flex min-h-[3.25rem] flex-wrap items-end gap-1.5 sm:mt-5 sm:min-h-[3.5rem]">
                    <p
                      className={cn(
                        "font-heading text-[38px] font-bold leading-none tracking-tight sm:text-[42px] xl:text-[48px]",
                        isDark ? "text-[var(--gym-lime,#fb5001)]" : "text-[#1e2222]",
                      )}
                    >
                      {pkg.price ? pkg.price[locale] : "—"}
                    </p>
                    {pkg.period ? (
                      <p
                        className={cn(
                          "mb-1.5 font-heading text-[17px] font-semibold leading-[1.3] sm:text-[19px]",
                          isDark ? "text-[var(--gym-lime,#fb5001)]" : "text-[#1e2222]",
                        )}
                      >
                        {pkg.period[locale]}
                      </p>
                    ) : null}
                  </div>

                  <p
                    className={cn(
                      "mt-1 text-[12px] font-semibold",
                      isDark ? "text-white/60" : "text-[#888]",
                    )}
                  >
                    {t("admin.packages.duration", { count: pkg.durationDays })}
                  </p>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      if (!isCurrent) setSelectedTargetPackageId(pkg.id)
                    }}
                    className={cn(
                      "mt-6 inline-flex h-[50px] w-full shrink-0 items-center justify-center rounded-full border px-[25px] text-center text-[15px] font-bold leading-none transition-all duration-300 sm:mt-7 active:scale-95",
                      isCurrent
                        ? isDark
                          ? "border-white/20 bg-white/10 text-white/60 cursor-default"
                          : "border-black/15 bg-black/5 text-[#888] cursor-default"
                        : isSelected
                          ? "border-[var(--gym-lime,#fb5001)] bg-[var(--gym-lime,#fb5001)] text-white shadow-lg ring-2 ring-[var(--gym-lime,#fb5001)]/30"
                          : isDark
                            ? "border-white bg-transparent text-white hover:border-[var(--gym-lime,#fb5001)] hover:bg-[var(--gym-lime,#fb5001)] hover:text-white"
                            : "border-[#1e2222] bg-white text-[#1e2222] hover:bg-[var(--gym-ink,#111111)] hover:text-white",
                    )}
                  >
                    {isCurrent
                      ? isAr
                        ? "باقتك النشطة حالياً"
                        : "Current Active Plan"
                      : isSelected
                        ? isAr
                          ? "تم اختيار الباقة للترقية ✓"
                          : "Plan Selected ✓"
                        : isAr
                          ? "اختيار للترقية"
                          : "Select to Upgrade"}
                  </button>
                </div>

                {/* Features stack with border-t and arrow indicators */}
                <div
                  className={cn(
                    "mt-7 flex flex-1 flex-col gap-4 border-t pt-6 sm:gap-4.5",
                    isDark ? "border-white/15" : "border-[var(--gym-ink,#111111)]/10",
                  )}
                >
                  <p
                    className={cn(
                      "text-[15px] sm:text-[16px] font-bold",
                      isDark ? "text-white/70" : "text-[var(--gym-muted,#555)]",
                    )}
                  >
                    {t("packages.included")}
                  </p>

                  <ul className="flex flex-col gap-3.5">
                    {features.map((feature) => (
                      <li
                        key={feature}
                        className={cn(
                          "flex items-start gap-2.5 text-[14px] sm:text-[15px] font-medium leading-[1.45]",
                          isDark ? "text-white" : "text-[#1e2222]",
                        )}
                      >
                        <ArrowRight
                          aria-hidden
                          className={cn(
                            "mt-1 size-3.5 shrink-0 sm:size-4",
                            isDark
                              ? "text-[var(--gym-lime,#fb5001)]"
                              : "text-[var(--gym-ink,#111111)]",
                            isRtl && "rotate-180",
                          )}
                          strokeWidth={2.25}
                        />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </article>
            )
          })}
        </div>

        {/* Upgrade Request Confirmation Form */}
        {selectedTargetPackage && selectedTargetPackage.id !== currentPackage?.id ? (
          <form
            onSubmit={handleRequestUpgradeSubmit}
            className="mt-8 rounded-[24px] bg-[#F8F8F8] p-5 sm:p-7 border border-black/8 space-y-4"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-black/6 pb-4">
              <div>
                <span className="text-[12px] font-bold uppercase tracking-wider text-[var(--gym-lime,#fb5001)]">
                  {isAr ? "الباقة المختارة للترقية" : "Selected Plan for Upgrade"}
                </span>
                <h4 className="font-heading text-[17px] sm:text-[19px] font-black text-[var(--gym-ink,#111111)]">
                  {selectedTargetPackage.name[locale]}
                </h4>
                <p className="text-[13px] font-medium text-[#6B7280] mt-0.5">
                  {selectedTargetPackage.price?.[locale]} {selectedTargetPackage.period?.[locale]} · {t("admin.packages.duration", { count: selectedTargetPackage.durationDays })}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedTargetPackageId("")}
                  className="rounded-full bg-white px-3.5 py-1.5 text-[12px] font-bold text-[#6B7280] border border-black/10 hover:bg-neutral-100 transition"
                >
                  {isAr ? "إلغاء التحديد" : "Cancel"}
                </button>
                <span className="rounded-full bg-[var(--gym-lime,#fb5001)]/15 px-3.5 py-1.5 text-[12px] font-bold text-[var(--gym-lime,#fb5001)]">
                  {isAr ? "جاهز للإرسال للمدرب" : "Ready to Send to Coach"}
                </span>
              </div>
            </div>

            <label className="flex flex-col gap-1.5">
              <span className="text-[13px] font-bold text-[var(--gym-ink,#111111)]">
                {isAr ? "ملاحظة أو سبب طلب الترقية (اختياري للمدرب):" : "Note or reason for request (optional for your coach):"}
              </span>
              <textarea
                rows={2}
                value={upgradeNote}
                onChange={(e) => setUpgradeNote(e.target.value)}
                placeholder={
                  isAr
                    ? "مثال: أرغب بالانتقال إلى باقة تحوّل لبدء خطة التغذية والمتابعة الأسبوعية..."
                    : "e.g., I would like to upgrade to Transform for weekly nutrition coaching..."
                }
                className="rounded-2xl bg-white p-3.5 text-[13.5px] font-medium text-[var(--gym-ink,#111111)] outline-none border border-black/10 focus:border-[var(--gym-lime,#fb5001)] focus:ring-2 focus:ring-[var(--gym-lime,#fb5001)]/20 transition-all"
              />
            </label>

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-1">
              <p className="text-[12px] font-medium text-[#8c8c8c]">
                💡 {isAr
                  ? "سيتم إشعار المدرب بطلبك ومراجعته وتعديل اشتراكك وفقاً لذلك."
                  : "Your coach will be notified to review and approve your subscription update."}
              </p>

              <button
                type="submit"
                disabled={submittingRequest}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-[var(--gym-lime,#fb5001)] hover:bg-[#e04500] px-7 text-[13.5px] font-extrabold text-white transition-all shadow-md hover:scale-[1.02] active:scale-95 disabled:opacity-50 shrink-0"
              >
                <ArrowUpRight className="size-4" />
                <span>
                  {submittingRequest
                    ? isAr
                      ? "جارٍ إرسال الطلب..."
                      : "Submitting..."
                    : isAr
                      ? `إرسال طلب الترقية إلى المدرب`
                      : `Submit Upgrade Request to Coach`}
                </span>
              </button>
            </div>
          </form>
        ) : null}
      </section>

      {/* 4. Subscription History Table */}
      <DataTable
        rows={subscriberHistory}
        rowKey={(row) => row.id}
        empty={t("admin.subscriptions.empty")}
        toolbar={
          <h3 className="font-heading text-[16px] font-extrabold text-[var(--gym-ink,#111111)]">
            {t("admin.subscribers.history")} ({subscriberHistory.length})
          </h3>
        }
        columns={[
          {
            id: "package",
            header: t("admin.subscribers.columns.package"),
            cell: (row) =>
              packageMap.get(row.packageId)?.name[locale] ??
              row.packageName?.[locale] ??
              "—",
          },
          {
            id: "status",
            header: t("admin.subscribers.columns.subscription"),
            cell: (row) => (
              <StatusBadge
                label={t(`admin.status.${row.status}`)}
                tone={subscriptionStatusTone(row.status)}
              />
            ),
          },
          {
            id: "start",
            header: t("admin.subscriptions.columns.starts"),
            cell: (row) => formatDate(row.startsAt, locale),
            className: "text-[#6B7280]",
          },
          {
            id: "end",
            header: t("admin.subscriptions.columns.ends"),
            cell: (row) => formatDate(row.endsAt, locale),
            className: "text-[#6B7280]",
          },
          {
            id: "notes",
            header: t("admin.subscribers.notes"),
            cell: (row) => row.notes ?? "—",
            className: "text-[#6B7280]",
          },
        ]}
      />
    </div>
  )
}
