import { getFirestore, type Firestore } from "firebase/firestore"
import { getFirebaseApp, tryGetFirebaseApp } from "@/lib/firebase/app"

let db: Firestore | null = null

export function getDb(): Firestore {
  if (db) return db
  db = getFirestore(getFirebaseApp())
  return db
}

export function tryGetDb(): Firestore | null {
  if (db) return db
  const app = tryGetFirebaseApp()
  if (!app) return null
  db = getFirestore(app)
  return db
}
