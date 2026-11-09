import { useMemo, useState } from "react"
import { Link } from "react-router-dom"
import {
  Apple,
  BookMarked,
  BookOpen,
  Clapperboard,
  Dumbbell,
  FileText,
  Lock,
  Play,
  Search,
  ShieldCheck,
  Sparkles,
  UserCheck,
  X,
} from "lucide-react"
import { ContentPreviewDialog } from "@/components/dashboard/ContentPreviewDialog"
import { StatusBadge } from "@/components/dashboard/StatusBadge"
import { BRAND_LOGO_ON_DARK } from "@/components/shared/BrandLogo"
import { APP_ROUTES } from "@/config/constants"
import { evaluateSubscriberContentAccess } from "@/features/content/access"
import { useContentAssetsQuery } from "@/features/content/hooks"
import { useNutritionProgramsQuery } from "@/features/nutrition/hooks"
import { usePanelSubscriber } from "@/features/subscribers/use-panel-subscriber"
import {
  currentSubscriptionFor,
  getPackageById,
} from "@/features/subscriptions/cache"
import {
  usePackagesQuery,
  useSubscriberSubscriptionsQuery,
} from "@/features/subscriptions/hooks"
import { useWorkoutProgramsQuery } from "@/features/workouts/hooks"
import type { CatalogPackage } from "@/features/subscriptions/types"
import type { ContentAsset } from "@/types/content"
import { useDocumentTitle } from "@/hooks/useDocumentTitle"
import { useLocale } from "@/hooks/useLocale"
import { formatDuration } from "@/lib/format"
import { cn } from "@/lib/utils"

type LibraryFilter =
  | "all"
  | "myPrograms"
  | "exerciseVideo"
  | "workoutPdf"
  | "nutritionPdf"
  | "education"

