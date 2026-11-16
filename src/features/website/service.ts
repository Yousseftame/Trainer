import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  setDoc,
  writeBatch,
} from "firebase/firestore"
import {
  deleteObject,
  getDownloadURL,
  ref,
  uploadBytesResumable,
} from "firebase/storage"
import {
  buildHomeHeroImagePath,
  formatBytesLabel,
  HOME_HERO_UPLOAD_LIMITS,
  isHomeHeroStoragePath,
  isRenderableImageSrc,
} from "@/features/website/paths"
import { getDb } from "@/lib/firebase/firestore"
import { allocateFirestoreId } from "@/lib/firebase/ids"
import { getFirebaseStorage } from "@/lib/firebase/storage"
import type { BilingualText } from "@/types/program"
import type { HomeHeroSlide } from "@/types/website"

export const HOME_HERO_COLLECTION = "website_home_hero_slides"

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

function asBool(value: unknown, fallback = true): boolean {
  return typeof value === "boolean" ? value : fallback
}

function asNumber(value: unknown, fallback = 0): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback
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

/** Prefer filled locale; mirror into empty side. */
export function mirrorBilingual(
  en: string,
  ar: string,
): BilingualText | null {
  const enTrim = en.trim()
  const arTrim = ar.trim()
  if (!enTrim && !arTrim) return null
  return {
    en: enTrim || arTrim,
    ar: arTrim || enTrim,
  }
}

export function normalizeHomeHeroSlide(
  id: string,
  raw: Record<string, unknown>,
): HomeHeroSlide {
  return {
    id,
    enabled: asBool(raw.enabled, true),
    order: asNumber(raw.order, 0),
    greeting: normalizeBilingual(raw.greeting),
    titleBefore: normalizeBilingual(raw.titleBefore),
    titleAccent: normalizeBilingual(raw.titleAccent),
    titleAfter: normalizeBilingual(raw.titleAfter),
    description: normalizeBilingual(raw.description),
    cta: normalizeBilingual(raw.cta),
    watermark: normalizeBilingual(raw.watermark),
    imageUrl: asString(raw.imageUrl),
    storagePath: asString(raw.storagePath),
    createdAt: asString(raw.createdAt),
    updatedAt: asString(raw.updatedAt),
    updatedBy: asString(raw.updatedBy) || undefined,
  }
}

function sortSlides(slides: HomeHeroSlide[]): HomeHeroSlide[] {
  return [...slides].sort((a, b) => {
    if (a.order !== b.order) return a.order - b.order
    return a.createdAt.localeCompare(b.createdAt)
  })
}

export async function fetchHomeHeroSlides(options?: {
  publicOnly?: boolean
}): Promise<HomeHeroSlide[]> {
  const db = getDb()
  const snap = await getDocs(collection(db, HOME_HERO_COLLECTION))
  let slides = snap.docs.map((d) =>
    normalizeHomeHeroSlide(d.id, d.data() as Record<string, unknown>),
  )
  if (options?.publicOnly) {
    slides = slides.filter(
      (s) => s.enabled && isRenderableImageSrc(s.imageUrl),
    )
  }
  return sortSlides(slides)
}

