import type { UserStatus } from "@/types/user"
import type { SubscriberSubscription } from "@/types/subscription"

export type Subscriber = {
  id: string
  displayName: string
  name?: { en: string; ar: string }
  email: string
  phone: string
  status: UserStatus
  locale: "en" | "ar"
  createdAt: string
  updatedAt?: string
  heightCm?: number
  age?: number
  startingWeightKg?: number
  targetWeightKg?: number
  sex?: "male" | "female"
  goal?: { en: string; ar: string }
  healthNotes?: { en: string; ar: string }
  coachNotes?: { en: string; ar: string }
  preferredPackageId?: string
  registrationRequestId?: string
}

export type RegistrationRequestStatus = "pending" | "approved" | "rejected"

export type RegistrationRequest = {
  id: string
  displayName: string
  name?: { en: string; ar: string }
  email: string
  phone: string
  locale: "en" | "ar"
  packageId: string | null
  goal: { en: string; ar: string }
  source: "contact" | "manual"
  status: RegistrationRequestStatus
  subscriberId?: string
  reviewedBy?: string
  reviewNotes?: string
  reviewNotesLocalized?: { en: string; ar: string }
  createdAt: string
  reviewedAt: string | null
}

export type SubscriberRow = Subscriber & {
  subscription?: SubscriberSubscription | null
}

export function subscriberDisplayName(
  subscriber: Pick<Subscriber, "displayName" | "name"> | undefined | null,
  locale: "en" | "ar",
): string {
  if (!subscriber) return "—"
  return subscriber.name?.[locale]?.trim() || subscriber.displayName
}

export function isFirebaseAuthUid(id: string): boolean {
  return /^[A-Za-z0-9]{20,128}$/.test(id) && !id.includes("-") && !id.includes("_")
}

export const SUBSCRIBERS_LOCAL_CACHE_KEYS = [
  "derpyfit_subscribers_v1",
  "derpyfit_subscribers_cache",
  "derpyfit_registration_requests_v1",
] as const

export function clearSubscriberLocalCaches(): void {
  if (typeof window === "undefined") return
  for (const key of SUBSCRIBERS_LOCAL_CACHE_KEYS) {
    try {
      window.localStorage.removeItem(key)
    } catch {
      // ignore
    }
  }
}
