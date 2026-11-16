import { useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import {
  ArrowDown,
  ArrowUp,
  CircleCheck,
  Eye,
  EyeOff,
  ImageOff,
  LayoutGrid,
  Pencil,
  Plus,
  Search,
  Trash2,
} from "lucide-react"
import { ConfirmActionDialog } from "@/components/dashboard/ConfirmActionDialog"
import { FitnessDreamCardDialog } from "@/components/dashboard/FitnessDreamCardDialog"
import { FilterChip, StatCard } from "@/components/dashboard/StatCard"
import { useAuth } from "@/features/auth/auth-context"
import {
  useDeleteFitnessDreamCardMutation,
  useFitnessDreamCardsQuery,
  useReorderFitnessDreamCardsMutation,
  useSaveFitnessDreamCardMutation,
  useSetFitnessDreamCardEnabledMutation,
} from "@/features/website/hooks"
import type { SaveFitnessDreamCardInput } from "@/features/website/fitnessDream"
import { useDocumentTitle } from "@/hooks/useDocumentTitle"
import { useLocale } from "@/hooks/useLocale"
import { resolveBilingualText } from "@/lib/program-text"
import { appToast } from "@/lib/toast"
import { cn } from "@/lib/utils"
import type { FitnessDreamCard } from "@/types/website"

type Visibility = "all" | "live" | "hidden"

const CARD_TONES = ["bg-[#f3f0e8]", "bg-[#F5F5F5]"] as const

export function HomeFitnessDreamPage() {
  const { t } = useTranslation()
  const { locale } = useLocale()
  const { user, hasPermission } = useAuth()
  const canManage = hasPermission("content:manage")
  useDocumentTitle(t("admin.website.sections.homeFitnessDream"))

  const {
    data: allCards = [],
    isLoading,
    isError,
    refetch,
  } = useFitnessDreamCardsQuery({ audience: "admin" })
  const saveMutation = useSaveFitnessDreamCardMutation()
  const enabledMutation = useSetFitnessDreamCardEnabledMutation()
  const reorderMutation = useReorderFitnessDreamCardsMutation()
  const deleteMutation = useDeleteFitnessDreamCardMutation()

  const [query, setQuery] = useState("")
  const [visibility, setVisibility] = useState<Visibility>("all")
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<FitnessDreamCard | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<FitnessDreamCard | null>(
    null,
  )

  const actionsBusy =
    saveMutation.isPending ||
    enabledMutation.isPending ||
    reorderMutation.isPending ||
    deleteMutation.isPending

  const stats = useMemo(() => {
    const total = allCards.length
    const live = allCards.filter((c) => c.enabled).length
    return { total, live, hidden: total - live }
  }, [allCards])

  const cards = useMemo(() => {
    const q = query.trim().toLowerCase()
    return allCards.filter((card) => {
      if (visibility === "live" && !card.enabled) return false
      if (visibility === "hidden" && card.enabled) return false
      if (!q) return true
      const haystack = [
        card.title.en,
        card.title.ar,
        card.description.en,
        card.description.ar,
        card.imageAlt.en,
        card.imageAlt.ar,
      ]
        .join(" ")
        .toLowerCase()
      return haystack.includes(q)
    })
  }, [allCards, query, visibility])

  async function handleSave(input: SaveFitnessDreamCardInput) {
    await saveMutation.mutateAsync(input)
    appToast.success(t("admin.website.fitnessDream.toasts.saved"))
  }

  async function handleToggle(card: FitnessDreamCard) {
    if (!canManage || actionsBusy) return
    try {
      await enabledMutation.mutateAsync({
        id: card.id,
        enabled: !card.enabled,
        updatedBy: user?.displayName || user?.email || undefined,
      })
      appToast.success(
        card.enabled
          ? t("admin.website.fitnessDream.toasts.hidden")
          : t("admin.website.fitnessDream.toasts.shown"),
      )
    } catch (err) {
      appToast.error(
        err instanceof Error
          ? err.message
          : t("admin.website.fitnessDream.toasts.error"),
      )
    }
  }

  async function handleMove(cardId: string, direction: -1 | 1) {
    if (!canManage || actionsBusy) return
    const index = allCards.findIndex((c) => c.id === cardId)
    const next = index + direction
    if (index < 0 || next < 0 || next >= allCards.length) return
    const ordered = allCards.map((c) => c.id)
    ;[ordered[index], ordered[next]] = [ordered[next], ordered[index]]
    try {
      await reorderMutation.mutateAsync({
        orderedIds: ordered,
        updatedBy: user?.displayName || user?.email || undefined,
      })
    } catch (err) {
      appToast.error(
        err instanceof Error
          ? err.message
          : t("admin.website.fitnessDream.toasts.error"),
      )
    }
  }

  return (
    <div className="flex flex-col gap-4 sm:gap-5">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 lg:gap-4">
        <StatCard
          label={t("admin.website.fitnessDream.stats.total")}
          value={stats.total}
          icon={<LayoutGrid className="size-4" strokeWidth={1.8} />}
        />
        <StatCard
          label={t("admin.website.fitnessDream.stats.live")}
          value={stats.live}
          icon={<CircleCheck className="size-4" strokeWidth={1.8} />}
        />
        <StatCard
          label={t("admin.website.fitnessDream.stats.hidden")}
          value={stats.hidden}
          icon={<EyeOff className="size-4" strokeWidth={1.8} />}
        />
      </div>

      <section className="rounded-[24px] bg-white p-4 sm:p-6 lg:p-7">
        <div className="flex flex-col gap-3.5">
          <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
            <label className="relative w-full sm:max-w-[340px]">
              <Search className="pointer-events-none absolute start-3.5 top-1/2 size-4 -translate-y-1/2 text-[#8c8c8c]" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={t("admin.website.fitnessDream.search")}
                className={cn(
                  "h-11 w-full rounded-full bg-[#F4F4F4] pe-4 ps-10 text-[14px] font-medium text-[var(--gym-ink,#111111)] outline-none",
                  "placeholder:font-normal placeholder:text-[#8c8c8c]",
                )}
              />
            </label>

            {canManage ? (
              <button
                type="button"
                disabled={actionsBusy}
                onClick={() => {
                  if (actionsBusy) return
                  setEditing(null)
                  setFormOpen(true)
                }}
                className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-full bg-[var(--gym-ink,#111111)] px-5 text-[13px] font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
              >
                <Plus className="size-4" strokeWidth={2} />
                {t("admin.website.fitnessDream.addCard")}
              </button>
            ) : null}
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 pt-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {(["all", "live", "hidden"] as const).map((item) => (
              <FilterChip
                key={item}
                active={visibility === item}
                onClick={() => setVisibility(item)}
              >
                {item === "all"
                  ? t("admin.common.all")
                  : t(`admin.website.fitnessDream.filter.${item}`)}
              </FilterChip>
            ))}
          </div>
        </div>

        {isError ? (
          <div className="mt-5 flex min-h-40 flex-col items-center justify-center gap-3 rounded-[20px] bg-[#F4F4F4] px-4 py-10 text-center">
            <p className="text-sm font-medium text-[#8c8c8c]">
              {t("admin.website.fitnessDream.loadError")}
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
          <div className="mt-5 flex min-h-40 items-center justify-center rounded-[20px] bg-[#F4F4F4] px-4 py-10 text-sm font-medium text-[#8c8c8c]">
            {t("admin.website.fitnessDream.loading")}
          </div>
        ) : cards.length === 0 ? (
          <div className="mt-5 flex min-h-40 flex-col items-center justify-center gap-3 rounded-[20px] bg-[#F4F4F4] px-4 py-10 text-center">
            <p className="text-sm font-medium text-[#8c8c8c]">
              {allCards.length === 0
                ? t("admin.website.fitnessDream.emptyDescription")
                : t("admin.website.fitnessDream.emptyFiltered")}
            </p>
            {canManage && allCards.length === 0 ? (
              <button
                type="button"
                onClick={() => {
                  setEditing(null)
                  setFormOpen(true)
                }}
                className="inline-flex h-10 items-center gap-2 rounded-full bg-[var(--gym-ink,#111111)] px-4 text-[12px] font-bold text-white"
              >
                <Plus className="size-3.5" />
                {t("admin.website.fitnessDream.addCard")}
              </button>
            ) : null}
          </div>
        ) : (
          <ul className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {cards.map((card) => {
              const globalIndex = allCards.findIndex((c) => c.id === card.id)
              return (
                <li key={card.id}>
                  <DreamAdminPreviewCard
                    card={card}
                    index={globalIndex}
                    tone={CARD_TONES[Math.max(0, globalIndex) % 2]}
                    locale={locale}
                    canManage={canManage}
                    actionsBusy={actionsBusy}
                    canMoveUp={globalIndex > 0}
                    canMoveDown={
                      globalIndex >= 0 && globalIndex < allCards.length - 1
                    }
                    onMoveUp={() => void handleMove(card.id, -1)}
                    onMoveDown={() => void handleMove(card.id, 1)}
                    onToggle={() => void handleToggle(card)}
                    onEdit={() => {
                      setEditing(card)
                      setFormOpen(true)
                    }}
                    onDelete={() => setDeleteTarget(card)}
                  />
                </li>
              )
            })}
          </ul>
        )}
      </section>

      <FitnessDreamCardDialog
        open={formOpen}
        initialCard={editing}
        busy={saveMutation.isPending}
        adminName={user?.displayName || user?.email || undefined}
        onClose={() => {
          if (saveMutation.isPending) return
          setFormOpen(false)
          setEditing(null)
        }}
        onSave={handleSave}
      />

      <ConfirmActionDialog
        open={Boolean(deleteTarget)}
        title={t("admin.website.fitnessDream.deleteTitle")}
        description={t("admin.website.fitnessDream.deleteDescription")}
        tone="danger"
        confirmLabel={t("admin.website.fitnessDream.delete")}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={async () => {
          if (!deleteTarget) return
          try {
            await deleteMutation.mutateAsync(deleteTarget.id)
            appToast.success(t("admin.website.fitnessDream.toasts.deleted"))
          } catch (err) {
            appToast.error(
              err instanceof Error
                ? err.message
                : t("admin.website.fitnessDream.toasts.error"),
            )
            throw err
          }
        }}
      />
    </div>
  )
}

function DreamAdminPreviewCard({
  card,
  index,
  tone,
  locale,
  canManage,
  actionsBusy,
  canMoveUp,
  canMoveDown,
  onMoveUp,
  onMoveDown,
  onToggle,
  onEdit,
  onDelete,
}: {
  card: FitnessDreamCard
  index: number
  tone: string
  locale: "en" | "ar"
  canManage: boolean
  actionsBusy: boolean
  canMoveUp: boolean
  canMoveDown: boolean
  onMoveUp: () => void
  onMoveDown: () => void
  onToggle: () => void
  onEdit: () => void
  onDelete: () => void
}) {
  const { t } = useTranslation()
  const title = resolveBilingualText(
    card.title,
    locale,
    t("admin.website.fitnessDream.untitled"),
  )
  const description = resolveBilingualText(card.description, locale)
  const alt = resolveBilingualText(card.imageAlt, locale, title)

  return (
    <article
      className={cn(
        "flex h-full flex-col overflow-hidden rounded-[20px] shadow-[0_8px_24px_rgba(0,0,0,0.06)]",
        tone,
        !card.enabled && "opacity-75",
      )}
    >
      <div className="flex items-start justify-between gap-2 px-4 pt-4">
        <span className="inline-flex size-8 items-center justify-center rounded-full bg-black/80 text-[13px] font-bold text-white">
          {index + 1}
        </span>
        <span
          className={cn(
            "inline-flex h-7 items-center rounded-full px-2.5 text-[11px] font-bold sm:text-[12px]",
            card.enabled
              ? "bg-[var(--gym-lime,#fb5001)] text-white"
              : "bg-black/10 text-[#374151]",
          )}
        >
          {card.enabled
            ? t("admin.website.fitnessDream.status.live")
            : t("admin.website.fitnessDream.status.hidden")}
        </span>
      </div>

      <div className="flex min-h-[120px] flex-col px-5 pb-4 pt-3">
        <h3 className="line-clamp-2 font-heading text-[20px] font-bold leading-tight text-[var(--gym-ink,#111111)]">
          {title}
        </h3>
        {description ? (
          <p className="mt-2 line-clamp-3 text-[13px] leading-relaxed text-[var(--gym-muted,#6b7280)] sm:text-[14px]">
            {description}
          </p>
        ) : null}
      </div>

      <div className="relative min-h-[180px] flex-1 overflow-hidden rounded-t-[16px] bg-black/5">
        {card.imageUrl ? (
          <img
            src={card.imageUrl}
            alt={alt}
            draggable={false}
            className="absolute inset-0 size-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-[#8c8c8c]">
            <ImageOff className="size-9" strokeWidth={1.4} />
          </div>
        )}
      </div>

      {canManage ? (
        <div className="flex flex-wrap items-center gap-1.5 border-t border-black/5 bg-white/70 px-3 py-2.5 backdrop-blur-sm sm:gap-2 sm:px-3.5">
          <div className="flex items-center gap-1">
            <button
              type="button"
              disabled={!canMoveUp || actionsBusy}
              onClick={onMoveUp}
              className="flex size-8 items-center justify-center rounded-full bg-black/5 text-[var(--gym-ink,#111111)] transition hover:bg-black/10 disabled:opacity-35"
              aria-label={t("admin.website.fitnessDream.moveUp")}
            >
              <ArrowUp className="size-3.5" />
            </button>
            <button
              type="button"
              disabled={!canMoveDown || actionsBusy}
              onClick={onMoveDown}
              className="flex size-8 items-center justify-center rounded-full bg-black/5 text-[var(--gym-ink,#111111)] transition hover:bg-black/10 disabled:opacity-35"
              aria-label={t("admin.website.fitnessDream.moveDown")}
            >
              <ArrowDown className="size-3.5" />
            </button>
          </div>

          <div className="ms-auto flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              disabled={actionsBusy}
              onClick={onToggle}
              className="inline-flex h-8 items-center gap-1.5 rounded-full bg-black/5 px-2.5 text-[11px] font-bold text-[var(--gym-ink,#111111)] transition hover:bg-black/10 disabled:opacity-60"
            >
              {card.enabled ? (
                <EyeOff className="size-3.5" />
              ) : (
                <Eye className="size-3.5" />
              )}
              {card.enabled
                ? t("admin.website.fitnessDream.hide")
                : t("admin.website.fitnessDream.show")}
            </button>
            <button
              type="button"
              disabled={actionsBusy}
              onClick={onEdit}
              className="inline-flex h-8 items-center gap-1.5 rounded-full bg-[var(--gym-ink,#111111)] px-2.5 text-[11px] font-bold text-white transition hover:opacity-90 disabled:opacity-60"
            >
              <Pencil className="size-3.5" />
              {t("admin.website.fitnessDream.edit")}
            </button>
            <button
              type="button"
              disabled={actionsBusy}
              onClick={onDelete}
              className="inline-flex h-8 items-center gap-1.5 rounded-full bg-[#FFE8E4] px-2.5 text-[11px] font-bold text-[#C44536] transition hover:bg-[#ffd8d1] disabled:opacity-60"
            >
              <Trash2 className="size-3.5" />
              {t("admin.website.fitnessDream.delete")}
            </button>
          </div>
        </div>
      ) : null}
    </article>
  )
}
