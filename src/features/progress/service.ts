import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  setDoc,
  where,
} from "firebase/firestore"
import {
  deleteObject,
  getDownloadURL,
  ref,
  uploadBytesResumable,
} from "firebase/storage"
import {
  buildProgressPhotoStoragePath,
  formatBytesLabel,
  isRenderablePhotoSrc,
  PROGRESS_UPLOAD_LIMITS,
} from "@/features/progress/paths"
import { getDb } from "@/lib/firebase/firestore"
import { getFirebaseStorage } from "@/lib/firebase/storage"
import type {
  BodyMeasurement,
  PerformanceRecord,
  ProgressPhoto,
  ProgressPhotoPose,
} from "@/types/progress"

const MEASUREMENTS_COLLECTION = "progress_measurements"
const PHOTOS_COLLECTION = "progress_photos"
const PERFORMANCE_COLLECTION = "progress_performance"

const LEGACY_KEYS = [
  "derpyfit_progress_measurements_v1",
  "derpyfit_progress_photos_v1",
  "derpyfit_progress_performance_v1",
] as const

try {
  for (const key of LEGACY_KEYS) window.localStorage.removeItem(key)
} catch {
  // ignore
}

function stripUndefined<T extends Record<string, unknown>>(obj: T): T {
  const out: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(obj)) {
    if (v !== undefined) out[k] = v
  }
  return out as T
}

function asNumber(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) return value
  if (typeof value === "string" && value.trim() && Number.isFinite(Number(value))) {
    return Number(value)
  }
  return undefined
}

function normalizeMeasurement(
  id: string,
  raw: Record<string, unknown>,
): BodyMeasurement {
  return {
    id,
    subscriberId: String(raw.subscriberId ?? ""),
    recordedAt:
      typeof raw.recordedAt === "string"
        ? raw.recordedAt
        : new Date().toISOString(),
    weightKg: asNumber(raw.weightKg),
    chestCm: asNumber(raw.chestCm),
    waistCm: asNumber(raw.waistCm),
    hipsCm: asNumber(raw.hipsCm),
    armsCm: asNumber(raw.armsCm),
    thighsCm: asNumber(raw.thighsCm),
    notes: typeof raw.notes === "string" ? raw.notes : undefined,
    createdAt: typeof raw.createdAt === "string" ? raw.createdAt : undefined,
    updatedAt: typeof raw.updatedAt === "string" ? raw.updatedAt : undefined,
    createdBy: typeof raw.createdBy === "string" ? raw.createdBy : undefined,
  }
}

function normalizePhoto(
  id: string,
  raw: Record<string, unknown>,
): ProgressPhoto {
  const storagePath =
    typeof raw.storagePath === "string" ? raw.storagePath : ""
  return {
    id,
    subscriberId: String(raw.subscriberId ?? ""),
    storagePath,
    downloadUrl:
      typeof raw.downloadUrl === "string"
        ? raw.downloadUrl
        : isRenderablePhotoSrc(storagePath)
          ? storagePath
          : undefined,
    takenAt:
      typeof raw.takenAt === "string" ? raw.takenAt : new Date().toISOString(),
    pose: (raw.pose as ProgressPhotoPose) || "front",
    caption: typeof raw.caption === "string" ? raw.caption : undefined,
    mimeType: typeof raw.mimeType === "string" ? raw.mimeType : undefined,
    sizeBytes: asNumber(raw.sizeBytes),
    sizeLabel:
      typeof raw.sizeLabel === "string"
        ? raw.sizeLabel
        : formatBytesLabel(asNumber(raw.sizeBytes)),
    uploadedBy: typeof raw.uploadedBy === "string" ? raw.uploadedBy : undefined,
    createdAt:
      typeof raw.createdAt === "string"
        ? raw.createdAt
        : new Date().toISOString(),
    updatedAt: typeof raw.updatedAt === "string" ? raw.updatedAt : undefined,
  }
}

