import {
  deleteToken,
  getMessaging,
  getToken,
  isSupported,
  onMessage,
  type Messaging,
  type Unsubscribe,
} from "firebase/messaging"
import { doc, setDoc, deleteDoc } from "firebase/firestore"
import { app, auth } from "@/lib/firebase/firebase"
import { getDb } from "@/lib/firebase/firestore"
import {
  callRegisterFcmToken,
  callUnregisterFcmToken,
} from "@/lib/firebase/callables"
import { claimNoticeAlert } from "@/features/notifications/dedupe"

const FCM_COLLECTION = "fcm_tokens"
const TOKEN_STORAGE_KEY = "derpyfit_fcm_token"

let messaging: Messaging | null = null
let foregroundUnsub: Unsubscribe | null = null
let registering: Promise<{
  ok: boolean
  token?: string
  reason?: string
}> | null = null

function vapidKey() {
  return (import.meta.env.VITE_FIREBASE_VAPID_KEY as string | undefined)?.trim()
}

async function getMessagingSafe(): Promise<Messaging | null> {
  if (typeof window === "undefined") return null
  const supported = await isSupported().catch(() => false)
  if (!supported) return null
  if (!messaging) messaging = getMessaging(app)
  return messaging
}

export function showBrowserNotification(input: {
  title: string
  body: string
  url?: string
  tag?: string
}) {
  if (typeof window === "undefined" || typeof Notification === "undefined") {
    return
  }
  if (Notification.permission !== "granted") return

  try {
    const notification = new Notification(input.title, {
      body: input.body,
      icon: "/favicon.svg",
      badge: "/favicon.svg",
      tag: input.tag || "derpyfit-ops",
      data: { url: input.url || "/admin/reports" },
    })
    notification.onclick = () => {
      window.focus()
      const target = input.url || "/admin/reports"
      if (window.location.pathname !== target) {
        window.location.assign(target)
      }
      notification.close()
    }
  } catch (err) {
    console.warn("[notifications] Notification display failed:", err)
  }
}

/**
 * Listen for FCM while the tab is open (foreground).
 * Background / closed-tab delivery is handled by firebase-messaging-sw.js.
 */
export async function startForegroundPushListener(
  onPush?: (payload: {
    title: string
    body: string
    noticeId?: string
  }) => void,
): Promise<() => void> {
  const msg = await getMessagingSafe()
  if (!msg) return () => undefined

  if (foregroundUnsub) {
    foregroundUnsub()
    foregroundUnsub = null
  }

  foregroundUnsub = onMessage(msg, (payload) => {
    const locale =
      typeof document !== "undefined" &&
      document.documentElement.lang?.startsWith("en")
        ? "en"
        : "ar"
    const title =
      payload.notification?.title ||
      (locale === "ar"
        ? payload.data?.title_ar || payload.data?.title
        : payload.data?.title_en || payload.data?.title) ||
      "Derpy Fit"
    const body =
      payload.notification?.body ||
      (locale === "ar"
        ? payload.data?.body_ar || payload.data?.body
        : payload.data?.body_en || payload.data?.body) ||
      "You have a new studio alert."
    const noticeId = payload.data?.noticeId
    const url = payload.data?.url || "/admin/reports"

    // Deduped against Firestore live alerts — only one OS notification wins.
    if (!claimNoticeAlert(noticeId)) return

    showBrowserNotification({
      title,
      body,
      url,
      tag: noticeId ? `notice-${noticeId}` : "derpyfit-ops",
    })
    onPush?.({ title, body, noticeId })
  })

  return () => {
    foregroundUnsub?.()
    foregroundUnsub = null
  }
}

/**
 * Register this browser for staff push alarms.
 * Safe to call multiple times — coalesces in-flight work.
 */
export async function registerPushNotifications(): Promise<{
  ok: boolean
  token?: string
  reason?: string
}> {
  if (registering) return registering

  registering = (async () => {
    const key = vapidKey()
    if (!key) return { ok: false, reason: "missing_vapid" }

    const uid = auth.currentUser?.uid
    if (!uid) return { ok: false, reason: "unauthenticated" }

    if (typeof Notification === "undefined") {
      return { ok: false, reason: "unsupported" }
    }

    const permission =
      Notification.permission === "granted"
        ? "granted"
        : await Notification.requestPermission()
    if (permission !== "granted") {
      return { ok: false, reason: "denied" }
    }

    const msg = await getMessagingSafe()
    if (!msg) return { ok: false, reason: "unsupported" }

    try {
      const registration = await navigator.serviceWorker.register(
        "/firebase-messaging-sw.js",
        { scope: "/" },
      )
      await navigator.serviceWorker.ready
      if (registration.installing) {
        await new Promise<void>((resolve) => {
          registration.installing?.addEventListener("statechange", () => {
            if (registration.installing?.state === "installed") resolve()
            if (registration.active) resolve()
          })
          // Don't hang forever
          setTimeout(() => resolve(), 4000)
        })
      }

      const token = await getToken(msg, {
        vapidKey: key,
        serviceWorkerRegistration: registration,
      })
      if (!token) return { ok: false, reason: "no_token" }

      await callRegisterFcmToken({ token, platform: "web" })

      await setDoc(
        doc(getDb(), FCM_COLLECTION, `${uid}_${token.slice(-12)}`),
        {
          uid,
          token,
          platform: "web",
          updatedAt: new Date().toISOString(),
          createdAt: new Date().toISOString(),
        },
        { merge: true },
      )

      try {
        window.localStorage.setItem(TOKEN_STORAGE_KEY, token)
      } catch {
        // ignore
      }

      return { ok: true, token }
    } catch (err) {
      console.warn("[notifications] FCM register failed:", err)
      return {
        ok: false,
        reason: err instanceof Error ? err.message : "register_failed",
      }
    } finally {
      registering = null
    }
  })()

  return registering
}

export async function unregisterPushNotifications(token?: string) {
  const uid = auth.currentUser?.uid
  let resolved = token
  if (!resolved) {
    try {
      resolved = window.localStorage.getItem(TOKEN_STORAGE_KEY) || undefined
    } catch {
      resolved = undefined
    }
  }

  const msg = await getMessagingSafe()
  if (msg) {
    try {
      await deleteToken(msg)
    } catch {
      // ignore
    }
  }
  if (resolved) {
    try {
      await callUnregisterFcmToken({ token: resolved })
    } catch {
      // ignore
    }
    if (uid) {
      try {
        await deleteDoc(
          doc(getDb(), FCM_COLLECTION, `${uid}_${resolved.slice(-12)}`),
        )
      } catch {
        // ignore
      }
    }
  }
  try {
    window.localStorage.removeItem(TOKEN_STORAGE_KEY)
  } catch {
    // ignore
  }
}
