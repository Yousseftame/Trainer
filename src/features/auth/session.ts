import { getFirebaseAuth } from "@/lib/firebase/auth"

/** Legacy key — must never be treated as an auth session. */
const LOCAL_SESSION_KEY = "derpyfit_local_session_v1"

/** Removes forged / leftover local "session" objects from older builds. */
export function purgeLocalSessionArtifact(): void {
  if (typeof window === "undefined" || !window.localStorage) return
  try {
    window.localStorage.removeItem(LOCAL_SESSION_KEY)
  } catch {
    // ignore
  }
}

/** The live Firebase Auth user if authenticated via Firebase. */
export function getLiveFirebaseUser() {
  return getFirebaseAuth().currentUser
}

/**
 * True only when Firebase Auth has a current user.
 * Browser storage alone can never satisfy this check.
 */
export function hasLiveFirebaseSession(): boolean {
  return Boolean(getLiveFirebaseUser())
}

function isFatalAuthError(error: unknown): boolean {
  const code =
    typeof error === "object" && error && "code" in error
      ? String((error as { code: unknown }).code)
      : error instanceof Error
        ? error.message
        : String(error ?? "")

  return /auth\/user-token-expired|auth\/user-disabled|auth\/invalid-user-token|auth\/user-not-found|auth\/id-token-revoked/i.test(
    code,
  )
}

/**
 * Soft session check for tab focus / visibility.
 * - No user → invalid
 * - Cached token OK → valid
 * - Network / transient refresh failures → still valid (do NOT kick the user)
 * - Fatal auth errors (revoked / disabled) → invalid
 */
export async function verifyLiveFirebaseSession(): Promise<boolean> {
  const current = getLiveFirebaseUser()
  if (!current) return false

  try {
    // Prefer cached token — avoids a network round-trip on every Alt-Tab.
    await current.getIdToken(false)
    return true
  } catch (error) {
    if (isFatalAuthError(error)) return false

    // Transient failure (offline, timeout). Keep the session; Firebase will
    // refresh on the next real API call / onIdTokenChanged.
    try {
      return Boolean(getLiveFirebaseUser())
    } catch {
      return false
    }
  }
}
