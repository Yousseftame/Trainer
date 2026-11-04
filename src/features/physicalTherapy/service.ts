import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  setDoc,
  writeBatch,
} from "firebase/firestore"
import { getDb } from "@/lib/firebase/firestore"
import { DEMO_PT_RECORDS } from "@/features/physicalTherapy/demo"
import type { PhysicalTherapyRecord } from "@/types/physicalTherapy"

const PT_COLLECTION = "physical_therapy"
const PT_CACHE_KEY = "derpyfit_physical_therapy_cache"

function readLocalCache(): PhysicalTherapyRecord[] | null {
  try {
    const raw = localStorage.getItem(PT_CACHE_KEY)
    if (!raw) return null
    return JSON.parse(raw) as PhysicalTherapyRecord[]
  } catch {
    return null
  }
}

function writeLocalCache(records: PhysicalTherapyRecord[]): void {
  try {
    localStorage.setItem(PT_CACHE_KEY, JSON.stringify(records))
  } catch {
    // quota exceeded or disabled
  }
}

export async function fetchPTRecords(): Promise<PhysicalTherapyRecord[]> {
  try {
    const db = getDb()
    const snap = await getDocs(collection(db, PT_COLLECTION))

    if (snap.empty) {
      // Seed demo records into Firestore
      try {
        const batch = writeBatch(db)
        for (const item of DEMO_PT_RECORDS) {
          batch.set(doc(db, PT_COLLECTION, item.id), item)
        }
        await batch.commit()
      } catch (seedErr) {
        console.warn("Could not seed physical therapy to Firestore:", seedErr)
      }
      writeLocalCache(DEMO_PT_RECORDS)
      return DEMO_PT_RECORDS
    }

    const records = snap.docs.map((d) => d.data() as PhysicalTherapyRecord)
    writeLocalCache(records)
    return records
  } catch (err) {
    console.warn("Firestore physical therapy read failed, falling back:", err)
    const cached = readLocalCache()
    if (cached && cached.length > 0) return cached
    return DEMO_PT_RECORDS
  }
}

export async function fetchSubscriberPTRecords(
  subscriberId: string,
): Promise<PhysicalTherapyRecord[]> {
  const all = await fetchPTRecords()
  return all.filter(
    (r) =>
      r.subscriberId === subscriberId ||
      r.subscriberId.toLowerCase() === subscriberId.toLowerCase(),
  )
}

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

export async function savePTRecord(
  record: Partial<PhysicalTherapyRecord> & {
    subscriberId: string
    injuryTitle: PhysicalTherapyRecord["injuryTitle"]
    affectedArea: PhysicalTherapyRecord["affectedArea"]
  },
): Promise<PhysicalTherapyRecord> {
  const existing = await fetchPTRecords()
  const now = new Date().toISOString()
  const id =
    record.id ||
    `pt-${record.subscriberId}-${Date.now().toString(36)}`

  const resolved: PhysicalTherapyRecord = {
    id,
    subscriberId: record.subscriberId,
    subscriberName: record.subscriberName,
    injuryTitle: record.injuryTitle,
    affectedArea: record.affectedArea,
    severity: record.severity ?? "mild",
    status: record.status ?? "active",
    diagnosisDate: record.diagnosisDate ?? now.slice(0, 10),
    clearanceDate: record.clearanceDate ?? null,
    nextEvaluationDate: record.nextEvaluationDate ?? null,
    restrictions: record.restrictions ?? [],
    rehabExercises: record.rehabExercises ?? [],
    therapistNotes: record.therapistNotes,
    createdAt: record.createdAt ?? now,
    updatedAt: now,
  }

  const idx = existing.findIndex((r) => r.id === id)
  const nextList =
    idx >= 0
      ? existing.map((r, i) => (i === idx ? resolved : r))
      : [resolved, ...existing]

  writeLocalCache(nextList)

  try {
    const db = getDb()
    await setDoc(doc(db, PT_COLLECTION, id), resolved)
  } catch (err) {
    console.warn("Firestore save PT record failed, cached locally:", err)
  }

  return resolved
}

export async function deletePTRecord(id: string): Promise<void> {
  const existing = await fetchPTRecords()
  const nextList = existing.filter((r) => r.id !== id)
  writeLocalCache(nextList)

  try {
    const db = getDb()
    await deleteDoc(doc(db, PT_COLLECTION, id))
  } catch (err) {
    console.warn("Firestore delete PT record failed, updated locally:", err)
  }
}

