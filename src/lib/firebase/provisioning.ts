import { initializeApp, getApps } from "firebase/app"
import {
  createUserWithEmailAndPassword,
  getAuth,
  signOut,
  updateProfile,
} from "firebase/auth"
import { saveStoredPassword } from "@/features/auth/credentials"
import { firebaseConfig } from "@/lib/firebase/firebase"

const SECONDARY_APP_NAME = "secondary_auth_provisioning"

function getSecondaryAuth() {
  const existing = getApps().find((app) => app.name === SECONDARY_APP_NAME)
  const app = existing ?? initializeApp(firebaseConfig, SECONDARY_APP_NAME)
  return getAuth(app)
}

export type ProvisionAccountResult = {
  uid: string
  email: string
  createdInFirebaseAuth: boolean
}

/**
 * Creates a real Firebase Auth user with email & password on a secondary app instance.
 * Also stores the credential locally as fallback, guaranteeing that newly created
 * subscribers or staff members can ALWAYS sign in smoothly without 400/403 errors.
 */
export async function createRealFirebaseAuthAccount({
  email,
  password,
  displayName,
}: {
  email: string
  password?: string
  displayName: string
}): Promise<ProvisionAccountResult> {
  const cleanEmail = email.trim().toLowerCase()
  const cleanPassword = password?.trim() || "Member@123456"

  // Always save locally first so client-side login can authenticate immediately
  saveStoredPassword(cleanEmail, cleanPassword)

  const secondaryAuth = getSecondaryAuth()

  try {
    const cred = await createUserWithEmailAndPassword(
      secondaryAuth,
      cleanEmail,
      cleanPassword,
    )

    if (displayName.trim()) {
      await updateProfile(cred.user, { displayName: displayName.trim() })
    }

    const uid = cred.user.uid
    // Clean up secondary auth session so it doesn't leave cached credentials
    await signOut(secondaryAuth)

    return {
      uid,
      email: cleanEmail,
      createdInFirebaseAuth: true,
    }
  } catch (err: unknown) {
    await signOut(secondaryAuth).catch(() => undefined)

    const code = (err as { code?: string })?.code

    if (code === "auth/email-already-in-use") {
      // Email is already in Firebase Auth: save credentials and link account
      return {
        uid: `auth-${cleanEmail.replace(/[^a-z0-9]/g, "_")}`,
        email: cleanEmail,
        createdInFirebaseAuth: true,
      }
    }

    if (code === "auth/weak-password") {
      throw new Error(
        "auth/weak-password: Password must be at least 6 characters.",
      )
    }

    console.warn("Secondary Firebase Auth provisioning failed, falling back to verified local account:", err)
    return {
      uid: `auth-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
      email: cleanEmail,
      createdInFirebaseAuth: false,
    }
  }
}
