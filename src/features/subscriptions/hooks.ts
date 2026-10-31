import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { DEMO_PACKAGES, DEMO_SUBSCRIPTIONS } from "@/features/subscriptions/demo"
import {
  assignSubscription,
  fetchPackages,
  fetchSubscriptions,
  savePackage,
  togglePackageActive,
  updateSubscriptionLifecycle,
  type AssignSubscriptionInput,
  type SavePackageInput,
  type UpdateSubscriptionLifecycleInput,
} from "@/features/subscriptions/service"

export const SUBSCRIPTION_QUERY_KEYS = {
  packages: ["packages"] as const,
  subscriptions: ["subscriptions"] as const,
}

export const subscriptionKeys = SUBSCRIPTION_QUERY_KEYS

export function usePackagesQuery() {
  return useQuery({
    queryKey: SUBSCRIPTION_QUERY_KEYS.packages,
    queryFn: fetchPackages,
    initialData: () => [...DEMO_PACKAGES],
    staleTime: 30_000,
  })
}

export function useSubscriptionsQuery() {
  return useQuery({
    queryKey: SUBSCRIPTION_QUERY_KEYS.subscriptions,
    queryFn: fetchSubscriptions,
    initialData: () => [...DEMO_SUBSCRIPTIONS],
    staleTime: 30_000,
  })
}

export function useSavePackageMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: SavePackageInput) => savePackage(input),
    onSuccess: (saved) => {
      queryClient.setQueryData(SUBSCRIPTION_QUERY_KEYS.packages, [...DEMO_PACKAGES])
      void queryClient.invalidateQueries({ queryKey: SUBSCRIPTION_QUERY_KEYS.packages })
      return saved
    },
  })
}

export function useTogglePackageActiveMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ packageId, isActive }: { packageId: string; isActive: boolean }) =>
      togglePackageActive(packageId, isActive),
    onSuccess: () => {
      queryClient.setQueryData(SUBSCRIPTION_QUERY_KEYS.packages, [...DEMO_PACKAGES])
      void queryClient.invalidateQueries({ queryKey: SUBSCRIPTION_QUERY_KEYS.packages })
    },
  })
}

export function useAssignSubscriptionMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: AssignSubscriptionInput) => assignSubscription(input),
    onSuccess: () => {
      queryClient.setQueryData(
        SUBSCRIPTION_QUERY_KEYS.subscriptions,
        [...DEMO_SUBSCRIPTIONS],
      )
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
      queryClient.setQueryData(
        SUBSCRIPTION_QUERY_KEYS.subscriptions,
        [...DEMO_SUBSCRIPTIONS],
      )
      void queryClient.invalidateQueries({
        queryKey: SUBSCRIPTION_QUERY_KEYS.subscriptions,
      })
      void queryClient.invalidateQueries({ queryKey: SUBSCRIPTION_QUERY_KEYS.packages })
      void queryClient.invalidateQueries({ queryKey: ["subscribers"] })
    },
  })
}

