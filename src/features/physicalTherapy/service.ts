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
  buildRestrictionMatchTokens,
  normalizeBilingual,
} from "@/features/physicalTherapy/paths"
import { getDb } from "@/lib/firebase/firestore"
import type {
  PhysicalTherapyRecord,
  PTAffectedArea,
  PTMovementRestriction,
  PTRehabExercise,
  PTSeverity,
  PTStatus,
} from "@/types/physicalTherapy"

const PT_COLLECTION = "physical_therapy"
const LEGACY_CACHE_KEY = "derpyfit_physical_therapy_cache"

try {
  window.localStorage.removeItem(LEGACY_CACHE_KEY)
} catch {
  // ignore
}

const AFFECTED_AREAS: PTAffectedArea[] = [
  "shoulder",
  "knee",
  "lower_back",
  "neck",
  "ankle",
  "wrist",
  "hip",
  "elbow",
  "other",
]
const SEVERITIES: PTSeverity[] = ["mild", "moderate", "severe"]
const STATUSES: PTStatus[] = ["active", "recovering", "cleared"]

function stripUndefined<T extends Record<string, unknown>>(obj: T): T {
  const out: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(obj)) {
    if (v !== undefined) out[k] = v
  }
  return out as T
}

function asArea(value: unknown): PTAffectedArea {
  return AFFECTED_AREAS.includes(value as PTAffectedArea)
    ? (value as PTAffectedArea)
    : "other"
}

function asSeverity(value: unknown): PTSeverity {
  return SEVERITIES.includes(value as PTSeverity)
    ? (value as PTSeverity)
    : "mild"
}

function asStatus(value: unknown): PTStatus {
  return STATUSES.includes(value as PTStatus)
    ? (value as PTStatus)
    : "active"
}

function normalizeRestriction(
  raw: Record<string, unknown>,
  index: number,
): PTMovementRestriction {
  const prohibited = normalizeBilingual(raw.prohibited)
  const tokens = Array.isArray(raw.matchTokens)
    ? raw.matchTokens.map(String).filter(Boolean)
    : buildRestrictionMatchTokens(prohibited)
  return {
    id: String(raw.id || `res-${index + 1}`),
    prohibited,
    safeAlternative: normalizeBilingual(raw.safeAlternative),
    reason: raw.reason ? normalizeBilingual(raw.reason) : undefined,
    equipment:
      typeof raw.equipment === "string" && raw.equipment.trim()
        ? raw.equipment.trim()
        : undefined,
    matchTokens: tokens,
  }
}

function normalizeRehabExercise(
  raw: Record<string, unknown>,
  index: number,
): PTRehabExercise {
  return {
    id: String(raw.id || `reh-${index + 1}`),
    name: normalizeBilingual(raw.name),
    sets:
      typeof raw.sets === "number" && Number.isFinite(raw.sets) && raw.sets > 0
        ? Math.round(raw.sets)
        : 3,
    reps: typeof raw.reps === "string" && raw.reps.trim() ? raw.reps.trim() : "12-15",
    frequency:
      typeof raw.frequency === "string" && raw.frequency.trim()
        ? raw.frequency.trim()
        : "3x / week",
    notes: raw.notes ? normalizeBilingual(raw.notes) : undefined,
    videoContentId:
      typeof raw.videoContentId === "string" && raw.videoContentId.trim()
        ? raw.videoContentId.trim()
        : undefined,
    videoUrl:
      typeof raw.videoUrl === "string" && raw.videoUrl.trim()
        ? raw.videoUrl.trim()
        : undefined,
  }
}