async function uploadHomeHeroImage(
  path: string,
  file: File,
  onProgress?: (percent: number) => void,
): Promise<string> {
  const storageRef = ref(getFirebaseStorage(), path)
  const task = uploadBytesResumable(storageRef, file, {
    contentType: file.type || "image/jpeg",
    customMetadata: {
      uploadedAt: new Date().toISOString(),
    },
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
  if (!path || isRenderableImageSrc(path) || !isHomeHeroStoragePath(path)) {
    return
  }
  try {
    await deleteObject(ref(getFirebaseStorage(), path))
  } catch {
    // Object may already be gone
  }
}

export type SaveHomeHeroSlideInput = {
  id?: string
  enabled?: boolean
  order?: number
  greeting: BilingualText
  titleBefore: BilingualText
  titleAccent: BilingualText
  titleAfter: BilingualText
  description: BilingualText
  cta: BilingualText
  watermark: BilingualText
  file?: File | null
  updatedBy?: string
  onUploadProgress?: (percent: number) => void
}

export async function saveHomeHeroSlide(
  input: SaveHomeHeroSlideInput,
): Promise<HomeHeroSlide> {
  const db = getDb()
  const now = new Date().toISOString()
  const existingSnap = input.id
    ? await getDoc(doc(db, HOME_HERO_COLLECTION, input.id))
    : null
  const existing = existingSnap?.exists()
    ? normalizeHomeHeroSlide(
        existingSnap.id,
        existingSnap.data() as Record<string, unknown>,
      )
    : null

  const id = existing?.id ?? allocateFirestoreId(HOME_HERO_COLLECTION)
  const file = input.file ?? null

  if (!existing && !file) {
    throw new Error("Please select a hero background image")
  }

  if (file && file.size > HOME_HERO_UPLOAD_LIMITS.imageBytes) {
    throw new Error(
      `Image exceeds ${formatBytesLabel(HOME_HERO_UPLOAD_LIMITS.imageBytes)} limit`,
    )
  }

  if (!file?.type.match(/^image\//) && file) {
    throw new Error("Only image files are allowed")
  }

  let imageUrl = existing?.imageUrl || ""
  let storagePath = existing?.storagePath || ""
  let previousPathToDelete: string | null = null

  if (file) {
    const nextPath = buildHomeHeroImagePath({
      slideId: id,
      mimeType: file.type,
      fileName: `bg.${file.type.includes("png") ? "png" : file.type.includes("webp") ? "webp" : "jpg"}`,
    })
    if (
      existing?.storagePath &&
      isHomeHeroStoragePath(existing.storagePath) &&
      existing.storagePath !== nextPath
    ) {
      previousPathToDelete = existing.storagePath
    }
    imageUrl = await uploadHomeHeroImage(
      nextPath,
      file,
      input.onUploadProgress,
    )
    storagePath = nextPath
  }

  if (!isRenderableImageSrc(imageUrl)) {
    throw new Error("Hero image is required")
  }

  // New slides append to the end unless order is provided.
  let order = existing?.order ?? 0
  if (typeof input.order === "number") {
    order = input.order
  } else if (!existing) {
    const all = await fetchHomeHeroSlides()
    order = all.length === 0 ? 0 : Math.max(...all.map((s) => s.order)) + 1
  }

  const record: HomeHeroSlide = {
    id,
    enabled: input.enabled ?? existing?.enabled ?? true,
    order,
    greeting: input.greeting,
    titleBefore: input.titleBefore,
    titleAccent: input.titleAccent,
    titleAfter: input.titleAfter,
    description: input.description,
    cta: input.cta,
    watermark: input.watermark,
    imageUrl,
    storagePath,
    createdAt: existing?.createdAt || now,
    updatedAt: now,
    updatedBy: input.updatedBy || existing?.updatedBy,
  }

  await setDoc(
    doc(db, HOME_HERO_COLLECTION, id),
    stripUndefined({ ...record }),
  )

  if (previousPathToDelete) {
    await deleteStoragePath(previousPathToDelete)
  }

  return record
}

export async function setHomeHeroSlideEnabled(
  id: string,
  enabled: boolean,
  updatedBy?: string,
): Promise<void> {
  const db = getDb()
  const snap = await getDoc(doc(db, HOME_HERO_COLLECTION, id))
  if (!snap.exists()) throw new Error("Slide not found")
  const existing = normalizeHomeHeroSlide(
    snap.id,
    snap.data() as Record<string, unknown>,
  )
  await setDoc(
    doc(db, HOME_HERO_COLLECTION, id),
    stripUndefined({
      ...existing,
      enabled,
      updatedAt: new Date().toISOString(),
      updatedBy: updatedBy || existing.updatedBy,
    }),
  )
}

/** Reorder by ordered list of ids (0..n-1). */
export async function reorderHomeHeroSlides(
  orderedIds: string[],
  updatedBy?: string,
): Promise<void> {
  if (orderedIds.length === 0) return
  const db = getDb()
  const batch = writeBatch(db)
  const now = new Date().toISOString()
  orderedIds.forEach((id, index) => {
    batch.update(doc(db, HOME_HERO_COLLECTION, id), {
      order: index,
      updatedAt: now,
      ...(updatedBy ? { updatedBy } : {}),
    })
  })
  await batch.commit()
}

export async function deleteHomeHeroSlide(id: string): Promise<void> {
  const db = getDb()
  const snap = await getDoc(doc(db, HOME_HERO_COLLECTION, id))
  const existing = snap.exists()
    ? normalizeHomeHeroSlide(
        snap.id,
        snap.data() as Record<string, unknown>,
      )
    : null
  await deleteDoc(doc(db, HOME_HERO_COLLECTION, id))
  if (existing) await deleteStoragePath(existing.storagePath)
}
