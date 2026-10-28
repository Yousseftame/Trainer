import type { AppLocale } from "@/i18n/rtl"

export function formatDate(value: string | null | undefined, locale: AppLocale): string {
  if (!value) return "—"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "—"
  return new Intl.DateTimeFormat(locale === "ar" ? "ar" : "en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date)
}

export function daysUntil(value: string | null | undefined): number | null {
  if (!value) return null
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null
  const diff = date.getTime() - Date.now()
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

export function formatChartDate(value: string, locale: AppLocale): string {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "—"
  return new Intl.DateTimeFormat(locale === "ar" ? "ar-EG" : "en-GB", {
    day: "numeric",
    month: "numeric",
    numberingSystem: "latn",
  }).format(date)
}

export function formatKg(value: number, locale: AppLocale): string {
  return `${new Intl.NumberFormat(locale === "ar" ? "ar" : "en-GB", {
    maximumFractionDigits: 1,
  }).format(value)} kg`
}

export function formatBmi(weightKg?: number, heightCm?: number): string | null {
  if (!weightKg || !heightCm) return null
  const bmi = weightKg / (heightCm / 100) ** 2
  return bmi.toFixed(1)
}

export function formatDuration(seconds?: number): string {
  if (!seconds || seconds < 0) return "—"
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${String(s).padStart(2, "0")}`
}

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return "?"
  if (parts.length === 1) return parts[0].slice(0, 1).toUpperCase()
  return `${parts[0].slice(0, 1)}${parts[parts.length - 1].slice(0, 1)}`.toUpperCase()
}
