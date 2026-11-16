import { useTranslation } from "react-i18next"
import { ArrowCtaLink } from "@/components/public/ArrowCtaLink"
import {
  DEFAULT_ABOUT_CLOSING_BANNER_COPY,
  isRenderableImageSrc,
  useAboutClosingBannerContentQuery,
} from "@/features/website"
import { APP_ROUTES } from "@/config/constants"
import { useLocale } from "@/hooks/useLocale"
import { resolveBilingualText } from "@/lib/program-text"
import adminImage from "@/assets/admin.webp"

export function AboutClosingBannerSection() {
  const { t } = useTranslation()
  const { locale } = useLocale()
  const { data } = useAboutClosingBannerContentQuery({ audience: "public" })

  const title = data
    ? resolveBilingualText(
        data.title,
        locale,
        t("aboutPage.closing.title"),
      )
    : t("aboutPage.closing.title")

  const body = data
    ? resolveBilingualText(data.body, locale, t("aboutPage.closing.body"))
    : t("aboutPage.closing.body")

  const ctaLabel = data
    ? resolveBilingualText(
        data.ctaLabel,
        locale,
        t("aboutPage.closing.cta"),
      )
    : t("aboutPage.closing.cta")

  const ctaHref =
    data?.ctaHref?.trim() ||
    DEFAULT_ABOUT_CLOSING_BANNER_COPY.ctaHref ||
    APP_ROUTES.public.contact

  const imageSrc =
    data?.imageUrl && isRenderableImageSrc(data.imageUrl)
      ? data.imageUrl
      : adminImage

  const imageAlt = data
    ? resolveBilingualText(
        data.imageAlt,
        locale,
        DEFAULT_ABOUT_CLOSING_BANNER_COPY.imageAlt[locale],
      )
    : DEFAULT_ABOUT_CLOSING_BANNER_COPY.imageAlt[locale]

  return (
    <section className="w-full px-[15px] pb-14 pt-2 md:pb-20 lg:px-[30px]">
      <div className="relative isolate mx-auto flex w-full max-w-[1300px] flex-col items-start overflow-hidden rounded-[24px] bg-[var(--gym-ink,#111111)] px-7 py-12 sm:rounded-[30px] sm:px-12 sm:py-14 lg:flex-row lg:items-center lg:justify-between lg:px-16 lg:py-16">
        <img
          src={imageSrc}
          alt={imageAlt}
          draggable={false}
          className="pointer-events-none absolute inset-0 size-full object-cover object-[68%_center] select-none sm:object-[center_42%]"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 sm:hidden"
          style={{
            background:
              "linear-gradient(180deg, rgba(17,17,17,0.3) 0%, rgba(17,17,17,0.55) 40%, rgba(17,17,17,0.92) 100%)",
          }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 hidden sm:block rtl:-scale-x-100"
          style={{
            background:
              "linear-gradient(90deg, #111111 0%, rgba(17,17,17,0.92) 36%, rgba(17,17,17,0.45) 62%, rgba(17,17,17,0.12) 100%)",
          }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 hidden sm:block bg-[linear-gradient(180deg,rgba(17,17,17,0.15)_0%,rgba(17,17,17,0.55)_100%)]"
        />
        <div className="relative z-10 max-w-[36rem]">
          <h2 className="font-heading text-[28px] font-extrabold leading-[1.15] text-white sm:text-[36px] md:text-[42px]">
            {title}
          </h2>
          <p className="mt-3 text-[15px] leading-relaxed text-white/75 sm:text-[16px]">
            {body}
          </p>
        </div>
        <div className="relative z-10 mt-8 lg:mt-0">
          <ArrowCtaLink to={ctaHref} label={ctaLabel} variant="lime" />
        </div>
      </div>
    </section>
  )
}
