import { purgeStoredPasswords } from "@/features/auth/credentials"
import { purgeLocalSessionArtifact } from "@/features/auth/session"

/**
 * Keys that must never hold secrets, roles, or identity that the UI could trust.
 * UI prefs (locale, sidebar collapse, announcement dismiss) are intentionally left alone.
 */
const LEGACY_LOCAL_KEYS = [
  "derpyfit_credentials_v1",
  "derpyfit_local_session_v1",
  "derpyfit_fcm_token",
  "derpyfit_subscribers_v1",
  "derpyfit_subscribers_cache",
  "derpyfit_registration_requests_v1",
  "derpyfit_nutrition_programs_v1",
  "derpyfit_nutrition_logs_v1",
  "derpyfit_workout_programs_v1",
  "derpyfit_workout_logs_v1",
  "derpyfit_packages_v1",
  "derpyfit_subscriptions_v1",
  "derpyfit_progress_measurements_v1",
  "derpyfit_progress_photos_v1",
  "derpyfit_progress_performance_v1",
  "derpyfit_physical_therapy_cache",
  "derpyfit_content_cache",
  "trainer_admin_content_v2",
] as const

/** Session keys that once held PII or must not be trusted for privilege. */
const LEGACY_SESSION_KEYS = ["trainer.auth.resetCooldown"] as const

function removeKey(storage: Storage, key: string) {
  try {
    storage.removeItem(key)
  } catch {
    // ignore
  }
}

/**
 * Run once at app boot. Clears leftover insecure artifacts so DevTools
 * Application storage cannot be used to impersonate auth or seed privileged data.
 *
 * Auth identity remains solely in Firebase Auth (IndexedDB managed by the SDK).
 * Roles/permissions come from verified ID token custom claims + server rules.
 */
export function purgeInsecureBrowserStorage(): void {
  if (typeof window === "undefined") return

  purgeStoredPasswords()
  purgeLocalSessionArtifact()

  for (const key of LEGACY_LOCAL_KEYS) {
    removeKey(window.localStorage, key)
  }

  // Reset-cooldown may be rewritten without email by ForgotPasswordPage;
  // wipe any legacy { email, until } blob left from older builds.
  for (const key of LEGACY_SESSION_KEYS) {
    try {
      const raw = window.sessionStorage.getItem(key)
      if (!raw) continue
      const parsed = JSON.parse(raw) as { email?: unknown; until?: unknown }
      if (parsed && "email" in parsed) {
        if (typeof parsed.until === "number" && parsed.until > Date.now()) {
          window.sessionStorage.setItem(
            key,
            JSON.stringify({ until: parsed.until }),
          )
        } else {
          removeKey(window.sessionStorage, key)
        }
      }
    } catch {
      removeKey(window.sessionStorage, key)
    }
  }
}
