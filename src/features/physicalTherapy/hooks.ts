import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  deletePTRecord,
  fetchPTRecords,
  fetchSubscriberPTRecord,
  fetchSubscriberPTRecords,
  savePTRecord,
} from "@/features/physicalTherapy/service"
import type { PhysicalTherapyRecord } from "@/types/physicalTherapy"

export const PT_QUERY_KEY = ["physical_therapy"]

export function usePTRecordsQuery() {
  return useQuery({
    queryKey: PT_QUERY_KEY,
    queryFn: fetchPTRecords,
    staleTime: 30_000,
  })
}

export function useSubscriberPTQuery(subscriberId?: string) {
  return useQuery({
    queryKey: [...PT_QUERY_KEY, "subscriber", subscriberId],
    queryFn: () => (subscriberId ? fetchSubscriberPTRecord(subscriberId) : null),
    enabled: Boolean(subscriberId),
    staleTime: 30_000,
  })
}

export function useSubscriberPTRecordsQuery(subscriberId?: string) {
  return useQuery({
    queryKey: [...PT_QUERY_KEY, "subscriber_records", subscriberId],
    queryFn: () => (subscriberId ? fetchSubscriberPTRecords(subscriberId) : []),
    enabled: Boolean(subscriberId),
    staleTime: 30_000,
  })
}

export function useSavePTRecordMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (
      record: Partial<PhysicalTherapyRecord> & {
        subscriberId: string
        injuryTitle: PhysicalTherapyRecord["injuryTitle"]
        affectedArea: PhysicalTherapyRecord["affectedArea"]
      },
    ) => savePTRecord(record),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: PT_QUERY_KEY })
    },
  })
}

export function useDeletePTRecordMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deletePTRecord(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: PT_QUERY_KEY })
    },
  })
}

