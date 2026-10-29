import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react"
import { useQueryClient } from "@tanstack/react-query"
import {
  EmailAuthProvider,
  onIdTokenChanged,
  reauthenticateWithCredential,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  updatePassword,
  updateProfile,
} from "firebase/auth"
import { AuthContext, type AuthContextValue } from "@/features/auth/auth-context"
import { mapFirebaseUser } from "@/features/auth/map-user"
import { getLiveFirebaseUser, verifyLiveFirebaseSession } from "@/features/auth/session"
import { hasActiveEntitlement, type AuthState } from "@/features/auth/types"
import { getFirebaseAuth } from "@/lib/firebase/auth"
import { can } from "@/lib/permissions/can"
import { isAdminRole, isSubscriberRole } from "@/lib/permissions/roles"
import type { Permission } from "@/lib/permissions/permissions"

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
  const queryClient = useQueryClient()

  const refreshProfile = useCallback(async () => {
    const current = getFirebaseAuth().currentUser
    if (!current) return
    setState({
      status: "authenticated",
      user: mapFirebaseUser(current),
      subscriptionStatus: null,
      error: null,
    })
  }, [])

  const signIn = useCallback(async (email: string, password: string) => {
    await signInWithEmailAndPassword(getFirebaseAuth(), email.trim(), password)
  }, [])

  const signOut = useCallback(async () => {
    await firebaseSignOut(getFirebaseAuth())
    queryClient.clear()
    setState({
      status: "unauthenticated",
      user: null,
      subscriptionStatus: null,
      error: null,
    })
  }, [queryClient])

  const updateAccount = useCallback(async (patch: { displayName?: string; phone?: string }) => {
    const current = getFirebaseAuth().currentUser
    if (!current) throw new Error("auth/unauthenticated")

    if (patch.displayName != null) {
      await updateProfile(current, { displayName: patch.displayName })
    }

    setState((prev) => {
      if (!prev.user) return prev
      return {
        ...prev,
        user: {
          ...prev.user,
          displayName: patch.displayName ?? prev.user.displayName,
          phone: patch.phone?.trim() ? patch.phone.trim() : prev.user.phone,
          updatedAt: new Date().toISOString(),
        },
      }
    })
  }, [])

  const changePassword = useCallback(async (currentPassword: string, nextPassword: string) => {
    const current = getFirebaseAuth().currentUser
    const email = current?.email
    if (!current || !email) throw new Error("auth/unauthenticated")

    const credential = EmailAuthProvider.credential(email, currentPassword)
    await reauthenticateWithCredential(current, credential)
    await updatePassword(current, nextPassword)
  }, [])

  useEffect(() => {
    const auth = getFirebaseAuth()

    const unsubscribe = onIdTokenChanged(auth, (firebaseUser) => {
      if (!firebaseUser) {
        setState({
          status: "unauthenticated",
          user: null,
          subscriptionStatus: null,
          error: null,
        })
        return
      }

      setState({
        status: "authenticated",
        user: mapFirebaseUser(firebaseUser),
        subscriptionStatus: null,
        error: null,
      })
    })

    async function revalidate() {
      if (document.visibilityState !== "visible") return
      if (!auth.currentUser) return
      const ok = await verifyLiveFirebaseSession()
      if (!ok) {
        await firebaseSignOut(auth).catch(() => undefined)
        setState({
          status: "unauthenticated",
          user: null,
          subscriptionStatus: null,
          error: null,
        })
      }
    }

    document.addEventListener("visibilitychange", revalidate)
    window.addEventListener("focus", revalidate)

    return () => {
      unsubscribe()
      document.removeEventListener("visibilitychange", revalidate)
      window.removeEventListener("focus", revalidate)
    }
  }, [])

  const value = useMemo<AuthContextValue>(() => {
    const live = getLiveFirebaseUser()
    const user = live && state.user?.uid === live.uid ? state.user : null
    const status =
      state.status === "loading" || state.status === "idle"
        ? state.status
        : live && user
          ? "authenticated"
          : "unauthenticated"

    return {
      status,
      user,
      subscriptionStatus: user ? state.subscriptionStatus : null,
      error: state.error,
      isAdmin: isAdminRole(user?.role),
      isSubscriber: isSubscriberRole(user?.role),
      hasPermission: (permission: Permission) => can(user, permission),
      hasActiveSubscription: hasActiveEntitlement(user ? state.subscriptionStatus : null),
      refreshProfile,
      signIn,
      signOut,
      updateAccount,
      changePassword,
    }
  }, [state, refreshProfile, signIn, signOut, updateAccount, changePassword])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
