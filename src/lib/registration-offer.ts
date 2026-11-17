import { env } from "@/config/env"
import { buildWhatsAppHref } from "@/lib/whatsapp"
import type { RegistrationAssessment } from "@/features/subscribers/assessment"

export const INSTAPAY_NUMBER = "01011151366"
export const INSTAPAY_LINK =
  "https://ipn.eg/S/yousseftamer303/instapay/94Mwyj"
export const STORE_WHATSAPP_FALLBACK = "01011151366"

export type RegistrationOfferPayload = {
  displayName: string
  email: string
  phone: string
  packageName: string
  /** Localized plan price text from packages CMS (e.g. "1,500 EGP"). */
  packagePrice?: string
  /** Bilingual plan fields so the admin can switch message language. */
  packageNameLocalized?: { en: string; ar: string }
  packagePriceLocalized?: { en: string; ar: string }
  goalText?: string
  goalLocalized?: { en: string; ar: string }
  locale: "en" | "ar"
  assessment?: RegistrationAssessment
}

export type OfferRecipientMode = "customer" | "store" | "custom"

export function resolveStoreWhatsAppPhone(i18nPhoneRaw?: string): string {
  return (
    env.supportWhatsApp?.trim() ||
    i18nPhoneRaw?.trim() ||
    STORE_WHATSAPP_FALLBACK
  )
}

function pickLocalized(
  value: { en?: string; ar?: string } | string | undefined | null,
  locale: "en" | "ar",
): string {
  if (!value) return ""
  if (typeof value === "string") return value.trim()
  const primary = String(value[locale] ?? "").trim()
  const fallback = String(locale === "ar" ? value.en : value.ar ?? "").trim()
  return primary || fallback
}

function assessmentLines(
  assessment: RegistrationAssessment | undefined,
  locale: "en" | "ar",
): string[] {
  if (!assessment) return []
  const lines: string[] = []
  const L = locale === "ar"

  if (assessment.age != null && Number.isFinite(assessment.age)) {
    lines.push(L ? `• العمر: ${assessment.age}` : `• Age: ${assessment.age}`)
  }
  if (assessment.sex === "male" || assessment.sex === "female") {
    const sex =
      assessment.sex === "male"
        ? L
          ? "ذكر"
          : "Male"
        : L
          ? "أنثى"
          : "Female"
    lines.push(L ? `• الجنس: ${sex}` : `• Gender: ${sex}`)
  }
  if (assessment.heightCm != null && Number.isFinite(assessment.heightCm)) {
    lines.push(
      L
        ? `• الطول: ${assessment.heightCm} سم`
        : `• Height: ${assessment.heightCm} cm`,
    )
  }
  if (
    assessment.startingWeightKg != null &&
    Number.isFinite(assessment.startingWeightKg)
  ) {
    lines.push(
      L
        ? `• الوزن الحالي: ${assessment.startingWeightKg} كجم`
        : `• Current weight: ${assessment.startingWeightKg} kg`,
    )
  }
  if (
    assessment.targetWeightKg != null &&
    Number.isFinite(assessment.targetWeightKg)
  ) {
    lines.push(
      L
        ? `• الوزن المستهدف: ${assessment.targetWeightKg} كجم`
        : `• Target weight: ${assessment.targetWeightKg} kg`,
    )
  }

  const experienceMap: Record<string, { en: string; ar: string }> = {
    beginner: { en: "Beginner", ar: "مبتدئ" },
    intermediate: { en: "Intermediate", ar: "متوسط" },
    advanced: { en: "Advanced", ar: "متقدم" },
  }
  if (
    assessment.fitnessExperience &&
    experienceMap[assessment.fitnessExperience]
  ) {
    const label = experienceMap[assessment.fitnessExperience][locale]
    lines.push(L ? `• الخبرة: ${label}` : `• Experience: ${label}`)
  }

  const activityMap: Record<string, { en: string; ar: string }> = {
    sedentary: { en: "Sedentary", ar: "قليل الحركة" },
    light: { en: "Lightly active", ar: "نشاط خفيف" },
    moderate: { en: "Moderately active", ar: "نشاط متوسط" },
    very_active: { en: "Very active", ar: "نشاط عالٍ" },
  }
  if (assessment.activityLevel && activityMap[assessment.activityLevel]) {
    const label = activityMap[assessment.activityLevel][locale]
    lines.push(L ? `• مستوى النشاط: ${label}` : `• Activity: ${label}`)
  }

  const frequencyMap: Record<string, { en: string; ar: string }> = {
    "1_2": { en: "1–2 days / week", ar: "1–2 أيام / أسبوع" },
    "3_4": { en: "3–4 days / week", ar: "3–4 أيام / أسبوع" },
    "5_6": { en: "5–6 days / week", ar: "5–6 أيام / أسبوع" },
    daily: { en: "Daily", ar: "يومياً" },
  }
  if (
    assessment.workoutFrequency &&
    frequencyMap[assessment.workoutFrequency]
  ) {
    const label = frequencyMap[assessment.workoutFrequency][locale]
    lines.push(L ? `• التكرار: ${label}` : `• Frequency: ${label}`)
  }

  const goalMap: Record<string, { en: string; ar: string }> = {
    muscle_gain: { en: "Muscle gain", ar: "بناء عضل" },
    fat_loss: { en: "Fat loss", ar: "خسارة دهون" },
    maintenance: { en: "Maintenance", ar: "حفاظ على الوزن" },
    performance: { en: "Athletic performance", ar: "أداء رياضي" },
  }
  if (assessment.primaryGoal && goalMap[assessment.primaryGoal]) {
    const label = goalMap[assessment.primaryGoal][locale]
    lines.push(L ? `• الهدف: ${label}` : `• Primary goal: ${label}`)
  }

  const health = pickLocalized(assessment.healthNotes, locale)
  if (health) {
    lines.push(L ? `• ملاحظات صحية: ${health}` : `• Health notes: ${health}`)
  }

  return lines
}

