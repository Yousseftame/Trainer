import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  query,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore"
import { getDb } from "@/lib/firebase/firestore"
import {
  callApproveRegistrationRequest,
  callCreateSubscriberAccount,
  callDeleteSubscriberAccount,
  callPurgeDemoSubscriberData,
  callRejectRegistrationRequest,
  callSetSubscriberAccountStatus,
  callUpdateSubscriberAccount,
} from "@/lib/firebase/callables"
import {
  clearSubscriberLocalCaches,
  type RegistrationRequest,
  type RegistrationRequestStatus,
  type Subscriber,
} from "@/features/subscribers/types"
import type { UserStatus } from "@/types/user"
import type { SubscriberSubscription } from "@/types/subscription"
import { fetchSubscriptions } from "@/features/subscriptions/service"

const SUBSCRIBERS_COLLECTION = "subscribers"
const REGISTRATION_REQUESTS_COLLECTION = "registration_requests"

function stripUndefined<T extends Record<string, unknown>>(obj: T): T {
  const out: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(obj)) {
    if (v !== undefined) out[k] = v
  }
  return out as T
}

function normalizeBilingual(
  raw: unknown,
): { en: string; ar: string } | undefined {
  if (!raw || typeof raw !== "object") return undefined
  const obj = raw as Record<string, unknown>
  const en = typeof obj.en === "string" ? obj.en.trim() : ""
  const ar = typeof obj.ar === "string" ? obj.ar.trim() : ""
  if (!en && !ar) return undefined
  return { en: en || ar, ar: ar || en }
}

export function normalizeSubscriberDoc(
  id: string,
  raw: Record<string, unknown>,
): Subscriber {
  const rawStatus = String(raw.status ?? "pending")
  const status: UserStatus =
    rawStatus === "active" ||
    rawStatus === "pending" ||
    rawStatus === "suspended" ||
    rawStatus === "rejected"
      ? rawStatus
      : "pending"

  const locale: "en" | "ar" = raw.locale === "en" ? "en" : "ar"
  const sex = raw.sex === "male" || raw.sex === "female" ? raw.sex : undefined
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
): RegistrationRequest {
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

export async function fetchSubscribers(): Promise<Subscriber[]> {
  clearSubscriberLocalCaches()
  const db = getDb()
  const snap = await getDocs(collection(db, SUBSCRIBERS_COLLECTION))
  return snap.docs
    .map((d) => normalizeSubscriberDoc(d.id, d.data() as Record<string, unknown>))
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    )
}

export async function fetchSubscriberById(
  id: string,
): Promise<Subscriber | null> {
  if (!id) return null
  const db = getDb()
  const snap = await getDoc(doc(db, SUBSCRIBERS_COLLECTION, id))
  if (!snap.exists()) return null
  return normalizeSubscriberDoc(snap.id, snap.data() as Record<string, unknown>)
}

export async function fetchSubscriberByEmail(
  email: string,
): Promise<Subscriber | null> {
  const normalized = email.trim().toLowerCase()
  if (!normalized) return null
  const db = getDb()
  const snap = await getDocs(
    query(
      collection(db, SUBSCRIBERS_COLLECTION),
      where("email", "==", normalized),
      limit(1),
    ),
  )
  if (snap.empty) return null
  const d = snap.docs[0]
  return normalizeSubscriberDoc(d.id, d.data() as Record<string, unknown>)
}

export async function fetchRegistrationRequests(): Promise<
  RegistrationRequest[]
> {
  const db = getDb()
  const snap = await getDocs(collection(db, REGISTRATION_REQUESTS_COLLECTION))
  return snap.docs
    .map((d) => normalizeRequestDoc(d.id, d.data() as Record<string, unknown>))
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    )
}

