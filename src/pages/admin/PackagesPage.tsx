import { useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import {
  Archive,
  ArrowRight,
  Check,
  CircleCheck,
  Package,
  PackagePlus,
  Search,
  UserPlus,
  Users,
} from "lucide-react"
import {
  PackageFormDialog,
} from "@/components/dashboard/PackageFormDialog"
import {
  SubscriptionActionDialog,
  type SubscriptionDialogState,
} from "@/components/dashboard/SubscriptionActionDialog"
import { FilterChip, StatCard } from "@/components/dashboard/StatCard"
import { StatusBadge } from "@/components/dashboard/StatusBadge"
import { useAuth } from "@/features/auth/auth-context"
import {
  type DemoPackage,
  type PackageTone,
} from "@/features/subscriptions/demo"
import {
  ENTITLEMENT_KEYS,
  normalizeEntitlements,
} from "@/features/subscriptions/entitlements"
import {
  useAssignSubscriptionMutation,
  usePackagesQuery,
  useSavePackageMutation,
  useSubscriptionsQuery,
  useTogglePackageActiveMutation,
  useUpdateSubscriptionLifecycleMutation,
} from "@/features/subscriptions/hooks"
import type { SavePackageInput } from "@/features/subscriptions/service"
import { useDocumentTitle } from "@/hooks/useDocumentTitle"
import { useLocale } from "@/hooks/useLocale"
import { appToast } from "@/lib/toast"
import { cn } from "@/lib/utils"
import type { PackageEntitlementKey } from "@/types/subscription"

type Visibility = "all" | "active" | "archived"

const TONE_CLASS: Record<PackageTone, string> = {
  light: "bg-[#f5f5f5]",
  dark: "bg-[var(--gym-ink,#111111)]",
  sage: "bg-[#eef1e8]",
}

const ENTITLEMENT_BADGE_LABELS: Record<
  PackageEntitlementKey,
  { ar: string; en: string }
> = {
  workoutProgram: { ar: "تمارين", en: "Workouts" },
  nutritionProgram: { ar: "تغذية", en: "Nutrition" },
  exerciseVideos: { ar: "فيديوهات", en: "Videos" },
  pdfDocuments: { ar: "PDF", en: "PDFs" },
  progressTracking: { ar: "تتبع التقدم", en: "Progress" },
}

export function PackagesPage() {
  const { t } = useTranslation()
  const { locale, isRtl } = useLocale()
  const { user } = useAuth()
  useDocumentTitle(t("nav.packages"))

  const { data: allPackages = [] } = usePackagesQuery()
  const { data: allSubscriptions = [] } = useSubscriptionsQuery()
  const savePackageMutation = useSavePackageMutation()
  const toggleActiveMutation = useTogglePackageActiveMutation()
  const assignMutation = useAssignSubscriptionMutation()
  const lifecycleMutation = useUpdateSubscriptionLifecycleMutation()

  const [query, setQuery] = useState("")
  const [visibility, setVisibility] = useState<Visibility>("all")
  const [formOpen, setFormOpen] = useState(false)
  const [editingPackage, setEditingPackage] = useState<DemoPackage | null>(null)
  const [subDialogState, setSubDialogState] =
    useState<SubscriptionDialogState | null>(null)

  const activeCountsByPackage = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const sub of allSubscriptions) {
      if (sub.status === "active") {
        counts[sub.packageId] = (counts[sub.packageId] ?? 0) + 1
      }
    }
    return counts
  }, [allSubscriptions])

  const packages = useMemo(() => {
    const q = query.trim().toLowerCase()
    return [...allPackages]
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .filter((item) => {
        if (visibility === "active" && !item.isActive) return false
        if (visibility === "archived" && item.isActive) return false
        if (!q) return true
        return (
          item.name[locale].toLowerCase().includes(q) ||
          item.name.en.toLowerCase().includes(q) ||
          item.name.ar.includes(q) ||
          item.description[locale].toLowerCase().includes(q)
        )
      })
  }, [allPackages, query, visibility, locale])

  const stats = useMemo(() => {
    const total = allPackages.length
    const live = allPackages.filter((item) => item.isActive).length
    const archived = total - live
    const assigned = allPackages.reduce(
      (sum, item) => sum + (activeCountsByPackage[item.id] ?? 0),
      0,
    )
    return { total, live, archived, assigned }
  }, [allPackages, activeCountsByPackage])

  async function handleSavePackage(input: SavePackageInput) {
    const isEdit = Boolean(input.id)
    await savePackageMutation.mutateAsync(input)
    setFormOpen(false)
    setEditingPackage(null)
    appToast.success(
      locale === "ar"
        ? isEdit
          ? "تم تحديث الباقة بنجاح"
          : "تم إنشاء الباقة بنجاح"
        : isEdit
          ? "Package updated successfully"
          : "Package created successfully",
    )
  }

  async function handleToggleArchive(pkg: DemoPackage) {
    const nextActive = !pkg.isActive
    await toggleActiveMutation.mutateAsync({
      packageId: pkg.id,
      isActive: nextActive,
    })
    appToast.success(
      locale === "ar"
        ? nextActive
          ? `تم استعادة باقة "${pkg.name.ar}"`
          : `تمت أرشفة باقة "${pkg.name.ar}"`
        : nextActive
          ? `Restored "${pkg.name.en}"`
          : `Archived "${pkg.name.en}"`,
    )
  }

  return (
    <div className="flex flex-col gap-4 sm:gap-5">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
        <StatCard
          label={t("admin.packages.stats.total")}
          value={stats.total}
          icon={<Package className="size-4" strokeWidth={1.8} />}
        />
        <StatCard
          label={t("admin.packages.stats.live")}
          value={stats.live}
          icon={<CircleCheck className="size-4" strokeWidth={1.8} />}
        />
        <StatCard
          label={t("admin.packages.stats.assigned")}
          value={stats.assigned}
          icon={<Users className="size-4" strokeWidth={1.8} />}
        />
        <StatCard
          label={t("admin.packages.stats.archived")}
          value={stats.archived}
          icon={<Archive className="size-4" strokeWidth={1.8} />}
        />
      </div>

      <section className="rounded-[24px] bg-white p-4 sm:p-6 lg:p-7">
        <div className="flex flex-col gap-3.5">
          {/* Top row: Search input + Add package button */}
          <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
            <label className="relative w-full sm:max-w-[340px]">
              <Search className="pointer-events-none absolute start-3.5 top-1/2 size-4 -translate-y-1/2 text-[#8c8c8c]" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={t("admin.packages.search")}
                className={cn(
                  "h-11 w-full rounded-full bg-[#F4F4F4] pe-4 ps-10 text-[14px] font-medium text-[var(--gym-ink,#111111)] outline-none",
                  "placeholder:font-normal placeholder:text-[#8c8c8c]",
                )}
              />
            </label>
            <button
              type="button"
              onClick={() => {
                setEditingPackage(null)
                setFormOpen(true)
              }}
              className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-full bg-[var(--gym-ink,#111111)] px-5 text-[13px] font-bold text-white transition-opacity hover:opacity-90"
            >
              <PackagePlus className="size-4" strokeWidth={2} />
              {t("admin.packages.add")}
            </button>
          </div>

          {/* Bottom row: Filter chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 pt-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {(["all", "active", "archived"] as const).map((item) => (
              <FilterChip
                key={item}
                active={visibility === item}
                onClick={() => setVisibility(item)}
              >
                {item === "all"
                  ? t("admin.common.all")
                  : t(`admin.packages.filter.${item}`)}
              </FilterChip>
            ))}
          </div>
        </div>

        {packages.length === 0 ? (
          <div className="mt-5 flex min-h-40 items-center justify-center rounded-[20px] bg-[#F4F4F4] px-4 py-10 text-sm font-medium text-[#8c8c8c]">
            {t("admin.packages.empty")}
          </div>
        ) : (
          <div className="mt-6 grid grid-cols-1 items-stretch gap-4 pt-3 md:grid-cols-2 xl:grid-cols-3">
            {packages.map((pkg) => (
              <PackageCard
                key={pkg.id}
                pkg={pkg}
                subscribers={activeCountsByPackage[pkg.id] ?? 0}
                isRtl={isRtl}
                locale={locale}
                onEdit={() => {
                  setEditingPackage(pkg)
                  setFormOpen(true)
                }}
                onAssign={() =>
                  setSubDialogState({
                    mode: "assign",
                    defaultPackageId: pkg.id,
                  })
                }
                onToggleArchive={() => void handleToggleArchive(pkg)}
              />
            ))}
          </div>
        )}
      </section>

      <PackageFormDialog
        open={formOpen}
        initialPackage={editingPackage}
        busy={savePackageMutation.isPending}
        onClose={() => {
          setFormOpen(false)
          setEditingPackage(null)
        }}
        onSubmit={handleSavePackage}
      />

      <SubscriptionActionDialog
        state={subDialogState}
        packages={allPackages}
        busy={assignMutation.isPending || lifecycleMutation.isPending}
        adminName={user?.displayName || user?.email || "Head Coach"}
        onClose={() => setSubDialogState(null)}
        onAssign={async (payload) => {
          await assignMutation.mutateAsync(payload)
          setSubDialogState(null)
          appToast.success(
            locale === "ar"
              ? "تم تعيين الاشتراك للمشترك بنجاح"
              : "Subscription assigned successfully",
          )
        }}
        onLifecycle={async (payload) => {
          await lifecycleMutation.mutateAsync(payload)
          setSubDialogState(null)
          appToast.success(
            locale === "ar"
              ? "تم تحديث حالة الاشتراك بنجاح"
              : "Subscription updated successfully",
          )
        }}
      />
    </div>
  )
}

function PackageCard({
  pkg,
  subscribers,
  isRtl,
  locale,
  onEdit,
  onAssign,
  onToggleArchive,
}: {
  pkg: DemoPackage
  subscribers: number
  isRtl: boolean
  locale: "en" | "ar"
  onEdit: () => void
  onAssign: () => void
  onToggleArchive: () => void
}) {
  const { t } = useTranslation()
  const isDark = pkg.tone === "dark"
  const durationLabel = t("admin.packages.duration", { count: pkg.durationDays })
  const entitlements = normalizeEntitlements(pkg.entitlements)

  return (
    <article
      className={cn(
        "relative flex h-full flex-col rounded-[28px] p-5 sm:p-6",
        TONE_CLASS[pkg.tone],
        !pkg.isActive && "opacity-80",
      )}
    >
      {pkg.featured ? (
        <span className="absolute start-5 top-0 -translate-y-1/2 rounded-full bg-[var(--gym-lime,#fb5001)] px-3 py-1 text-[11px] font-bold text-white">
          {t("admin.packages.featured")}
        </span>
      ) : null}

      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3
            className={cn(
              "font-heading text-[20px] font-extrabold leading-tight tracking-tight sm:text-[22px]",
              isDark ? "text-white" : "text-[var(--gym-ink,#111111)]",
            )}
          >
            {pkg.name[locale]}
          </h3>
          <p
            className={cn(
              "mt-1 text-[13px] font-medium leading-relaxed",
              isDark ? "text-white/65" : "text-[#6B7280]",
            )}
          >
            {pkg.description[locale]}
          </p>
        </div>
        <StatusBadge
          label={
            pkg.isActive
              ? t("admin.packages.filter.active")
              : t("admin.packages.filter.archived")
          }
          tone={pkg.isActive ? "success" : "muted"}
        />
      </div>

      <div className="mt-5 flex flex-wrap items-end gap-1">
        <p
          className={cn(
            "font-heading text-[36px] font-extrabold leading-none tracking-tight",
            isDark
              ? "text-[var(--gym-lime,#fb5001)]"
              : "text-[var(--gym-ink,#111111)]",
          )}
        >
          {pkg.price[locale]}
        </p>
        <p
          className={cn(
            "mb-1 text-[14px] font-semibold",
            isDark ? "text-[var(--gym-lime,#fb5001)]/80" : "text-[#6B7280]",
          )}
        >
          {pkg.period[locale]}
        </p>
      </div>

      <div
        className={cn(
          "mt-4 flex flex-wrap items-center gap-2 text-[12px] font-bold",
          isDark ? "text-white/80" : "text-[var(--gym-ink,#111111)]",
        )}
      >
        <span
          className={cn(
            "inline-flex h-7 items-center rounded-full px-2.5",
            isDark ? "bg-white/10" : "bg-white",
          )}
        >
          {durationLabel}
        </span>
        <span
          className={cn(
            "inline-flex h-7 items-center gap-1.5 rounded-full px-2.5",
            isDark ? "bg-white/10" : "bg-white",
          )}
        >
          <Users className="size-3.5" strokeWidth={2} />
          {t("admin.packages.subscribers", { count: subscribers })}
        </span>
      </div>

      {/* Package Content Access Rules (Entitlements) */}
      <div className="mt-4 flex flex-wrap gap-1.5">
        {ENTITLEMENT_KEYS.map((key) => {
          const allowed = entitlements[key]
          return (
            <span
              key={key}
              className={cn(
                "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold",
                allowed
                  ? isDark
                    ? "bg-white/12 text-white"
                    : "bg-white text-[#111111]"
                  : isDark
                    ? "bg-white/[0.04] text-white/30 line-through"
                    : "bg-black/[0.04] text-[#8c8c8c] line-through",
              )}
            >
              {allowed ? (
                <Check
                  className={cn(
                    "size-2.5",
                    isDark ? "text-[var(--gym-lime,#fb5001)]" : "text-emerald-600",
                  )}
                  strokeWidth={3}
                />
              ) : null}
              {ENTITLEMENT_BADGE_LABELS[key][locale]}
            </span>
          )
        })}
      </div>

      <ul className="mt-5 flex flex-1 flex-col gap-2.5">
        {pkg.featureList[locale].map((feature) => (
          <li
            key={feature}
            className={cn(
              "flex items-start gap-2 text-[14px] font-medium leading-snug",
              isDark ? "text-white" : "text-[var(--gym-ink,#111111)]",
            )}
          >
            <ArrowRight
              className={cn(
                "mt-0.5 size-3.5 shrink-0",
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

      <div className="mt-6 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={onEdit}
          className={cn(
            "inline-flex h-10 flex-1 items-center justify-center rounded-full px-4 text-[13px] font-bold transition-opacity hover:opacity-90",
            isDark
              ? "bg-[var(--gym-lime,#fb5001)] text-white"
              : "bg-[var(--gym-ink,#111111)] text-white",
          )}
        >
          {t("admin.packages.edit")}
        </button>
        {pkg.isActive ? (
          <button
            type="button"
            onClick={onAssign}
            className={cn(
              "inline-flex h-10 items-center justify-center gap-1.5 rounded-full px-3.5 text-[13px] font-bold transition-colors",
              isDark
                ? "bg-white/12 text-white hover:bg-white/20"
                : "bg-white text-[var(--gym-ink,#111111)] hover:bg-black/5",
            )}
            title={locale === "ar" ? "تعيين لمشترك" : "Assign to subscriber"}
          >
            <UserPlus className="size-3.5" strokeWidth={2} />
            {locale === "ar" ? "تعيين" : "Assign"}
          </button>
        ) : null}
        <button
          type="button"
          onClick={onToggleArchive}
          className={cn(
            "inline-flex h-10 items-center justify-center rounded-full px-4 text-[13px] font-bold transition-colors",
            isDark
              ? "bg-white/10 text-white hover:bg-white/15"
              : "bg-white text-[var(--gym-ink,#111111)] hover:bg-black/5",
          )}
        >
          {pkg.isActive ? t("admin.packages.archive") : t("admin.packages.restore")}
        </button>
      </div>
    </article>
  )
}
