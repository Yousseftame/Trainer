import { BRAND_LOGO_ON_LIGHT } from "@/components/shared/BrandLogo"
import { APP_ROUTES } from "@/config/constants"
import { buildWhatsAppHref } from "@/lib/whatsapp"

export type ShareCredentialsPayload = {
  subscriberId?: string
  displayName: string
  email: string
  phone: string
  password: string
  locale?: "en" | "ar"
}

export function getPublicLoginUrl(): string {
  if (typeof window === "undefined") return APP_ROUTES.public.login
  return `${window.location.origin}${APP_ROUTES.public.login}`
}

export function getPublicLogoUrl(): string {
  if (typeof window === "undefined") return BRAND_LOGO_ON_LIGHT
  return `${window.location.origin}${BRAND_LOGO_ON_LIGHT}`
}

export function buildCredentialsWhatsAppMessage(
  payload: ShareCredentialsPayload,
  locale: "en" | "ar",
): string {
  const loginUrl = getPublicLoginUrl()
  const name = payload.displayName.trim() || payload.email

  if (locale === "ar") {
    return [
      `*مرحباً، ${name}*`,
      "",
      `تم إنشاء حسابك في *Derby Fit* بنجاح.`,
      "استخدم بيانات الدخول التالية للوصول إلى لوحة المشترك:",
      "",
      `*البريد الإلكتروني:* ${payload.email}`,
      `*كلمة المرور:* ${payload.password}`,
      `*رابط تسجيل الدخول:*`,
      loginUrl,
      "",
      "نتطلع لرؤيتك داخل اللوحة.",
      "*Derby Fit*",
    ].join("\n")
  }

  return [
    `*Hi, ${name}*`,
    "",
    `Your *Derby Fit* account is ready.`,
    "Use the login details below to access your member panel:",
    "",
    `*Email:* ${payload.email}`,
    `*Password:* ${payload.password}`,
    `*Login link:*`,
    loginUrl,
    "",
    "See you inside the member panel.",
    "*Derby Fit*",
  ].join("\n")
}

export function openCredentialsWhatsApp(
  payload: ShareCredentialsPayload,
  locale: "en" | "ar",
): boolean {
  const href = buildWhatsAppHref(
    payload.phone,
    buildCredentialsWhatsAppMessage(payload, locale),
  )
  if (!href) return false
  window.open(href, "_blank", "noopener,noreferrer")
  return true
}