function normalizePerformance(
  id: string,
  raw: Record<string, unknown>,
): PerformanceRecord {
  return {
    id,
    subscriberId: String(raw.subscriberId ?? ""),
    recordedAt:
      typeof raw.recordedAt === "string"
        ? raw.recordedAt
        : new Date().toISOString(),
    name: String(raw.name ?? ""),
    value: asNumber(raw.value) ?? 0,
    unit: raw.unit === "reps" ? "reps" : "kg",
    notes: typeof raw.notes === "string" ? raw.notes : undefined,
    programId: typeof raw.programId === "string" ? raw.programId : undefined,
    exerciseId: typeof raw.exerciseId === "string" ? raw.exerciseId : undefined,
    createdAt: typeof raw.createdAt === "string" ? raw.createdAt : undefined,
    updatedAt: typeof raw.updatedAt === "string" ? raw.updatedAt : undefined,
    createdBy: typeof raw.createdBy === "string" ? raw.createdBy : undefined,
  }
}

async function uploadProgressPhotoFile(
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
  if (!path || isRenderablePhotoSrc(path) || !path.startsWith("progress/")) {
    return
  }
  try {
    await deleteObject(ref(getFirebaseStorage(), path))
  } catch {
    // Object may already be gone
  }
}

/** Resolve a displayable URL for a progress photo (Storage path or cached URL). */
export async function resolveProgressPhotoUrl(
  photo: Pick<ProgressPhoto, "storagePath" | "downloadUrl">,
): Promise<string | null> {
  if (photo.downloadUrl && isRenderablePhotoSrc(photo.downloadUrl)) {
    return photo.downloadUrl
  }
  if (isRenderablePhotoSrc(photo.storagePath)) {
    return photo.storagePath
  }
  if (!photo.storagePath || !photo.storagePath.startsWith("progress/")) {
    return null
  }
  try {
    return await getDownloadURL(ref(getFirebaseStorage(), photo.storagePath))
  } catch {
    return null
  }
}

// ==========================================
// Measurements
// ==========================================

export async function fetchMeasurements(
  subscriberId?: string,
): Promise<BodyMeasurement[]> {
  try {
    const db = getDb()
    const colRef = collection(db, MEASUREMENTS_COLLECTION)
    const snap = subscriberId
      ? await getDocs(query(colRef, where("subscriberId", "==", subscriberId)))
      : await getDocs(colRef)
    return snap.docs
      .map((d) =>
        normalizeMeasurement(d.id, d.data() as Record<string, unknown>),
      )
      .sort(
        (a, b) =>
          new Date(b.recordedAt).getTime() - new Date(a.recordedAt).getTime(),
      )
  } catch (err) {
    console.warn("[progress] Failed to load measurements:", err)
    throw err instanceof Error ? err : new Error("Failed to load measurements")
  }
}

export type SaveMeasurementInput = {
  id?: string
  subscriberId: string
  recordedAt: string
  weightKg?: number
  chestCm?: number
  waistCm?: number
  hipsCm?: number
  armsCm?: number
  thighsCm?: number
  notes?: string
  createdBy?: string
}

export async function saveMeasurement(
  input: SaveMeasurementInput,
): Promise<BodyMeasurement> {
  if (!input.subscriberId) throw new Error("Subscriber is required")
  const now = new Date().toISOString()
  const db = getDb()
  const existing = input.id
    ? await getDoc(doc(db, MEASUREMENTS_COLLECTION, input.id))
    : null
  const id = existing?.id ?? doc(collection(db, MEASUREMENTS_COLLECTION)).id

  const record: BodyMeasurement = {
    id,
    subscriberId: input.subscriberId,
    recordedAt: input.recordedAt || now,
    weightKg: input.weightKg,
    chestCm: input.chestCm,
    waistCm: input.waistCm,
    hipsCm: input.hipsCm,
    armsCm: input.armsCm,
    thighsCm: input.thighsCm,
    notes: input.notes?.trim() || undefined,
    createdAt:
      typeof existing?.data()?.createdAt === "string"
        ? (existing.data()!.createdAt as string)
        : now,
    updatedAt: now,
    createdBy:
      input.createdBy ||
      (typeof existing?.data()?.createdBy === "string"
        ? (existing.data()!.createdBy as string)
        : undefined),
  }

  await setDoc(
    doc(db, MEASUREMENTS_COLLECTION, id),
    stripUndefined({ ...record }),
  )
  return record
}

