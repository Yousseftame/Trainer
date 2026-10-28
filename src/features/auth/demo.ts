import { PERMISSIONS } from "@/lib/permissions/permissions"
import type { SubscriptionStatus } from "@/types/subscription"
import type { AppUser } from "@/types/user"

export const DEMO_SESSION_KEY = "trainer.demo.session"

export type DemoSession = {
  user: AppUser
  subscriptionStatus: SubscriptionStatus | null
}

function stamp(partial: Omit<AppUser, "createdAt" | "updatedAt">): AppUser {
  const now = new Date().toISOString()
  return { ...partial, createdAt: now, updatedAt: now }
}

export function createDemoAdmin(email: string): AppUser {
  return stamp({
    uid: "demo-admin",
    email,
    displayName: "Head Coach",
    role: "head_coach",
    permissions: [...PERMISSIONS],
    status: "active",
    locale: "en",
  })
}

export function createDemoSubscriber(email: string): AppUser {
  return stamp({
    uid: "demo-subscriber",
    email,
    displayName: "Alex Subscriber",
    role: "subscriber",
    permissions: [],
    status: "active",
    locale: "en",
  })
}

/** Any password works. Emails containing "admin" open the Admin dashboard. */
export function resolveDemoLogin(email: string): DemoSession {
  const normalized = email.trim().toLowerCase()
  if (normalized.includes("admin")) {
    return {
      user: createDemoAdmin(email.trim()),
      subscriptionStatus: null,
    }
  }
  return {
    user: createDemoSubscriber(email.trim()),
    subscriptionStatus: "active",
  }
}

export function readDemoSession(): DemoSession | null {
  try {
    const raw = window.sessionStorage.getItem(DEMO_SESSION_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as DemoSession
    if (!parsed?.user?.uid || !parsed.user.role) return null
    return parsed
  } catch {
    return null
  }
}

export function writeDemoSession(session: DemoSession | null): void {
  try {
    if (!session) {
      window.sessionStorage.removeItem(DEMO_SESSION_KEY)
      return
    }
    window.sessionStorage.setItem(DEMO_SESSION_KEY, JSON.stringify(session))
  } catch {
    // Ignore quota / private mode failures — in-memory auth still works.
  }
}
