import {
  collection,
  doc,
  getDocs,
  setDoc,
  writeBatch,
} from "firebase/firestore"
import { getDb } from "@/lib/firebase/firestore"
import {
  DEMO_SUBSCRIBERS,
  type DemoSubscriber,
} from "@/features/subscribers/demo"
import {
  DEMO_REGISTRATION_REQUESTS,
  type DemoRegistrationRequest,
  type RegistrationRequestStatus,
} from "@/features/subscribers/requests-demo"
import { currentSubscriptionFor } from "@/features/subscriptions/demo"
import {
  assignSubscription,
  updateSubscriptionLifecycle,
} from "@/features/subscriptions/service"
import type { UserStatus } from "@/types/user"

const SUBSCRIBERS_COLLECTION = "subscribers"
const REGISTRATION_REQUESTS_COLLECTION = "registration_requests"
const SUBSCRIBERS_STORAGE_KEY = "derpyfit_subscribers_v1"
const REQUESTS_STORAGE_KEY = "derpyfit_registration_requests_v1"

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
    // Ignore storage quota errors
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

function syncDemoSubscribersArray(next: DemoSubscriber[]): DemoSubscriber[] {
  const sorted = [...next].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  )
  DEMO_SUBSCRIBERS.splice(0, DEMO_SUBSCRIBERS.length, ...sorted)
  writeLocalCache(SUBSCRIBERS_STORAGE_KEY, sorted)
  return sorted
}

function syncDemoRequestsArray(
  next: DemoRegistrationRequest[],
): DemoRegistrationRequest[] {
  const sorted = [...next].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  )
  DEMO_REGISTRATION_REQUESTS.splice(
    0,
    DEMO_REGISTRATION_REQUESTS.length,
    ...sorted,
  )
  writeLocalCache(REQUESTS_STORAGE_KEY, sorted)
  return sorted
}

// Hydrate in-memory arrays from localStorage on module load
const cachedSubscribers = readLocalCache<DemoSubscriber>(SUBSCRIBERS_STORAGE_KEY)
if (cachedSubscribers?.length) {
  DEMO_SUBSCRIBERS.splice(0, DEMO_SUBSCRIBERS.length, ...cachedSubscribers)
}
const cachedRequests = readLocalCache<DemoRegistrationRequest>(
  REQUESTS_STORAGE_KEY,
)
if (cachedRequests?.length) {
  DEMO_REGISTRATION_REQUESTS.splice(
    0,
    DEMO_REGISTRATION_REQUESTS.length,
    ...cachedRequests,
  )
}

function normalizeBilingual(
  raw: unknown,
): { en: string; ar: string } | undefined {
  if (!raw || typeof raw !== "object") return undefined
  const obj = raw as Record<string, unknown>
  const en = typeof obj.en === "string" ? obj.en.trim() : ""
  const ar = typeof obj.ar === "string" ? obj.ar.trim() : ""
  if (!en && !ar) return undefined
  return {
    en: en || ar,
    ar: ar || en,
  }
}

