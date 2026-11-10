import { httpsCallable } from "firebase/functions"
import { getFirebaseFunctions } from "@/lib/firebase/functions"
import type { Subscriber, RegistrationRequest } from "@/features/subscribers/types"
import type { UserStatus } from "@/types/user"

export async function callBootstrapStaffClaims() {
  const fn = httpsCallable(getFirebaseFunctions(), "bootstrapStaffClaims")
  const result = await fn({})
  return result.data as {
    ok: boolean
    role: string
    status: string
    permissions: string[]
  }
}

export async function callCreateStaffMember(input: Record<string, unknown>) {
  const fn = httpsCallable(getFirebaseFunctions(), "createStaffMember")
  const result = await fn(input)
  return result.data as { ok: boolean; staff: Record<string, unknown> & { id: string } }
}

export async function callUpdateStaffMember(input: Record<string, unknown>) {
  const fn = httpsCallable(getFirebaseFunctions(), "updateStaffMember")
  const result = await fn(input)
  return result.data as { ok: boolean; staff: Record<string, unknown> & { id: string } }
}

export async function callSetStaffAccountStatus(input: {
  staffId: string
  status: "active" | "suspended"
}) {
  const fn = httpsCallable(getFirebaseFunctions(), "setStaffAccountStatus")
  const result = await fn(input)
  return result.data as { ok: boolean; staff: Record<string, unknown> & { id: string } }
}

export async function callDeleteStaffMember(staffId: string) {
  const fn = httpsCallable(getFirebaseFunctions(), "deleteStaffMember")
  const result = await fn({ staffId })
  return result.data as { ok: boolean; deletedId: string }
}

export async function callPurgeDemoStaffData() {
  const fn = httpsCallable(getFirebaseFunctions(), "purgeDemoStaffData")
  const result = await fn({})
  return result.data as { ok: boolean; deleted: number }
}

export async function callCreateSubscriberAccount(input: Record<string, unknown>) {
  const fn = httpsCallable(getFirebaseFunctions(), "createSubscriberAccount")
  const result = await fn(input)
  return result.data as { uid: string; subscriber: Subscriber }
}

export async function callUpdateSubscriberAccount(input: {
  subscriberId: string
  password?: string
  displayName?: string
}) {
  const fn = httpsCallable(getFirebaseFunctions(), "updateSubscriberAccount")
  const result = await fn(input)
  return result.data as { ok: boolean; subscriberId: string }
}

export async function callSetSubscriberAccountStatus(input: {
  subscriberId: string
  status: UserStatus
  syncSubscription?: boolean
  adminName?: string
  notes?: string
}) {
  const fn = httpsCallable(getFirebaseFunctions(), "setSubscriberAccountStatus")
  const result = await fn(input)
  return result.data as { subscriber: Subscriber }
}

export async function callDeleteSubscriberAccount(subscriberId: string) {
  const fn = httpsCallable(getFirebaseFunctions(), "deleteSubscriberAccount")
  const result = await fn({ subscriberId })
  return result.data as { ok: boolean; deletedId: string }
}

export async function callApproveRegistrationRequest(input: Record<string, unknown>) {
  const fn = httpsCallable(getFirebaseFunctions(), "approveRegistrationRequest")
  const result = await fn(input)
  return result.data as {
    request: RegistrationRequest
    subscriber: Subscriber
  }
}

export async function callRejectRegistrationRequest(input: Record<string, unknown>) {
  const fn = httpsCallable(getFirebaseFunctions(), "rejectRegistrationRequest")
  const result = await fn(input)
  return result.data as { request: RegistrationRequest }
}

export async function callPurgeDemoSubscriberData() {
  const fn = httpsCallable(getFirebaseFunctions(), "purgeDemoSubscriberData")
  const result = await fn({})
  return result.data as {
    ok: boolean
    deletedSubscribers: number
    deletedRequests: number
  }
}

export async function callListSubscriberContentLibrary() {
  const fn = httpsCallable(getFirebaseFunctions(), "listSubscriberContentLibrary")
  const result = await fn({})
  return result.data as {
    assets: Array<Record<string, unknown> & { id: string; accessAllowed?: boolean }>
    meta: {
      packageId: string | null
      subscriptionStatus: string | null
      entitlements: Record<string, boolean>
    }
  }
}

export async function callLogWorkoutSession(
  input: Record<string, unknown>,
) {
  const fn = httpsCallable(getFirebaseFunctions(), "logWorkoutSession")
  const result = await fn(input)
  return result.data as {
    ok: boolean
    log: Record<string, unknown> & {
      id: string
      subscriberId: string
      programId: string
      dayId: string
      completedAt: string
    }
  }
}

