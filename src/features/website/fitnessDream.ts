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
  buildFitnessDreamImagePath,
  FITNESS_DREAM_UPLOAD_LIMITS,
  formatBytesLabel,
  isFitnessDreamStoragePath,
  isRenderableImageSrc,
} from "@/features/website/paths"
import { getDb } from "@/lib/firebase/firestore"
import { allocateFirestoreId } from "@/lib/firebase/ids"
import { getFirebaseStorage } from "@/lib/firebase/storage"
import type { BilingualText } from "@/types/program"
import type { FitnessDreamCard } from "@/types/website"

export const FITNESS_DREAM_COLLECTION = "website_fitness_dream_cards"

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

export function normalizeFitnessDreamCard(
  id: string,
  raw: Record<string, unknown>,
): FitnessDreamCard {
  return {
    id,
    enabled: asBool(raw.enabled, true),
    order: asNumber(raw.order, 0),
    title: normalizeBilingual(raw.title),
    description: normalizeBilingual(raw.description),
    imageAlt: normalizeBilingual(raw.imageAlt),
    imageUrl: asString(raw.imageUrl),
    storagePath: asString(raw.storagePath),
    createdAt: asString(raw.createdAt),
    updatedAt: asString(raw.updatedAt),
    updatedBy: asString(raw.updatedBy) || undefined,
  }
}

function sortCards(cards: FitnessDreamCard[]): FitnessDreamCard[] {
  return [...cards].sort((a, b) => {
    if (a.order !== b.order) return a.order - b.order
    return a.createdAt.localeCompare(b.createdAt)
  })
}

export async function fetchFitnessDreamCards(options?: {
  publicOnly?: boolean
}): Promise<FitnessDreamCard[]> {
  const db = getDb()
  const snap = await getDocs(collection(db, FITNESS_DREAM_COLLECTION))
  let cards = snap.docs.map((d) =>
    normalizeFitnessDreamCard(d.id, d.data() as Record<string, unknown>),
  )
  if (options?.publicOnly) {
    cards = cards.filter(
      (c) =>
        c.enabled &&
        isRenderableImageSrc(c.imageUrl) &&
        (c.title.en.trim() || c.title.ar.trim()),
    )
  }
  return sortCards(cards)
}

async function uploadFitnessDreamImage(
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
  if (!path || isRenderableImageSrc(path) || !isFitnessDreamStoragePath(path)) {
    return
  }
  try {
    await deleteObject(ref(getFirebaseStorage(), path))
  } catch {
    // Object may already be gone
  }
}

export type SaveFitnessDreamCardInput = {
  id?: string
  enabled?: boolean
  order?: number
  title: BilingualText
  description: BilingualText
  imageAlt: BilingualText
  file?: File | null
  updatedBy?: string
  onUploadProgress?: (percent: number) => void
}

export async function saveFitnessDreamCard(
  input: SaveFitnessDreamCardInput,
): Promise<FitnessDreamCard> {
  const db = getDb()
  const now = new Date().toISOString()
  const existingSnap = input.id
    ? await getDoc(doc(db, FITNESS_DREAM_COLLECTION, input.id))
    : null
  const existing = existingSnap?.exists()
    ? normalizeFitnessDreamCard(
        existingSnap.id,
        existingSnap.data() as Record<string, unknown>,
      )
    : null

  const id = existing?.id ?? allocateFirestoreId(FITNESS_DREAM_COLLECTION)
  const file = input.file ?? null

  if (!existing && !file) {
    throw new Error("Please select a card image")
  }

  if (file && file.size > FITNESS_DREAM_UPLOAD_LIMITS.imageBytes) {
    throw new Error(
      `Image exceeds ${formatBytesLabel(FITNESS_DREAM_UPLOAD_LIMITS.imageBytes)} limit`,
    )
  }

  if (file && !file.type.match(/^image\//)) {
    throw new Error("Only image files are allowed")
  }

  let imageUrl = existing?.imageUrl || ""
  let storagePath = existing?.storagePath || ""
  let previousPathToDelete: string | null = null

  if (file) {
    const nextPath = buildFitnessDreamImagePath({
      cardId: id,
      mimeType: file.type,
      fileName: `card.${file.type.includes("png") ? "png" : file.type.includes("webp") ? "webp" : "jpg"}`,
    })
    if (
      existing?.storagePath &&
      isFitnessDreamStoragePath(existing.storagePath) &&
      existing.storagePath !== nextPath
    ) {
      previousPathToDelete = existing.storagePath
    }
    imageUrl = await uploadFitnessDreamImage(
      nextPath,
      file,
      input.onUploadProgress,
    )
    storagePath = nextPath
  }

  if (!isRenderableImageSrc(imageUrl)) {
    throw new Error("Card image is required")
  }

  let order = existing?.order ?? 0
  if (typeof input.order === "number") {
    order = input.order
  } else if (!existing) {
    const all = await fetchFitnessDreamCards()
    order = all.length === 0 ? 0 : Math.max(...all.map((c) => c.order)) + 1
  }

  const record: FitnessDreamCard = {
    id,
    enabled: input.enabled ?? existing?.enabled ?? true,
    order,
    title: input.title,
    description: input.description,
    imageAlt: input.imageAlt,
    imageUrl,
    storagePath,
    createdAt: existing?.createdAt || now,
    updatedAt: now,
    updatedBy: input.updatedBy || existing?.updatedBy,
  }

  await setDoc(
    doc(db, FITNESS_DREAM_COLLECTION, id),
    stripUndefined({ ...record }),
  )

  if (previousPathToDelete) {
    await deleteStoragePath(previousPathToDelete)
  }

  return record
}

export async function setFitnessDreamCardEnabled(
  id: string,
  enabled: boolean,
  updatedBy?: string,
): Promise<void> {
  const db = getDb()
  const snap = await getDoc(doc(db, FITNESS_DREAM_COLLECTION, id))
  if (!snap.exists()) throw new Error("Card not found")
  const existing = normalizeFitnessDreamCard(
    snap.id,
    snap.data() as Record<string, unknown>,
  )
  await setDoc(
    doc(db, FITNESS_DREAM_COLLECTION, id),
    stripUndefined({
      ...existing,
      enabled,
      updatedAt: new Date().toISOString(),
      updatedBy: updatedBy || existing.updatedBy,
    }),
  )
}

export async function reorderFitnessDreamCards(
  orderedIds: string[],
  updatedBy?: string,
): Promise<void> {
  if (orderedIds.length === 0) return
  const db = getDb()
  const batch = writeBatch(db)
  const now = new Date().toISOString()
  orderedIds.forEach((id, index) => {
    batch.update(doc(db, FITNESS_DREAM_COLLECTION, id), {
      order: index,
      updatedAt: now,
      ...(updatedBy ? { updatedBy } : {}),
    })
  })
  await batch.commit()
}

export async function deleteFitnessDreamCard(id: string): Promise<void> {
  const db = getDb()
  const snap = await getDoc(doc(db, FITNESS_DREAM_COLLECTION, id))
  const existing = snap.exists()
    ? normalizeFitnessDreamCard(
        snap.id,
        snap.data() as Record<string, unknown>,
      )
    : null
  await deleteDoc(doc(db, FITNESS_DREAM_COLLECTION, id))
  if (existing) await deleteStoragePath(existing.storagePath)
}
