import { doc, getDoc, setDoc } from "firebase/firestore"
import {
  deleteObject,
  getDownloadURL,
  ref,
  uploadBytesResumable,
} from "firebase/storage"
import {
  buildVideoBannerPath,
  formatBytesLabel,
  isVideoBannerStoragePath,
  VIDEO_BANNER_UPLOAD_LIMITS,
} from "@/features/website/paths"
import { mirrorBilingual } from "@/features/website/service"
import { getDb } from "@/lib/firebase/firestore"
import { getFirebaseStorage } from "@/lib/firebase/storage"
import type { BilingualText } from "@/types/program"
import type {
  VideoBannerContent,
  VideoBannerSocialLink,
  VideoBannerSocialNetwork,
} from "@/types/website"

export const VIDEO_BANNER_COLLECTION = "website_video_banner"
export const VIDEO_BANNER_DOC_ID = "config"

export const VIDEO_BANNER_SOCIAL_ORDER: VideoBannerSocialNetwork[] = [
  "facebook",
  "linkedin",
  "youtube",
  "instagram",
  "tiktok",
]

export const DEFAULT_VIDEO_BANNER_COPY = {
  headline: {
    en: "Helping you achieve your fitness potential is my mission.",
    ar: "مساعدتك على تحقيق إمكاناتك الرياضية هي مهمتي.",
  },
  author: {
    en: "Mike Vasquez",
    ar: "مايك فاسكيز",
  },
} as const

export const DEFAULT_VIDEO_BANNER_SOCIALS: VideoBannerSocialLink[] =
  VIDEO_BANNER_SOCIAL_ORDER.map((network) => ({
    network,
    enabled: network !== "tiktok",
    url: "",
  }))

function stripUndefined<T extends Record<string, unknown>>(obj: T): T {
  const out: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(obj)) {
    if (v !== undefined) out[k] = v
  }
  return out as T
}

function asString(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback
}

function asBool(value: unknown, fallback = true): boolean {
  return typeof value === "boolean" ? value : fallback
}

function normalizeBilingual(
  value: unknown,
  fallback: BilingualText = { en: "", ar: "" },
): BilingualText {
  if (!value || typeof value !== "object") return { ...fallback }
  const raw = value as Record<string, unknown>
  return {
    en: asString(raw.en, fallback.en),
    ar: asString(raw.ar, fallback.ar),
  }
}

function isSocialNetwork(value: unknown): value is VideoBannerSocialNetwork {
  return (
    value === "facebook" ||
    value === "linkedin" ||
    value === "youtube" ||
    value === "instagram" ||
    value === "tiktok"
  )
}

function normalizeSocials(value: unknown): VideoBannerSocialLink[] {
  const byNetwork = new Map<VideoBannerSocialNetwork, VideoBannerSocialLink>()

  if (Array.isArray(value)) {
    for (const item of value) {
      if (!item || typeof item !== "object") continue
      const raw = item as Record<string, unknown>
      if (!isSocialNetwork(raw.network)) continue
      byNetwork.set(raw.network, {
        network: raw.network,
        enabled: asBool(raw.enabled, true),
        url: asString(raw.url).trim(),
      })
    }
  }

  return VIDEO_BANNER_SOCIAL_ORDER.map((network) => {
    const existing = byNetwork.get(network)
    if (existing) return existing
    return {
      network,
      enabled: network !== "tiktok",
      url: "",
    }
  })
}

export function normalizeVideoBannerContent(
  raw: Record<string, unknown> | null | undefined,
): VideoBannerContent {
  return {
    id: VIDEO_BANNER_DOC_ID,
    headline: normalizeBilingual(
      raw?.headline,
      DEFAULT_VIDEO_BANNER_COPY.headline,
    ),
    author: normalizeBilingual(raw?.author, DEFAULT_VIDEO_BANNER_COPY.author),
    videoUrl: asString(raw?.videoUrl),
    storagePath: asString(raw?.storagePath),
    socials: normalizeSocials(raw?.socials),
    updatedAt: asString(raw?.updatedAt),
    updatedBy: asString(raw?.updatedBy) || undefined,
  }
}

export async function fetchVideoBannerContent(): Promise<VideoBannerContent | null> {
  const snap = await getDoc(
    doc(getDb(), VIDEO_BANNER_COLLECTION, VIDEO_BANNER_DOC_ID),
  )
  if (!snap.exists()) return null
  return normalizeVideoBannerContent(snap.data() as Record<string, unknown>)
}

