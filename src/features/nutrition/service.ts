import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  setDoc,
  where,
  writeBatch,
} from "firebase/firestore"
import { getDb } from "@/lib/firebase/firestore"
import type {
  BilingualText,
  NutritionAdherenceLog,
  NutritionDay,
  NutritionProgram,
  ProgramFormat,
} from "@/types/program"

const NUTRITION_PROGRAMS_COLLECTION = "nutrition_programs"
const NUTRITION_LOGS_COLLECTION = "nutrition_logs"
const STORAGE_KEY_NUTRITION = "derpyfit_nutrition_programs_v1"
const STORAGE_KEY_NUTRITION_LOGS = "derpyfit_nutrition_logs_v1"

/** Weekly adherence target — matches computeAdherenceWeeks nutrition totals. */
const NUTRITION_ADHERENCE_WEEK_TOTAL = 7

function defaultNutritionAdherence() {
  return { done: 0, total: NUTRITION_ADHERENCE_WEEK_TOTAL }
}

function clearLegacyLocalCaches() {
  try {
    window.localStorage.removeItem(STORAGE_KEY_NUTRITION)
    window.localStorage.removeItem(STORAGE_KEY_NUTRITION_LOGS)
  } catch {
    // ignore
  }
}

clearLegacyLocalCaches()

function stripUndefined<T extends Record<string, unknown>>(obj: T): T {
  const out: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(obj)) {
    if (v !== undefined) {
      out[k] = v
    }
  }
  return out as T
}

function cloneDays(days: NutritionDay[]): NutritionDay[] {
  return JSON.parse(JSON.stringify(days)) as NutritionDay[]
}

function normalizeNutritionProgram(
  id: string,
  raw: Record<string, unknown>,
): NutritionProgram {
  const titleRaw = (raw.title ?? {}) as Record<string, string>
  return {
    id,
    title: {
      en: String(titleRaw.en ?? "Nutrition plan"),
      ar: String(titleRaw.ar ?? titleRaw.en ?? "خطة تغذية"),
    },
    description:
      raw.description && typeof raw.description === "object"
        ? {
            en: String(
              (raw.description as Record<string, unknown>).en ??
                (raw.description as Record<string, unknown>).ar ??
                "",
            ),
            ar: String(
              (raw.description as Record<string, unknown>).ar ??
                (raw.description as Record<string, unknown>).en ??
                "",
            ),
          }
        : undefined,
    format: raw.format === "pdf" ? "pdf" : "interactive",
    version: Math.max(1, Number(raw.version) || 1),
    status:
      raw.status === "template" || raw.status === "archived"
        ? raw.status
        : "active",
    subscriberId:
      typeof raw.subscriberId === "string" ? raw.subscriberId : undefined,
    templateId: typeof raw.templateId === "string" ? raw.templateId : undefined,
    previousVersionId:
      typeof raw.previousVersionId === "string"
        ? raw.previousVersionId
        : undefined,
    days: Array.isArray(raw.days) ? (raw.days as NutritionDay[]) : [],
    targetCalories:
      typeof raw.targetCalories === "number" ? raw.targetCalories : undefined,
    targetWaterLiters:
      typeof raw.targetWaterLiters === "number"
        ? raw.targetWaterLiters
        : undefined,
    macros:
      raw.macros && typeof raw.macros === "object"
        ? {
            proteinGrams:
              Number((raw.macros as Record<string, unknown>).proteinGrams) ||
              0,
            carbsGrams:
              Number((raw.macros as Record<string, unknown>).carbsGrams) || 0,
            fatsGrams:
              Number((raw.macros as Record<string, unknown>).fatsGrams) || 0,
          }
        : undefined,
    pdfContentId:
      typeof raw.pdfContentId === "string" ? raw.pdfContentId : undefined,
    pdfName:
      raw.pdfName && typeof raw.pdfName === "object"
        ? {
            en: String(
              (raw.pdfName as Record<string, unknown>).en ??
                (raw.pdfName as Record<string, unknown>).ar ??
                "",
            ),
            ar: String(
              (raw.pdfName as Record<string, unknown>).ar ??
                (raw.pdfName as Record<string, unknown>).en ??
                "",
            ),
          }
        : undefined,
    notes:
      raw.notes && typeof raw.notes === "object"
        ? {
            en: String(
              (raw.notes as Record<string, unknown>).en ??
                (raw.notes as Record<string, unknown>).ar ??
                "",
            ),
            ar: String(
              (raw.notes as Record<string, unknown>).ar ??
                (raw.notes as Record<string, unknown>).en ??
                "",
            ),
          }
        : undefined,
    disclaimerAcknowledged: raw.disclaimerAcknowledged !== false,
    adherence:
      raw.adherence && typeof raw.adherence === "object"
        ? {
            done: Number((raw.adherence as Record<string, unknown>).done) || 0,
            // Weekly cycle (matches admin/subscriber adherence week math)
            total:
              Number((raw.adherence as Record<string, unknown>).total) ||
              NUTRITION_ADHERENCE_WEEK_TOTAL,
          }
        : undefined,
    createdAt:
      typeof raw.createdAt === "string"
        ? raw.createdAt
        : new Date().toISOString(),
    updatedAt:
      typeof raw.updatedAt === "string"
        ? raw.updatedAt
        : new Date().toISOString(),
    archivedAt:
      typeof raw.archivedAt === "string" ? raw.archivedAt : undefined,
  }
}

