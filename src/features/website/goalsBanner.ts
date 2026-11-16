import { doc, getDoc, setDoc } from "firebase/firestore"
import {
  deleteObject,
  getDownloadURL,
  ref,
  uploadBytesResumable,
} from "firebase/storage"
import {
  buildGoalsBannerImagePath,
  formatBytesLabel,
  GOALS_BANNER_UPLOAD_LIMITS,
  isGoalsBannerStoragePath,
} from "@/features/website/paths"
import { mirrorBilingual } from "@/features/website/service"
import { getDb } from "@/lib/firebase/firestore"
import { getFirebaseStorage } from "@/lib/firebase/storage"
import type { BilingualText } from "@/types/program"
import type {
  GoalsBannerContent,
  GoalsBannerTab,
  GoalsBannerTabId,
} from "@/types/website"

export const GOALS_BANNER_COLLECTION = "website_goals_banner"
export const GOALS_BANNER_DOC_ID = "config"
export const GOALS_BANNER_TABS_MAX = 4

export const GOALS_BANNER_TAB_IDS: GoalsBannerTabId[] = [
  "logging",
  "videos",
  "messaging",
  "metrics",
]

export const DEFAULT_GOALS_BANNER_COPY = {
  title: {
    en: "Everything you need to train smarter and stay consistent",
    ar: "كل ما تحتاجه للتدريب بذكاء والالتزام المستمر",
  },
  tabs: {
    logging: {
      tabLabel: { en: "Workout Logging", ar: "تسجيل التمارين" },
      title: {
        en: "Easy client workout logging",
        ar: "تسجيل تمرين سهل للعملاء",
      },
      description: {
        en: "Clients can log sessions fast, review past results, leave comments, and ask questions — so you always know how their training is going.",
        ar: "يسجّل عملاؤك جلساتهم بسرعة، ويراجعون النتائج السابقة، ويتركون تعليقاتهم أو أسئلتهم — فتبقى على اطلاع دائم بتقدمهم.",
      },
      cta: { en: "Get started", ar: "ابدأ الآن" },
      imageAlt: {
        en: "Workout logging dashboard with weekly program planner",
        ar: "لوحة تسجيل التمارين مع مخطط البرنامج الأسبوعي",
      },
    },
    videos: {
      tabLabel: { en: "Exercise Videos", ar: "فيديوهات التمارين" },
      title: {
        en: "Clear exercise video demos",
        ar: "عروض فيديو واضحة للتمارين",
      },
      description: {
        en: "Attach form videos to every movement so clients know exactly how to train. Update demos from your library anytime without rewriting the plan.",
        ar: "أضف فيديوهات الأداء لكل حركة ليعرف العميل كيف يتمرن بدقة. حدّث العروض من مكتبتك في أي وقت دون إعادة كتابة الخطة.",
      },
      cta: { en: "Get started", ar: "ابدأ الآن" },
      imageAlt: {
        en: "Program builder with exercise video preview",
        ar: "منشئ البرنامج مع معاينة فيديو التمرين",
      },
    },
    messaging: {
      tabLabel: { en: "Messaging", ar: "المراسلة" },
      title: {
        en: "Stay close with every client",
        ar: "ابقَ قريباً من كل عميل",
      },
      description: {
        en: "Chat one-on-one or in group channels, share updates, and keep accountability high without leaving the coaching workspace.",
        ar: "تواصل فردياً أو عبر قنوات جماعية، وشارك التحديثات، وحافظ على الالتزام دون مغادرة مساحة التدريب.",
      },
      cta: { en: "Get started", ar: "ابدأ الآن" },
      imageAlt: {
        en: "Coach messaging and client chat interface",
        ar: "واجهة مراسلة المدرب ومحادثة العملاء",
      },
    },
    metrics: {
      tabLabel: { en: "Metrics And Goals", ar: "المقاييس والأهداف" },
      title: {
        en: "Track metrics and goals",
        ar: "تتبع المقاييس والأهداف",
      },
      description: {
        en: "Follow strength progress, body metrics, and wearable data in one place — then adjust the plan based on real results.",
        ar: "تابع تطور القوة ومقاييس الجسم وبيانات الأجهزة في مكان واحد — ثم عدّل الخطة بناءً على نتائج حقيقية.",
      },
      cta: { en: "Get started", ar: "ابدأ الآن" },
      imageAlt: {
        en: "Metrics dashboard with progress charts and wearables",
        ar: "لوحة المقاييس مع رسوم التقدم والأجهزة القابلة للارتداء",
      },
    },
  },
} as const

function stripUndefined<T extends Record<string, unknown>>(obj: T): T {
  const out: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(obj)) {
    if (v !== undefined) out[k] = v
  }
  return out as T
}

function asString(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback
}

