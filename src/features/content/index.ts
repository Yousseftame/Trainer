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
  buildCanonicalStoragePath,
  formatBytesLabel,
  isHttpUrl,
} from "@/features/content/paths"

export {
  contentStats,
  isContentLinked,
  getContentLinks,
  evaluateSubscriberContentAccess,
} from "@/features/content/access"

export { DEMO_CONTENT } from "@/features/content/demo"

export {
  fetchContentAssets,
  fetchSubscriberContentLibrary,
  fetchContentAssetById,
  saveContentAsset,
  updateContentAssociations,
  deleteContentAsset,
} from "@/features/content/service"

export {
  useContentAssetsQuery,
  useSaveContentAssetMutation,
  useUpdateContentAssociationsMutation,
  useDeleteContentAssetMutation,
  CONTENT_QUERY_KEYS,
  contentKeys,
} from "@/features/content/hooks"
