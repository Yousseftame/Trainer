import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { QUERY_STALE_TIMES } from "@/config/constants"
import {
  deletePhysicalTherapyRecord,
  fetchSubscriberPTRecord,
  listPhysicalTherapyRecords,
  savePhysicalTherapyRecord,
  type SavePTRecordInput,
} from "@/features/physicalTherapy/service"

export const PT_QUERY_KEYS = {
  all: ["physical_therapy"] as const,
  list: (subscriberId?: string) =>
    subscriberId
      ? (["physical_therapy", "list", subscriberId] as const)
      : (["physical_therapy", "list"] as const),
  primary: (subscriberId: string) =>
    ["physical_therapy", "primary", subscriberId] as const,
}

/** @deprecated Prefer PT_QUERY_KEYS.all */
export const PT_QUERY_KEY = PT_QUERY_KEYS.all

export function usePTRecordsQuery(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: PT_QUERY_KEYS.list(),
    queryFn: () => listPhysicalTherapyRecords(),
    enabled: options?.enabled ?? true,
    staleTime: QUERY_STALE_TIMES.adminList,
  })
}

export function useSubscriberPTRecordsQuery(subscriberId?: string) {
  return useQuery({
    queryKey: PT_QUERY_KEYS.list(subscriberId),
    queryFn: () =>
      subscriberId ? listPhysicalTherapyRecords(subscriberId) : [],
    enabled: Boolean(subscriberId),
    staleTime: QUERY_STALE_TIMES.subscriberDashboard,
  })
}

export function useSubscriberPTQuery(subscriberId?: string) {
  return useQuery({
    queryKey: PT_QUERY_KEYS.primary(subscriberId ?? ""),
    queryFn: () =>
      subscriberId ? fetchSubscriberPTRecord(subscriberId) : null,
    enabled: Boolean(subscriberId),
    staleTime: QUERY_STALE_TIMES.subscriberDashboard,
  })
}

export function useSavePTRecordMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: SavePTRecordInput) => savePhysicalTherapyRecord(input),
    onSuccess: (saved) => {
      void queryClient.invalidateQueries({ queryKey: PT_QUERY_KEYS.all })
      void queryClient.invalidateQueries({
        queryKey: PT_QUERY_KEYS.list(saved.subscriberId),
      })
      void queryClient.invalidateQueries({
        queryKey: PT_QUERY_KEYS.primary(saved.subscriberId),
      })
    },
  })
}

export function useDeletePTRecordMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deletePhysicalTherapyRecord(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: PT_QUERY_KEYS.all })
    },
  })
}
