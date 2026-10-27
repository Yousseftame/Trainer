import { getAuth, type Auth } from "firebase/auth"
import { getFirebaseApp, tryGetFirebaseApp } from "@/lib/firebase/app"

let auth: Auth | null = null

export function getFirebaseAuth(): Auth {
  if (auth) return auth
  auth = getAuth(getFirebaseApp())
  return auth
}

export function tryGetFirebaseAuth(): Auth | null {
  if (auth) return auth
  const app = tryGetFirebaseApp()
  if (!app) return null
  auth = getAuth(app)
  return auth
}
