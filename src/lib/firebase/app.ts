import { initializeApp, getApps, type FirebaseApp } from "firebase/app"
import { env, isFirebaseConfigured } from "@/config/env"

let app: FirebaseApp | null = null

export function getFirebaseApp(): FirebaseApp {
  if (!isFirebaseConfigured()) {
    throw new Error(
      "Firebase is not configured. Copy .env.example to .env and set VITE_FIREBASE_* values.",
    )
  }

  if (app) return app

  const existing = getApps()[0]
  if (existing) {
    app = existing
    return app
  }

  const { firebase } = env
  app = initializeApp({
    apiKey: firebase.apiKey,
    authDomain: firebase.authDomain,
    projectId: firebase.projectId,
    storageBucket: firebase.storageBucket,
    messagingSenderId: firebase.messagingSenderId,
    appId: firebase.appId,
    measurementId: firebase.measurementId,
  })

  return app
}

export function tryGetFirebaseApp(): FirebaseApp | null {
  if (!isFirebaseConfigured()) return null
  try {
    return getFirebaseApp()
  } catch {
    return null
  }
}