function normalizeBilingual(
  value: unknown,
  fallback: BilingualText = { en: "", ar: "" },
): BilingualText {
  if (!value || typeof value !== "object") return { ...fallback }
  const raw = value as Record<string, unknown>
  return {
    en: asString(raw.en, fallback.en),
    ar: asString(raw.ar, fallback.ar),
  }
}

function emptyTab(id: GoalsBannerTabId): GoalsBannerTab {
  const defaults = DEFAULT_GOALS_BANNER_COPY.tabs[id]
  return {
    id,
    tabLabel: { ...defaults.tabLabel },
    title: { ...defaults.title },
    description: { ...defaults.description },
    cta: { ...defaults.cta },
    imageAlt: { ...defaults.imageAlt },
    imageUrl: "",
    storagePath: "",
  }
}

function normalizeTab(
  id: GoalsBannerTabId,
  raw: Record<string, unknown> | null | undefined,
): GoalsBannerTab {
  const defaults = DEFAULT_GOALS_BANNER_COPY.tabs[id]
  return {
    id,
    tabLabel: normalizeBilingual(raw?.tabLabel, defaults.tabLabel),
    title: normalizeBilingual(raw?.title, defaults.title),
    description: normalizeBilingual(raw?.description, defaults.description),
    cta: normalizeBilingual(raw?.cta, defaults.cta),
    imageAlt: normalizeBilingual(raw?.imageAlt, defaults.imageAlt),
    imageUrl: asString(raw?.imageUrl),
    storagePath: asString(raw?.storagePath),
  }
}

export function normalizeGoalsBannerContent(
  raw: Record<string, unknown> | null | undefined,
): GoalsBannerContent {
  const tabsRaw = Array.isArray(raw?.tabs) ? raw.tabs : []
  const byId = new Map<string, Record<string, unknown>>()
  for (const entry of tabsRaw) {
    if (!entry || typeof entry !== "object") continue
    const row = entry as Record<string, unknown>
    const id = asString(row.id)
    if (GOALS_BANNER_TAB_IDS.includes(id as GoalsBannerTabId)) {
      byId.set(id, row)
    }
  }

  return {
    id: GOALS_BANNER_DOC_ID,
    title: normalizeBilingual(raw?.title, DEFAULT_GOALS_BANNER_COPY.title),
    tabs: GOALS_BANNER_TAB_IDS.map((id) =>
      normalizeTab(id, byId.get(id) ?? null),
    ),
    updatedAt: asString(raw?.updatedAt),
    updatedBy: asString(raw?.updatedBy) || undefined,
  }
}

export function createDefaultGoalsBannerContent(): GoalsBannerContent {
  return {
    id: GOALS_BANNER_DOC_ID,
    title: { ...DEFAULT_GOALS_BANNER_COPY.title },
    tabs: GOALS_BANNER_TAB_IDS.map((id) => emptyTab(id)),
    updatedAt: "",
    updatedBy: undefined,
  }
}

export async function fetchGoalsBannerContent(): Promise<GoalsBannerContent | null> {
  const snap = await getDoc(
    doc(getDb(), GOALS_BANNER_COLLECTION, GOALS_BANNER_DOC_ID),
  )
  if (!snap.exists()) return null
  return normalizeGoalsBannerContent(snap.data() as Record<string, unknown>)
}

async function uploadGoalsBannerImage(
  path: string,
  file: File,
  onProgress?: (percent: number) => void,
): Promise<string> {
  const storageRef = ref(getFirebaseStorage(), path)
  const task = uploadBytesResumable(storageRef, file, {
    contentType: file.type || "image/png",
    customMetadata: { uploadedAt: new Date().toISOString() },
  })

  await new Promise<void>((resolve, reject) => {
    task.on(
      "state_changed",
      (snap) => {
        if (!onProgress || snap.totalBytes <= 0) return
        onProgress(Math.round((snap.bytesTransferred / snap.totalBytes) * 100))
      },
      reject,
      () => resolve(),
    )
  })

  return getDownloadURL(task.snapshot.ref)
}

async function deleteStoragePath(path?: string | null): Promise<void> {
  if (!path || !isGoalsBannerStoragePath(path)) return
  try {
    await deleteObject(ref(getFirebaseStorage(), path))
  } catch {
    // already gone
  }
}

function requireBilingual(
  en: string,
  ar: string,
  label: string,
): BilingualText {
  const mirrored = mirrorBilingual(en, ar)
  if (!mirrored) throw new Error(`${label} is required`)
  return mirrored
}

async function readOrDefault(): Promise<GoalsBannerContent> {
  const existing = await fetchGoalsBannerContent()
  return existing ?? createDefaultGoalsBannerContent()
}

