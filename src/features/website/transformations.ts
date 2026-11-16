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
  TRANSFORMATIONS_UPLOAD_LIMITS,
  buildTransformationImagePath,
  formatBytesLabel,
  isRenderableImageSrc,
  isTransformationStoragePath,
} from "@/features/website/paths"
import { mirrorBilingual } from "@/features/website/service"
import { getDb } from "@/lib/firebase/firestore"
import { allocateFirestoreId } from "@/lib/firebase/ids"
import { getFirebaseStorage } from "@/lib/firebase/storage"
import type { BilingualText } from "@/types/program"
import type { TransformationItem, TransformationLoop } from "@/types/website"

export const TRANSFORMATIONS_COLLECTION = "website_transformations"
export const TRANSFORMATION_LOOPS: TransformationLoop[] = ["top", "bottom"]

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
  if (typeof value === "string") {
    const trimmed = value.trim()
    if (!trimmed) return { ...fallback }
    return { en: trimmed, ar: trimmed }
  }
  if (!value || typeof value !== "object") return { ...fallback }
  const raw = value as Record<string, unknown>
  const en = asString(raw.en, fallback.en).trim()
  const ar = asString(raw.ar, fallback.ar).trim()
  return {
    en: en || ar || fallback.en,
    ar: ar || en || fallback.ar,
  }
}

function normalizeLoop(value: unknown): TransformationLoop {
  return value === "bottom" ? "bottom" : "top"
}

export function normalizeTransformationItem(
  id: string,
  raw: Record<string, unknown> | null | undefined,
): TransformationItem {
  return {
    id,
    enabled: asBool(raw?.enabled, true),
    order: asNumber(raw?.order, 0),
    loop: normalizeLoop(raw?.loop),
    name: normalizeBilingual(raw?.name),
    description: normalizeBilingual(raw?.description),
    date: normalizeBilingual(raw?.date),
    imageAlt: normalizeBilingual(raw?.imageAlt),
    imageUrl: asString(raw?.imageUrl),
    storagePath: asString(raw?.storagePath),
    createdAt: asString(raw?.createdAt),
    updatedAt: asString(raw?.updatedAt),
    updatedBy: asString(raw?.updatedBy) || undefined,
  }
}

function sortItems(items: TransformationItem[]): TransformationItem[] {
  return [...items].sort((a, b) => {
    if (a.order !== b.order) return a.order - b.order
    return a.createdAt.localeCompare(b.createdAt) || a.id.localeCompare(b.id)
  })
}

export function isTransformationItemComplete(item: TransformationItem): boolean {
  return Boolean(
    isRenderableImageSrc(item.imageUrl) &&
      (item.name.en.trim() || item.name.ar.trim()) &&
      (item.description.en.trim() || item.description.ar.trim()),
  )
}

export function pickTransformationsForLoop(
  items: TransformationItem[],
  loop: TransformationLoop,
): TransformationItem[] {
  return sortItems(
    items.filter(
      (item) =>
        item.loop === loop &&
        item.enabled &&
        isTransformationItemComplete(item),
    ),
  )
}

export async function fetchTransformationItems(options?: {
  publicOnly?: boolean
}): Promise<TransformationItem[]> {
  const snap = await getDocs(collection(getDb(), TRANSFORMATIONS_COLLECTION))
  let items = snap.docs.map((d) =>
    normalizeTransformationItem(d.id, d.data() as Record<string, unknown>),
  )
  if (options?.publicOnly) {
    items = items.filter(
      (item) => item.enabled && isTransformationItemComplete(item),
    )
  }
  return sortItems(items)
}