export function normalizePhysicalTherapyRecord(
  id: string,
  raw: Record<string, unknown>,
): PhysicalTherapyRecord {
  const restrictions = Array.isArray(raw.restrictions)
    ? raw.restrictions.map((item, i) =>
        normalizeRestriction((item ?? {}) as Record<string, unknown>, i),
      )
    : []
  const rehabExercises = Array.isArray(raw.rehabExercises)
    ? raw.rehabExercises.map((item, i) =>
        normalizeRehabExercise((item ?? {}) as Record<string, unknown>, i),
      )
    : []

  return {
    id,
    subscriberId: String(raw.subscriberId ?? ""),
    subscriberName:
      typeof raw.subscriberName === "string" ? raw.subscriberName : undefined,
    injuryTitle: normalizeBilingual(raw.injuryTitle, id),
    affectedArea: asArea(raw.affectedArea),
    severity: asSeverity(raw.severity),
    status: asStatus(raw.status),
    diagnosisDate:
      typeof raw.diagnosisDate === "string" && raw.diagnosisDate
        ? raw.diagnosisDate.slice(0, 10)
        : new Date().toISOString().slice(0, 10),
    clearanceDate:
      typeof raw.clearanceDate === "string" ? raw.clearanceDate.slice(0, 10) : null,
    nextEvaluationDate:
      typeof raw.nextEvaluationDate === "string"
        ? raw.nextEvaluationDate.slice(0, 10)
        : null,
    restrictions,
    rehabExercises,
    therapistNotes: raw.therapistNotes
      ? normalizeBilingual(raw.therapistNotes)
      : undefined,
    createdAt:
      typeof raw.createdAt === "string" ? raw.createdAt : new Date().toISOString(),
    updatedAt:
      typeof raw.updatedAt === "string" ? raw.updatedAt : new Date().toISOString(),
    createdBy: typeof raw.createdBy === "string" ? raw.createdBy : undefined,
    updatedBy: typeof raw.updatedBy === "string" ? raw.updatedBy : undefined,
  }
}

/** Admin unscoped list, or subscriber-scoped. Never auto-seeds demo. */
export async function listPhysicalTherapyRecords(
  subscriberId?: string,
): Promise<PhysicalTherapyRecord[]> {
  try {
    const db = getDb()
    const colRef = collection(db, PT_COLLECTION)
    const snap = subscriberId
      ? await getDocs(query(colRef, where("subscriberId", "==", subscriberId)))
      : await getDocs(colRef)

    return snap.docs
      .map((d) =>
        normalizePhysicalTherapyRecord(
          d.id,
          d.data() as Record<string, unknown>,
        ),
      )
      .sort(
        (a, b) =>
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
      )
  } catch (err) {
    console.warn("[physicalTherapy] Failed to load records:", err)
    throw err instanceof Error
      ? err
      : new Error("Failed to load physical therapy records")
  }
}

/** @deprecated Prefer listPhysicalTherapyRecords */
export const fetchPTRecords = listPhysicalTherapyRecords

export async function fetchSubscriberPTRecords(
  subscriberId: string,
): Promise<PhysicalTherapyRecord[]> {
  if (!subscriberId) return []
  return listPhysicalTherapyRecords(subscriberId)
}

export async function getPhysicalTherapyRecordById(
  id: string,
): Promise<PhysicalTherapyRecord | null> {
  if (!id) return null
  try {
    const snap = await getDoc(doc(getDb(), PT_COLLECTION, id))
    if (!snap.exists()) return null
    return normalizePhysicalTherapyRecord(
      snap.id,
      snap.data() as Record<string, unknown>,
    )
  } catch (err) {
    console.warn("[physicalTherapy] Failed to read record:", err)
    return null
  }
}

/** Primary open case (active/recovering) for workout contraindication banners. */
export async function fetchSubscriberPTRecord(
  subscriberId: string,
): Promise<PhysicalTherapyRecord | null> {
  const list = await fetchSubscriberPTRecords(subscriberId)
  if (!list.length) return null
  return (
    list.find((r) => r.status === "active" || r.status === "recovering") ??
    list[0]
  )
}

export type SavePTRecordInput = {
  id?: string
  subscriberId: string
  injuryTitle: PhysicalTherapyRecord["injuryTitle"]
  affectedArea: PTAffectedArea
  severity?: PTSeverity
  status?: PTStatus
  diagnosisDate?: string
  clearanceDate?: string | null
  nextEvaluationDate?: string | null
  restrictions?: PTMovementRestriction[]
  rehabExercises?: PTRehabExercise[]
  therapistNotes?: PhysicalTherapyRecord["therapistNotes"]
  /** @deprecated Not required — resolve in UI */
  subscriberName?: string
  createdBy?: string
  updatedBy?: string
}

