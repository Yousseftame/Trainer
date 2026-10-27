import { z } from "zod"

const emptyToUndefined = z
  .string()
  .optional()
  .transform((value) => {
    const trimmed = value?.trim()
    return trimmed ? trimmed : undefined
  })

const envSchema = z.object({
  VITE_FIREBASE_API_KEY: emptyToUndefined,
  VITE_FIREBASE_AUTH_DOMAIN: emptyToUndefined,
  VITE_FIREBASE_PROJECT_ID: emptyToUndefined,
  VITE_FIREBASE_STORAGE_BUCKET: emptyToUndefined,
  VITE_FIREBASE_MESSAGING_SENDER_ID: emptyToUndefined,
  VITE_FIREBASE_APP_ID: emptyToUndefined,
  VITE_FIREBASE_MEASUREMENT_ID: emptyToUndefined,
  VITE_APP_NAME: z.string().optional().transform((v) => v?.trim() || "Trainer"),
  VITE_SUPPORT_WHATSAPP: emptyToUndefined,
  VITE_DEFAULT_LOCALE: z
    .string()
    .optional()
    .transform((v) => (v === "ar" ? "ar" : "en") as "en" | "ar"),
})

const parsed = envSchema.safeParse(import.meta.env)

if (!parsed.success) {
  console.error("Invalid environment configuration", parsed.error.flatten().fieldErrors)
  throw new Error("Invalid environment configuration")
}

export const env = {
  appName: parsed.data.VITE_APP_NAME,
  supportWhatsApp: parsed.data.VITE_SUPPORT_WHATSAPP,
  defaultLocale: parsed.data.VITE_DEFAULT_LOCALE,
  firebase: {
    apiKey: parsed.data.VITE_FIREBASE_API_KEY,
    authDomain: parsed.data.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: parsed.data.VITE_FIREBASE_PROJECT_ID,
    storageBucket: parsed.data.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: parsed.data.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: parsed.data.VITE_FIREBASE_APP_ID,
    measurementId: parsed.data.VITE_FIREBASE_MEASUREMENT_ID,
  },
} as const

export function isFirebaseConfigured(): boolean {
  const { apiKey, authDomain, projectId, appId } = env.firebase
  return Boolean(apiKey && authDomain && projectId && appId)
}
