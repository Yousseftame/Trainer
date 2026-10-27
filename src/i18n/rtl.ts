export type AppLocale = "en" | "ar"

export function applyDocumentLocale(locale: AppLocale): void {
  const root = document.documentElement
  root.lang = locale
  root.dir = locale === "ar" ? "rtl" : "ltr"
}

export function isRtlLocale(locale: string): boolean {
  return locale === "ar"
}
