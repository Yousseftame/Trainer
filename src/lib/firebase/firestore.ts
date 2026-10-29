import { db } from "@/lib/firebase/firebase"
import type { Firestore } from "firebase/firestore"

export function getDb(): Firestore {
  return db
}

export function tryGetDb(): Firestore | null {
  return db
}
