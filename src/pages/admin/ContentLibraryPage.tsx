import { useMemo, useState, type ReactNode } from "react"
import { createPortal } from "react-dom"
import { Link } from "react-router-dom"
import { useTranslation } from "react-i18next"
import {
  Apple,
  BookOpen,
  Bookmark,
  Check,
  ChevronDown,
  Clapperboard,
  Copy,
  Dumbbell,
  Eye,
  FileText,
  FolderTree,
  Link2,
  Pencil,
  Play,
  Plus,
  Search,
  ShieldCheck,
  Trash2,
  Upload,
  Users,
} from "lucide-react"
import { ContentAssetFormDialog } from "@/components/dashboard/ContentAssetFormDialog"
import { ContentAssociationDialog } from "@/components/dashboard/ContentAssociationDialog"
import { ContentPreviewDialog } from "@/components/dashboard/ContentPreviewDialog"
import { FilterChip, StatCard } from "@/components/dashboard/StatCard"
import { StatusBadge } from "@/components/dashboard/StatusBadge"
import { APP_ROUTES } from "@/config/constants"
import { useAuth } from "@/features/auth/auth-context"
import {
  contentStats,
  getContentLinks,
  isContentLinked,
  type ContentFilter,
  type DemoContentAsset,
} from "@/features/content/demo"
import {
  useContentAssetsQuery,
  useDeleteContentAssetMutation,
  useSaveContentAssetMutation,
  useUpdateContentAssociationsMutation,
} from "@/features/content/hooks"
import { subscriberDisplayName } from "@/features/subscribers/demo"
import { useSubscribersQuery } from "@/features/subscribers/hooks"
import {
  usePackagesQuery,
  useSubscriptionsQuery,
} from "@/features/subscriptions/hooks"
import { useDocumentTitle } from "@/hooks/useDocumentTitle"
import { useLocale } from "@/hooks/useLocale"
import { formatDate, formatDuration } from "@/lib/format"
import { appToast } from "@/lib/toast"
import { cn } from "@/lib/utils"
import type { ContentCategory } from "@/types/content"
import type { PackageEntitlementKey } from "@/types/subscription"

const FILTERS: ContentFilter[] = [
  "all",
  "exerciseVideo",
  "workoutPdf",
  "nutritionPdf",
  "education",
  "reference",
]

const ENTITLEMENT_BADGE: Record<
  PackageEntitlementKey,
  { ar: string; en: string }
> = {
  exerciseVideos: { ar: "صلاحية: الفيديوهات", en: "Requires: Videos" },
  workoutProgram: { ar: "صلاحية: التمارين", en: "Requires: Workouts" },
  nutritionProgram: { ar: "صلاحية: التغذية", en: "Requires: Nutrition" },
  pdfDocuments: { ar: "صلاحية: ملفات PDF", en: "Requires: PDFs" },
  progressTracking: { ar: "صلاحية: التقدم", en: "Requires: Progress" },
}

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

