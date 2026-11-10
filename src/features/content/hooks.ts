import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { QUERY_STALE_TIMES } from "@/config/constants"
import {
  deleteContentAsset,
  fetchContentAssets,
  fetchSubscriberContentLibrary,
  saveContentAsset,
  updateContentAssociations,
  type SaveContentAssetInput,
  type UpdateContentAssociationsInput,
} from "@/features/content/service"

export const CONTENT_QUERY_KEYS = {
  all: ["content_assets"] as const,
  subscriberLibrary: ["content_assets", "subscriber_library"] as const,
}

export const contentKeys = CONTENT_QUERY_KEYS

type ContentQueryOptions = {
  enabled?: boolean
  /** Staff SDK list (default) vs entitlement-gated subscriber callable */
  audience?: "staff" | "subscriber"
}

/** Fetch only when a page that needs the library is mounted. */
export function useContentAssetsQuery(options?: ContentQueryOptions) {
  const audience = options?.audience ?? "staff"
  return useQuery({
    queryKey:
      audience === "subscriber"
        ? CONTENT_QUERY_KEYS.subscriberLibrary
        : CONTENT_QUERY_KEYS.all,
    queryFn:
      audience === "subscriber"
        ? fetchSubscriberContentLibrary
        : fetchContentAssets,
    staleTime:
      audience === "subscriber"
        ? QUERY_STALE_TIMES.subscriberDashboard
        : QUERY_STALE_TIMES.catalog,
    enabled: options?.enabled ?? true,
  })
}

function invalidateAllContentCaches(queryClient: ReturnType<typeof useQueryClient>) {
  // Staff catalog + subscriber entitled library (signed URLs / locks)
  void queryClient.invalidateQueries({ queryKey: CONTENT_QUERY_KEYS.all })
  void queryClient.invalidateQueries({
    queryKey: CONTENT_QUERY_KEYS.subscriberLibrary,
  })
}

export function useSaveContentAssetMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: SaveContentAssetInput) => saveContentAsset(input),
    onSuccess: () => {
      invalidateAllContentCaches(queryClient)
    },
  })
}

export function useUpdateContentAssociationsMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: UpdateContentAssociationsInput) =>
      updateContentAssociations(input),
    onSuccess: () => {
      invalidateAllContentCaches(queryClient)
    },
  })
}

export function useDeleteContentAssetMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (assetId: string) => deleteContentAsset(assetId),
    onSuccess: () => {
      invalidateAllContentCaches(queryClient)
    },
  })
}
