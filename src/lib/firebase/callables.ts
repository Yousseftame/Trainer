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