export async function savePhysicalTherapyRecord(
  input: SavePTRecordInput,
): Promise<PhysicalTherapyRecord> {
  if (!input.subscriberId) throw new Error("Subscriber is required")
  const titleEn = input.injuryTitle?.en?.trim() || input.injuryTitle?.ar?.trim()
  const titleAr = input.injuryTitle?.ar?.trim() || input.injuryTitle?.en?.trim()
  if (!titleEn && !titleAr) throw new Error("Injury title is required")

  const now = new Date().toISOString()
  const db = getDb()
  const existingSnap = input.id
    ? await getDoc(doc(db, PT_COLLECTION, input.id))
    : null
  const existing = existingSnap?.exists()
    ? normalizePhysicalTherapyRecord(
        existingSnap.id,
        existingSnap.data() as Record<string, unknown>,
      )
    : null

  const id = existing?.id ?? doc(collection(db, PT_COLLECTION)).id
  const status = input.status ?? existing?.status ?? "active"
  const clearanceDate =
    status === "cleared"
      ? input.clearanceDate ||
        existing?.clearanceDate ||
        now.slice(0, 10)
      : null

  const restrictions = (input.restrictions ?? existing?.restrictions ?? [])
    .filter((r) => r.prohibited.en.trim() || r.prohibited.ar.trim())
    .map((r, i) =>
      normalizeRestriction(
        {
          ...r,
          matchTokens:
            r.matchTokens?.length
              ? r.matchTokens
              : buildRestrictionMatchTokens(r.prohibited),
        } as unknown as Record<string, unknown>,
        i,
      ),
    )

  const rehabExercises = (input.rehabExercises ?? existing?.rehabExercises ?? [])
    .filter((rx) => rx.name.en.trim() || rx.name.ar.trim())
    .map((rx, i) =>
      normalizeRehabExercise(rx as unknown as Record<string, unknown>, i),
    )

  const record: PhysicalTherapyRecord = {
    id,
    subscriberId: input.subscriberId,
    injuryTitle: {
      en: titleEn || titleAr || "",
      ar: titleAr || titleEn || "",
    },
    affectedArea: input.affectedArea,
    severity: input.severity ?? existing?.severity ?? "mild",
    status,
    diagnosisDate:
      (input.diagnosisDate || existing?.diagnosisDate || now).slice(0, 10),
    clearanceDate,
    nextEvaluationDate: input.nextEvaluationDate
      ? input.nextEvaluationDate.slice(0, 10)
      : input.nextEvaluationDate === null
        ? null
        : (existing?.nextEvaluationDate ?? null),
    restrictions,
    rehabExercises,
    therapistNotes: input.therapistNotes
      ? normalizeBilingual(input.therapistNotes)
      : existing?.therapistNotes,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
    createdBy: existing?.createdBy ?? input.createdBy,
    updatedBy: input.updatedBy ?? input.createdBy ?? existing?.updatedBy,
  }

  await setDoc(
    doc(db, PT_COLLECTION, id),
    stripUndefined({ ...record }),
  )
  return record
}

/** @deprecated Prefer savePhysicalTherapyRecord */
export const savePTRecord = savePhysicalTherapyRecord

export async function deletePhysicalTherapyRecord(id: string): Promise<void> {
  await deleteDoc(doc(getDb(), PT_COLLECTION, id))
}

/** @deprecated Prefer deletePhysicalTherapyRecord */
export const deletePTRecord = deletePhysicalTherapyRecord

/**
 * True when a workout exercise name conflicts with an active restriction.
 * Uses matchTokens when present, otherwise bilingual prohibited text.
 */
export function exerciseConflictsWithRestriction(
  exerciseName: string,
  restriction: PTMovementRestriction,
): boolean {
  const haystack = exerciseName.toLowerCase().trim()
  if (!haystack) return false
  const tokens =
    restriction.matchTokens?.length
      ? restriction.matchTokens
      : buildRestrictionMatchTokens(restriction.prohibited)
  if (tokens.some((token) => haystack.includes(token))) return true
  const prohibited = `${restriction.prohibited.en} ${restriction.prohibited.ar}`
    .toLowerCase()
    .trim()
  return Boolean(prohibited) && haystack.includes(prohibited)
}
