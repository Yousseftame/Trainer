import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { QUERY_STALE_TIMES } from "@/config/constants"
import {
  fetchPendingExerciseChangeRequests,
  resolveExerciseChangeRequest,
} from "@/features/workouts/exercise-change-requests"
import {
  archiveWorkoutProgram,
  assignWorkoutProgram,
  deleteWorkoutProgram,
  listWorkoutLogs,
  listWorkoutPrograms,
  logWorkoutSession,
  requestExerciseChange,
  restoreWorkoutProgram,
  saveWorkoutProgram,
  type AssignWorkoutInput,
  type SaveWorkoutProgramInput,
} from "@/features/workouts/service"
import type { WorkoutProgram, WorkoutSessionLog } from "@/types/program"

export const workoutKeys = {
  all: ["workouts"] as const,
  lists: () => [...workoutKeys.all, "list"] as const,
  list: (scope?: string, subscriberId?: string) =>
    [...workoutKeys.lists(), { scope, subscriberId }] as const,
  logs: (subscriberId?: string) =>
    [...workoutKeys.all, "logs", { subscriberId }] as const,
}

type WorkoutProgramsQueryOptions = {
  status?: string
  subscriberId?: string
  enabled?: boolean
}

export function useWorkoutProgramsQuery(
  scopeOrOptions?: string | WorkoutProgramsQueryOptions,
) {
  const options: WorkoutProgramsQueryOptions =
    typeof scopeOrOptions === "string"
      ? { status: scopeOrOptions }
      : (scopeOrOptions ?? {})

  const status = options.status
  const subscriberId = options.subscriberId

  return useQuery<WorkoutProgram[]>({
    queryKey: workoutKeys.list(status, subscriberId),
    queryFn: async () => {
      const items = await listWorkoutPrograms(subscriberId)
      if (!status || status === "all") return items
      return items.filter((p) => p.status === status)
    },
    staleTime: subscriberId
      ? QUERY_STALE_TIMES.subscriberDashboard
      : QUERY_STALE_TIMES.adminList,
    enabled: options.enabled ?? true,
  })
}

type WorkoutLogsQueryOptions = {
  subscriberId?: string
  enabled?: boolean
}

/** Admin: call with no args (full list). Subscriber: pass { subscriberId }. */
export function useWorkoutLogsQuery(
  subscriberIdOrOptions?: string | WorkoutLogsQueryOptions,
) {
  const options: WorkoutLogsQueryOptions =
    typeof subscriberIdOrOptions === "string"
      ? { subscriberId: subscriberIdOrOptions, enabled: Boolean(subscriberIdOrOptions) }
      : (subscriberIdOrOptions ?? {})

  const subscriberId = options.subscriberId

  return useQuery<WorkoutSessionLog[]>({
    queryKey: workoutKeys.logs(subscriberId),
    queryFn: () => listWorkoutLogs(subscriberId),
    enabled: options.enabled ?? true,
    staleTime: subscriberId
      ? QUERY_STALE_TIMES.subscriberDashboard
      : QUERY_STALE_TIMES.adminList,
  })
}

function invalidateSubscriberContentLibrary(
  queryClient: ReturnType<typeof useQueryClient>,
) {
  // Exercise videoContentId / pdfContentId links unlock library items server-side.
  void queryClient.invalidateQueries({
    queryKey: ["content_assets", "subscriber_library"],
  })
}

export function useSaveWorkoutProgramMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: SaveWorkoutProgramInput) => saveWorkoutProgram(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: workoutKeys.all })
      invalidateSubscriberContentLibrary(queryClient)
    },
  })
}

export function useAssignWorkoutMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: AssignWorkoutInput) => assignWorkoutProgram(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: workoutKeys.all })
      invalidateSubscriberContentLibrary(queryClient)
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

export function useRestoreWorkoutMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => restoreWorkoutProgram(id),
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

export function useLogWorkoutSessionMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: Omit<WorkoutSessionLog, "id" | "completedAt">) =>
      logWorkoutSession(input),
    onSuccess: () => {
      // Programs (completion), logs, and any admin/subscriber views sharing these keys.
      void queryClient.invalidateQueries({ queryKey: workoutKeys.all })
      void queryClient.invalidateQueries({ queryKey: ["subscribers"] })
      void queryClient.invalidateQueries({ queryKey: ["overview"] })
      void queryClient.invalidateQueries({ queryKey: ["reports"] })
    },
  })
}

export function useRequestExerciseChangeMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: {
      exerciseId: string
      exerciseName: string
      reason: string
      notes?: string
      programId?: string
      dayId?: string
      programTitle?: string
      dayLabel?: string
      substituteId?: string
      substituteName?: string
    }) => requestExerciseChange(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["reports"] })
      void queryClient.invalidateQueries({
        queryKey: [...workoutKeys.all, "exercise-change-requests"],
      })
    },
  })
}

export function usePendingExerciseChangeRequestsQuery(options?: {
  enabled?: boolean
}) {
  return useQuery({
    queryKey: [...workoutKeys.all, "exercise-change-requests", "pending"],
    queryFn: fetchPendingExerciseChangeRequests,
    staleTime: QUERY_STALE_TIMES.adminList,
    enabled: options?.enabled !== false,
  })
}

export function useResolveExerciseChangeMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: {
      requestId: string
      decision: "reviewed" | "dismissed"
      resolutionNote?: string
    }) => resolveExerciseChangeRequest(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: [...workoutKeys.all, "exercise-change-requests"],
      })
      void queryClient.invalidateQueries({ queryKey: ["reports"] })
    },
  })
}