function normalizeMealChecks(
  raw: unknown,
): NutritionAdherenceLog["mealChecks"] {
  if (!Array.isArray(raw)) return undefined
  const checks = raw
    .map((item) => {
      if (!item || typeof item !== "object") return null
      const row = item as Record<string, unknown>
      const slotId = typeof row.slotId === "string" ? row.slotId : ""
      const slotTitle =
        typeof row.slotTitle === "string" ? row.slotTitle : slotId
      if (!slotId) return null
      return {
        slotId,
        slotTitle,
        completed: Boolean(row.completed),
        updatedAt:
          typeof row.updatedAt === "string"
            ? row.updatedAt
            : new Date().toISOString(),
      }
    })
    .filter((item): item is NonNullable<typeof item> => Boolean(item))
  return checks.length ? checks : undefined
}

function normalizeMealPhotos(
  raw: unknown,
): NutritionAdherenceLog["mealPhotos"] {
  if (!Array.isArray(raw)) return undefined
  const photos = raw
    .map((item) => {
      if (!item || typeof item !== "object") return null
      const row = item as Record<string, unknown>
      const slotId = typeof row.slotId === "string" ? row.slotId : ""
      const slotTitle =
        typeof row.slotTitle === "string" ? row.slotTitle : slotId
      const photoUrl = typeof row.photoUrl === "string" ? row.photoUrl : ""
      if (!slotId || !photoUrl) return null
      return {
        slotId,
        slotTitle,
        photoUrl,
        storagePath:
          typeof row.storagePath === "string" ? row.storagePath : undefined,
        note: typeof row.note === "string" ? row.note : undefined,
        uploadedAt:
          typeof row.uploadedAt === "string"
            ? row.uploadedAt
            : new Date().toISOString(),
      }
    })
    .filter((item): item is NonNullable<typeof item> => Boolean(item))
  return photos.length ? photos : undefined
}

function normalizeNutritionLog(
  id: string,
  raw: Record<string, unknown>,
): NutritionAdherenceLog {
  return {
    ...(raw as Omit<NutritionAdherenceLog, "id">),
    id,
    subscriberId: String(raw.subscriberId ?? ""),
    programId: String(raw.programId ?? ""),
    date: String(raw.date ?? ""),
    dayId: typeof raw.dayId === "string" ? raw.dayId : undefined,
    weekday:
      raw.weekday === undefined || raw.weekday === null
        ? undefined
        : Math.max(0, Math.min(6, Number(raw.weekday) || 0)),
    status:
      raw.status === "mostly" ||
      raw.status === "deviated" ||
      raw.status === "skipped"
        ? raw.status
        : "adhered",
    mealChecks: normalizeMealChecks(raw.mealChecks),
    mealPhotos: normalizeMealPhotos(raw.mealPhotos),
    loggedAt:
      typeof raw.loggedAt === "string"
        ? raw.loggedAt
        : new Date().toISOString(),
  }
}

/** Admin unscoped list, or subscriber-scoped. Never auto-seeds demo. */
export async function listNutritionPrograms(
  subscriberId?: string,
): Promise<NutritionProgram[]> {
  try {
    const db = getDb()
    const colRef = collection(db, NUTRITION_PROGRAMS_COLLECTION)
    const snap = subscriberId
      ? await getDocs(query(colRef, where("subscriberId", "==", subscriberId)))
      : await getDocs(colRef)

    return snap.docs
      .map((d) =>
        normalizeNutritionProgram(d.id, d.data() as Record<string, unknown>),
      )
      .sort(
        (a, b) =>
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
      )
  } catch (err) {
    console.warn("[Firestore] Failed to read nutrition_programs:", err)
    throw err instanceof Error ? err : new Error("Failed to load nutrition")
  }
}

