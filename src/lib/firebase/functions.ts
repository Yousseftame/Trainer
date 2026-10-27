import { getFunctions, type Functions } from "firebase/functions"
import { getFirebaseApp, tryGetFirebaseApp } from "@/lib/firebase/app"

let functions: Functions | null = null

/** Trusted server ops: claims, approvals, signed URLs, emails, device sessions. */
export function getFirebaseFunctions(): Functions {
  if (functions) return functions
  functions = getFunctions(getFirebaseApp())
  return functions
}

export function tryGetFirebaseFunctions(): Functions | null {
  if (functions) return functions
  const app = tryGetFirebaseApp()
  if (!app) return null
  functions = getFunctions(app)
  return functions
}
