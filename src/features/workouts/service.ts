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
  ProgramFormat,
  WorkoutDay,
  WorkoutProgram,
  WorkoutSessionLog,
} from "@/types/program"

const WORKOUT_PROGRAMS_COLLECTION = "workout_programs"
const WORKOUT_LOGS_COLLECTION = "workout_logs"
const STORAGE_KEY_WORKOUTS = "derpyfit_workout_programs_v1"
const STORAGE_KEY_WORKOUT_LOGS = "derpyfit_workout_logs_v1"

function clearLegacyLocalCaches() {
  try {
    window.localStorage.removeItem(STORAGE_KEY_WORKOUTS)
    window.localStorage.removeItem(STORAGE_KEY_WORKOUT_LOGS)
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

function normalizeWorkoutProgram(
  id: string,
  raw: Record<string, unknown>,
): WorkoutProgram {
  const titleRaw = (raw.title ?? {}) as Record<string, string>
  return {
    id,
    title: {
      en: String(titleRaw.en ?? "Workout"),
      ar: String(titleRaw.ar ?? titleRaw.en ?? "برنامج تمارين"),
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
    days: Array.isArray(raw.days) ? (raw.days as WorkoutDay[]) : [],
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
    completion:
      raw.completion && typeof raw.completion === "object"
        ? {
            done: Number((raw.completion as Record<string, unknown>).done) || 0,
            total:
              Number((raw.completion as Record<string, unknown>).total) || 0,
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
  }
}

function normalizeWorkoutLog(
  id: string,
  raw: Record<string, unknown>,
): WorkoutSessionLog {
  return {
    ...(raw as Omit<WorkoutSessionLog, "id">),
    id,
    subscriberId: String(raw.subscriberId ?? ""),
    programId: String(raw.programId ?? ""),
    completedAt:
      typeof raw.completedAt === "string"
        ? raw.completedAt
        : new Date().toISOString(),
  }
}

function trainingDaysTotal(days: WorkoutDay[]): number {
  return days.filter((d) => !d.isRest && d.exercises.length > 0).length
}

function cloneDays(days: WorkoutDay[]): WorkoutDay[] {
  return JSON.parse(JSON.stringify(days)) as WorkoutDay[]
}

/** Admin unscoped list, or subscriber-scoped (rules-safe). Never auto-seeds demo. */
export async function listWorkoutPrograms(
  subscriberId?: string,
): Promise<WorkoutProgram[]> {
  try {
    const db = getDb()
    const colRef = collection(db, WORKOUT_PROGRAMS_COLLECTION)
    const snap = subscriberId
      ? await getDocs(query(colRef, where("subscriberId", "==", subscriberId)))
      : await getDocs(colRef)

    const items = snap.docs.map((d) =>
      normalizeWorkoutProgram(d.id, d.data() as Record<string, unknown>),
    )
    return items.sort(
      (a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
    )
  } catch (err) {
    console.warn("[Firestore] Failed to read workout_programs:", err)
    throw err instanceof Error ? err : new Error("Failed to load workouts")
  }
}

export async function fetchWorkoutProgramById(
  programId: string,
): Promise<WorkoutProgram | null> {
  if (!programId) return null
  try {
    const db = getDb()
    const snap = await getDoc(doc(db, WORKOUT_PROGRAMS_COLLECTION, programId))
    if (!snap.exists()) return null
    return normalizeWorkoutProgram(
      snap.id,
      snap.data() as Record<string, unknown>,
    )
  } catch (err) {
    console.warn("[Firestore] Failed to read workout program:", err)
    return null
  }
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
  const now = new Date().toISOString()
  const db = getDb()

  // Case 1: Editing assigned program → archive previous + create new version
  // (docs: keep historical records; template edits stay in-place)
  if (input.id && input.createNewVersion) {
    const existing = await fetchWorkoutProgramById(input.id)
    if (!existing) throw new Error("Workout program not found")

    const archivedRecord: WorkoutProgram = {
      ...existing,
      status: "archived",
      archivedAt: now,
      updatedAt: now,
    }

    const nextVersion = (existing.version || 1) + 1
    const newActiveId = doc(collection(db, WORKOUT_PROGRAMS_COLLECTION)).id
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
      days: cloneDays(input.days),
      pdfContentId: input.pdfContentId,
      pdfName: input.pdfName,
      notes: input.notes,
      completion: {
        done: 0,
        total: trainingDaysTotal(input.days),
      },
      createdAt: now,
      updatedAt: now,
    }

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
    return newActiveRecord
  }

  // Case 2: In-place update (templates, or soft edits without new version)
  if (input.id) {
    const existing = await fetchWorkoutProgramById(input.id)
    if (!existing) throw new Error("Workout program not found")

    const updated: WorkoutProgram = {
      ...existing,
      title: input.title,
      description: input.description,
      format: input.format,
      status: input.status,
      subscriberId: input.subscriberId ?? existing.subscriberId,
      templateId: input.templateId ?? existing.templateId,
      days: cloneDays(input.days),
      pdfContentId: input.pdfContentId ?? existing.pdfContentId,
      pdfName: input.pdfName ?? existing.pdfName,
      notes: input.notes,
      updatedAt: now,
      archivedAt:
        input.status === "archived"
          ? existing.archivedAt ?? now
          : input.status === "active"
            ? undefined
            : existing.archivedAt,
      completion:
        input.status === "active"
          ? existing.completion ?? {
              done: 0,
              total: trainingDaysTotal(input.days),
            }
          : existing.completion,
    }

    // Restoring archived assignment → ensure only one active seat per subscriber
    if (
      existing.status === "archived" &&
      updated.status === "active" &&
      updated.subscriberId
    ) {
      await archiveActiveAssignmentsForSubscriber(
        updated.subscriberId,
        updated.id,
        now,
      )
    }

    await setDoc(
      doc(db, WORKOUT_PROGRAMS_COLLECTION, updated.id),
      stripUndefined({ ...updated }),
    )
    return updated
  }

  // Case 3: Create fresh template or assignment
  if (input.status === "active" && !input.subscriberId) {
    throw new Error("Assigned workout programs require a subscriber")
  }

  const newId = doc(collection(db, WORKOUT_PROGRAMS_COLLECTION)).id

  const newRecord: WorkoutProgram = {
    id: newId,
    title: input.title,
    description: input.description,
    format: input.format,
    version: 1,
    status: input.status,
    subscriberId: input.subscriberId,
    templateId: input.templateId,
    days: cloneDays(input.days),
    pdfContentId: input.pdfContentId,
    pdfName: input.pdfName,
    notes: input.notes,
    completion:
      input.status === "active"
        ? { done: 0, total: trainingDaysTotal(input.days) }
        : undefined,
    createdAt: now,
    updatedAt: now,
  }

  if (newRecord.status === "active" && newRecord.subscriberId) {
    await archiveActiveAssignmentsForSubscriber(
      newRecord.subscriberId,
      newRecord.id,
      now,
    )
  }

  await setDoc(
    doc(db, WORKOUT_PROGRAMS_COLLECTION, newRecord.id),
    stripUndefined({ ...newRecord }),
  )
  return newRecord
}

async function archiveActiveAssignmentsForSubscriber(
  subscriberId: string,
  exceptId: string,
  now: string,
): Promise<void> {
  const db = getDb()
  const snap = await getDocs(
    query(
      collection(db, WORKOUT_PROGRAMS_COLLECTION),
      where("subscriberId", "==", subscriberId),
      where("status", "==", "active"),
    ),
  )
  if (snap.empty) return

  const batch = writeBatch(db)
  let writes = 0
  for (const d of snap.docs) {
    if (d.id === exceptId) continue
    const existing = normalizeWorkoutProgram(
      d.id,
      d.data() as Record<string, unknown>,
    )
    batch.set(
      doc(db, WORKOUT_PROGRAMS_COLLECTION, d.id),
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

/**
 * Assign a program to a subscriber.
 * Clones template days so template edits never overwrite assigned history.
 * Archives any current active assignment (docs: retain previous programs).
 */
export async function assignWorkoutProgram(
  input: AssignWorkoutInput,
): Promise<WorkoutProgram> {
  if (!input.subscriberId) {
    throw new Error("Subscriber is required")
  }

  const now = new Date().toISOString()
  const db = getDb()

  let title = input.customTitle
  let format: ProgramFormat = input.format || "interactive"
  let days = input.days ? cloneDays(input.days) : []
  let pdfContentId = input.pdfContentId
  let pdfName = input.pdfName
  let previousVersionId: string | undefined
  let nextVersion = 1

  if (input.templateId) {
    const template = await fetchWorkoutProgramById(input.templateId)
    if (!template || template.status !== "template") {
      throw new Error("Workout template not found")
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
    pdfContentId = template.pdfContentId
    pdfName = template.pdfName
  }

  if (!title) {
    title = {
      en: `${input.subscriberName || "Subscriber"} — Custom Workout`,
      ar: `${input.subscriberName || "المشترك"} — برنامج تدريبي مخصص`,
    }
  }

  // Archive current active assignment(s) for this subscriber
  const activeSnap = await getDocs(
    query(
      collection(db, WORKOUT_PROGRAMS_COLLECTION),
      where("subscriberId", "==", input.subscriberId),
      where("status", "==", "active"),
    ),
  )

  const batch = writeBatch(db)
  for (const d of activeSnap.docs) {
    const existing = normalizeWorkoutProgram(
      d.id,
      d.data() as Record<string, unknown>,
    )
    previousVersionId = existing.id
    nextVersion = Math.max(nextVersion, (existing.version || 1) + 1)
    batch.set(
      doc(db, WORKOUT_PROGRAMS_COLLECTION, existing.id),
      stripUndefined({
        ...existing,
        status: "archived",
        archivedAt: now,
        updatedAt: now,
      }),
    )
  }

  const newId = doc(collection(db, WORKOUT_PROGRAMS_COLLECTION)).id
  const newAssignment: WorkoutProgram = {
    id: newId,
    title,
    format,
    version: nextVersion,
    status: "active",
    subscriberId: input.subscriberId,
    templateId: input.templateId,
    previousVersionId,
    days,
    pdfContentId,
    pdfName,
    notes: input.notes,
    completion: {
      done: 0,
      total: trainingDaysTotal(days),
    },
    createdAt: now,
    updatedAt: now,
  }

  batch.set(
    doc(db, WORKOUT_PROGRAMS_COLLECTION, newAssignment.id),
    stripUndefined({ ...newAssignment }),
  )
  await batch.commit()
  return newAssignment
}

export async function archiveWorkoutProgram(id: string): Promise<WorkoutProgram> {
  const existing = await fetchWorkoutProgramById(id)
  if (!existing) throw new Error("Workout program not found")

  const now = new Date().toISOString()
  const db = getDb()
  const updated: WorkoutProgram = {
    ...existing,
    status: "archived",
    archivedAt: now,
    updatedAt: now,
  }

  await setDoc(
    doc(db, WORKOUT_PROGRAMS_COLLECTION, id),
    stripUndefined({ ...updated }),
  )
  return updated
}

export async function restoreWorkoutProgram(
  id: string,
): Promise<WorkoutProgram> {
  const existing = await fetchWorkoutProgramById(id)
  if (!existing) throw new Error("Workout program not found")

  const now = new Date().toISOString()
  const db = getDb()
  const nextStatus: WorkoutProgram["status"] = existing.subscriberId
    ? "active"
    : "template"

  if (nextStatus === "active" && existing.subscriberId) {
    await archiveActiveAssignmentsForSubscriber(
      existing.subscriberId,
      existing.id,
      now,
    )
  }

  const updated: WorkoutProgram = {
    ...existing,
    status: nextStatus,
    archivedAt: undefined,
    updatedAt: now,
    completion:
      nextStatus === "active"
        ? existing.completion ?? {
            done: 0,
            total: trainingDaysTotal(existing.days),
          }
        : existing.completion,
  }

  await setDoc(
    doc(db, WORKOUT_PROGRAMS_COLLECTION, id),
    stripUndefined({ ...updated }),
  )
  return updated
}

export async function deleteWorkoutProgram(id: string): Promise<void> {
  const db = getDb()
  await deleteDoc(doc(db, WORKOUT_PROGRAMS_COLLECTION, id))
}

export async function listWorkoutLogs(
  subscriberId?: string,
): Promise<WorkoutSessionLog[]> {
  try {
    const db = getDb()
    const colRef = collection(db, WORKOUT_LOGS_COLLECTION)
    const snap = subscriberId
      ? await getDocs(query(colRef, where("subscriberId", "==", subscriberId)))
      : await getDocs(colRef)

    return snap.docs
      .map((d) =>
        normalizeWorkoutLog(d.id, d.data() as Record<string, unknown>),
      )
      .sort(
        (a, b) =>
          new Date(b.completedAt).getTime() -
          new Date(a.completedAt).getTime(),
      )
  } catch (err) {
    console.warn("[Firestore] Failed to read workout_logs:", err)
    throw err instanceof Error ? err : new Error("Failed to load workout logs")
  }
}

export async function logWorkoutSession(
  input: Omit<WorkoutSessionLog, "id" | "completedAt">,
): Promise<WorkoutSessionLog> {
  const now = new Date().toISOString()
  const db = getDb()
  const id = doc(collection(db, WORKOUT_LOGS_COLLECTION)).id

  const newLog: WorkoutSessionLog = {
    ...input,
    id,
    completedAt: now,
  }

  await setDoc(
    doc(db, WORKOUT_LOGS_COLLECTION, id),
    stripUndefined({ ...newLog }),
  )

  // Update assigned program completion counters (history-safe)
  if (input.programId) {
    const program = await fetchWorkoutProgramById(input.programId)
    if (program?.completion) {
      const updated: WorkoutProgram = {
        ...program,
        completion: {
          ...program.completion,
          done: Math.min(
            program.completion.total,
            program.completion.done + 1,
          ),
        },
        updatedAt: now,
      }
      await setDoc(
        doc(db, WORKOUT_PROGRAMS_COLLECTION, program.id),
        stripUndefined({ ...updated }),
        { merge: true },
      )
    }
  }

  return newLog
}
