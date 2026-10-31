import { DEMO_NUTRITION } from "@/features/nutrition/demo"
import {
  DEMO_SUBSCRIBERS,
  getSubscriberById,
  type DemoSubscriber,
} from "@/features/subscribers/demo"
import {
  DEMO_PACKAGES,
  currentSubscriptionFor,
  getPackageById,
  type DemoPackage,
} from "@/features/subscriptions/demo"
import { normalizeEntitlements } from "@/features/subscriptions/entitlements"
import { DEMO_WORKOUTS } from "@/features/workouts/demo"
import type {
  ContentAsset,
  ContentCategory,
  ContentKind,
  VideoProviderId,
} from "@/types/content"
import type { PackageEntitlementKey } from "@/types/subscription"

export type DemoContentAsset = ContentAsset

export type ContentFilter = "all" | ContentCategory

const STORAGE_KEY_CONTENT = "trainer_admin_content_v2"

export function defaultKindForCategory(category: ContentCategory): ContentKind {
  if (category === "exerciseVideo") return "video"
  if (category === "workoutPdf" || category === "nutritionPdf") return "pdf"
  return "document"
}

export function defaultEntitlementForCategory(
  category: ContentCategory,
): PackageEntitlementKey {
  switch (category) {
    case "exerciseVideo":
      return "exerciseVideos"
    case "workoutPdf":
      return "workoutProgram"
    case "nutritionPdf":
      return "nutritionProgram"
    case "education":
    case "reference":
    default:
      return "pdfDocuments"
  }
}

export function sanitizeStorageSegment(raw: string): string {
  return (
    raw
      .trim()
      .replace(/\s+/g, "_")
      .replace(/[^a-zA-Z0-9._\-\u0600-\u06FF]/g, "")
      .slice(0, 80) || "asset"
  )
}

/**
 * Generates a deterministic, well-organized storage path for PDFs, documents, and videos:
 * - Workout PDFs:    content/pdfs/workouts/{yyyy}/{assetId}/{fileName}
 * - Nutrition PDFs:  content/pdfs/nutrition/{yyyy}/{assetId}/{fileName}
 * - Education docs:  content/docs/education/{yyyy}/{assetId}/{fileName}
 * - Reference docs:  content/docs/reference/{yyyy}/{assetId}/{fileName}
 * - Exercise videos: content/videos/{provider}/{yyyy}/{assetId}/{videoAssetId_or_fileName}
 */
export function buildCanonicalStoragePath(params: {
  id: string
  category: ContentCategory
  fileName?: string
  videoProvider?: VideoProviderId
  videoAssetId?: string
  createdAt?: string
}): string {
  const year = params.createdAt
    ? new Date(params.createdAt).getUTCFullYear() || 2026
    : new Date().getUTCFullYear()
  const safeId = sanitizeStorageSegment(params.id)

  if (params.category === "exerciseVideo") {
    const provider = params.videoProvider || "bunny"
    const leaf = sanitizeStorageSegment(
      params.fileName || params.videoAssetId || `${safeId}.mp4`,
    )
    return `content/videos/${provider}/${year}/${safeId}/${leaf}`
  }

  const defaultExt = ".pdf"
  const rawLeaf = params.fileName?.trim() || `${safeId}${defaultExt}`
  const safeLeaf = sanitizeStorageSegment(rawLeaf)

  switch (params.category) {
    case "workoutPdf":
      return `content/pdfs/workouts/${year}/${safeId}/${safeLeaf}`
    case "nutritionPdf":
      return `content/pdfs/nutrition/${year}/${safeId}/${safeLeaf}`
    case "education":
      return `content/docs/education/${year}/${safeId}/${safeLeaf}`
    case "reference":
    default:
      return `content/docs/reference/${year}/${safeId}/${safeLeaf}`
  }
}

export function formatBytesLabel(bytes?: number | null): string {
  if (!bytes || bytes <= 0) return "—"
  if (bytes < 1024) return `${bytes} B`
  const kb = bytes / 1024
  if (kb < 1024) return `${Math.round(kb)} KB`
  const mb = kb / 1024
  return `${mb.toFixed(1)} MB`
}

