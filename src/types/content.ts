import type { PackageEntitlementKey } from "@/types/subscription"

export type ContentKind = "pdf" | "video" | "document"

/** How the trainer organizes the library — finer than storage kind. */
export type ContentCategory =
  | "workoutPdf"
  | "nutritionPdf"
  | "exerciseVideo"
  | "education"
  | "reference"

export type ContentVisibility = "library" | "assigned" | "package"

/**
 * Video binaries live with an external streaming provider or CDN.
 * Firestore stores metadata, canonical storage path, and provider asset references.
 */
export type VideoProviderId =
  | "bunny"
  | "cloudflare"
  | "mux"
  | "youtube"
  | "vimeo"
  | "direct"
  | "stub"

export type StorageBackendMode =
  | "firebase_storage"
  | "external_cdn"
  | "inline_spark"
  | "metadata_only"

export type ContentAsset = {
  id: string
  category: ContentCategory
  kind: ContentKind
  title: { en: string; ar: string }
  description: { en: string; ar: string }
  fileName?: string
  mimeType?: string
  sizeBytes?: number
  sizeLabel: string
  pageCount?: number
  durationSeconds?: number
  /** Canonical structured storage path (e.g. content/pdfs/workouts/2026/asset-id/file.pdf) */
  storagePath: string
  /** Direct or signed URL / CDN URL / inline data URL for previewing & downloading */
  fileUrl?: string
  /** Storage mode used for this asset (Spark free-plan safe) */
  storageMode?: StorageBackendMode
  /** External streaming provider when kind === "video" */
  videoProvider?: VideoProviderId
  videoAssetId?: string
  streamUrl?: string
  thumbnailUrl?: string
  tags: string[]
  visibility: ContentVisibility
  /** Required subscription package entitlement key to access this asset */
  requiredEntitlement: PackageEntitlementKey
  /** Associated package IDs that unlock this content */
  packageIds: string[]
  /** Associated subscriber IDs directly assigned this content */
  subscriberIds: string[]
  /** Associated workout or nutrition program IDs */
  programIds: string[]
  /**Associated exercise names (for instructional videos) */
  exerciseNames?: string[]
  /** Precomputed lowercase search tokens (AR + EN + path + tags) for fast filtering */
  searchTokens?: string[]
  uploadedBy?: string
  createdAt: string
  updatedAt: string
}
