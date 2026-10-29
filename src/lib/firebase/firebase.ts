import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app"
import { getAnalytics, isSupported, type Analytics } from "firebase/analytics"
import {
  getAuth,
  setPersistence,
  browserLocalPersistence,
  type Auth,
} from "firebase/auth"
import { getFirestore, type Firestore } from "firebase/firestore"
import { getStorage, type FirebaseStorage } from "firebase/storage"
import { getFunctions, type Functions } from "firebase/functions"

const firebaseConfig = {
  apiKey: "AIzaSyCr2NgItL0cbP0SBvL7dj_VMeWL-Sf_fDw",
  authDomain: "trainer-d4699.firebaseapp.com",
  projectId: "trainer-d4699",
  storageBucket: "trainer-d4699.firebasestorage.app",
  messagingSenderId: "1057986533056",
  appId: "1:1057986533056:web:b109cb356f4ce79a56bf25",
  measurementId: "G-EYC0P0HQN6",
}

export const app: FirebaseApp = getApps().length ? getApp() : initializeApp(firebaseConfig)

export const auth: Auth = getAuth(app)

void setPersistence(auth, browserLocalPersistence)
export const db: Firestore = getFirestore(app)
export const storage: FirebaseStorage = getStorage(app)
export const functions: Functions = getFunctions(app)

export let analytics: Analytics | null = null

if (typeof window !== "undefined") {
  void isSupported()
    .then((supported) => {
      if (supported) analytics = getAnalytics(app)
    })
    .catch(() => {
      analytics = null
    })
}

export default app