function planSummaryLine(
  packageName: string,
  packagePrice: string | undefined,
  locale: "en" | "ar",
): string {
  const plan = packageName.trim() || (locale === "ar" ? "غير محدد" : "Not set")
  const price = packagePrice?.trim()
  if (price) {
    return locale === "ar"
      ? `• الباقة: ${plan} — *${price}*`
      : `• Plan: ${plan} — *${price}*`
  }
  return locale === "ar" ? `• الباقة: ${plan}` : `• Plan: ${plan}`
}

export function buildRegistrationOfferWhatsAppMessage(
  payload: RegistrationOfferPayload,
  locale: "en" | "ar" = payload.locale,
): string {
  const name =
    payload.displayName.trim() ||
    payload.email.trim() ||
    (locale === "ar" ? "عميل" : "Member")
  const email = payload.email.trim() || "—"
  const phone = payload.phone.trim() || "—"
  const goal =
    pickLocalized(payload.goalLocalized, locale) ||
    payload.goalText?.trim() ||
    ""
  const assessment = assessmentLines(payload.assessment, locale)
  const packageName =
    pickLocalized(payload.packageNameLocalized, locale) ||
    payload.packageName
  const packagePrice =
    pickLocalized(payload.packagePriceLocalized, locale) ||
    payload.packagePrice
  const planLine = planSummaryLine(packageName, packagePrice, locale)

  if (locale === "ar") {
    return [
      `*مرحباً، ${name}*`,
      "",
      "شكراً لاهتمامك بـ *Derby Fit*. استلمنا طلب انضمامك ونراجع تفاصيلك الآن.",
      "",
      "*ملخص طلبك*",
      `• الاسم: ${name}`,
      `• البريد: ${email}`,
      `• الهاتف: ${phone}`,
      planLine,
      ...(goal ? [`• الرسالة: ${goal}`] : []),
      ...(assessment.length ? ["", "*تفاصيل التقييم*", ...assessment] : []),
      "",
      "*تأكيد الحجز*",
      "لإتمام طلبك وتفعيل الاشتراك، ادفع عبر *Instapay*:",
      `• الرقم: *${INSTAPAY_NUMBER}*`,
      `• الرابط السريع:`,
      INSTAPAY_LINK,
      "",
      "بعد التحويل أرسل صورة إيصال الدفع على واتساب، وسنفعّل حسابك فوراً.",
      "",
      "*Derby Fit*",
    ].join("\n")
  }

  return [
    `*Hi, ${name}*`,
    "",
    "Thank you for your interest in *Derby Fit*. We received your join request and are reviewing your details.",
    "",
    "*Your request summary*",
    `• Name: ${name}`,
    `• Email: ${email}`,
    `• Phone: ${phone}`,
    planLine,
    ...(goal ? [`• Message: ${goal}`] : []),
    ...(assessment.length ? ["", "*Assessment details*", ...assessment] : []),
    "",
    "*Confirm your spot*",
    "To confirm your request and activate your subscription, pay via *Instapay*:",
    `• Number: *${INSTAPAY_NUMBER}*`,
    `• Quick link:`,
    INSTAPAY_LINK,
    "",
    "After payment, send the transfer screenshot on WhatsApp and we will activate your account right away.",
    "",
    "*Derby Fit*",
  ].join("\n")
}