export function ContentLibraryPage() {
  const { t } = useTranslation()
  const { locale, isRtl } = useLocale()
  const isAr = locale === "ar"
  const { user } = useAuth()
  useDocumentTitle(t("nav.content"))

  const { data: assets = [] } = useContentAssetsQuery()
  const { data: packages = [] } = usePackagesQuery()
  const { data: subscribers = [] } = useSubscribersQuery()
  const { data: subscriptions = [] } = useSubscriptionsQuery()

  const saveMutation = useSaveContentAssetMutation()
  const associateMutation = useUpdateContentAssociationsMutation()
  const deleteMutation = useDeleteContentAssetMutation()

  const [filter, setFilter] = useState<ContentFilter>("all")
  const [linkFilter, setLinkFilter] = useState<"all" | "linked" | "unlinked">(
    "all",
  )
  const [query, setQuery] = useState("")
  const [selectedId, setSelectedId] = useState<string>("")
  const [copiedPathId, setCopiedPathId] = useState<string | null>(null)

  // Modals state
  const [formModal, setFormModal] = useState<{
    open: boolean
    asset: DemoContentAsset | null
  }>({ open: false, asset: null })
  const [assocModal, setAssocModal] = useState<{
    open: boolean
    asset: DemoContentAsset | null
    tab: "programs" | "subscribers" | "packages"
  }>({ open: false, asset: null, tab: "programs" })
  const [previewAsset, setPreviewAsset] = useState<DemoContentAsset | null>(
    null,
  )
  const [deleteTarget, setDeleteTarget] = useState<DemoContentAsset | null>(
    null,
  )

  const list = useMemo(() => {
    void subscriptions
    const q = query.trim().toLowerCase()
    const queryWords = q.split(/\s+/).filter(Boolean)

    return assets.filter((item) => {
      if (filter !== "all" && item.category !== filter) return false
      if (linkFilter !== "all") {
        const linked = isContentLinked(item)
        if (linkFilter === "linked" && !linked) return false
        if (linkFilter === "unlinked" && linked) return false
      }
      if (!queryWords.length) return true

      const haystack = [
        item.title.en,
        item.title.ar,
        item.description.en,
        item.description.ar,
        item.fileName ?? "",
        item.storagePath ?? "",
        item.videoProvider ?? "",
        item.videoAssetId ?? "",
        ...item.tags,
        ...(item.exerciseNames ?? []),
        ...(item.searchTokens ?? []),
      ]
        .join(" ")
        .toLowerCase()

      return queryWords.every((word) => haystack.includes(word))
    })
  }, [assets, subscriptions, filter, linkFilter, query])

  const selected =
    list.find((item) => item.id === selectedId) ?? list[0] ?? null
  const links = useMemo(
    () => (selected ? getContentLinks(selected, subscribers, packages) : null),
    [selected, subscribers, packages],
  )
  const stats = useMemo(() => contentStats(assets), [assets])

  function pickFilter(next: ContentFilter) {
    setFilter(next)
    const first = assets.find(
      (item) => next === "all" || item.category === next,
    )
    if (first) setSelectedId(first.id)
  }

  function handleCopyStoragePath(asset: DemoContentAsset) {
    void navigator.clipboard?.writeText(asset.storagePath)
    setCopiedPathId(asset.id)
    appToast.success(
      isAr ? "تم نسخ مسار التخزين" : "Storage path copied to clipboard",
    )
    setTimeout(() => setCopiedPathId(null), 1800)
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
        <div className="flex flex-col gap-3.5">
          {/* Top row: Search input + Link filter select + Upload button */}
          <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
            <label className="relative w-full sm:max-w-[340px]">
              <Search className="pointer-events-none absolute start-3.5 top-1/2 size-4 -translate-y-1/2 text-[#8c8c8c]" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={t("admin.content.search")}
                className="h-11 w-full rounded-full bg-[#F4F4F4] pe-4 ps-10 text-[14px] font-medium text-[var(--gym-ink,#063434)] outline-none placeholder:font-normal placeholder:text-[#8c8c8c]"
              />
            </label>

            <div className="flex shrink-0 items-center gap-2 sm:gap-2.5">
              <div className="relative inline-flex items-center">
                <select
                  value={linkFilter}
                  onChange={(e) =>
                    setLinkFilter(e.target.value as "all" | "linked" | "unlinked")
                  }
                  className="h-11 w-auto min-w-[130px] max-w-[175px] cursor-pointer appearance-none rounded-full bg-[#F4F4F4] pe-8 ps-4 text-[13px] font-bold text-[var(--gym-ink,#111111)] outline-none transition hover:bg-black/5 truncate"
                >
                  <option value="all">
                    {isAr ? "كل حالات الربط" : "All link states"}
                  </option>
                  <option value="linked">
                    {t("admin.content.linked")}
                  </option>
                  <option value="unlinked">
                    {t("admin.content.unlinked")}
                  </option>
                </select>
                <ChevronDown className="pointer-events-none absolute end-3 size-4 text-[#8c8c8c]" />
              </div>

              <button
                type="button"
                onClick={() => setFormModal({ open: true, asset: null })}
                className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-full bg-[var(--gym-ink,#063434)] px-5 text-[13px] font-bold text-white transition hover:opacity-95"
              >
                <Upload className="size-4" strokeWidth={2} />
                {t("admin.content.upload")}
              </button>
            </div>
          </div>

          {/* Bottom row: Category filter chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 pt-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {FILTERS.map((item) => (
              <FilterChip
                key={item}
                active={filter === item}
                onClick={() => pickFilter(item)}
              >
                {item === "all"
                  ? t("admin.common.all")
                  : t(`admin.content.filter.${item}`)}
              </FilterChip>
            ))}
          </div>
        </div>

        {list.length === 0 || !selected || !links ? (
          <div
            role="status"
            className="mt-5 flex min-h-40 flex-col items-center justify-center gap-3 rounded-[20px] bg-[#F4F4F4] p-6 text-sm font-medium text-[#8c8c8c]"
          >
            <p>{t("admin.content.empty")}</p>
            <button
              type="button"
              onClick={() => setFormModal({ open: true, asset: null })}
              className="inline-flex h-10 items-center gap-2 rounded-full bg-[var(--gym-ink,#111111)] px-4 text-[12px] font-bold text-white"
            >
              <Plus className="size-3.5" />
              {t("admin.content.upload")}
            </button>
          </div>
        ) : (
          <div className="mt-4 grid items-start gap-4 xl:mt-5 xl:grid-cols-[minmax(0,1fr)_320px] 2xl:grid-cols-[minmax(0,1fr)_350px]">
            <div
              className={cn(
                "grid content-start items-start gap-2.5 sm:gap-3",
                list.length === 1
                  ? "max-w-[280px] grid-cols-1"
                  : "grid-cols-2 2xl:grid-cols-3",
              )}
            >
              {list.map((asset) => (
                <AssetCard
                  key={asset.id}
                  asset={asset}
                  active={asset.id === selected.id}
                  onSelect={() => setSelectedId(asset.id)}
                  onPreview={() => setPreviewAsset(asset)}
                />
              ))}
            </div>

            <aside className="min-w-0 w-full rounded-[22px] bg-[#F4F4F4] p-3.5 sm:p-5 xl:sticky xl:top-4">
              <AssetPreview
                asset={selected}
                onPreview={() => setPreviewAsset(selected)}
              />

              <div className="mt-4 flex flex-wrap items-center gap-1.5">
                <h2 className="w-full font-heading text-[18px] font-extrabold tracking-tight text-[var(--gym-ink,#063434)]">
                  {selected.title[locale]}
                </h2>
                <StatusBadge
                  label={t(`admin.content.kind.${selected.category}`)}
                  tone="info"
                />
                <StatusBadge
                  label={t(`admin.content.visibility.${selected.visibility}`)}
                  tone={selected.visibility === "assigned" ? "success" : "muted"}
                />
                {selected.requiredEntitlement ? (
                  <span className="rounded-full bg-white px-2.5 py-0.5 text-[10px] font-bold text-[var(--gym-ink,#111111)]">
                    {ENTITLEMENT_BADGE[selected.requiredEntitlement][locale]}
                  </span>
                ) : null}
              </div>

              <p className="mt-2 text-[13px] font-medium leading-relaxed text-[#6B7280]">
                {selected.description[locale]}
              </p>

              <p className="mt-2 text-[12px] font-medium text-[#8c8c8c]">
                {t("admin.content.updated", {
                  date: formatDate(selected.updatedAt, locale),
                })}
                {selected.fileName ? ` · ${selected.fileName}` : null}
                {` · ${selected.sizeLabel}`}
                {selected.pageCount
                  ? ` · ${t("admin.content.pages", { count: selected.pageCount })}`
                  : null}
              </p>

              {/* Smart Canonical Storage Path Display */}
              <div className="mt-3 rounded-2xl bg-white p-2.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-[0.06em] text-[#8c8c8c]">
                    <FolderTree className="size-3 text-[var(--gym-lime,#fb5001)]" />
                    {isAr ? "مسار التخزين" : "Storage Path"}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCopyStoragePath(selected)}
                    className="inline-flex items-center gap-1 text-[10px] font-bold text-[var(--gym-ink,#111111)] hover:underline"
                  >
                    {copiedPathId === selected.id ? (
                      <Check className="size-3 text-emerald-600" />
                    ) : (
                      <Copy className="size-3" />
                    )}
                    {copiedPathId === selected.id
                      ? isAr
                        ? "تم النسخ"
                        : "Copied"
                      : isAr
                        ? "نسخ"
                        : "Copy"}
                  </button>
                </div>
                <p
                  dir="ltr"
                  className="mt-1 truncate font-mono text-[11px] font-semibold text-[var(--gym-ink,#111111)]"
                  title={selected.storagePath}
                >
                  {selected.storagePath}
                </p>
              </div>

              {selected.tags.length > 0 ? (
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
              ) : null}

              <p className="mt-3 flex items-start gap-2 text-[12px] font-medium leading-relaxed text-[#6B7280]">
                <ShieldCheck
                  className="mt-0.5 size-4 shrink-0 text-emerald-700"
                  strokeWidth={1.8}
                />
                {selected.kind === "video"
                  ? t("admin.content.streamingHint", {
                      provider: (selected.videoProvider ?? "bunny").toUpperCase(),
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
                  <li
                    key={program.id}
                    className="flex items-center justify-between gap-2"
                  >
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
                  <li
                    key={person.id}
                    className="flex items-center justify-between gap-2"
                  >
                    <Link
                      to={APP_ROUTES.admin.subscriberDetail(person.id)}
                      className="truncate font-semibold hover:underline"
                    >
                      {subscriberDisplayName(person, locale)}
                    </Link>
                    <span className="text-[11px] text-[#8c8c8c]">
                      {t(`admin.status.${person.status}`)}
                    </span>
                  </li>
                ))}
              </LinkBlock>

              <LinkBlock
                label={t("admin.content.packages")}
                empty={t("admin.content.noPackages")}
              >
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
                  onClick={() =>
                    setAssocModal({
                      open: true,
                      asset: selected,
                      tab: "programs",
                    })
                  }
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-[var(--gym-ink,#063434)] px-4 text-[13px] font-bold text-white transition hover:opacity-95"
                >
                  <Plus className="size-4" strokeWidth={2} />
                  {t("admin.content.associate")}
                </button>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      setAssocModal({
                        open: true,
                        asset: selected,
                        tab: "subscribers",
                      })
                    }
                    className="inline-flex h-10 items-center justify-center gap-1.5 rounded-full bg-white px-3 text-[12px] font-bold text-[var(--gym-ink,#063434)] transition hover:bg-black/5"
                  >
                    <Users className="size-3.5" />
                    {t("admin.content.assign")}
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setFormModal({ open: true, asset: selected })
                    }
                    className="inline-flex h-10 items-center justify-center gap-1.5 rounded-full bg-white px-3 text-[12px] font-bold text-[var(--gym-ink,#063434)] transition hover:bg-black/5"
                  >
                    <Pencil className="size-3.5" />
                    {t("admin.content.update")}
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setPreviewAsset(selected)}
                    className="inline-flex h-10 items-center justify-center gap-1.5 rounded-full bg-white px-3 text-[12px] font-bold text-[var(--gym-ink,#063434)] transition hover:bg-black/5"
                  >
                    <Eye className="size-3.5" />
                    {isAr ? "معاينة / تشغيل" : "Preview"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleteTarget(selected)}
                    className="inline-flex h-10 items-center justify-center gap-1.5 rounded-full bg-[#FFE8E4] px-3 text-[12px] font-bold text-[#C44536] transition hover:bg-[#ffd8d1]"
                  >
                    <Trash2 className="size-3.5" />
                    {isAr ? "حذف المحتوى" : "Delete"}
                  </button>
                </div>
              </div>
            </aside>
          </div>
        )}
      </section>

      {/* Upload / Edit Modal */}
      <ContentAssetFormDialog
        open={formModal.open}
        initialAsset={formModal.asset}
        defaultCategory={filter === "all" ? "exerciseVideo" : filter}
        packages={packages}
        subscribers={subscribers}
        busy={saveMutation.isPending}
        adminName={user?.displayName || user?.email || "Head Coach"}
        onClose={() => setFormModal({ open: false, asset: null })}
        onSave={async (payload) => {
          const isEdit = Boolean(payload.id)
          const saved = await saveMutation.mutateAsync(payload)
          setSelectedId(saved.id)
          setFormModal({ open: false, asset: null })
          appToast.success(
            isEdit
              ? isAr
                ? "تم تحديث بيانات المحتوى بنجاح"
                : "Content asset updated successfully"
              : isAr
                ? "تم رفع وإضافة المحتوى بنجاح"
                : "Content asset uploaded and saved",
          )
        }}
      />

      {/* Association & Entitlements Modal */}
      <ContentAssociationDialog
        open={assocModal.open}
        asset={assocModal.asset}
        initialTab={assocModal.tab}
        packages={packages}
        subscribers={subscribers}
        busy={associateMutation.isPending}
        onClose={() =>
          setAssocModal({ open: false, asset: null, tab: "programs" })
        }
        onSave={async (payload) => {
          await associateMutation.mutateAsync(payload)
          setAssocModal({ open: false, asset: null, tab: "programs" })
          appToast.success(
            isAr
              ? "تم تحديث ارتباطات المحتوى وصلاحيات الوصول"
              : "Content associations & access rules updated",
          )
        }}
      />

      {/* Media & Document Preview Modal */}
      <ContentPreviewDialog
        asset={previewAsset}
        onClose={() => setPreviewAsset(null)}
        onEdit={(asset) => setFormModal({ open: true, asset })}
      />

      {/* Delete Confirmation Modal */}
      {deleteTarget && typeof document !== "undefined"
        ? createPortal(
            <div
              className="fixed inset-0 z-[120] flex items-center justify-center bg-black/55 p-4 backdrop-blur-[2px]"
              onClick={() => {
                if (!deleteMutation.isPending) setDeleteTarget(null)
              }}
            >
              <div
                role="dialog"
                aria-modal="true"
                dir={isRtl ? "rtl" : "ltr"}
                onClick={(e) => e.stopPropagation()}
                className="w-full max-w-md rounded-[28px] bg-white p-6 shadow-2xl"
              >
                <div className="flex items-center gap-3">
                  <span className="inline-flex size-11 shrink-0 items-center justify-center rounded-2xl bg-[#FFE8E4] text-[#C44536]">
                    <Trash2 className="size-5" strokeWidth={2} />
                  </span>
                  <div>
                    <h3 className="font-heading text-[18px] font-extrabold text-[var(--gym-ink,#111111)]">
                      {isAr ? "تأكيد حذف المحتوى" : "Delete content asset"}
                    </h3>
                    <p className="text-[12px] font-medium text-[#8c8c8c]">
                      {deleteTarget.title[locale]}
                    </p>
                  </div>
                </div>
                <p className="mt-4 text-[13px] font-medium leading-relaxed text-[#6B7280]">
                  {isAr
                    ? "سيتم حذف هذا المحتوى نهائياً من قاعدة البيانات وإلغاء ارتباطه بالبرامج والباقات والمشتركين. هل أنت متأكد؟"
                    : "This content asset will be permanently removed from the library and unlinked from associated programs, packages, and subscribers."}
                </p>
                <p
                  dir="ltr"
                  className="mt-3 truncate rounded-xl bg-[#F4F4F4] px-3 py-2 font-mono text-[11px] font-semibold text-[#6B7280]"
                >
                  {deleteTarget.storagePath}
                </p>
                <div className="mt-6 flex items-center justify-end gap-2.5">
                  <button
                    type="button"
                    disabled={deleteMutation.isPending}
                    onClick={() => setDeleteTarget(null)}
                    className="inline-flex h-10 items-center justify-center rounded-full bg-[#F4F4F4] px-5 text-[13px] font-bold text-[var(--gym-ink,#111111)] transition hover:bg-black/10"
                  >
                    {isAr ? "إلغاء" : "Cancel"}
                  </button>
                  <button
                    type="button"
                    disabled={deleteMutation.isPending}
                    onClick={async () => {
                      const targetId = deleteTarget.id
                      await deleteMutation.mutateAsync(targetId)
                      setDeleteTarget(null)
                      if (selectedId === targetId) {
                        const remaining = list.filter((i) => i.id !== targetId)
                        setSelectedId(remaining[0]?.id ?? "")
                      }
                      appToast.success(
                        isAr
                          ? "تم حذف المحتوى من المكتبة بنجاح"
                          : "Content asset deleted from library",
                      )
                    }}
                    className="inline-flex h-10 items-center justify-center rounded-full bg-[#C44536] px-5 text-[13px] font-bold text-white transition hover:opacity-95 disabled:opacity-50"
                  >
                    {deleteMutation.isPending
                      ? isAr
                        ? "جارٍ الحذف..."
                        : "Deleting..."
                      : isAr
                        ? "نعم، حذف المحتوى"
                        : "Delete permanently"}
                  </button>
                </div>
              </div>
            </div>,
            document.body,
          )
        : null}
    </div>
  )
}