export async function fetchNutritionProgramById(
  programId: string,
): Promise<NutritionProgram | null> {
  if (!programId) return null
  try {
    const db = getDb()
    const snap = await getDoc(doc(db, NUTRITION_PROGRAMS_COLLECTION, programId))
    if (!snap.exists()) return null
    return normalizeNutritionProgram(
      snap.id,
      snap.data() as Record<string, unknown>,
    )
  } catch (err) {
    console.warn("[Firestore] Failed to read nutrition program:", err)
    return null
  }
}

export type SaveNutritionProgramInput = {
  id?: string
  title: BilingualText
  description?: BilingualText
  format: ProgramFormat
  status: "template" | "active" | "archived"
  subscriberId?: string
  templateId?: string
  days: NutritionDay[]
  targetCalories?: number
  targetWaterLiters?: number
  macros?: {
    proteinGrams: number
    carbsGrams: number
    fatsGrams: number
  }
  pdfContentId?: string
  pdfName?: BilingualText
  notes?: BilingualText
  disclaimerAcknowledged?: boolean
  createNewVersion?: boolean
}

async function archiveActiveNutritionForSubscriber(
  subscriberId: string,
  exceptId: string,
  now: string,
): Promise<void> {
  const db = getDb()
  const snap = await getDocs(
    query(
      collection(db, NUTRITION_PROGRAMS_COLLECTION),
      where("subscriberId", "==", subscriberId),
      where("status", "==", "active"),
    ),
  )
  if (snap.empty) return

  const batch = writeBatch(db)
  let writes = 0
  for (const d of snap.docs) {
    if (d.id === exceptId) continue
    const existing = normalizeNutritionProgram(
      d.id,
      d.data() as Record<string, unknown>,
    )
    batch.set(
      doc(db, NUTRITION_PROGRAMS_COLLECTION, d.id),
      stripUndefined({
        ...existing,
        status: "archived",
        archivedAt: now,
        updatedAt: now,
      }),
    )
    writes += 1
  }
  if (writes > 0) await batch.commit()
}

