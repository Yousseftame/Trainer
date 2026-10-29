export function firebaseAuthErrorKey(error: unknown): string {
  const code =
    typeof error === "object" && error && "code" in error
      ? String((error as { code: unknown }).code)
      : ""

  switch (code) {
    case "auth/invalid-email":
      return "auth.errors.invalidEmail"
    case "auth/user-disabled":
      return "auth.errors.userDisabled"
    case "auth/user-not-found":
    case "auth/wrong-password":
    case "auth/invalid-credential":
    case "auth/invalid-login-credentials":
    case "auth/missing-password":
      return "auth.errors.invalidCredential"
    case "auth/too-many-requests":
      return "auth.errors.tooManyRequests"
    case "auth/network-request-failed":
      return "auth.errors.network"
    case "auth/requires-recent-login":
      return "auth.errors.requiresRecentLogin"
    case "auth/weak-password":
      return "auth.errors.weakPassword"
    case "auth/unauthorized-domain":
      return "auth.errors.unauthorizedDomain"
    case "auth/operation-not-allowed":
      return "auth.errors.operationNotAllowed"
    case "auth/unauthorized-continue-uri":
    case "auth/invalid-continue-uri":
    case "auth/missing-continue-uri":
      return "auth.errors.unauthorizedDomain"
    default:
      return "auth.errors.generic"
  }
}
