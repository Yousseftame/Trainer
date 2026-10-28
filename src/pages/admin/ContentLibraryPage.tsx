import { useMemo, useState, type ReactNode } from "react"
import { useTranslation } from "react-i18next"
import {
  Apple,
  BookOpen,
  Bookmark,
  Clapperboard,
  Dumbbell,
  FileText,
  Link2,
  Play,
  Plus,
  Search,
  ShieldCheck,
  Upload,
} from "lucide-react"
import { FilterChip, StatCard } from "@/components/dashboard/StatCard"
import { StatusBadge } from "@/components/dashboard/StatusBadge"
import {
  contentStats,
  DEMO_CONTENT,
  getContentLinks,
  isContentLinked,
  type ContentFilter,
  type DemoContentAsset,
} from "@/features/content/demo"
import { useDocumentTitle } from "@/hooks/useDocumentTitle"
import { useLocale } from "@/hooks/useLocale"
import { formatDate, formatDuration } from "@/lib/format"
import { appToast } from "@/lib/toast"
import { cn } from "@/lib/utils"
import type { ContentCategory } from "@/types/content"

const FILTERS: ContentFilter[] = [
  "all",
  "exerciseVideo",
  "workoutPdf",
  "nutritionPdf",
  "education",
  "reference",
]

const PREVIEW: Record<ContentCategory, { className: string; icon: ReactNode }> = {
  exerciseVideo: {
    className: "bg-[var(--gym-ink,#063434)] text-white",
    icon: <Clapperboard className="size-8" strokeWidth={1.5} />,
  },
  workoutPdf: {
    className: "bg-[var(--gym-lime,#b8fe22)]/35 text-[var(--gym-ink,#063434)]",
    icon: <Dumbbell className="size-8" strokeWidth={1.5} />,
  },
  nutritionPdf: {
    className: "bg-[#eef1e8] text-[var(--gym-ink,#063434)]",
    icon: <Apple className="size-8" strokeWidth={1.5} />,
  },
  education: {
    className: "bg-[#F4F4F4] text-[var(--gym-ink,#063434)]",
    icon: <BookOpen className="size-8" strokeWidth={1.5} />,
  },
  reference: {
    className: "bg-[#F4F4F4] text-[var(--gym-ink,#063434)]",
    icon: <Bookmark className="size-8" strokeWidth={1.5} />,
  },
}

function demoToast(message: string) {
  appToast.success(message)
}

