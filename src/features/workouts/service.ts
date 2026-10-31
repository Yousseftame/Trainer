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
  DEMO_WORKOUTS,
  INITIAL_WORKOUT_LOGS,
} from "@/features/workouts/demo"
import type {
  BilingualText,
  ProgramFormat,
  WorkoutDay,
  WorkoutProgram,
  WorkoutSessionLog,
} from "@/types/program"

const WORKOUT_PROGRAMS_COLLECTION = "workout_programs"
const WORKOUT_LOGS_COLLECTION = "workout_logs"
const STORAGE_KEY_WORKOUTS = "derpyfit_workout_programs_v1"
const STORAGE_KEY_WORKOUT_LOGS = "derpyfit_workout_logs_v1"

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

export async function listWorkoutPrograms(): Promise<WorkoutProgram[]> {
  const db = getDb()
  if (db) {
    try {
      const snap = await getDocs(collection(db, WORKOUT_PROGRAMS_COLLECTION))
      if (!snap.empty) {
        const items = snap.docs.map((d) => ({
          ...(d.data() as WorkoutProgram),
          id: d.id,
        }))
        writeLocalCache(STORAGE_KEY_WORKOUTS, items)
        return items
      }

      // Seed initial demo data to Firestore if empty
      const batch = writeBatch(db)
      for (const item of DEMO_WORKOUTS) {
        batch.set(
          doc(db, WORKOUT_PROGRAMS_COLLECTION, item.id),
          stripUndefined({ ...item }),
        )
      }
      await batch.commit().catch(() => null)
      writeLocalCache(STORAGE_KEY_WORKOUTS, DEMO_WORKOUTS)
      return DEMO_WORKOUTS
    } catch {
      // Fall through to cache
    }
  }

  const cached = readLocalCache<WorkoutProgram>(STORAGE_KEY_WORKOUTS)
  if (cached && cached.length > 0) {
    return cached
  }

  writeLocalCache(STORAGE_KEY_WORKOUTS, DEMO_WORKOUTS)
  return DEMO_WORKOUTS
}

export type SaveWorkoutProgramInput = {
  id?: string
  title: BilingualText
  description?: BilingualText
  format: ProgramFormat
  status: "template" | "active" | "archived"
  subscriberId?: string
  templateId?: string
  days: WorkoutDay[]
  pdfContentId?: string
  pdfName?: BilingualText
  notes?: BilingualText
  createNewVersion?: boolean
}

