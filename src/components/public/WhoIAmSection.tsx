import { Link } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { ArrowRight, Check } from "lucide-react"
import { APP_ROUTES } from "@/config/constants"
import {
  DEFAULT_WHO_I_AM_COPY,
  isRenderableImageSrc,
  useWhoIAmContentQuery,
} from "@/features/website"
import { useLocale } from "@/hooks/useLocale"
import { resolveBilingualText } from "@/lib/program-text"
import { cn } from "@/lib/utils"
import whoIAmImage from "@/assets/whoiam.avif"

export function WhoIAmSection() {
  const { t } = useTranslation()
  const { locale, isRtl } = useLocale()
  const { data: content } = useWhoIAmContentQuery({ audience: "public" })

  const hasCmsImage = Boolean(
    content?.imageUrl && isRenderableImageSrc(content.imageUrl),
  )

  const imageSrc = hasCmsImage ? content!.imageUrl : whoIAmImage
  const imageAlt = content
    ? resolveBilingualText(content.imageAlt, locale, t("whoIAm.imageAlt"))
    : t("whoIAm.imageAlt")

  const yearsValue = content
    ? resolveBilingualText(content.yearsValue, locale, t("whoIAm.yearsValue"))
    : t("whoIAm.yearsValue")
  const yearsLabel = content
    ? resolveBilingualText(content.yearsLabel, locale, t("whoIAm.yearsLabel"))
    : t("whoIAm.yearsLabel")
  const eyebrow = content
    ? resolveBilingualText(content.eyebrow, locale, t("whoIAm.eyebrow"))
    : t("whoIAm.eyebrow")
  const titleLine1 = content
    ? resolveBilingualText(content.titleLine1, locale, t("whoIAm.titleLine1"))
    : t("whoIAm.titleLine1")
  const titleLine2 = content
    ? resolveBilingualText(content.titleLine2, locale, t("whoIAm.titleLine2"))
    : t("whoIAm.titleLine2")
  const body = content
    ? resolveBilingualText(content.body, locale, t("whoIAm.body"))
    : t("whoIAm.body")
  const cta = content
    ? resolveBilingualText(content.cta, locale, t("whoIAm.cta"))
    : t("whoIAm.cta")
  const pointsTitle = content
    ? resolveBilingualText(content.pointsTitle, locale, t("whoIAm.certsTitle"))
    : t("whoIAm.certsTitle")

  const points =
    content?.points && content.points.length > 0
      ? content.points.map((point) => ({
          id: point.id,
          text: resolveBilingualText(point.text, locale),
        }))
      : DEFAULT_WHO_I_AM_COPY.points.map((point) => ({
          id: point.id,
          text: resolveBilingualText(point.text, locale, t(`whoIAm.certs.${point.id}`)),
        }))

  return (
    <section
      id="about"
      className="w-full scroll-mt-24 bg-white px-6 py-16 md:px-10 md:py-24 lg:px-14"
    >
      <div className="mx-auto grid w-full max-w-[1300px] items-center gap-12 lg:grid-cols-2 lg:gap-16 xl:gap-20">
        {/* Fixed media frame — same size for every photo (default or CMS). */}
        <div className="relative aspect-[4/5] w-full overflow-hidden rounded-[24px] sm:aspect-[5/6] lg:aspect-auto lg:h-[640px] xl:h-[700px]">
          <img
            src={imageSrc}
            alt={imageAlt}
            className="absolute inset-0 z-0 size-full object-cover object-center"
            loading="lazy"
            decoding="async"
            draggable={false}
          />

          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 z-[1]"
            style={{
              background: [
                "linear-gradient(to top, rgba(26,2,8,0.88) 0%, rgba(26,2,8,0.62) 18%, rgba(26,2,8,0.32) 38%, rgba(26,2,8,0.1) 58%, transparent 78%)",
                "linear-gradient(to top, transparent 45%, rgba(0,0,0,0.12) 100%)",
              ].join(", "),
            }}
          />

          <div className="absolute bottom-7 end-7 z-[2] text-end sm:bottom-10 sm:end-10">
            <p className="font-heading text-[72px] font-extrabold leading-none tracking-tight text-[var(--gym-lime)] sm:text-[88px] md:text-[104px] lg:text-[112px]">
              {yearsValue}
            </p>
            <p className="mt-1 font-heading text-[18px] font-bold leading-tight text-white sm:text-[22px] md:text-[24px]">
              {yearsLabel}
            </p>
          </div>
        </div>

        <div className="flex flex-col lg:py-4">
          <p className="font-heading text-[18px] font-bold text-[var(--gym-ink)] sm:text-[20px] md:text-[22px]">
            {eyebrow}
          </p>

          <h2 className="mt-2 font-heading text-[34px] font-bold leading-[1.12] text-[var(--gym-ink)] sm:text-[42px] md:text-[48px] lg:text-[52px]">
            <span className="block">{titleLine1}</span>
            <span className="block">{titleLine2}</span>
          </h2>

          <p className="mt-5 max-w-[38em] text-[15px] leading-[1.65] text-[var(--gym-muted)] sm:mt-6 sm:text-[16px] md:text-[17px]">
            {body}
          </p>

          <Link
            to={APP_ROUTES.public.about}
            className="group mt-7 inline-flex h-[50px] w-fit items-center text-[16px] font-medium leading-none text-[var(--gym-ink)] sm:mt-8"
          >
            <span className="inline-flex h-full items-center rounded-full bg-[var(--gym-lime)] px-[25px] text-white">
              {cta}
            </span>
            <span className="inline-flex size-[50px] shrink-0 items-center justify-center rounded-full bg-[var(--gym-ink)] text-white">
              <ArrowRight
                className={cn(
                  "transition-transform duration-300 ease-out",
                  isRtl
                    ? "-rotate-[135deg] group-hover:-rotate-180"
                    : "-rotate-45 group-hover:rotate-0",
                )}
                size={18}
                strokeWidth={1.75}
              />
            </span>
          </Link>

          <div className="mt-10 border-t border-[var(--gym-ink)]/12 pt-8 sm:mt-12 sm:pt-9">
            <h3 className="font-heading text-[20px] font-bold text-[var(--gym-ink)] sm:text-[22px]">
              {pointsTitle}
            </h3>

            <ul className="mt-5 flex flex-col gap-4 sm:mt-6">
              {points.map((point) => (
                <li key={point.id} className="flex items-center gap-3">
                  <span className="inline-flex size-[22px] shrink-0 items-center justify-center rounded-full bg-[var(--gym-ink)] text-white sm:size-6">
                    <Check className="size-3.5" strokeWidth={3} aria-hidden />
                  </span>
                  <span className="text-[15px] font-medium text-[var(--gym-ink)] sm:text-[16px]">
                    {point.text}
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
