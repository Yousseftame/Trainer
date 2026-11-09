/* eslint-disable no-undef */
// Keep config in sync with src/lib/firebase/firebase.ts
importScripts("https://www.gstatic.com/firebasejs/11.6.0/firebase-app-compat.js")
importScripts(
  "https://www.gstatic.com/firebasejs/11.6.0/firebase-messaging-compat.js",
)

firebase.initializeApp({
  apiKey: "AIzaSyCr2NgItL0cbP0SBvL7dj_VMeWL-Sf_fDw",
  authDomain: "trainer-d4699.firebaseapp.com",
  projectId: "trainer-d4699",
  storageBucket: "trainer-d4699.firebasestorage.app",
  messagingSenderId: "1057986533056",
  appId: "1:1057986533056:web:b109cb356f4ce79a56bf25",
})

const messaging = firebase.messaging()

messaging.onBackgroundMessage((payload) => {
  // Prefer Arabic when the browser language is ar-*; otherwise English.
  const preferAr =
    typeof self.navigator !== "undefined" &&
    String(self.navigator.language || "")
      .toLowerCase()
      .startsWith("ar")
  const title =
    payload.notification?.title ||
    (preferAr
      ? payload.data?.title_ar || payload.data?.title
      : payload.data?.title_en || payload.data?.title) ||
    "Derpy Fit"
  const body =
    payload.notification?.body ||
    (preferAr
      ? payload.data?.body_ar || payload.data?.body
      : payload.data?.body_en || payload.data?.body) ||
    "You have a new studio alert."
  const noticeId = payload.data?.noticeId
  const url = payload.data?.url || "/admin/reports"

  return self.registration.showNotification(title, {
    body,
    icon: "/favicon.svg",
    badge: "/favicon.svg",
    tag: noticeId ? `notice-${noticeId}` : "derpyfit-ops",
    renotify: false,
    data: { url, noticeId: noticeId || "" },
  })
})

self.addEventListener("notificationclick", (event) => {
  event.notification.close()
  const target = event.notification?.data?.url || "/admin/reports"
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then(
      (clientList) => {
        for (const client of clientList) {
          if ("focus" in client) {
            client.focus()
            if ("navigate" in client) {
              return client.navigate(target)
            }
            return undefined
          }
        }
        if (self.clients.openWindow) {
          return self.clients.openWindow(target)
        }
        return undefined
      },
    ),
  )
})
