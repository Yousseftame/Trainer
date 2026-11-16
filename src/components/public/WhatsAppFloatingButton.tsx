import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import { FaWhatsapp } from "react-icons/fa6"
import { env } from "@/config/env"
import { buildWhatsAppHref } from "@/lib/whatsapp"
import { cn } from "@/lib/utils"

/** Default support line: 01011151366 → +20 1011151366 */
const FALLBACK_PHONE = "01011151366"

export function WhatsAppFloatingButton() {
  const { t } = useTranslation()

  const href = useMemo(() => {
    const phone =
      env.supportWhatsApp?.trim() ||
      t("whatsappBanner.phoneRaw").trim() ||
      FALLBACK_PHONE
    return buildWhatsAppHref(phone, t("whatsappFloat.prefill"))
  }, [t])

  if (!href) return null

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={t("whatsappFloat.label")}
      className={cn(
        "whatsapp-float group fixed bottom-5 right-5 z-[60] inline-flex size-[56px] items-center justify-center rounded-full bg-[#25D366] text-white",
        "shadow-[0_10px_28px_rgba(37,211,102,0.38)]",
        "transition-transform duration-300 ease-out hover:scale-105 active:scale-95",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#25D366]/70 focus-visible:ring-offset-2",
        "sm:bottom-6 sm:right-6 sm:size-[58px]",
      )}
    >
      <span aria-hidden className="whatsapp-float__pulse" />
      <FaWhatsapp className="relative z-[1] size-[28px] sm:size-[30px]" aria-hidden />
    </a>
  )
}
