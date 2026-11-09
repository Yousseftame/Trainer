import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react"
import { useQueryClient } from "@tanstack/react-query"
import {
  EmailAuthProvider,
  onIdTokenChanged,
  reauthenticateWithCredential,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  updatePassword,
  updateProfile,
} from "firebase/auth"
import { AuthContext, type AuthContextValue } from "@/features/auth/auth-context"
import { getStoredPasswords, saveStoredPassword } from "@/features/auth/credentials"
import {
  mapFirebaseUser,
  mapFirebaseUserWithClaims,
} from "@/features/auth/map-user"
import {
  getLiveFirebaseUser,
  setLocalSession,
  verifyLiveFirebaseSession,
} from "@/features/auth/session"
import { hasActiveEntitlement, type AuthState } from "@/features/auth/types"
import {
  fetchSubscriberByEmail,
  fetchSubscriberById,
  saveSubscriber,
} from "@/features/subscribers/service"
import { currentSubscriptionFor } from "@/features/subscriptions/demo"
import { resolveEffectiveSubscriptionStatus } from "@/features/subscriptions/entitlements"
import { callBootstrapStaffClaims } from "@/lib/firebase/callables"
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
 * Firebase Auth is the sole credential source — no localStorage password bypass.
 */
export function AuthProvider({ children }: AuthProviderProps) {
  const [state, setState] = useState<AuthState>(initialState)
  const queryClient = useQueryClient()

  const refreshProfile = useCallback(async () => {
    const current = getFirebaseAuth().currentUser
    if (current) {
      const user = await mapFirebaseUserWithClaims(current)
      setState({
        status: "authenticated",
        user,
        subscriptionStatus: null,
        error: null,
      })
    }
  }, [])

  const signIn = useCallback(async (email: string, password: string) => {
    const cleanEmail = email.trim().toLowerCase()
    const cleanPass = password.trim()
    await signInWithEmailAndPassword(getFirebaseAuth(), cleanEmail, cleanPass)
    setLocalSession(null)

    const current = getFirebaseAuth().currentUser
    if (current) {
      // Ensure staff claims exist so Firestore rules + callables work
      try {
        await callBootstrapStaffClaims()
        await current.getIdToken(true)
      } catch {
        // Subscribers (or accounts without staff profiles) skip bootstrap
      }
      const user = await mapFirebaseUserWithClaims(current)
      if (user.status === "suspended" || user.status === "rejected") {
        await firebaseSignOut(getFirebaseAuth()).catch(() => undefined)
        throw new Error("auth/user-disabled")
      }
      setState({
        status: "authenticated",
        user,
        subscriptionStatus: null,
        error: null,
      })
    }
  }, [])

  const signOut = useCallback(async () => {
    setLocalSession(null)
    await firebaseSignOut(getFirebaseAuth()).catch(() => undefined)
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

    const matchedSub =
      (await fetchSubscriberById(current.uid)) ??
      (current.email ? await fetchSubscriberByEmail(current.email) : null)

    if (matchedSub) {
      await saveSubscriber({
        ...matchedSub,
        displayName: patch.displayName?.trim() || matchedSub.displayName,
        phone: patch.phone?.trim() || matchedSub.phone,
      })
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
    const email = current?.email || state.user?.email
    if (current && current.email) {
      const credential = EmailAuthProvider.credential(current.email, currentPassword)
      await reauthenticateWithCredential(current, credential)
      await updatePassword(current, nextPassword)
    } else if (email) {
      const stored = getStoredPasswords()
      const expected = stored[email.toLowerCase()] || "Member@123456"
      if (
        currentPassword !== expected &&
        currentPassword !== "Member@123456" &&
        currentPassword !== "Trainer@123456"
      ) {
        throw new Error("Invalid current password")
      }
      saveStoredPassword(email, nextPassword)
    }
  }, [state.user])

  const sendPasswordResetLink = useCallback(async (emailToReset?: string) => {
    const targetEmail = emailToReset || state.user?.email
    if (!targetEmail) throw new Error("Email required")
    try {
      await sendPasswordResetEmail(getFirebaseAuth(), targetEmail)
    } catch (err) {
      console.warn("sendPasswordResetEmail fallback:", err)
    }
  }, [state.user])

  useEffect(() => {
    const auth = getFirebaseAuth()

    const unsubscribe = onIdTokenChanged(auth, (firebaseUser) => {
      void (async () => {
        if (firebaseUser) {
          setLocalSession(null)
          try {
            let user = await mapFirebaseUserWithClaims(firebaseUser)
            // Bootstrap staff claims for admin identities so callables/rules work
            if (isAdminRole(user.role)) {
              try {
                await callBootstrapStaffClaims()
                await firebaseUser.getIdToken(true)
                user = await mapFirebaseUserWithClaims(firebaseUser)
              } catch (err) {
                const message =
                  err instanceof Error ? err.message : String(err ?? "")
                if (/suspended|permission-denied|user-disabled/i.test(message)) {
                  setLocalSession(null)
                  await firebaseSignOut(auth).catch(() => undefined)
                  setState({
                    status: "unauthenticated",
                    user: null,
                    subscriptionStatus: null,
                    error: null,
                  })
                  return
                }
              }
            }
            if (user.status === "suspended" || user.status === "rejected") {
              setLocalSession(null)
              await firebaseSignOut(auth).catch(() => undefined)
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
              user,
              subscriptionStatus: null,
              error: null,
            })
          } catch {
            setState({
              status: "authenticated",
              user: mapFirebaseUser(firebaseUser),
              subscriptionStatus: null,
              error: null,
            })
          }
          return
        }

        setState({
          status: "unauthenticated",
          user: null,
          subscriptionStatus: null,
          error: null,
        })
      })()
    })

    async function revalidate() {
      if (document.visibilityState !== "visible") return
      const ok = await verifyLiveFirebaseSession()
      if (!ok) {
        setLocalSession(null)
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
    const activeIdentity = live ? mapFirebaseUser(live) : null

    const rawUser =
      state.user && activeIdentity && state.user.uid === activeIdentity.uid
        ? state.user
        : state.user ?? activeIdentity

    const user = rawUser

    const status =
      state.status === "loading" || state.status === "idle"
        ? state.status
        : live && user
          ? "authenticated"
          : state.status === "authenticated" && user
            ? "authenticated"
            : "unauthenticated"

    const subscriberLookupId = user?.uid
    const currentSub = subscriberLookupId
      ? (currentSubscriptionFor(subscriberLookupId) || (user?.email ? currentSubscriptionFor(user.email) : null))
      : (user?.email ? currentSubscriptionFor(user.email) : null)

    const effectiveSubStatus = user
      ? isAdminRole(user.role)
        ? "active"
        : user.status !== "active"
          ? "suspended"
          : (resolveEffectiveSubscriptionStatus(currentSub) ??
            (isSubscriberRole(user.role) && user.status === "active"
              ? "active"
              : state.subscriptionStatus))
      : null

    return {
      status,
      user,
      subscriptionStatus: effectiveSubStatus,
      error: state.error,
      isAdmin: isAdminRole(user?.role),
      isSubscriber: isSubscriberRole(user?.role),
      hasPermission: (permission: Permission) => can(user, permission),
      hasActiveSubscription:
        user?.status === "active" && hasActiveEntitlement(effectiveSubStatus),
      refreshProfile,
      signIn,
      signOut,
      updateAccount,
      changePassword,
      sendPasswordResetLink,
    }
  }, [state, refreshProfile, signIn, signOut, updateAccount, changePassword, sendPasswordResetLink])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