function normalizeSubscriberDoc(
  id: string,
  raw: Record<string, unknown>,
): DemoSubscriber {
  const rawStatus = String(raw.status ?? "pending")
  const status: UserStatus =
    rawStatus === "active" ||
    rawStatus === "pending" ||
    rawStatus === "suspended" ||
    rawStatus === "rejected"
      ? rawStatus
      : "pending"

  const locale: "en" | "ar" = raw.locale === "en" ? "en" : "ar"
  const sex =
    raw.sex === "male" || raw.sex === "female" ? raw.sex : undefined

  const nameObj = normalizeBilingual(raw.name)
  const displayName = String(
    raw.displayName ?? nameObj?.en ?? nameObj?.ar ?? "Subscriber",
  )

  return {
    id,
    displayName,
    name: nameObj ?? { en: displayName, ar: displayName },
    email: String(raw.email ?? ""),
    phone: String(raw.phone ?? ""),
    status,
    locale,
    createdAt:
      typeof raw.createdAt === "string"
        ? raw.createdAt
        : new Date().toISOString(),
    updatedAt: typeof raw.updatedAt === "string" ? raw.updatedAt : undefined,
    heightCm:
      typeof raw.heightCm === "number" && Number.isFinite(raw.heightCm)
        ? raw.heightCm
        : undefined,
    age:
      typeof raw.age === "number" && Number.isFinite(raw.age)
        ? raw.age
        : undefined,
    startingWeightKg:
      typeof raw.startingWeightKg === "number" &&
      Number.isFinite(raw.startingWeightKg)
        ? raw.startingWeightKg
        : undefined,
    targetWeightKg:
      typeof raw.targetWeightKg === "number" &&
      Number.isFinite(raw.targetWeightKg)
        ? raw.targetWeightKg
        : undefined,
    sex,
    goal: normalizeBilingual(raw.goal),
    healthNotes: normalizeBilingual(raw.healthNotes),
    coachNotes: normalizeBilingual(raw.coachNotes),
    preferredPackageId:
      typeof raw.preferredPackageId === "string"
        ? raw.preferredPackageId
        : undefined,
    registrationRequestId:
      typeof raw.registrationRequestId === "string"
        ? raw.registrationRequestId
        : undefined,
  }
}

function normalizeRequestDoc(
  id: string,
  raw: Record<string, unknown>,
): DemoRegistrationRequest {
  const rawStatus = String(raw.status ?? "pending")
  const status: RegistrationRequestStatus =
    rawStatus === "approved" || rawStatus === "rejected"
      ? rawStatus
      : "pending"

  const goalObj = normalizeBilingual(raw.goal) ?? { en: "", ar: "" }
  const nameObj = normalizeBilingual(raw.name)
  const displayName = String(
    raw.displayName ?? nameObj?.en ?? nameObj?.ar ?? "",
  )
  const reviewNotesLocalized =
    normalizeBilingual(raw.reviewNotesLocalized) ??
    (typeof raw.reviewNotes === "string" && raw.reviewNotes.trim()
      ? { en: raw.reviewNotes.trim(), ar: raw.reviewNotes.trim() }
      : undefined)

  return {
    id,
    displayName,
    name: nameObj ?? { en: displayName, ar: displayName },
    email: String(raw.email ?? ""),
    phone: String(raw.phone ?? ""),
    locale: raw.locale === "en" ? "en" : "ar",
    packageId: typeof raw.packageId === "string" ? raw.packageId : null,
    goal: goalObj,
    source: raw.source === "manual" ? "manual" : "contact",
    status,
    subscriberId:
      typeof raw.subscriberId === "string" ? raw.subscriberId : undefined,
    reviewedBy: typeof raw.reviewedBy === "string" ? raw.reviewedBy : undefined,
    reviewNotes:
      typeof raw.reviewNotes === "string"
        ? raw.reviewNotes
        : reviewNotesLocalized?.en,
    reviewNotesLocalized,
    createdAt:
      typeof raw.createdAt === "string"
        ? raw.createdAt
        : new Date().toISOString(),
    reviewedAt: typeof raw.reviewedAt === "string" ? raw.reviewedAt : null,
  }
}

export async function fetchSubscribers(): Promise<DemoSubscriber[]> {
  try {
    const db = getDb()
    const snap = await getDocs(collection(db, SUBSCRIBERS_COLLECTION))

    if (snap.empty) {
      const seed = [...DEMO_SUBSCRIBERS]
      try {
        const batch = writeBatch(db)
        for (const sub of seed) {
          batch.set(
            doc(db, SUBSCRIBERS_COLLECTION, sub.id),
            stripUndefined({
              ...sub,
              updatedAt: sub.updatedAt ?? new Date().toISOString(),
            }),
          )
        }
        await batch.commit()
      } catch (err) {
        console.warn("[Firestore] Failed to seed subscribers collection:", err)
      }
      return syncDemoSubscribersArray(seed)
    }

    const list = snap.docs.map((d) =>
      normalizeSubscriberDoc(d.id, d.data() as Record<string, unknown>),
    )
    return syncDemoSubscribersArray(list)
  } catch (err) {
    console.warn("[Firestore] Failed to read subscribers collection:", err)
    return syncDemoSubscribersArray([...DEMO_SUBSCRIBERS])
  }
}

