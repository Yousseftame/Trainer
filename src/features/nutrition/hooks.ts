import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { QUERY_STALE_TIMES } from "@/config/constants"
import {
  archiveNutritionProgram,
  assignNutritionProgram,
  deleteNutritionProgram,
  listNutritionLogs,
  listNutritionPrograms,
  logNutritionAdherence,
  restoreNutritionProgram,
  saveNutritionProgram,
  type AssignNutritionInput,
  type SaveNutritionProgramInput,
} from "@/features/nutrition/service"
import type { NutritionAdherenceLog, NutritionProgram } from "@/types/program"

export const nutritionKeys = {
  all: ["nutrition"] as const,
  lists: () => [...nutritionKeys.all, "list"] as const,
  list: (scope?: string, subscriberId?: string) =>
    [...nutritionKeys.lists(), { scope, subscriberId }] as const,
  logs: (subscriberId?: string) =>
    [...nutritionKeys.all, "logs", { subscriberId }] as const,
}

type NutritionProgramsQueryOptions = {
  status?: string
  subscriberId?: string
  enabled?: boolean
}

export function useNutritionProgramsQuery(
  scopeOrOptions?: string | NutritionProgramsQueryOptions,
) {
  const options: NutritionProgramsQueryOptions =
    typeof scopeOrOptions === "string"
      ? { status: scopeOrOptions }
      : (scopeOrOptions ?? {})

  const status = options.status
  const subscriberId = options.subscriberId

  return useQuery<NutritionProgram[]>({
    queryKey: nutritionKeys.list(status, subscriberId),
    queryFn: async () => {
      const items = await listNutritionPrograms(subscriberId)
      if (!status || status === "all") return items
      return items.filter((p) => p.status === status)
    },
    staleTime: subscriberId
      ? QUERY_STALE_TIMES.subscriberDashboard
      : QUERY_STALE_TIMES.adminList,
    enabled: options.enabled ?? true,
  })
}

type NutritionLogsQueryOptions = {
  subscriberId?: string
  enabled?: boolean
}

/** Admin: call with no args. Subscriber: pass { subscriberId }. */
export function useNutritionLogsQuery(
  subscriberIdOrOptions?: string | NutritionLogsQueryOptions,
) {
  const options: NutritionLogsQueryOptions =
    typeof subscriberIdOrOptions === "string"
      ? {
          subscriberId: subscriberIdOrOptions,
          enabled: Boolean(subscriberIdOrOptions),
        }
      : (subscriberIdOrOptions ?? {})

  const subscriberId = options.subscriberId

  return useQuery<NutritionAdherenceLog[]>({
    queryKey: nutritionKeys.logs(subscriberId),
    queryFn: () => listNutritionLogs(subscriberId),
    enabled: options.enabled ?? true,
    staleTime: subscriberId
      ? QUERY_STALE_TIMES.subscriberDashboard
      : QUERY_STALE_TIMES.adminList,
  })
}

export function useSaveNutritionProgramMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: SaveNutritionProgramInput) =>
      saveNutritionProgram(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: nutritionKeys.all })
    },
  })
}

export function useAssignNutritionMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: AssignNutritionInput) => assignNutritionProgram(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: nutritionKeys.all })
    },
  })
}

export function useArchiveNutritionMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => archiveNutritionProgram(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: nutritionKeys.all })
    },
  })
}

export function useRestoreNutritionMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => restoreNutritionProgram(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: nutritionKeys.all })
    },
  })
}

export function useDeleteNutritionMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteNutritionProgram(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: nutritionKeys.all })
    },
  })
}

export function useLogNutritionAdherenceMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: Omit<NutritionAdherenceLog, "id" | "loggedAt">) =>
      logNutritionAdherence(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: nutritionKeys.all })
    },
  })
}
