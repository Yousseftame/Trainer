import type { FirebaseApp } from "firebase/app"
import { app } from "@/lib/firebase/firebase"

export function getFirebaseApp(): FirebaseApp {
  return app
}

export function tryGetFirebaseApp(): FirebaseApp | null {
  return app
}
