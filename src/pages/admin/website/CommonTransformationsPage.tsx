import { useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import {
  ArrowDown,
  ArrowDownUp,
  ArrowUp,
  CircleCheck,
  Eye,
  EyeOff,
  ImageOff,
  Pencil,
  Plus,
  Search,
  Trash2,
} from "lucide-react"
import { ConfirmActionDialog } from "@/components/dashboard/ConfirmActionDialog"
import { FilterChip, StatCard } from "@/components/dashboard/StatCard"
import { TransformationItemDialog } from "@/components/dashboard/TransformationItemDialog"
import { useAuth } from "@/features/auth/auth-context"
import {
  useDeleteTransformationItemMutation,
  useReorderTransformationItemsMutation,
  useSaveTransformationItemMutation,
  useSetTransformationItemEnabledMutation,
  useSetTransformationItemLoopMutation,
  useTransformationItemsQuery,
} from "@/features/website/hooks"
import type { SaveTransformationItemInput } from "@/features/website/transformations"
import { useDocumentTitle } from "@/hooks/useDocumentTitle"
import { useLocale } from "@/hooks/useLocale"
import { resolveBilingualText } from "@/lib/program-text"
import { appToast } from "@/lib/toast"
import { cn } from "@/lib/utils"
import type { TransformationItem, TransformationLoop } from "@/types/website"

type Visibility = "all" | "live" | "hidden"
type LoopFilter = "all" | TransformationLoop

export function CommonTransformationsPage() {
  const { t } = useTranslation()
  const { locale } = useLocale()
  const { user, hasPermission } = useAuth()
  const canManage = hasPermission("content:manage")
  useDocumentTitle(t("admin.website.sections.commonTransformations"))

  const {
    data: allItems = [],
    isLoading,
    isError,
    refetch,
  } = useTransformationItemsQuery({ audience: "admin" })
  const saveMutation = useSaveTransformationItemMutation()
  const enabledMutation = useSetTransformationItemEnabledMutation()
  const loopMutation = useSetTransformationItemLoopMutation()
  const reorderMutation = useReorderTransformationItemsMutation()
  const deleteMutation = useDeleteTransformationItemMutation()

  const [query, setQuery] = useState("")
  const [visibility, setVisibility] = useState<Visibility>("all")
  const [loopFilter, setLoopFilter] = useState<LoopFilter>("all")
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<TransformationItem | null>(null)
  const [defaultLoop, setDefaultLoop] = useState<TransformationLoop>("top")
  const [deleteTarget, setDeleteTarget] = useState<TransformationItem | null>(
    null,
  )

  const actionsBusy =
    saveMutation.isPending ||
    enabledMutation.isPending ||
    loopMutation.isPending ||
    reorderMutation.isPending ||
    deleteMutation.isPending

  const stats = useMemo(() => {
    const total = allItems.length
    const live = allItems.filter((item) => item.enabled).length
    const top = allItems.filter((item) => item.loop === "top").length
    const bottom = allItems.filter((item) => item.loop === "bottom").length
    return { total, live, hidden: total - live, top, bottom }
  }, [allItems])

  const itemsByLoop = useMemo(() => {
    const top = allItems
      .filter((item) => item.loop === "top")
      .sort((a, b) => a.order - b.order)
    const bottom = allItems
      .filter((item) => item.loop === "bottom")
      .sort((a, b) => a.order - b.order)
    return { top, bottom }
  }, [allItems])

  const items = useMemo(() => {
    const q = query.trim().toLowerCase()
    return allItems
      .filter((item) => {
        if (loopFilter !== "all" && item.loop !== loopFilter) return false
        if (visibility === "live" && !item.enabled) return false
        if (visibility === "hidden" && item.enabled) return false
        if (!q) return true
        const haystack = [
          item.name.en,
          item.name.ar,
          item.description.en,
          item.description.ar,
          item.date.en,
          item.date.ar,
          item.imageAlt.en,
          item.imageAlt.ar,
        ]
          .join(" ")
          .toLowerCase()
        return haystack.includes(q)
      })
      .sort((a, b) => {
        if (a.loop !== b.loop) return a.loop === "top" ? -1 : 1
        return a.order - b.order
      })
  }, [allItems, query, visibility, loopFilter])

  async function handleSave(input: SaveTransformationItemInput) {
    await saveMutation.mutateAsync(input)
    appToast.success(t("admin.website.commonTransformations.toasts.saved"))
  }

  async function handleToggle(item: TransformationItem) {
    if (!canManage || actionsBusy) return
    try {
      await enabledMutation.mutateAsync({
        id: item.id,
        enabled: !item.enabled,
        updatedBy: user?.displayName || user?.email || undefined,
      })
      appToast.success(
        item.enabled
          ? t("admin.website.commonTransformations.toasts.hidden")
          : t("admin.website.commonTransformations.toasts.shown"),
      )
    } catch (err) {
      appToast.error(
        err instanceof Error
          ? err.message
          : t("admin.website.commonTransformations.toasts.error"),
      )
    }
  }

  async function handleSwitchLoop(item: TransformationItem) {
    if (!canManage || actionsBusy) return
    const next: TransformationLoop = item.loop === "top" ? "bottom" : "top"
    try {
      await loopMutation.mutateAsync({
        id: item.id,
        loop: next,
        updatedBy: user?.displayName || user?.email || undefined,
      })
      appToast.success(
        t("admin.website.commonTransformations.toasts.loopMoved", {
          loop: t(`admin.website.commonTransformations.loop.${next}`),
        }),
      )
    } catch (err) {
      appToast.error(
        err instanceof Error
          ? err.message
          : t("admin.website.commonTransformations.toasts.error"),
      )
    }
  }

  async function handleMove(item: TransformationItem, direction: -1 | 1) {
    if (!canManage || actionsBusy) return
    const siblings =
      item.loop === "top" ? itemsByLoop.top : itemsByLoop.bottom
    const index = siblings.findIndex((entry) => entry.id === item.id)
    const next = index + direction
    if (index < 0 || next < 0 || next >= siblings.length) return
    const ordered = siblings.map((entry) => entry.id)
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
          : t("admin.website.commonTransformations.toasts.error"),
      )
    }
  }

  function openCreate() {
    if (actionsBusy) return
    setEditing(null)
    setDefaultLoop(loopFilter === "bottom" ? "bottom" : "top")
    setFormOpen(true)
  }

  return (
    <div className="flex flex-col gap-4 sm:gap-5">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
        <StatCard
          label={t("admin.website.commonTransformations.stats.total")}
          value={stats.total}
          icon={<ArrowDownUp className="size-4" strokeWidth={1.8} />}
        />
        <StatCard
          label={t("admin.website.commonTransformations.stats.live")}
          value={stats.live}
          icon={<CircleCheck className="size-4" strokeWidth={1.8} />}
        />
        <StatCard
          label={t("admin.website.commonTransformations.stats.top")}
          value={stats.top}
          icon={<ArrowUp className="size-4" strokeWidth={1.8} />}
        />
        <StatCard
          label={t("admin.website.commonTransformations.stats.bottom")}
          value={stats.bottom}
          icon={<ArrowDown className="size-4" strokeWidth={1.8} />}
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
                placeholder={t("admin.website.commonTransformations.search")}
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
                onClick={openCreate}
                className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-full bg-[var(--gym-ink,#111111)] px-5 text-[13px] font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
              >
                <Plus className="size-4" strokeWidth={2} />
                {t("admin.website.commonTransformations.add")}
              </button>
            ) : null}
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
            <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {(["all", "top", "bottom"] as const).map((item) => (
                <FilterChip
                  key={`loop-${item}`}
                  active={loopFilter === item}
                  onClick={() => setLoopFilter(item)}
                >
                  {item === "all"
                    ? t("admin.website.commonTransformations.filter.allLoops")
                    : t(`admin.website.commonTransformations.loop.${item}`)}
                </FilterChip>
              ))}
            </div>
            <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {(["all", "live", "hidden"] as const).map((item) => (
                <FilterChip
                  key={`vis-${item}`}
                  active={visibility === item}
                  onClick={() => setVisibility(item)}
                >
                  {item === "all"
                    ? t("admin.common.all")
                    : t(`admin.website.commonTransformations.filter.${item}`)}
                </FilterChip>
              ))}
            </div>
          </div>

          <p className="text-[12px] font-medium leading-relaxed text-[#6B7280] sm:text-[13px]">
            {t("admin.website.commonTransformations.listHint")}
          </p>
        </div>

        {isError ? (
          <div className="mt-5 flex min-h-40 flex-col items-center justify-center gap-3 rounded-[20px] bg-[#F4F4F4] px-4 py-10 text-center">
            <p className="text-sm font-medium text-[#8c8c8c]">
              {t("admin.website.commonTransformations.loadError")}
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
            {t("admin.website.commonTransformations.loading")}
          </div>
        ) : items.length === 0 ? (
          <div className="mt-5 flex min-h-40 flex-col items-center justify-center gap-3 rounded-[20px] bg-[#F4F4F4] px-4 py-10 text-center">
            <p className="text-sm font-medium text-[#8c8c8c]">
              {allItems.length === 0
                ? t("admin.website.commonTransformations.emptyDescription")
                : t("admin.website.commonTransformations.emptyFiltered")}
            </p>
            {canManage && allItems.length === 0 ? (
              <button
                type="button"
                onClick={openCreate}
                className="inline-flex h-10 items-center gap-2 rounded-full bg-[var(--gym-ink,#111111)] px-4 text-[12px] font-bold text-white"
              >
                <Plus className="size-3.5" />
                {t("admin.website.commonTransformations.add")}
              </button>
            ) : null}
          </div>
        ) : (
          <ul className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {items.map((item) => {
              const siblings =
                item.loop === "top" ? itemsByLoop.top : itemsByLoop.bottom
              const loopIndex = siblings.findIndex(
                (entry) => entry.id === item.id,
              )
              return (
                <li key={item.id}>
                  <TransformationAdminCard
                    item={item}
                    loopIndex={loopIndex}
                    locale={locale}
                    canManage={canManage}
                    actionsBusy={actionsBusy}
                    canMoveUp={loopIndex > 0}
                    canMoveDown={
                      loopIndex >= 0 && loopIndex < siblings.length - 1
                    }
                    onMoveUp={() => void handleMove(item, -1)}
                    onMoveDown={() => void handleMove(item, 1)}
                    onToggle={() => void handleToggle(item)}
                    onSwitchLoop={() => void handleSwitchLoop(item)}
                    onEdit={() => {
                      setEditing(item)
                      setDefaultLoop(item.loop)
                      setFormOpen(true)
                    }}
                    onDelete={() => setDeleteTarget(item)}
                  />
                </li>
              )
            })}
          </ul>
        )}
      </section>

      <TransformationItemDialog
        open={formOpen}
        initialItem={editing}
        defaultLoop={defaultLoop}
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
        title={t("admin.website.commonTransformations.deleteTitle")}
        description={t("admin.website.commonTransformations.deleteDescription")}
        tone="danger"
        confirmLabel={t("admin.website.commonTransformations.delete")}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={async () => {
          if (!deleteTarget) return
          try {
            await deleteMutation.mutateAsync(deleteTarget.id)
            appToast.success(
              t("admin.website.commonTransformations.toasts.deleted"),
            )
          } catch (err) {
            appToast.error(
              err instanceof Error
                ? err.message
                : t("admin.website.commonTransformations.toasts.error"),
            )
            throw err
          }
        }}
      />
    </div>
  )
}