function AssetCard({
  asset,
  active,
  onSelect,
  onPreview,
}: {
  asset: DemoContentAsset
  active: boolean
  onSelect: () => void
  onPreview: () => void
}) {
  const { t } = useTranslation()
  const { locale } = useLocale()
  const preview = PREVIEW[asset.category]
  const linked = isContentLinked(asset)

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onSelect}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault()
          onSelect()
        }
      }}
      className={cn(
        "group flex h-fit w-full cursor-pointer flex-col self-start overflow-hidden rounded-[20px] text-start transition-shadow sm:rounded-[22px]",
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
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              onSelect()
              onPreview()
            }}
            className={cn(
              "inline-flex size-9 items-center justify-center rounded-full transition-transform group-hover:scale-105 sm:size-12",
              active
                ? "bg-[var(--gym-lime,#b8fe22)] text-[var(--gym-ink,#063434)]"
                : "bg-white/15 text-white",
            )}
            aria-label={t("admin.content.play")}
          >
            <Play
              className="size-4 translate-x-px sm:size-5"
              fill="currentColor"
              strokeWidth={0}
            />
          </button>
        ) : (
          <span className="[&>svg]:size-6 sm:[&>svg]:size-8">{preview.icon}</span>
        )}
        <span
          className={cn(
            "absolute end-2 top-2 rounded-full px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-[0.06em] sm:end-2.5 sm:top-2.5 sm:px-2 sm:text-[10px]",
            active
              ? "bg-white/15 text-white"
              : "bg-white/80 text-[var(--gym-ink,#063434)]",
          )}
        >
          {asset.kind === "video"
            ? formatDuration(asset.durationSeconds)
            : t(`admin.content.filter.${asset.category}`)}
        </span>
      </div>
      <div className="min-w-0 p-2.5 sm:p-3.5">
        <p className="truncate text-[12px] font-bold sm:text-[14px]">
          {asset.title[locale]}
        </p>
        <p
          className={cn(
            "mt-0.5 flex items-center gap-1 text-[10px] font-medium sm:mt-1 sm:gap-1.5 sm:text-[12px]",
            active ? "text-white/70" : "text-[#8c8c8c]",
          )}
        >
          <Link2 className="size-3 shrink-0 sm:size-3.5" strokeWidth={1.8} />
          <span className="truncate">
            {linked ? t("admin.content.linked") : t("admin.content.unlinked")}
          </span>
          <span aria-hidden className="hidden sm:inline">
            ·
          </span>
          <span className="hidden truncate sm:inline">{asset.sizeLabel}</span>
        </p>
      </div>
    </div>
  )
}

