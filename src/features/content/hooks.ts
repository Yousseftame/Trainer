import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { QUERY_STALE_TIMES } from "@/config/constants"
import { getContentSnapshot } from "@/features/content/demo"
import {
  deleteContentAsset,
  fetchContentAssets,
  saveContentAsset,
  updateContentAssociations,
  type SaveContentAssetInput,
  type UpdateContentAssociationsInput,
} from "@/features/content/service"

export const CONTENT_QUERY_KEYS = {
  all: ["content_assets"] as const,
}

export const contentKeys = CONTENT_QUERY_KEYS

export function useContentAssetsQuery() {
  return useQuery({
    queryKey: CONTENT_QUERY_KEYS.all,
    queryFn: fetchContentAssets,
    initialData: getContentSnapshot,
    staleTime: QUERY_STALE_TIMES.adminList,
  })
}

export function useSaveContentAssetMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: SaveContentAssetInput) => saveContentAsset(input),
    onSuccess: (saved) => {
      queryClient.setQueryData(CONTENT_QUERY_KEYS.all, getContentSnapshot())
      void queryClient.invalidateQueries({ queryKey: CONTENT_QUERY_KEYS.all })
      return saved
    },
  })
}

export function useUpdateContentAssociationsMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: UpdateContentAssociationsInput) =>
      updateContentAssociations(input),
    onSuccess: (updated) => {
      queryClient.setQueryData(CONTENT_QUERY_KEYS.all, getContentSnapshot())
      void queryClient.invalidateQueries({ queryKey: CONTENT_QUERY_KEYS.all })
      return updated
    },
  })
}

export function useDeleteContentAssetMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (assetId: string) => deleteContentAsset(assetId),
    onSuccess: () => {
      queryClient.setQueryData(CONTENT_QUERY_KEYS.all, getContentSnapshot())
      void queryClient.invalidateQueries({ queryKey: CONTENT_QUERY_KEYS.all })
    },
  })
}

