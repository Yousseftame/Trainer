import { useEffect, useState } from "react"
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
  subscribePendingRegistrationRequestCount,
  subscribeSubscriberById,
  updateMySubscriberProfile,
  updateSubscriberAccountStatus,
  updateSubscriberCoachNotes,
  type CreateRegistrationRequestInput,
  type ReviewRegistrationRequestInput,
  type SaveSubscriberInput,
  type UpdateMyProfileInput,
  type UpdateSubscriberStatusInput,
} from "@/features/subscribers/service"
import type { Subscriber } from "@/features/subscribers/types"
import { SUBSCRIPTION_QUERY_KEYS } from "@/features/subscriptions/hooks"

export const subscriberKeys = {
  subscribers: ["subscribers"] as const,
  detail: (id: string) => ["subscribers", "detail", id] as const,
  me: (uid: string) => ["subscribers", "me", uid] as const,
  requests: ["registrationRequests"] as const,
}

function patchSubscriberCaches(
  queryClient: ReturnType<typeof useQueryClient>,
  subscriber: Subscriber | null,
  id: string,
) {
  queryClient.setQueryData(subscriberKeys.detail(id), subscriber)
  queryClient.setQueryData(subscriberKeys.me(id), subscriber)
  queryClient.setQueryData(
    subscriberKeys.subscribers,
    (prev: Subscriber[] | undefined) => {
      if (!prev) return prev
      if (!subscriber) return prev.filter((row) => row.id !== id)
      const idx = prev.findIndex((row) => row.id === id)
      if (idx < 0) return [subscriber, ...prev]
      const next = [...prev]
      next[idx] = subscriber
      return next
    },
  )
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
  const queryClient = useQueryClient()
  const query = useQuery({
    queryKey: subscriberKeys.me(uid ?? ""),
    queryFn: () => fetchSubscriberById(uid!),
    enabled: Boolean(uid),
    staleTime: QUERY_STALE_TIMES.subscriberDashboard,
  })

  useEffect(() => {
    if (!uid) return
    return subscribeSubscriberById(uid, (subscriber) => {
      patchSubscriberCaches(queryClient, subscriber, uid)
    })
  }, [uid, queryClient])

  return query
}

/** Admin detail — live single doc so Profile edits appear immediately. */
export function useSubscriberDetailQuery(subscriberId: string | undefined) {
  const queryClient = useQueryClient()
  const query = useQuery({
    queryKey: subscriberKeys.detail(subscriberId ?? ""),
    queryFn: () => fetchSubscriberById(subscriberId!),
    enabled: Boolean(subscriberId),
    staleTime: QUERY_STALE_TIMES.adminList,
  })

  useEffect(() => {
    if (!subscriberId) return
    return subscribeSubscriberById(subscriberId, (subscriber) => {
      patchSubscriberCaches(queryClient, subscriber, subscriberId)
    })
  }, [subscriberId, queryClient])

  return query
}

export function useRegistrationRequestsQuery(options?: ListQueryOptions) {
  return useQuery({
    queryKey: subscriberKeys.requests,
    queryFn: fetchRegistrationRequests,
    staleTime: QUERY_STALE_TIMES.adminList,
    enabled: options?.enabled ?? true,
  })
}

/** Sidebar badge — live pending registration requests only. */
export function usePendingRegistrationRequestCount(options?: {
  enabled?: boolean
}) {
  const enabled = options?.enabled ?? true
  const [count, setCount] = useState(0)

  useEffect(() => {
    if (!enabled) {
      setCount(0)
      return
    }
    return subscribePendingRegistrationRequestCount(setCount, (err) => {
      console.warn("[registration] pending count listen failed:", err)
    })
  }, [enabled])

  return count
}

export function useSaveSubscriberMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: SaveSubscriberInput) => saveSubscriber(input),
    onSuccess: (subscriber) => {
      void queryClient.invalidateQueries({ queryKey: subscriberKeys.subscribers })
      void queryClient.invalidateQueries({
        queryKey: subscriberKeys.detail(subscriber.id),
      })
      void queryClient.invalidateQueries({ queryKey: ["subscribers", "me"] })
      void queryClient.invalidateQueries({
        queryKey: SUBSCRIPTION_QUERY_KEYS.subscriptions,
      })
    },
  })
}

/** Subscriber Profile — allowlisted self updates via Cloud Function. */
export function useUpdateMyProfileMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: UpdateMyProfileInput) => updateMySubscriberProfile(input),
    onSuccess: (subscriber) => {
      patchSubscriberCaches(queryClient, subscriber, subscriber.id)
      void queryClient.invalidateQueries({ queryKey: subscriberKeys.subscribers })
      void queryClient.invalidateQueries({
        queryKey: subscriberKeys.detail(subscriber.id),
      })
      void queryClient.invalidateQueries({
        queryKey: subscriberKeys.me(subscriber.id),
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
    onSuccess: (subscriber) => {
      patchSubscriberCaches(queryClient, subscriber, subscriber.id)
      void queryClient.invalidateQueries({ queryKey: subscriberKeys.subscribers })
      void queryClient.invalidateQueries({
        queryKey: subscriberKeys.detail(subscriber.id),
      })
      void queryClient.invalidateQueries({
        queryKey: subscriberKeys.me(subscriber.id),
      })
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