async function writeContent(
  content: GoalsBannerContent,
): Promise<GoalsBannerContent> {
  await setDoc(
    doc(getDb(), GOALS_BANNER_COLLECTION, GOALS_BANNER_DOC_ID),
    stripUndefined({ ...content, id: GOALS_BANNER_DOC_ID }),
  )
  return content
}

export type SaveGoalsBannerTitleInput = {
  title: BilingualText
  updatedBy?: string
}

export async function saveGoalsBannerTitle(
  input: SaveGoalsBannerTitleInput,
): Promise<GoalsBannerContent> {
  const current = await readOrDefault()
  const now = new Date().toISOString()
  return writeContent({
    ...current,
    title: requireBilingual(input.title.en, input.title.ar, "Section title"),
    updatedAt: now,
    updatedBy: input.updatedBy || current.updatedBy,
  })
}

export type SaveGoalsBannerTabInput = {
  tabId: GoalsBannerTabId
  tabLabel: BilingualText
  title: BilingualText
  description: BilingualText
  cta: BilingualText
  imageAlt: BilingualText
  file?: File | null
  /** When true and no new file, clears the uploaded mockup (falls back to static). */
  clearImage?: boolean
  updatedBy?: string
  onUploadProgress?: (percent: number) => void
}

export async function saveGoalsBannerTab(
  input: SaveGoalsBannerTabInput,
): Promise<GoalsBannerContent> {
  if (!GOALS_BANNER_TAB_IDS.includes(input.tabId)) {
    throw new Error("Invalid goals banner tab")
  }

  const current = await readOrDefault()
  const existing =
    current.tabs.find((tab) => tab.id === input.tabId) ?? emptyTab(input.tabId)
  const file = input.file ?? null

  if (file && file.size > GOALS_BANNER_UPLOAD_LIMITS.imageBytes) {
    throw new Error(
      `Image exceeds ${formatBytesLabel(GOALS_BANNER_UPLOAD_LIMITS.imageBytes)} limit`,
    )
  }
  if (file && !file.type.match(/^image\//)) {
    throw new Error("Only image files are allowed")
  }

  let imageUrl = existing.imageUrl
  let storagePath = existing.storagePath
  let previousPathToDelete: string | null = null

  if (file) {
    const nextPath = buildGoalsBannerImagePath({
      tabId: input.tabId,
      mimeType: file.type,
      fileName: `feature.${file.type.includes("png") ? "png" : file.type.includes("webp") ? "webp" : "jpg"}`,
    })
    if (
      existing.storagePath &&
      isGoalsBannerStoragePath(existing.storagePath) &&
      existing.storagePath !== nextPath
    ) {
      previousPathToDelete = existing.storagePath
    }
    imageUrl = await uploadGoalsBannerImage(
      nextPath,
      file,
      input.onUploadProgress,
    )
    storagePath = nextPath
  } else if (input.clearImage) {
    previousPathToDelete = isGoalsBannerStoragePath(existing.storagePath)
      ? existing.storagePath
      : null
    imageUrl = ""
    storagePath = ""
  }

  const nextTab: GoalsBannerTab = {
    id: input.tabId,
    tabLabel: requireBilingual(
      input.tabLabel.en,
      input.tabLabel.ar,
      "Category label",
    ),
    title: requireBilingual(input.title.en, input.title.ar, "Title"),
    description: requireBilingual(
      input.description.en,
      input.description.ar,
      "Description",
    ),
    cta: requireBilingual(input.cta.en, input.cta.ar, "Button label"),
    imageAlt: requireBilingual(
      input.imageAlt.en,
      input.imageAlt.ar,
      "Image alt",
    ),
    imageUrl,
    storagePath,
  }

  const now = new Date().toISOString()
  const tabs = current.tabs.map((tab) =>
    tab.id === input.tabId ? nextTab : tab,
  )
  // Guarantee all 4 slots exist even if the stored doc was partial.
  const ensured = GOALS_BANNER_TAB_IDS.map(
    (id) => tabs.find((tab) => tab.id === id) ?? emptyTab(id),
  )

  const saved = await writeContent({
    ...current,
    tabs: ensured,
    updatedAt: now,
    updatedBy: input.updatedBy || current.updatedBy,
  })

  if (previousPathToDelete) {
    await deleteStoragePath(previousPathToDelete)
  }

  return saved
}

export async function clearGoalsBannerTabImage(
  tabId: GoalsBannerTabId,
  updatedBy?: string,
): Promise<GoalsBannerContent> {
  const current = await readOrDefault()
  const existing =
    current.tabs.find((tab) => tab.id === tabId) ?? emptyTab(tabId)

  return saveGoalsBannerTab({
    tabId,
    tabLabel: existing.tabLabel,
    title: existing.title,
    description: existing.description,
    cta: existing.cta,
    imageAlt: existing.imageAlt,
    clearImage: true,
    updatedBy,
  })
}
