import { doc, getDoc, setDoc } from "firebase/firestore"
import {
  deleteObject,
  getDownloadURL,
  ref,
  uploadBytesResumable,
} from "firebase/storage"
import {
  ABOUT_MY_STORY_UPLOAD_LIMITS,
  buildAboutMyStoryImagePath,
  formatBytesLabel,
  isAboutMyStoryStoragePath,
  isRenderableImageSrc,
} from "@/features/website/paths"
import { mirrorBilingual } from "@/features/website/service"
import { getDb } from "@/lib/firebase/firestore"
import { allocateFirestoreId } from "@/lib/firebase/ids"
import { getFirebaseStorage } from "@/lib/firebase/storage"
import type { BilingualText } from "@/types/program"
import type {
  AboutMyStoryContent,
  AboutMyStoryPoint,
} from "@/types/website"

export const ABOUT_MY_STORY_COLLECTION = "website_about_my_story"
export const ABOUT_MY_STORY_DOC_ID = "config"
export const ABOUT_MY_STORY_POINTS_MAX = 5

export const DEFAULT_ABOUT_MY_STORY_COPY = {
  watermark: { en: "14+", ar: "+14" },
  imageAlt: {
    en: "Personal trainer coaching a client with dumbbells",
    ar: "مدرب شخصي يساعد متدربة على رفع الأثقال",
  },
  points: [
    {
      id: "p1",
      text: {
        en: "For more than 14 years I’ve coached beginners, athletes, and busy professionals who want real change—not another random workout they abandon in two weeks.",
        ar: "لأكثر من ١٤ عاماً درّبت المبتدئين والرياضيين والمحترفين المشغولين ممن يريدون تغييراً حقيقياً—لا تمريناً عشوائياً يتركونه بعد أسبوعين.",
      },
    },
    {
      id: "p2",
      text: {
        en: "I started as a trainer who loved the science of training. What kept me in this work is watching people discover what their body can do when the plan is clear, progressive, and personal.",
        ar: "بدأت كمدرب يعشق علم التدريب. وما أبقاني في هذا المجال هو رؤية الناس يكتشفون قدرات أجسامهم عندما تكون الخطة واضحة ومتدرجة وشخصية.",
      },
    },
    {
      id: "p3",
      text: {
        en: "Today I combine strength training, conditioning, and practical nutrition guidance so you know exactly what to do, why it works, and how to stay consistent.",
        ar: "اليوم أجمع بين تدريب القوة والتكييف وإرشاد تغذية عملي، لتعرف بالضبط ماذا تفعل، ولماذا ينجح، وكيف تبقى منتظماً.",
      },
    },
  ] satisfies AboutMyStoryPoint[],
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

function normalizePoints(value: unknown): AboutMyStoryPoint[] {
  if (!Array.isArray(value)) return []
  return value
    .map((item, index) => {
      if (!item || typeof item !== "object") return null
      const raw = item as Record<string, unknown>
      const id = asString(raw.id) || `point-${index}`
      const text = normalizeBilingual(raw.text)
      if (!text.en && !text.ar) return null
      return { id, text }
    })
    .filter((p): p is AboutMyStoryPoint => Boolean(p))
    .slice(0, ABOUT_MY_STORY_POINTS_MAX)
}

export function normalizeAboutMyStoryContent(
  raw: Record<string, unknown> | null | undefined,
): AboutMyStoryContent {
  const points = normalizePoints(raw?.points)
  return {
    id: ABOUT_MY_STORY_DOC_ID,
    watermark: normalizeBilingual(
      raw?.watermark,
      DEFAULT_ABOUT_MY_STORY_COPY.watermark,
    ),
    imageUrl: asString(raw?.imageUrl),
    storagePath: asString(raw?.storagePath),
    imageAlt: normalizeBilingual(
      raw?.imageAlt,
      DEFAULT_ABOUT_MY_STORY_COPY.imageAlt,
    ),
    points:
      points.length > 0
        ? points
        : DEFAULT_ABOUT_MY_STORY_COPY.points.map((p) => ({
            id: p.id,
            text: { ...p.text },
          })),
    updatedAt: asString(raw?.updatedAt),
    updatedBy: asString(raw?.updatedBy) || undefined,
  }
}

export async function fetchAboutMyStoryContent(): Promise<AboutMyStoryContent | null> {
  const snap = await getDoc(
    doc(getDb(), ABOUT_MY_STORY_COLLECTION, ABOUT_MY_STORY_DOC_ID),
  )
  if (!snap.exists()) return null
  return normalizeAboutMyStoryContent(snap.data() as Record<string, unknown>)
}

async function uploadAboutMyStoryImage(
  path: string,
  file: File,
  onProgress?: (percent: number) => void,
): Promise<string> {
  const storageRef = ref(getFirebaseStorage(), path)
  const task = uploadBytesResumable(storageRef, file, {
    contentType: file.type || "image/jpeg",
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
  if (
    !path ||
    isRenderableImageSrc(path) ||
    !isAboutMyStoryStoragePath(path)
  ) {
    return
  }
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

export type SaveAboutMyStoryContentInput = {
  watermark: BilingualText
  imageAlt: BilingualText
  points: Array<{ id?: string; text: BilingualText }>
  file?: File | null
  removeImage?: boolean
  updatedBy?: string
  onUploadProgress?: (percent: number) => void
}

export async function saveAboutMyStoryContent(
  input: SaveAboutMyStoryContentInput,
): Promise<AboutMyStoryContent> {
  const db = getDb()
  const now = new Date().toISOString()
  const existingSnap = await getDoc(
    doc(db, ABOUT_MY_STORY_COLLECTION, ABOUT_MY_STORY_DOC_ID),
  )
  const existing = existingSnap.exists()
    ? normalizeAboutMyStoryContent(
        existingSnap.data() as Record<string, unknown>,
      )
    : null

  const file = input.file ?? null
  if (file && file.size > ABOUT_MY_STORY_UPLOAD_LIMITS.imageBytes) {
    throw new Error(
      `Image exceeds ${formatBytesLabel(ABOUT_MY_STORY_UPLOAD_LIMITS.imageBytes)} limit`,
    )
  }
  if (file && !file.type.match(/^image\//)) {
    throw new Error("Only image files are allowed")
  }

  const points: AboutMyStoryPoint[] = []
  for (const point of input.points) {
    const text = mirrorBilingual(point.text.en, point.text.ar)
    if (!text) continue
    points.push({
      id: point.id?.trim() || allocateFirestoreId("point"),
      text,
    })
  }

  if (points.length === 0) {
    throw new Error("Add at least one story point")
  }
  if (points.length > ABOUT_MY_STORY_POINTS_MAX) {
    throw new Error(`Maximum of ${ABOUT_MY_STORY_POINTS_MAX} story points`)
  }

  let imageUrl = existing?.imageUrl || ""
  let storagePath = existing?.storagePath || ""
  let previousPathToDelete: string | null = null

  if (input.removeImage && !file) {
    if (existing?.storagePath) previousPathToDelete = existing.storagePath
    imageUrl = ""
    storagePath = ""
  }

  if (file) {
    const nextPath = buildAboutMyStoryImagePath({
      mimeType: file.type,
      fileName: `story.${file.type.includes("png") ? "png" : file.type.includes("webp") ? "webp" : "jpg"}`,
    })
    if (
      existing?.storagePath &&
      isAboutMyStoryStoragePath(existing.storagePath) &&
      existing.storagePath !== nextPath
    ) {
      previousPathToDelete = existing.storagePath
    }
    imageUrl = await uploadAboutMyStoryImage(
      nextPath,
      file,
      input.onUploadProgress,
    )
    storagePath = nextPath
  }

  const record: AboutMyStoryContent = {
    id: ABOUT_MY_STORY_DOC_ID,
    watermark: requireBilingual(
      input.watermark.en,
      input.watermark.ar,
      "Watermark",
    ),
    imageAlt: requireBilingual(
      input.imageAlt.en,
      input.imageAlt.ar,
      "Image alt",
    ),
    points,
    imageUrl,
    storagePath,
    updatedAt: now,
    updatedBy: input.updatedBy || existing?.updatedBy,
  }

  await setDoc(
    doc(db, ABOUT_MY_STORY_COLLECTION, ABOUT_MY_STORY_DOC_ID),
    stripUndefined({ ...record }),
  )

  if (previousPathToDelete) {
    await deleteStoragePath(previousPathToDelete)
  }

  return record
}

export async function clearAboutMyStoryImage(
  updatedBy?: string,
): Promise<AboutMyStoryContent> {
  const existing = await fetchAboutMyStoryContent()
  const source = existing ?? normalizeAboutMyStoryContent(null)
  return saveAboutMyStoryContent({
    watermark: source.watermark,
    imageAlt: source.imageAlt,
    points: source.points,
    removeImage: true,
    updatedBy,
  })
}