export async function deleteMeasurement(id: string): Promise<void> {
  await deleteDoc(doc(getDb(), MEASUREMENTS_COLLECTION, id))
}

// ==========================================
// Photos
// ==========================================

export async function fetchPhotos(
  subscriberId?: string,
): Promise<ProgressPhoto[]> {
  try {
    const db = getDb()
    const colRef = collection(db, PHOTOS_COLLECTION)
    const snap = subscriberId
      ? await getDocs(query(colRef, where("subscriberId", "==", subscriberId)))
      : await getDocs(colRef)
    return snap.docs
      .map((d) => normalizePhoto(d.id, d.data() as Record<string, unknown>))
      .sort(
        (a, b) =>
          new Date(b.takenAt).getTime() - new Date(a.takenAt).getTime(),
      )
  } catch (err) {
    console.warn("[progress] Failed to load photos:", err)
    throw err instanceof Error ? err : new Error("Failed to load progress photos")
  }
}

export type SavePhotoInput = {
  id?: string
  subscriberId: string
  takenAt: string
  pose?: ProgressPhotoPose
  caption?: string
  file?: File | null
  /** @deprecated Prefer uploading `file` to Storage */
  storagePath?: string
  uploadedBy?: string
  onUploadProgress?: (percent: number) => void
}

export async function savePhoto(input: SavePhotoInput): Promise<ProgressPhoto> {
  if (!input.subscriberId) throw new Error("Subscriber is required")
  const now = new Date().toISOString()
  const db = getDb()
  const existingSnap = input.id
    ? await getDoc(doc(db, PHOTOS_COLLECTION, input.id))
    : null
  const existing = existingSnap?.exists()
    ? normalizePhoto(
        existingSnap.id,
        existingSnap.data() as Record<string, unknown>,
      )
    : null

  const id = existing?.id ?? doc(collection(db, PHOTOS_COLLECTION)).id
  const file = input.file ?? null
  const pose = input.pose || existing?.pose || "front"

  if (!existing && !file && !isRenderablePhotoSrc(input.storagePath)) {
    throw new Error("Please select a progress photo to upload")
  }

  if (file && file.size > PROGRESS_UPLOAD_LIMITS.photoBytes) {
    throw new Error(
      `Photo exceeds ${formatBytesLabel(PROGRESS_UPLOAD_LIMITS.photoBytes)} limit`,
    )
  }

  let storagePath = existing?.storagePath || ""
  let downloadUrl = existing?.downloadUrl
  let previousPathToDelete: string | null = null
  let mimeType = existing?.mimeType
  let sizeBytes = existing?.sizeBytes

  if (file) {
    const nextPath = buildProgressPhotoStoragePath({
      subscriberId: input.subscriberId,
      photoId: id,
      pose,
      mimeType: file.type,
      takenAt: input.takenAt || existing?.takenAt || now,
    })
    if (
      existing?.storagePath &&
      existing.storagePath.startsWith("progress/") &&
      existing.storagePath !== nextPath
    ) {
      previousPathToDelete = existing.storagePath
    }
    downloadUrl = await uploadProgressPhotoFile(
      nextPath,
      file,
      input.onUploadProgress,
    )
    storagePath = nextPath
    mimeType = file.type || "image/jpeg"
    sizeBytes = file.size
  } else if (input.storagePath && isRenderablePhotoSrc(input.storagePath)) {
    // Legacy path — keep working for already-saved data URLs, but do not encourage
    storagePath = input.storagePath
    downloadUrl = input.storagePath
  }

  const record: ProgressPhoto = {
    id,
    subscriberId: input.subscriberId,
    storagePath,
    downloadUrl,
    takenAt: input.takenAt || existing?.takenAt || now,
    pose,
    caption: input.caption?.trim() || existing?.caption,
    mimeType,
    sizeBytes,
    sizeLabel: formatBytesLabel(sizeBytes),
    uploadedBy: input.uploadedBy || existing?.uploadedBy,
    createdAt: existing?.createdAt || now,
    updatedAt: now,
  }

  await setDoc(
    doc(db, PHOTOS_COLLECTION, id),
    stripUndefined({ ...record }),
  )

  if (previousPathToDelete) {
    await deleteStoragePath(previousPathToDelete)
  }

  return record
}

