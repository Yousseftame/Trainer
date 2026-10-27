import { useCallback } from "react"
import { useTranslation } from "react-i18next"
import type { AppLocale } from "@/i18n/rtl"

export function useLocale() {
  const { i18n } = useTranslation()
  const locale: AppLocale = i18n.language?.startsWith("ar") ? "ar" : "en"

  const setLocale = useCallback(
    (next: AppLocale) => {
      void i18n.changeLanguage(next)
    },
    [i18n],
  )

  return { locale, setLocale, isRtl: locale === "ar" }
}
