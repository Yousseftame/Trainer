import { collection, doc } from "firebase/firestore"
import { getDb } from "@/lib/firebase/firestore"

/**
 * Allocate a Firestore auto-id (same shape as subscriptions, e.g. `7f5jHdhjL5jVgWXOntRF`).
 * Does not write — only reserves a unique document id.
 */
export function allocateFirestoreId(collectionPath = "_id_pool"): string {
  return doc(collection(getDb(), collectionPath)).id
}
