import type { BilingualText } from "@/types/program"

/** Build lowercase match tokens from bilingual prohibited movement text. */
export function buildRestrictionMatchTokens(
  prohibited: BilingualText,
): string[] {
  const raw = `${prohibited.en} ${prohibited.ar}`
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s_-]/gu, " ")
  const tokens = new Set<string>()
  for (const part of raw.split(/\s+/)) {
    const cleaned = part.trim()
    if (cleaned.length >= 3) tokens.add(cleaned)
  }
  return Array.from(tokens)
}

export function emptyBilingual(): BilingualText {
  return { en: "", ar: "" }
}

export function normalizeBilingual(
  value: unknown,
  fallback = "",
): BilingualText {
  if (value && typeof value === "object") {
    const raw = value as Record<string, unknown>
    const en = String(raw.en ?? "").trim()
    const ar = String(raw.ar ?? "").trim()
    return {
      en: en || ar || fallback,
      ar: ar || en || fallback,
    }
  }
  if (typeof value === "string" && value.trim()) {
    const text = value.trim()
    return { en: text, ar: text }
  }
  return { en: fallback, ar: fallback }
}