async function uploadTransformationImage(
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
    !isTransformationStoragePath(path)
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

export type SaveTransformationItemInput = {
  id?: string
  name: BilingualText
  description: BilingualText
  date?: BilingualText
  imageAlt?: BilingualText
  loop: TransformationLoop
  enabled?: boolean
  order?: number
  file?: File | null
  updatedBy?: string
  onUploadProgress?: (percent: number) => void
}

export async function saveTransformationItem(
  input: SaveTransformationItemInput,
): Promise<TransformationItem> {
  const db = getDb()
  const now = new Date().toISOString()
  const existingSnap = input.id
    ? await getDoc(doc(db, TRANSFORMATIONS_COLLECTION, input.id))
    : null
  const existing =
    existingSnap?.exists()
      ? normalizeTransformationItem(
          existingSnap.id,
          existingSnap.data() as Record<string, unknown>,
        )
      : null

  const id = existing?.id ?? allocateFirestoreId(TRANSFORMATIONS_COLLECTION)
  const file = input.file ?? null

  if (file && file.size > TRANSFORMATIONS_UPLOAD_LIMITS.imageBytes) {
    throw new Error(
      `Image exceeds ${formatBytesLabel(TRANSFORMATIONS_UPLOAD_LIMITS.imageBytes)} limit`,
    )
  }
  if (file && !file.type.match(/^image\//)) {
    throw new Error("Only image files are allowed")
  }

  let imageUrl = existing?.imageUrl || ""
  let storagePath = existing?.storagePath || ""
  let previousPathToDelete: string | null = null

  if (file) {
    const nextPath = buildTransformationImagePath({
      itemId: id,
      mimeType: file.type,
      fileName: `transform.${file.type.includes("png") ? "png" : file.type.includes("webp") ? "webp" : file.type.includes("avif") ? "avif" : "jpg"}`,
    })
    if (
      existing?.storagePath &&
      isTransformationStoragePath(existing.storagePath) &&
      existing.storagePath !== nextPath
    ) {
      previousPathToDelete = existing.storagePath
    }
    imageUrl = await uploadTransformationImage(
      nextPath,
      file,
      input.onUploadProgress,
    )
    storagePath = nextPath
  }

  if (!isRenderableImageSrc(imageUrl)) {
    throw new Error("Image is required")
  }

  const loop = input.loop === "bottom" ? "bottom" : "top"
  let order = input.order ?? existing?.order
  if (order == null) {
    const siblings = (await fetchTransformationItems()).filter(
      (item) => item.loop === loop,
    )
    order =
      siblings.length === 0
        ? 0
        : Math.max(...siblings.map((item) => item.order)) + 1
  }

  const record: TransformationItem = {
    id,
    enabled: input.enabled ?? existing?.enabled ?? true,
    order,
    loop,
    name: requireBilingual(input.name.en, input.name.ar, "Name"),
    description: requireBilingual(
      input.description.en,
      input.description.ar,
      "Description",
    ),
    date: input.date
      ? mirrorBilingual(input.date.en, input.date.ar) || { en: "", ar: "" }
      : existing?.date || { en: "", ar: "" },
    imageAlt: input.imageAlt
      ? requireBilingual(input.imageAlt.en, input.imageAlt.ar, "Image alt")
      : existing?.imageAlt ||
        requireBilingual(input.name.en, input.name.ar, "Image alt"),
    imageUrl,
    storagePath,
    createdAt: existing?.createdAt || now,
    updatedAt: now,
    updatedBy: input.updatedBy || existing?.updatedBy,
  }

  await setDoc(
    doc(db, TRANSFORMATIONS_COLLECTION, id),
    stripUndefined({ ...record }),
  )

  if (previousPathToDelete) {
    await deleteStoragePath(previousPathToDelete)
  }

  return record
}

export async function setTransformationItemEnabled(
  id: string,
  enabled: boolean,
  updatedBy?: string,
): Promise<void> {
  const snap = await getDoc(doc(getDb(), TRANSFORMATIONS_COLLECTION, id))
  if (!snap.exists()) throw new Error("Transformation not found")
  const existing = normalizeTransformationItem(
    snap.id,
    snap.data() as Record<string, unknown>,
  )
  await setDoc(
    doc(getDb(), TRANSFORMATIONS_COLLECTION, id),
    stripUndefined({
      ...existing,
      enabled,
      updatedAt: new Date().toISOString(),
      updatedBy: updatedBy || existing.updatedBy,
    }),
  )
}

export async function setTransformationItemLoop(
  id: string,
  loop: TransformationLoop,
  updatedBy?: string,
): Promise<void> {
  const snap = await getDoc(doc(getDb(), TRANSFORMATIONS_COLLECTION, id))
  if (!snap.exists()) throw new Error("Transformation not found")
  const existing = normalizeTransformationItem(
    snap.id,
    snap.data() as Record<string, unknown>,
  )
  const nextLoop = loop === "bottom" ? "bottom" : "top"
  if (existing.loop === nextLoop) return

  const siblings = (await fetchTransformationItems()).filter(
    (item) => item.loop === nextLoop && item.id !== id,
  )
  const order =
    siblings.length === 0
      ? 0
      : Math.max(...siblings.map((item) => item.order)) + 1

  await setDoc(
    doc(getDb(), TRANSFORMATIONS_COLLECTION, id),
    stripUndefined({
      ...existing,
      loop: nextLoop,
      order,
      updatedAt: new Date().toISOString(),
      updatedBy: updatedBy || existing.updatedBy,
    }),
  )
}

export async function reorderTransformationItems(
  orderedIds: string[],
  updatedBy?: string,
): Promise<void> {
  if (orderedIds.length === 0) return
  const db = getDb()
  const batch = writeBatch(db)
  const now = new Date().toISOString()
  orderedIds.forEach((id, index) => {
    batch.update(doc(db, TRANSFORMATIONS_COLLECTION, id), {
      order: index,
      updatedAt: now,
      ...(updatedBy ? { updatedBy } : {}),
    })
  })
  await batch.commit()
}

export async function deleteTransformationItem(id: string): Promise<void> {
  const snap = await getDoc(doc(getDb(), TRANSFORMATIONS_COLLECTION, id))
  const existing = snap.exists()
    ? normalizeTransformationItem(
        snap.id,
        snap.data() as Record<string, unknown>,
      )
    : null
  await deleteDoc(doc(getDb(), TRANSFORMATIONS_COLLECTION, id))
  if (existing) await deleteStoragePath(existing.storagePath)
}
