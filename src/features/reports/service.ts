import {
  collection,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  writeBatch,
  doc,
  type Unsubscribe,
} from "firebase/firestore"
import { callDispatchNotice } from "@/lib/firebase/callables"
import { getDb } from "@/lib/firebase/firestore"
import { fetchContentAssets } from "@/features/content/service"
import { listNutritionLogs, listNutritionPrograms } from "@/features/nutrition/service"
import {
  fetchMeasurements,
  fetchPhotos,
} from "@/features/progress/service"
import {
  fetchRegistrationRequests,
  fetchSubscribers,
} from "@/features/subscribers/service"
import {
  fetchPackages,
  fetchSubscriptions,
} from "@/features/subscriptions/service"
import { listWorkoutLogs, listWorkoutPrograms } from "@/features/workouts/service"
import type { ReportsLiveInput } from "@/features/reports/build-report"
import type { NoticeChannel, NoticeKind, NoticeStatus, OpsNotice } from "@/features/reports/types"

const NOTICES_COLLECTION = "notices"

function normalizeNotice(
  id: string,
  raw: Record<string, unknown>,
): OpsNotice {
  const subjectRaw = (raw.subject ?? {}) as Record<string, string>
  const detailRaw = (raw.detail ?? {}) as Record<string, string>
  const staffSubjectRaw = (raw.staffSubject ?? null) as Record<
    string,
    string
  > | null
  const staffDetailRaw = (raw.staffDetail ?? null) as Record<
    string,
    string
  > | null
  return {
    id,
    kind: (raw.kind as NoticeKind) || "registration",
    status: (raw.status as NoticeStatus) || "queued",
    channel: (raw.channel as NoticeChannel) || "email",
    subscriberId:
      typeof raw.subscriberId === "string" ? raw.subscriberId : undefined,
    requestId: typeof raw.requestId === "string" ? raw.requestId : undefined,
    packageId: typeof raw.packageId === "string" ? raw.packageId : undefined,
    subscriptionId:
      typeof raw.subscriptionId === "string" ? raw.subscriptionId : undefined,
    toEmail: typeof raw.toEmail === "string" ? raw.toEmail : undefined,
    toName: typeof raw.toName === "string" ? raw.toName : undefined,
    subject: {
      en: String(subjectRaw.en ?? ""),
      ar: String(subjectRaw.ar ?? subjectRaw.en ?? ""),
    },
    detail: {
      en: String(detailRaw.en ?? ""),
      ar: String(detailRaw.ar ?? detailRaw.en ?? ""),
    },
    staffSubject: staffSubjectRaw
      ? {
          en: String(staffSubjectRaw.en ?? ""),
          ar: String(staffSubjectRaw.ar ?? staffSubjectRaw.en ?? ""),
        }
      : undefined,
    staffDetail: staffDetailRaw
      ? {
          en: String(staffDetailRaw.en ?? ""),
          ar: String(staffDetailRaw.ar ?? staffDetailRaw.en ?? ""),
        }
      : undefined,
    createdAt:
      typeof raw.createdAt === "string"
        ? raw.createdAt
        : new Date().toISOString(),
    updatedAt: typeof raw.updatedAt === "string" ? raw.updatedAt : undefined,
    sentAt: typeof raw.sentAt === "string" ? raw.sentAt : undefined,
    scheduledAt:
      typeof raw.scheduledAt === "string" ? raw.scheduledAt : undefined,
    lastError: typeof raw.lastError === "string" ? raw.lastError : undefined,
    dedupeKey: typeof raw.dedupeKey === "string" ? raw.dedupeKey : undefined,
    fcmSent: Boolean(raw.fcmSent),
    mailQueued: Boolean(raw.mailQueued),
    unread: raw.unread === true,
  }
}

export async function fetchOpsNotices(): Promise<OpsNotice[]> {
  const db = getDb()
  const snap = await getDocs(
    query(collection(db, NOTICES_COLLECTION), orderBy("createdAt", "desc")),
  )
  return snap.docs.map((d) =>
    normalizeNotice(d.id, d.data() as Record<string, unknown>),
  )
}

/** Live inbox — no hard reload required when Cloud Functions enqueue notices. */
export function subscribeOpsNotices(
  onChange: (notices: OpsNotice[]) => void,
  onError?: (err: Error) => void,
): Unsubscribe {
  const db = getDb()
  return onSnapshot(
    query(collection(db, NOTICES_COLLECTION), orderBy("createdAt", "desc")),
    (snap) => {
      onChange(
        snap.docs.map((d) =>
          normalizeNotice(d.id, d.data() as Record<string, unknown>),
        ),
      )
    },
    (err) => {
      console.warn("[reports] notices subscription failed:", err)
      onError?.(err)
    },
  )
}

/** Sidebar / inbox badge — unread only. */
export function countActionableNotices(notices: OpsNotice[]) {
  return notices.filter((item) => item.unread === true).length
}

/** Clear the sidebar badge once staff opens the Reports inbox. */
export async function markNoticesRead(noticeIds: string[]): Promise<void> {
  const ids = [...new Set(noticeIds.filter(Boolean))]
  if (!ids.length) return
  const db = getDb()
  const now = new Date().toISOString()
  // Firestore batches max 500
  for (let i = 0; i < ids.length; i += 450) {
    const chunk = ids.slice(i, i + 450)
    const batch = writeBatch(db)
    for (const id of chunk) {
      batch.update(doc(db, NOTICES_COLLECTION, id), {
        unread: false,
        updatedAt: now,
      })
    }
    await batch.commit()
  }
}

export async function dispatchOpsNotice(noticeId: string) {
  return callDispatchNotice(noticeId)
}

/**
 * Fetch-on-need desk payload — reuses live module services (no demo seeds).
 */
export async function fetchReportsDesk(): Promise<ReportsLiveInput> {
  const [
    subscribers,
    subscriptions,
    packages,
    registrationRequests,
    measurements,
    photos,
    workoutLogs,
    nutritionLogs,
    workoutPrograms,
    nutritionPrograms,
    contentAssets,
    notices,
  ] = await Promise.all([
    fetchSubscribers(),
    fetchSubscriptions(),
    fetchPackages(),
    fetchRegistrationRequests(),
    fetchMeasurements(),
    fetchPhotos(),
    listWorkoutLogs(),
    listNutritionLogs(),
    listWorkoutPrograms(),
    listNutritionPrograms(),
    fetchContentAssets(),
    fetchOpsNotices().catch((err) => {
      console.warn("[reports] notices unavailable:", err)
      return [] as OpsNotice[]
    }),
  ])

  return {
    subscribers,
    subscriptions,
    packages,
    registrationRequests,
    measurements,
    photos,
    workoutLogs,
    nutritionLogs,
    workoutPrograms,
    nutritionPrograms,
    contentAssets,
    notices,
    now: new Date(),
  }
}
