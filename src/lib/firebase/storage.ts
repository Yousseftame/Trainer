import { getStorage, type FirebaseStorage } from "firebase/storage"
import { getFirebaseApp, tryGetFirebaseApp } from "@/lib/firebase/app"

let storage: FirebaseStorage | null = null

/**
 * Use for PDFs, documents, and progress photos.
 * Do not use as the primary store for the large video library.
 */
export function getFirebaseStorage(): FirebaseStorage {
  if (storage) return storage
  storage = getStorage(getFirebaseApp())
  return storage
}

export function tryGetFirebaseStorage(): FirebaseStorage | null {
  if (storage) return storage
  const app = tryGetFirebaseApp()
  if (!app) return null
  storage = getStorage(app)
  return storage
}
