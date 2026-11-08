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

export function useSavePackageMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: SavePackageInput) => savePackage(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: SUBSCRIPTION_QUERY_KEYS.packages })
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
    },
  })
}

export function useAssignSubscriptionMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: AssignSubscriptionInput) => assignSubscription(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: SUBSCRIPTION_QUERY_KEYS.subscriptions,
      })
      void queryClient.invalidateQueries({ queryKey: SUBSCRIPTION_QUERY_KEYS.packages })
      void queryClient.invalidateQueries({ queryKey: ["subscribers"] })
    },
  })
}

export function useUpdateSubscriptionLifecycleMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: UpdateSubscriptionLifecycleInput) =>
      updateSubscriptionLifecycle(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: SUBSCRIPTION_QUERY_KEYS.subscriptions,
      })
      void queryClient.invalidateQueries({ queryKey: SUBSCRIPTION_QUERY_KEYS.packages })
      void queryClient.invalidateQueries({ queryKey: ["subscribers"] })
    },
  })
}
