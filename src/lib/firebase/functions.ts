import { functions } from "@/lib/firebase/firebase"
import type { Functions } from "firebase/functions"

/** Trusted server ops: claims, approvals, signed URLs, emails, device sessions. */
export function getFirebaseFunctions(): Functions {
  return functions
}

export function tryGetFirebaseFunctions(): Functions | null {
  return functions
}
