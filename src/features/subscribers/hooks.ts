import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { DEMO_SUBSCRIBERS } from "@/features/subscribers/demo"
import { DEMO_REGISTRATION_REQUESTS } from "@/features/subscribers/requests-demo"
import {
  createRegistrationRequest,
  fetchRegistrationRequests,
  fetchSubscribers,
  reviewRegistrationRequest,
  saveSubscriber,
  updateSubscriberAccountStatus,
  type CreateRegistrationRequestInput,
  type ReviewRegistrationRequestInput,
  type SaveSubscriberInput,
  type UpdateSubscriberStatusInput,
} from "@/features/subscribers/service"
import { SUBSCRIPTION_QUERY_KEYS } from "@/features/subscriptions/hooks"

export const subscriberKeys = {
  subscribers: ["subscribers"] as const,
  requests: ["registrationRequests"] as const,
}

export function useSubscribersQuery() {
  return useQuery({
    queryKey: subscriberKeys.subscribers,
    queryFn: fetchSubscribers,
    initialData: () => [...DEMO_SUBSCRIBERS],
    staleTime: 30_000,
  })
}

export function useRegistrationRequestsQuery() {
  return useQuery({
    queryKey: subscriberKeys.requests,
    queryFn: fetchRegistrationRequests,
    initialData: () => [...DEMO_REGISTRATION_REQUESTS],
    staleTime: 30_000,
  })
}

export function useSaveSubscriberMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: SaveSubscriberInput) => saveSubscriber(input),
    onSuccess: () => {
      queryClient.setQueryData(subscriberKeys.subscribers, [...DEMO_SUBSCRIBERS])
      void queryClient.invalidateQueries({ queryKey: subscriberKeys.subscribers })
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
      queryClient.setQueryData(subscriberKeys.subscribers, [...DEMO_SUBSCRIBERS])
      void queryClient.invalidateQueries({ queryKey: subscriberKeys.subscribers })
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
      queryClient.setQueryData(
        subscriberKeys.requests,
        [...DEMO_REGISTRATION_REQUESTS],
      )
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
      queryClient.setQueryData(
        subscriberKeys.requests,
        [...DEMO_REGISTRATION_REQUESTS],
      )
      queryClient.setQueryData(subscriberKeys.subscribers, [...DEMO_SUBSCRIBERS])
      void queryClient.invalidateQueries({ queryKey: subscriberKeys.requests })
      void queryClient.invalidateQueries({ queryKey: subscriberKeys.subscribers })
      void queryClient.invalidateQueries({
        queryKey: SUBSCRIPTION_QUERY_KEYS.subscriptions,
      })
    },
  })
}

