/**
 * Compatibility shim — demo content seed data removed.
 * Prefer `@/features/content/paths`, `@/features/content/access`, and Firestore services.
 */
export type { ContentAsset as DemoContentAsset } from "@/types/content"
export type { ContentFilter } from "@/features/content/paths"
export type {
  ContentLinks,
  LinkedProgram,
  ContentAccessCheckResult,
} from "@/features/content/access"

export {
  CONTENT_UPLOAD_LIMITS,
  defaultKindForCategory,
  defaultEntitlementForCategory,
  sanitizeStorageSegment,
  buildCanonicalStoragePath,
  formatBytesLabel,
  buildContentSearchTokens,
  isHttpUrl,
} from "@/features/content/paths"

export {
  contentStats,
  isContentLinked,
  getContentLinks,
  evaluateSubscriberContentAccess,
} from "@/features/content/access"

/** @deprecated Empty — live data comes from Firestore `content_assets` */
export const DEMO_CONTENT: import("@/types/content").ContentAsset[] = []
export const INITIAL_DEMO_CONTENT: import("@/types/content").ContentAsset[] = []

/** @deprecated Prefer React Query cache / fetchContentAssets */
export function getContentSnapshot(): import("@/types/content").ContentAsset[] {
  return []
}

/** @deprecated No-op — Firestore is source of truth */
export function setContentSnapshot(
  _next: import("@/types/content").ContentAsset[],
): void {
  // no-op
}

/** @deprecated Prefer fetchContentAssetById */
export function getContentById(
  _id: string,
): import("@/types/content").ContentAsset | undefined {
  return undefined
}