export function ContentLibraryPage() {
  const { t } = useTranslation()
  const { locale } = useLocale()
  useDocumentTitle(t("nav.content"))

  const [filter, setFilter] = useState<ContentFilter>("all")
  const [query, setQuery] = useState("")
  const [selectedId, setSelectedId] = useState(DEMO_CONTENT[0]?.id ?? "")

  const list = useMemo(() => {
    const q = query.trim().toLowerCase()
    return DEMO_CONTENT.filter((item) => {
      if (filter !== "all" && item.category !== filter) return false
      if (!q) return true
      return (
        item.title[locale].toLowerCase().includes(q) ||
        item.description[locale].toLowerCase().includes(q) ||
        (item.fileName?.toLowerCase().includes(q) ?? false) ||
        item.tags.some((tag) => tag.toLowerCase().includes(q))
      )
    })
  }, [filter, query, locale])

  const selected = list.find((item) => item.id === selectedId) ?? list[0]
  const links = selected ? getContentLinks(selected) : null
  const stats = useMemo(() => contentStats(), [])

  function pickFilter(next: ContentFilter) {
    setFilter(next)
    const first = DEMO_CONTENT.find((item) => next === "all" || item.category === next)
    setSelectedId(first?.id ?? "")
  }

  return (
    <div className="flex flex-col gap-4 sm:gap-5">
      <div className="grid grid-cols-2 gap-2 sm:gap-3 lg:grid-cols-4 lg:gap-4">
        <StatCard
          label={t("admin.content.stats.videos")}
          value={stats.videos}
          icon={<Clapperboard className="size-4" strokeWidth={1.8} />}
        />
        <StatCard
          label={t("admin.content.stats.workoutPdfs")}
          value={stats.workoutPdfs}
          icon={<Dumbbell className="size-4" strokeWidth={1.8} />}
        />
        <StatCard
          label={t("admin.content.stats.nutritionPdfs")}
          value={stats.nutritionPdfs}
          icon={<Apple className="size-4" strokeWidth={1.8} />}
        />
        <StatCard
          label={t("admin.content.stats.resources")}
          value={stats.resources}
          icon={<BookOpen className="size-4" strokeWidth={1.8} />}
        />
      </div>

      <section className="rounded-[24px] bg-white p-3.5 sm:p-6 lg:p-7">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 flex-1 flex-col gap-3">
            <div className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {FILTERS.map((item) => (
                <FilterChip key={item} active={filter === item} onClick={() => pickFilter(item)}>
                  {item === "all" ? t("admin.common.all") : t(`admin.content.filter.${item}`)}
                </FilterChip>
              ))}
            </div>
            <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center">
              <label className="relative min-w-0 flex-1 sm:max-w-[320px]">
                <Search className="pointer-events-none absolute start-3.5 top-1/2 size-4 -translate-y-1/2 text-[#8c8c8c]" />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder={t("admin.content.search")}
                  className="h-11 w-full rounded-full bg-[#F4F4F4] pe-4 ps-10 text-[14px] font-medium text-[var(--gym-ink,#063434)] outline-none placeholder:font-normal placeholder:text-[#8c8c8c]"
                />
              </label>
              <button
                type="button"
                onClick={() => demoToast(t("admin.common.demoOnly"))}
                className="inline-flex h-11 w-full shrink-0 items-center justify-center gap-2 rounded-full bg-[var(--gym-ink,#063434)] px-5 text-[13px] font-bold text-white sm:w-auto"
              >
                <Upload className="size-4" strokeWidth={2} />
                {t("admin.content.upload")}
              </button>
            </div>
          </div>
        </div>

        {list.length === 0 || !selected || !links ? (
          <div
            role="status"
            className="mt-5 flex min-h-40 items-center justify-center rounded-[20px] bg-[#F4F4F4] text-sm font-medium text-[#8c8c8c]"
          >
            {t("admin.content.empty")}
          </div>
        ) : (
          <div className="mt-4 grid items-start gap-4 xl:mt-5 xl:grid-cols-[minmax(0,1fr)_300px] 2xl:grid-cols-[minmax(0,1fr)_320px]">
            <div
              className={cn(
                "grid content-start items-start gap-2.5 sm:gap-3",
                list.length === 1
                  ? "max-w-[260px] grid-cols-1 sm:max-w-[280px]"
                  : "grid-cols-2 2xl:grid-cols-3",
              )}
            >
              {list.map((asset) => (
                <AssetCard
                  key={asset.id}
                  asset={asset}
                  active={asset.id === selected.id}
                  onSelect={() => setSelectedId(asset.id)}
                />
              ))}
            </div>

            <aside className="min-w-0 w-full rounded-[22px] bg-[#F4F4F4] p-3.5 sm:p-5 xl:sticky xl:top-4 xl:max-w-[320px]">
              <AssetPreview asset={selected} />

              <div className="mt-4 flex flex-wrap items-center gap-2">
                <h2 className="font-heading text-[18px] font-extrabold tracking-tight text-[var(--gym-ink,#063434)]">
                  {selected.title[locale]}
                </h2>
                <StatusBadge label={t(`admin.content.kind.${selected.category}`)} tone="info" />
                <StatusBadge
                  label={t(`admin.content.visibility.${selected.visibility}`)}
                  tone={selected.visibility === "assigned" ? "success" : "muted"}
                />
              </div>

              <p className="mt-2 text-[13px] font-medium leading-relaxed text-[#6B7280]">
                {selected.description[locale]}
              </p>

              <p className="mt-2 text-[12px] font-medium text-[#8c8c8c]">
                {t("admin.content.updated", { date: formatDate(selected.updatedAt, locale) })}
                {selected.fileName ? ` · ${selected.fileName}` : null}
                {` · ${selected.sizeLabel}`}
                {selected.pageCount
                  ? ` · ${t("admin.content.pages", { count: selected.pageCount })}`
                  : null}
              </p>

              <div className="mt-3 flex flex-wrap gap-1.5">
                {selected.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full bg-white px-2.5 py-1 text-[11px] font-bold text-[var(--gym-ink,#063434)]"
                  >
                    {tag}
                  </span>
                ))}
              </div>

              <p className="mt-3 flex items-start gap-2 text-[12px] font-medium leading-relaxed text-[#6B7280]">
                <ShieldCheck className="mt-0.5 size-4 shrink-0" strokeWidth={1.8} />
                {selected.kind === "video"
                  ? t("admin.content.streamingHint", {
                      provider: selected.videoProvider ?? "stub",
                    })
                  : t("admin.content.pdfHint")}
              </p>

              <LinkBlock
                label={t("admin.content.linkedExercises")}
                empty={t("admin.content.noExercises")}
                hidden={selected.kind !== "video"}
              >
                {links.exercises.map((name) => (
                  <li key={name}>{name}</li>
                ))}
              </LinkBlock>

              <LinkBlock
                label={t("admin.content.linkedPrograms")}
                empty={t("admin.content.noPrograms")}
              >
                {links.programs.map((program) => (
                  <li key={program.id} className="flex items-center justify-between gap-2">
                    <span className="truncate">{program.title[locale]}</span>
                    <StatusBadge
                      label={t(`admin.workouts.scope.${program.status}`)}
                      tone={program.status === "active" ? "success" : "muted"}
                    />
                  </li>
                ))}
              </LinkBlock>

              <LinkBlock
                label={t("admin.content.linkedSubscribers")}
                empty={t("admin.content.noSubscribers")}
              >
                {links.subscribers.map((person) => (
                  <li key={person.id}>{person.displayName}</li>
                ))}
              </LinkBlock>

              <LinkBlock label={t("admin.content.packages")} empty={t("admin.content.noPackages")}>
                {links.packages.map((pkg) => (
                  <li key={pkg.id}>{pkg.name[locale]}</li>
                ))}
              </LinkBlock>

              <p className="mt-4 text-[12px] font-medium leading-relaxed text-[#8c8c8c]">
                {t("admin.content.accessNote")}
              </p>

              <div className="mt-4 flex flex-col gap-2">
                <button
                  type="button"
                  onClick={() => demoToast(t("admin.common.demoOnly"))}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-[var(--gym-ink,#063434)] px-4 text-[13px] font-bold text-white"
                >
                  <Plus className="size-4" strokeWidth={2} />
                  {t("admin.content.associate")}
                </button>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => demoToast(t("admin.common.demoOnly"))}
                    className="inline-flex h-11 items-center justify-center rounded-full bg-white px-3 text-[13px] font-bold text-[var(--gym-ink,#063434)]"
                  >
                    {t("admin.content.assign")}
                  </button>
                  <button
                    type="button"
                    onClick={() => demoToast(t("admin.common.demoOnly"))}
                    className="inline-flex h-11 items-center justify-center rounded-full bg-white px-3 text-[13px] font-bold text-[var(--gym-ink,#063434)]"
                  >
                    {t("admin.content.update")}
                  </button>
                </div>
              </div>
            </aside>
          </div>
        )}
      </section>
    </div>
  )
}

function AssetCard({
  asset,
  active,
  onSelect,
}: {
  asset: DemoContentAsset
  active: boolean
  onSelect: () => void
}) {
  const { t } = useTranslation()
  const { locale } = useLocale()
  const preview = PREVIEW[asset.category]
  const linked = isContentLinked(asset)

  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "flex h-fit w-full flex-col self-start overflow-hidden rounded-[20px] text-start transition-shadow sm:rounded-[22px]",
        active
          ? "bg-[var(--gym-ink,#063434)] text-white shadow-[0_12px_28px_rgba(6,52,52,0.18)]"
          : "bg-[#F4F4F4] text-[var(--gym-ink,#063434)] hover:bg-[#ececec]",
      )}
    >
      <div
        className={cn(
          "relative flex aspect-[16/10] w-full shrink-0 items-center justify-center",
          active ? "bg-white/10" : preview.className,
        )}
      >
        {asset.kind === "video" ? (
          <span
            className={cn(
              "inline-flex size-9 items-center justify-center rounded-full sm:size-12",
              active ? "bg-[var(--gym-lime,#b8fe22)] text-[var(--gym-ink,#063434)]" : "bg-white/15 text-white",
            )}
          >
            <Play className="size-4 translate-x-px sm:size-5" fill="currentColor" strokeWidth={0} />
          </span>
        ) : (
          <span className="[&>svg]:size-6 sm:[&>svg]:size-8">{preview.icon}</span>
        )}
        <span
          className={cn(
            "absolute end-2 top-2 rounded-full px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-[0.06em] sm:end-2.5 sm:top-2.5 sm:px-2 sm:text-[10px]",
            active ? "bg-white/15 text-white" : "bg-white/80 text-[var(--gym-ink,#063434)]",
          )}
        >
          {asset.kind === "video"
            ? formatDuration(asset.durationSeconds)
            : t(`admin.content.filter.${asset.category}`)}
        </span>
      </div>
      <div className="min-w-0 p-2.5 sm:p-3.5">
        <p className="truncate text-[12px] font-bold sm:text-[14px]">{asset.title[locale]}</p>
        <p
          className={cn(
            "mt-0.5 flex items-center gap-1 text-[10px] font-medium sm:mt-1 sm:gap-1.5 sm:text-[12px]",
            active ? "text-white/70" : "text-[#8c8c8c]",
          )}
        >
          <Link2 className="size-3 shrink-0 sm:size-3.5" strokeWidth={1.8} />
          <span className="truncate">{linked ? t("admin.content.linked") : t("admin.content.unlinked")}</span>
          <span aria-hidden className="hidden sm:inline">
            ·
          </span>
          <span className="hidden truncate sm:inline">{asset.sizeLabel}</span>
        </p>
      </div>
    </button>
  )
}