function AssetPreview({
  asset,
  onPreview,
}: {
  asset: DemoContentAsset
  onPreview: () => void
}) {
  const { t } = useTranslation()
  const preview = PREVIEW[asset.category]

  if (asset.kind === "video") {
    return (
      <div className="relative flex aspect-[16/9] w-full items-center justify-center overflow-hidden rounded-[16px] bg-[var(--gym-ink,#063434)] sm:aspect-video sm:rounded-[18px]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_80%,rgba(184,254,34,0.28),transparent_42%)]" />
        <button
          type="button"
          onClick={onPreview}
          className="relative inline-flex size-12 items-center justify-center rounded-full bg-[var(--gym-lime,#b8fe22)] text-[var(--gym-ink,#063434)] transition-transform hover:scale-105 sm:size-14"
          aria-label={t("admin.content.play")}
        >
          <Play
            className="size-5 translate-x-px sm:size-6"
            fill="currentColor"
            strokeWidth={0}
          />
        </button>
        <span className="absolute end-2.5 bottom-2.5 rounded-full bg-black/35 px-2 py-1 text-[10px] font-bold text-white sm:end-3 sm:bottom-3 sm:px-2.5 sm:text-[11px]">
          {formatDuration(asset.durationSeconds)}
        </span>
      </div>
    )
  }

  return (
    <button
      type="button"
      onClick={onPreview}
      className={cn(
        "flex min-h-[120px] w-full flex-col items-start justify-end rounded-[16px] p-4 text-start transition hover:opacity-95 sm:min-h-[150px] sm:rounded-[18px] sm:p-5",
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
      <p className="mt-1 text-[12px] font-medium opacity-75">
        {t("admin.content.preview")}
      </p>
    </button>
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
      <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#8c8c8c]">
        {label}
      </p>
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
