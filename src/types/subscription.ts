export type SubscriptionStatus =
  | "pending"
  | "active"
  | "expired"
  | "suspended"
  | "cancelled"

export type SubscriptionPackage = {
  id: string
  name: { en: string; ar: string }
  description: { en: string; ar: string }
  durationDays: number
  features: string[]
  isActive: boolean
  sortOrder: number
}

export type SubscriberSubscription = {
  id: string
  subscriberId: string
  packageId: string
  status: SubscriptionStatus
  startsAt: string | null
  endsAt: string | null
  activatedBy?: string
  notes?: string
  createdAt: string
  updatedAt: string
}