export async function fetchRegistrationRequests(): Promise<
  DemoRegistrationRequest[]
> {
  try {
    const db = getDb()
    const snap = await getDocs(collection(db, REGISTRATION_REQUESTS_COLLECTION))

    if (snap.empty) {
      const seed = [...DEMO_REGISTRATION_REQUESTS]
      try {
        const batch = writeBatch(db)
        for (const req of seed) {
          batch.set(
            doc(db, REGISTRATION_REQUESTS_COLLECTION, req.id),
            stripUndefined({ ...req }),
          )
        }
        await batch.commit()
      } catch (err) {
        console.warn(
          "[Firestore] Failed to seed registration_requests collection:",
          err,
        )
      }
      return syncDemoRequestsArray(seed)
    }

    const list = snap.docs.map((d) =>
      normalizeRequestDoc(d.id, d.data() as Record<string, unknown>),
    )
    return syncDemoRequestsArray(list)
  } catch (err) {
    console.warn(
      "[Firestore] Failed to read registration_requests collection:",
      err,
    )
    return syncDemoRequestsArray([...DEMO_REGISTRATION_REQUESTS])
  }
}

export type SaveSubscriberInput = {
  id?: string
  displayName: string
  name?: { en: string; ar: string }
  email: string
  phone: string
  status: UserStatus
  locale: "en" | "ar"
  sex?: "male" | "female"
  age?: number
  heightCm?: number
  startingWeightKg?: number
  targetWeightKg?: number
  goal?: { en: string; ar: string }
  healthNotes?: { en: string; ar: string }
  coachNotes?: { en: string; ar: string }
  preferredPackageId?: string
  initialSubscription?: {
    packageId: string
    status: "active" | "pending"
    startsAt?: string | null
    endsAt?: string | null
    activatedBy?: string
    notes?: string
  }
}

export async function saveSubscriber(
  input: SaveSubscriberInput,
): Promise<DemoSubscriber> {
  const now = new Date().toISOString()
  const existing = input.id
    ? DEMO_SUBSCRIBERS.find((item) => item.id === input.id)
    : undefined

  const id =
    existing?.id ??
    input.id ??
    `sub-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`

  const nameObj =
    normalizeBilingual(input.name) ??
    existing?.name ?? {
      en: input.displayName.trim(),
      ar: input.displayName.trim(),
    }
  const resolvedDisplayName =
    input.displayName.trim() || nameObj.en || nameObj.ar

  const record: DemoSubscriber = {
    id,
    displayName: resolvedDisplayName,
    name: {
      en: nameObj.en || resolvedDisplayName,
      ar: nameObj.ar || resolvedDisplayName,
    },
    email: input.email.trim().toLowerCase(),
    phone: input.phone.trim(),
    status: input.status,
    locale: input.locale,
    sex: input.sex,
    age:
      input.age && Number.isFinite(input.age) && input.age > 0
        ? Math.round(input.age)
        : undefined,
    heightCm:
      input.heightCm && Number.isFinite(input.heightCm) && input.heightCm > 0
        ? Math.round(input.heightCm)
        : undefined,
    startingWeightKg:
      input.startingWeightKg &&
      Number.isFinite(input.startingWeightKg) &&
      input.startingWeightKg > 0
        ? Number(input.startingWeightKg)
        : undefined,
    targetWeightKg:
      input.targetWeightKg &&
      Number.isFinite(input.targetWeightKg) &&
      input.targetWeightKg > 0
        ? Number(input.targetWeightKg)
        : undefined,
    goal: normalizeBilingual(input.goal),
    healthNotes: normalizeBilingual(input.healthNotes),
    coachNotes: normalizeBilingual(input.coachNotes),
    preferredPackageId:
      input.preferredPackageId ??
      input.initialSubscription?.packageId ??
      existing?.preferredPackageId,
    registrationRequestId: existing?.registrationRequestId,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  }

  const nextList = existing
    ? DEMO_SUBSCRIBERS.map((item) => (item.id === id ? record : item))
    : [record, ...DEMO_SUBSCRIBERS]

  syncDemoSubscribersArray(nextList)

  try {
    const db = getDb()
    await setDoc(
      doc(db, SUBSCRIBERS_COLLECTION, id),
      stripUndefined({ ...record }),
    )
  } catch (err) {
    console.warn("[Firestore] Failed to write subscriber:", err)
  }

  if (!existing && input.initialSubscription?.packageId) {
    await assignSubscription({
      subscriberId: id,
      subscriberName: record.displayName,
      subscriberEmail: record.email,
      packageId: input.initialSubscription.packageId,
      status: input.initialSubscription.status,
      startsAt: input.initialSubscription.startsAt,
      endsAt: input.initialSubscription.endsAt,
      activatedBy: input.initialSubscription.activatedBy,
      notes: input.initialSubscription.notes,
    })
  }

  return record
}

