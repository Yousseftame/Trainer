import { useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import {
  Apple,
  BookOpen,
  Clapperboard,
  Dumbbell,
  Lock,
  Play,
  Search,
  ShieldCheck,
} from "lucide-react"
import { ContentPreviewDialog } from "@/components/dashboard/ContentPreviewDialog"
import { FilterChip } from "@/components/dashboard/StatCard"
import { StatusBadge } from "@/components/dashboard/StatusBadge"
import { useAuth } from "@/features/auth/auth-context"
import {
  evaluateSubscriberContentAccess,
  type ContentFilter,
  type DemoContentAsset,
} from "@/features/content/demo"
import { useContentAssetsQuery } from "@/features/content/hooks"
import { useSubscribersQuery } from "@/features/subscribers/hooks"
import { useSubscriptionsQuery } from "@/features/subscriptions/hooks"
import { useDocumentTitle } from "@/hooks/useDocumentTitle"
import { useLocale } from "@/hooks/useLocale"
import { formatDuration } from "@/lib/format"
import { cn } from "@/lib/utils"

const SUBSCRIBER_FILTERS: ContentFilter[] = [
  "all",
  "exerciseVideo",
  "workoutPdf",
  "nutritionPdf",
  "education",
]

export function LibraryPage() {
  const { t } = useTranslation()
  const { locale } = useLocale()
  const isAr = locale === "ar"
  const { user } = useAuth()
  useDocumentTitle(t("nav.library"))

  const { data: assets = [] } = useContentAssetsQuery()
  const { data: subscribers = [] } = useSubscribersQuery()
  const { data: subscriptions = [] } = useSubscriptionsQuery()

  const [filter, setFilter] = useState<ContentFilter>("all")
  const [query, setQuery] = useState("")
  const [previewAsset, setPreviewAsset] = useState<DemoContentAsset | null>(
    null,
  )

  const currentSubscriber = useMemo(() => {
    void subscriptions
    if (!user) return subscribers[0]
    return (
      subscribers.find(
        (s) =>
          s.id === user.uid ||
          s.email.toLowerCase() === (user.email ?? "").toLowerCase(),
      ) ?? subscribers[0]
    )
  }, [subscribers, subscriptions, user])

  const visibleItems = useMemo(() => {
    const q = query.trim().toLowerCase()
    return assets
      .filter((item) => item.category !== "reference")
      .filter((item) => {
        if (filter !== "all" && item.category !== filter) return false
        if (!q) return true
        return (
          item.title[locale].toLowerCase().includes(q) ||
          item.description[locale].toLowerCase().includes(q) ||
          item.tags.some((tag) => tag.toLowerCase().includes(q))
        )
      })
      .map((asset) => ({
        asset,
        access: currentSubscriber
          ? evaluateSubscriberContentAccess(asset, currentSubscriber.id)
          : {
              allowed: false,
              reason: {
                en: "Sign in with an active subscriber account",
                ar: "سجل الدخول بحساب مشترك نشط",
              },
            },
      }))
  }, [assets, filter, query, locale, currentSubscriber])

  return (
    <div className="flex flex-col gap-4 sm:gap-5">
      <section className="rounded-[24px] bg-white p-4 sm:p-6 lg:p-7">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="font-heading text-[22px] font-extrabold text-[var(--gym-ink,#111111)]">
              {t("nav.library")}
            </h1>
            <p className="mt-1 flex items-center gap-1.5 text-[13px] font-medium text-[#6B7280]">
              <ShieldCheck className="size-4 text-emerald-600" />
              {isAr
                ? "المحتوى الرقمي المتاح وفقاً لباقتك وبرامجك التدريبية النشطة"
                : "Digital resources unlocked by your active subscription package and programs"}
            </p>
          </div>
          <label className="relative w-full shrink-0 sm:w-[260px] md:w-[300px]">
            <Search className="pointer-events-none absolute start-3.5 top-1/2 size-4 -translate-y-1/2 text-[#8c8c8c]" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t("admin.content.search")}
              className="h-11 w-full rounded-full bg-[#F4F4F4] pe-4 ps-10 text-[14px] font-medium text-[var(--gym-ink,#111111)] outline-none"
            />
          </label>
        </div>

        <div className="mt-4 flex gap-1.5 overflow-x-auto pb-1">
          {SUBSCRIBER_FILTERS.map((item) => (
            <FilterChip
              key={item}
              active={filter === item}
              onClick={() => setFilter(item)}
            >
              {item === "all"
                ? t("admin.common.all")
                : t(`admin.content.filter.${item}`)}
            </FilterChip>
          ))}
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {visibleItems.map(({ asset, access }) => (
            <div
              key={asset.id}
              className={cn(
                "flex flex-col justify-between rounded-[22px] p-4 transition",
                access.allowed
                  ? "bg-[#F4F4F4] hover:bg-[#ECECEC]"
                  : "bg-[#F8F8F8] opacity-75",
              )}
            >
              <div>
                <div className="flex items-center justify-between gap-2">
                  <span className="inline-flex size-10 items-center justify-center rounded-2xl bg-[var(--gym-ink,#111111)] text-white">
                    {asset.category === "exerciseVideo" ? (
                      <Clapperboard className="size-5" />
                    ) : asset.category === "workoutPdf" ? (
                      <Dumbbell className="size-5" />
                    ) : asset.category === "nutritionPdf" ? (
                      <Apple className="size-5" />
                    ) : (
                      <BookOpen className="size-5" />
                    )}
                  </span>
                  <StatusBadge
                    label={
                      access.allowed
                        ? isAr
                          ? "متاح"
                          : "Unlocked"
                        : isAr
                          ? "مقفل"
                          : "Locked"
                    }
                    tone={access.allowed ? "success" : "muted"}
                  />
                </div>
                <h3 className="mt-3 font-heading text-[16px] font-bold text-[var(--gym-ink,#111111)]">
                  {asset.title[locale]}
                </h3>
                <p className="mt-1 text-[13px] font-medium text-[#6B7280]">
                  {asset.description[locale]}
                </p>
              </div>

              <div className="mt-4 flex items-center justify-between gap-2 border-t border-black/8 pt-3">
                <span className="text-[11px] font-semibold text-[#8c8c8c]">
                  {asset.kind === "video"
                    ? formatDuration(asset.durationSeconds)
                    : asset.sizeLabel}
                </span>
                {access.allowed ? (
                  <button
                    type="button"
                    onClick={() => setPreviewAsset(asset)}
                    className="inline-flex h-9 items-center gap-1.5 rounded-full bg-[var(--gym-ink,#111111)] px-4 text-[12px] font-bold text-white"
                  >
                    <Play className="size-3.5 fill-current" />
                    {isAr ? "فتح المحتوى" : "Open"}
                  </button>
                ) : (
                  <span
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-[#8c8c8c]"
                    title={access.reason[locale]}
                  >
                    <Lock className="size-3.5" />
                    {access.reason[locale]}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      <ContentPreviewDialog
        asset={previewAsset}
        onClose={() => setPreviewAsset(null)}
        onEdit={() => setPreviewAsset(null)}
      />
    </div>
  )
}