export async function callLogNutritionAdherence(
  input: Record<string, unknown>,
) {
  const fn = httpsCallable(getFirebaseFunctions(), "logNutritionAdherence")
  const result = await fn(input)
  return result.data as {
    ok: boolean
    log: Record<string, unknown> & {
      id: string
      subscriberId: string
      programId: string
      date: string
      status: string
      loggedAt: string
    }
  }
}

export async function callLogProgressMeasurement(
  input: Record<string, unknown>,
) {
  const fn = httpsCallable(getFirebaseFunctions(), "logProgressMeasurement")
  const result = await fn(input)
  return result.data as {
    ok: boolean
    measurement: Record<string, unknown> & { id: string; subscriberId: string }
  }
}

export async function callDeleteProgressMeasurement(id: string) {
  const fn = httpsCallable(getFirebaseFunctions(), "deleteProgressMeasurement")
  const result = await fn({ id })
  return result.data as { ok: boolean; deletedId: string }
}

export async function callLogProgressPerformance(
  input: Record<string, unknown>,
) {
  const fn = httpsCallable(getFirebaseFunctions(), "logProgressPerformance")
  const result = await fn(input)
  return result.data as {
    ok: boolean
    performance: Record<string, unknown> & { id: string; subscriberId: string }
  }
}

export async function callDeleteProgressPerformance(id: string) {
  const fn = httpsCallable(getFirebaseFunctions(), "deleteProgressPerformance")
  const result = await fn({ id })
  return result.data as { ok: boolean; deletedId: string }
}

export async function callSaveProgressPhotoMeta(
  input: Record<string, unknown>,
) {
  const fn = httpsCallable(getFirebaseFunctions(), "saveProgressPhotoMeta")
  const result = await fn(input)
  return result.data as {
    ok: boolean
    photo: Record<string, unknown> & { id: string; subscriberId: string }
  }
}

export async function callDeleteProgressPhoto(id: string) {
  const fn = httpsCallable(getFirebaseFunctions(), "deleteProgressPhoto")
  const result = await fn({ id })
  return result.data as { ok: boolean; deletedId: string }
}

export async function callDispatchNotice(noticeId: string) {
  const fn = httpsCallable(getFirebaseFunctions(), "dispatchNotice")
  const result = await fn({ noticeId })
  return result.data as { ok: boolean; id: string; status: string }
}

export async function callRegisterFcmToken(input: {
  token: string
  platform?: string
}) {
  const fn = httpsCallable(getFirebaseFunctions(), "registerFcmToken")
  const result = await fn(input)
  return result.data as { ok: boolean; id: string }
}

export async function callUnregisterFcmToken(input: { token: string }) {
  const fn = httpsCallable(getFirebaseFunctions(), "unregisterFcmToken")
  const result = await fn(input)
  return result.data as { ok: boolean }
}

export async function callAssignSubscription(input: Record<string, unknown>) {
  const fn = httpsCallable(getFirebaseFunctions(), "assignSubscription")
  const result = await fn(input)
  return result.data as {
    ok: boolean
    subscription: Record<string, unknown> & { id: string; subscriberId: string }
  }
}

export async function callUpdateSubscriptionLifecycle(
  input: Record<string, unknown>,
) {
  const fn = httpsCallable(getFirebaseFunctions(), "updateSubscriptionLifecycle")
  const result = await fn(input)
  return result.data as {
    ok: boolean
    subscription: Record<string, unknown> & { id: string; subscriberId: string }
  }
}

export async function callRequestSubscriptionChange(
  input: Record<string, unknown>,
) {
  const fn = httpsCallable(getFirebaseFunctions(), "requestSubscriptionChange")
  const result = await fn(input)
  return result.data as {
    ok: boolean
    request: Record<string, unknown> & { id: string; subscriberId: string }
  }
}

export async function callUpdateMySubscriberProfile(
  input: Record<string, unknown>,
) {
  const fn = httpsCallable(getFirebaseFunctions(), "updateMySubscriberProfile")
  const result = await fn(input)
  return result.data as {
    ok: boolean
    subscriber: Record<string, unknown> & { id: string }
  }
}

export async function callResolveSubscriptionChangeRequest(
  input: Record<string, unknown>,
) {
  const fn = httpsCallable(
    getFirebaseFunctions(),
    "resolveSubscriptionChangeRequest",
  )
  const result = await fn(input)
  return result.data as {
    ok: boolean
    request: Record<string, unknown> & { id: string }
    subscription?: Record<string, unknown> & { id: string }
  }
}