export type UpdateSubscriberStatusInput = {
  subscriberId: string
  status: UserStatus
  syncSubscription?: boolean
  adminName?: string
  notes?: string
}

export async function updateSubscriberAccountStatus(
  input: UpdateSubscriberStatusInput,
): Promise<DemoSubscriber> {
  const now = new Date().toISOString()
  const existing = DEMO_SUBSCRIBERS.find(
    (item) => item.id === input.subscriberId,
  )
  if (!existing) {
    throw new Error("Subscriber not found")
  }

  const updated: DemoSubscriber = {
    ...existing,
    status: input.status,
    updatedAt: now,
  }

  const nextList = DEMO_SUBSCRIBERS.map((item) =>
    item.id === input.subscriberId ? updated : item,
  )
  syncDemoSubscribersArray(nextList)

  try {
    const db = getDb()
    await setDoc(
      doc(db, SUBSCRIBERS_COLLECTION, updated.id),
      stripUndefined({ ...updated }),
    )
  } catch (err) {
    console.warn("[Firestore] Failed to update subscriber status:", err)
  }

  // Keep subscription status consistent with account lifecycle when requested
  if (input.syncSubscription !== false) {
    const currentSub = currentSubscriptionFor(updated.id)
    if (
      (input.status === "suspended" || input.status === "rejected") &&
      currentSub &&
      currentSub.status === "active"
    ) {
      await updateSubscriptionLifecycle({
        subscriptionId: currentSub.id,
        action: input.status === "rejected" ? "terminate" : "suspend",
        activatedBy: input.adminName,
        notes:
          input.notes ??
          (input.status === "suspended"
            ? "Account suspended by admin"
            : "Account deactivated by admin"),
      })
    } else if (
      input.status === "active" &&
      currentSub &&
      currentSub.status === "suspended"
    ) {
      await updateSubscriptionLifecycle({
        subscriptionId: currentSub.id,
        action: "activate",
        activatedBy: input.adminName,
        notes: input.notes ?? "Account reactivated by admin",
      })
    }
  }

  return updated
}

export type CreateRegistrationRequestInput = {
  displayName: string
  name?: { en: string; ar: string }
  email: string
  phone: string
  locale: "en" | "ar"
  packageId: string | null
  goal: string | { en: string; ar: string }
  source?: "contact" | "manual"
}

