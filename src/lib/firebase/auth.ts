import { auth } from "@/lib/firebase/firebase"
import type { Auth } from "firebase/auth"

export function getFirebaseAuth(): Auth {
  return auth
}

export function tryGetFirebaseAuth(): Auth | null {
  return auth
}
