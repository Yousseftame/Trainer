import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  setDoc,
} from "firebase/firestore"
import {
  deleteObject,
  getDownloadURL,
  ref,
  uploadBytesResumable,
} from "firebase/storage"
import {
  buildTestimonialImagePath,
  formatBytesLabel,
  isRenderableImageSrc,
  isTestimonialStoragePath,
  TESTIMONIALS_UPLOAD_LIMITS,
} from "@/features/website/paths"
import { mirrorBilingual } from "@/features/website/service"
import { getDb } from "@/lib/firebase/firestore"
import { getFirebaseStorage } from "@/lib/firebase/storage"
import type { BilingualText } from "@/types/program"
import type {
  TestimonialItem,
  TestimonialSlotSize,
} from "@/types/website"

export const TESTIMONIALS_COLLECTION = "website_testimonials"
export const TESTIMONIALS_MAX = 6

/** Fixed design slots — order and sizes must match TestimonialsSection. */
export const TESTIMONIAL_SLOTS: Array<{
  slotIndex: number
  id: string
  size: TestimonialSlotSize
  staticKey: string
}> = [
  { slotIndex: 0, id: "slot-0", size: "one", staticKey: "sarah" },
  { slotIndex: 1, id: "slot-1", size: "two", staticKey: "emily" },
  { slotIndex: 2, id: "slot-2", size: "three", staticKey: "samantha" },
  { slotIndex: 3, id: "slot-3", size: "four", staticKey: "john" },
  { slotIndex: 4, id: "slot-4", size: "five", staticKey: "lisa" },
  { slotIndex: 5, id: "slot-5", size: "six", staticKey: "jessica" },
]

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

function sizeForSlot(slotIndex: number): TestimonialSlotSize {
  return (
    TESTIMONIAL_SLOTS.find((s) => s.slotIndex === slotIndex)?.size ?? "one"
  )
}

export function normalizeTestimonialItem(
  id: string,
  raw: Record<string, unknown>,
): TestimonialItem {
  const slotIndex = Math.min(
    TESTIMONIALS_MAX - 1,
    Math.max(0, Math.floor(asNumber(raw.slotIndex, 0))),
  )
  return {
    id,
    slotIndex,
    size: sizeForSlot(slotIndex),
    title: normalizeBilingual(raw.title),
    body: normalizeBilingual(raw.body),
    author: normalizeBilingual(raw.author),
    imageUrl: asString(raw.imageUrl),
    storagePath: asString(raw.storagePath),
    createdAt: asString(raw.createdAt),
    updatedAt: asString(raw.updatedAt),
    updatedBy: asString(raw.updatedBy) || undefined,
  }
}

function sortBySlot(items: TestimonialItem[]): TestimonialItem[] {
  return [...items].sort((a, b) => a.slotIndex - b.slotIndex)
}

export async function fetchTestimonials(): Promise<TestimonialItem[]> {
  const snap = await getDocs(collection(getDb(), TESTIMONIALS_COLLECTION))
  const items = snap.docs.map((d) =>
    normalizeTestimonialItem(d.id, d.data() as Record<string, unknown>),
  )
  return sortBySlot(items)
}

/** Public: complete slots only (image + title + body + author). */
export async function fetchPublicTestimonials(): Promise<TestimonialItem[]> {
  const all = await fetchTestimonials()
  return all.filter(
    (item) =>
      isRenderableImageSrc(item.imageUrl) &&
      (item.title.en.trim() || item.title.ar.trim()) &&
      (item.body.en.trim() || item.body.ar.trim()) &&
      (item.author.en.trim() || item.author.ar.trim()),
  )
}

async function uploadTestimonialImage(
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
  if (!path || !isTestimonialStoragePath(path)) return
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

export type SaveTestimonialInput = {
  /** Fixed slot id `slot-0` … `slot-5`. */
  slotId: string
  title: BilingualText
  body: BilingualText
  author: BilingualText
  file?: File | null
  updatedBy?: string
  onUploadProgress?: (percent: number) => void
}

export async function saveTestimonial(
  input: SaveTestimonialInput,
): Promise<TestimonialItem> {
  const slot = TESTIMONIAL_SLOTS.find((s) => s.id === input.slotId)
  if (!slot) {
    throw new Error("Invalid testimonial slot")
  }

  const db = getDb()
  const now = new Date().toISOString()
  const existingSnap = await getDoc(
    doc(db, TESTIMONIALS_COLLECTION, slot.id),
  )
  const existing = existingSnap.exists()
    ? normalizeTestimonialItem(
        existingSnap.id,
        existingSnap.data() as Record<string, unknown>,
      )
    : null

  // Hard cap: never create beyond the 6 designed slots (ids are fixed).
  if (!existing) {
    const all = await fetchTestimonials()
    if (all.length >= TESTIMONIALS_MAX && !all.some((t) => t.id === slot.id)) {
      throw new Error("Maximum of 6 testimonials reached")
    }
  }

  const file = input.file ?? null
  if (!existing && !file) {
    throw new Error("Please select a portrait image")
  }
  if (file && file.size > TESTIMONIALS_UPLOAD_LIMITS.imageBytes) {
    throw new Error(
      `Image exceeds ${formatBytesLabel(TESTIMONIALS_UPLOAD_LIMITS.imageBytes)} limit`,
    )
  }
  if (file && !file.type.match(/^image\//)) {
    throw new Error("Only image files are allowed")
  }

  let imageUrl = existing?.imageUrl || ""
  let storagePath = existing?.storagePath || ""
  let previousPathToDelete: string | null = null

  if (file) {
    const nextPath = buildTestimonialImagePath({
      slotId: slot.id,
      mimeType: file.type,
      fileName: `avatar.${file.type.includes("png") ? "png" : file.type.includes("webp") ? "webp" : "jpg"}`,
    })
    if (
      existing?.storagePath &&
      isTestimonialStoragePath(existing.storagePath) &&
      existing.storagePath !== nextPath
    ) {
      previousPathToDelete = existing.storagePath
    }
    imageUrl = await uploadTestimonialImage(
      nextPath,
      file,
      input.onUploadProgress,
    )
    storagePath = nextPath
  }

  if (!isRenderableImageSrc(imageUrl)) {
    throw new Error("Portrait image is required")
  }

  const record: TestimonialItem = {
    id: slot.id,
    slotIndex: slot.slotIndex,
    size: slot.size,
    title: requireBilingual(input.title.en, input.title.ar, "Title"),
    body: requireBilingual(input.body.en, input.body.ar, "Description"),
    author: requireBilingual(input.author.en, input.author.ar, "Name"),
    imageUrl,
    storagePath,
    createdAt: existing?.createdAt || now,
    updatedAt: now,
    updatedBy: input.updatedBy || existing?.updatedBy,
  }

  await setDoc(
    doc(db, TESTIMONIALS_COLLECTION, slot.id),
    stripUndefined({ ...record }),
  )

  if (previousPathToDelete) {
    await deleteStoragePath(previousPathToDelete)
  }

  return record
}

export async function deleteTestimonial(slotId: string): Promise<void> {
  const db = getDb()
  const snap = await getDoc(doc(db, TESTIMONIALS_COLLECTION, slotId))
  const existing = snap.exists()
    ? normalizeTestimonialItem(
        snap.id,
        snap.data() as Record<string, unknown>,
      )
    : null
  await deleteDoc(doc(db, TESTIMONIALS_COLLECTION, slotId))
  if (existing) await deleteStoragePath(existing.storagePath)
}
