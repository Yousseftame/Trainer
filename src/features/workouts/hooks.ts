import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  archiveWorkoutProgram,
  assignWorkoutProgram,
  deleteWorkoutProgram,
  listWorkoutLogs,
  listWorkoutPrograms,
  logWorkoutSession,
  saveWorkoutProgram,
  type AssignWorkoutInput,
  type SaveWorkoutProgramInput,
} from "@/features/workouts/service"
import type { WorkoutProgram, WorkoutSessionLog } from "@/types/program"

export const workoutKeys = {
  all: ["workouts"] as const,
  lists: () => [...workoutKeys.all, "list"] as const,
  list: (scope?: string) => [...workoutKeys.lists(), { scope }] as const,
  logs: (subscriberId?: string) =>
    [...workoutKeys.all, "logs", { subscriberId }] as const,
}

export function useWorkoutProgramsQuery(scope?: string) {
  return useQuery<WorkoutProgram[]>({
    queryKey: workoutKeys.list(scope),
    queryFn: async () => {
      const items = await listWorkoutPrograms()
      if (!scope || scope === "all") return items
      return items.filter((p) => p.status === scope)
    },
    staleTime: 1000 * 30,
  })
}

export function useSaveWorkoutProgramMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: SaveWorkoutProgramInput) => saveWorkoutProgram(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: workoutKeys.all })
    },
  })
}

export function useAssignWorkoutMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: AssignWorkoutInput) => assignWorkoutProgram(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: workoutKeys.all })
    },
  })
}

export function useArchiveWorkoutMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => archiveWorkoutProgram(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: workoutKeys.all })
    },
  })
}

export function useDeleteWorkoutMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteWorkoutProgram(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: workoutKeys.all })
    },
  })
}

export function useWorkoutLogsQuery(subscriberId?: string) {
  return useQuery<WorkoutSessionLog[]>({
    queryKey: workoutKeys.logs(subscriberId),
    queryFn: () => listWorkoutLogs(subscriberId),
    staleTime: 1000 * 30,
  })
}

export function useLogWorkoutSessionMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: Omit<WorkoutSessionLog, "id" | "completedAt">) =>
      logWorkoutSession(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: workoutKeys.all })
    },
  })
}