export async function saveNutritionProgram(
  input: SaveNutritionProgramInput,
): Promise<NutritionProgram> {
  const now = new Date().toISOString()
  const db = getDb()

  // Versioned edit for assigned plans (docs: retain previous nutrition plans)
  if (input.id && input.createNewVersion) {
    const existing = await fetchNutritionProgramById(input.id)
    if (!existing) throw new Error("Nutrition program not found")

    const archivedRecord: NutritionProgram = {
      ...existing,
      status: "archived",
      archivedAt: now,
      updatedAt: now,
    }

    const newActiveId = doc(collection(db, NUTRITION_PROGRAMS_COLLECTION)).id
    const newActiveRecord: NutritionProgram = {
      id: newActiveId,
      title: input.title,
      description: input.description,
      format: input.format,
      version: (existing.version || 1) + 1,
      status: input.status === "archived" ? "archived" : "active",
      subscriberId: input.subscriberId || existing.subscriberId,
      templateId: input.templateId || existing.templateId,
      previousVersionId: existing.id,
      days: cloneDays(input.days),
      targetCalories: input.targetCalories,
      targetWaterLiters: input.targetWaterLiters,
      macros: input.macros,
      pdfContentId: input.pdfContentId,
      pdfName: input.pdfName,
      notes: input.notes,
      disclaimerAcknowledged: input.disclaimerAcknowledged ?? true,
      adherence: defaultNutritionAdherence(),
      createdAt: now,
      updatedAt: now,
    }

    const batch = writeBatch(db)
    batch.set(
      doc(db, NUTRITION_PROGRAMS_COLLECTION, archivedRecord.id),
      stripUndefined({ ...archivedRecord }),
    )
    batch.set(
      doc(db, NUTRITION_PROGRAMS_COLLECTION, newActiveRecord.id),
      stripUndefined({ ...newActiveRecord }),
    )
    await batch.commit()
    return newActiveRecord
  }

  if (input.id) {
    const existing = await fetchNutritionProgramById(input.id)
    if (!existing) throw new Error("Nutrition program not found")

    const updated: NutritionProgram = {
      ...existing,
      title: input.title,
      description: input.description,
      format: input.format,
      status: input.status,
      subscriberId: input.subscriberId ?? existing.subscriberId,
      templateId: input.templateId ?? existing.templateId,
      days: cloneDays(input.days),
      targetCalories: input.targetCalories ?? existing.targetCalories,
      targetWaterLiters: input.targetWaterLiters ?? existing.targetWaterLiters,
      macros: input.macros ?? existing.macros,
      pdfContentId: input.pdfContentId ?? existing.pdfContentId,
      pdfName: input.pdfName ?? existing.pdfName,
      notes: input.notes,
      disclaimerAcknowledged:
        input.disclaimerAcknowledged ?? existing.disclaimerAcknowledged,
      updatedAt: now,
      archivedAt:
        input.status === "archived"
          ? existing.archivedAt ?? now
          : input.status === "active"
            ? undefined
            : existing.archivedAt,
      adherence:
        input.status === "active"
          ? existing.adherence ?? defaultNutritionAdherence()
          : existing.adherence,
    }

    if (
      existing.status === "archived" &&
      updated.status === "active" &&
      updated.subscriberId
    ) {
      await archiveActiveNutritionForSubscriber(
        updated.subscriberId,
        updated.id,
        now,
      )
    }

    await setDoc(
      doc(db, NUTRITION_PROGRAMS_COLLECTION, updated.id),
      stripUndefined({ ...updated }),
    )
    return updated
  }

  if (input.status === "active" && !input.subscriberId) {
    throw new Error("Assigned nutrition programs require a subscriber")
  }

  const newId = doc(collection(db, NUTRITION_PROGRAMS_COLLECTION)).id
  const newRecord: NutritionProgram = {
    id: newId,
    title: input.title,
    description: input.description,
    format: input.format,
    version: 1,
    status: input.status,
    subscriberId: input.subscriberId,
    templateId: input.templateId,
    days: cloneDays(input.days),
    targetCalories: input.targetCalories,
    targetWaterLiters: input.targetWaterLiters,
    macros: input.macros,
    pdfContentId: input.pdfContentId,
    pdfName: input.pdfName,
    notes: input.notes,
    disclaimerAcknowledged: input.disclaimerAcknowledged ?? true,
    adherence:
      input.status === "active" ? defaultNutritionAdherence() : undefined,
    createdAt: now,
    updatedAt: now,
  }

  if (newRecord.status === "active" && newRecord.subscriberId) {
    await archiveActiveNutritionForSubscriber(
      newRecord.subscriberId,
      newRecord.id,
      now,
    )
  }

  await setDoc(
    doc(db, NUTRITION_PROGRAMS_COLLECTION, newRecord.id),
    stripUndefined({ ...newRecord }),
  )
  return newRecord
}

export type AssignNutritionInput = {
  subscriberId: string
  subscriberName?: string
  templateId?: string
  customTitle?: BilingualText
  format?: ProgramFormat
  days?: NutritionDay[]
  targetCalories?: number
  targetWaterLiters?: number
  macros?: {
    proteinGrams: number
    carbsGrams: number
    fatsGrams: number
  }
  pdfContentId?: string
  pdfName?: BilingualText
  notes?: BilingualText
}

/**
 * Assign a nutrition plan — clones template days so template edits never
 * overwrite assigned history (docs: reusable templates vs subscriber plans).
 */
