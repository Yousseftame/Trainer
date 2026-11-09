import type { ProgressPhotoPose } from "@/types/progress"

/** Soft caps — keep Storage egress and doc size predictable. */
export const PROGRESS_UPLOAD_LIMITS = {
  photoBytes: 8 * 1024 * 1024,
} as const

export function sanitizeProgressSegment(raw: string): string {
  return (
    raw
      .trim()
      .replace(/\s+/g, "_")
      .replace(/[^a-zA-Z0-9._\-\u0600-\u06FF]/g, "")
      .slice(0, 80) || "asset"
  )
}

export function extensionForMime(mimeType?: string | null): string {
  const mime = (mimeType || "").toLowerCase()
  if (mime.includes("png")) return "png"
  if (mime.includes("webp")) return "webp"
  if (mime.includes("gif")) return "gif"
  return "jpg"
}

/**
 * Cost-aware private photo paths:
 * progress/photos/{subscriberId}/{year}/{photoId}/{pose}.{ext}
 */
export function buildProgressPhotoStoragePath(params: {
  subscriberId: string
  photoId: string
  pose?: ProgressPhotoPose
  mimeType?: string | null
  takenAt?: string
}): string {
  const year = params.takenAt
    ? new Date(params.takenAt).getUTCFullYear() || new Date().getUTCFullYear()
    : new Date().getUTCFullYear()
  const subscriberId = sanitizeProgressSegment(params.subscriberId)
  const photoId = sanitizeProgressSegment(params.photoId)
  const pose = params.pose || "front"
  const ext = extensionForMime(params.mimeType)
  return `progress/photos/${subscriberId}/${year}/${photoId}/${pose}.${ext}`
}

export function formatBytesLabel(bytes?: number | null): string {
  if (!bytes || bytes <= 0) return "—"
  if (bytes < 1024) return `${bytes} B`
  const kb = bytes / 1024
  if (kb < 1024) return `${Math.round(kb)} KB`
  return `${(kb / 1024).toFixed(1)} MB`
}

export function isRenderablePhotoSrc(value?: string | null): boolean {
  if (!value) return false
  return (
    value.startsWith("http://") ||
    value.startsWith("https://") ||
    value.startsWith("data:image/") ||
    value.startsWith("blob:")
  )
}
