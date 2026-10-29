import type { User } from "firebase/auth"
import { PERMISSIONS } from "@/lib/permissions/permissions"
import type { AppUser } from "@/types/user"

function localeFromDocument(): AppUser["locale"] {
  if (typeof document === "undefined") return "en"
  return document.documentElement.lang === "ar" ? "ar" : "en"
}

/** For now every signed-in Firebase account is treated as a head coach. */
export function mapFirebaseUser(user: User): AppUser {
  const now = new Date().toISOString()
  const createdAt = user.metadata.creationTime
    ? new Date(user.metadata.creationTime).toISOString()
    : now
  const updatedAt = user.metadata.lastSignInTime
    ? new Date(user.metadata.lastSignInTime).toISOString()
    : now

  return {
    uid: user.uid,
    email: user.email ?? "",
    displayName: user.displayName?.trim() || user.email?.split("@")[0] || "Coach",
    photoURL: user.photoURL ?? undefined,
    role: "head_coach",
    permissions: [...PERMISSIONS],
    status: "active",
    locale: localeFromDocument(),
    createdAt,
    updatedAt,
  }
}
