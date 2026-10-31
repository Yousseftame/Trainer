import { useEffect, useMemo, useRef, useState } from "react"
import { createPortal } from "react-dom"
import {
  Apple,
  BookOpen,
  Bookmark,
  Check,
  Clapperboard,
  Dumbbell,
  FileUp,
  FolderTree,
  ShieldCheck,
  Sparkles,
  X,
} from "lucide-react"
import {
  buildCanonicalStoragePath,
  defaultEntitlementForCategory,
  defaultKindForCategory,
  formatBytesLabel,
  type DemoContentAsset,
} from "@/features/content/demo"
import type { SaveContentAssetInput } from "@/features/content/service"
import { DEMO_NUTRITION } from "@/features/nutrition/demo"
import { subscriberDisplayName, type DemoSubscriber } from "@/features/subscribers/demo"
import type { DemoPackage } from "@/features/subscriptions/demo"
import { DEMO_WORKOUTS } from "@/features/workouts/demo"
import { useLocale } from "@/hooks/useLocale"
import { cn } from "@/lib/utils"
import type {
  ContentCategory,
  ContentVisibility,
  VideoProviderId,
} from "@/types/content"
import type { PackageEntitlementKey } from "@/types/subscription"

type ContentAssetFormDialogProps = {
  open: boolean
  initialAsset?: DemoContentAsset | null
  defaultCategory?: ContentCategory
  packages: DemoPackage[]
  subscribers: DemoSubscriber[]
  busy?: boolean
  adminName?: string
  onClose: () => void
  onSave: (input: SaveContentAssetInput) => Promise<unknown>
}

const CATEGORIES: Array<{
  id: ContentCategory
  ar: string
  en: string
  icon: typeof Clapperboard
}> = [
  {
    id: "exerciseVideo",
    ar: "فيديو تمرين تعليمي",
    en: "Exercise video",
    icon: Clapperboard,
  },
  {
    id: "workoutPdf",
    ar: "ملف برنامج تمارين (PDF)",
    en: "Workout PDF",
    icon: Dumbbell,
  },
  {
    id: "nutritionPdf",
    ar: "ملف برنامج تغذية (PDF)",
    en: "Nutrition PDF",
    icon: Apple,
  },
  {
    id: "education",
    ar: "مستند تعليمي",
    en: "Educational doc",
    icon: BookOpen,
  },
  {
    id: "reference",
    ar: "مرجع وموارد تدريبية",
    en: "Reference material",
    icon: Bookmark,
  },
]

const VIDEO_PROVIDERS: Array<{ id: VideoProviderId; label: string }> = [
  { id: "bunny", label: "Bunny Stream CDN" },
  { id: "cloudflare", label: "Cloudflare Stream" },
  { id: "mux", label: "Mux Video" },
  { id: "youtube", label: "YouTube (Unlisted / Embed)" },
  { id: "vimeo", label: "Vimeo Pro" },
  { id: "direct", label: "Direct MP4 / HLS URL" },
  { id: "stub", label: "Internal / Local Preview" },
]

const ENTITLEMENT_OPTIONS: Array<{
  id: PackageEntitlementKey
  ar: string
  en: string
}> = [
  { id: "exerciseVideos", ar: "مكتبة الفيديوهات التعليمية", en: "Exercise video library" },
  { id: "workoutProgram", ar: "برامج التمارين", en: "Workout programs" },
  { id: "nutritionProgram", ar: "برامج التغذية", en: "Nutrition programs" },
  { id: "pdfDocuments", ar: "ملفات PDF والمستندات", en: "PDFs & educational docs" },
  { id: "progressTracking", ar: "تتبع التقدم", en: "Progress tracking" },
]