export function buildContentSearchTokens(asset: {
  id: string
  category: ContentCategory
  kind: ContentKind
  title: { en: string; ar: string }
  description: { en: string; ar: string }
  fileName?: string
  storagePath?: string
  videoProvider?: string
  videoAssetId?: string
  tags: string[]
  exerciseNames?: string[]
}): string[] {
  const rawParts = [
    asset.id,
    asset.category,
    asset.kind,
    asset.title.en,
    asset.title.ar,
    asset.description.en,
    asset.description.ar,
    asset.fileName ?? "",
    asset.storagePath ?? "",
    asset.videoProvider ?? "",
    asset.videoAssetId ?? "",
    ...asset.tags,
    ...(asset.exerciseNames ?? []),
  ]
  const tokenSet = new Set<string>()
  for (const part of rawParts) {
    const normalized = part.trim().toLowerCase()
    if (!normalized) continue
    tokenSet.add(normalized)
    for (const word of normalized.split(/[\s,/_\-.]+/)) {
      if (word.length >= 2) tokenSet.add(word)
    }
  }
  return Array.from(tokenSet)
}

const RAW_DEMO_CONTENT: Omit<ContentAsset, "searchTokens">[] = [
  {
    id: "vid-bench",
    category: "exerciseVideo",
    kind: "video",
    title: { en: "Barbell bench press", ar: "ضغط بنش بالبار" },
    description: {
      en: "Setup, bar path, and tempo for the bench press cue used in hypertrophy days.",
      ar: "الوضع ومسار البار والإيقاع لإشارة ضغط البنش في أيام التضخم.",
    },
    fileName: "Barbell_Bench_Press_4K.mp4",
    tags: ["chest", "barbell", "push", "صدر", "بنش"],
    visibility: "package",
    requiredEntitlement: "exerciseVideos",
    sizeLabel: "186 MB",
    durationSeconds: 48,
    videoProvider: "bunny",
    videoAssetId: "bnny_bench_01",
    storagePath:
      "content/videos/bunny/2026/vid-bench/Barbell_Bench_Press_4K.mp4",
    storageMode: "external_cdn",
    packageIds: ["pkg-transform", "pkg-elite"],
    subscriberIds: [],
    programIds: ["tpl-hypertrophy", "asg-alex"],
    exerciseNames: ["Barbell bench press"],
    createdAt: "2026-06-12T00:00:00.000Z",
    updatedAt: "2026-10-04T00:00:00.000Z",
  },
  {
    id: "vid-ohp",
    category: "exerciseVideo",
    kind: "video",
    title: { en: "Seated dumbbell press", ar: "ضغط دمبل جالس" },
    description: {
      en: "Overhead press from a seated position — brace, lock, and avoid flaring the ribs.",
      ar: "ضغط علوي من الجلوس — تثبيت الجذع دون فتح الأضلاع.",
    },
    fileName: "Seated_Dumbbell_Press.mp4",
    tags: ["shoulders", "dumbbell", "push", "أكتاف", "دمبل"],
    visibility: "package",
    requiredEntitlement: "exerciseVideos",
    sizeLabel: "142 MB",
    durationSeconds: 36,
    videoProvider: "bunny",
    videoAssetId: "bnny_ohp_01",
    storagePath: "content/videos/bunny/2026/vid-ohp/Seated_Dumbbell_Press.mp4",
    storageMode: "external_cdn",
    packageIds: ["pkg-transform", "pkg-elite"],
    subscriberIds: [],
    programIds: ["tpl-hypertrophy", "asg-alex"],
    exerciseNames: ["Seated dumbbell press"],
    createdAt: "2026-06-12T00:00:00.000Z",
    updatedAt: "2026-09-18T00:00:00.000Z",
  },
  {
    id: "vid-row",
    category: "exerciseVideo",
    kind: "video",
    title: { en: "Chest-supported row", ar: "تجديف بدعم الصدر" },
    description: {
      en: "Row with the chest on the pad so the lower back stays out of the lift.",
      ar: "تجديف مع دعم الصدر حتى لا يدخل أسفل الظهر في الرفع.",
    },
    fileName: "Chest_Supported_Row.mp4",
    tags: ["back", "row", "pull", "ظهر", "تجديف"],
    visibility: "package",
    requiredEntitlement: "exerciseVideos",
    sizeLabel: "168 MB",
    durationSeconds: 41,
    videoProvider: "bunny",
    videoAssetId: "bnny_row_01",
    storagePath: "content/videos/bunny/2026/vid-row/Chest_Supported_Row.mp4",
    storageMode: "external_cdn",
    packageIds: ["pkg-transform", "pkg-elite"],
    subscriberIds: [],
    programIds: ["tpl-hypertrophy", "asg-alex"],
    exerciseNames: ["Chest-supported row"],
    createdAt: "2026-07-01T00:00:00.000Z",
    updatedAt: "2026-09-22T00:00:00.000Z",
  },
  {
    id: "vid-face",
    category: "exerciseVideo",
    kind: "video",
    title: { en: "Face pull", ar: "سحب للوجه" },
    description: {
      en: "External rotation at the end of each rep. Used as a pull-day finisher.",
      ar: "دوران خارجي في نهاية كل تكرار. يُستخدم كختام ليوم السحب.",
    },
    fileName: "Cable_Face_Pull.mp4",
    tags: ["rear delt", "cable", "pull", "كتف خلفي"],
    visibility: "package",
    requiredEntitlement: "exerciseVideos",
    sizeLabel: "94 MB",
    durationSeconds: 29,
    videoProvider: "bunny",
    videoAssetId: "bnny_face_01",
    storagePath: "content/videos/bunny/2026/vid-face/Cable_Face_Pull.mp4",
    storageMode: "external_cdn",
    packageIds: ["pkg-elite"],
    subscriberIds: [],
    programIds: ["tpl-hypertrophy"],
    exerciseNames: ["Face pull"],
    createdAt: "2026-07-08T00:00:00.000Z",
    updatedAt: "2026-08-30T00:00:00.000Z",
  },
  {
    id: "vid-squat",
    category: "exerciseVideo",
    kind: "video",
    title: { en: "Back squat", ar: "سكوات خلفي" },
    description: {
      en: "Brace, sit between the hips, drive through mid-foot. Linked to hypertrophy legs.",
      ar: "تثبيت الجذع والهبوط بين الوركين والدفع من منتصف القدم.",
    },
    fileName: "Barbell_Back_Squat.mp4",
    tags: ["legs", "barbell", "squat", "أرجل", "سكوات"],
    visibility: "package",
    requiredEntitlement: "exerciseVideos",
    sizeLabel: "214 MB",
    durationSeconds: 52,
    videoProvider: "bunny",
    videoAssetId: "bnny_squat_01",
    storagePath: "content/videos/bunny/2026/vid-squat/Barbell_Back_Squat.mp4",
    storageMode: "external_cdn",
    packageIds: ["pkg-transform", "pkg-elite"],
    subscriberIds: [],
    programIds: ["tpl-hypertrophy", "tpl-starter", "asg-alex", "asg-sara"],
    exerciseNames: ["Back squat"],
    createdAt: "2026-05-20T00:00:00.000Z",
    updatedAt: "2026-10-11T00:00:00.000Z",
  },
  {
    id: "vid-rdl",
    category: "exerciseVideo",
    kind: "video",
    title: { en: "Romanian deadlift", ar: "ديدليفت روماني" },
    description: {
      en: "Reusable cue video. Ready to link on any posterior-chain or legs day.",
      ar: "فيديو تعليمي قابل لإعادة الاستخدام لتمارين السلسلة الخلفية والأرجل.",
    },
    fileName: "Romanian_Deadlift_Cue.mp4",
    tags: ["hamstring", "hinge", "barbell", "خلفيات"],
    visibility: "library",
    requiredEntitlement: "exerciseVideos",
    sizeLabel: "176 MB",
    durationSeconds: 44,
    videoProvider: "bunny",
    videoAssetId: "bnny_rdl_01",
    storagePath:
      "content/videos/bunny/2026/vid-rdl/Romanian_Deadlift_Cue.mp4",
    storageMode: "external_cdn",
    packageIds: [],
    subscriberIds: [],
    programIds: [],
    exerciseNames: ["Romanian deadlift"],
    createdAt: "2026-10-02T00:00:00.000Z",
    updatedAt: "2026-10-02T00:00:00.000Z",
  },
  {
    id: "pdf-travel",
    category: "workoutPdf",
    kind: "pdf",
    title: { en: "Travel workouts", ar: "تمارين السفر" },
    description: {
      en: "Hotel and bodyweight block used as a PDF program template and Omar’s archived copy.",
      ar: "بلوك وزن الجسم والفنادق المستخدم كقالب PDF ونسخة عمر المؤرشفة.",
    },
    fileName: "Travel_Workouts_v2.pdf",
    tags: ["travel", "bodyweight", "pdf", "سفر"],
    visibility: "assigned",
    requiredEntitlement: "workoutProgram",
    sizeLabel: "2.4 MB",
    pageCount: 12,
    storagePath:
      "content/pdfs/workouts/2026/pdf-travel/Travel_Workouts_v2.pdf",
    storageMode: "metadata_only",
    packageIds: ["pkg-transform", "pkg-elite"],
    subscriberIds: ["sub-omar"],
    programIds: ["tpl-pdf", "asg-omar"],
    createdAt: "2026-08-01T00:00:00.000Z",
    updatedAt: "2026-08-14T00:00:00.000Z",
  },
  {
    id: "pdf-home",
    category: "workoutPdf",
    kind: "pdf",
    title: { en: "Home dumbbell circuit", ar: "دائرة دمبل منزلية" },
    description: {
      en: "Reusable home session PDF. Drop onto a subscriber when travel or schedule changes.",
      ar: "ملف تمارين منزلية قابل لإعادة الاستخدام عند السفر أو ضيق الوقت.",
    },
    fileName: "Home_Dumbbell_Circuit.pdf",
    tags: ["home", "dumbbell", "pdf", "منزلي"],
    visibility: "library",
    requiredEntitlement: "workoutProgram",
    sizeLabel: "1.1 MB",
    pageCount: 6,
    storagePath:
      "content/pdfs/workouts/2026/pdf-home/Home_Dumbbell_Circuit.pdf",
    storageMode: "metadata_only",
    packageIds: [],
    subscriberIds: [],
    programIds: [],
    createdAt: "2026-09-09T00:00:00.000Z",
    updatedAt: "2026-09-09T00:00:00.000Z",
  },
  {
    id: "pdf-ramadan",
    category: "nutritionPdf",
    kind: "pdf",
    title: { en: "Ramadan nutrition guide", ar: "دليل تغذية رمضان" },
    description: {
      en: "Trainer-approved fasting meal notes. Template plus Omar’s previous assignment.",
      ar: "ملاحظات وجبات الصيام المعتمدة من المدرب. القالب ونسخة عمر السابقة.",
    },
    fileName: "Ramadan_Nutrition_v1.pdf",
    tags: ["ramadan", "fasting", "nutrition", "رمضان", "صيام"],
    visibility: "assigned",
    requiredEntitlement: "nutritionProgram",
    sizeLabel: "3.8 MB",
    pageCount: 18,
    storagePath:
      "content/pdfs/nutrition/2026/pdf-ramadan/Ramadan_Nutrition_v1.pdf",
    storageMode: "metadata_only",
    packageIds: ["pkg-elite"],
    subscriberIds: ["sub-omar"],
    programIds: ["ntpl-pdf", "nasg-omar"],
    createdAt: "2026-02-20T00:00:00.000Z",
    updatedAt: "2026-03-02T00:00:00.000Z",
  },
  {
    id: "pdf-grocery",
    category: "nutritionPdf",
    kind: "pdf",
    title: { en: "Grocery swap list", ar: "قائمة بدائل البقالة" },
    description: {
      en: "Food swaps the trainer approves when a listed item is missing. Reusable nutrition PDF.",
      ar: "بدائل غذائية يعتمدها المدرب عند غياب صنف. ملف تغذية قابل لإعادة الاستخدام.",
    },
    fileName: "Grocery_Swap_List.pdf",
    tags: ["grocery", "swaps", "nutrition", "بدائل"],
    visibility: "package",
    requiredEntitlement: "nutritionProgram",
    sizeLabel: "860 KB",
    pageCount: 4,
    storagePath:
      "content/pdfs/nutrition/2026/pdf-grocery/Grocery_Swap_List.pdf",
    storageMode: "metadata_only",
    packageIds: ["pkg-transform", "pkg-elite"],
    subscriberIds: [],
    programIds: [],
    createdAt: "2026-08-22T00:00:00.000Z",
    updatedAt: "2026-08-22T00:00:00.000Z",
  },
  {
    id: "doc-warmup",
    category: "education",
    kind: "document",
    title: { en: "Warm-up protocol", ar: "بروتوكول الإحماء" },
    description: {
      en: "Educational document covering general warm-up before any assigned session.",
      ar: "مستند تعليمي للإحماء العام قبل أي حصة معيّنة.",
    },
    fileName: "Warmup_Protocol.pdf",
    tags: ["warmup", "mobility", "education", "إحماء"],
    visibility: "assigned",
    requiredEntitlement: "pdfDocuments",
    sizeLabel: "720 KB",
    pageCount: 5,
    storagePath: "content/docs/education/2026/doc-warmup/Warmup_Protocol.pdf",
    storageMode: "metadata_only",
    packageIds: ["pkg-transform", "pkg-elite"],
    subscriberIds: ["sub-sara", "sub-alex"],
    programIds: [],
    createdAt: "2026-04-15T00:00:00.000Z",
    updatedAt: "2026-07-03T00:00:00.000Z",
  },
  {
    id: "doc-cues",
    category: "education",
    kind: "document",
    title: { en: "Squat cue sheet", ar: "ورقة إشارات السكوات" },
    description: {
      en: "Short coaching cues subscribers can re-read next to the squat video.",
      ar: "إشارات تدريب مختصرة يمكن للمشترك مراجعتها بجانب فيديو السكوات.",
    },
    fileName: "Cue_Sheet_Squat.pdf",
    tags: ["cues", "squat", "education", "سكوات"],
    visibility: "package",
    requiredEntitlement: "pdfDocuments",
    sizeLabel: "410 KB",
    pageCount: 2,
    storagePath: "content/docs/education/2026/doc-cues/Cue_Sheet_Squat.pdf",
    storageMode: "metadata_only",
    packageIds: ["pkg-elite"],
    subscriberIds: [],
    programIds: [],
    createdAt: "2026-05-20T00:00:00.000Z",
    updatedAt: "2026-05-20T00:00:00.000Z",
  },
  {
    id: "ref-equip",
    category: "reference",
    kind: "document",
    title: { en: "Studio equipment list", ar: "قائمة معدات الاستوديو" },
    description: {
      en: "Internal reference of what is available on the gym floor. Staff-facing.",
      ar: "مرجع داخلي لمعدات صالة التدريب. مخصص للفريق.",
    },
    fileName: "Studio_Equipment.pdf",
    tags: ["equipment", "studio", "reference", "معدات"],
    visibility: "library",
    requiredEntitlement: "pdfDocuments",
    sizeLabel: "540 KB",
    pageCount: 3,
    storagePath: "content/docs/reference/2026/ref-equip/Studio_Equipment.pdf",
    storageMode: "metadata_only",
    packageIds: [],
    subscriberIds: [],
    programIds: [],
    createdAt: "2026-03-11T00:00:00.000Z",
    updatedAt: "2026-09-01T00:00:00.000Z",
  },
  {
    id: "ref-usage",
    category: "reference",
    kind: "document",
    title: { en: "Content usage notes", ar: "ملاحظات استخدام المحتوى" },
    description: {
      en: "How staff may share files. Reminds that URLs stay signed and printing is off for subscribers.",
      ar: "كيف يشارك الفريق الملفات. التذكير بأن الروابط مؤقتة والطباعة غير متاحة للمشتركين.",
    },
    fileName: "Content_Usage_Notes.pdf",
    tags: ["policy", "ip", "reference", "سياسة"],
    visibility: "library",
    requiredEntitlement: "pdfDocuments",
    sizeLabel: "280 KB",
    pageCount: 3,
    storagePath:
      "content/docs/reference/2026/ref-usage/Content_Usage_Notes.pdf",
    storageMode: "metadata_only",
    packageIds: [],
    subscriberIds: [],
    programIds: [],
    createdAt: "2026-01-08T00:00:00.000Z",
    updatedAt: "2026-06-16T00:00:00.000Z",
  },
]

