import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  query,
  setDoc,
  where,
} from "firebase/firestore"
import { getDb } from "@/lib/firebase/firestore"
import {
  DEMO_MEASUREMENTS,
  DEMO_PHOTOS,
  DEMO_LIFTS,
} from "@/features/progress/demo"
import type {
  BodyMeasurement,
  PerformanceRecord,
  ProgressPhoto,
  ProgressPhotoPose,
} from "@/types/progress"

const MEASUREMENTS_COLLECTION = "progress_measurements"
const PHOTOS_COLLECTION = "progress_photos"
const PERFORMANCE_COLLECTION = "progress_performance"

const STORAGE_KEY_MEASUREMENTS = "derpyfit_progress_measurements_v1"
const STORAGE_KEY_PHOTOS = "derpyfit_progress_photos_v1"
const STORAGE_KEY_PERFORMANCE = "derpyfit_progress_performance_v1"

function readLocalCache<T>(key: string): T[] | null {
  if (typeof window === "undefined") return null
  try {
    const raw = window.localStorage.getItem(key)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? (parsed as T[]) : null
  } catch {
    return null
  }
}

function writeLocalCache<T>(key: string, items: T[]): void {
  if (typeof window === "undefined") return
  try {
    window.localStorage.setItem(key, JSON.stringify(items))
  } catch {
    // Ignore storage quota limits
  }
}

function stripUndefined<T extends Record<string, unknown>>(obj: T): T {
  const out: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(obj)) {
    if (v !== undefined) {
      out[k] = v
    }
  }
  return out as T
}

// ==========================================
// Measurements
// ==========================================

export async function fetchMeasurements(
  subscriberId?: string,
): Promise<BodyMeasurement[]> {
  const db = getDb()
  if (db) {
    try {
      const colRef = collection(db, MEASUREMENTS_COLLECTION)
      const snap = subscriberId
        ? await getDocs(query(colRef, where("subscriberId", "==", subscriberId)))
        : await getDocs(colRef)
      if (!snap.empty) {
        const items = snap.docs.map((d) => d.data() as BodyMeasurement)
        if (!subscriberId) writeLocalCache(STORAGE_KEY_MEASUREMENTS, items)
        return items
      }
      if (subscriberId) return []
    } catch (err) {
      console.warn("Firestore fetchMeasurements error, falling back to cache/demo:", err)
    }
  }

  const cached = readLocalCache<BodyMeasurement>(STORAGE_KEY_MEASUREMENTS)
  const all = cached && cached.length ? cached : DEMO_MEASUREMENTS
  if (!cached) writeLocalCache(STORAGE_KEY_MEASUREMENTS, DEMO_MEASUREMENTS)
  return subscriberId
    ? all.filter((m) => m.subscriberId === subscriberId)
    : all
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
}

export async function saveMeasurement(input: SaveMeasurementInput): Promise<BodyMeasurement> {
  const current = await fetchMeasurements()
  const measurementId = input.id || `m-${Date.now()}`
  const record: BodyMeasurement = {
    id: measurementId,
    subscriberId: input.subscriberId,
    recordedAt: input.recordedAt || new Date().toISOString(),
    weightKg: input.weightKg,
    chestCm: input.chestCm,
    waistCm: input.waistCm,
    hipsCm: input.hipsCm,
    armsCm: input.armsCm,
    thighsCm: input.thighsCm,
    notes: input.notes,
  }

  const existingIndex = current.findIndex((m) => m.id === measurementId)
  const next = existingIndex >= 0
    ? current.map((m) => (m.id === measurementId ? record : m))
    : [record, ...current]

  writeLocalCache(STORAGE_KEY_MEASUREMENTS, next)

  const db = getDb()
  if (db) {
    try {
      await setDoc(
        doc(db, MEASUREMENTS_COLLECTION, measurementId),
        stripUndefined(record as unknown as Record<string, unknown>),
        { merge: true },
      )
    } catch (err) {
      console.warn("Firestore saveMeasurement error:", err)
    }
  }

  return record
}

export async function deleteMeasurement(id: string): Promise<void> {
  const current = await fetchMeasurements()
  const next = current.filter((m) => m.id !== id)
  writeLocalCache(STORAGE_KEY_MEASUREMENTS, next)

  const db = getDb()
  if (db) {
    try {
      await deleteDoc(doc(db, MEASUREMENTS_COLLECTION, id))
    } catch (err) {
      console.warn("Firestore deleteMeasurement error:", err)
    }
  }
}

// ==========================================
// Photos
// ==========================================

export async function fetchPhotos(
  subscriberId?: string,
): Promise<ProgressPhoto[]> {
  const db = getDb()
  if (db) {
    try {
      const colRef = collection(db, PHOTOS_COLLECTION)
      const snap = subscriberId
        ? await getDocs(query(colRef, where("subscriberId", "==", subscriberId)))
        : await getDocs(colRef)
      if (!snap.empty) {
        const items = snap.docs.map((d) => d.data() as ProgressPhoto)
        if (!subscriberId) writeLocalCache(STORAGE_KEY_PHOTOS, items)
        return items
      }
      if (subscriberId) return []
    } catch (err) {
      console.warn("Firestore fetchPhotos error, falling back to cache/demo:", err)
    }
  }

  const cached = readLocalCache<ProgressPhoto>(STORAGE_KEY_PHOTOS)
  const all = cached && cached.length ? cached : DEMO_PHOTOS
  if (!cached) writeLocalCache(STORAGE_KEY_PHOTOS, DEMO_PHOTOS)
  return subscriberId
    ? all.filter((p) => p.subscriberId === subscriberId)
    : all
}

