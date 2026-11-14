import {
  collection,
  doc,
  getDocs,
  query,
  updateDoc,
  where,
} from "firebase/firestore"
import { getDb } from "@/lib/firebase/firestore"

export type ExerciseChangeRequestStatus =
  | "pending"
  | "reviewed"
  | "dismissed"

export type ExerciseChangeRequest = {
  id: string
  subscriberId: string
  subscriberName?: string
  subscriberEmail?: string
  programId?: string
  dayId?: string
  programTitle?: string
  dayLabel?: string
  exerciseId: string
  exerciseName: string
  substituteId?: string
  substituteName?: string
  reason: string
  notes?: string
  status: ExerciseChangeRequestStatus
  createdAt: string
  updatedAt: string
  resolvedAt?: string
  resolutionNote?: string
}

const COLLECTION = "exercise_change_requests"

function normalize(
  id: string,
  raw: Record<string, unknown>,
): ExerciseChangeRequest {
  const statusRaw = String(raw.status ?? "pending")
  const status: ExerciseChangeRequestStatus =
    statusRaw === "reviewed" || statusRaw === "dismissed"
      ? statusRaw
      : "pending"

  return {
    id,
    subscriberId: String(raw.subscriberId ?? ""),
    subscriberName:
      typeof raw.subscriberName === "string" ? raw.subscriberName : undefined,
    subscriberEmail:
      typeof raw.subscriberEmail === "string" ? raw.subscriberEmail : undefined,
    programId: typeof raw.programId === "string" ? raw.programId : undefined,
    dayId: typeof raw.dayId === "string" ? raw.dayId : undefined,
    programTitle:
      typeof raw.programTitle === "string" ? raw.programTitle : undefined,
    dayLabel: typeof raw.dayLabel === "string" ? raw.dayLabel : undefined,
    exerciseId: String(raw.exerciseId ?? ""),
    exerciseName: String(raw.exerciseName ?? ""),
    substituteId:
      typeof raw.substituteId === "string" ? raw.substituteId : undefined,
    substituteName:
      typeof raw.substituteName === "string" ? raw.substituteName : undefined,
    reason: String(raw.reason ?? ""),
    notes: typeof raw.notes === "string" ? raw.notes : undefined,
    status,
    createdAt:
      typeof raw.createdAt === "string"
        ? raw.createdAt
        : new Date().toISOString(),
    updatedAt:
      typeof raw.updatedAt === "string"
        ? raw.updatedAt
        : new Date().toISOString(),
    resolvedAt:
      typeof raw.resolvedAt === "string" ? raw.resolvedAt : undefined,
    resolutionNote:
      typeof raw.resolutionNote === "string" ? raw.resolutionNote : undefined,
  }
}

export async function fetchPendingExerciseChangeRequests(): Promise<
  ExerciseChangeRequest[]
> {
  const snap = await getDocs(
    query(collection(getDb(), COLLECTION), where("status", "==", "pending")),
  )
  return snap.docs
    .map((d) => normalize(d.id, d.data() as Record<string, unknown>))
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    )
}

export async function resolveExerciseChangeRequest(input: {
  requestId: string
  decision: "reviewed" | "dismissed"
  resolutionNote?: string
}): Promise<ExerciseChangeRequest> {
  const now = new Date().toISOString()
  const ref = doc(getDb(), COLLECTION, input.requestId)
  await updateDoc(ref, {
    status: input.decision,
    resolutionNote: input.resolutionNote?.trim() || null,
    resolvedAt: now,
    updatedAt: now,
  })
  return {
    id: input.requestId,
    subscriberId: "",
    exerciseId: "",
    exerciseName: "",
    reason: "",
    status: input.decision,
    createdAt: now,
    updatedAt: now,
    resolvedAt: now,
    resolutionNote: input.resolutionNote,
  }
}