function AssetPreview({ asset }: { asset: DemoContentAsset }) {
  const { t } = useTranslation()
  const preview = PREVIEW[asset.category]

  if (asset.kind === "video") {
    return (
      <div className="relative flex aspect-[16/9] w-full items-center justify-center overflow-hidden rounded-[16px] bg-[var(--gym-ink,#063434)] sm:aspect-video sm:rounded-[18px]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_80%,rgba(184,254,34,0.28),transparent_42%)]" />
        <button
          type="button"
          onClick={() => demoToast(t("admin.common.demoOnly"))}
          className="relative inline-flex size-12 items-center justify-center rounded-full bg-[var(--gym-lime,#b8fe22)] text-[var(--gym-ink,#063434)] sm:size-14"
          aria-label={t("admin.content.play")}
        >
          <Play className="size-5 translate-x-px sm:size-6" fill="currentColor" strokeWidth={0} />
        </button>
        <span className="absolute end-2.5 bottom-2.5 rounded-full bg-black/35 px-2 py-1 text-[10px] font-bold text-white sm:end-3 sm:bottom-3 sm:px-2.5 sm:text-[11px]">
          {formatDuration(asset.durationSeconds)}
        </span>
      </div>
    )
  }

  return (
    <div
      className={cn(
        "flex min-h-[120px] w-full flex-col items-start justify-end rounded-[16px] p-4 sm:min-h-[160px] sm:rounded-[18px] sm:p-5",
        preview.className,
      )}
    >
      {asset.kind === "pdf" ? (
        <FileText className="size-7 sm:size-8" strokeWidth={1.5} />
      ) : (
        preview.icon
      )}
      <p className="mt-2.5 max-w-full truncate font-heading text-[14px] font-bold sm:mt-3 sm:text-[15px]">
        {asset.fileName}
      </p>
      <p className="mt-1 text-[12px] font-medium opacity-70">{t("admin.content.preview")}</p>
    </div>
  )
}

function LinkBlock({
  label,
  empty,
  hidden,
  children,
}: {
  label: string
  empty: string
  hidden?: boolean
  children: ReactNode
}) {
  if (hidden) return null
  const items = Array.isArray(children) ? children : [children]
  const hasItems = items.filter(Boolean).length > 0

  return (
    <div className="mt-4">
      <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#8c8c8c]">{label}</p>
      {hasItems ? (
        <ul className="mt-2 flex flex-col gap-1.5 text-[13px] font-medium text-[var(--gym-ink,#063434)]">
          {children}
        </ul>
      ) : (
        <p className="mt-1.5 text-[12px] font-medium text-[#8c8c8c]">{empty}</p>
      )}
    </div>
  )
}
