import {
  collection,
  getDocs,
  onSnapshot,
  query,
  where,
  type Unsubscribe,
} from "firebase/firestore"
import { getDb } from "@/lib/firebase/firestore"

export type SubscriptionChangeRequestStatus =
  | "pending"
  | "approved"
  | "rejected"

export type SubscriptionChangeRequest = {
  id: string
  subscriberId: string
  subscriberName?: string
  subscriberEmail?: string
  packageId: string
  packageName?: { en: string; ar: string }
  currentPackageId?: string
  note?: string
  noteLocalized?: { en: string; ar: string }
  status: SubscriptionChangeRequestStatus
  createdAt: string
  updatedAt: string
  resolvedAt?: string
  resolutionNote?: string
}

const COLLECTION = "subscription_change_requests"

function normalize(
  id: string,
  raw: Record<string, unknown>,
): SubscriptionChangeRequest {
  const pkgName = raw.packageName as { en?: string; ar?: string } | undefined
  const noteLoc = raw.noteLocalized as { en?: string; ar?: string } | undefined
  const statusRaw = String(raw.status ?? "pending")
  const status: SubscriptionChangeRequestStatus =
    statusRaw === "approved" || statusRaw === "rejected"
      ? statusRaw
      : "pending"

  return {
    id,
    subscriberId: String(raw.subscriberId ?? ""),
    subscriberName:
      typeof raw.subscriberName === "string" ? raw.subscriberName : undefined,
    subscriberEmail:
      typeof raw.subscriberEmail === "string" ? raw.subscriberEmail : undefined,
    packageId: String(raw.packageId ?? ""),
    packageName:
      pkgName && (pkgName.en || pkgName.ar)
        ? {
            en: String(pkgName.en ?? pkgName.ar ?? ""),
            ar: String(pkgName.ar ?? pkgName.en ?? ""),
          }
        : undefined,
    currentPackageId:
      typeof raw.currentPackageId === "string"
        ? raw.currentPackageId
        : undefined,
    note: typeof raw.note === "string" ? raw.note : undefined,
    noteLocalized:
      noteLoc && (noteLoc.en || noteLoc.ar)
        ? {
            en: String(noteLoc.en ?? noteLoc.ar ?? ""),
            ar: String(noteLoc.ar ?? noteLoc.en ?? ""),
          }
        : undefined,
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

export async function fetchSubscriptionChangeRequestsForSubscriber(
  subscriberId: string,
): Promise<SubscriptionChangeRequest[]> {
  const snap = await getDocs(
    query(
      collection(getDb(), COLLECTION),
      where("subscriberId", "==", subscriberId),
    ),
  )
  return snap.docs
    .map((d) => normalize(d.id, d.data() as Record<string, unknown>))
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    )
}

export async function fetchPendingSubscriptionChangeRequests(): Promise<
  SubscriptionChangeRequest[]
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

/** Live pending count for admin sidebar badge (status == pending only). */
export function subscribePendingSubscriptionChangeRequestCount(
  onNext: (count: number) => void,
  onError?: (error: Error) => void,
): Unsubscribe {
  const q = query(
    collection(getDb(), COLLECTION),
    where("status", "==", "pending"),
  )
  return onSnapshot(
    q,
    (snap) => onNext(snap.size),
    (err) => onError?.(err),
  )
}

export async function requestSubscriptionChange(input: {
  packageId: string
  currentPackageId?: string
  note?: string
  noteAr?: string
  noteEn?: string
}): Promise<SubscriptionChangeRequest> {
  const { callRequestSubscriptionChange } = await import(
    "@/lib/firebase/callables"
  )
  const result = await callRequestSubscriptionChange(input)
  return normalize(
    String(result.request.id),
    result.request as Record<string, unknown>,
  )
}

export async function resolveSubscriptionChangeRequest(input: {
  requestId: string
  decision: "approved" | "rejected"
  assignNow?: boolean
  resolutionNote?: string
}): Promise<{
  request: SubscriptionChangeRequest
  subscriptionId?: string
}> {
  const { callResolveSubscriptionChangeRequest } = await import(
    "@/lib/firebase/callables"
  )
  const result = await callResolveSubscriptionChangeRequest(input)
  return {
    request: normalize(
      String(result.request.id),
      result.request as Record<string, unknown>,
    ),
    subscriptionId: result.subscription?.id
      ? String(result.subscription.id)
      : undefined,
  }
}
