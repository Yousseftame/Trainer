import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  archiveNutritionProgram,
  assignNutritionProgram,
  deleteNutritionProgram,
  listNutritionLogs,
  listNutritionPrograms,
  logNutritionAdherence,
  saveNutritionProgram,
  type AssignNutritionInput,
  type SaveNutritionProgramInput,
} from "@/features/nutrition/service"
import type { NutritionAdherenceLog, NutritionProgram } from "@/types/program"

export const nutritionKeys = {
  all: ["nutrition"] as const,
  lists: () => [...nutritionKeys.all, "list"] as const,
  list: (scope?: string) => [...nutritionKeys.lists(), { scope }] as const,
  logs: (subscriberId?: string) =>
    [...nutritionKeys.all, "logs", { subscriberId }] as const,
}

export function useNutritionProgramsQuery(scope?: string) {
  return useQuery<NutritionProgram[]>({
    queryKey: nutritionKeys.list(scope),
    queryFn: async () => {
      const items = await listNutritionPrograms()
      if (!scope || scope === "all") return items
      return items.filter((p) => p.status === scope)
    },
    staleTime: 1000 * 30,
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

export function useDeleteNutritionMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteNutritionProgram(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: nutritionKeys.all })
    },
  })
}

export function useNutritionLogsQuery(subscriberId?: string) {
  return useQuery<NutritionAdherenceLog[]>({
    queryKey: nutritionKeys.logs(subscriberId),
    queryFn: () => listNutritionLogs(subscriberId),
    staleTime: 1000 * 30,
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