export const INITIAL_DEMO_CONTENT: DemoContentAsset[] = RAW_DEMO_CONTENT.map(
  (item) => ({
    ...item,
    searchTokens: buildContentSearchTokens(item),
  }),
)

function loadInitialContent(): DemoContentAsset[] {
  if (typeof window === "undefined") return [...INITIAL_DEMO_CONTENT]
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY_CONTENT)
    if (!raw) return [...INITIAL_DEMO_CONTENT]
    const parsed = JSON.parse(raw) as DemoContentAsset[]
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed.map((item) => ({
        ...item,
        programIds: item.programIds ?? [],
        packageIds: item.packageIds ?? [],
        subscriberIds: item.subscriberIds ?? [],
        requiredEntitlement:
          item.requiredEntitlement ?? defaultEntitlementForCategory(item.category),
        storagePath:
          item.storagePath ||
          buildCanonicalStoragePath({
            id: item.id,
            category: item.category,
            fileName: item.fileName,
            videoProvider: item.videoProvider,
            videoAssetId: item.videoAssetId,
            createdAt: item.createdAt,
          }),
        searchTokens: item.searchTokens ?? buildContentSearchTokens(item),
      }))
    }
  } catch {
    // ignore storage errors
  }
  return [...INITIAL_DEMO_CONTENT]
}

