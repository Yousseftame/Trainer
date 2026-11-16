import { useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import {
  ArrowDown,
  ArrowUp,
  CircleCheck,
  Eye,
  EyeOff,
  ImageOff,
  LayoutTemplate,
  Link2,
  Pencil,
  Plus,
  Search,
  Trash2,
} from "lucide-react"
import { ConfirmActionDialog } from "@/components/dashboard/ConfirmActionDialog"
import { HomeHeroFormDialog } from "@/components/dashboard/HomeHeroFormDialog"
import { FilterChip, StatCard } from "@/components/dashboard/StatCard"
import { useAuth } from "@/features/auth/auth-context"
import {
  useDeleteHomeHeroSlideMutation,
  useHomeHeroSlidesQuery,
  useReorderHomeHeroSlidesMutation,
  useSaveHomeHeroSlideMutation,
  useSetHomeHeroSlideEnabledMutation,
} from "@/features/website/hooks"
import type { SaveHomeHeroSlideInput } from "@/features/website/service"
import { useDocumentTitle } from "@/hooks/useDocumentTitle"
import { useLocale } from "@/hooks/useLocale"
import { resolveBilingualText } from "@/lib/program-text"
import { appToast } from "@/lib/toast"
import { cn } from "@/lib/utils"
import type { HomeHeroSlide } from "@/types/website"
import heroPattern from "@/assets/hero-pattern.avif"

type Visibility = "all" | "live" | "hidden"

export function HomeHeroPage() {
  const { t } = useTranslation()
  const { locale, isRtl } = useLocale()
  const { user, hasPermission } = useAuth()
  const canManage = hasPermission("content:manage")
  useDocumentTitle(t("admin.website.sections.homeHero"))

  const {
    data: allSlides = [],
    isLoading,
    isError,
    refetch,
  } = useHomeHeroSlidesQuery({ audience: "admin" })
  const saveMutation = useSaveHomeHeroSlideMutation()
  const enabledMutation = useSetHomeHeroSlideEnabledMutation()
  const reorderMutation = useReorderHomeHeroSlidesMutation()
  const deleteMutation = useDeleteHomeHeroSlideMutation()

  const [query, setQuery] = useState("")
  const [visibility, setVisibility] = useState<Visibility>("all")
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<HomeHeroSlide | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<HomeHeroSlide | null>(null)

  const actionsBusy =
    saveMutation.isPending ||
    enabledMutation.isPending ||
    reorderMutation.isPending ||
    deleteMutation.isPending

  const stats = useMemo(() => {
    const total = allSlides.length
    const live = allSlides.filter((s) => s.enabled).length
    return { total, live, hidden: total - live }
  }, [allSlides])

  const slides = useMemo(() => {
    const q = query.trim().toLowerCase()
    return allSlides.filter((slide) => {
      if (visibility === "live" && !slide.enabled) return false
      if (visibility === "hidden" && slide.enabled) return false
      if (!q) return true
      const haystack = [
        slide.greeting.en,
        slide.greeting.ar,
        slide.titleBefore.en,
        slide.titleBefore.ar,
        slide.titleAccent.en,
        slide.titleAccent.ar,
        slide.titleAfter.en,
        slide.titleAfter.ar,
        slide.description.en,
        slide.description.ar,
        slide.cta.en,
        slide.cta.ar,
      ]
        .join(" ")
        .toLowerCase()
      return haystack.includes(q)
    })
  }, [allSlides, query, visibility])

  async function handleSave(input: SaveHomeHeroSlideInput) {
    await saveMutation.mutateAsync(input)
    appToast.success(t("admin.website.homeHero.toasts.saved"))
  }

  async function handleToggle(slide: HomeHeroSlide) {
    if (!canManage || actionsBusy) return
    try {
      await enabledMutation.mutateAsync({
        id: slide.id,
        enabled: !slide.enabled,
        updatedBy: user?.displayName || user?.email || undefined,
      })
      appToast.success(
        slide.enabled
          ? t("admin.website.homeHero.toasts.hidden")
          : t("admin.website.homeHero.toasts.shown"),
      )
    } catch (err) {
      appToast.error(
        err instanceof Error
          ? err.message
          : t("admin.website.homeHero.toasts.error"),
      )
    }
  }

  async function handleMove(slideId: string, direction: -1 | 1) {
    if (!canManage || actionsBusy) return
    // Reorder against the full admin list so filtered views don't scramble order.
    const index = allSlides.findIndex((s) => s.id === slideId)
    const next = index + direction
    if (index < 0 || next < 0 || next >= allSlides.length) return
    const ordered = allSlides.map((s) => s.id)
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
          : t("admin.website.homeHero.toasts.error"),
      )
    }
  }

  return (
    <div className="flex flex-col gap-4 sm:gap-5">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
        <StatCard
          label={t("admin.website.homeHero.stats.total")}
          value={stats.total}
          icon={<LayoutTemplate className="size-4" strokeWidth={1.8} />}
        />
        <StatCard
          label={t("admin.website.homeHero.stats.live")}
          value={stats.live}
          icon={<CircleCheck className="size-4" strokeWidth={1.8} />}
        />
        <StatCard
          label={t("admin.website.homeHero.stats.hidden")}
          value={stats.hidden}
          icon={<EyeOff className="size-4" strokeWidth={1.8} />}
        />
        <StatCard
          label={t("admin.website.homeHero.stats.cta")}
          value="#contact"
          icon={<Link2 className="size-4" strokeWidth={1.8} />}
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
                placeholder={t("admin.website.homeHero.search")}
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
                {t("admin.website.homeHero.addBanner")}
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
                  : t(`admin.website.homeHero.filter.${item}`)}
              </FilterChip>
            ))}
          </div>
        </div>

        {isError ? (
          <div className="mt-5 flex min-h-40 flex-col items-center justify-center gap-3 rounded-[20px] bg-[#F4F4F4] px-4 py-10 text-center">
            <p className="text-sm font-medium text-[#8c8c8c]">
              {t("admin.website.homeHero.loadError")}
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
            {t("admin.website.homeHero.loading")}
          </div>
        ) : slides.length === 0 ? (
          <div className="mt-5 flex min-h-40 flex-col items-center justify-center gap-3 rounded-[20px] bg-[#F4F4F4] px-4 py-10 text-center">
            <p className="text-sm font-medium text-[#8c8c8c]">
              {allSlides.length === 0
                ? t("admin.website.homeHero.emptyDescription")
                : t("admin.website.homeHero.emptyFiltered")}
            </p>
            {canManage && allSlides.length === 0 ? (
              <button
                type="button"
                onClick={() => {
                  setEditing(null)
                  setFormOpen(true)
                }}
                className="inline-flex h-10 items-center gap-2 rounded-full bg-[var(--gym-ink,#111111)] px-4 text-[12px] font-bold text-white"
              >
                <Plus className="size-3.5" />
                {t("admin.website.homeHero.addBanner")}
              </button>
            ) : null}
          </div>
        ) : (
          <ul className="mt-5 space-y-4">
            {slides.map((slide) => {
              const globalIndex = allSlides.findIndex((s) => s.id === slide.id)
              return (
                <li key={slide.id}>
                  <HeroBannerPreviewCard
                    slide={slide}
                    index={globalIndex}
                    locale={locale}
                    isRtl={isRtl}
                    canManage={canManage}
                    actionsBusy={actionsBusy}
                    canMoveUp={globalIndex > 0}
                    canMoveDown={
                      globalIndex >= 0 && globalIndex < allSlides.length - 1
                    }
                    onMoveUp={() => void handleMove(slide.id, -1)}
                    onMoveDown={() => void handleMove(slide.id, 1)}
                    onToggle={() => void handleToggle(slide)}
                    onEdit={() => {
                      setEditing(slide)
                      setFormOpen(true)
                    }}
                    onDelete={() => setDeleteTarget(slide)}
                  />
                </li>
              )
            })}
          </ul>
        )}
      </section>

      <HomeHeroFormDialog
        open={formOpen}
        initialSlide={editing}
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
        title={t("admin.website.homeHero.deleteTitle")}
        description={t("admin.website.homeHero.deleteDescription")}
        tone="danger"
        confirmLabel={t("admin.website.homeHero.delete")}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={async () => {
          if (!deleteTarget) return
          try {
            await deleteMutation.mutateAsync(deleteTarget.id)
            appToast.success(t("admin.website.homeHero.toasts.deleted"))
          } catch (err) {
            appToast.error(
              err instanceof Error
                ? err.message
                : t("admin.website.homeHero.toasts.error"),
            )
            throw err
          }
        }}
      />
    </div>
  )
}

