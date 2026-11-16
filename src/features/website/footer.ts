import { doc, getDoc, setDoc } from "firebase/firestore"
import { getDb } from "@/lib/firebase/firestore"
import type {
  FooterContent,
  VideoBannerSocialLink,
  VideoBannerSocialNetwork,
} from "@/types/website"

export const FOOTER_COLLECTION = "website_footer"
export const FOOTER_DOC_ID = "config"

export const FOOTER_SOCIAL_ORDER: VideoBannerSocialNetwork[] = [
  "facebook",
  "linkedin",
  "youtube",
  "instagram",
  "tiktok",
]

export const DEFAULT_FOOTER_CONTACT = {
  phone: "+20 101 115 1366",
  phoneRaw: "+201011151366",
  email: "example@gmail.com",
} as const

export const DEFAULT_FOOTER_SOCIALS: VideoBannerSocialLink[] =
  FOOTER_SOCIAL_ORDER.map((network) => ({
    network,
    enabled: true,
    url: "",
  }))

function stripUndefined<T extends Record<string, unknown>>(obj: T): T {
  const out: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(obj)) {
    if (v !== undefined) out[k] = v
  }
  return out as T
}

function asString(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback
}

function asBool(value: unknown, fallback = true): boolean {
  return typeof value === "boolean" ? value : fallback
}

function isSocialNetwork(value: unknown): value is VideoBannerSocialNetwork {
  return (
    value === "facebook" ||
    value === "linkedin" ||
    value === "youtube" ||
    value === "instagram" ||
    value === "tiktok"
  )
}

function normalizeSocials(value: unknown): VideoBannerSocialLink[] {
  const byNetwork = new Map<VideoBannerSocialNetwork, VideoBannerSocialLink>()

  if (Array.isArray(value)) {
    for (const item of value) {
      if (!item || typeof item !== "object") continue
      const raw = item as Record<string, unknown>
      if (!isSocialNetwork(raw.network)) continue
      byNetwork.set(raw.network, {
        network: raw.network,
        enabled: asBool(raw.enabled, true),
        url: asString(raw.url).trim(),
      })
    }
  }

  return FOOTER_SOCIAL_ORDER.map((network) => {
    const existing = byNetwork.get(network)
    if (existing) return existing
    return {
      network,
      enabled: true,
      url: "",
    }
  })
}

/** Digits for tel: — keeps a leading + when present. */
export function derivePhoneRaw(phone: string, phoneRaw?: string): string {
  const explicit = (phoneRaw || "").trim()
  if (explicit) {
    const cleaned = explicit.replace(/[^\d+]/g, "")
    if (cleaned) return cleaned.startsWith("+") ? cleaned : `+${cleaned}`
  }
  const digits = phone.replace(/[^\d+]/g, "")
  if (!digits) return ""
  return digits.startsWith("+") ? digits : `+${digits.replace(/^\+*/, "")}`
}

export function normalizeFooterContent(
  raw: Record<string, unknown> | null | undefined,
): FooterContent {
  const phone = asString(raw?.phone, DEFAULT_FOOTER_CONTACT.phone).trim()
  const phoneRaw = derivePhoneRaw(
    phone,
    asString(raw?.phoneRaw, DEFAULT_FOOTER_CONTACT.phoneRaw),
  )
  return {
    id: FOOTER_DOC_ID,
    phone: phone || DEFAULT_FOOTER_CONTACT.phone,
    phoneRaw: phoneRaw || DEFAULT_FOOTER_CONTACT.phoneRaw,
    email:
      asString(raw?.email, DEFAULT_FOOTER_CONTACT.email).trim() ||
      DEFAULT_FOOTER_CONTACT.email,
    socials: normalizeSocials(raw?.socials),
    updatedAt: asString(raw?.updatedAt),
    updatedBy: asString(raw?.updatedBy) || undefined,
  }
}

export function createDefaultFooterContent(): FooterContent {
  return normalizeFooterContent(null)
}

export async function fetchFooterContent(): Promise<FooterContent | null> {
  const snap = await getDoc(doc(getDb(), FOOTER_COLLECTION, FOOTER_DOC_ID))
  if (!snap.exists()) return null
  return normalizeFooterContent(snap.data() as Record<string, unknown>)
}

function normalizeUrl(url: string): string {
  const trimmed = url.trim()
  if (!trimmed) return ""
  if (
    trimmed.startsWith("http://") ||
    trimmed.startsWith("https://") ||
    trimmed.startsWith("/")
  ) {
    return trimmed
  }
  return `https://${trimmed}`
}

export type SaveFooterContentInput = {
  phone: string
  phoneRaw?: string
  email: string
  socials: VideoBannerSocialLink[]
  updatedBy?: string
}

export async function saveFooterContent(
  input: SaveFooterContentInput,
): Promise<FooterContent> {
  const phone = input.phone.trim()
  const email = input.email.trim()
  if (!phone) throw new Error("Phone number is required")
  if (!email) throw new Error("Email is required")
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error("Enter a valid email address")
  }

  const phoneRaw = derivePhoneRaw(phone, input.phoneRaw)
  if (!phoneRaw || phoneRaw.replace(/\D/g, "").length < 8) {
    throw new Error("Enter a valid phone number")
  }

  const socials = FOOTER_SOCIAL_ORDER.map((network) => {
    const found = input.socials.find((item) => item.network === network)
    return {
      network,
      enabled: found?.enabled ?? true,
      url: normalizeUrl(found?.url || ""),
    }
  })

  const existing = await fetchFooterContent()
  const now = new Date().toISOString()
  const record: FooterContent = {
    id: FOOTER_DOC_ID,
    phone,
    phoneRaw,
    email,
    socials,
    updatedAt: now,
    updatedBy: input.updatedBy || existing?.updatedBy,
  }

  await setDoc(
    doc(getDb(), FOOTER_COLLECTION, FOOTER_DOC_ID),
    stripUndefined({ ...record }),
  )

  return record
}