export function ContentAssetFormDialog({
  open,
  initialAsset = null,
  defaultCategory = "exerciseVideo",
  packages,
  subscribers,
  busy = false,
  adminName = "Head Coach",
  onClose,
  onSave,
}: ContentAssetFormDialogProps) {
  const { locale, isRtl } = useLocale()
  const isAr = locale === "ar"
  const isEdit = Boolean(initialAsset)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const [category, setCategory] = useState<ContentCategory>(defaultCategory)
  const [titleAr, setTitleAr] = useState("")
  const [titleEn, setTitleEn] = useState("")
  const [descAr, setDescAr] = useState("")
  const [descEn, setDescEn] = useState("")
  const [file, setFile] = useState<File | null>(null)
  const [fileName, setFileName] = useState("")
  const [sizeLabel, setSizeLabel] = useState("")
  const [pageCount, setPageCount] = useState("")
  const [durationSeconds, setDurationSeconds] = useState("")
  const [videoProvider, setVideoProvider] = useState<VideoProviderId>("bunny")
  const [videoAssetId, setVideoAssetId] = useState("")
  const [streamOrFileUrl, setStreamOrFileUrl] = useState("")
  const [customPath, setCustomPath] = useState("")
  const [tagsText, setTagsText] = useState("")
  const [exerciseNamesText, setExerciseNamesText] = useState("")
  const [visibility, setVisibility] = useState<ContentVisibility>("package")
  const [requiredEntitlement, setRequiredEntitlement] =
    useState<PackageEntitlementKey>("exerciseVideos")
  const [packageIds, setPackageIds] = useState<string[]>([])
  const [subscriberIds, setSubscriberIds] = useState<string[]>([])
  const [programIds, setProgramIds] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)

  const allPrograms = useMemo(
    () => [
      ...DEMO_WORKOUTS.map((p) => ({
        id: p.id,
        title: p.title,
        domain: "workout" as const,
        status: p.status,
      })),
      ...DEMO_NUTRITION.map((p) => ({
        id: p.id,
        title: p.title,
        domain: "nutrition" as const,
        status: p.status,
      })),
    ],
    [],
  )

  useEffect(() => {
    if (!open) return
    setError(null)
    setFile(null)

    if (initialAsset) {
      setCategory(initialAsset.category)
      setTitleAr(initialAsset.title.ar)
      setTitleEn(initialAsset.title.en)
      setDescAr(initialAsset.description.ar)
      setDescEn(initialAsset.description.en)
      setFileName(initialAsset.fileName ?? "")
      setSizeLabel(initialAsset.sizeLabel ?? "")
      setPageCount(
        initialAsset.pageCount != null ? String(initialAsset.pageCount) : "",
      )
      setDurationSeconds(
        initialAsset.durationSeconds != null
          ? String(initialAsset.durationSeconds)
          : "",
      )
      setVideoProvider(initialAsset.videoProvider ?? "bunny")
      setVideoAssetId(initialAsset.videoAssetId ?? "")
      setStreamOrFileUrl(
        initialAsset.streamUrl ??
          (initialAsset.fileUrl && !initialAsset.fileUrl.startsWith("data:")
            ? initialAsset.fileUrl
            : "") ??
          "",
      )
      setCustomPath(initialAsset.storagePath ?? "")
      setTagsText(initialAsset.tags.join(", "))
      setExerciseNamesText((initialAsset.exerciseNames ?? []).join(", "))
      setVisibility(initialAsset.visibility)
      setRequiredEntitlement(
        initialAsset.requiredEntitlement ??
          defaultEntitlementForCategory(initialAsset.category),
      )
      setPackageIds(initialAsset.packageIds ?? [])
      setSubscriberIds(initialAsset.subscriberIds ?? [])
      setProgramIds(initialAsset.programIds ?? [])
    } else {
      const cat = defaultCategory
      setCategory(cat)
      setTitleAr("")
      setTitleEn("")
      setDescAr("")
      setDescEn("")
      setFileName("")
      setSizeLabel(cat === "exerciseVideo" ? "140 MB" : "1.5 MB")
      setPageCount(cat === "exerciseVideo" ? "" : "8")
      setDurationSeconds(cat === "exerciseVideo" ? "45" : "")
      setVideoProvider("bunny")
      setVideoAssetId("")
      setStreamOrFileUrl("")
      setCustomPath("")
      setTagsText("")
      setExerciseNamesText("")
      setVisibility(cat === "reference" ? "library" : "package")
      setRequiredEntitlement(defaultEntitlementForCategory(cat))
      setPackageIds(
        cat === "reference"
          ? []
          : packages.filter((p) => p.isActive).map((p) => p.id),
      )
      setSubscriberIds([])
      setProgramIds([])
    }
  }, [open, initialAsset, defaultCategory, packages])

  const kind = defaultKindForCategory(category)

  const previewStoragePath = useMemo(() => {
    if (customPath.trim()) return customPath.trim()
    const draftId =
      initialAsset?.id ||
      (titleEn.trim() || titleAr.trim() || fileName.trim() || "new-asset")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, 24) ||
      "asset"
    return buildCanonicalStoragePath({
      id: draftId,
      category,
      fileName:
        file?.name ||
        fileName.trim() ||
        (kind === "video" ? `${draftId}.mp4` : `${draftId}.pdf`),
      videoProvider,
      videoAssetId: videoAssetId.trim() || undefined,
    })
  }, [
    customPath,
    initialAsset?.id,
    titleEn,
    titleAr,
    fileName,
    file,
    category,
    kind,
    videoProvider,
    videoAssetId,
  ])

  if (!open || typeof document === "undefined") return null

  function handleCategorySwitch(nextCat: ContentCategory) {
    setCategory(nextCat)
    if (!initialAsset) {
      setRequiredEntitlement(defaultEntitlementForCategory(nextCat))
      setCustomPath("")
      if (nextCat === "exerciseVideo") {
        setSizeLabel("140 MB")
        setDurationSeconds("45")
      } else {
        setSizeLabel("1.5 MB")
        setPageCount("8")
      }
    }
  }

  function handleFileSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const picked = e.target.files?.[0]
    if (!picked) return
    setFile(picked)
    setFileName(picked.name)
    setSizeLabel(formatBytesLabel(picked.size))
    setCustomPath("")

    if (!titleEn.trim() && !titleAr.trim()) {
      const baseName = picked.name
        .replace(/\.[^.]+$/, "")
        .replace(/[_-]+/g, " ")
      setTitleEn(baseName)
      setTitleAr(baseName)
    }

    // Auto-detect video duration if a local video file is picked
    if (picked.type.startsWith("video/")) {
      const tempUrl = URL.createObjectURL(picked)
      const videoEl = document.createElement("video")
      videoEl.preload = "metadata"
      videoEl.onloadedmetadata = () => {
        if (Number.isFinite(videoEl.duration) && videoEl.duration > 0) {
          setDurationSeconds(String(Math.round(videoEl.duration)))
        }
        URL.revokeObjectURL(tempUrl)
      }
      videoEl.onerror = () => URL.revokeObjectURL(tempUrl)
      videoEl.src = tempUrl
    }
  }

  function toggleItem(list: string[], id: string, setter: (v: string[]) => void) {
    setter(list.includes(id) ? list.filter((x) => x !== id) : [...list, id])
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    const cleanAr = titleAr.trim() || titleEn.trim()
    const cleanEn = titleEn.trim() || titleAr.trim()
    if (!cleanAr && !cleanEn) {
      setError(
        isAr
          ? "يرجى إدخال عنوان المحتوى بالعربية أو الإنجليزية."
          : "Please enter the content title in Arabic or English.",
      )
      return
    }

    const parsedPages = Number(pageCount)
    const parsedDuration = Number(durationSeconds)
    const tags = tagsText
      .split(/[,،]/)
      .map((s) => s.trim())
      .filter(Boolean)
    const exercises = exerciseNamesText
      .split(/[,،]/)
      .map((s) => s.trim())
      .filter(Boolean)

    await onSave({
      id: initialAsset?.id,
      category,
      title: {
        ar: cleanAr,
        en: cleanEn,
      },
      description: {
        ar: descAr.trim() || descEn.trim(),
        en: descEn.trim() || descAr.trim(),
      },
      file,
      fileName:
        file?.name ||
        fileName.trim() ||
        (kind === "video" ? "Instructional_Video.mp4" : "Document.pdf"),
      sizeBytes: file?.size ?? initialAsset?.sizeBytes,
      sizeLabel: sizeLabel.trim() || (kind === "video" ? "140 MB" : "1.5 MB"),
      pageCount:
        kind !== "video" && Number.isFinite(parsedPages) && parsedPages > 0
          ? parsedPages
          : null,
      durationSeconds:
        kind === "video" && Number.isFinite(parsedDuration) && parsedDuration > 0
          ? parsedDuration
          : null,
      storagePath: previewStoragePath,
      fileUrl: kind !== "video" ? streamOrFileUrl.trim() || undefined : undefined,
      streamUrl: kind === "video" ? streamOrFileUrl.trim() || undefined : undefined,
      videoProvider: kind === "video" ? videoProvider : undefined,
      videoAssetId:
        kind === "video" ? videoAssetId.trim() || undefined : undefined,
      tags,
      exerciseNames: kind === "video" ? exercises : [],
      visibility,
      requiredEntitlement,
      packageIds,
      subscriberIds,
      programIds,
      uploadedBy: adminName,
    })
  }

  return createPortal(
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center bg-black/55 p-3 backdrop-blur-[2px] sm:p-5"
      onClick={() => {
        if (!busy) onClose()
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        dir={isRtl ? "rtl" : "ltr"}
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-[28px] bg-white shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-black/8 px-6 py-4 sm:px-7">
          <div className="flex items-center gap-3">
            <span className="inline-flex size-10 items-center justify-center rounded-2xl bg-[var(--gym-ink,#111111)] text-[var(--gym-lime,#fb5001)]">
              <FileUp className="size-5" strokeWidth={2} />
            </span>
            <div>
              <h2 className="font-heading text-[18px] font-extrabold text-[var(--gym-ink,#111111)]">
                {isEdit
                  ? isAr
                    ? "تحديث بيانات وملف المحتوى"
                    : "Update content asset"
                  : isAr
                    ? "رفع وإضافة محتوى رقمي جديد"
                    : "Upload & register digital content"}
              </h2>
              <p className="text-[12px] font-medium text-[#8c8c8c]">
                {isAr
                  ? "يدعم العربية والإنجليزية، المسارات الذكية، وربط الباقات والبرامج والمشتركين"
                  : "Bilingual AR/EN metadata, canonical storage path, and entitlement rules"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            className="inline-flex size-9 items-center justify-center rounded-full bg-[#F4F4F4] text-[#6B7280] transition hover:bg-black/10"
          >
            <X className="size-4" strokeWidth={2} />
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          className="no-scrollbar flex-1 space-y-5 overflow-y-auto px-6 py-5 sm:px-7"
        >
          {error ? (
            <div className="rounded-2xl bg-[#FFE8E4] px-4 py-3 text-[13px] font-semibold text-[#C44536]">
              {error}
            </div>
          ) : null}

          {/* Content Category Selector */}
          <div>
            <p className="mb-2 text-[12px] font-bold text-[#6B7280]">
              {isAr ? "تصنيف المحتوى الرقمي *" : "Content category *"}
            </p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
              {CATEGORIES.map((cat) => {
                const Icon = cat.icon
                const active = category === cat.id
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => handleCategorySwitch(cat.id)}
                    className={cn(
                      "flex flex-col items-start gap-1.5 rounded-2xl border p-3 text-start transition",
                      active
                        ? "border-[var(--gym-ink,#111111)] bg-[var(--gym-ink,#111111)] text-white"
                        : "border-black/8 bg-[#F4F4F4] text-[var(--gym-ink,#111111)] hover:bg-black/5",
                    )}
                  >
                    <Icon
                      className={cn(
                        "size-4",
                        active
                          ? "text-[var(--gym-lime,#fb5001)]"
                          : "text-[#6B7280]",
                      )}
                      strokeWidth={2}
                    />
                    <span className="text-[12px] font-bold leading-snug">
                      {cat[locale]}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Bilingual Titles */}
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="flex flex-col gap-1.5">
              <span className="text-[12px] font-bold text-[#6B7280]">
                {isAr ? "عنوان المحتوى (عربي) *" : "Title (Arabic) *"}
              </span>
              <input
                dir="rtl"
                value={titleAr}
                onChange={(e) => setTitleAr(e.target.value)}
                placeholder="مثال: ضغط بنش بالبار / دليل تغذية رمضان"
                className="h-11 rounded-2xl bg-[#F4F4F4] px-4 text-[14px] font-medium text-[var(--gym-ink,#111111)] outline-none [font-family:var(--font-arabic)]"
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-[12px] font-bold text-[#6B7280]">
                {isAr ? "عنوان المحتوى (إنجليزي) *" : "Title (English) *"}
              </span>
              <input
                dir="ltr"
                value={titleEn}
                onChange={(e) => setTitleEn(e.target.value)}
                placeholder="e.g. Barbell bench press / Ramadan nutrition guide"
                className="h-11 rounded-2xl bg-[#F4F4F4] px-4 text-[14px] font-medium text-[var(--gym-ink,#111111)] outline-none"
              />
            </label>
          </div>

          {/* Bilingual Descriptions */}
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="flex flex-col gap-1.5">
              <span className="text-[12px] font-bold text-[#6B7280]">
                {isAr ? "الوصف والتعليمات (عربي)" : "Description (Arabic)"}
              </span>
              <textarea
                rows={2}
                dir="rtl"
                value={descAr}
                onChange={(e) => setDescAr(e.target.value)}
                placeholder="شرح مختصر للمحتوى وطريقة الاستفادة منه..."
                className="rounded-2xl bg-[#F4F4F4] p-3 text-[13px] font-medium text-[var(--gym-ink,#111111)] outline-none [font-family:var(--font-arabic)]"
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-[12px] font-bold text-[#6B7280]">
                {isAr ? "الوصف والتعليمات (إنجليزي)" : "Description (English)"}
              </span>
              <textarea
                rows={2}
                dir="ltr"
                value={descEn}
                onChange={(e) => setDescEn(e.target.value)}
                placeholder="Concise coaching notes or instructions for this resource..."
                className="rounded-2xl bg-[#F4F4F4] p-3 text-[13px] font-medium text-[var(--gym-ink,#111111)] outline-none"
              />
            </label>
          </div>

          {/* File Upload & Canonical Storage Architecture Box */}
          <div className="rounded-2xl border border-black/8 bg-[#FAFAFA] p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <FolderTree className="size-4 text-[var(--gym-lime,#fb5001)]" />
                <span className="text-[12px] font-extrabold uppercase tracking-[0.06em] text-[var(--gym-ink,#111111)]">
                  {kind === "video"
                    ? isAr
                      ? "بنية بث الفيديو والمسار الذكي"
                      : "Video streaming & smart storage path"
                    : isAr
                      ? "رفع ملف PDF / المستند والمسار الذكي"
                      : "PDF / Document upload & smart storage path"}
                </span>
              </div>
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700">
                <Sparkles className="size-3" />
                {isAr
                  ? "متوافق مع الخطة المجانية (Spark) وStorage"
                  : "Spark Free-Plan & Cloud Storage Ready"}
              </span>
            </div>

            {/* File Dropzone / Picker */}
            <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center">
              <input
                ref={fileInputRef}
                type="file"
                accept={
                  kind === "video"
                    ? "video/mp4,video/webm,video/quicktime"
                    : ".pdf,.doc,.docx,application/pdf"
                }
                onChange={handleFileSelected}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-xl bg-[var(--gym-ink,#111111)] px-4 text-[12px] font-bold text-white transition hover:opacity-90"
              >
                <FileUp className="size-3.5" />
                {file
                  ? isAr
                    ? "تغيير الملف المختار"
                    : "Change selected file"
                  : isAr
                    ? kind === "video"
                      ? "اختيار ملف فيديو من الجهاز"
                      : "اختيار ملف PDF / مستند من الجهاز"
                    : kind === "video"
                      ? "Choose local video file"
                      : "Choose local PDF / doc"}
              </button>
              <div className="min-w-0 flex-1 text-[12px] font-medium text-[#6B7280]">
                {file ? (
                  <span className="font-bold text-[var(--gym-ink,#111111)]">
                    {file.name} ({formatBytesLabel(file.size)})
                  </span>
                ) : (
                  <span>
                    {isAr
                      ? "أو أدخل اسم الملف / رابط البث المباشر أو CDN بالأسفل"
                      : "Or enter file name / external CDN or stream URL below"}
                  </span>
                )}
              </div>
            </div>

            {kind === "video" ? (
              <div className="mt-3 grid gap-3 sm:grid-cols-3">
                <label className="flex flex-col gap-1">
                  <span className="text-[11px] font-bold text-[#6B7280]">
                    {isAr ? "مزود البث (Streaming Provider)" : "Streaming provider"}
                  </span>
                  <select
                    value={videoProvider}
                    onChange={(e) =>
                      setVideoProvider(e.target.value as VideoProviderId)
                    }
                    className="h-10 rounded-xl bg-white px-3 text-[12px] font-bold text-[var(--gym-ink,#111111)] outline-none ring-1 ring-black/8"
                  >
                    {VIDEO_PROVIDERS.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="flex flex-col gap-1">
                  <span className="text-[11px] font-bold text-[#6B7280]">
                    {isAr ? "معرّف الفيديو (Asset ID)" : "Provider Asset ID"}
                  </span>
                  <input
                    dir="ltr"
                    value={videoAssetId}
                    onChange={(e) => setVideoAssetId(e.target.value)}
                    placeholder="e.g. bnny_squat_01"
                    className="h-10 rounded-xl bg-white px-3 text-[12px] font-medium text-[var(--gym-ink,#111111)] outline-none ring-1 ring-black/8"
                  />
                </label>
                <label className="flex flex-col gap-1">
                  <span className="text-[11px] font-bold text-[#6B7280]">
                    {isAr ? "المدة (بالثواني)" : "Duration (seconds)"}
                  </span>
                  <input
                    type="number"
                    min={1}
                    value={durationSeconds}
                    onChange={(e) => setDurationSeconds(e.target.value)}
                    placeholder="45"
                    className="h-10 rounded-xl bg-white px-3 text-[12px] font-medium text-[var(--gym-ink,#111111)] outline-none ring-1 ring-black/8"
                  />
                </label>
              </div>
            ) : (
              <div className="mt-3 grid gap-3 sm:grid-cols-3">
                <label className="flex flex-col gap-1">
                  <span className="text-[11px] font-bold text-[#6B7280]">
                    {isAr ? "اسم الملف" : "File name"}
                  </span>
                  <input
                    dir="ltr"
                    value={fileName}
                    onChange={(e) => setFileName(e.target.value)}
                    placeholder="Travel_Workouts_v2.pdf"
                    className="h-10 rounded-xl bg-white px-3 text-[12px] font-medium text-[var(--gym-ink,#111111)] outline-none ring-1 ring-black/8"
                  />
                </label>
                <label className="flex flex-col gap-1">
                  <span className="text-[11px] font-bold text-[#6B7280]">
                    {isAr ? "حجم الملف" : "File size label"}
                  </span>
                  <input
                    dir="ltr"
                    value={sizeLabel}
                    onChange={(e) => setSizeLabel(e.target.value)}
                    placeholder="2.4 MB"
                    className="h-10 rounded-xl bg-white px-3 text-[12px] font-medium text-[var(--gym-ink,#111111)] outline-none ring-1 ring-black/8"
                  />
                </label>
                <label className="flex flex-col gap-1">
                  <span className="text-[11px] font-bold text-[#6B7280]">
                    {isAr ? "عدد الصفحات" : "Page count"}
                  </span>
                  <input
                    type="number"
                    min={1}
                    value={pageCount}
                    onChange={(e) => setPageCount(e.target.value)}
                    placeholder="12"
                    className="h-10 rounded-xl bg-white px-3 text-[12px] font-medium text-[var(--gym-ink,#111111)] outline-none ring-1 ring-black/8"
                  />
                </label>
              </div>
            )}

            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <label className="flex flex-col gap-1">
                <span className="text-[11px] font-bold text-[#6B7280]">
                  {kind === "video"
                    ? isAr
                      ? "رابط البث المباشر / YouTube / Vimeo / MP4 (اختياري)"
                      : "Stream / Embed / MP4 URL (optional)"
                    : isAr
                      ? "رابط الملف الخارجي / Google Drive / CDN (اختياري)"
                      : "Direct PDF / Drive / CDN URL (optional)"}
                </span>
                <input
                  dir="ltr"
                  value={streamOrFileUrl}
                  onChange={(e) => setStreamOrFileUrl(e.target.value)}
                  placeholder={
                    kind === "video"
                      ? "https://iframe.mediadelivery.net/... or https://youtu.be/..."
                      : "https://.../document.pdf"
                  }
                  className="h-10 rounded-xl bg-white px-3 text-[12px] font-medium text-[var(--gym-ink,#111111)] outline-none ring-1 ring-black/8"
                />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-[11px] font-bold text-[#6B7280]">
                  {isAr
                    ? "المسار المنظم في التخزين (Storage Path)"
                    : "Structured Storage Path"}
                </span>
                <input
                  dir="ltr"
                  value={customPath}
                  onChange={(e) => setCustomPath(e.target.value)}
                  placeholder={previewStoragePath}
                  className="h-10 rounded-xl bg-white px-3 font-mono text-[11px] font-medium text-[var(--gym-ink,#111111)] outline-none ring-1 ring-black/8"
                />
              </label>
            </div>
            <p className="mt-2 font-mono text-[11px] text-[#6B7280]" dir="ltr">
              Path: <strong className="text-[var(--gym-ink,#111111)]">{previewStoragePath}</strong>
            </p>
          </div>

          {/* Tags & Exercise Names */}
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="flex flex-col gap-1.5">
              <span className="text-[12px] font-bold text-[#6B7280]">
                {isAr
                  ? "الوسوم والكلمات المفتاحية للبحث (مفصولة بفاصلة)"
                  : "Search tags (comma-separated, AR or EN)"}
              </span>
              <input
                value={tagsText}
                onChange={(e) => setTagsText(e.target.value)}
                placeholder={
                  isAr
                    ? "مثال: chest, barbell, صدر, تضخم"
                    : "e.g. chest, barbell, push, صدر"
                }
                className="h-11 rounded-2xl bg-[#F4F4F4] px-4 text-[13px] font-medium text-[var(--gym-ink,#111111)] outline-none"
              />
            </label>
            {kind === "video" ? (
              <label className="flex flex-col gap-1.5">
                <span className="text-[12px] font-bold text-[#6B7280]">
                  {isAr
                    ? "أسماء التمارين المرتبطة بهذا الفيديو"
                    : "Linked exercise names"}
                </span>
                <input
                  value={exerciseNamesText}
                  onChange={(e) => setExerciseNamesText(e.target.value)}
                  placeholder="e.g. Barbell bench press"
                  className="h-11 rounded-2xl bg-[#F4F4F4] px-4 text-[13px] font-medium text-[var(--gym-ink,#111111)] outline-none"
                />
              </label>
            ) : null}
          </div>

          {/* Access Control & Entitlements */}
          <div className="rounded-2xl border border-black/8 bg-[#FAFAFA] p-4">
            <div className="flex items-center gap-2">
              <ShieldCheck className="size-4 text-[var(--gym-ink,#111111)]" />
              <span className="text-[12px] font-extrabold uppercase tracking-[0.06em] text-[var(--gym-ink,#111111)]">
                {isAr
                  ? "صلاحيات الوصول وربط الباقات والبرامج والمشتركين"
                  : "Access control, entitlements & associations"}
              </span>
            </div>

            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <label className="flex flex-col gap-1">
                <span className="text-[11px] font-bold text-[#6B7280]">
                  {isAr ? "مستوى الظهور والوصول" : "Content visibility"}
                </span>
                <select
                  value={visibility}
                  onChange={(e) =>
                    setVisibility(e.target.value as ContentVisibility)
                  }
                  className="h-10 rounded-xl bg-white px-3 text-[12px] font-bold text-[var(--gym-ink,#111111)] outline-none ring-1 ring-black/8"
                >
                  <option value="package">
                    {isAr
                      ? "مرتبط بالباقات المحددة (Package-gated)"
                      : "Package-gated (Unlocked by package)"}
                  </option>
                  <option value="assigned">
                    {isAr
                      ? "مخصص لمشتركين / برامج محددة (Assigned)"
                      : "Assigned (Specific subscribers / programs)"}
                  </option>
                  <option value="library">
                    {isAr
                      ? "عام في المكتبة (يتطلب صلاحية الباقة)"
                      : "Library resource (Requires entitlement)"}
                  </option>
                </select>
              </label>

              <label className="flex flex-col gap-1">
                <span className="text-[11px] font-bold text-[#6B7280]">
                  {isAr
                    ? "صلاحية الباقة المطلوبة (Required Entitlement)"
                    : "Required package entitlement"}
                </span>
                <select
                  value={requiredEntitlement}
                  onChange={(e) =>
                    setRequiredEntitlement(
                      e.target.value as PackageEntitlementKey,
                    )
                  }
                  className="h-10 rounded-xl bg-white px-3 text-[12px] font-bold text-[var(--gym-ink,#111111)] outline-none ring-1 ring-black/8"
                >
                  {ENTITLEMENT_OPTIONS.map((opt) => (
                    <option key={opt.id} value={opt.id}>
                      {opt[locale]}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            {/* Packages association */}
            <div className="mt-4">
              <p className="text-[11px] font-bold text-[#6B7280]">
                {isAr
                  ? "الباقات المرتبطة بهذا المحتوى:"
                  : "Associated subscription packages:"}
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {packages.map((pkg) => {
                  const checked = packageIds.includes(pkg.id)
                  return (
                    <button
                      key={pkg.id}
                      type="button"
                      onClick={() =>
                        toggleItem(packageIds, pkg.id, setPackageIds)
                      }
                      className={cn(
                        "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[12px] font-bold transition",
                        checked
                          ? "border-[var(--gym-ink,#111111)] bg-[var(--gym-ink,#111111)] text-white"
                          : "border-black/10 bg-white text-[#6B7280] hover:bg-black/5",
                      )}
                    >
                      {checked ? <Check className="size-3" strokeWidth={3} /> : null}
                      {pkg.name[locale]}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Programs association */}
            <div className="mt-4">
              <p className="text-[11px] font-bold text-[#6B7280]">
                {isAr
                  ? "برامج التمارين والتغذية المرتبطة:"
                  : "Associated workout & nutrition programs:"}
              </p>
              <div className="mt-2 flex max-h-28 flex-wrap gap-1.5 overflow-y-auto">
                {allPrograms.map((prog) => {
                  const checked = programIds.includes(prog.id)
                  return (
                    <button
                      key={prog.id}
                      type="button"
                      onClick={() =>
                        toggleItem(programIds, prog.id, setProgramIds)
                      }
                      className={cn(
                        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-bold transition",
                        checked
                          ? "border-[var(--gym-lime,#fb5001)] bg-[var(--gym-lime,#fb5001)] text-white"
                          : "border-black/10 bg-white text-[#6B7280] hover:bg-black/5",
                      )}
                    >
                      {checked ? <Check className="size-2.5" strokeWidth={3} /> : null}
                      {prog.title[locale]}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Direct Subscribers association */}
            <div className="mt-4">
              <p className="text-[11px] font-bold text-[#6B7280]">
                {isAr
                  ? "تخصيص مباشر لمشتركين محددين (اختياري):"
                  : "Direct subscriber assignment (optional):"}
              </p>
              <div className="mt-2 flex max-h-28 flex-wrap gap-1.5 overflow-y-auto">
                {subscribers.map((sub) => {
                  const checked = subscriberIds.includes(sub.id)
                  return (
                    <button
                      key={sub.id}
                      type="button"
                      onClick={() =>
                        toggleItem(subscriberIds, sub.id, setSubscriberIds)
                      }
                      className={cn(
                        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-bold transition",
                        checked
                          ? "border-emerald-700 bg-emerald-700 text-white"
                          : "border-black/10 bg-white text-[#6B7280] hover:bg-black/5",
                      )}
                    >
                      {checked ? <Check className="size-2.5" strokeWidth={3} /> : null}
                      {subscriberDisplayName(sub, locale)}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2.5 border-t border-black/8 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={busy}
              className="inline-flex h-11 items-center justify-center rounded-full bg-[#F4F4F4] px-5 text-[13px] font-bold text-[var(--gym-ink,#111111)] transition hover:bg-black/10"
            >
              {isAr ? "إلغاء" : "Cancel"}
            </button>
            <button
              type="submit"
              disabled={busy}
              className="inline-flex h-11 items-center justify-center rounded-full bg-[var(--gym-ink,#111111)] px-6 text-[13px] font-bold text-white transition hover:opacity-95 disabled:opacity-50"
            >
              {busy
                ? isAr
                  ? "جارٍ الحفظ..."
                  : "Saving..."
                : isEdit
                  ? isAr
                    ? "حفظ التحديثات"
                    : "Save changes"
                  : isAr
                    ? "رفع وحفظ المحتوى"
                    : "Save content asset"}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body,
  )
}

