export type ContentKind = "pdf" | "video" | "document"

export type ContentVisibility = "library" | "assigned" | "package"

/**
 * Video binaries live with an external streaming provider.
 * Firestore stores only metadata + provider asset references.
 */
export type VideoProviderId = "stub" | "bunny" | "cloudflare" | "mux"

export type ContentAsset = {
  id: string
  kind: ContentKind
  title: string
  description?: string
  /** Firebase Storage path for PDFs/docs — never for large video libraries */
  storagePath?: string
  /** External streaming asset id when kind === "video" */
  videoProvider?: VideoProviderId
  videoAssetId?: string
  durationSeconds?: number
  thumbnailUrl?: string
  tags: string[]
  createdAt: string
  updatedAt: string
}
