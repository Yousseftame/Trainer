import { createContext, useContext } from "react"
import type { AuthState } from "@/features/auth/types"
import type { Permission } from "@/lib/permissions/permissions"

export type AuthContextValue = AuthState & {
  isAdmin: boolean
  isSubscriber: boolean
  hasPermission: (permission: Permission) => boolean
  hasActiveSubscription: boolean
  refreshProfile: () => Promise<void>
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  updateAccount: (patch: { displayName?: string; phone?: string }) => Promise<void>
  changePassword: (currentPassword: string, nextPassword: string) => Promise<void>
}

export const AuthContext = createContext<AuthContextValue | null>(null)

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider")
  }
  return ctx
}