export let DEMO_CONTENT: DemoContentAsset[] = loadInitialContent()

export function getContentSnapshot(): DemoContentAsset[] {
  return DEMO_CONTENT
}

export function setContentSnapshot(next: DemoContentAsset[]): void {
  DEMO_CONTENT = next
  if (typeof window !== "undefined") {
    try {
      // Avoid quota issues if any item has a large inline dataUrl
      const safeForStorage = next.map((item) => {
        if (item.fileUrl && item.fileUrl.startsWith("data:") && item.fileUrl.length > 250_000) {
          return { ...item, fileUrl: undefined }
        }
        return item
      })
      window.localStorage.setItem(
        STORAGE_KEY_CONTENT,
        JSON.stringify(safeForStorage),
      )
    } catch {
      // ignore storage quota errors
    }
  }
}

export function getContentById(id: string): DemoContentAsset | undefined {
  return DEMO_CONTENT.find((item) => item.id === id)
}

export type LinkedProgram = {
  id: string
  title: { en: string; ar: string }
  domain: "workout" | "nutrition"
  status: "template" | "active" | "archived"
  subscriberId?: string
}

export type ContentLinks = {
  programs: LinkedProgram[]
  exercises: string[]
  subscribers: DemoSubscriber[]
  packages: DemoPackage[]
}

