import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  setDoc,
  writeBatch,
} from "firebase/firestore"
import { getDb } from "@/lib/firebase/firestore"
import {
  DEMO_NUTRITION,
  INITIAL_NUTRITION_LOGS,
} from "@/features/nutrition/demo"
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

export async function listNutritionPrograms(): Promise<NutritionProgram[]> {
  const db = getDb()
  if (db) {
    try {
      const snap = await getDocs(collection(db, NUTRITION_PROGRAMS_COLLECTION))
      if (!snap.empty) {
        const items = snap.docs.map((d) => ({
          ...(d.data() as NutritionProgram),
          id: d.id,
        }))
        writeLocalCache(STORAGE_KEY_NUTRITION, items)
        return items
      }

      // Seed initial demo data to Firestore if empty
      const batch = writeBatch(db)
      for (const item of DEMO_NUTRITION) {
        batch.set(
          doc(db, NUTRITION_PROGRAMS_COLLECTION, item.id),
          stripUndefined({ ...item }),
        )
      }
      await batch.commit().catch(() => null)
      writeLocalCache(STORAGE_KEY_NUTRITION, DEMO_NUTRITION)
      return DEMO_NUTRITION
    } catch {
      // Fall through to cache
    }
  }

  const cached = readLocalCache<NutritionProgram>(STORAGE_KEY_NUTRITION)
  if (cached && cached.length > 0) {
    return cached
  }

  writeLocalCache(STORAGE_KEY_NUTRITION, DEMO_NUTRITION)
  return DEMO_NUTRITION
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

export async function saveNutritionProgram(
  input: SaveNutritionProgramInput,
): Promise<NutritionProgram> {
  const current = await listNutritionPrograms()
  const now = new Date().toISOString()

  // Case 1: Version bump when requested on existing assigned plan
  if (input.id && input.createNewVersion) {
    const existingIndex = current.findIndex((p) => p.id === input.id)
    if (existingIndex >= 0) {
      const existing = current[existingIndex]
      const archivedRecord: NutritionProgram = {
        ...existing,
        status: "archived",
        archivedAt: now,
        updatedAt: now,
      }

      const nextVersion = (existing.version || 1) + 1
      const newActiveId = `nasg-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 5)}`
      const newActiveRecord: NutritionProgram = {
        id: newActiveId,
        title: input.title,
        description: input.description,
        format: input.format,
        version: nextVersion,
        status: input.status === "archived" ? "archived" : "active",
        subscriberId: input.subscriberId || existing.subscriberId,
        templateId: input.templateId || existing.templateId,
        previousVersionId: existing.id,
        days: input.days,
        targetCalories: input.targetCalories,
        targetWaterLiters: input.targetWaterLiters,
        macros: input.macros,
        pdfContentId: input.pdfContentId,
        pdfName: input.pdfName,
        notes: input.notes,
        disclaimerAcknowledged: input.disclaimerAcknowledged ?? true,
        adherence: { done: 0, total: 28 },
        createdAt: now,
        updatedAt: now,
      }

      current[existingIndex] = archivedRecord
      current.unshift(newActiveRecord)
      writeLocalCache(STORAGE_KEY_NUTRITION, current)

      const db = getDb()
      if (db) {
        try {
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
        } catch {
          // Keep local cache
        }
      }
      return newActiveRecord
    }
  }

  // Case 2: In-place update
  if (input.id) {
    const existingIndex = current.findIndex((p) => p.id === input.id)
    if (existingIndex >= 0) {
      const existing = current[existingIndex]
      const updated: NutritionProgram = {
        ...existing,
        title: input.title,
        description: input.description,
        format: input.format,
        status: input.status,
        subscriberId: input.subscriberId ?? existing.subscriberId,
        templateId: input.templateId ?? existing.templateId,
        days: input.days,
        targetCalories: input.targetCalories ?? existing.targetCalories,
        targetWaterLiters: input.targetWaterLiters ?? existing.targetWaterLiters,
        macros: input.macros ?? existing.macros,
        pdfContentId: input.pdfContentId ?? existing.pdfContentId,
        pdfName: input.pdfName ?? existing.pdfName,
        notes: input.notes,
        disclaimerAcknowledged: input.disclaimerAcknowledged ?? existing.disclaimerAcknowledged,
        updatedAt: now,
      }
      current[existingIndex] = updated
      writeLocalCache(STORAGE_KEY_NUTRITION, current)

      const db = getDb()
      if (db) {
        try {
          await setDoc(
            doc(db, NUTRITION_PROGRAMS_COLLECTION, updated.id),
            stripUndefined({ ...updated }),
            { merge: true },
          )
        } catch {
          // Keep local cache
        }
      }
      return updated
    }
  }

  // Case 3: Fresh template or assignment
  const newId =
    input.status === "template"
      ? `ntpl-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 5)}`
      : `nasg-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 5)}`

  const newRecord: NutritionProgram = {
    id: newId,
    title: input.title,
    description: input.description,
    format: input.format,
    version: 1,
    status: input.status,
    subscriberId: input.subscriberId,
    templateId: input.templateId,
    days: input.days,
    targetCalories: input.targetCalories,
    targetWaterLiters: input.targetWaterLiters,
    macros: input.macros,
    pdfContentId: input.pdfContentId,
    pdfName: input.pdfName,
    notes: input.notes,
    disclaimerAcknowledged: input.disclaimerAcknowledged ?? true,
    adherence: input.status === "active" ? { done: 0, total: 28 } : undefined,
    createdAt: now,
    updatedAt: now,
  }

  current.unshift(newRecord)
  writeLocalCache(STORAGE_KEY_NUTRITION, current)

  const db = getDb()
  if (db) {
    try {
      await setDoc(
        doc(db, NUTRITION_PROGRAMS_COLLECTION, newRecord.id),
        stripUndefined({ ...newRecord }),
      )
    } catch {
      // Keep local cache
    }
  }

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

export async function assignNutritionProgram(
  input: AssignNutritionInput,
): Promise<NutritionProgram> {
  const current = await listNutritionPrograms()
  const now = new Date().toISOString()

  // 1. Archive previous active nutrition plan for this subscriber
  const existingActive = current.find(
    (p) => p.subscriberId === input.subscriberId && p.status === "active",
  )

  const db = getDb()
  if (existingActive) {
    existingActive.status = "archived"
    existingActive.archivedAt = now
    existingActive.updatedAt = now
    if (db) {
      try {
        await setDoc(
          doc(db, NUTRITION_PROGRAMS_COLLECTION, existingActive.id),
          stripUndefined({ ...existingActive }),
          { merge: true },
        )
      } catch {
        // Keep local cache
      }
    }
  }

  // 2. Clone from template if provided
  let title = input.customTitle
  let format = input.format || "interactive"
  let days = input.days
  let targetCalories = input.targetCalories
  let targetWaterLiters = input.targetWaterLiters
  let macros = input.macros
  let pdfContentId = input.pdfContentId
  let pdfName = input.pdfName

  if (input.templateId) {
    const template = current.find((p) => p.id === input.templateId)
    if (template) {
      if (!title) {
        const subLabel = input.subscriberName || "Subscriber"
        title = {
          en: `${subLabel} — ${template.title.en}`,
          ar: `${subLabel} — ${template.title.ar}`,
        }
      }
      format = template.format
      days = JSON.parse(JSON.stringify(template.days))
      targetCalories = targetCalories ?? template.targetCalories
      targetWaterLiters = targetWaterLiters ?? template.targetWaterLiters
      macros = macros ?? template.macros
      pdfContentId = template.pdfContentId
      pdfName = template.pdfName
    }
  }

  if (!title) {
    title = {
      en: `${input.subscriberName || "Subscriber"} — Custom Nutrition Plan`,
      ar: `${input.subscriberName || "المشترك"} — خطة تغذية مخصصة`,
    }
  }

  const newId = `nasg-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 5)}`
  const newAssignment: NutritionProgram = {
    id: newId,
    title,
    format,
    version: existingActive ? (existingActive.version || 1) + 1 : 1,
    status: "active",
    subscriberId: input.subscriberId,
    templateId: input.templateId,
    previousVersionId: existingActive?.id,
    days: days || [],
    targetCalories,
    targetWaterLiters,
    macros,
    pdfContentId,
    pdfName,
    notes: input.notes,
    disclaimerAcknowledged: true,
    adherence: { done: 0, total: 28 },
    createdAt: now,
    updatedAt: now,
  }

  current.unshift(newAssignment)
  writeLocalCache(STORAGE_KEY_NUTRITION, current)

  if (db) {
    try {
      await setDoc(
        doc(db, NUTRITION_PROGRAMS_COLLECTION, newAssignment.id),
        stripUndefined({ ...newAssignment }),
      )
    } catch {
      // Keep local cache
    }
  }

  return newAssignment
}

export async function archiveNutritionProgram(id: string): Promise<void> {
  const current = await listNutritionPrograms()
  const target = current.find((p) => p.id === id)
  if (!target) return

  target.status = "archived"
  target.archivedAt = new Date().toISOString()
  target.updatedAt = target.archivedAt

  writeLocalCache(STORAGE_KEY_NUTRITION, current)

  const db = getDb()
  if (db) {
    try {
      await setDoc(
        doc(db, NUTRITION_PROGRAMS_COLLECTION, id),
        stripUndefined({ ...target }),
        { merge: true },
      )
    } catch {
      // Keep local cache
    }
  }
}

export async function deleteNutritionProgram(id: string): Promise<void> {
  let current = await listNutritionPrograms()
  current = current.filter((p) => p.id !== id)
  writeLocalCache(STORAGE_KEY_NUTRITION, current)

  const db = getDb()
  if (db) {
    try {
      await deleteDoc(doc(db, NUTRITION_PROGRAMS_COLLECTION, id))
    } catch {
      // Keep local cache
    }
  }
}

export async function listNutritionLogs(
  subscriberId?: string,
): Promise<NutritionAdherenceLog[]> {
  const db = getDb()
  if (db) {
    try {
      const snap = await getDocs(collection(db, NUTRITION_LOGS_COLLECTION))
      if (!snap.empty) {
        const items = snap.docs.map((d) => ({
          ...(d.data() as NutritionAdherenceLog),
          id: d.id,
        }))
        writeLocalCache(STORAGE_KEY_NUTRITION_LOGS, items)
        return subscriberId
          ? items.filter((log) => log.subscriberId === subscriberId)
          : items
      }
    } catch {
      // Fall through to cache
    }
  }

  const cached = readLocalCache<NutritionAdherenceLog>(STORAGE_KEY_NUTRITION_LOGS)
  const all = cached && cached.length > 0 ? cached : INITIAL_NUTRITION_LOGS
  if (!cached) {
    writeLocalCache(STORAGE_KEY_NUTRITION_LOGS, INITIAL_NUTRITION_LOGS)
  }
  return subscriberId ? all.filter((l) => l.subscriberId === subscriberId) : all
}

export async function logNutritionAdherence(
  input: Omit<NutritionAdherenceLog, "id" | "loggedAt">,
): Promise<NutritionAdherenceLog> {
  const allLogs = await listNutritionLogs()
  const now = new Date().toISOString()
  const id = `nlog-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 5)}`

  const newLog: NutritionAdherenceLog = {
    ...input,
    id,
    loggedAt: now,
  }

  allLogs.unshift(newLog)
  writeLocalCache(STORAGE_KEY_NUTRITION_LOGS, allLogs)

  // Update program adherence progress if applicable
  const allPrograms = await listNutritionPrograms()
  const program = allPrograms.find((p) => p.id === input.programId)
  if (program && program.adherence && (input.status === "adhered" || input.status === "mostly")) {
    program.adherence.done = Math.min(
      program.adherence.total,
      program.adherence.done + 1,
    )
    program.updatedAt = now
    writeLocalCache(STORAGE_KEY_NUTRITION, allPrograms)
  }

  const db = getDb()
  if (db) {
    try {
      await setDoc(
        doc(db, NUTRITION_LOGS_COLLECTION, id),
        stripUndefined({ ...newLog }),
      )
      if (program) {
        await setDoc(
          doc(db, NUTRITION_PROGRAMS_COLLECTION, program.id),
          stripUndefined({ ...program }),
          { merge: true },
        )
      }
    } catch {
      // Keep local cache
    }
  }

  return newLog
}