export function openRegistrationOfferWhatsApp(
  phone: string,
  payload: RegistrationOfferPayload,
  locale: "en" | "ar" = payload.locale,
): boolean {
  const href = buildWhatsAppHref(
    phone,
    buildRegistrationOfferWhatsAppMessage(payload, locale),
  )
  if (!href) return false
  window.open(href, "_blank", "noopener,noreferrer")
  return true
}

/** Build a complete offer payload from a registration request + package map. */
export function buildOfferPayloadFromRequest(input: {
  displayName: string
  name?: { en?: string; ar?: string } | null
  email: string
  phone?: string | null
  locale: "en" | "ar"
  goal?: { en?: string; ar?: string } | string | null
  assessment?: RegistrationAssessment
  packageName?: { en?: string; ar?: string } | string | null
  packagePrice?: { en?: string; ar?: string } | string | null
}): RegistrationOfferPayload {
  const msgLocale = input.locale
  const packageNameLocalized =
    typeof input.packageName === "string"
      ? {
          en: input.packageName.trim(),
          ar: input.packageName.trim(),
        }
      : {
          en: String(input.packageName?.en ?? "").trim(),
          ar: String(input.packageName?.ar ?? "").trim(),
        }
  const packagePriceLocalized =
    typeof input.packagePrice === "string"
      ? {
          en: input.packagePrice.trim(),
          ar: input.packagePrice.trim(),
        }
      : {
          en: String(input.packagePrice?.en ?? "").trim(),
          ar: String(input.packagePrice?.ar ?? "").trim(),
        }
  const goalLocalized =
    typeof input.goal === "string"
      ? { en: input.goal.trim(), ar: input.goal.trim() }
      : {
          en: String(input.goal?.en ?? "").trim(),
          ar: String(input.goal?.ar ?? "").trim(),
        }

  return {
    displayName:
      pickLocalized(input.name, msgLocale) ||
      input.displayName.trim() ||
      input.email.trim(),
    email: input.email.trim().toLowerCase(),
    phone: String(input.phone ?? "").trim(),
    packageName: pickLocalized(packageNameLocalized, msgLocale) || "—",
    packagePrice: pickLocalized(packagePriceLocalized, msgLocale) || undefined,
    packageNameLocalized,
    packagePriceLocalized: packagePriceLocalized.en || packagePriceLocalized.ar
      ? packagePriceLocalized
      : undefined,
    goalText: pickLocalized(goalLocalized, msgLocale),
    goalLocalized:
      goalLocalized.en || goalLocalized.ar ? goalLocalized : undefined,
    locale: msgLocale,
    assessment: input.assessment,
  }
}