export async function createRegistrationRequest(
  input: CreateRegistrationRequestInput,
): Promise<DemoRegistrationRequest> {
  const now = new Date().toISOString()
  const id = `req-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`
  const goalObj =
    typeof input.goal === "string"
      ? { en: input.goal.trim(), ar: input.goal.trim() }
      : {
          en: input.goal.en.trim() || input.goal.ar.trim(),
          ar: input.goal.ar.trim() || input.goal.en.trim(),
        }

  const nameObj =
    normalizeBilingual(input.name) ?? {
      en: input.displayName.trim(),
      ar: input.displayName.trim(),
    }
  const resolvedDisplayName =
    input.displayName.trim() || nameObj.en || nameObj.ar

  const record: DemoRegistrationRequest = {
    id,
    displayName: resolvedDisplayName,
    name: {
      en: nameObj.en || resolvedDisplayName,
      ar: nameObj.ar || resolvedDisplayName,
    },
    email: input.email.trim().toLowerCase(),
    phone: input.phone.trim(),
    locale: input.locale,
    packageId: input.packageId || null,
    goal: goalObj,
    source: input.source ?? "contact",
    status: "pending",
    createdAt: now,
    reviewedAt: null,
  }

  syncDemoRequestsArray([record, ...DEMO_REGISTRATION_REQUESTS])

  try {
    const db = getDb()
    await setDoc(
      doc(db, REGISTRATION_REQUESTS_COLLECTION, id),
      stripUndefined({ ...record }),
    )
  } catch (err) {
    console.warn("[Firestore] Failed to create registration request:", err)
  }

  return record
}

export type ReviewRegistrationRequestInput = {
  requestId: string
  decision: "approved" | "rejected"
  reviewedBy?: string
  reviewNotes?: string
  reviewNotesLocalized?: { en: string; ar: string }
  assignPackage?: boolean
  packageId?: string | null
  subscriptionStatus?: "active" | "pending"
  startsAt?: string | null
  endsAt?: string | null
}