export function getContentLinks(
  asset: DemoContentAsset,
  allSubscribers: DemoSubscriber[] = DEMO_SUBSCRIBERS,
  allPackages: DemoPackage[] = DEMO_PACKAGES,
): ContentLinks {
  const programs: LinkedProgram[] = []
  const exercises: string[] = [...(asset.exerciseNames ?? [])]
  const seenPrograms = new Set<string>()
  const subscriberIds = new Set(asset.subscriberIds ?? [])
  const explicitProgramIds = new Set(asset.programIds ?? [])

  for (const program of DEMO_WORKOUTS) {
    const matchedExercises = program.days
      .flatMap((day) => day.exercises)
      .filter((ex) => ex.videoContentId === asset.id)

    for (const ex of matchedExercises) {
      const exName = typeof ex.name === "string" ? ex.name : ex.name.en || ex.name.ar
      if (!exercises.includes(exName)) exercises.push(exName)
    }

    const matchesVideo = matchedExercises.length > 0
    const matchesPdf =
      Boolean(asset.fileName) && program.pdfName?.en === asset.fileName
    const matchesExplicit = explicitProgramIds.has(program.id)

    if ((matchesVideo || matchesPdf || matchesExplicit) && !seenPrograms.has(program.id)) {
      seenPrograms.add(program.id)
      programs.push({
        id: program.id,
        title: program.title,
        domain: "workout",
        status: program.status,
        subscriberId: program.subscriberId,
      })
      if (program.subscriberId) subscriberIds.add(program.subscriberId)
    }
  }

  for (const program of DEMO_NUTRITION) {
    const matchesPdf =
      Boolean(asset.fileName) && program.pdfName?.en === asset.fileName
    const matchesExplicit = explicitProgramIds.has(program.id)

    if ((matchesPdf || matchesExplicit) && !seenPrograms.has(program.id)) {
      seenPrograms.add(program.id)
      programs.push({
        id: program.id,
        title: program.title,
        domain: "nutrition",
        status: program.status,
        subscriberId: program.subscriberId,
      })
      if (program.subscriberId) subscriberIds.add(program.subscriberId)
    }
  }

  const subMap = new Map(allSubscribers.map((s) => [s.id, s]))
  const subscribers = [...subscriberIds]
    .map((id) => subMap.get(id) ?? getSubscriberById(id))
    .filter((item): item is DemoSubscriber => Boolean(item))

  const pkgMap = new Map(allPackages.map((p) => [p.id, p]))
  const packages = (asset.packageIds ?? [])
    .map((id) => pkgMap.get(id) ?? getPackageById(id))
    .filter((item): item is DemoPackage => Boolean(item))

  return { programs, exercises, subscribers, packages }
}

