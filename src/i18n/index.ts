import i18n from "i18next"
import { initReactI18next } from "react-i18next"
import LanguageDetector from "i18next-browser-languagedetector"
import { env } from "@/config/env"
import { applyDocumentLocale, type AppLocale } from "@/i18n/rtl"
import en from "@/i18n/locales/en.json"
import ar from "@/i18n/locales/ar.json"

void i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      ar: { translation: ar },
    },
    fallbackLng: env.defaultLocale,
    supportedLngs: ["ar", "en"],
    interpolation: { escapeValue: false },
    detection: {
      order: ["localStorage"],
      lookupLocalStorage: "derpyfit_locale",
      caches: ["localStorage"],
    },
  })

applyDocumentLocale((i18n.language?.startsWith("en") ? "en" : "ar") as AppLocale)

i18n.on("languageChanged", (lng) => {
  applyDocumentLocale((lng.startsWith("en") ? "en" : "ar") as AppLocale)
})

export default i18n
