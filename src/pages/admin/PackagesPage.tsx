import { useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { Archive, ArrowRight, CircleCheck, Package, PackagePlus, Search, Users } from "lucide-react"
import { FilterChip, StatCard } from "@/components/dashboard/StatCard"
import { StatusBadge } from "@/components/dashboard/StatusBadge"
import {
  activeSubscribersForPackage,
  DEMO_PACKAGES,
  type DemoPackage,
  type PackageTone,
} from "@/features/subscriptions/demo"
import { useDocumentTitle } from "@/hooks/useDocumentTitle"
import { useLocale } from "@/hooks/useLocale"
import { appToast } from "@/lib/toast"
import { cn } from "@/lib/utils"

type Visibility = "all" | "active" | "archived"

const TONE_CLASS: Record<PackageTone, string> = {
  light: "bg-[#f5f5f5]",
  dark: "bg-[var(--gym-ink,#063434)]",
  sage: "bg-[#eef1e8]",
}

export function PackagesPage() {
  const { t } = useTranslation()
  const { locale, isRtl } = useLocale()
  useDocumentTitle(t("nav.packages"))

  const [query, setQuery] = useState("")
  const [visibility, setVisibility] = useState<Visibility>("all")

  const packages = useMemo(() => {
    const q = query.trim().toLowerCase()
    return [...DEMO_PACKAGES]
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .filter((item) => {
        if (visibility === "active" && !item.isActive) return false
        if (visibility === "archived" && item.isActive) return false
        if (!q) return true
        return (
          item.name[locale].toLowerCase().includes(q) ||
          item.description[locale].toLowerCase().includes(q)
        )
      })
  }, [query, visibility, locale])

  const stats = useMemo(() => {
    const total = DEMO_PACKAGES.length
    const live = DEMO_PACKAGES.filter((item) => item.isActive).length
    const archived = total - live
    const assigned = DEMO_PACKAGES.reduce(
      (sum, item) => sum + activeSubscribersForPackage(item.id),
      0,
    )
    return { total, live, archived, assigned }
  }, [])

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
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 flex-1 flex-col gap-3 sm:flex-row sm:items-center">
            <label className="relative min-w-0 flex-1 sm:max-w-[320px]">
              <Search className="pointer-events-none absolute start-3.5 top-1/2 size-4 -translate-y-1/2 text-[#8c8c8c]" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={t("admin.packages.search")}
                className={cn(
                  "h-11 w-full rounded-full bg-[#F4F4F4] pe-4 ps-10 text-[14px] font-medium text-[var(--gym-ink,#063434)] outline-none",
                  "placeholder:font-normal placeholder:text-[#8c8c8c]",
                )}
              />
            </label>
            <div className="flex gap-1.5 overflow-x-auto pb-0.5">
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
          <button
            type="button"
            onClick={() => appToast.success(t("admin.common.demoOnly"))}
            className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-full bg-[var(--gym-ink,#063434)] px-5 text-[13px] font-bold text-white"
          >
            <PackagePlus className="size-4" strokeWidth={2} />
            {t("admin.packages.add")}
          </button>
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
                subscribers={activeSubscribersForPackage(pkg.id)}
                isRtl={isRtl}
                locale={locale}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

function PackageCard({
  pkg,
  subscribers,
  isRtl,
  locale,
}: {
  pkg: DemoPackage
  subscribers: number
  isRtl: boolean
  locale: "en" | "ar"
}) {
  const { t } = useTranslation()
  const isDark = pkg.tone === "dark"
  const durationLabel = t("admin.packages.duration", { count: pkg.durationDays })

  return (
    <article
      className={cn(
        "relative flex h-full flex-col rounded-[28px] p-5 sm:p-6",
        TONE_CLASS[pkg.tone],
        !pkg.isActive && "opacity-80",
      )}
    >
      {pkg.featured ? (
        <span className="absolute start-5 top-0 -translate-y-1/2 rounded-full bg-[var(--gym-lime,#b8fe22)] px-3 py-1 text-[11px] font-bold text-[var(--gym-ink,#063434)]">
          {t("admin.packages.featured")}
        </span>
      ) : null}

      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3
            className={cn(
              "font-heading text-[20px] font-extrabold leading-tight tracking-tight sm:text-[22px]",
              isDark ? "text-white" : "text-[var(--gym-ink,#063434)]",
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
          label={pkg.isActive ? t("admin.packages.filter.active") : t("admin.packages.filter.archived")}
          tone={pkg.isActive ? "success" : "muted"}
        />
      </div>

      <div className="mt-5 flex flex-wrap items-end gap-1">
        <p
          className={cn(
            "font-heading text-[36px] font-extrabold leading-none tracking-tight",
            isDark ? "text-[var(--gym-lime,#b8fe22)]" : "text-[var(--gym-ink,#063434)]",
          )}
        >
          {pkg.price[locale]}
        </p>
        <p
          className={cn(
            "mb-1 text-[14px] font-semibold",
            isDark ? "text-[var(--gym-lime,#b8fe22)]/80" : "text-[#6B7280]",
          )}
        >
          {pkg.period[locale]}
        </p>
      </div>

      <div
        className={cn(
          "mt-4 flex flex-wrap items-center gap-2 text-[12px] font-bold",
          isDark ? "text-white/80" : "text-[var(--gym-ink,#063434)]",
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

      <ul className="mt-5 flex flex-1 flex-col gap-2.5">
        {pkg.featureList[locale].map((feature) => (
          <li
            key={feature}
            className={cn(
              "flex items-start gap-2 text-[14px] font-medium leading-snug",
              isDark ? "text-white" : "text-[var(--gym-ink,#063434)]",
            )}
          >
            <ArrowRight
              className={cn(
                "mt-0.5 size-3.5 shrink-0",
                isDark ? "text-[var(--gym-lime,#b8fe22)]" : "text-[var(--gym-ink,#063434)]",
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
          onClick={() => appToast.success(t("admin.common.demoOnly"))}
          className={cn(
            "inline-flex h-10 flex-1 items-center justify-center rounded-full px-4 text-[13px] font-bold",
            isDark
              ? "bg-[var(--gym-lime,#b8fe22)] text-[var(--gym-ink,#063434)]"
              : "bg-[var(--gym-ink,#063434)] text-white",
          )}
        >
          {t("admin.packages.edit")}
        </button>
        <button
          type="button"
          onClick={() => appToast.success(t("admin.common.demoOnly"))}
          className={cn(
            "inline-flex h-10 items-center justify-center rounded-full px-4 text-[13px] font-bold",
            isDark ? "bg-white/10 text-white" : "bg-white text-[var(--gym-ink,#063434)]",
          )}
        >
          {pkg.isActive ? t("admin.packages.archive") : t("admin.packages.restore")}
        </button>
      </div>
    </article>
  )
}