export type SavePhotoInput = {
  id?: string
  subscriberId: string
  storagePath: string
  takenAt: string
  pose?: ProgressPhotoPose
  caption?: string
}

export async function savePhoto(input: SavePhotoInput): Promise<ProgressPhoto> {
  const current = await fetchPhotos()
  const photoId = input.id || `p-${Date.now()}`
  const now = new Date().toISOString()
  const record: ProgressPhoto = {
    id: photoId,
    subscriberId: input.subscriberId,
    storagePath: input.storagePath,
    takenAt: input.takenAt || now,
    pose: input.pose || "front",
    caption: input.caption,
    createdAt: now,
  }

  const existingIndex = current.findIndex((p) => p.id === photoId)
  const next = existingIndex >= 0
    ? current.map((p) => (p.id === photoId ? record : p))
    : [record, ...current]

  writeLocalCache(STORAGE_KEY_PHOTOS, next)

  const db = getDb()
  if (db) {
    try {
      await setDoc(
        doc(db, PHOTOS_COLLECTION, photoId),
        stripUndefined(record as unknown as Record<string, unknown>),
        { merge: true },
      )
    } catch (err) {
      console.warn("Firestore savePhoto error:", err)
    }
  }

  return record
}

export async function deletePhoto(id: string): Promise<void> {
  const current = await fetchPhotos()
  const next = current.filter((p) => p.id !== id)
  writeLocalCache(STORAGE_KEY_PHOTOS, next)

  const db = getDb()
  if (db) {
    try {
      await deleteDoc(doc(db, PHOTOS_COLLECTION, id))
    } catch (err) {
      console.warn("Firestore deletePhoto error:", err)
    }
  }
}

// ==========================================
// Performance / Lifts
// ==========================================

export async function fetchPerformance(
  subscriberId?: string,
): Promise<PerformanceRecord[]> {
  const db = getDb()
  if (db) {
    try {
      const colRef = collection(db, PERFORMANCE_COLLECTION)
      const snap = subscriberId
        ? await getDocs(query(colRef, where("subscriberId", "==", subscriberId)))
        : await getDocs(colRef)
      if (!snap.empty) {
        const items = snap.docs.map((d) => d.data() as PerformanceRecord)
        if (!subscriberId) writeLocalCache(STORAGE_KEY_PERFORMANCE, items)
        return items
      }
      if (subscriberId) return []
    } catch (err) {
      console.warn("Firestore fetchPerformance error, falling back to cache/demo:", err)
    }
  }

  const cached = readLocalCache<PerformanceRecord>(STORAGE_KEY_PERFORMANCE)
  const all = cached && cached.length ? cached : DEMO_LIFTS
  if (!cached) writeLocalCache(STORAGE_KEY_PERFORMANCE, DEMO_LIFTS)
  return subscriberId
    ? all.filter((l) => l.subscriberId === subscriberId)
    : all
}

export type SavePerformanceInput = {
  id?: string
  subscriberId: string
  recordedAt: string
  name: string
  value: number
  unit?: "kg" | "reps"
  notes?: string
}

export async function savePerformance(input: SavePerformanceInput): Promise<PerformanceRecord> {
  const current = await fetchPerformance()
  const perfId = input.id || `l-${Date.now()}`
  const record: PerformanceRecord = {
    id: perfId,
    subscriberId: input.subscriberId,
    recordedAt: input.recordedAt || new Date().toISOString(),
    name: input.name,
    value: input.value,
    unit: input.unit || "kg",
    notes: input.notes,
  }

  const existingIndex = current.findIndex((l) => l.id === perfId)
  const next = existingIndex >= 0
    ? current.map((l) => (l.id === perfId ? record : l))
    : [record, ...current]

  writeLocalCache(STORAGE_KEY_PERFORMANCE, next)

  const db = getDb()
  if (db) {
    try {
      await setDoc(
        doc(db, PERFORMANCE_COLLECTION, perfId),
        stripUndefined(record as unknown as Record<string, unknown>),
        { merge: true },
      )
    } catch (err) {
      console.warn("Firestore savePerformance error:", err)
    }
  }

  return record
}

export async function deletePerformance(id: string): Promise<void> {
  const current = await fetchPerformance()
  const next = current.filter((l) => l.id !== id)
  writeLocalCache(STORAGE_KEY_PERFORMANCE, next)

  const db = getDb()
  if (db) {
    try {
      await deleteDoc(doc(db, PERFORMANCE_COLLECTION, id))
    } catch (err) {
      console.warn("Firestore deletePerformance error:", err)
    }
  }
}