export function LibraryPage() {
  const { locale } = useLocale()
  const isAr = locale === "ar"
  useDocumentTitle(isAr ? "مكتبة المحتوى والملفات" : "Resource Library")

  const { subscriber: currentSubscriber, subscriberId } = usePanelSubscriber()
  const { data: assets = [] } = useContentAssetsQuery({ audience: "subscriber" })
  const { data: mySubs = [] } = useSubscriberSubscriptionsQuery(subscriberId)
  usePackagesQuery()
  const { data: workoutPrograms = [] } = useWorkoutProgramsQuery({
    subscriberId,
    enabled: Boolean(subscriberId),
  })
  const { data: nutritionPrograms = [] } = useNutritionProgramsQuery({
    subscriberId,
    enabled: Boolean(subscriberId),
  })

  const [filter, setFilter] = useState<LibraryFilter>("all")
  const [query, setQuery] = useState("")
  const [unlockedOnly, setUnlockedOnly] = useState(false)
  const [previewAsset, setPreviewAsset] = useState<ContentAsset | null>(null)

  const subscription = useMemo(() => {
    if (!subscriberId) return null
    return (
      mySubs.find((s) => s.status === "active" || s.status === "suspended") ??
      mySubs[0] ??
      currentSubscriptionFor(subscriberId)
    )
  }, [subscriberId, mySubs])

  const currentPackage = useMemo(() => {
    if (!subscription) return null
    return getPackageById(subscription.packageId) as CatalogPackage | undefined
  }, [subscription])

  // 3. Identify active workout and nutrition programs
  const activeWorkoutProgram = useMemo(() => {
    return workoutPrograms.find((p) => p.status === "active")
  }, [workoutPrograms])

  const activeNutritionProgram = useMemo(() => {
    return nutritionPrograms.find((p) => p.status === "active")
  }, [nutritionPrograms])

  // 4. Enrich all non-reference assets with permissions and program linkages
  const enrichedAssets = useMemo(() => {
    // Staff reference internal files must never appear in subscriber library
    const publicAssets = assets.filter((item) => item.category !== "reference")

    return publicAssets.map((asset) => {
      const access = evaluateSubscriberContentAccess({
        asset,
        subscriber: currentSubscriber,
        subscription,
        pkg: currentPackage,
      })

      // Check linkage with active workout program
      const isLinkedToWorkout = Boolean(
        activeWorkoutProgram &&
          (asset.programIds?.includes(activeWorkoutProgram.id) ||
            activeWorkoutProgram.days?.some((d) =>
              d.exercises?.some((ex) => ex.videoContentId === asset.id),
            ) ||
            (asset.fileName &&
              activeWorkoutProgram.pdfName?.en === asset.fileName)),
      )

      // Check linkage with active nutrition plan
      const isLinkedToNutrition = Boolean(
        activeNutritionProgram &&
          (asset.programIds?.includes(activeNutritionProgram.id) ||
            (asset.fileName &&
              activeNutritionProgram.pdfName?.en === asset.fileName)),
      )

      // Check direct assignment by coach
      const isDirectlyAssigned = Boolean(
        currentSubscriber &&
          asset.subscriberIds?.includes(currentSubscriber.id),
      )

      const isPartOfMyPrograms =
        isLinkedToWorkout || isLinkedToNutrition || isDirectlyAssigned

      return {
        asset,
        access,
        isLinkedToWorkout,
        isLinkedToNutrition,
        isDirectlyAssigned,
        isPartOfMyPrograms,
      }
    })
  }, [
    assets,
    currentSubscriber,
    subscription,
    currentPackage,
    activeWorkoutProgram,
    activeNutritionProgram,
  ])

  // 5. Compute counts for metric cards and filter chips
  const counts = useMemo(() => {
    const total = enrichedAssets.length
    const myPrograms = enrichedAssets.filter((item) => item.isPartOfMyPrograms).length
    const exerciseVideo = enrichedAssets.filter(
      (item) => item.asset.category === "exerciseVideo",
    ).length
    const workoutPdf = enrichedAssets.filter(
      (item) => item.asset.category === "workoutPdf",
    ).length
    const nutritionPdf = enrichedAssets.filter(
      (item) => item.asset.category === "nutritionPdf",
    ).length
    const education = enrichedAssets.filter(
      (item) => item.asset.category === "education",
    ).length
    const unlocked = enrichedAssets.filter((item) => item.access.allowed).length

    return {
      total,
      myPrograms,
      exerciseVideo,
      workoutPdf,
      nutritionPdf,
      education,
      unlocked,
    }
  }, [enrichedAssets])

  // 6. Filter items according to active category, search query, and unlocked toggle
  const visibleItems = useMemo(() => {
    const q = query.trim().toLowerCase()

    return enrichedAssets.filter((item) => {
      // Category filter
      if (filter === "myPrograms") {
        if (!item.isPartOfMyPrograms) return false
      } else if (filter !== "all" && item.asset.category !== filter) {
        return false
      }

      // Unlocked only toggle
      if (unlockedOnly && !item.access.allowed) {
        return false
      }

      // Search query
      if (!q) return true

      const titleMatch =
        item.asset.title.en.toLowerCase().includes(q) ||
        item.asset.title.ar.toLowerCase().includes(q)
      const descMatch =
        item.asset.description.en.toLowerCase().includes(q) ||
        item.asset.description.ar.toLowerCase().includes(q)
      const tagMatch = item.asset.tags.some((tag) =>
        tag.toLowerCase().includes(q),
      )
      const exMatch = item.asset.exerciseNames?.some((ex) =>
        ex.toLowerCase().includes(q),
      )
      const fileMatch = item.asset.fileName?.toLowerCase().includes(q)

      return titleMatch || descMatch || tagMatch || exMatch || fileMatch
    })
  }, [enrichedAssets, filter, query, unlockedOnly])

  return (
    <div className="flex flex-col gap-5 pb-12">
      {/* ======================================================== */}
      {/* 1. Clean Top Header & Metric Overview Cards              */}
      {/* ======================================================== */}
      <div className="flex flex-col gap-4">
        {/* Title & Subscription Tier Pill */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-11 items-center justify-center rounded-2xl bg-[var(--gym-ink,#111111)] px-3 shadow-xs shrink-0 border border-black/10">
              <img
                src={BRAND_LOGO_ON_DARK}
                alt="DerpyFit"
                className="h-4.5 w-auto object-contain select-none"
                draggable={false}
              />
            </div>
            <div>
              <h1 className="font-heading text-[21px] sm:text-[23px] font-black text-[var(--gym-ink,#111111)]">
                {isAr ? "مكتبة المحتوى والملفات" : "Resource & Media Library"}
              </h1>
              <p className="text-[12.5px] sm:text-[13px] font-medium text-[#6B7280]">
                {isAr
                  ? "شروحات التكنيك المرئية، أدلة التمارين، وكتيبات التغذية المعتمدة لبرنامجك"
                  : "Authorized exercise videos, workout guides, and certified nutrition playbooks."}
              </p>
            </div>
          </div>

          {/* Current Package & Status Pill */}
          {currentPackage ? (
            <div className="inline-flex items-center gap-2 rounded-full bg-white px-3.5 py-1.5 shadow-2xs border border-black/8 self-start sm:self-auto">
              <span className="size-2 rounded-full bg-[var(--gym-lime,#fb5001)]" />
              <span className="text-[12px] font-bold text-[var(--gym-ink,#111111)]">
                {currentPackage.name[locale]}
              </span>
              <span className="text-[11px] text-[#8c8c8c]">·</span>
              <span className="text-[11.5px] font-semibold text-[#8c8c8c]">
                {counts.unlocked} {isAr ? "محتوى متاح" : "unlocked"}
              </span>
            </div>
          ) : null}
        </div>

        {/* 4 Clean Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {/* Card 1: All Accessible */}
          <div className="rounded-[20px] bg-white p-3.5 sm:p-4 border border-black/6 shadow-2xs flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[12px] font-bold text-[#8c8c8c]">
                {isAr ? "المحتوى المتاح" : "Unlocked"}
              </span>
              <span className="flex size-7 items-center justify-center rounded-xl bg-black/5 text-[var(--gym-lime,#fb5001)]">
                <Sparkles className="size-3.5" />
              </span>
            </div>
            <div className="mt-2 flex items-baseline gap-1.5">
              <span className="font-heading text-[22px] font-black text-[var(--gym-ink,#111111)]">
                {counts.unlocked}
              </span>
              <span className="text-[11px] font-semibold text-[#8c8c8c]">
                / {counts.total}
              </span>
            </div>
          </div>

          {/* Card 2: My Programs */}
          <button
            type="button"
            onClick={() => setFilter("myPrograms")}
            className="rounded-[20px] bg-white p-3.5 sm:p-4 border border-black/6 shadow-2xs flex flex-col justify-between text-start hover:border-black/16 transition"
          >
            <div className="flex items-center justify-between w-full">
              <span className="text-[12px] font-bold text-[#8c8c8c]">
                {isAr ? "ملفات برامجي" : "My Programs"}
              </span>
              <span className="flex size-7 items-center justify-center rounded-xl bg-black/5 text-[var(--gym-lime,#fb5001)]">
                <BookMarked className="size-3.5" />
              </span>
            </div>
            <div className="mt-2 flex items-baseline gap-1.5">
              <span className="font-heading text-[22px] font-black text-[var(--gym-ink,#111111)]">
                {counts.myPrograms}
              </span>
              <span className="text-[11px] font-semibold text-[#8c8c8c]">
                {isAr ? "ملف مرتبط" : "linked"}
              </span>
            </div>
          </button>

          {/* Card 3: Exercise Videos */}
          <button
            type="button"
            onClick={() => setFilter("exerciseVideo")}
            className="rounded-[20px] bg-white p-3.5 sm:p-4 border border-black/6 shadow-2xs flex flex-col justify-between text-start hover:border-black/16 transition"
          >
            <div className="flex items-center justify-between w-full">
              <span className="text-[12px] font-bold text-[#8c8c8c]">
                {isAr ? "فيديوهات التكنيك" : "Videos"}
              </span>
              <span className="flex size-7 items-center justify-center rounded-xl bg-black/5 text-[var(--gym-lime,#fb5001)]">
                <Clapperboard className="size-3.5" />
              </span>
            </div>
            <div className="mt-2 flex items-baseline gap-1.5">
              <span className="font-heading text-[22px] font-black text-[var(--gym-ink,#111111)]">
                {counts.exerciseVideo}
              </span>
              <span className="text-[11px] font-semibold text-[#8c8c8c]">
                {isAr ? "مقطع تدريبي" : "clips"}
              </span>
            </div>
          </button>

          {/* Card 4: Guides & PDFs */}
          <button
            type="button"
            onClick={() => setFilter("workoutPdf")}
            className="rounded-[20px] bg-white p-3.5 sm:p-4 border border-black/6 shadow-2xs flex flex-col justify-between text-start hover:border-black/16 transition"
          >
            <div className="flex items-center justify-between w-full">
              <span className="text-[12px] font-bold text-[#8c8c8c]">
                {isAr ? "ملفات PDF" : "PDF Guides"}
              </span>
              <span className="flex size-7 items-center justify-center rounded-xl bg-black/5 text-[var(--gym-lime,#fb5001)]">
                <FileText className="size-3.5" />
              </span>
            </div>
            <div className="mt-2 flex items-baseline gap-1.5">
              <span className="font-heading text-[22px] font-black text-[var(--gym-ink,#111111)]">
                {counts.workoutPdf + counts.nutritionPdf + counts.education}
              </span>
              <span className="text-[11px] font-semibold text-[#8c8c8c]">
                {isAr ? "كتيب ودليل" : "docs"}
              </span>
            </div>
          </button>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 2. Controls Section: Search, Filters & Toggles           */}
      {/* ======================================================== */}
      <section className="rounded-[24px] bg-white p-4 sm:p-5 shadow-xs border border-black/6">
        <div className="flex flex-col gap-3.5 md:flex-row md:items-center md:justify-between">
          {/* Section Heading & Result Count */}
          <div>
            <h2 className="font-heading text-[17px] sm:text-[19px] font-black text-[var(--gym-ink,#111111)]">
              {isAr ? "تصفح الملفات والمقاطع" : "Browse Files & Videos"}
            </h2>
            <p className="mt-0.5 text-[12px] sm:text-[12.5px] font-medium text-[#6B7280]">
              {isAr
                ? `عرض ${visibleItems.length} من أصل ${counts.total} مورداً تدريبياً`
                : `Showing ${visibleItems.length} of ${counts.total} training resources`}
            </p>
          </div>

          {/* Search Input & Unlocked Toggle */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
            {/* Search Input */}
            <div className="relative w-full sm:w-[260px] md:w-[300px]">
              <Search className="pointer-events-none absolute start-3.5 top-1/2 size-4 -translate-y-1/2 text-[#8c8c8c]" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={isAr ? "بحث في العناوين والتمارين..." : "Search resources..."}
                className="h-10 w-full rounded-full bg-[#F4F4F4] pe-9 ps-10 text-[13px] font-medium text-[var(--gym-ink,#111111)] placeholder:text-[#8c8c8c] outline-none transition focus:ring-2 focus:ring-[var(--gym-lime,#fb5001)]/30"
              />
              {query ? (
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  className="absolute end-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-[#8c8c8c] hover:bg-black/10 hover:text-[var(--gym-ink,#111111)]"
                >
                  <X className="size-3.5" />
                </button>
              ) : null}
            </div>

            {/* Unlocked Only Toggle Button */}
            <button
              type="button"
              onClick={() => setUnlockedOnly((prev) => !prev)}
              className={cn(
                "inline-flex h-10 items-center justify-center gap-1.5 rounded-full px-4 text-[12px] font-bold transition whitespace-nowrap",
                unlockedOnly
                  ? "bg-[var(--gym-ink,#111111)] text-white shadow-xs"
                  : "bg-[#F4F4F4] text-[#6B7280] hover:bg-[#ECECEC] hover:text-[var(--gym-ink,#111111)]",
              )}
            >
              <ShieldCheck className={cn("size-3.5", unlockedOnly ? "text-[var(--gym-lime,#fb5001)]" : "")} />
              <span>{isAr ? "المتاح في باقتي فقط" : "Unlocked only"}</span>
            </button>
          </div>
        </div>

        {/* Filter Chips Bar (Touch Scrollable on Mobile) */}
        <div className="mt-3.5 flex gap-2 overflow-x-auto pb-1 no-scrollbar">
          {/* All */}
          <button
            type="button"
            onClick={() => setFilter("all")}
            className={cn(
              "inline-flex h-8.5 items-center gap-1.5 rounded-full px-3.5 text-[12px] font-bold transition shrink-0",
              filter === "all"
                ? "bg-[var(--gym-ink,#111111)] text-white shadow-xs"
                : "bg-[#F4F4F4] text-[#6B7280] hover:bg-[#ECECEC] hover:text-[var(--gym-ink,#111111)]",
            )}
          >
            <span>{isAr ? "الكل" : "All"}</span>
            <span
              className={cn(
                "rounded-full px-1.5 py-0.2 text-[10.5px] font-mono",
                filter === "all" ? "bg-white/20 text-white" : "bg-black/8 text-[#6B7280]",
              )}
            >
              {counts.total}
            </span>
          </button>

          {/* My Programs */}
          <button
            type="button"
            onClick={() => setFilter("myPrograms")}
            className={cn(
              "inline-flex h-8.5 items-center gap-1.5 rounded-full px-3.5 text-[12px] font-bold transition shrink-0",
              filter === "myPrograms"
                ? "bg-[var(--gym-lime,#fb5001)] text-white shadow-xs"
                : "bg-[#F4F4F4] text-[#6B7280] hover:bg-[#ECECEC] hover:text-[var(--gym-ink,#111111)]",
            )}
          >
            <Sparkles className="size-3.5" />
            <span>{isAr ? "برامجي المخصصة" : "My Programs"}</span>
            <span
              className={cn(
                "rounded-full px-1.5 py-0.2 text-[10.5px] font-mono",
                filter === "myPrograms" ? "bg-white/25 text-white" : "bg-black/8 text-[#6B7280]",
              )}
            >
              {counts.myPrograms}
            </span>
          </button>

          {/* Exercise Videos */}
          <button
            type="button"
            onClick={() => setFilter("exerciseVideo")}
            className={cn(
              "inline-flex h-8.5 items-center gap-1.5 rounded-full px-3.5 text-[12px] font-bold transition shrink-0",
              filter === "exerciseVideo"
                ? "bg-[var(--gym-ink,#111111)] text-white shadow-xs"
                : "bg-[#F4F4F4] text-[#6B7280] hover:bg-[#ECECEC] hover:text-[var(--gym-ink,#111111)]",
            )}
          >
            <Clapperboard className="size-3.5" />
            <span>{isAr ? "فيديوهات التكنيك" : "Exercise Videos"}</span>
            <span
              className={cn(
                "rounded-full px-1.5 py-0.2 text-[10.5px] font-mono",
                filter === "exerciseVideo" ? "bg-white/20 text-white" : "bg-black/8 text-[#6B7280]",
              )}
            >
              {counts.exerciseVideo}
            </span>
          </button>

          {/* Workout PDFs */}
          <button
            type="button"
            onClick={() => setFilter("workoutPdf")}
            className={cn(
              "inline-flex h-8.5 items-center gap-1.5 rounded-full px-3.5 text-[12px] font-bold transition shrink-0",
              filter === "workoutPdf"
                ? "bg-[var(--gym-ink,#111111)] text-white shadow-xs"
                : "bg-[#F4F4F4] text-[#6B7280] hover:bg-[#ECECEC] hover:text-[var(--gym-ink,#111111)]",
            )}
          >
            <Dumbbell className="size-3.5" />
            <span>{isAr ? "ملفات التمارين PDF" : "Workout PDFs"}</span>
            <span
              className={cn(
                "rounded-full px-1.5 py-0.2 text-[10.5px] font-mono",
                filter === "workoutPdf" ? "bg-white/20 text-white" : "bg-black/8 text-[#6B7280]",
              )}
            >
              {counts.workoutPdf}
            </span>
          </button>

          {/* Nutrition PDFs */}
          <button
            type="button"
            onClick={() => setFilter("nutritionPdf")}
            className={cn(
              "inline-flex h-8.5 items-center gap-1.5 rounded-full px-3.5 text-[12px] font-bold transition shrink-0",
              filter === "nutritionPdf"
                ? "bg-[var(--gym-ink,#111111)] text-white shadow-xs"
                : "bg-[#F4F4F4] text-[#6B7280] hover:bg-[#ECECEC] hover:text-[var(--gym-ink,#111111)]",
            )}
          >
            <Apple className="size-3.5" />
            <span>{isAr ? "أدلة التغذية PDF" : "Nutrition PDFs"}</span>
            <span
              className={cn(
                "rounded-full px-1.5 py-0.2 text-[10.5px] font-mono",
                filter === "nutritionPdf" ? "bg-white/20 text-white" : "bg-black/8 text-[#6B7280]",
              )}
            >
              {counts.nutritionPdf}
            </span>
          </button>

          {/* Education Guides */}
          <button
            type="button"
            onClick={() => setFilter("education")}
            className={cn(
              "inline-flex h-8.5 items-center gap-1.5 rounded-full px-3.5 text-[12px] font-bold transition shrink-0",
              filter === "education"
                ? "bg-[var(--gym-ink,#111111)] text-white shadow-xs"
                : "bg-[#F4F4F4] text-[#6B7280] hover:bg-[#ECECEC] hover:text-[var(--gym-ink,#111111)]",
            )}
          >
            <BookOpen className="size-3.5" />
            <span>{isAr ? "الأدلة التعليمية" : "Education Guides"}</span>
            <span
              className={cn(
                "rounded-full px-1.5 py-0.2 text-[10.5px] font-mono",
                filter === "education" ? "bg-white/20 text-white" : "bg-black/8 text-[#6B7280]",
              )}
            >
              {counts.education}
            </span>
          </button>
        </div>
      </section>

      {/* ======================================================== */}
      {/* 3. Resource Cards Grid                                   */}
      {/* ======================================================== */}
      {visibleItems.length === 0 ? (
        /* Empty State */
        <div className="flex min-h-64 flex-col items-center justify-center rounded-[26px] bg-white p-8 text-center shadow-xs border border-black/6">
          <div className="flex size-14 items-center justify-center rounded-2xl bg-black/5 text-[#8c8c8c] mb-3">
            <Search className="size-6 text-[var(--gym-lime,#fb5001)]" />
          </div>
          <h3 className="font-heading text-[18px] font-extrabold text-[var(--gym-ink,#111111)]">
            {isAr ? "لا توجد ملفات تطابق معايير البحث" : "No resources found"}
          </h3>
          <p className="mt-1 max-w-sm text-[13px] text-[#8c8c8c]">
            {isAr
              ? "جرّب تغيير كلمات البحث أو إعادة ضبط التصفية لعرض جميع المواد التدريبية المتاحة."
              : "Try adjusting your search query or reset filters to view all available resources."}
          </p>
          <button
            type="button"
            onClick={() => {
              setFilter("all")
              setQuery("")
              setUnlockedOnly(false)
            }}
            className="mt-4 inline-flex h-10 items-center justify-center rounded-full bg-[var(--gym-ink,#111111)] px-5 text-[12.5px] font-bold text-white transition hover:bg-[var(--gym-lime,#fb5001)]"
          >
            {isAr ? "إعادة ضبط التصفية" : "Reset Filters"}
          </button>
        </div>
      ) : (
        <div className="grid gap-4 sm:gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {visibleItems.map(
            ({
              asset,
              access,
              isLinkedToWorkout,
              isLinkedToNutrition,
              isDirectlyAssigned,
            }) => (
              <div
                key={asset.id}
                className={cn(
                  "group flex flex-col justify-between rounded-[24px] bg-white p-4.5 sm:p-5 border transition-all duration-300 shadow-xs hover:shadow-md",
                  access.allowed
                    ? "border-black/6 hover:border-black/18"
                    : "border-black/6 bg-[#FAFAFA] opacity-90",
                )}
              >
                {/* Top Section */}
                <div>
                  {/* Category Pill & Status Badge */}
                  <div className="flex items-center justify-between gap-2">
                    <span className="inline-flex size-11 items-center justify-center rounded-2xl bg-[var(--gym-ink,#111111)] text-[var(--gym-lime,#fb5001)] shadow-xs">
                      {asset.category === "exerciseVideo" ? (
                        <Clapperboard className="size-5" strokeWidth={2} />
                      ) : asset.category === "workoutPdf" ? (
                        <Dumbbell className="size-5" strokeWidth={2} />
                      ) : asset.category === "nutritionPdf" ? (
                        <Apple className="size-5" strokeWidth={2} />
                      ) : (
                        <BookOpen className="size-5" strokeWidth={2} />
                      )}
                    </span>

                    <StatusBadge
                      label={
                        access.allowed
                          ? isAr
                            ? "متاح في باقتك"
                            : "Unlocked"
                          : isAr
                            ? "مقفل · يتطلب ترقية"
                            : "Locked"
                      }
                      tone={access.allowed ? "success" : "muted"}
                    />
                  </div>

                  {/* Program Linkage Indicators */}
                  {isLinkedToWorkout && activeWorkoutProgram ? (
                    <div className="mt-3 flex items-center gap-1.5 rounded-xl bg-black/5 px-2.5 py-1 text-[11px] font-bold text-[var(--gym-ink,#111111)]">
                      <Dumbbell className="size-3 text-[var(--gym-lime,#fb5001)] shrink-0" />
                      <span className="truncate">
                        {isAr ? "برنامجك: " : "Workout: "}
                        {activeWorkoutProgram.title[locale]}
                      </span>
                    </div>
                  ) : isLinkedToNutrition && activeNutritionProgram ? (
                    <div className="mt-3 flex items-center gap-1.5 rounded-xl bg-black/5 px-2.5 py-1 text-[11px] font-bold text-[var(--gym-ink,#111111)]">
                      <Apple className="size-3 text-[var(--gym-lime,#fb5001)] shrink-0" />
                      <span className="truncate">
                        {isAr ? "خطتك: " : "Nutrition: "}
                        {activeNutritionProgram.title[locale]}
                      </span>
                    </div>
                  ) : isDirectlyAssigned ? (
                    <div className="mt-3 flex items-center gap-1.5 rounded-xl bg-[var(--gym-lime,#fb5001)]/10 px-2.5 py-1 text-[11px] font-bold text-[var(--gym-lime,#fb5001)]">
                      <UserCheck className="size-3 shrink-0" />
                      <span>{isAr ? "مخصص لك شخصياً من المدرب" : "Assigned directly to you"}</span>
                    </div>
                  ) : null}

                  {/* Title & Description */}
                  <h3 className="mt-3.5 font-heading text-[16px] sm:text-[17px] font-extrabold text-[var(--gym-ink,#111111)] leading-snug group-hover:text-[var(--gym-lime,#fb5001)] transition-colors">
                    {asset.title[locale]}
                  </h3>
                  <p className="mt-1.5 text-[12.5px] sm:text-[13px] font-medium leading-relaxed text-[#6B7280] line-clamp-2">
                    {asset.description[locale]}
                  </p>

                  {/* Exercise / Tag chips */}
                  {asset.tags.length > 0 ? (
                    <div className="mt-3 flex flex-wrap gap-1">
                      {asset.tags.slice(0, 3).map((tag) => (
                        <span
                          key={tag}
                          className="rounded-md bg-[#F4F4F4] px-2 py-0.5 text-[10.5px] font-bold text-[#6B7280]"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  ) : null}
                </div>

                {/* Bottom Bar: Meta Info & Action Button */}
                <div className="mt-4 pt-3.5 border-t border-black/8 flex flex-col gap-3">
                  <div className="flex items-center justify-between text-[11.5px] font-bold text-[#8c8c8c]">
                    <span>
                      {asset.kind === "video"
                        ? `${formatDuration(asset.durationSeconds)} · 1080p HD`
                        : `${asset.pageCount ? `${asset.pageCount} ${isAr ? "صفحات" : "pages"} · ` : ""}${asset.sizeLabel}`}
                    </span>
                    <span className="capitalize text-[10.5px] rounded-md bg-black/5 px-2 py-0.5">
                      {asset.category === "exerciseVideo"
                        ? isAr ? "فيديو" : "Video"
                        : isAr ? "كتيب PDF" : "PDF Guide"}
                    </span>
                  </div>

                  {access.allowed ? (
                    <button
                      type="button"
                      onClick={() => setPreviewAsset(asset)}
                      className={cn(
                        "inline-flex h-10 w-full items-center justify-center gap-2 rounded-full px-4 text-[13px] font-extrabold shadow-xs transition-all duration-200 active:scale-98",
                        asset.kind === "video"
                          ? "bg-[var(--gym-ink,#111111)] hover:bg-[var(--gym-lime,#fb5001)] text-white"
                          : "bg-[var(--gym-lime,#fb5001)] hover:bg-[#e04500] text-white",
                      )}
                    >
                      {asset.kind === "video" ? (
                        <>
                          <Play className="size-3.5 fill-current" />
                          <span>{isAr ? "مشاهدة الفيديو" : "Watch Video"}</span>
                        </>
                      ) : (
                        <>
                          <FileText className="size-3.5" />
                          <span>{isAr ? "فتح وقراءة الملف" : "Open Document"}</span>
                        </>
                      )}
                    </button>
                  ) : (
                    <div className="space-y-2">
                      <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#8c8c8c]">
                        <Lock className="size-3.5 text-[var(--gym-lime,#fb5001)] shrink-0" />
                        <span className="truncate">{access.reason[locale]}</span>
                      </div>
                      <Link
                        to={APP_ROUTES.subscriber.subscription}
                        className="inline-flex h-9 w-full items-center justify-center rounded-full bg-black/5 hover:bg-black/10 text-[12px] font-extrabold text-[var(--gym-ink,#111111)] transition"
                      >
                        {isAr ? "ترقية الباقة لفتح الملف" : "Upgrade to Unlock"}
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            ),
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* 4. Secure Content Preview Dialog                         */}
      {/* ======================================================== */}
      <ContentPreviewDialog
        asset={previewAsset}
        onClose={() => setPreviewAsset(null)}
      />
    </div>
  )
}
