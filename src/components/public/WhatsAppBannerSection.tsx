import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import { ChevronsRight } from "lucide-react"
import { FaWhatsapp } from "react-icons/fa6"
import { env } from "@/config/env"
import { useLocale } from "@/hooks/useLocale"
import { cn } from "@/lib/utils"
import ctaBackground from "@/assets/6914cc3285b9aaa636f59a97_Cta.svg"

function buildWhatsAppHref(rawPhone: string, prefill?: string) {
  const digits = rawPhone.replace(/\D/g, "")
  if (!digits) return null
  const base = `https://wa.me/${digits}`
  if (!prefill?.trim()) return base
  return `${base}?text=${encodeURIComponent(prefill.trim())}`
}

export function WhatsAppBannerSection() {
  const { t } = useTranslation()
  const { isRtl } = useLocale()

  const href = useMemo(() => {
    const phone =
      env.supportWhatsApp?.trim() || t("whatsappBanner.phoneRaw").trim()
    return buildWhatsAppHref(phone, t("whatsappBanner.prefill"))
  }, [t])

  if (!href) return null

  const buttonLabelClass = cn(
    "relative z-10 whitespace-nowrap text-[12px] font-extrabold uppercase tracking-[0.05em] sm:text-[14px] sm:tracking-[0.06em]",
    isRtl ? "font-arabic tracking-normal" : "font-heading",
  )

  const chevronClass = cn(
    "size-[18px] transition-transform duration-300 ease-out group-active:translate-x-0 sm:size-5",
    isRtl
      ? "rotate-180 group-hover:-translate-x-0.5"
      : "group-hover:translate-x-0.5",
  )

  return (
    <section
      id="whatsapp"
      aria-labelledby="whatsapp-banner-title"
      className="w-full scroll-mt-24 overflow-x-hidden bg-white px-3 py-10 sm:px-[15px] sm:py-12 md:py-16 lg:px-[30px] lg:py-20"
    >
      <div className="relative mx-auto flex w-full max-w-[1300px] flex-col items-center justify-center overflow-hidden rounded-[10px] bg-[#191919] px-4 py-11 text-center sm:min-h-[400px] sm:px-10 sm:py-16 md:min-h-[442px] md:py-[72px]">
        <img
          src={ctaBackground}
          alt=""
          aria-hidden
          className="pointer-events-none absolute inset-0 size-full select-none object-cover object-center"
          draggable={false}
        />

        <div className="relative z-10 flex w-full max-w-[920px] flex-col items-center">
          <div className="inline-flex items-center gap-2 sm:gap-2.5">
            <span className="inline-flex size-8 shrink-0 items-center justify-center rounded-full bg-[#25D366] text-white shadow-[0_0_0_3px_rgba(37,211,102,0.22)] sm:size-10">
              <FaWhatsapp className="size-[18px] sm:size-[22px]" aria-hidden />
            </span>
            <p
              className={cn(
                "text-[12px] font-extrabold uppercase tracking-normal text-[#25D366] sm:text-[14px]",
                isRtl ? "font-arabic" : "font-heading",
              )}
            >
              {t("whatsappBanner.eyebrow")}
            </p>
          </div>

          <h2
            id="whatsapp-banner-title"
            className={cn(
              "mt-4 max-w-[14ch] text-[28px] font-extrabold uppercase leading-[1.1] tracking-tight text-white sm:mt-6 sm:max-w-[18ch] sm:text-[42px] sm:leading-[1.08] md:text-[52px] lg:text-[58px]",
              isRtl ? "font-arabic normal-case tracking-normal" : "font-heading",
            )}
          >
            {t("whatsappBanner.title")}
          </h2>

          <div className="mt-7 flex w-full justify-center sm:mt-10">
            <div className="inline-flex max-w-full flex-col items-stretch gap-2.5 sm:flex-row sm:items-center sm:gap-4">
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(
                  "group relative flex h-[50px] w-full items-center justify-between gap-3 overflow-hidden rounded-full border-2 border-transparent bg-white py-1 pe-1 ps-5 text-black sm:h-[56px] sm:w-auto sm:min-w-[13.75rem] sm:py-1.5 sm:pe-1.5 sm:ps-7",
                  "shadow-[0_4px_14px_rgba(0,0,0,0.2)] sm:shadow-[0_8px_24px_rgba(0,0,0,0.18)]",
                  "transition-[transform,box-shadow,background-color] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
                  "hover:bg-[#f4f4f4] hover:shadow-[0_16px_40px_rgba(255,255,255,0.22)]",
                  "active:scale-[0.98] active:bg-white active:shadow-[0_2px_8px_rgba(0,0,0,0.28)]",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#191919]",
                )}
              >
                <span className={buttonLabelClass}>{t("whatsappBanner.cta")}</span>
                <span
                  className={cn(
                    "relative z-10 inline-flex size-[36px] shrink-0 items-center justify-center rounded-full bg-black text-white sm:size-[44px]",
                    "transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
                    "group-hover:scale-105 group-active:scale-95",
                  )}
                >
                  <ChevronsRight
                    className={chevronClass}
                    strokeWidth={2.5}
                    aria-hidden
                  />
                </span>
              </a>

              <a
                href="#contact"
                className={cn(
                  "group relative flex h-[50px] w-full items-center justify-between gap-3 overflow-hidden rounded-full border-2 border-[#25D366] bg-black py-1 pe-1 ps-5 text-[#25D366] sm:h-[56px] sm:w-auto sm:min-w-[13.75rem] sm:py-1.5 sm:pe-1.5 sm:ps-7",
                  "shadow-[0_4px_14px_rgba(37,211,102,0.16)] sm:shadow-[0_8px_24px_rgba(37,211,102,0.12)]",
                  "transition-[transform,box-shadow,background-color,border-color,color] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
                  "hover:border-[#2fe574] hover:bg-[#25D366] hover:text-black hover:shadow-[0_16px_40px_rgba(37,211,102,0.38)]",
                  "active:scale-[0.98] active:border-[#1ebe57] active:bg-[#1ebe57] active:text-black active:shadow-[0_2px_8px_rgba(37,211,102,0.28)]",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#25D366]/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#191919]",
                )}
              >
                <span className={buttonLabelClass}>
                  {t("whatsappBanner.secondary")}
                </span>
                <span
                  className={cn(
                    "relative z-10 inline-flex size-[36px] shrink-0 items-center justify-center rounded-full bg-[#25D366] text-white sm:size-[44px]",
                    "transition-[transform,background-color,color] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
                    "group-hover:scale-105 group-hover:bg-black group-hover:text-[#25D366]",
                    "group-active:scale-95 group-active:bg-black group-active:text-white",
                  )}
                >
                  <ChevronsRight
                    className={chevronClass}
                    strokeWidth={2.5}
                    aria-hidden
                  />
                </span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
