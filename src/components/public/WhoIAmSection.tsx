import { Link } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { ArrowRight, Check } from "lucide-react"
import { APP_ROUTES } from "@/config/constants"
import { useLocale } from "@/hooks/useLocale"
import { cn } from "@/lib/utils"
import whoIAmImage from "@/assets/whoiam.avif"

const CERT_KEYS = [
  "whoIAm.certs.trainer",
  "whoIAm.certs.nutrition",
  "whoIAm.certs.strength",
  "whoIAm.certs.trusted",
] as const

export function WhoIAmSection() {
  const { t } = useTranslation()
  const { isRtl } = useLocale()

  return (
    <section
      id="about"
      className="w-full scroll-mt-24 bg-white px-6 py-16 md:px-10 md:py-24 lg:px-14"
    >
      <div className="mx-auto grid w-full max-w-[1300px] items-center gap-12 lg:grid-cols-2 lg:gap-16 xl:gap-20">
        {/* Image + soft bottom fade + experience badge */}
        <div className="relative overflow-hidden rounded-[24px]">
          <img
            src={whoIAmImage}
            alt={t("whoIAm.imageAlt")}
            className="aspect-[4/5] h-full w-full object-cover object-center sm:aspect-[5/6] lg:min-h-[640px] lg:aspect-auto xl:min-h-[700px]"
            loading="lazy"
            decoding="async"
            draggable={false}
          />

          {/* Full soft dim + strong bottom fade (like the original mock) */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 z-[1]"
            style={{
              background: [
                "linear-gradient(to top, rgba(6,20,20,0.88) 0%, rgba(6,20,20,0.62) 18%, rgba(6,20,20,0.32) 38%, rgba(6,20,20,0.1) 58%, transparent 78%)",
                "linear-gradient(to top, transparent 45%, rgba(0,0,0,0.12) 100%)",
              ].join(", "),
            }}
          />

          <div className="absolute bottom-7 end-7 z-[2] text-end sm:bottom-10 sm:end-10">
            <p className="font-heading text-[72px] font-extrabold leading-none tracking-tight text-[var(--gym-lime)] sm:text-[88px] md:text-[104px] lg:text-[112px]">
              {t("whoIAm.yearsValue")}
            </p>
            <p className="mt-1 font-heading text-[18px] font-bold leading-tight text-white sm:text-[22px] md:text-[24px]">
              {t("whoIAm.yearsLabel")}
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="flex flex-col lg:py-4">
          <p className="font-heading text-[18px] font-bold text-[var(--gym-ink)] sm:text-[20px] md:text-[22px]">
            {t("whoIAm.eyebrow")}
          </p>

          <h2 className="mt-2 font-heading text-[34px] font-bold leading-[1.12] text-[var(--gym-ink)] sm:text-[42px] md:text-[48px] lg:text-[52px]">
            <span className="block">{t("whoIAm.titleLine1")}</span>
            <span className="block">{t("whoIAm.titleLine2")}</span>
          </h2>

          <p className="mt-5 max-w-[38em] text-[15px] leading-[1.65] text-[var(--gym-muted)] sm:mt-6 sm:text-[16px] md:text-[17px]">
            {t("whoIAm.body")}
          </p>

          <Link
            to={APP_ROUTES.public.contact}
            className="group mt-7 inline-flex h-[50px] w-fit items-center text-[16px] font-medium leading-none text-[var(--gym-ink)] sm:mt-8"
          >
            <span className="inline-flex h-full items-center rounded-full bg-[var(--gym-lime)] px-[25px]">
              {t("whoIAm.cta")}
            </span>
            <span className="inline-flex size-[50px] shrink-0 items-center justify-center rounded-full bg-[var(--gym-ink)] text-white">
              <ArrowRight
                className={cn(
                  "transition-transform duration-300 ease-out",
                  isRtl
                    ? "-rotate-[135deg] group-hover:-rotate-180"
                    : "-rotate-45 group-hover:rotate-0"
                )}
                size={18}
                strokeWidth={1.75}
              />
            </span>
          </Link>

          <div className="mt-10 border-t border-[var(--gym-ink)]/12 pt-8 sm:mt-12 sm:pt-9">
            <h3 className="font-heading text-[20px] font-bold text-[var(--gym-ink)] sm:text-[22px]">
              {t("whoIAm.certsTitle")}
            </h3>

            <ul className="mt-5 flex flex-col gap-4 sm:mt-6">
              {CERT_KEYS.map((key) => (
                <li key={key} className="flex items-center gap-3">
                  <span className="inline-flex size-[22px] shrink-0 items-center justify-center rounded-full bg-[var(--gym-ink)] text-white sm:size-6">
                    <Check className="size-3.5" strokeWidth={3} aria-hidden />
                  </span>
                  <span className="text-[15px] font-medium text-[var(--gym-ink)] sm:text-[16px]">
                    {t(key)}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  )
}
