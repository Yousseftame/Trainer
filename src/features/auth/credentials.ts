/**
 * Legacy plaintext password cache — NEVER write here again.
 * Kept only to wipe any leftover DevTools-visible secrets from older builds.
 */
const CREDENTIALS_KEY = "derpyfit_credentials_v1"

/** Removes any historically stored email→password map from localStorage. */
export function purgeStoredPasswords(): void {
  if (typeof window === "undefined" || !window.localStorage) return
  try {
    window.localStorage.removeItem(CREDENTIALS_KEY)
  } catch {
    // ignore quota / private mode
  }
}
