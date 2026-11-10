import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  setDoc,
  where,
  writeBatch,
} from "firebase/firestore"
import { getDb } from "@/lib/firebase/firestore"
import {
  getSubscriptionsCache,
  setPackagesCache,
  setSubscriptionsCache,
} from "@/features/subscriptions/cache"
import type { CatalogPackage } from "@/features/subscriptions/types"
import {
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

function clearLegacyLocalCaches() {
  try {
    window.localStorage.removeItem(PACKAGES_STORAGE_KEY)
    window.localStorage.removeItem(SUBSCRIPTIONS_STORAGE_KEY)
  } catch {
    // ignore
  }
}

function syncPackagesCache(next: CatalogPackage[]): CatalogPackage[] {
  clearLegacyLocalCaches()
  return setPackagesCache(next) as CatalogPackage[]
}

function syncSubscriptionsCache(
  next: SubscriberSubscription[],
): SubscriberSubscription[] {
  clearLegacyLocalCaches()
  return setSubscriptionsCache(next)
}

// Clear stale local caches so admin packages/subscriptions stay Firestore-sourced
clearLegacyLocalCaches()

function normalizePackageDoc(id: string, raw: Record<string, unknown>): CatalogPackage {
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
    createdAt:
      typeof raw.createdAt === "string"
        ? raw.createdAt
        : new Date().toISOString(),
    updatedAt:
      typeof raw.updatedAt === "string"
        ? raw.updatedAt
        : new Date().toISOString(),
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

export async function fetchPackages(): Promise<CatalogPackage[]> {
  try {
    const db = getDb()
    const snap = await getDocs(collection(db, PACKAGES_COLLECTION))
    const list = snap.docs.map((d) =>
      normalizePackageDoc(d.id, d.data() as Record<string, unknown>),
    )
    return syncPackagesCache(list)
  } catch (err) {
    console.warn("[Firestore] Failed to read packages collection:", err)
    throw err instanceof Error ? err : new Error("Failed to load packages")
  }
}

export async function fetchSubscriptions(): Promise<SubscriberSubscription[]> {
  try {
    const db = getDb()
    const snap = await getDocs(collection(db, SUBSCRIPTIONS_COLLECTION))
    const list = snap.docs.map((d) =>
      normalizeSubscriptionDoc(d.id, d.data() as Record<string, unknown>),
    )
    return syncSubscriptionsCache(list)
  } catch (err) {
    console.warn("[Firestore] Failed to read subscriptions collection:", err)
    throw err instanceof Error ? err : new Error("Failed to load subscriptions")
  }
}

/** Scoped read — subscriber panel / detail views (1 query, own docs only). */
export async function fetchSubscriptionsForSubscriber(
  subscriberId: string,
): Promise<SubscriberSubscription[]> {
  if (!subscriberId) return []
  try {
    const db = getDb()
    const snap = await getDocs(
      query(
        collection(db, SUBSCRIPTIONS_COLLECTION),
        where("subscriberId", "==", subscriberId),
      ),
    )
    const list = snap.docs
      .map((d) =>
        normalizeSubscriptionDoc(d.id, d.data() as Record<string, unknown>),
      )
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      )

    // Merge into in-memory cache so topbar / legacy helpers see live data.
    const others = getSubscriptionsCache().filter(
      (item) => item.subscriberId !== subscriberId,
    )
    syncSubscriptionsCache([...list, ...others])
    return list
  } catch (err) {
    console.warn("[Firestore] Failed to read subscriptions for subscriber:", err)
    throw err instanceof Error
      ? err
      : new Error("Failed to load subscriber subscriptions")
  }
}

export async function fetchPackageById(
  packageId: string,
): Promise<CatalogPackage | null> {
  if (!packageId) return null
  try {
    const db = getDb()
    const snap = await getDoc(doc(db, PACKAGES_COLLECTION, packageId))
    if (!snap.exists()) return null
    return normalizePackageDoc(
      snap.id,
      snap.data() as Record<string, unknown>,
    )
  } catch (err) {
    console.warn("[Firestore] Failed to read package:", err)
    return null
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

export async function savePackage(input: SavePackageInput): Promise<CatalogPackage> {
  const now = new Date().toISOString()
  const db = getDb()

  let existing: CatalogPackage | undefined
  if (input.id) {
    const snap = await getDoc(doc(db, PACKAGES_COLLECTION, input.id))
    if (snap.exists()) {
      existing = normalizePackageDoc(
        snap.id,
        snap.data() as Record<string, unknown>,
      )
    }
  }

  const current = await fetchPackages()
  // Always use Firestore auto-ids for creates (never client-prefixed ids like pkg-*)
  const id = existing?.id ?? doc(collection(db, PACKAGES_COLLECTION)).id

  const sortOrder =
    input.sortOrder ??
    existing?.sortOrder ??
    (current.reduce((max, p) => Math.max(max, p.sortOrder), 0) + 1)

  const record: CatalogPackage = {
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

  const nextList = (
    current.some((item) => item.id === id)
      ? current.map((item) => (item.id === id ? record : item))
      : [...current, record]
  ).map((item) =>
    record.featured && item.id !== id && item.featured
      ? { ...item, featured: false, updatedAt: now }
      : item,
  )

  const batch = writeBatch(db)
  batch.set(doc(db, PACKAGES_COLLECTION, id), stripUndefined({ ...record }))
  if (record.featured) {
    for (const item of nextList) {
      if (item.id !== id && !item.featured && item.updatedAt === now) {
        batch.set(
          doc(db, PACKAGES_COLLECTION, item.id),
          stripUndefined({ ...item }),
        )
      }
    }
  }
  await batch.commit()

  return syncPackagesCache(nextList).find((item) => item.id === id) ?? record
}

export async function togglePackageActive(
  packageId: string,
  isActive: boolean,
): Promise<CatalogPackage> {
  const db = getDb()
  const snap = await getDoc(doc(db, PACKAGES_COLLECTION, packageId))
  if (!snap.exists()) {
    throw new Error("Package not found")
  }

  const existing = normalizePackageDoc(
    snap.id,
    snap.data() as Record<string, unknown>,
  )
  const updated: CatalogPackage = {
    ...existing,
    isActive,
    updatedAt: new Date().toISOString(),
  }

  await setDoc(
    doc(db, PACKAGES_COLLECTION, packageId),
    stripUndefined({ ...updated }),
  )

  const current = await fetchPackages()
  syncPackagesCache(
    current.map((item) => (item.id === packageId ? updated : item)),
  )
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
  const { callAssignSubscription } = await import("@/lib/firebase/callables")
  const result = await callAssignSubscription({
    subscriberId: input.subscriberId,
    subscriberName: input.subscriberName,
    subscriberEmail: input.subscriberEmail,
    packageId: input.packageId,
    status: input.status,
    startsAt: input.startsAt,
    endsAt: input.endsAt,
    activatedBy: input.activatedBy,
    notes: input.notes,
    notesLocalized: input.notesLocalized,
    renewedFromId: input.renewedFromId,
  })
  const saved = normalizeSubscriptionDoc(
    String(result.subscription.id),
    result.subscription as Record<string, unknown>,
  )
  const current = await fetchSubscriptions()
  const nextList = [
    saved,
    ...current.filter((item) => item.id !== saved.id),
  ]
  syncSubscriptionsCache(nextList)
  return saved
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
  const { callUpdateSubscriptionLifecycle } = await import(
    "@/lib/firebase/callables"
  )
  const result = await callUpdateSubscriptionLifecycle({
    subscriptionId: input.subscriptionId,
    action: input.action,
    packageId: input.packageId,
    status: input.status,
    startsAt: input.startsAt,
    endsAt: input.endsAt,
    activatedBy: input.activatedBy,
    notes: input.notes,
    notesLocalized: input.notesLocalized,
  })
  const saved = normalizeSubscriptionDoc(
    String(result.subscription.id),
    result.subscription as Record<string, unknown>,
  )
  const current = await fetchSubscriptions()
  const nextList = [
    saved,
    ...current.filter((item) => item.id !== saved.id),
  ]
  syncSubscriptionsCache(nextList)
  return saved
}

