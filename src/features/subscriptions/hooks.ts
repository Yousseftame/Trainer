import { useEffect, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { QUERY_STALE_TIMES } from "@/config/constants"
import {
  assignSubscription,
  fetchPackageById,
  fetchPackages,
  fetchSubscriptions,
  fetchSubscriptionsForSubscriber,
  savePackage,
  togglePackageActive,
  updateSubscriptionLifecycle,
  type AssignSubscriptionInput,
  type SavePackageInput,
  type UpdateSubscriptionLifecycleInput,
} from "@/features/subscriptions/service"

export const SUBSCRIPTION_QUERY_KEYS = {
  packages: ["packages"] as const,
  package: (id: string) => ["packages", id] as const,
  subscriptions: ["subscriptions"] as const,
  subscriptionsFor: (subscriberId: string) =>
    ["subscriptions", "subscriber", subscriberId] as const,
}

export const subscriptionKeys = SUBSCRIPTION_QUERY_KEYS

type ListQueryOptions = {
  enabled?: boolean
}

/** Public catalog + admin packages page. Long staleTime — static-ish. */
export function usePackagesQuery(options?: ListQueryOptions) {
  return useQuery({
    queryKey: SUBSCRIPTION_QUERY_KEYS.packages,
    queryFn: fetchPackages,
    staleTime: QUERY_STALE_TIMES.catalog,
    enabled: options?.enabled ?? true,
  })
}

export function usePackageByIdQuery(packageId: string | undefined) {
  return useQuery({
    queryKey: SUBSCRIPTION_QUERY_KEYS.package(packageId ?? ""),
    queryFn: () => fetchPackageById(packageId!),
    enabled: Boolean(packageId),
    staleTime: QUERY_STALE_TIMES.catalog,
  })
}

/** Admin full subscriptions list — never use on subscriber panel. */
export function useSubscriptionsQuery(options?: ListQueryOptions) {
  return useQuery({
    queryKey: SUBSCRIPTION_QUERY_KEYS.subscriptions,
    queryFn: fetchSubscriptions,
    staleTime: QUERY_STALE_TIMES.adminList,
    enabled: options?.enabled ?? true,
  })
}

/** Subscriber-scoped subscriptions (rules-safe + cheap). */
export function useSubscriberSubscriptionsQuery(subscriberId: string | undefined) {
  return useQuery({
    queryKey: SUBSCRIPTION_QUERY_KEYS.subscriptionsFor(subscriberId ?? ""),
    queryFn: () => fetchSubscriptionsForSubscriber(subscriberId!),
    enabled: Boolean(subscriberId),
    staleTime: QUERY_STALE_TIMES.subscriberDashboard,
  })
}

function invalidateSubscriberContentLibrary(
  queryClient: ReturnType<typeof useQueryClient>,
) {
  // Package entitlements / subscription lifecycle gate library unlocks.
  void queryClient.invalidateQueries({
    queryKey: ["content_assets", "subscriber_library"],
  })
}

export function useSavePackageMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: SavePackageInput) => savePackage(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: SUBSCRIPTION_QUERY_KEYS.packages })
      invalidateSubscriberContentLibrary(queryClient)
    },
  })
}

export function useTogglePackageActiveMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ packageId, isActive }: { packageId: string; isActive: boolean }) =>
      togglePackageActive(packageId, isActive),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: SUBSCRIPTION_QUERY_KEYS.packages })
      invalidateSubscriberContentLibrary(queryClient)
    },
  })
}

function invalidateSubscriptionScopes(
  queryClient: ReturnType<typeof useQueryClient>,
  subscriberId?: string,
) {
  void queryClient.invalidateQueries({
    queryKey: SUBSCRIPTION_QUERY_KEYS.subscriptions,
  })
  if (subscriberId) {
    void queryClient.invalidateQueries({
      queryKey: SUBSCRIPTION_QUERY_KEYS.subscriptionsFor(subscriberId),
    })
  } else {
    void queryClient.invalidateQueries({
      queryKey: ["subscriptions", "subscriber"],
    })
  }
  void queryClient.invalidateQueries({ queryKey: SUBSCRIPTION_QUERY_KEYS.packages })
  void queryClient.invalidateQueries({ queryKey: ["subscribers"] })
  void queryClient.invalidateQueries({
    queryKey: ["subscription_change_requests"],
  })
  invalidateSubscriberContentLibrary(queryClient)
}