export async function deletePhoto(id: string): Promise<void> {
  const db = getDb()
  const snap = await getDoc(doc(db, PHOTOS_COLLECTION, id))
  const existing = snap.exists()
    ? normalizePhoto(snap.id, snap.data() as Record<string, unknown>)
    : null
  await deleteDoc(doc(db, PHOTOS_COLLECTION, id))
  if (existing) await deleteStoragePath(existing.storagePath)
}

// ==========================================
// Performance
// ==========================================

export async function fetchPerformance(
  subscriberId?: string,
): Promise<PerformanceRecord[]> {
  try {
    const db = getDb()
    const colRef = collection(db, PERFORMANCE_COLLECTION)
    const snap = subscriberId
      ? await getDocs(query(colRef, where("subscriberId", "==", subscriberId)))
      : await getDocs(colRef)
    return snap.docs
      .map((d) =>
        normalizePerformance(d.id, d.data() as Record<string, unknown>),
      )
      .sort(
        (a, b) =>
          new Date(b.recordedAt).getTime() - new Date(a.recordedAt).getTime(),
      )
  } catch (err) {
    console.warn("[progress] Failed to load performance:", err)
    throw err instanceof Error
      ? err
      : new Error("Failed to load performance records")
  }
}

export type SavePerformanceInput = {
  id?: string
  subscriberId: string
  recordedAt: string
  name: string
  value: number
  unit?: "kg" | "reps"
  notes?: string
  programId?: string
  exerciseId?: string
  createdBy?: string
}

export async function savePerformance(
  input: SavePerformanceInput,
): Promise<PerformanceRecord> {
  if (!input.subscriberId) throw new Error("Subscriber is required")
  const cleanName = input.name.trim()
  if (!cleanName) throw new Error("Lift / metric name is required")
  if (!Number.isFinite(input.value)) throw new Error("Value is required")

  const now = new Date().toISOString()
  const db = getDb()
  const existing = input.id
    ? await getDoc(doc(db, PERFORMANCE_COLLECTION, input.id))
    : null
  const id = existing?.id ?? doc(collection(db, PERFORMANCE_COLLECTION)).id

  const record: PerformanceRecord = {
    id,
    subscriberId: input.subscriberId,
    recordedAt: input.recordedAt || now,
    name: cleanName,
    value: input.value,
    unit: input.unit || "kg",
    notes: input.notes?.trim() || undefined,
    programId: input.programId,
    exerciseId: input.exerciseId,
    createdAt:
      typeof existing?.data()?.createdAt === "string"
        ? (existing.data()!.createdAt as string)
        : now,
    updatedAt: now,
    createdBy:
      input.createdBy ||
      (typeof existing?.data()?.createdBy === "string"
        ? (existing.data()!.createdBy as string)
        : undefined),
  }

  await setDoc(
    doc(db, PERFORMANCE_COLLECTION, id),
    stripUndefined({ ...record }),
  )
  return record
}

export async function deletePerformance(id: string): Promise<void> {
  await deleteDoc(doc(getDb(), PERFORMANCE_COLLECTION, id))
}