export type SaveSubscriberInput = {
  id?: string
  displayName: string
  name?: { en: string; ar: string }
  email: string
  password?: string
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

/** Create via Cloud Function; update profile fields via Firestore (status immutable). */
export async function saveSubscriber(
  input: SaveSubscriberInput,
): Promise<Subscriber> {
  if (!input.id) {
    const result = await callCreateSubscriberAccount({
      displayName: input.displayName,
      name: input.name,
      email: input.email,
      password: input.password,
      phone: input.phone,
      status: input.status,
      locale: input.locale,
      sex: input.sex,
      age: input.age,
      heightCm: input.heightCm,
      startingWeightKg: input.startingWeightKg,
      targetWeightKg: input.targetWeightKg,
      goal: input.goal,
      healthNotes: input.healthNotes,
      coachNotes: input.coachNotes,
      preferredPackageId: input.preferredPackageId,
      initialSubscription: input.initialSubscription,
    })
    return normalizeSubscriberDoc(
      result.uid,
      result.subscriber as unknown as Record<string, unknown>,
    )
  }

  const existing = await fetchSubscriberById(input.id)
  if (!existing) throw new Error("Subscriber not found")

  const now = new Date().toISOString()
  const nameObj =
    normalizeBilingual(input.name) ??
    existing.name ?? {
      en: input.displayName.trim(),
      ar: input.displayName.trim(),
    }
  const resolvedDisplayName =
    input.displayName.trim() || nameObj.en || nameObj.ar

  const patch = stripUndefined({
    displayName: resolvedDisplayName,
    name: {
      en: nameObj.en || resolvedDisplayName,
      ar: nameObj.ar || resolvedDisplayName,
    },
    phone: input.phone.trim(),
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
      input.preferredPackageId ?? existing.preferredPackageId,
    updatedAt: now,
  })

  const db = getDb()
  await updateDoc(doc(db, SUBSCRIBERS_COLLECTION, input.id), patch)

  // Auth password / displayName must go through Admin SDK (Cloud Function)
  const nextPassword = input.password?.trim()
  if (nextPassword || resolvedDisplayName !== existing.displayName) {
    await callUpdateSubscriberAccount({
      subscriberId: input.id,
      displayName: resolvedDisplayName,
      password: nextPassword || undefined,
    })
  }

  // Status changes must go through Cloud Function
  if (input.status !== existing.status) {
    const result = await callSetSubscriberAccountStatus({
      subscriberId: input.id,
      status: input.status,
      syncSubscription: true,
    })
    return normalizeSubscriberDoc(
      input.id,
      result.subscriber as unknown as Record<string, unknown>,
    )
  }

  return {
    ...existing,
    ...patch,
    id: input.id,
    email: existing.email,
    status: existing.status,
    createdAt: existing.createdAt,
  } as Subscriber
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
): Promise<Subscriber> {
  const result = await callSetSubscriberAccountStatus(input)
  return normalizeSubscriberDoc(
    input.subscriberId,
    result.subscriber as unknown as Record<string, unknown>,
  )
}

export async function deleteSubscriberAccount(
  subscriberId: string,
): Promise<void> {
  await callDeleteSubscriberAccount(subscriberId)
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
): Promise<RegistrationRequest> {
  const now = new Date().toISOString()
  const db = getDb()
  const ref = doc(collection(db, REGISTRATION_REQUESTS_COLLECTION))
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

  const record: RegistrationRequest = {
    id: ref.id,
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

  await setDoc(ref, stripUndefined({ ...record }))
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
  password?: string
}

export async function reviewRegistrationRequest(
  input: ReviewRegistrationRequestInput,
): Promise<{
  request: RegistrationRequest
  subscriber?: Subscriber
}> {
  if (input.decision === "approved") {
    const result = await callApproveRegistrationRequest({
      requestId: input.requestId,
      reviewedBy: input.reviewedBy,
      reviewNotes: input.reviewNotes,
      reviewNotesLocalized: input.reviewNotesLocalized,
      assignPackage: input.assignPackage,
      packageId: input.packageId,
      subscriptionStatus: input.subscriptionStatus,
      startsAt: input.startsAt,
      endsAt: input.endsAt,
      password: input.password,
    })
    return {
      request: normalizeRequestDoc(
        result.request.id,
        result.request as unknown as Record<string, unknown>,
      ),
      subscriber: normalizeSubscriberDoc(
        result.subscriber.id,
        result.subscriber as unknown as Record<string, unknown>,
      ),
    }
  }

  const result = await callRejectRegistrationRequest({
    requestId: input.requestId,
    reviewedBy: input.reviewedBy,
    reviewNotes: input.reviewNotes,
    reviewNotesLocalized: input.reviewNotesLocalized,
  })
  return {
    request: normalizeRequestDoc(
      result.request.id,
      result.request as unknown as Record<string, unknown>,
    ),
  }
}

export async function updateSubscriberCoachNotes(
  subscriberId: string,
  coachNotes: { en: string; ar: string } | string,
): Promise<Subscriber> {
  const current = await fetchSubscriberById(subscriberId)
  if (!current) throw new Error(`Subscriber ${subscriberId} not found`)

  const notesObj: { en: string; ar: string } =
    typeof coachNotes === "string"
      ? { en: coachNotes.trim(), ar: coachNotes.trim() }
      : {
          en: coachNotes.en.trim() || coachNotes.ar.trim(),
          ar: coachNotes.ar.trim() || coachNotes.en.trim(),
        }

  const now = new Date().toISOString()
  const db = getDb()
  await updateDoc(doc(db, SUBSCRIBERS_COLLECTION, subscriberId), {
    coachNotes: notesObj,
    updatedAt: now,
  })

  return { ...current, coachNotes: notesObj, updatedAt: now }
}

export async function purgeDemoSubscriberData() {
  clearSubscriberLocalCaches()
  return callPurgeDemoSubscriberData()
}

export function currentSubscriptionForSubscriber(
  subscriberId: string,
  subscriptions: SubscriberSubscription[],
): SubscriberSubscription | undefined {
  return (
    subscriptions.find(
      (item) =>
        item.subscriberId === subscriberId &&
        (item.status === "active" || item.status === "suspended"),
    ) ??
    subscriptions.find((item) => item.subscriberId === subscriberId)
  )
}

export async function subscriberRow(
  subscriber: Subscriber,
): Promise<Subscriber & { subscription?: SubscriberSubscription }> {
  const subscriptions = await fetchSubscriptions()
  return {
    ...subscriber,
    subscription: currentSubscriptionForSubscriber(subscriber.id, subscriptions),
  }
}

export function buildSubscriberRow(
  subscriber: Subscriber,
  subscriptions: SubscriberSubscription[],
): Subscriber & { subscription?: SubscriberSubscription } {
  return {
    ...subscriber,
    subscription: currentSubscriptionForSubscriber(subscriber.id, subscriptions),
  }
}
