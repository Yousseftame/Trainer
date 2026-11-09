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
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: PROGRESS_QUERY_KEYS.measurements,
      })
    },
  })
}

export function useSavePhotoMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: SavePhotoInput) => savePhoto(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: PROGRESS_QUERY_KEYS.photos,
      })
    },
  })
}

export function useSavePerformanceMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: SavePerformanceInput) => savePerformance(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: PROGRESS_QUERY_KEYS.performance,
      })
    },
  })
}

export function useDeleteMeasurementMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteMeasurement(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: PROGRESS_QUERY_KEYS.measurements,
      })
    },
  })
}

export function useDeletePhotoMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deletePhoto(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: PROGRESS_QUERY_KEYS.photos,
      })
    },
  })
}

export function useDeletePerformanceMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deletePerformance(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: PROGRESS_QUERY_KEYS.performance,
      })
    },
  })
}