function TransformationAdminCard({
  item,
  loopIndex,
  locale,
  canManage,
  actionsBusy,
  canMoveUp,
  canMoveDown,
  onMoveUp,
  onMoveDown,
  onToggle,
  onSwitchLoop,
  onEdit,
  onDelete,
}: {
  item: TransformationItem
  loopIndex: number
  locale: "en" | "ar"
  canManage: boolean
  actionsBusy: boolean
  canMoveUp: boolean
  canMoveDown: boolean
  onMoveUp: () => void
  onMoveDown: () => void
  onToggle: () => void
  onSwitchLoop: () => void
  onEdit: () => void
  onDelete: () => void
}) {
  const { t } = useTranslation()
  const name = resolveBilingualText(
    item.name,
    locale,
    t("admin.website.commonTransformations.untitled"),
  )
  const description = resolveBilingualText(item.description, locale)
  const date = resolveBilingualText(item.date, locale)
  const alt = resolveBilingualText(item.imageAlt, locale, name)

  return (
    <article
      className={cn(
        "flex h-full flex-col overflow-hidden rounded-[20px] bg-[#F7F7F7] shadow-[0_8px_24px_rgba(0,0,0,0.06)]",
        !item.enabled && "opacity-75",
      )}
    >
      <div className="relative min-h-[170px] overflow-hidden bg-black/5">
        {item.imageUrl ? (
          <img
            src={item.imageUrl}
            alt={alt}
            draggable={false}
            className="absolute inset-0 size-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-[#8c8c8c]">
            <ImageOff className="size-9" strokeWidth={1.4} />
          </div>
        )}
        <div className="absolute inset-x-0 top-0 flex items-start justify-between gap-2 p-3">
          <span className="inline-flex size-8 items-center justify-center rounded-full bg-black/80 text-[13px] font-bold text-white">
            {loopIndex + 1}
          </span>
          <div className="flex flex-wrap justify-end gap-1.5">
            <span className="inline-flex h-7 items-center rounded-full bg-black/70 px-2.5 text-[11px] font-bold text-white sm:text-[12px]">
              {t(`admin.website.commonTransformations.loop.${item.loop}`)}
            </span>
            <span
              className={cn(
                "inline-flex h-7 items-center rounded-full px-2.5 text-[11px] font-bold sm:text-[12px]",
                item.enabled
                  ? "bg-[var(--gym-lime,#fb5001)] text-white"
                  : "bg-white/90 text-[#374151]",
              )}
            >
              {item.enabled
                ? t("admin.website.commonTransformations.status.live")
                : t("admin.website.commonTransformations.status.hidden")}
            </span>
          </div>
        </div>
      </div>

      <div className="flex min-h-[110px] flex-col px-4 py-3.5 sm:px-5">
        <h3 className="line-clamp-2 font-heading text-[18px] font-bold leading-tight text-[var(--gym-ink,#111111)]">
          {name}
        </h3>
        {date ? (
          <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.06em] text-[var(--gym-lime,#fb5001)]">
            {date}
          </p>
        ) : null}
        {description ? (
          <p className="mt-1.5 line-clamp-3 text-[13px] leading-relaxed text-[var(--gym-muted,#6b7280)]">
            {description}
          </p>
        ) : null}
      </div>

      {canManage ? (
        <div className="mt-auto flex flex-wrap items-center gap-1.5 border-t border-black/5 bg-white/80 px-3 py-2.5 backdrop-blur-sm sm:gap-2 sm:px-3.5">
          <div className="flex items-center gap-1">
            <button
              type="button"
              disabled={!canMoveUp || actionsBusy}
              onClick={onMoveUp}
              className="flex size-8 items-center justify-center rounded-full bg-black/5 text-[var(--gym-ink,#111111)] transition hover:bg-black/10 disabled:opacity-35"
              aria-label={t("admin.website.commonTransformations.moveUp")}
            >
              <ArrowUp className="size-3.5" />
            </button>
            <button
              type="button"
              disabled={!canMoveDown || actionsBusy}
              onClick={onMoveDown}
              className="flex size-8 items-center justify-center rounded-full bg-black/5 text-[var(--gym-ink,#111111)] transition hover:bg-black/10 disabled:opacity-35"
              aria-label={t("admin.website.commonTransformations.moveDown")}
            >
              <ArrowDown className="size-3.5" />
            </button>
          </div>

          <div className="ms-auto flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              disabled={actionsBusy}
              onClick={onSwitchLoop}
              className="inline-flex h-8 items-center gap-1.5 rounded-full bg-black/5 px-2.5 text-[11px] font-bold text-[var(--gym-ink,#111111)] transition hover:bg-black/10 disabled:opacity-60"
            >
              <ArrowDownUp className="size-3.5" />
              {t("admin.website.commonTransformations.switchLoop")}
            </button>
            <button
              type="button"
              disabled={actionsBusy}
              onClick={onToggle}
              className="inline-flex h-8 items-center gap-1.5 rounded-full bg-black/5 px-2.5 text-[11px] font-bold text-[var(--gym-ink,#111111)] transition hover:bg-black/10 disabled:opacity-60"
            >
              {item.enabled ? (
                <EyeOff className="size-3.5" />
              ) : (
                <Eye className="size-3.5" />
              )}
              {item.enabled
                ? t("admin.website.commonTransformations.hide")
                : t("admin.website.commonTransformations.show")}
            </button>
            <button
              type="button"
              disabled={actionsBusy}
              onClick={onEdit}
              className="inline-flex h-8 items-center gap-1.5 rounded-full bg-[var(--gym-ink,#111111)] px-2.5 text-[11px] font-bold text-white transition hover:opacity-90 disabled:opacity-60"
            >
              <Pencil className="size-3.5" />
              {t("admin.website.commonTransformations.edit")}
            </button>
            <button
              type="button"
              disabled={actionsBusy}
              onClick={onDelete}
              className="inline-flex h-8 items-center gap-1.5 rounded-full bg-[#FFE8E4] px-2.5 text-[11px] font-bold text-[#C44536] transition hover:bg-[#ffd8d1] disabled:opacity-60"
            >
              <Trash2 className="size-3.5" />
              {t("admin.website.commonTransformations.delete")}
            </button>
          </div>
        </div>
      ) : null}
    </article>
  )
}
