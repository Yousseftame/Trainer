import { doc, getDoc, setDoc } from "firebase/firestore"
import {
  deleteObject,
  getDownloadURL,
  ref,
  uploadBytesResumable,
} from "firebase/storage"
import {
  buildWhoIAmImagePath,
  formatBytesLabel,
  isRenderableImageSrc,
  isWhoIAmStoragePath,
  WHO_I_AM_UPLOAD_LIMITS,
} from "@/features/website/paths"
import { mirrorBilingual } from "@/features/website/service"
import { getDb } from "@/lib/firebase/firestore"
import { allocateFirestoreId } from "@/lib/firebase/ids"
import { getFirebaseStorage } from "@/lib/firebase/storage"
import type { BilingualText } from "@/types/program"
import type { WhoIAmContent, WhoIAmPoint } from "@/types/website"

export const WHO_I_AM_COLLECTION = "website_who_i_am"
export const WHO_I_AM_DOC_ID = "config"

export const DEFAULT_WHO_I_AM_COPY = {
  yearsValue: { en: "14+", ar: "+14" },
  yearsLabel: { en: "Years of Experience", ar: "سنوات من الخبرة" },
  eyebrow: { en: "Who I Am", ar: "من أنا" },
  titleLine1: { en: "Experienced personal", ar: "مدرب شخصي ذو" },
  titleLine2: { en: "trainer", ar: "خبرة" },
  body: {
    en: "My approach combines science-backed training techniques with personalized workout plans designed specifically for your goals—building muscle, losing weight, or improving overall health.",
    ar: "أسلوبي يجمع بين تقنيات تدريب مدعومة علمياً وخطط تمارين مخصصة لأهدافك—بناء العضلات، خسارة الوزن، أو تحسين الصحة العامة.",
  },
  cta: { en: "Get to know me", ar: "تعرّف عليّ" },
  pointsTitle: { en: "Certifications", ar: "الشهادات" },
  imageAlt: {
    en: "Personal trainer coaching a client with dumbbells",
    ar: "مدرب شخصي يساعد متدربة على رفع الأثقال",
  },
  points: [
    {
      id: "trainer",
      text: {
        en: "Certified personal trainer",
        ar: "مدرب شخصي معتمد",
      },
    },
    {
      id: "nutrition",
      text: { en: "Nutrition specialist", ar: "أخصائي تغذية" },
    },
    {
      id: "strength",
      text: {
        en: "Strength and conditioning coach",
        ar: "مدرب قوة وتكييف",
      },
    },
    {
      id: "trusted",
      text: { en: "Trusted by hundreds", ar: "موثوق من المئات" },
    },
  ] satisfies WhoIAmPoint[],
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

function normalizePoints(value: unknown): WhoIAmPoint[] {
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
    .filter((p): p is WhoIAmPoint => Boolean(p))
}

export function normalizeWhoIAmContent(
  raw: Record<string, unknown> | null | undefined,
): WhoIAmContent {
  return {
    id: WHO_I_AM_DOC_ID,
    imageUrl: asString(raw?.imageUrl),
    storagePath: asString(raw?.storagePath),
    imageAlt: normalizeBilingual(raw?.imageAlt, DEFAULT_WHO_I_AM_COPY.imageAlt),
    yearsValue: normalizeBilingual(
      raw?.yearsValue,
      DEFAULT_WHO_I_AM_COPY.yearsValue,
    ),
    yearsLabel: normalizeBilingual(
      raw?.yearsLabel,
      DEFAULT_WHO_I_AM_COPY.yearsLabel,
    ),
    eyebrow: normalizeBilingual(raw?.eyebrow, DEFAULT_WHO_I_AM_COPY.eyebrow),
    titleLine1: normalizeBilingual(
      raw?.titleLine1,
      DEFAULT_WHO_I_AM_COPY.titleLine1,
    ),
    titleLine2: normalizeBilingual(
      raw?.titleLine2,
      DEFAULT_WHO_I_AM_COPY.titleLine2,
    ),
    body: normalizeBilingual(raw?.body, DEFAULT_WHO_I_AM_COPY.body),
    cta: normalizeBilingual(raw?.cta, DEFAULT_WHO_I_AM_COPY.cta),
    pointsTitle: normalizeBilingual(
      raw?.pointsTitle,
      DEFAULT_WHO_I_AM_COPY.pointsTitle,
    ),
    points: (() => {
      const points = normalizePoints(raw?.points)
      return points.length > 0
        ? points
        : DEFAULT_WHO_I_AM_COPY.points.map((p) => ({
            id: p.id,
            text: { ...p.text },
          }))
    })(),
    updatedAt: asString(raw?.updatedAt),
    updatedBy: asString(raw?.updatedBy) || undefined,
  }
}

export async function fetchWhoIAmContent(): Promise<WhoIAmContent | null> {
  const snap = await getDoc(
    doc(getDb(), WHO_I_AM_COLLECTION, WHO_I_AM_DOC_ID),
  )
  if (!snap.exists()) return null
  return normalizeWhoIAmContent(snap.data() as Record<string, unknown>)
}

async function uploadWhoIAmImage(
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
  if (!path || isRenderableImageSrc(path) || !isWhoIAmStoragePath(path)) {
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

export type SaveWhoIAmContentInput = {
  yearsValue: BilingualText
  yearsLabel: BilingualText
  eyebrow: BilingualText
  titleLine1: BilingualText
  titleLine2: BilingualText
  body: BilingualText
  cta: BilingualText
  pointsTitle: BilingualText
  imageAlt?: BilingualText
  points: Array<{ id?: string; text: BilingualText }>
  file?: File | null
  /** When true, remove current Storage image and clear image fields. */
  removeImage?: boolean
  updatedBy?: string
  onUploadProgress?: (percent: number) => void
}

export async function saveWhoIAmContent(
  input: SaveWhoIAmContentInput,
): Promise<WhoIAmContent> {
  const db = getDb()
  const now = new Date().toISOString()
  const existingSnap = await getDoc(
    doc(db, WHO_I_AM_COLLECTION, WHO_I_AM_DOC_ID),
  )
  const existing = existingSnap.exists()
    ? normalizeWhoIAmContent(existingSnap.data() as Record<string, unknown>)
    : null

  const file = input.file ?? null
  if (file && file.size > WHO_I_AM_UPLOAD_LIMITS.imageBytes) {
    throw new Error(
      `Image exceeds ${formatBytesLabel(WHO_I_AM_UPLOAD_LIMITS.imageBytes)} limit`,
    )
  }
  if (file && !file.type.match(/^image\//)) {
    throw new Error("Only image files are allowed")
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
    const nextPath = buildWhoIAmImagePath({
      mimeType: file.type,
      fileName: `photo.${file.type.includes("png") ? "png" : file.type.includes("webp") ? "webp" : "jpg"}`,
    })
    if (
      existing?.storagePath &&
      isWhoIAmStoragePath(existing.storagePath) &&
      existing.storagePath !== nextPath
    ) {
      previousPathToDelete = existing.storagePath
    }
    imageUrl = await uploadWhoIAmImage(
      nextPath,
      file,
      input.onUploadProgress,
    )
    storagePath = nextPath
  }

  const points: WhoIAmPoint[] = []
  for (const point of input.points) {
    const text = mirrorBilingual(point.text.en, point.text.ar)
    if (!text) continue
    points.push({
      id: point.id || allocateFirestoreId("_id_pool"),
      text,
    })
  }

  if (points.length === 0) {
    throw new Error("Add at least one point")
  }

  const record: WhoIAmContent = {
    id: WHO_I_AM_DOC_ID,
    imageUrl,
    storagePath,
    imageAlt: input.imageAlt
      ? requireBilingual(input.imageAlt.en, input.imageAlt.ar, "Image alt")
      : existing?.imageAlt || { ...DEFAULT_WHO_I_AM_COPY.imageAlt },
    yearsValue: requireBilingual(
      input.yearsValue.en,
      input.yearsValue.ar,
      "Years value",
    ),
    yearsLabel: requireBilingual(
      input.yearsLabel.en,
      input.yearsLabel.ar,
      "Years label",
    ),
    eyebrow: requireBilingual(input.eyebrow.en, input.eyebrow.ar, "Title"),
    titleLine1: requireBilingual(
      input.titleLine1.en,
      input.titleLine1.ar,
      "Headline line 1",
    ),
    titleLine2: requireBilingual(
      input.titleLine2.en,
      input.titleLine2.ar,
      "Headline line 2",
    ),
    body: requireBilingual(input.body.en, input.body.ar, "Description"),
    cta: requireBilingual(input.cta.en, input.cta.ar, "Button label"),
    pointsTitle: requireBilingual(
      input.pointsTitle.en,
      input.pointsTitle.ar,
      "Points title",
    ),
    points,
    updatedAt: now,
    updatedBy: input.updatedBy || existing?.updatedBy,
  }

  await setDoc(
    doc(db, WHO_I_AM_COLLECTION, WHO_I_AM_DOC_ID),
    stripUndefined({ ...record }),
  )

  if (previousPathToDelete) {
    await deleteStoragePath(previousPathToDelete)
  }

  return record
}

/** Delete Storage image and clear image fields, keep copy. */
export async function clearWhoIAmImage(updatedBy?: string): Promise<WhoIAmContent> {
  const existing = await fetchWhoIAmContent()
  if (!existing) {
    throw new Error("Who I Am content not found")
  }
  await deleteStoragePath(existing.storagePath)
  const now = new Date().toISOString()
  const next: WhoIAmContent = {
    ...existing,
    imageUrl: "",
    storagePath: "",
    updatedAt: now,
    updatedBy: updatedBy || existing.updatedBy,
  }
  await setDoc(
    doc(getDb(), WHO_I_AM_COLLECTION, WHO_I_AM_DOC_ID),
    stripUndefined({ ...next }),
  )
  return next
}