export function isContentLinked(asset: DemoContentAsset): boolean {
  const links = getContentLinks(asset)
  return (
    links.programs.length > 0 ||
    links.subscribers.length > 0 ||
    links.packages.length > 0
  )
}

export function contentStats(assets: DemoContentAsset[] = DEMO_CONTENT) {
  return {
    videos: assets.filter((item) => item.category === "exerciseVideo").length,
    workoutPdfs: assets.filter((item) => item.category === "workoutPdf").length,
    nutritionPdfs: assets.filter((item) => item.category === "nutritionPdf").length,
    resources: assets.filter(
      (item) => item.category === "education" || item.category === "reference",
    ).length,
  }
}

export type ContentAccessCheckResult = {
  allowed: boolean
  reason: { en: string; ar: string }
}

/**
 * Enforces Content Library access rules based on:
 * 1. Subscriber account status (`active`)
 * 2. Active subscription & expiration date
 * 3. Subscription package entitlements (`requiredEntitlement`)
 * 4. Content visibility (`library` / `package` / `assigned`) and associations
 */
export function evaluateSubscriberContentAccess(
  asset: DemoContentAsset,
  subscriberId: string,
): ContentAccessCheckResult {
  const subscriber = getSubscriberById(subscriberId)
  if (!subscriber) {
    return {
      allowed: false,
      reason: {
        en: "Subscriber not found",
        ar: "المشترك غير موجود",
      },
    }
  }

  if (subscriber.status !== "active") {
    return {
      allowed: false,
      reason: {
        en: `Account is ${subscriber.status}`,
        ar: `حالة الحساب غير نشطة (${subscriber.status})`,
      },
    }
  }

  const sub = currentSubscriptionFor(subscriberId)
  if (!sub || sub.status !== "active") {
    return {
      allowed: false,
      reason: {
        en: "No active subscription",
        ar: "لا يوجد اشتراك نشط",
      },
    }
  }

  const pkg = getPackageById(sub.packageId)
  const entitlements = normalizeEntitlements(
    pkg?.entitlements ?? sub.entitlementsSnapshot,
  )
  const reqKey =
    asset.requiredEntitlement ?? defaultEntitlementForCategory(asset.category)

  if (!entitlements[reqKey]) {
    return {
      allowed: false,
      reason: {
        en: `Package lacks '${reqKey}' entitlement`,
        ar: `الباقة الحالية لا تتضمن صلاحية (${reqKey})`,
      },
    }
  }

  const links = getContentLinks(asset)
  const directlyAssigned =
    asset.subscriberIds.includes(subscriberId) ||
    links.subscribers.some((s) => s.id === subscriberId)
  const inPackage = asset.packageIds.includes(sub.packageId)

  if (directlyAssigned) {
    return {
      allowed: true,
      reason: {
        en: "Assigned directly or via active program",
        ar: "معيّن مباشرة للمشترك أو ضمن برنامجه التدريبي",
      },
    }
  }

  if (inPackage) {
    return {
      allowed: true,
      reason: {
        en: `Unlocked via ${pkg?.name.en ?? "package"}`,
        ar: `متاح ضمن باقة ${pkg?.name.ar ?? "المشترك"}`,
      },
    }
  }

  if (asset.visibility === "library" && asset.category !== "reference") {
    return {
      allowed: true,
      reason: {
        en: "General library resource with valid entitlement",
        ar: "متاح في المكتبة العامة مع توفر صلاحية الباقة",
      },
    }
  }

  return {
    allowed: false,
    reason: {
      en: "Staff-only or not assigned to subscriber's package/program",
      ar: "محتوى داخلي أو غير مخصص لباقة/برنامج هذا المشترك",
    },
  }
}