export async function saveWorkoutProgram(
  input: SaveWorkoutProgramInput,
): Promise<WorkoutProgram> {
  const current = await listWorkoutPrograms()
  const now = new Date().toISOString()

  // Case 1: Editing existing program with "Create New Version" requested
  if (input.id && input.createNewVersion) {
    const existingIndex = current.findIndex((p) => p.id === input.id)
    if (existingIndex >= 0) {
      const existing = current[existingIndex]
      const archivedRecord: WorkoutProgram = {
        ...existing,
        status: "archived",
        archivedAt: now,
        updatedAt: now,
      }

      const nextVersion = (existing.version || 1) + 1
      const newActiveId = `asg-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 5)}`
      const newActiveRecord: WorkoutProgram = {
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
        pdfContentId: input.pdfContentId,
        pdfName: input.pdfName,
        notes: input.notes,
        completion: { done: 0, total: input.days.filter((d) => !d.isRest && d.exercises.length > 0).length },
        createdAt: now,
        updatedAt: now,
      }

      current[existingIndex] = archivedRecord
      current.unshift(newActiveRecord)
      writeLocalCache(STORAGE_KEY_WORKOUTS, current)

      const db = getDb()
      if (db) {
        try {
          const batch = writeBatch(db)
          batch.set(
            doc(db, WORKOUT_PROGRAMS_COLLECTION, archivedRecord.id),
            stripUndefined({ ...archivedRecord }),
          )
          batch.set(
            doc(db, WORKOUT_PROGRAMS_COLLECTION, newActiveRecord.id),
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

  // Case 2: In-place update of existing program
  if (input.id) {
    const existingIndex = current.findIndex((p) => p.id === input.id)
    if (existingIndex >= 0) {
      const existing = current[existingIndex]
      const updated: WorkoutProgram = {
        ...existing,
        title: input.title,
        description: input.description,
        format: input.format,
        status: input.status,
        subscriberId: input.subscriberId ?? existing.subscriberId,
        templateId: input.templateId ?? existing.templateId,
        days: input.days,
        pdfContentId: input.pdfContentId ?? existing.pdfContentId,
        pdfName: input.pdfName ?? existing.pdfName,
        notes: input.notes,
        updatedAt: now,
      }
      current[existingIndex] = updated
      writeLocalCache(STORAGE_KEY_WORKOUTS, current)

      const db = getDb()
      if (db) {
        try {
          await setDoc(
            doc(db, WORKOUT_PROGRAMS_COLLECTION, updated.id),
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

  // Case 3: Create fresh template or program
  const newId =
    input.status === "template"
      ? `tpl-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 5)}`
      : `asg-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 5)}`

  const newRecord: WorkoutProgram = {
    id: newId,
    title: input.title,
    description: input.description,
    format: input.format,
    version: 1,
    status: input.status,
    subscriberId: input.subscriberId,
    templateId: input.templateId,
    days: input.days,
    pdfContentId: input.pdfContentId,
    pdfName: input.pdfName,
    notes: input.notes,
    completion:
      input.status === "active"
        ? { done: 0, total: input.days.filter((d) => !d.isRest && d.exercises.length > 0).length }
        : undefined,
    createdAt: now,
    updatedAt: now,
  }

  current.unshift(newRecord)
  writeLocalCache(STORAGE_KEY_WORKOUTS, current)

  const db = getDb()
  if (db) {
    try {
      await setDoc(
        doc(db, WORKOUT_PROGRAMS_COLLECTION, newRecord.id),
        stripUndefined({ ...newRecord }),
      )
    } catch {
      // Keep local cache
    }
  }

  return newRecord
}

export type AssignWorkoutInput = {
  subscriberId: string
  subscriberName?: string
  templateId?: string
  customTitle?: BilingualText
  format?: ProgramFormat
  days?: WorkoutDay[]
  pdfContentId?: string
  pdfName?: BilingualText
  notes?: BilingualText
}

export async function assignWorkoutProgram(
  input: AssignWorkoutInput,
): Promise<WorkoutProgram> {
  const current = await listWorkoutPrograms()
  const now = new Date().toISOString()

  // 1. If subscriber already has an active workout, archive it so history is retained
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
          doc(db, WORKOUT_PROGRAMS_COLLECTION, existingActive.id),
          stripUndefined({ ...existingActive }),
          { merge: true },
        )
      } catch {
        // Keep local cache
      }
    }
  }

  // 2. Clone from template if templateId provided, or use custom days
  let title = input.customTitle
  let format = input.format || "interactive"
  let days = input.days
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
      // Deep clone days so editing assignment never modifies base template
      days = JSON.parse(JSON.stringify(template.days))
      pdfContentId = template.pdfContentId
      pdfName = template.pdfName
    }
  }

  if (!title) {
    title = {
      en: `${input.subscriberName || "Subscriber"} — Custom Workout`,
      ar: `${input.subscriberName || "المشترك"} — برنامج تدريبي مخصص`,
    }
  }

  const newId = `asg-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 5)}`
  const newAssignment: WorkoutProgram = {
    id: newId,
    title,
    format,
    version: existingActive ? (existingActive.version || 1) + 1 : 1,
    status: "active",
    subscriberId: input.subscriberId,
    templateId: input.templateId,
    previousVersionId: existingActive?.id,
    days: days || [],
    pdfContentId,
    pdfName,
    notes: input.notes,
    completion: {
      done: 0,
      total: (days || []).filter((d) => !d.isRest && d.exercises.length > 0).length,
    },
    createdAt: now,
    updatedAt: now,
  }

  current.unshift(newAssignment)
  writeLocalCache(STORAGE_KEY_WORKOUTS, current)

  if (db) {
    try {
      await setDoc(
        doc(db, WORKOUT_PROGRAMS_COLLECTION, newAssignment.id),
        stripUndefined({ ...newAssignment }),
      )
    } catch {
      // Keep local cache
    }
  }

  return newAssignment
}

export async function archiveWorkoutProgram(id: string): Promise<void> {
  const current = await listWorkoutPrograms()
  const target = current.find((p) => p.id === id)
  if (!target) return

  target.status = "archived"
  target.archivedAt = new Date().toISOString()
  target.updatedAt = target.archivedAt

  writeLocalCache(STORAGE_KEY_WORKOUTS, current)

  const db = getDb()
  if (db) {
    try {
      await setDoc(
        doc(db, WORKOUT_PROGRAMS_COLLECTION, id),
        stripUndefined({ ...target }),
        { merge: true },
      )
    } catch {
      // Keep local cache
    }
  }
}

export async function deleteWorkoutProgram(id: string): Promise<void> {
  let current = await listWorkoutPrograms()
  current = current.filter((p) => p.id !== id)
  writeLocalCache(STORAGE_KEY_WORKOUTS, current)

  const db = getDb()
  if (db) {
    try {
      await deleteDoc(doc(db, WORKOUT_PROGRAMS_COLLECTION, id))
    } catch {
      // Keep local cache
    }
  }
}

export async function listWorkoutLogs(
  subscriberId?: string,
): Promise<WorkoutSessionLog[]> {
  const db = getDb()
  if (db) {
    try {
      const snap = await getDocs(collection(db, WORKOUT_LOGS_COLLECTION))
      if (!snap.empty) {
        const items = snap.docs.map((d) => ({
          ...(d.data() as WorkoutSessionLog),
          id: d.id,
        }))
        writeLocalCache(STORAGE_KEY_WORKOUT_LOGS, items)
        return subscriberId
          ? items.filter((log) => log.subscriberId === subscriberId)
          : items
      }
    } catch {
      // Fall through to cache
    }
  }

  const cached = readLocalCache<WorkoutSessionLog>(STORAGE_KEY_WORKOUT_LOGS)
  const all = cached && cached.length > 0 ? cached : INITIAL_WORKOUT_LOGS
  if (!cached) {
    writeLocalCache(STORAGE_KEY_WORKOUT_LOGS, INITIAL_WORKOUT_LOGS)
  }
  return subscriberId ? all.filter((l) => l.subscriberId === subscriberId) : all
}

export async function logWorkoutSession(
  input: Omit<WorkoutSessionLog, "id" | "completedAt">,
): Promise<WorkoutSessionLog> {
  const allLogs = await listWorkoutLogs()
  const now = new Date().toISOString()
  const id = `wlog-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 5)}`

  const newLog: WorkoutSessionLog = {
    ...input,
    id,
    completedAt: now,
  }

  allLogs.unshift(newLog)
  writeLocalCache(STORAGE_KEY_WORKOUT_LOGS, allLogs)

  // Update program weekly completion count
  const allPrograms = await listWorkoutPrograms()
  const program = allPrograms.find((p) => p.id === input.programId)
  if (program && program.completion) {
    program.completion.done = Math.min(
      program.completion.total,
      program.completion.done + 1,
    )
    program.updatedAt = now
    writeLocalCache(STORAGE_KEY_WORKOUTS, allPrograms)
  }

  const db = getDb()
  if (db) {
    try {
      await setDoc(
        doc(db, WORKOUT_LOGS_COLLECTION, id),
        stripUndefined({ ...newLog }),
      )
      if (program) {
        await setDoc(
          doc(db, WORKOUT_PROGRAMS_COLLECTION, program.id),
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
