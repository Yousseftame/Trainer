import {
  collection,
  doc,
  getDocs,
  query,
  updateDoc,
  where,
} from "firebase/firestore"
import { getDb } from "@/lib/firebase/firestore"

export type MealChangeRequestStatus = "pending" | "reviewed" | "dismissed"

export type MealChangeRequest = {
  id: string
  subscriberId: string
  subscriberName?: string
  subscriberEmail?: string
  programId?: string
  dayId?: string
  programTitle?: string
  dayLabel?: string
  mealSlotId?: string
  mealSlotTitle?: string
  mealItemId: string
  mealItemName: string
  substituteId?: string
  substituteName?: string
  reason: string
  notes?: string
  status: MealChangeRequestStatus
  createdAt: string
  updatedAt: string
  resolvedAt?: string
  resolutionNote?: string
}

const COLLECTION = "meal_change_requests"

function normalize(
  id: string,
  raw: Record<string, unknown>,
): MealChangeRequest {
  const statusRaw = String(raw.status ?? "pending")
  const status: MealChangeRequestStatus =
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
    mealSlotId:
      typeof raw.mealSlotId === "string" ? raw.mealSlotId : undefined,
    mealSlotTitle:
      typeof raw.mealSlotTitle === "string" ? raw.mealSlotTitle : undefined,
    mealItemId: String(raw.mealItemId ?? ""),
    mealItemName: String(raw.mealItemName ?? ""),
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

export async function fetchPendingMealChangeRequests(): Promise<
  MealChangeRequest[]
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

export async function resolveMealChangeRequest(input: {
  requestId: string
  decision: "reviewed" | "dismissed"
  resolutionNote?: string
}): Promise<void> {
  const now = new Date().toISOString()
  await updateDoc(doc(getDb(), COLLECTION, input.requestId), {
    status: input.decision,
    resolutionNote: input.resolutionNote?.trim() || null,
    resolvedAt: now,
    updatedAt: now,
  })
}

export async function requestMealChange(input: {
  mealItemId: string
  mealItemName: string
  reason: string
  notes?: string
  programId?: string
  dayId?: string
  programTitle?: string
  dayLabel?: string
  mealSlotId?: string
  mealSlotTitle?: string
  substituteId?: string
  substituteName?: string
}): Promise<{ id: string }> {
  const { callRequestMealChange } = await import("@/lib/firebase/callables")
  const result = await callRequestMealChange(input)
  return { id: String(result.request.id) }
}
