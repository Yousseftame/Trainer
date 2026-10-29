import { getFirebaseAuth } from "@/lib/firebase/auth"

/** The only source of truth: a live Firebase Auth user, not React state. */
export function getLiveFirebaseUser() {
  return getFirebaseAuth().currentUser
}

export function hasLiveFirebaseSession() {
  return Boolean(getLiveFirebaseUser())
}

/** Talks to Google. A forged local object cannot pass this. */
export async function verifyLiveFirebaseSession(): Promise<boolean> {
  const current = getLiveFirebaseUser()
  if (!current) return false
  try {
    await current.getIdToken(true)
    return true
  } catch {
    return false
  }
}