export async function reviewRegistrationRequest(
  input: ReviewRegistrationRequestInput,
): Promise<{
  request: DemoRegistrationRequest
  subscriber?: DemoSubscriber
}> {
  const now = new Date().toISOString()
  const existingReq = DEMO_REGISTRATION_REQUESTS.find(
    (item) => item.id === input.requestId,
  )
  if (!existingReq) {
    throw new Error("Registration request not found")
  }

  let matchedSub =
    (existingReq.subscriberId
      ? DEMO_SUBSCRIBERS.find((s) => s.id === existingReq.subscriberId)
      : undefined) ??
    DEMO_SUBSCRIBERS.find(
      (s) => s.email.toLowerCase() === existingReq.email.toLowerCase(),
    )

  const reviewNotesLocalized =
    normalizeBilingual(input.reviewNotesLocalized) ??
    (input.reviewNotes?.trim()
      ? { en: input.reviewNotes.trim(), ar: input.reviewNotes.trim() }
      : undefined)

  if (input.decision === "approved") {
    const subId =
      matchedSub?.id ??
      `sub-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`
    const selectedPkgId =
      input.packageId !== undefined ? input.packageId : existingReq.packageId

    const updatedSub: DemoSubscriber = {
      id: subId,
      displayName: matchedSub?.displayName || existingReq.displayName,
      name:
        matchedSub?.name ??
        existingReq.name ?? {
          en: existingReq.displayName,
          ar: existingReq.displayName,
        },
      email: matchedSub?.email || existingReq.email.toLowerCase(),
      phone: matchedSub?.phone || existingReq.phone,
      status: "active",
      locale: matchedSub?.locale ?? existingReq.locale,
      sex: matchedSub?.sex,
      age: matchedSub?.age,
      heightCm: matchedSub?.heightCm,
      startingWeightKg: matchedSub?.startingWeightKg,
      targetWeightKg: matchedSub?.targetWeightKg,
      goal: matchedSub?.goal ?? existingReq.goal,
      healthNotes: matchedSub?.healthNotes,
      coachNotes:
        reviewNotesLocalized && !matchedSub?.coachNotes
          ? reviewNotesLocalized
          : matchedSub?.coachNotes,
      preferredPackageId: selectedPkgId ?? matchedSub?.preferredPackageId,
      registrationRequestId: existingReq.id,
      createdAt: matchedSub?.createdAt ?? now,
      updatedAt: now,
    }

    const nextSubs = matchedSub
      ? DEMO_SUBSCRIBERS.map((s) => (s.id === subId ? updatedSub : s))
      : [updatedSub, ...DEMO_SUBSCRIBERS]
    syncDemoSubscribersArray(nextSubs)
    matchedSub = updatedSub

    const updatedReq: DemoRegistrationRequest = {
      ...existingReq,
      status: "approved",
      packageId: selectedPkgId ?? existingReq.packageId,
      subscriberId: subId,
      reviewedBy: input.reviewedBy || "Head Coach",
      reviewNotes: reviewNotesLocalized?.en,
      reviewNotesLocalized,
      reviewedAt: now,
    }

    const nextReqs = DEMO_REGISTRATION_REQUESTS.map((r) =>
      r.id === updatedReq.id ? updatedReq : r,
    )
    syncDemoRequestsArray(nextReqs)

    try {
      const db = getDb()
      const batch = writeBatch(db)
      batch.set(
        doc(db, SUBSCRIBERS_COLLECTION, updatedSub.id),
        stripUndefined({ ...updatedSub }),
      )
      batch.set(
        doc(db, REGISTRATION_REQUESTS_COLLECTION, updatedReq.id),
        stripUndefined({ ...updatedReq }),
      )
      await batch.commit()
    } catch (err) {
      console.warn("[Firestore] Failed to persist request approval:", err)
    }

    if (input.assignPackage !== false && selectedPkgId) {
      await assignSubscription({
        subscriberId: updatedSub.id,
        subscriberName: updatedSub.displayName,
        subscriberEmail: updatedSub.email,
        packageId: selectedPkgId,
        status: input.subscriptionStatus ?? "active",
        startsAt: input.startsAt,
        endsAt: input.endsAt,
        activatedBy: input.reviewedBy || "Head Coach",
        notes:
          reviewNotesLocalized?.en ||
          "Assigned upon registration request approval",
        notesLocalized: reviewNotesLocalized ?? {
          en: "Assigned upon registration request approval",
          ar: "تم التعيين عند الموافقة على طلب التسجيل",
        },
      })
    }

    return { request: updatedReq, subscriber: updatedSub }
  }

  // Rejected flow
  if (matchedSub && matchedSub.status === "pending") {
    const rejectedSub: DemoSubscriber = {
      ...matchedSub,
      status: "rejected",
      updatedAt: now,
    }
    const nextSubs = DEMO_SUBSCRIBERS.map((s) =>
      s.id === rejectedSub.id ? rejectedSub : s,
    )
    syncDemoSubscribersArray(nextSubs)
    matchedSub = rejectedSub

    try {
      const db = getDb()
      await setDoc(
        doc(db, SUBSCRIBERS_COLLECTION, rejectedSub.id),
        stripUndefined({ ...rejectedSub }),
      )
    } catch (err) {
      console.warn("[Firestore] Failed to update rejected subscriber:", err)
    }
  }

  const updatedReq: DemoRegistrationRequest = {
    ...existingReq,
    status: "rejected",
    subscriberId: matchedSub?.id ?? existingReq.subscriberId,
    reviewedBy: input.reviewedBy || "Head Coach",
    reviewNotes: reviewNotesLocalized?.en,
    reviewNotesLocalized,
    reviewedAt: now,
  }

  const nextReqs = DEMO_REGISTRATION_REQUESTS.map((r) =>
    r.id === updatedReq.id ? updatedReq : r,
  )
  syncDemoRequestsArray(nextReqs)

  try {
    const db = getDb()
    await setDoc(
      doc(db, REGISTRATION_REQUESTS_COLLECTION, updatedReq.id),
      stripUndefined({ ...updatedReq }),
    )
  } catch (err) {
    console.warn("[Firestore] Failed to persist request rejection:", err)
  }

  return { request: updatedReq, subscriber: matchedSub }
}

