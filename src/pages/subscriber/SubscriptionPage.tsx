import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import {
  CalendarClock,
  CalendarDays,
  Check,
  CreditCard,
  Lock,
  Package,
  ShieldCheck,
} from "lucide-react"
import { DataTable } from "@/components/dashboard/DataTable"
import { StatCard } from "@/components/dashboard/StatCard"
import {
  StatusBadge,
  subscriptionStatusTone,
} from "@/components/dashboard/StatusBadge"
import { useAuth } from "@/features/auth/auth-context"
import {
  ENTITLEMENT_KEYS,
  normalizeEntitlements,
} from "@/features/subscriptions/entitlements"
import {
  usePackagesQuery,
  useSubscriptionsQuery,
} from "@/features/subscriptions/hooks"
import { useDocumentTitle } from "@/hooks/useDocumentTitle"
import { useLocale } from "@/hooks/useLocale"
import { daysUntil, formatDate } from "@/lib/format"
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
  const { locale } = useLocale()
  const { user } = useAuth()
  const isAr = locale === "ar"
  useDocumentTitle(t("nav.subscription"))

  const { data: allPackages = [] } = usePackagesQuery()
  const { data: allSubscriptions = [] } = useSubscriptionsQuery()

  const packageMap = useMemo(
    () => new Map(allPackages.map((p) => [p.id, p])),
    [allPackages],
  )

  const subscriberHistory = useMemo(() => {
    const uid = user?.uid
    const email = user?.email?.toLowerCase()
    const matched = allSubscriptions.filter(
      (item) =>
        (uid && item.subscriberId === uid) ||
        (email && item.subscriberEmail?.toLowerCase() === email),
    )
    const source = matched.length
      ? matched
      : allSubscriptions.filter((item) => item.subscriberId === "sub-alex")
    return [...source].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    )
  }, [allSubscriptions, user?.uid, user?.email])

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

  return (
    <div className="flex flex-col gap-4 sm:gap-5">
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

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-[24px] bg-white p-5 sm:p-7">
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

        <section className="rounded-[24px] bg-white p-5 sm:p-7">
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
                        ? "bg-emerald-100 text-emerald-800"
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
