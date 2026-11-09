import type {
  ContentCategory,
  ContentKind,
  VideoProviderId,
} from "@/types/content"
import type { PackageEntitlementKey } from "@/types/subscription"

export type ContentFilter = "all" | ContentCategory

/** Soft caps — keep Firebase Storage bandwidth/storage costs predictable. */
export const CONTENT_UPLOAD_LIMITS = {
  pdfBytes: 25 * 1024 * 1024,
  /** Local video upload to Storage (prefer CDN for the 50–200 GB library). */
  videoBytes: 80 * 1024 * 1024,
} as const

export function defaultKindForCategory(category: ContentCategory): ContentKind {
  if (category === "exerciseVideo") return "video"
  if (category === "workoutPdf" || category === "nutritionPdf") return "pdf"
  return "document"
}

export function defaultEntitlementForCategory(
  category: ContentCategory,
): PackageEntitlementKey {
  switch (category) {
    case "exerciseVideo":
      return "exerciseVideos"
    case "workoutPdf":
      return "workoutProgram"
    case "nutritionPdf":
      return "nutritionProgram"
    case "education":
    case "reference":
    default:
      return "pdfDocuments"
  }
}

export function sanitizeStorageSegment(raw: string): string {
  return (
    raw
      .trim()
      .replace(/\s+/g, "_")
      .replace(/[^a-zA-Z0-9._\-\u0600-\u06FF]/g, "")
      .slice(0, 80) || "asset"
  )
}

/**
 * Cost-aware canonical paths:
 * - PDFs/docs → Firebase Storage private objects
 * - Videos → path used for Storage uploads OR metadata reference under provider
 */
export function buildCanonicalStoragePath(params: {
  id: string
  category: ContentCategory
  fileName?: string
  videoProvider?: VideoProviderId
  videoAssetId?: string
  createdAt?: string
}): string {
  const year = params.createdAt
    ? new Date(params.createdAt).getUTCFullYear() || new Date().getUTCFullYear()
    : new Date().getUTCFullYear()
  const safeId = sanitizeStorageSegment(params.id)

  if (params.category === "exerciseVideo") {
    const provider = params.videoProvider || "bunny"
    const leaf = sanitizeStorageSegment(
      params.fileName || params.videoAssetId || `${safeId}.mp4`,
    )
    return `content/videos/${provider}/${year}/${safeId}/${leaf}`
  }

  const rawLeaf = params.fileName?.trim() || `${safeId}.pdf`
  const safeLeaf = sanitizeStorageSegment(rawLeaf)

  switch (params.category) {
    case "workoutPdf":
      return `content/pdfs/workouts/${year}/${safeId}/${safeLeaf}`
    case "nutritionPdf":
      return `content/pdfs/nutrition/${year}/${safeId}/${safeLeaf}`
    case "education":
      return `content/docs/education/${year}/${safeId}/${safeLeaf}`
    case "reference":
    default:
      return `content/docs/reference/${year}/${safeId}/${safeLeaf}`
  }
}

export function formatBytesLabel(bytes?: number | null): string {
  if (!bytes || bytes <= 0) return "—"
  if (bytes < 1024) return `${bytes} B`
  const kb = bytes / 1024
  if (kb < 1024) return `${Math.round(kb)} KB`
  const mb = kb / 1024
  return `${mb.toFixed(1)} MB`
}

export function buildContentSearchTokens(asset: {
  id: string
  category: ContentCategory
  kind: ContentKind
  title: { en: string; ar: string }
  description: { en: string; ar: string }
  fileName?: string
  storagePath?: string
  videoProvider?: string
  videoAssetId?: string
  tags: string[]
  exerciseNames?: string[]
}): string[] {
  const rawParts = [
    asset.id,
    asset.category,
    asset.kind,
    asset.title.en,
    asset.title.ar,
    asset.description.en,
    asset.description.ar,
    asset.fileName ?? "",
    asset.storagePath ?? "",
    asset.videoProvider ?? "",
    asset.videoAssetId ?? "",
    ...asset.tags,
    ...(asset.exerciseNames ?? []),
  ]
  const tokenSet = new Set<string>()
  for (const part of rawParts) {
    const normalized = part.trim().toLowerCase()
    if (!normalized) continue
    tokenSet.add(normalized)
    for (const word of normalized.split(/[\s,/_\-.]+/)) {
      if (word.length >= 2) tokenSet.add(word)
    }
  }
  return Array.from(tokenSet)
}

export function isHttpUrl(value?: string | null): boolean {
  if (!value) return false
  try {
    const url = new URL(value)
    return url.protocol === "http:" || url.protocol === "https:"
  } catch {
    return false
  }
}
