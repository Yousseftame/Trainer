export type SubscriptionStatus =
  | "pending"
  | "active"
  | "expired"
  | "suspended"
  | "cancelled"

export type PackageTone = "light" | "dark" | "sage"

export type PackageEntitlementKey =
  | "workoutProgram"
  | "nutritionProgram"
  | "exerciseVideos"
  | "pdfDocuments"
  | "progressTracking"

export type PackageEntitlements = Record<PackageEntitlementKey, boolean>

export const DEFAULT_PACKAGE_ENTITLEMENTS: PackageEntitlements = {
  workoutProgram: true,
  nutritionProgram: true,
  exerciseVideos: true,
  pdfDocuments: true,
  progressTracking: true,
}

export type SubscriptionPackage = {
  id: string
  name: { en: string; ar: string }
  description: { en: string; ar: string }
  durationDays: number
  features: string[]
  isActive: boolean
  sortOrder: number
  featured?: boolean
  tone?: PackageTone
  price?: { en: string; ar: string }
  period?: { en: string; ar: string }
  featureList?: { en: string[]; ar: string[] }
  entitlements?: PackageEntitlements
  createdAt?: string
  updatedAt?: string
}

export type SubscriberSubscription = {
  id: string
  subscriberId: string
  subscriberName?: string
  subscriberEmail?: string
  packageId: string
  packageName?: { en: string; ar: string }
  entitlementsSnapshot?: PackageEntitlements
  status: SubscriptionStatus
  startsAt: string | null
  endsAt: string | null
  activatedBy?: string
  notes?: string
  notesLocalized?: { en: string; ar: string }
  renewedFromId?: string
  createdAt: string
  updatedAt: string
}
