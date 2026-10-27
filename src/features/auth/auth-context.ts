import { createContext, useContext } from "react"
import type { AuthState } from "@/features/auth/types"
import type { Permission } from "@/lib/permissions/permissions"
import type { AppUser } from "@/types/user"

export type AuthContextValue = AuthState & {
  isAdmin: boolean
  isSubscriber: boolean
  hasPermission: (permission: Permission) => boolean
  hasActiveSubscription: boolean
  refreshProfile: () => Promise<void>
  signOut: () => Promise<void>
  /** Dev / scaffold helper until Firebase auth is wired */
  setDemoUser: (user: AppUser | null, subscriptionStatus?: AuthState["subscriptionStatus"]) => void
}

export const AuthContext = createContext<AuthContextValue | null>(null)

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider")
  }
  return ctx
}
