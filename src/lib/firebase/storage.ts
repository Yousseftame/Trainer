import { storage } from "@/lib/firebase/firebase"
import type { FirebaseStorage } from "firebase/storage"

/**
 * Use for PDFs, documents, and progress photos.
 * Do not use as the primary store for the large video library.
 */
export function getFirebaseStorage(): FirebaseStorage {
  return storage
}

export function tryGetFirebaseStorage(): FirebaseStorage | null {
  return storage
}
