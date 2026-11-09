import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  deleteStaffMember,
  fetchStaffMembers,
  purgeDemoStaffMembers,
  saveStaffMember,
  toggleStaffStatus,
  type SaveStaffInput,
} from "@/features/staff/service"

export const STAFF_QUERY_KEY = ["staff_members"]

export function useStaffMembersQuery() {
  return useQuery({
    queryKey: STAFF_QUERY_KEY,
    queryFn: fetchStaffMembers,
    staleTime: 30_000,
  })
}

export function useSaveStaffMemberMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: SaveStaffInput) => saveStaffMember(input),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: STAFF_QUERY_KEY })
    },
  })
}

export function useToggleStaffStatusMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => toggleStaffStatus(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: STAFF_QUERY_KEY })
    },
  })
}

export function useDeleteStaffMemberMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteStaffMember(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: STAFF_QUERY_KEY })
    },
  })
}

export function usePurgeDemoStaffMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => purgeDemoStaffMembers(),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: STAFF_QUERY_KEY })
    },
  })
}

