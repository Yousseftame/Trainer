import {
  collection,
  doc,
  getDocs,
  setDoc,
  writeBatch,
} from "firebase/firestore"
import { getDb } from "@/lib/firebase/firestore"
import {
  DEMO_PACKAGES,
  DEMO_SUBSCRIPTIONS,
  type DemoPackage,
} from "@/features/subscriptions/demo"
import { DEMO_SUBSCRIBERS } from "@/features/subscribers/demo"
import {
  computeEndsAtIso,
  normalizeEntitlements,
  resolveEffectiveSubscriptionStatus,
} from "@/features/subscriptions/entitlements"
import type {
  PackageEntitlements,
  PackageTone,
  SubscriberSubscription,
  SubscriptionStatus,
} from "@/types/subscription"

const PACKAGES_COLLECTION = "packages"
const SUBSCRIPTIONS_COLLECTION = "subscriptions"
const PACKAGES_STORAGE_KEY = "derpyfit_packages_v1"
const SUBSCRIPTIONS_STORAGE_KEY = "derpyfit_subscriptions_v1"

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

function syncDemoPackagesArray(next: DemoPackage[]): DemoPackage[] {
  const sorted = [...next].sort((a, b) => a.sortOrder - b.sortOrder)
  DEMO_PACKAGES.splice(0, DEMO_PACKAGES.length, ...sorted)
  writeLocalCache(PACKAGES_STORAGE_KEY, sorted)
  return sorted
}

function syncDemoSubscriptionsArray(
  next: SubscriberSubscription[],
): SubscriberSubscription[] {
  const sorted = [...next].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  )
  DEMO_SUBSCRIPTIONS.splice(0, DEMO_SUBSCRIPTIONS.length, ...sorted)
  writeLocalCache(SUBSCRIPTIONS_STORAGE_KEY, sorted)
  return sorted
}

async function ensureSubscriberAccountActive(subscriberId: string): Promise<void> {
  const idx = DEMO_SUBSCRIBERS.findIndex((s) => s.id === subscriberId)
  if (idx === -1) return
  const sub = DEMO_SUBSCRIBERS[idx]
  if (sub.status === "active") return
  const updated = {
    ...sub,
    status: "active" as const,
    updatedAt: new Date().toISOString(),
  }
  DEMO_SUBSCRIBERS.splice(idx, 1, updated)
  writeLocalCache("derpyfit_subscribers_v1", DEMO_SUBSCRIBERS)
  try {
    const db = getDb()
    await setDoc(doc(db, "subscribers", updated.id), stripUndefined({ ...updated }))
  } catch {
    // Kept in local cache
  }
}

// Initialize in-memory arrays from localStorage immediately on module load
const cachedPackages = readLocalCache<DemoPackage>(PACKAGES_STORAGE_KEY)
if (cachedPackages?.length) {
  DEMO_PACKAGES.splice(0, DEMO_PACKAGES.length, ...cachedPackages)
}
const cachedSubscriptions = readLocalCache<SubscriberSubscription>(
  SUBSCRIPTIONS_STORAGE_KEY,
)
if (cachedSubscriptions?.length) {
  DEMO_SUBSCRIPTIONS.splice(0, DEMO_SUBSCRIPTIONS.length, ...cachedSubscriptions)
}

function normalizePackageDoc(id: string, raw: Record<string, unknown>): DemoPackage {
  const nameRaw = (raw.name ?? {}) as Record<string, string>
  const descRaw = (raw.description ?? {}) as Record<string, string>
  const priceRaw = (raw.price ?? {}) as Record<string, string>
  const periodRaw = (raw.period ?? {}) as Record<string, string>
  const flRaw = (raw.featureList ?? {}) as Record<string, string[]>

  return {
    id,
    name: {
      en: String(nameRaw.en ?? "Package"),
      ar: String(nameRaw.ar ?? nameRaw.en ?? "باقة"),
    },
    description: {
      en: String(descRaw.en ?? ""),
      ar: String(descRaw.ar ?? descRaw.en ?? ""),
    },
    durationDays: Number(raw.durationDays) || 30,
    features: Array.isArray(raw.features) ? (raw.features as string[]) : [],
    isActive: raw.isActive !== false,
    sortOrder: Number(raw.sortOrder) || 1,
    featured: Boolean(raw.featured),
    tone: (raw.tone === "dark" || raw.tone === "sage" ? raw.tone : "light") as PackageTone,
    price: {
      en: String(priceRaw.en ?? "EGP 0"),
      ar: String(priceRaw.ar ?? priceRaw.en ?? "٠ ج.م"),
    },
    period: {
      en: String(periodRaw.en ?? "/month"),
      ar: String(periodRaw.ar ?? periodRaw.en ?? "/شهر"),
    },
    featureList: {
      en: Array.isArray(flRaw.en) ? flRaw.en.map(String) : [],
      ar: Array.isArray(flRaw.ar) ? flRaw.ar.map(String) : [],
    },
    entitlements: normalizeEntitlements(
      raw.entitlements as Partial<PackageEntitlements> | undefined,
    ),
    createdAt: typeof raw.createdAt === "string" ? raw.createdAt : undefined,
    updatedAt: typeof raw.updatedAt === "string" ? raw.updatedAt : undefined,
  }
}

