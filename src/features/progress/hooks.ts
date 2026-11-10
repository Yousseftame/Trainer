import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { QUERY_STALE_TIMES } from "@/config/constants"
import {
  deleteMeasurement,
  deletePerformance,
  deletePhoto,
  fetchMeasurements,
  fetchPerformance,
  fetchPhotos,
  resolveProgressPhotoUrl,
  saveMeasurement,
  savePerformance,
  savePhoto,
  type SaveMeasurementInput,
  type SavePerformanceInput,
  type SavePhotoInput,
} from "@/features/progress/service"
import type { ProgressPhoto } from "@/types/progress"

export const PROGRESS_QUERY_KEYS = {
  all: ["progress"] as const,
  measurements: ["progress", "measurements"] as const,
  photos: ["progress", "photos"] as const,
  performance: ["progress", "performance"] as const,
  photoUrl: (storagePath: string) =>
    ["progress", "photo-url", storagePath] as const,
}

function invalidateMeasurementCaches(
  queryClient: ReturnType<typeof useQueryClient>,
  subscriberId?: string,
) {
  void queryClient.invalidateQueries({
    queryKey: PROGRESS_QUERY_KEYS.measurements,
  })
  if (subscriberId) {
    void queryClient.invalidateQueries({
      queryKey: [...PROGRESS_QUERY_KEYS.measurements, subscriberId],
    })
  }
}

function invalidatePhotoCaches(
  queryClient: ReturnType<typeof useQueryClient>,
  subscriberId?: string,
) {
  void queryClient.invalidateQueries({
    queryKey: PROGRESS_QUERY_KEYS.photos,
  })
  if (subscriberId) {
    void queryClient.invalidateQueries({
      queryKey: [...PROGRESS_QUERY_KEYS.photos, subscriberId],
    })
  }
}

function invalidatePerformanceCaches(
  queryClient: ReturnType<typeof useQueryClient>,
  subscriberId?: string,
) {
  void queryClient.invalidateQueries({
    queryKey: PROGRESS_QUERY_KEYS.performance,
  })
  if (subscriberId) {
    void queryClient.invalidateQueries({
      queryKey: [...PROGRESS_QUERY_KEYS.performance, subscriberId],
    })
  }
}

export function useMeasurementsQuery(subscriberId?: string) {
  return useQuery({
    queryKey: subscriberId
      ? [...PROGRESS_QUERY_KEYS.measurements, subscriberId]
      : PROGRESS_QUERY_KEYS.measurements,
    queryFn: async () => {
      const items = await fetchMeasurements(subscriberId)
      return [...items].sort(
        (a, b) =>
          new Date(a.recordedAt).getTime() - new Date(b.recordedAt).getTime(),
      )
    },
    enabled: subscriberId !== undefined ? Boolean(subscriberId) : true,
    staleTime: subscriberId
      ? QUERY_STALE_TIMES.subscriberDashboard
      : QUERY_STALE_TIMES.adminList,
  })
}

export function usePhotosQuery(subscriberId?: string) {
  return useQuery({
    queryKey: subscriberId
      ? [...PROGRESS_QUERY_KEYS.photos, subscriberId]
      : PROGRESS_QUERY_KEYS.photos,
    queryFn: async () => {
      const items = await fetchPhotos(subscriberId)
      return [...items].sort(
        (a, b) => new Date(a.takenAt).getTime() - new Date(b.takenAt).getTime(),
      )
    },
    enabled: subscriberId !== undefined ? Boolean(subscriberId) : true,
    staleTime: subscriberId
      ? QUERY_STALE_TIMES.subscriberDashboard
      : QUERY_STALE_TIMES.adminList,
  })
}

export function usePerformanceQuery(subscriberId?: string) {
  return useQuery({
    queryKey: subscriberId
      ? [...PROGRESS_QUERY_KEYS.performance, subscriberId]
      : PROGRESS_QUERY_KEYS.performance,
    queryFn: async () => {
      const items = await fetchPerformance(subscriberId)
      return [...items].sort(
        (a, b) =>
          new Date(a.recordedAt).getTime() - new Date(b.recordedAt).getTime(),
      )
    },
    enabled: subscriberId !== undefined ? Boolean(subscriberId) : true,
    staleTime: subscriberId
      ? QUERY_STALE_TIMES.subscriberDashboard
      : QUERY_STALE_TIMES.adminList,
  })
}

export function useProgressPhotoUrlQuery(
  photo?: Pick<ProgressPhoto, "storagePath" | "downloadUrl"> | null,
) {
  const key = photo?.storagePath || photo?.downloadUrl || ""
  return useQuery({
    queryKey: PROGRESS_QUERY_KEYS.photoUrl(key),
    queryFn: () => resolveProgressPhotoUrl(photo!),
    enabled: Boolean(photo && key),
    staleTime: QUERY_STALE_TIMES.catalog,
  })
}

export function useSaveMeasurementMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: SaveMeasurementInput) => saveMeasurement(input),
    onSuccess: (saved) => {
      invalidateMeasurementCaches(queryClient, saved.subscriberId)
    },
  })
}

export function useSavePhotoMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: SavePhotoInput) => savePhoto(input),
    onSuccess: (saved) => {
      invalidatePhotoCaches(queryClient, saved.subscriberId)
    },
  })
}

export function useSavePerformanceMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: SavePerformanceInput) => savePerformance(input),
    onSuccess: (saved) => {
      invalidatePerformanceCaches(queryClient, saved.subscriberId)
    },
  })
}

export function useDeleteMeasurementMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: string | { id: string; subscriberId?: string }) => {
      const id = typeof input === "string" ? input : input.id
      const subscriberId =
        typeof input === "string" ? undefined : input.subscriberId
      await deleteMeasurement(id)
      return { subscriberId }
    },
    onSuccess: (result) => {
      invalidateMeasurementCaches(queryClient, result.subscriberId)
    },
  })
}

export function useDeletePhotoMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: string | { id: string; subscriberId?: string }) => {
      const id = typeof input === "string" ? input : input.id
      const subscriberId =
        typeof input === "string" ? undefined : input.subscriberId
      await deletePhoto(id)
      return { subscriberId }
    },
    onSuccess: (result) => {
      invalidatePhotoCaches(queryClient, result.subscriberId)
    },
  })
}

export function useDeletePerformanceMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: string | { id: string; subscriberId?: string }) => {
      const id = typeof input === "string" ? input : input.id
      const subscriberId =
        typeof input === "string" ? undefined : input.subscriberId
      await deletePerformance(id)
      return { subscriberId }
    },
    onSuccess: (result) => {
      invalidatePerformanceCaches(queryClient, result.subscriberId)
    },
  })
}