export function useAssignSubscriptionMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: AssignSubscriptionInput) => assignSubscription(input),
    onSuccess: (saved) => {
      invalidateSubscriptionScopes(queryClient, saved.subscriberId)
    },
  })
}

export function useUpdateSubscriptionLifecycleMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: UpdateSubscriptionLifecycleInput) =>
      updateSubscriptionLifecycle(input),
    onSuccess: (saved) => {
      invalidateSubscriptionScopes(queryClient, saved.subscriberId)
    },
  })
}

export function useSubscriberChangeRequestsQuery(subscriberId?: string) {
  return useQuery({
    queryKey: ["subscription_change_requests", "subscriber", subscriberId ?? ""],
    queryFn: async () => {
      const { fetchSubscriptionChangeRequestsForSubscriber } = await import(
        "@/features/subscriptions/change-requests"
      )
      return fetchSubscriptionChangeRequestsForSubscriber(subscriberId!)
    },
    enabled: Boolean(subscriberId),
    staleTime: QUERY_STALE_TIMES.subscriberDashboard,
  })
}

export function usePendingChangeRequestsQuery(options?: ListQueryOptions) {
  return useQuery({
    queryKey: ["subscription_change_requests", "pending"],
    queryFn: async () => {
      const { fetchPendingSubscriptionChangeRequests } = await import(
        "@/features/subscriptions/change-requests"
      )
      return fetchPendingSubscriptionChangeRequests()
    },
    staleTime: QUERY_STALE_TIMES.adminList,
    enabled: options?.enabled ?? true,
  })
}

/** Sidebar badge — live pending package-change requests only. */
export function usePendingChangeRequestCount(options?: { enabled?: boolean }) {
  const enabled = options?.enabled ?? true
  const [count, setCount] = useState(0)

  useEffect(() => {
    if (!enabled) {
      setCount(0)
      return
    }
    let unsub: (() => void) | undefined
    let cancelled = false
    void import("@/features/subscriptions/change-requests").then(
      ({ subscribePendingSubscriptionChangeRequestCount }) => {
        if (cancelled) return
        unsub = subscribePendingSubscriptionChangeRequestCount(
          setCount,
          (err) => {
            console.warn("[subscriptions] pending change count listen failed:", err)
          },
        )
      },
    )
    return () => {
      cancelled = true
      unsub?.()
    }
  }, [enabled])

  return count
}

export function useRequestSubscriptionChangeMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: {
      packageId: string
      currentPackageId?: string
      note?: string
      noteAr?: string
      noteEn?: string
    }) => {
      const { requestSubscriptionChange } = await import(
        "@/features/subscriptions/change-requests"
      )
      return requestSubscriptionChange(input)
    },
    onSuccess: (saved) => {
      void queryClient.invalidateQueries({
        queryKey: ["subscription_change_requests"],
      })
      void queryClient.invalidateQueries({
        queryKey: [
          "subscription_change_requests",
          "subscriber",
          saved.subscriberId,
        ],
      })
    },
  })
}

export function useResolveSubscriptionChangeRequestMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: {
      requestId: string
      decision: "approved" | "rejected"
      assignNow?: boolean
      resolutionNote?: string
    }) => {
      const { resolveSubscriptionChangeRequest } = await import(
        "@/features/subscriptions/change-requests"
      )
      return resolveSubscriptionChangeRequest(input)
    },
    onSuccess: (result) => {
      invalidateSubscriptionScopes(
        queryClient,
        result.request.subscriberId,
      )
    },
  })
}