export async function assignNutritionProgram(
  input: AssignNutritionInput,
): Promise<NutritionProgram> {
  if (!input.subscriberId) throw new Error("Subscriber is required")

  const now = new Date().toISOString()
  const db = getDb()

  let title = input.customTitle
  let format: ProgramFormat = input.format || "interactive"
  let days = input.days ? cloneDays(input.days) : []
  let targetCalories = input.targetCalories
  let targetWaterLiters = input.targetWaterLiters
  let macros = input.macros
  let pdfContentId = input.pdfContentId
  let pdfName = input.pdfName
  let previousVersionId: string | undefined
  let nextVersion = 1

  if (input.templateId) {
    const template = await fetchNutritionProgramById(input.templateId)
    if (!template || template.status !== "template") {
      throw new Error("Nutrition template not found")
    }
    if (!title) {
      const subLabel = input.subscriberName || "Subscriber"
      title = {
        en: `${subLabel} — ${template.title.en}`,
        ar: `${subLabel} — ${template.title.ar}`,
      }
    }
    format = template.format
    days = cloneDays(template.days)
    targetCalories = targetCalories ?? template.targetCalories
    targetWaterLiters = targetWaterLiters ?? template.targetWaterLiters
    macros = macros ?? template.macros
    pdfContentId = template.pdfContentId
    pdfName = template.pdfName
  }

  if (!title) {
    title = {
      en: `${input.subscriberName || "Subscriber"} — Custom Nutrition Plan`,
      ar: `${input.subscriberName || "المشترك"} — خطة تغذية مخصصة`,
    }
  }

  const activeSnap = await getDocs(
    query(
      collection(db, NUTRITION_PROGRAMS_COLLECTION),
      where("subscriberId", "==", input.subscriberId),
      where("status", "==", "active"),
    ),
  )

  const batch = writeBatch(db)
  for (const d of activeSnap.docs) {
    const existing = normalizeNutritionProgram(
      d.id,
      d.data() as Record<string, unknown>,
    )
    previousVersionId = existing.id
    nextVersion = Math.max(nextVersion, (existing.version || 1) + 1)
    batch.set(
      doc(db, NUTRITION_PROGRAMS_COLLECTION, existing.id),
      stripUndefined({
        ...existing,
        status: "archived",
        archivedAt: now,
        updatedAt: now,
      }),
    )
  }

  const newId = doc(collection(db, NUTRITION_PROGRAMS_COLLECTION)).id
  const newAssignment: NutritionProgram = {
    id: newId,
    title,
    format,
    version: nextVersion,
    status: "active",
    subscriberId: input.subscriberId,
    templateId: input.templateId,
    previousVersionId,
    days,
    targetCalories,
    targetWaterLiters,
    macros,
    pdfContentId,
    pdfName,
    notes: input.notes,
    disclaimerAcknowledged: true,
    adherence: defaultNutritionAdherence(),
    createdAt: now,
    updatedAt: now,
  }

  batch.set(
    doc(db, NUTRITION_PROGRAMS_COLLECTION, newAssignment.id),
    stripUndefined({ ...newAssignment }),
  )
  await batch.commit()
  return newAssignment
}

export async function archiveNutritionProgram(
  id: string,
): Promise<NutritionProgram> {
  const existing = await fetchNutritionProgramById(id)
  if (!existing) throw new Error("Nutrition program not found")

  const now = new Date().toISOString()
  const db = getDb()
  const updated: NutritionProgram = {
    ...existing,
    status: "archived",
    archivedAt: now,
    updatedAt: now,
  }
  await setDoc(
    doc(db, NUTRITION_PROGRAMS_COLLECTION, id),
    stripUndefined({ ...updated }),
  )
  return updated
}

export async function restoreNutritionProgram(
  id: string,
): Promise<NutritionProgram> {
  const existing = await fetchNutritionProgramById(id)
  if (!existing) throw new Error("Nutrition program not found")

  const now = new Date().toISOString()
  const db = getDb()
  const nextStatus: NutritionProgram["status"] = existing.subscriberId
    ? "active"
    : "template"

  if (nextStatus === "active" && existing.subscriberId) {
    await archiveActiveNutritionForSubscriber(
      existing.subscriberId,
      existing.id,
      now,
    )
  }

  const updated: NutritionProgram = {
    ...existing,
    status: nextStatus,
    archivedAt: undefined,
    updatedAt: now,
    adherence:
      nextStatus === "active"
        ? existing.adherence ?? defaultNutritionAdherence()
        : existing.adherence,
  }

  await setDoc(
    doc(db, NUTRITION_PROGRAMS_COLLECTION, id),
    stripUndefined({ ...updated }),
  )
  return updated
}

export async function deleteNutritionProgram(id: string): Promise<void> {
  const existing = await fetchNutritionProgramById(id)
  if (!existing) return
  // Assigned / historical versions must stay for History — archive instead of purge.
  if (existing.subscriberId) {
    throw new Error(
      "Assigned nutrition plans cannot be permanently deleted. Archive them to preserve subscriber history.",
    )
  }
  const db = getDb()
  await deleteDoc(doc(db, NUTRITION_PROGRAMS_COLLECTION, id))
}

export async function listNutritionLogs(
  subscriberId?: string,
): Promise<NutritionAdherenceLog[]> {
  try {
    const db = getDb()
    const colRef = collection(db, NUTRITION_LOGS_COLLECTION)
    const snap = subscriberId
      ? await getDocs(query(colRef, where("subscriberId", "==", subscriberId)))
      : await getDocs(colRef)

    return snap.docs
      .map((d) =>
        normalizeNutritionLog(d.id, d.data() as Record<string, unknown>),
      )
      .sort(
        (a, b) =>
          new Date(b.loggedAt).getTime() - new Date(a.loggedAt).getTime(),
      )
  } catch (err) {
    console.warn("[Firestore] Failed to read nutrition_logs:", err)
    throw err instanceof Error
      ? err
      : new Error("Failed to load nutrition logs")
  }
}