function normalizeSubscriptionDoc(
  id: string,
  raw: Record<string, unknown>,
): SubscriberSubscription {
  const rawStatus = String(raw.status ?? "pending") as SubscriptionStatus
  const startsAt = typeof raw.startsAt === "string" ? raw.startsAt : null
  const endsAt = typeof raw.endsAt === "string" ? raw.endsAt : null
  const effectiveStatus =
    resolveEffectiveSubscriptionStatus({ status: rawStatus, startsAt, endsAt }) ??
    rawStatus

  const pkgNameRaw = raw.packageName as { en?: string; ar?: string } | undefined

  return {
    id,
    subscriberId: String(raw.subscriberId ?? ""),
    subscriberName:
      typeof raw.subscriberName === "string" ? raw.subscriberName : undefined,
    subscriberEmail:
      typeof raw.subscriberEmail === "string" ? raw.subscriberEmail : undefined,
    packageId: String(raw.packageId ?? ""),
    packageName:
      pkgNameRaw && (pkgNameRaw.en || pkgNameRaw.ar)
        ? {
            en: String(pkgNameRaw.en ?? pkgNameRaw.ar ?? ""),
            ar: String(pkgNameRaw.ar ?? pkgNameRaw.en ?? ""),
          }
        : undefined,
    entitlementsSnapshot: raw.entitlementsSnapshot
      ? normalizeEntitlements(raw.entitlementsSnapshot as Partial<PackageEntitlements>)
      : undefined,
    status: effectiveStatus,
    startsAt,
    endsAt,
    activatedBy: typeof raw.activatedBy === "string" ? raw.activatedBy : undefined,
    notes: typeof raw.notes === "string" ? raw.notes : undefined,
    notesLocalized:
      raw.notesLocalized && typeof raw.notesLocalized === "object"
        ? {
            en: String(
              (raw.notesLocalized as Record<string, unknown>).en ??
                (raw.notesLocalized as Record<string, unknown>).ar ??
                raw.notes ??
                "",
            ),
            ar: String(
              (raw.notesLocalized as Record<string, unknown>).ar ??
                (raw.notesLocalized as Record<string, unknown>).en ??
                raw.notes ??
                "",
            ),
          }
        : typeof raw.notes === "string" && raw.notes.trim()
          ? { en: raw.notes.trim(), ar: raw.notes.trim() }
          : undefined,
    renewedFromId:
      typeof raw.renewedFromId === "string" ? raw.renewedFromId : undefined,
    createdAt:
      typeof raw.createdAt === "string" ? raw.createdAt : new Date().toISOString(),
    updatedAt:
      typeof raw.updatedAt === "string" ? raw.updatedAt : new Date().toISOString(),
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

export async function fetchPackages(): Promise<DemoPackage[]> {
  try {
    const db = getDb()
    const snap = await getDocs(collection(db, PACKAGES_COLLECTION))

    if (snap.empty) {
      const seed = [...DEMO_PACKAGES]
      try {
        const batch = writeBatch(db)
        for (const pkg of seed) {
          batch.set(
            doc(db, PACKAGES_COLLECTION, pkg.id),
            stripUndefined({
              ...pkg,
              createdAt: pkg.createdAt ?? new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            }),
          )
        }
        await batch.commit()
      } catch (err) {
        console.warn("[Firestore] Failed to seed packages collection:", err)
      }
      return syncDemoPackagesArray(seed)
    }

    const list = snap.docs.map((d) =>
      normalizePackageDoc(d.id, d.data() as Record<string, unknown>),
    )
    return syncDemoPackagesArray(list)
  } catch (err) {
    console.warn("[Firestore] Failed to read packages collection:", err)
    return syncDemoPackagesArray([...DEMO_PACKAGES])
  }
}

export async function fetchSubscriptions(): Promise<SubscriberSubscription[]> {
  try {
    const db = getDb()
    const snap = await getDocs(collection(db, SUBSCRIPTIONS_COLLECTION))

    if (snap.empty) {
      const seed = DEMO_SUBSCRIPTIONS.map((s) =>
        normalizeSubscriptionDoc(s.id, s as unknown as Record<string, unknown>),
      )
      try {
        const batch = writeBatch(db)
        for (const item of seed) {
          batch.set(
            doc(db, SUBSCRIPTIONS_COLLECTION, item.id),
            stripUndefined({ ...item }),
          )
        }
        await batch.commit()
      } catch (err) {
        console.warn("[Firestore] Failed to seed subscriptions collection:", err)
      }
      return syncDemoSubscriptionsArray(seed)
    }

    const list = snap.docs.map((d) =>
      normalizeSubscriptionDoc(d.id, d.data() as Record<string, unknown>),
    )
    return syncDemoSubscriptionsArray(list)
  } catch (err) {
    console.warn("[Firestore] Failed to read subscriptions collection:", err)
    const normalized = DEMO_SUBSCRIPTIONS.map((s) =>
      normalizeSubscriptionDoc(s.id, s as unknown as Record<string, unknown>),
    )
    return syncDemoSubscriptionsArray(normalized)
  }
}

export type SavePackageInput = {
  id?: string
  name: { en: string; ar: string }
  description: { en: string; ar: string }
  price: { en: string; ar: string }
  period: { en: string; ar: string }
  durationDays: number
  tone: PackageTone
  featured: boolean
  isActive: boolean
  sortOrder?: number
  featureList: { en: string[]; ar: string[] }
  entitlements: PackageEntitlements
}

export async function savePackage(input: SavePackageInput): Promise<DemoPackage> {
  const now = new Date().toISOString()
  const existing = input.id
    ? DEMO_PACKAGES.find((item) => item.id === input.id)
    : undefined

  const id =
    existing?.id ??
    input.id ??
    `pkg-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`

  const sortOrder =
    input.sortOrder ??
    existing?.sortOrder ??
    (DEMO_PACKAGES.reduce((max, p) => Math.max(max, p.sortOrder), 0) + 1)

  const record: DemoPackage = {
    id,
    name: {
      en: input.name.en.trim() || input.name.ar.trim(),
      ar: input.name.ar.trim() || input.name.en.trim(),
    },
    description: {
      en: input.description.en.trim() || input.description.ar.trim(),
      ar: input.description.ar.trim() || input.description.en.trim(),
    },
    price: {
      en: input.price.en.trim() || input.price.ar.trim(),
      ar: input.price.ar.trim() || input.price.en.trim(),
    },
    period: {
      en: input.period.en.trim() || input.period.ar.trim() || "/month",
      ar: input.period.ar.trim() || input.period.en.trim() || "/شهر",
    },
    durationDays: Math.max(1, Math.round(Number(input.durationDays) || 30)),
    features: input.featureList.en.filter(Boolean),
    featureList: {
      en: input.featureList.en.map((s) => s.trim()).filter(Boolean),
      ar: input.featureList.ar.map((s) => s.trim()).filter(Boolean),
    },
    entitlements: normalizeEntitlements(input.entitlements),
    featured: Boolean(input.featured),
    tone: input.tone,
    isActive: Boolean(input.isActive),
    sortOrder,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  }

  // If this package is marked featured, unfeature others if desired or keep updated list
  const nextList = existing
    ? DEMO_PACKAGES.map((item) => (item.id === id ? record : item))
    : [...DEMO_PACKAGES, record]

  syncDemoPackagesArray(nextList)

  try {
    const db = getDb()
    await setDoc(doc(db, PACKAGES_COLLECTION, id), stripUndefined({ ...record }))
  } catch (err) {
    console.warn("[Firestore] Failed to write package:", err)
  }

  return record
}

export async function togglePackageActive(
  packageId: string,
  isActive: boolean,
): Promise<DemoPackage> {
  const existing = DEMO_PACKAGES.find((item) => item.id === packageId)
  if (!existing) {
    throw new Error("Package not found")
  }

  const updated: DemoPackage = {
    ...existing,
    isActive,
    updatedAt: new Date().toISOString(),
  }

  const nextList = DEMO_PACKAGES.map((item) =>
    item.id === packageId ? updated : item,
  )
  syncDemoPackagesArray(nextList)

  try {
    const db = getDb()
    await setDoc(doc(db, PACKAGES_COLLECTION, packageId), stripUndefined({ ...updated }))
  } catch (err) {
    console.warn("[Firestore] Failed to toggle package:", err)
  }

  return updated
}

export type AssignSubscriptionInput = {
  subscriberId: string
  subscriberName?: string
  subscriberEmail?: string
  packageId: string
  status: "active" | "pending"
  startsAt?: string | null
  endsAt?: string | null
  activatedBy?: string
  notes?: string
  notesLocalized?: { en: string; ar: string }
  renewedFromId?: string
}

export async function assignSubscription(
  input: AssignSubscriptionInput,
): Promise<SubscriberSubscription> {
  const now = new Date().toISOString()
  const pkg = DEMO_PACKAGES.find((item) => item.id === input.packageId)
  if (!pkg) {
    throw new Error("Package not found")
  }

  const isActivating = input.status === "active"
  const startsAtIso = isActivating
    ? input.startsAt || now
    : input.startsAt || null
  const endsAtIso = isActivating
    ? input.endsAt || computeEndsAtIso(startsAtIso ?? now, pkg.durationDays)
    : input.endsAt || null

  const cleanAr = input.notesLocalized?.ar?.trim() || input.notes?.trim() || ""
  const cleanEn = input.notesLocalized?.en?.trim() || input.notes?.trim() || ""
  const notesLocalized =
    cleanAr || cleanEn
      ? { ar: cleanAr || cleanEn, en: cleanEn || cleanAr }
      : undefined

  const newSub: SubscriberSubscription = {
    id: `sub-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
    subscriberId: input.subscriberId,
    subscriberName: input.subscriberName,
    subscriberEmail: input.subscriberEmail,
    packageId: pkg.id,
    packageName: { ...pkg.name },
    entitlementsSnapshot: normalizeEntitlements(pkg.entitlements),
    status: input.status,
    startsAt: startsAtIso,
    endsAt: endsAtIso,
    activatedBy: isActivating ? input.activatedBy || "Head Coach" : undefined,
    notes: notesLocalized?.en ?? (input.notes?.trim() ? input.notes.trim() : undefined),
    notesLocalized,
    renewedFromId: input.renewedFromId,
    createdAt: now,
    updatedAt: now,
  }

  // Expire any previous active/suspended subscription for this subscriber so history is preserved
  const updatedPrevious: SubscriberSubscription[] = []
  const nextList = DEMO_SUBSCRIPTIONS.map((item) => {
    if (
      isActivating &&
      item.subscriberId === input.subscriberId &&
      (item.status === "active" || item.status === "suspended" || item.status === "pending")
    ) {
      const closed: SubscriberSubscription = {
        ...item,
        status: "expired",
        endsAt: item.endsAt ?? now,
        updatedAt: now,
      }
      updatedPrevious.push(closed)
      return closed
    }
    return item
  })

  syncDemoSubscriptionsArray([newSub, ...nextList])

  if (isActivating) {
    await ensureSubscriberAccountActive(input.subscriberId)
  }

  try {
    const db = getDb()
    const batch = writeBatch(db)
    for (const prev of updatedPrevious) {
      batch.set(doc(db, SUBSCRIPTIONS_COLLECTION, prev.id), stripUndefined({ ...prev }))
    }
    batch.set(doc(db, SUBSCRIPTIONS_COLLECTION, newSub.id), stripUndefined({ ...newSub }))
    await batch.commit()
  } catch (err) {
    console.warn("[Firestore] Failed to assign subscription:", err)
  }

  return newSub
}

export type UpdateSubscriptionLifecycleInput = {
  subscriptionId: string
  action: "activate" | "renew" | "suspend" | "terminate" | "edit"
  packageId?: string
  status?: SubscriptionStatus
  startsAt?: string | null
  endsAt?: string | null
  activatedBy?: string
  notes?: string
  notesLocalized?: { en: string; ar: string }
}

export async function updateSubscriptionLifecycle(
  input: UpdateSubscriptionLifecycleInput,
): Promise<SubscriberSubscription> {
  const now = new Date().toISOString()
  const existing = DEMO_SUBSCRIPTIONS.find((item) => item.id === input.subscriptionId)
  if (!existing) {
    throw new Error("Subscription not found")
  }

  const pkg =
    DEMO_PACKAGES.find((item) => item.id === (input.packageId ?? existing.packageId)) ??
    DEMO_PACKAGES[0]

  // "renew" creates a brand new active cycle and keeps the previous record in history as "expired"
  if (input.action === "renew") {
    const startsAtIso = input.startsAt || now
    const endsAtIso =
      input.endsAt || computeEndsAtIso(startsAtIso, pkg?.durationDays ?? 30)

    return assignSubscription({
      subscriberId: existing.subscriberId,
      subscriberName: existing.subscriberName,
      subscriberEmail: existing.subscriberEmail,
      packageId: pkg?.id ?? existing.packageId,
      status: "active",
      startsAt: startsAtIso,
      endsAt: endsAtIso,
      activatedBy: input.activatedBy || "Head Coach",
      notes: input.notes,
      notesLocalized: input.notesLocalized,
      renewedFromId: existing.id,
    })
  }

  let nextStatus: SubscriptionStatus = existing.status
  let nextStartsAt = existing.startsAt
  let nextEndsAt = existing.endsAt
  let nextActivatedBy = existing.activatedBy

  if (input.action === "activate") {
    nextStatus = "active"
    nextStartsAt = input.startsAt || existing.startsAt || now
    nextEndsAt =
      input.endsAt ||
      computeEndsAtIso(nextStartsAt, pkg?.durationDays ?? 30)
    nextActivatedBy = input.activatedBy || existing.activatedBy || "Head Coach"
  } else if (input.action === "suspend") {
    nextStatus = "suspended"
    if (input.startsAt !== undefined) nextStartsAt = input.startsAt
    if (input.endsAt !== undefined) nextEndsAt = input.endsAt
  } else if (input.action === "terminate") {
    nextStatus = "cancelled"
    nextEndsAt = input.endsAt || now
  } else if (input.action === "edit") {
    nextStatus = input.status ?? existing.status
    if (input.startsAt !== undefined) nextStartsAt = input.startsAt
    if (input.endsAt !== undefined) nextEndsAt = input.endsAt
    if (nextStatus === "active" && !nextStartsAt) {
      nextStartsAt = now
    }
    if (nextStatus === "active" && !nextEndsAt) {
      nextEndsAt = computeEndsAtIso(nextStartsAt ?? now, pkg?.durationDays ?? 30)
    }
  }

  const cleanAr =
    input.notesLocalized?.ar?.trim() ??
    (input.notes !== undefined ? input.notes.trim() : existing.notesLocalized?.ar ?? existing.notes ?? "")
  const cleanEn =
    input.notesLocalized?.en?.trim() ??
    (input.notes !== undefined ? input.notes.trim() : existing.notesLocalized?.en ?? existing.notes ?? "")
  const nextNotesLocalized =
    cleanAr || cleanEn
      ? { ar: cleanAr || cleanEn, en: cleanEn || cleanAr }
      : undefined

  const updated: SubscriberSubscription = {
    ...existing,
    packageId: pkg?.id ?? existing.packageId,
    packageName: pkg ? { ...pkg.name } : existing.packageName,
    entitlementsSnapshot: pkg
      ? normalizeEntitlements(pkg.entitlements)
      : existing.entitlementsSnapshot,
    status: nextStatus,
    startsAt: nextStartsAt,
    endsAt: nextEndsAt,
    activatedBy: nextActivatedBy,
    notes: nextNotesLocalized?.en,
    notesLocalized: nextNotesLocalized,
    updatedAt: now,
  }

  const closedOthers: SubscriberSubscription[] = []
  const nextList = DEMO_SUBSCRIPTIONS.map((item) => {
    if (item.id === updated.id) return updated
    // Ensure only one active subscription per subscriber
    if (
      updated.status === "active" &&
      item.subscriberId === updated.subscriberId &&
      item.status === "active"
    ) {
      const closed: SubscriberSubscription = {
        ...item,
        status: "expired",
        endsAt: item.endsAt ?? now,
        updatedAt: now,
      }
      closedOthers.push(closed)
      return closed
    }
    return item
  })

  syncDemoSubscriptionsArray(nextList)

  if (updated.status === "active") {
    await ensureSubscriberAccountActive(updated.subscriberId)
  }

  try {
    const db = getDb()
    const batch = writeBatch(db)
    for (const other of closedOthers) {
      batch.set(doc(db, SUBSCRIPTIONS_COLLECTION, other.id), stripUndefined({ ...other }))
    }
    batch.set(doc(db, SUBSCRIPTIONS_COLLECTION, updated.id), stripUndefined({ ...updated }))
    await batch.commit()
  } catch (err) {
    console.warn("[Firestore] Failed to update subscription lifecycle:", err)
  }

  return updated
}

