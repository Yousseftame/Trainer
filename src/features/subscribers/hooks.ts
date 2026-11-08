import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { QUERY_STALE_TIMES } from "@/config/constants"
import {
  createRegistrationRequest,
  deleteSubscriberAccount,
  fetchRegistrationRequests,
  fetchSubscriberById,
  fetchSubscribers,
  purgeDemoSubscriberData,
  reviewRegistrationRequest,
  saveSubscriber,
  updateSubscriberAccountStatus,
  updateSubscriberCoachNotes,
  type CreateRegistrationRequestInput,
  type ReviewRegistrationRequestInput,
  type SaveSubscriberInput,
  type UpdateSubscriberStatusInput,
} from "@/features/subscribers/service"
import { SUBSCRIPTION_QUERY_KEYS } from "@/features/subscriptions/hooks"

export const subscriberKeys = {
  subscribers: ["subscribers"] as const,
  me: (uid: string) => ["subscribers", "me", uid] as const,
  requests: ["registrationRequests"] as const,
}

type ListQueryOptions = {
  /** Default true. Set false to skip admin full-list reads. */
  enabled?: boolean
}

/** Admin full subscriber directory — only mount on admin pages that need it. */
export function useSubscribersQuery(options?: ListQueryOptions) {
  return useQuery({
    queryKey: subscriberKeys.subscribers,
    queryFn: fetchSubscribers,
    staleTime: QUERY_STALE_TIMES.adminList,
    enabled: options?.enabled ?? true,
  })
}

/** Single-doc read for the signed-in subscriber (Auth UID = doc id). */
export function useMySubscriberQuery(uid: string | undefined) {
  return useQuery({
    queryKey: subscriberKeys.me(uid ?? ""),
    queryFn: () => fetchSubscriberById(uid!),
    enabled: Boolean(uid),
    staleTime: QUERY_STALE_TIMES.subscriberDashboard,
  })
}

export function useRegistrationRequestsQuery(options?: ListQueryOptions) {
  return useQuery({
    queryKey: subscriberKeys.requests,
    queryFn: fetchRegistrationRequests,
    staleTime: QUERY_STALE_TIMES.adminList,
    enabled: options?.enabled ?? true,
  })
}

export function useSaveSubscriberMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: SaveSubscriberInput) => saveSubscriber(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: subscriberKeys.subscribers })
      void queryClient.invalidateQueries({ queryKey: ["subscribers", "me"] })
      void queryClient.invalidateQueries({
        queryKey: SUBSCRIPTION_QUERY_KEYS.subscriptions,
      })
    },
  })
}

export function useUpdateSubscriberStatusMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: UpdateSubscriberStatusInput) =>
      updateSubscriberAccountStatus(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: subscriberKeys.subscribers })
      void queryClient.invalidateQueries({ queryKey: ["subscribers", "me"] })
      void queryClient.invalidateQueries({
        queryKey: SUBSCRIPTION_QUERY_KEYS.subscriptions,
      })
    },
  })
}

export function useDeleteSubscriberMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (subscriberId: string) => deleteSubscriberAccount(subscriberId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: subscriberKeys.subscribers })
      void queryClient.invalidateQueries({ queryKey: ["subscribers", "me"] })
      void queryClient.invalidateQueries({ queryKey: subscriberKeys.requests })
      void queryClient.invalidateQueries({
        queryKey: SUBSCRIPTION_QUERY_KEYS.subscriptions,
      })
    },
  })
}

export function useCreateRegistrationRequestMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: CreateRegistrationRequestInput) =>
      createRegistrationRequest(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: subscriberKeys.requests })
    },
  })
}

export function useReviewRegistrationRequestMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: ReviewRegistrationRequestInput) =>
      reviewRegistrationRequest(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: subscriberKeys.requests })
      void queryClient.invalidateQueries({ queryKey: subscriberKeys.subscribers })
      void queryClient.invalidateQueries({ queryKey: ["subscribers", "me"] })
      void queryClient.invalidateQueries({
        queryKey: SUBSCRIPTION_QUERY_KEYS.subscriptions,
      })
      void queryClient.invalidateQueries({
        queryKey: SUBSCRIPTION_QUERY_KEYS.packages,
      })
    },
  })
}

export function useUpdateSubscriberCoachNotesMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      subscriberId,
      coachNotes,
    }: {
      subscriberId: string
      coachNotes: { en: string; ar: string } | string
    }) => updateSubscriberCoachNotes(subscriberId, coachNotes),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: subscriberKeys.subscribers })
      void queryClient.invalidateQueries({ queryKey: ["subscribers", "me"] })
    },
  })
}

export function usePurgeDemoSubscribersMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => purgeDemoSubscriberData(),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: subscriberKeys.subscribers })
      void queryClient.invalidateQueries({ queryKey: ["subscribers", "me"] })
      void queryClient.invalidateQueries({ queryKey: subscriberKeys.requests })
    },
  })
}