function HeroBannerPreviewCard({
  slide,
  index,
  locale,
  isRtl,
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
  slide: HomeHeroSlide
  index: number
  locale: "en" | "ar"
  isRtl: boolean
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
  const greeting = resolveBilingualText(slide.greeting, locale)
  const titleBefore = resolveBilingualText(slide.titleBefore, locale)
  const titleAccent = resolveBilingualText(slide.titleAccent, locale)
  const titleAfter = resolveBilingualText(slide.titleAfter, locale)
  const description = resolveBilingualText(slide.description, locale)
  const cta = resolveBilingualText(slide.cta, locale)
  const watermark = resolveBilingualText(slide.watermark, locale)

  return (
    <article
      className={cn(
        "overflow-hidden rounded-[22px] bg-[var(--gym-dark,#24030c)] shadow-[0_12px_32px_rgba(0,0,0,0.12)] sm:rounded-[24px]",
        !slide.enabled && "opacity-75",
      )}
    >
      <div className="relative min-h-[220px] sm:min-h-[260px] lg:min-h-[300px]">
        {slide.imageUrl ? (
          <img
            src={slide.imageUrl}
            alt=""
            draggable={false}
            className={cn(
              "pointer-events-none absolute inset-y-0 end-0 z-0 h-full object-cover select-none",
              isRtl
                ? "w-full object-[18%_center]"
                : "w-full object-[12%_center] sm:inset-y-0 sm:-right-[6%] sm:left-auto sm:w-[72%]",
            )}
          />
        ) : (
          <div className="absolute inset-0 z-0 flex items-center justify-center bg-[#1a050c] text-white/35">
            <ImageOff className="size-10" strokeWidth={1.4} />
          </div>
        )}

        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 z-[1]"
          style={{
            background: isRtl
              ? "linear-gradient(270deg, #24030c 0%, #24030c 32%, rgba(36, 3, 12, 0.55) 48%, rgba(36, 3, 12, 0) 68%)"
              : "linear-gradient(90deg, #24030c 0%, #24030c 34%, rgba(36, 3, 12, 0.62) 46%, rgba(36, 3, 12, 0) 58%)",
          }}
        />

        <img
          src={heroPattern}
          alt=""
          aria-hidden
          draggable={false}
          className="pointer-events-none absolute inset-0 z-[2] h-full w-full object-cover object-left opacity-25 select-none rtl:object-right rtl:-scale-x-100"
        />

        <div className="absolute inset-x-0 top-0 z-20 flex items-start justify-between gap-3 p-3.5 sm:p-4">
          <span className="inline-flex size-8 items-center justify-center rounded-full bg-black/55 text-[13px] font-bold text-white backdrop-blur-md">
            {index + 1}
          </span>
          <span
            className={cn(
              "inline-flex h-7 items-center rounded-full px-2.5 text-[11px] font-bold backdrop-blur-md sm:text-[12px]",
              slide.enabled
                ? "bg-[var(--gym-lime,#fb5001)]/90 text-white"
                : "bg-white/15 text-white/85",
            )}
          >
            {slide.enabled
              ? t("admin.website.homeHero.status.live")
              : t("admin.website.homeHero.status.hidden")}
          </span>
        </div>

        <div
          className={cn(
            "relative z-10 flex min-h-[220px] flex-col justify-center px-5 py-14 sm:min-h-[260px] sm:px-8 sm:py-16 lg:min-h-[300px] lg:px-10",
            isRtl ? "max-w-[88%] sm:max-w-[58%]" : "max-w-[90%] sm:max-w-[52%]",
          )}
        >
          <p className="mb-1.5 truncate text-[15px] font-extrabold text-white sm:mb-2 sm:text-[18px] lg:text-[22px]">
            {greeting || "—"}
          </p>
          <h3 className="font-heading text-[28px] font-bold leading-[1.05] tracking-tight text-white sm:text-[36px] lg:text-[44px]">
            <span className="line-clamp-2">
              {titleBefore ? <>{titleBefore} </> : null}
              <span className="text-[var(--gym-lime,#fb5001)]">
                {titleAccent || t("admin.website.homeHero.untitled")}
              </span>
              {titleAfter ? <> {titleAfter}</> : null}
            </span>
          </h3>
          {description ? (
            <p className="mt-3 line-clamp-2 max-w-[420px] text-[13px] font-medium leading-relaxed text-white/85 sm:text-[14px]">
              {description}
            </p>
          ) : null}
          {cta ? (
            <div className="mt-5">
              <span className="inline-flex h-9 items-center rounded-full bg-[var(--gym-lime,#fb5001)] px-4 text-[12px] font-bold text-white sm:h-10 sm:px-5 sm:text-[13px]">
                {cta}
              </span>
            </div>
          ) : null}
        </div>

        {watermark ? (
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 bottom-12 z-[5] ps-[min(14%,5rem)] pe-4 sm:bottom-14 sm:ps-[min(16%,7rem)] lg:ps-[18%]"
          >
            <p className="select-none truncate font-heading text-[clamp(2rem,7vw,4.5rem)] font-semibold uppercase leading-none tracking-tight text-white/[0.08]">
              {watermark}
            </p>
          </div>
        ) : null}

        {canManage ? (
          <div className="absolute inset-x-0 bottom-0 z-20 flex flex-wrap items-center gap-1.5 border-t border-white/10 bg-black/45 px-3 py-2.5 backdrop-blur-md sm:gap-2 sm:px-4 sm:py-3">
            <div className="flex items-center gap-1">
              <button
                type="button"
                disabled={!canMoveUp || actionsBusy}
                onClick={onMoveUp}
                className="flex size-8 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20 disabled:opacity-35 sm:size-9"
                aria-label={t("admin.website.homeHero.moveUp")}
              >
                <ArrowUp className="size-3.5 sm:size-4" />
              </button>
              <button
                type="button"
                disabled={!canMoveDown || actionsBusy}
                onClick={onMoveDown}
                className="flex size-8 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20 disabled:opacity-35 sm:size-9"
                aria-label={t("admin.website.homeHero.moveDown")}
              >
                <ArrowDown className="size-3.5 sm:size-4" />
              </button>
            </div>

            <div className="ms-auto flex flex-wrap items-center gap-1.5 sm:gap-2">
              <button
                type="button"
                disabled={actionsBusy}
                onClick={onToggle}
                className="inline-flex h-8 items-center gap-1.5 rounded-full bg-white/10 px-2.5 text-[11px] font-bold text-white transition hover:bg-white/20 disabled:opacity-60 sm:h-9 sm:px-3 sm:text-[12px]"
              >
                {slide.enabled ? (
                  <EyeOff className="size-3.5" />
                ) : (
                  <Eye className="size-3.5" />
                )}
                {slide.enabled
                  ? t("admin.website.homeHero.hide")
                  : t("admin.website.homeHero.show")}
              </button>
              <button
                type="button"
                disabled={actionsBusy}
                onClick={onEdit}
                className="inline-flex h-8 items-center gap-1.5 rounded-full bg-white px-2.5 text-[11px] font-bold text-[var(--gym-ink,#111111)] transition hover:bg-white/90 disabled:opacity-60 sm:h-9 sm:px-3 sm:text-[12px]"
              >
                <Pencil className="size-3.5" />
                {t("admin.website.homeHero.edit")}
              </button>
              <button
                type="button"
                disabled={actionsBusy}
                onClick={onDelete}
                className="inline-flex h-8 items-center gap-1.5 rounded-full bg-[#FFE8E4] px-2.5 text-[11px] font-bold text-[#C44536] transition hover:bg-[#ffd8d1] disabled:opacity-60 sm:h-9 sm:px-3 sm:text-[12px]"
              >
                <Trash2 className="size-3.5" />
                {t("admin.website.homeHero.delete")}
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </article>
  )
}
