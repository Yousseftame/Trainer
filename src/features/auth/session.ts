import { getFirebaseAuth } from "@/lib/firebase/auth"

export type LocalSession = {
  uid: string
  email: string
  displayName?: string
}

const LOCAL_SESSION_KEY = "derpyfit_local_session_v1"

export function getLocalSession(): LocalSession | null {
  if (typeof window === "undefined" || !window.localStorage) return null
  try {
    const raw = window.localStorage.getItem(LOCAL_SESSION_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as LocalSession
    return parsed?.uid && parsed?.email ? parsed : null
  } catch {
    return null
  }
}

export function setLocalSession(session: LocalSession | null): void {
  if (typeof window === "undefined" || !window.localStorage) return
  try {
    if (!session) {
      window.localStorage.removeItem(LOCAL_SESSION_KEY)
    } else {
      window.localStorage.setItem(LOCAL_SESSION_KEY, JSON.stringify(session))
    }
  } catch {
    // Ignore quota errors
  }
}

/** The live Firebase Auth user if authenticated via Firebase */
export function getLiveFirebaseUser() {
  return getFirebaseAuth().currentUser
}

/** Returns true if there is an active Firebase Auth session OR a valid local session */
export function hasLiveFirebaseSession(): boolean {
  return Boolean(getLiveFirebaseUser()) || Boolean(getLocalSession())
}

/** Verifies session viability against Firebase token or local session validity */
export async function verifyLiveFirebaseSession(): Promise<boolean> {
  const current = getLiveFirebaseUser()
  if (current) {
    try {
      await current.getIdToken(true)
      return true
    } catch {
      return false
    }
  }
  return Boolean(getLocalSession())
}