async function uploadVideoBannerFile(
  path: string,
  file: File,
  onProgress?: (percent: number) => void,
): Promise<string> {
  const storageRef = ref(getFirebaseStorage(), path)
  const task = uploadBytesResumable(storageRef, file, {
    contentType: file.type || "video/mp4",
    customMetadata: { uploadedAt: new Date().toISOString() },
  })

  await new Promise<void>((resolve, reject) => {
    task.on(
      "state_changed",
      (snap) => {
        if (!onProgress || snap.totalBytes <= 0) return
        onProgress(Math.round((snap.bytesTransferred / snap.totalBytes) * 100))
      },
      reject,
      () => resolve(),
    )
  })

  return getDownloadURL(task.snapshot.ref)
}

async function deleteStoragePath(path?: string | null): Promise<void> {
  if (!path || !isVideoBannerStoragePath(path)) {
    return
  }
  try {
    await deleteObject(ref(getFirebaseStorage(), path))
  } catch {
    // already gone
  }
}

function requireBilingual(
  en: string,
  ar: string,
  label: string,
): BilingualText {
  const mirrored = mirrorBilingual(en, ar)
  if (!mirrored) throw new Error(`${label} is required`)
  return mirrored
}

function normalizeUrl(url: string): string {
  const trimmed = url.trim()
  if (!trimmed) return ""
  if (
    trimmed.startsWith("http://") ||
    trimmed.startsWith("https://") ||
    trimmed.startsWith("/")
  ) {
    return trimmed
  }
  return `https://${trimmed}`
}

export type SaveVideoBannerInput = {
  headline: BilingualText
  author: BilingualText
  socials: VideoBannerSocialLink[]
  file?: File | null
  removeVideo?: boolean
  updatedBy?: string
  onUploadProgress?: (percent: number) => void
}

export async function saveVideoBannerContent(
  input: SaveVideoBannerInput,
): Promise<VideoBannerContent> {
  const db = getDb()
  const now = new Date().toISOString()
  const existingSnap = await getDoc(
    doc(db, VIDEO_BANNER_COLLECTION, VIDEO_BANNER_DOC_ID),
  )
  const existing = existingSnap.exists()
    ? normalizeVideoBannerContent(
        existingSnap.data() as Record<string, unknown>,
      )
    : null

  const file = input.file ?? null
  if (file && file.size > VIDEO_BANNER_UPLOAD_LIMITS.videoBytes) {
    throw new Error(
      `Video exceeds ${formatBytesLabel(VIDEO_BANNER_UPLOAD_LIMITS.videoBytes)} limit`,
    )
  }
  if (file && !file.type.match(/^video\//)) {
    throw new Error("Only video files are allowed")
  }

  let videoUrl = existing?.videoUrl || ""
  let storagePath = existing?.storagePath || ""
  let previousPathToDelete: string | null = null

  if (input.removeVideo && !file) {
    if (existing?.storagePath) previousPathToDelete = existing.storagePath
    videoUrl = ""
    storagePath = ""
  }

  if (file) {
    const nextPath = buildVideoBannerPath({
      mimeType: file.type,
      fileName: `mission.${file.type.includes("webm") ? "webm" : "mp4"}`,
    })
    if (
      existing?.storagePath &&
      isVideoBannerStoragePath(existing.storagePath) &&
      existing.storagePath !== nextPath
    ) {
      previousPathToDelete = existing.storagePath
    }
    videoUrl = await uploadVideoBannerFile(
      nextPath,
      file,
      input.onUploadProgress,
    )
    storagePath = nextPath
  }

  const socials = normalizeSocials(
    input.socials.map((item) => ({
      ...item,
      url: normalizeUrl(item.url),
    })),
  )

  const record: VideoBannerContent = {
    id: VIDEO_BANNER_DOC_ID,
    headline: requireBilingual(
      input.headline.en,
      input.headline.ar,
      "Headline",
    ),
    author: requireBilingual(input.author.en, input.author.ar, "Name"),
    videoUrl,
    storagePath,
    socials,
    updatedAt: now,
    updatedBy: input.updatedBy || existing?.updatedBy,
  }

  await setDoc(
    doc(db, VIDEO_BANNER_COLLECTION, VIDEO_BANNER_DOC_ID),
    stripUndefined({ ...record }),
  )

  if (previousPathToDelete) {
    await deleteStoragePath(previousPathToDelete)
  }

  return record
}

export async function clearVideoBannerVideo(
  updatedBy?: string,
): Promise<VideoBannerContent> {
  const existing = await fetchVideoBannerContent()
  if (!existing) {
    throw new Error("Video banner content not found")
  }
  await deleteStoragePath(existing.storagePath)
  const now = new Date().toISOString()
  const next: VideoBannerContent = {
    ...existing,
    videoUrl: "",
    storagePath: "",
    updatedAt: now,
    updatedBy: updatedBy || existing.updatedBy,
  }
  await setDoc(
    doc(getDb(), VIDEO_BANNER_COLLECTION, VIDEO_BANNER_DOC_ID),
    stripUndefined({ ...next }),
  )
  return next
}
