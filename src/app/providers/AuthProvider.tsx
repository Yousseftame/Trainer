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
import {
  mapFirebaseUser,
  mapFirebaseUserWithClaims,
} from "@/features/auth/map-user"
import { purgeInsecureBrowserStorage } from "@/features/auth/purge-insecure-storage"
import {
  getLiveFirebaseUser,
  verifyLiveFirebaseSession,
} from "@/features/auth/session"
import { hasActiveEntitlement, type AuthState } from "@/features/auth/types"
import { unregisterPushNotifications } from "@/features/notifications"
import { updateMySubscriberProfile } from "@/features/subscribers/service"
import { useSubscriberSubscriptionsQuery } from "@/features/subscriptions/hooks"
import {
  pickCurrentSubscription,
  resolveEffectiveSubscriptionStatus,
} from "@/features/subscriptions/entitlements"
import type { SubscriberSubscription } from "@/types/subscription"
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

    const current = getFirebaseAuth().currentUser
    if (!current) {
      throw new Error("auth/invalid-credential")
    }

    // Staff claims are best-effort here — never fail a valid password login
    // because bootstrap / token refresh briefly hiccuped.
    try {
      await callBootstrapStaffClaims()
      await current.getIdToken(true)
    } catch {
      // Subscribers, or transient callable/network errors — continue.
    }

    let user
    try {
      user = await mapFirebaseUserWithClaims(current, true)
    } catch {
      user = mapFirebaseUser(current)
    }

    if (user.status === "suspended" || user.status === "rejected") {
      await firebaseSignOut(getFirebaseAuth()).catch(() => undefined)
      const err = new Error("auth/user-disabled") as Error & { code?: string }
      err.code = "auth/user-disabled"
      throw err
    }

    setState({
      status: "authenticated",
      user,
      subscriptionStatus: null,
      error: null,
    })
  }, [])

  const signOut = useCallback(async () => {
    // Mark unauthenticated immediately so login/guards do not bounce
    // against a stale "authenticated" React state after Firebase clears.
    setState({
      status: "unauthenticated",
      user: null,
      subscriptionStatus: null,
      error: null,
    })
    await unregisterPushNotifications().catch(() => undefined)
    await firebaseSignOut(getFirebaseAuth()).catch(() => undefined)
    purgeInsecureBrowserStorage()
    queryClient.clear()
  }, [queryClient])

  const updateAccount = useCallback(async (patch: { displayName?: string; phone?: string }) => {
    const current = getFirebaseAuth().currentUser
    if (!current) throw new Error("auth/unauthenticated")

    if (patch.displayName != null) {
      await updateProfile(current, { displayName: patch.displayName })
    }

    // Subscribers persist soft-profile fields via secured callable only.
    // Staff account settings stay Auth-side (staff docs are CF-managed).
    if (isSubscriberRole(state.user?.role)) {
      await updateMySubscriberProfile({
        displayName: patch.displayName?.trim(),
        phone: patch.phone,
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
  }, [state.user?.role])

  const changePassword = useCallback(async (currentPassword: string, nextPassword: string) => {
    const current = getFirebaseAuth().currentUser
    if (!current?.email) {
      throw new Error("auth/unauthenticated")
    }
    if (!currentPassword || nextPassword.trim().length < 6) {
      throw new Error("auth/weak-password")
    }
    const credential = EmailAuthProvider.credential(current.email, currentPassword)
    await reauthenticateWithCredential(current, credential)
    await updatePassword(current, nextPassword.trim())
  }, [])

  const sendPasswordResetLink = useCallback(async (emailToReset?: string) => {
    const targetEmail = emailToReset || state.user?.email
    if (!targetEmail) throw new Error("Email required")
    await sendPasswordResetEmail(getFirebaseAuth(), targetEmail)
  }, [state.user])

  useEffect(() => {
    // Wipe legacy secrets / forged session keys before any guard runs.
    purgeInsecureBrowserStorage()

    const auth = getFirebaseAuth()
    let cancelled = false
    let tokenListenerGen = 0
    /** One background staff-claims sync per uid per page session. */
    let staffClaimsSyncedForUid: string | null = null
    let staffBootstrapInFlight = false

    const unsubscribe = onIdTokenChanged(auth, (firebaseUser) => {
      const gen = ++tokenListenerGen
      void (async () => {
        if (firebaseUser) {
          try {
            // Cached token only — forced refresh here re-fires this listener and
            // kept the admin shell on FullPageSpinner for tens of seconds.
            const user = await mapFirebaseUserWithClaims(firebaseUser, false)
            if (cancelled || gen !== tokenListenerGen) return

            if (user.status === "suspended" || user.status === "rejected") {
              await firebaseSignOut(auth).catch(() => undefined)
              setState({
                status: "unauthenticated",
                user: null,
                subscriptionStatus: null,
                error: null,
              })
              return
            }

            // Unblock RequireAuth / admin panel immediately.
            setState({
              status: "authenticated",
              user,
              subscriptionStatus: null,
              error: null,
            })

            // Soft-sync staff claims in the background (never blocks the spinner).
            // Never sign out on permission-denied / network — that kicked staff
            // back to login during normal token refreshes.
            if (
              isAdminRole(user.role) &&
              staffClaimsSyncedForUid !== firebaseUser.uid &&
              !staffBootstrapInFlight
            ) {
              staffBootstrapInFlight = true
              void (async () => {
                try {
                  await callBootstrapStaffClaims()
                  if (cancelled) return
                  await firebaseUser.getIdToken(true)
                  // Fresh token re-enters this listener and remaps claims.
                } catch (err) {
                  const message =
                    err instanceof Error ? err.message : String(err ?? "")
                  if (
                    /user-disabled|status.*suspended|account.*suspended/i.test(
                      message,
                    )
                  ) {
                    if (cancelled) return
                    await firebaseSignOut(auth).catch(() => undefined)
                    setState({
                      status: "unauthenticated",
                      user: null,
                      subscriptionStatus: null,
                      error: null,
                    })
                    return
                  }
                } finally {
                  staffClaimsSyncedForUid = firebaseUser.uid
                  staffBootstrapInFlight = false
                }
              })()
            }
          } catch {
            if (cancelled || gen !== tokenListenerGen) return
            // Claims refresh failed — keep the Firebase session with basic identity.
            setState({
              status: "authenticated",
              user: mapFirebaseUser(firebaseUser),
              subscriptionStatus: null,
              error: null,
            })
          }
          return
        }

        if (cancelled || gen !== tokenListenerGen) return
        staffClaimsSyncedForUid = null
        staffBootstrapInFlight = false
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
      // Soft check only — transient network errors must NOT sign the user out.
      const ok = await verifyLiveFirebaseSession()
      if (!ok && !getLiveFirebaseUser()) {
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
      cancelled = true
      unsubscribe()
      document.removeEventListener("visibilitychange", revalidate)
      window.removeEventListener("focus", revalidate)
    }
  }, [])

  const provisionalUser =
    state.user ??
    (getLiveFirebaseUser() ? mapFirebaseUser(getLiveFirebaseUser()!) : null)
  const liveSubscriptionsQuery = useSubscriberSubscriptionsQuery(
    provisionalUser && isSubscriberRole(provisionalUser.role)
      ? provisionalUser.uid
      : undefined,
  )

  const value = useMemo<AuthContextValue>(() => {
    const live = getLiveFirebaseUser()
    const activeIdentity = live ? mapFirebaseUser(live) : null

    const rawUser =
      state.user && activeIdentity && state.user.uid === activeIdentity.uid
        ? state.user
        : state.user ?? activeIdentity

    // Never expose an authenticated identity without a live Firebase session.
    // Stale state.user after signOut caused login ↔ panel redirect flicker.
    const user = live ? rawUser : null

    const status =
      state.status === "loading" || state.status === "idle"
        ? state.status
        : live && user
          ? "authenticated"
          : "unauthenticated"

    const liveSubs = (liveSubscriptionsQuery.data ?? []) as SubscriberSubscription[]
    const currentSub = pickCurrentSubscription(liveSubs)
    const resolvedFromSub = resolveEffectiveSubscriptionStatus(currentSub)
    const subscriptionLoading =
      Boolean(user) &&
      isSubscriberRole(user?.role) &&
      liveSubscriptionsQuery.isPending &&
      !liveSubscriptionsQuery.isFetched

    const effectiveSubStatus = user
      ? isAdminRole(user.role)
        ? "active"
        : user.status !== "active"
          ? "suspended"
          : resolvedFromSub ??
            // Keep last-known status while loading — never invent "active".
            (subscriptionLoading ? state.subscriptionStatus : null)
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
      subscriptionLoading,
      refreshProfile,
      signIn,
      signOut,
      updateAccount,
      changePassword,
      sendPasswordResetLink,
    }
  }, [
    state,
    liveSubscriptionsQuery.data,
    liveSubscriptionsQuery.isPending,
    liveSubscriptionsQuery.isFetched,
    refreshProfile,
    signIn,
    signOut,
    updateAccount,
    changePassword,
    sendPasswordResetLink,
  ])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
