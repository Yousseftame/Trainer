import type { SubscriptionStatus } from "@/types/subscription"
import type { AppUser } from "@/types/user"

export type AuthStatus = "idle" | "loading" | "authenticated" | "unauthenticated"

export type AuthState = {
  status: AuthStatus
  user: AppUser | null
  /** Active subscription status for entitlement checks — distinct from role. */
  subscriptionStatus: SubscriptionStatus | null
  error: string | null
}

export function hasActiveEntitlement(status: SubscriptionStatus | null): boolean {
  return status === "active"
}
