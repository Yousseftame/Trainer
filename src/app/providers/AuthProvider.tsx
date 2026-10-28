import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react"
import { onAuthStateChanged, signOut as firebaseSignOut } from "firebase/auth"
import { AuthContext, type AuthContextValue } from "@/features/auth/auth-context"
import { readDemoSession, writeDemoSession } from "@/features/auth/demo"
import { hasActiveEntitlement, type AuthState } from "@/features/auth/types"
import { isFirebaseConfigured } from "@/config/env"
import { tryGetFirebaseAuth } from "@/lib/firebase/auth"
import { can } from "@/lib/permissions/can"
import { isAdminRole, isSubscriberRole } from "@/lib/permissions/roles"
import type { Permission } from "@/lib/permissions/permissions"
import type { AppUser } from "@/types/user"
import type { SubscriptionStatus } from "@/types/subscription"

const initialState: AuthState = {
  status: "loading",
  user: null,
  subscriptionStatus: null,
  error: null,
}

type AuthProviderProps = {
  children: ReactNode
}

/**
 * Owns authentication identity only.
 * Server data (lists, programs, progress) stays in TanStack Query — do not mirror it here.
 */
export function AuthProvider({ children }: AuthProviderProps) {
  const [state, setState] = useState<AuthState>(initialState)

  const refreshProfile = useCallback(async () => {
    // Profile + subscription entitlement will load from Firestore / claims in the auth feature.
    // Kept as a stable API surface for guards and post-login refresh.
  }, [])

  const signOut = useCallback(async () => {
    writeDemoSession(null)
    const auth = tryGetFirebaseAuth()
    if (auth) {
      await firebaseSignOut(auth)
    }
    setState({
      status: "unauthenticated",
      user: null,
      subscriptionStatus: null,
      error: null,
    })
  }, [])

  const setDemoUser = useCallback(
    (user: AppUser | null, subscriptionStatus: SubscriptionStatus | null = null) => {
      if (user) {
        const nextStatus = isSubscriberRole(user.role) ? subscriptionStatus : null
        writeDemoSession({ user, subscriptionStatus: nextStatus })
        setState({
          status: "authenticated",
          user,
          subscriptionStatus: nextStatus,
          error: null,
        })
        return
      }

      writeDemoSession(null)
      setState({
        status: "unauthenticated",
        user: null,
        subscriptionStatus: null,
        error: null,
      })
    },
    [],
  )

  useEffect(() => {
    if (!isFirebaseConfigured()) {
      const demo = readDemoSession()
      setState(
        demo
          ? {
              status: "authenticated",
              user: demo.user,
              subscriptionStatus: demo.subscriptionStatus,
              error: null,
            }
          : {
              status: "unauthenticated",
              user: null,
              subscriptionStatus: null,
              error: null,
            },
      )
      return
    }

    const auth = tryGetFirebaseAuth()
    if (!auth) {
      const demo = readDemoSession()
      setState(
        demo
          ? {
              status: "authenticated",
              user: demo.user,
              subscriptionStatus: demo.subscriptionStatus,
              error: null,
            }
          : {
              status: "unauthenticated",
              user: null,
              subscriptionStatus: null,
              error: null,
            },
      )
      return
    }

    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (!firebaseUser) {
        const demo = readDemoSession()
        if (demo) {
          setState({
            status: "authenticated",
            user: demo.user,
            subscriptionStatus: demo.subscriptionStatus,
            error: null,
          })
          return
        }
        setState({
          status: "unauthenticated",
          user: null,
          subscriptionStatus: null,
          error: null,
        })
        return
      }

      // Keep loading until profile/claims hydrate — avoids guard flicker into login.
      setState((prev) => ({
        status: prev.user?.uid === firebaseUser.uid ? "authenticated" : "loading",
        user: prev.user?.uid === firebaseUser.uid ? prev.user : null,
        subscriptionStatus:
          prev.user?.uid === firebaseUser.uid ? prev.subscriptionStatus : null,
        error: null,
      }))
      void refreshProfile()
    })

    return unsubscribe
  }, [refreshProfile])

  const value = useMemo<AuthContextValue>(() => {
    const user = state.user
    return {
      ...state,
      isAdmin: isAdminRole(user?.role),
      isSubscriber: isSubscriberRole(user?.role),
      hasPermission: (permission: Permission) => can(user, permission),
      hasActiveSubscription: hasActiveEntitlement(state.subscriptionStatus),
      refreshProfile,
      signOut,
      setDemoUser,
    }
  }, [state, refreshProfile, signOut, setDemoUser])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
