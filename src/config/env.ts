import { z } from "zod"

const emptyToUndefined = z
  .string()
  .optional()
  .transform((value) => {
    const trimmed = value?.trim()
    return trimmed ? trimmed : undefined
  })

const envSchema = z.object({
  VITE_APP_NAME: z.string().optional().transform((v) => v?.trim() || "Derpy Fit"),
  VITE_SUPPORT_WHATSAPP: emptyToUndefined,
  VITE_DEFAULT_LOCALE: z
    .string()
    .optional()
    .transform((v) => (v === "en" ? "en" : "ar") as "en" | "ar"),
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
} as const
