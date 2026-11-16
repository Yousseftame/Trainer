import { useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import {
  ArrowDown,
  ArrowUp,
  HelpCircle,
  Pencil,
  Plus,
  Search,
  Star,
  Trash2,
} from "lucide-react"
import { ConfirmActionDialog } from "@/components/dashboard/ConfirmActionDialog"
import { FaqItemDialog } from "@/components/dashboard/FaqItemDialog"
import { FilterChip, StatCard } from "@/components/dashboard/StatCard"
import { useAuth } from "@/features/auth/auth-context"
import {
  FAQ_FEATURED_MAX,
  useDeleteFaqItemMutation,
  useFaqItemsQuery,
  useReorderFaqItemsMutation,
  useSaveFaqItemMutation,
  useSetFaqItemFeaturedMutation,
  type SaveFaqItemInput,
} from "@/features/website"
import { useDocumentTitle } from "@/hooks/useDocumentTitle"
import { useLocale } from "@/hooks/useLocale"
import { resolveBilingualText } from "@/lib/program-text"
import { appToast } from "@/lib/toast"
import { cn } from "@/lib/utils"
import type { FaqItem } from "@/types/website"

type Visibility = "all" | "featured" | "pageOnly"

export function CommonFaqPage() {
  const { t } = useTranslation()
  const { locale } = useLocale()
  const { user, hasPermission } = useAuth()
  const canManage = hasPermission("content:manage")
  useDocumentTitle(t("admin.website.sections.commonFaq"))

  const {
    data: allItems = [],
    isLoading,
    isError,
    refetch,
  } = useFaqItemsQuery({ audience: "admin" })
  const saveMutation = useSaveFaqItemMutation()
  const featuredMutation = useSetFaqItemFeaturedMutation()
  const reorderMutation = useReorderFaqItemsMutation()
  const deleteMutation = useDeleteFaqItemMutation()

  const [query, setQuery] = useState("")
  const [visibility, setVisibility] = useState<Visibility>("all")
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<FaqItem | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<FaqItem | null>(null)

  const actionsBusy =
    saveMutation.isPending ||
    featuredMutation.isPending ||
    reorderMutation.isPending ||
    deleteMutation.isPending

  const featuredCount = useMemo(
    () => allItems.filter((item) => item.featured).length,
    [allItems],
  )

  const stats = useMemo(
    () => ({
      total: allItems.length,
      featured: featuredCount,
      pageOnly: allItems.length - featuredCount,
    }),
    [allItems.length, featuredCount],
  )

  const items = useMemo(() => {
    const q = query.trim().toLowerCase()
    return allItems.filter((item) => {
      if (visibility === "featured" && !item.featured) return false
      if (visibility === "pageOnly" && item.featured) return false
      if (!q) return true
      const haystack = [
        item.question.en,
        item.question.ar,
        item.answer.en,
        item.answer.ar,
      ]
        .join(" ")
        .toLowerCase()
      return haystack.includes(q)
    })
  }, [allItems, query, visibility])

  async function handleSave(input: SaveFaqItemInput) {
    await saveMutation.mutateAsync(input)
    appToast.success(t("admin.website.commonFaq.toasts.saved"))
  }

  async function toggleFeatured(item: FaqItem) {
    if (!canManage || actionsBusy) return
    const next = !item.featured
    if (next && featuredCount >= FAQ_FEATURED_MAX) {
      appToast.error(
        t("admin.website.commonFaq.errors.featuredMax", {
          max: FAQ_FEATURED_MAX,
        }),
      )
      return
    }
    try {
      await featuredMutation.mutateAsync({
        id: item.id,
        featured: next,
        updatedBy: user?.displayName || user?.email || undefined,
      })
      appToast.success(
        next
          ? t("admin.website.commonFaq.toasts.featuredOn")
          : t("admin.website.commonFaq.toasts.featuredOff"),
      )
    } catch (err) {
      appToast.error(
        err instanceof Error
          ? err.message
          : t("admin.website.commonFaq.toasts.error"),
      )
    }
  }

  async function moveItem(indexInAll: number, direction: -1 | 1) {
    if (!canManage || actionsBusy) return
    const target = indexInAll + direction
    if (target < 0 || target >= allItems.length) return
    const ordered = allItems.map((item) => item.id)
    ;[ordered[indexInAll], ordered[target]] = [
      ordered[target],
      ordered[indexInAll],
    ]
    try {
      await reorderMutation.mutateAsync({
        orderedIds: ordered,
        updatedBy: user?.displayName || user?.email || undefined,
      })
    } catch (err) {
      appToast.error(
        err instanceof Error
          ? err.message
          : t("admin.website.commonFaq.toasts.error"),
      )
    }
  }

  return (
    <div className="flex flex-col gap-4 sm:gap-5">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 lg:gap-4">
        <StatCard
          label={t("admin.website.commonFaq.stats.total")}
          value={stats.total}
          icon={<HelpCircle className="size-4" strokeWidth={1.8} />}
        />
        <StatCard
          label={t("admin.website.commonFaq.stats.featured")}
          value={`${stats.featured}/${FAQ_FEATURED_MAX}`}
          icon={<Star className="size-4" strokeWidth={1.8} />}
        />
        <StatCard
          label={t("admin.website.commonFaq.stats.pageOnly")}
          value={stats.pageOnly}
          icon={<span className="text-[12px] font-extrabold">/faq</span>}
        />
      </div>

      <section className="rounded-[24px] bg-white p-4 sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <label className="relative w-full sm:max-w-[320px]">
            <Search className="pointer-events-none absolute start-3.5 top-1/2 size-4 -translate-y-1/2 text-[#8c8c8c]" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t("admin.website.commonFaq.search")}
              className="h-11 w-full rounded-full bg-[#F4F4F4] pe-4 ps-10 text-[14px] font-medium text-[var(--gym-ink,#111111)] outline-none placeholder:font-normal placeholder:text-[#8c8c8c]"
            />
          </label>
          <div className="flex flex-wrap items-center gap-2">
            {(
              [
                ["all", t("admin.website.commonFaq.filter.all")],
                ["featured", t("admin.website.commonFaq.filter.featured")],
                ["pageOnly", t("admin.website.commonFaq.filter.pageOnly")],
              ] as const
            ).map(([key, label]) => (
              <FilterChip
                key={key}
                active={visibility === key}
                onClick={() => setVisibility(key)}
              >
                {label}
              </FilterChip>
            ))}
            {canManage ? (
              <button
                type="button"
                disabled={actionsBusy}
                onClick={() => {
                  setEditing(null)
                  setFormOpen(true)
                }}
                className="inline-flex h-10 items-center gap-1.5 rounded-full bg-[var(--gym-ink,#111111)] px-4 text-[13px] font-bold text-white disabled:opacity-60"
              >
                <Plus className="size-4" />
                {t("admin.website.commonFaq.add")}
              </button>
            ) : null}
          </div>
        </div>

        {isError ? (
          <div className="mt-5 flex min-h-40 flex-col items-center justify-center gap-3 rounded-[18px] bg-[#F4F4F4] px-4 py-10 text-center">
            <p className="text-sm font-medium text-[#8c8c8c]">
              {t("admin.website.commonFaq.loadError")}
            </p>
            <button
              type="button"
              onClick={() => void refetch()}
              className="inline-flex h-10 items-center justify-center rounded-full bg-[var(--gym-ink,#111111)] px-5 text-[13px] font-bold text-white"
            >
              {t("admin.common.retry")}
            </button>
          </div>
        ) : isLoading ? (
          <div className="mt-5 flex min-h-40 items-center justify-center rounded-[18px] bg-[#F4F4F4] px-4 py-10 text-sm font-medium text-[#8c8c8c]">
            {t("admin.website.commonFaq.loading")}
          </div>
        ) : items.length === 0 ? (
          <div className="mt-5 flex min-h-40 flex-col items-center justify-center gap-2 rounded-[18px] bg-[#F4F4F4] px-4 py-10 text-center">
            <p className="text-[15px] font-bold text-[var(--gym-ink,#111111)]">
              {t("admin.website.commonFaq.emptyTitle")}
            </p>
            <p className="max-w-md text-[13px] font-medium text-[#6B7280]">
              {query || visibility !== "all"
                ? t("admin.website.commonFaq.emptyFiltered")
                : t("admin.website.commonFaq.emptyDescription")}
            </p>
          </div>
        ) : (
          <ul className="mt-5 divide-y divide-black/[0.06] overflow-hidden rounded-[18px] border border-black/[0.06]">
            {items.map((item) => {
              const indexInAll = allItems.findIndex((x) => x.id === item.id)
              const question = resolveBilingualText(
                item.question,
                locale,
                t("admin.website.commonFaq.untitled"),
              )
              const answer = resolveBilingualText(item.answer, locale)

              return (
                <li
                  key={item.id}
                  className="flex flex-col gap-3 bg-white px-3.5 py-3.5 sm:flex-row sm:items-start sm:gap-4 sm:px-4 sm:py-4"
                >
                  <div className="flex min-w-0 flex-1 items-start gap-3">
                    <span className="mt-0.5 inline-flex size-8 shrink-0 items-center justify-center rounded-full bg-[#F4F4F4] text-[12px] font-bold text-[var(--gym-ink,#111111)]">
                      {String(indexInAll + 1).padStart(2, "0")}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-[14px] font-bold leading-snug text-[var(--gym-ink,#111111)] sm:text-[15px]">
                          {question}
                        </p>
                        {item.featured ? (
                          <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-[#FFF4EC] px-2 py-0.5 text-[10px] font-bold text-[var(--gym-lime,#fb5001)]">
                            <Star
                              className="size-2.5"
                              fill="currentColor"
                              strokeWidth={0}
                            />
                            {t("admin.website.commonFaq.badge.featured")}
                          </span>
                        ) : null}
                      </div>
                      <p className="mt-1 text-[12px] font-medium leading-relaxed text-[#8c8c8c] sm:text-[13px]">
                        {answer || "—"}
                      </p>
                    </div>
                  </div>

                  {canManage ? (
                    <div className="flex shrink-0 items-center gap-1 self-end sm:mt-0.5 sm:self-start">
                      <button
                        type="button"
                        disabled={actionsBusy}
                        onClick={() => void toggleFeatured(item)}
                        className={cn(
                          "flex size-8 items-center justify-center rounded-full transition disabled:opacity-50",
                          item.featured
                            ? "bg-[#FFF4EC] text-[var(--gym-lime,#fb5001)]"
                            : "bg-[#F4F4F4] text-[var(--gym-ink,#111111)]",
                        )}
                        aria-label={
                          item.featured
                            ? t("admin.website.commonFaq.unfeature")
                            : t("admin.website.commonFaq.feature")
                        }
                        title={
                          item.featured
                            ? t("admin.website.commonFaq.unfeature")
                            : t("admin.website.commonFaq.feature")
                        }
                      >
                        <Star
                          className="size-3.5"
                          fill={item.featured ? "currentColor" : "none"}
                          strokeWidth={1.8}
                        />
                      </button>
                      <button
                        type="button"
                        disabled={actionsBusy || indexInAll <= 0}
                        onClick={() => void moveItem(indexInAll, -1)}
                        className="flex size-8 items-center justify-center rounded-full bg-[#F4F4F4] text-[var(--gym-ink,#111111)] disabled:opacity-35"
                        aria-label={t("admin.website.commonFaq.moveUp")}
                      >
                        <ArrowUp className="size-3.5" />
                      </button>
                      <button
                        type="button"
                        disabled={
                          actionsBusy || indexInAll >= allItems.length - 1
                        }
                        onClick={() => void moveItem(indexInAll, 1)}
                        className="flex size-8 items-center justify-center rounded-full bg-[#F4F4F4] text-[var(--gym-ink,#111111)] disabled:opacity-35"
                        aria-label={t("admin.website.commonFaq.moveDown")}
                      >
                        <ArrowDown className="size-3.5" />
                      </button>
                      <button
                        type="button"
                        disabled={actionsBusy}
                        onClick={() => {
                          setEditing(item)
                          setFormOpen(true)
                        }}
                        className="flex size-8 items-center justify-center rounded-full bg-[#F4F4F4] text-[var(--gym-ink,#111111)] disabled:opacity-60"
                        aria-label={t("admin.website.commonFaq.edit")}
                      >
                        <Pencil className="size-3.5" />
                      </button>
                      <button
                        type="button"
                        disabled={actionsBusy}
                        onClick={() => setDeleteTarget(item)}
                        className="flex size-8 items-center justify-center rounded-full bg-[#FFE8E4] text-[#C44536] disabled:opacity-60"
                        aria-label={t("admin.website.commonFaq.delete")}
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                  ) : null}
                </li>
              )
            })}
          </ul>
        )}
      </section>

      <FaqItemDialog
        open={formOpen}
        initialItem={editing}
        featuredCount={featuredCount}
        busy={saveMutation.isPending}
        adminName={user?.displayName || user?.email || undefined}
        onClose={() => {
          setFormOpen(false)
          setEditing(null)
        }}
        onSave={handleSave}
      />

      <ConfirmActionDialog
        open={Boolean(deleteTarget)}
        title={t("admin.website.commonFaq.deleteTitle")}
        description={t("admin.website.commonFaq.deleteDescription")}
        tone="danger"
        confirmLabel={t("admin.website.commonFaq.delete")}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={async () => {
          if (!deleteTarget) return
          try {
            await deleteMutation.mutateAsync(deleteTarget.id)
            appToast.success(t("admin.website.commonFaq.toasts.deleted"))
            setDeleteTarget(null)
          } catch (err) {
            appToast.error(
              err instanceof Error
                ? err.message
                : t("admin.website.commonFaq.toasts.error"),
            )
          }
        }}
      />
    </div>
  )
}