/**
 * Subscriber nutrition adherence — secured Cloud Function.
 * Forces auth uid ownership, validates active assigned plan, upserts same-day log,
 * bumps adherence counters server-side.
 */
export async function logNutritionAdherence(
  input: Omit<NutritionAdherenceLog, "id" | "loggedAt">,
): Promise<NutritionAdherenceLog> {
  const { callLogNutritionAdherence } = await import("@/lib/firebase/callables")
  const result = await callLogNutritionAdherence({
    programId: input.programId,
    date: input.date,
    dayId: input.dayId,
    weekday: input.weekday,
    status: input.status,
    caloriesActual: input.caloriesActual,
    waterLitersActual: input.waterLitersActual,
    notes: input.notes,
    // subscriberId intentionally omitted — server binds to auth.uid
  })

  const raw = result.log
  return normalizeNutritionLog(raw.id, raw as Record<string, unknown>)
}

const MEAL_PHOTO_MAX_BYTES = 8 * 1024 * 1024

function mealPhotoExtension(mimeType?: string | null): string {
  const mime = (mimeType || "").toLowerCase()
  if (mime.includes("png")) return "png"
  if (mime.includes("webp")) return "webp"
  return "jpg"
}

export async function uploadMealVerificationPhoto(input: {
  subscriberId: string
  programId: string
  date: string
  slotId: string
  file: File
  onProgress?: (percent: number) => void
}): Promise<{ photoUrl: string; storagePath: string }> {
  if (!input.file.type.startsWith("image/")) {
    throw new Error("Please select a valid image file")
  }
  if (input.file.size > MEAL_PHOTO_MAX_BYTES) {
    throw new Error("Meal photo must be under 8 MB")
  }

  const { getDownloadURL, ref, uploadBytesResumable } = await import(
    "firebase/storage"
  )
  const { getFirebaseStorage } = await import("@/lib/firebase/storage")

  const safe = (value: string) =>
    value.replace(/[^a-zA-Z0-9._\-\u0600-\u06FF]/g, "_").slice(0, 64) || "x"
  const ext = mealPhotoExtension(input.file.type)
  const storagePath = `nutrition/meal-photos/${safe(input.subscriberId)}/${safe(input.programId)}/${safe(input.date)}/${safe(input.slotId)}/${Date.now()}.${ext}`
  const storageRef = ref(getFirebaseStorage(), storagePath)
  const task = uploadBytesResumable(storageRef, input.file, {
    contentType: input.file.type || "image/jpeg",
    customMetadata: {
      uploadedAt: new Date().toISOString(),
      slotId: input.slotId,
    },
  })

  await new Promise<void>((resolve, reject) => {
    task.on(
      "state_changed",
      (snap) => {
        if (!input.onProgress || snap.totalBytes <= 0) return
        input.onProgress(
          Math.round((snap.bytesTransferred / snap.totalBytes) * 100),
        )
      },
      reject,
      () => resolve(),
    )
  })

  const photoUrl = await getDownloadURL(task.snapshot.ref)
  return { photoUrl, storagePath }
}

export type UpsertNutritionMealProgressInput = {
  programId: string
  date?: string
  dayId?: string
  weekday?: number
  mealCheck?: {
    slotId: string
    slotTitle: string
    completed: boolean
  }
  mealChecks?: Array<{
    slotId: string
    slotTitle: string
    completed: boolean
  }>
  mealPhoto?: {
    slotId: string
    slotTitle: string
    photoUrl: string
    storagePath?: string
    note?: string
  }
}

export async function upsertNutritionMealProgress(
  input: UpsertNutritionMealProgressInput,
): Promise<NutritionAdherenceLog> {
  const { callUpsertNutritionMealProgress } = await import(
    "@/lib/firebase/callables"
  )
  const result = await callUpsertNutritionMealProgress({
    programId: input.programId,
    date: input.date,
    dayId: input.dayId,
    weekday: input.weekday,
    mealCheck: input.mealCheck,
    mealChecks: input.mealChecks,
    mealPhoto: input.mealPhoto,
  })
  return normalizeNutritionLog(
    result.log.id,
    result.log as Record<string, unknown>,
  )
}
