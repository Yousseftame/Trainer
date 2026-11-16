import { Link } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { ArrowLeft, ArrowRight } from "lucide-react"
import { APP_ROUTES } from "@/config/constants"
import {
  DEFAULT_ABOUT_HERO_COPY,
  isRenderableImageSrc,
  useAboutHeroContentQuery,
} from "@/features/website"
import { useLocale } from "@/hooks/useLocale"
import { resolveBilingualText } from "@/lib/program-text"
import { cn } from "@/lib/utils"
import heroPattern from "@/assets/hero-pattern.avif"
import whoIAmImage from "@/assets/whoiam.avif"

export function AboutHeroSection() {
  const { t } = useTranslation()
  const { locale, isRtl } = useLocale()
  const { data: content } = useAboutHeroContentQuery({ audience: "public" })

  const BackIcon = isRtl ? ArrowRight : ArrowLeft

  const hasCmsImage = Boolean(
    content?.imageUrl && isRenderableImageSrc(content.imageUrl),
  )
  const imageSrc = hasCmsImage ? content!.imageUrl : whoIAmImage
  const imageAlt = content
    ? resolveBilingualText(
        content.imageAlt,
        locale,
        DEFAULT_ABOUT_HERO_COPY.imageAlt[locale],
      )
    : DEFAULT_ABOUT_HERO_COPY.imageAlt[locale]

  const name = content
    ? resolveBilingualText(content.name, locale, t("aboutPage.name"))
    : t("aboutPage.name")
  const headline = content
    ? resolveBilingualText(content.headline, locale, t("aboutPage.headline"))
    : t("aboutPage.headline")
  const lead = content
    ? resolveBilingualText(content.lead, locale, t("aboutPage.lead"))
    : t("aboutPage.lead")
  const leadSecondary = content
    ? resolveBilingualText(
        content.leadSecondary,
        locale,
        t("aboutPage.leadSecondary"),
      )
    : t("aboutPage.leadSecondary")
  const yearsValue = content
    ? resolveBilingualText(content.yearsValue, locale, t("whoIAm.yearsValue"))
    : t("whoIAm.yearsValue")
  const yearsLabel = content
    ? resolveBilingualText(content.yearsLabel, locale, t("whoIAm.yearsLabel"))
    : t("whoIAm.yearsLabel")
  const metaTitle = content
    ? resolveBilingualText(content.metaTitle, locale, t("aboutPage.metaTitle"))
    : t("aboutPage.metaTitle")
  const metaBody = content
    ? resolveBilingualText(content.metaBody, locale, t("aboutPage.metaBody"))
    : t("aboutPage.metaBody")

  return (
    <section className="relative w-full overflow-hidden bg-[var(--gym-dark)]">
      <img
        src={imageSrc}
        alt={imageAlt}
        className={cn(
          "pointer-events-none absolute z-[1] object-cover select-none",
          "inset-0 size-full",
          isRtl
            ? "object-[62%_18%] sm:inset-y-0 sm:start-auto sm:end-0 sm:h-full sm:w-[64%] sm:object-[22%_center] lg:w-[58%] lg:object-[18%_center]"
            : "object-[38%_18%] sm:inset-y-0 sm:start-auto sm:end-0 sm:h-full sm:w-[64%] sm:object-[18%_center] lg:w-[58%] lg:object-[14%_center]",
        )}
        draggable={false}
      />

      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-[1] sm:hidden"
        style={{
          background:
            "linear-gradient(180deg, rgba(36,3,12,0.82) 0%, rgba(36,3,12,0.78) 28%, rgba(36,3,12,0.72) 58%, rgba(36,3,12,0.88) 100%)",
        }}
      />

      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-[1] hidden sm:block"
        style={{
          background: isRtl
            ? "linear-gradient(270deg, #24030c 0%, #24030c 38%, rgba(36,3,12,0.92) 48%, rgba(36,3,12,0.45) 62%, rgba(36,3,12,0) 78%)"
            : "linear-gradient(90deg, #24030c 0%, #24030c 40%, rgba(36,3,12,0.92) 50%, rgba(36,3,12,0.45) 64%, rgba(36,3,12,0) 80%)",
        }}
      />

      <img
        src={heroPattern}
        alt=""
        aria-hidden
        draggable={false}
        className="pointer-events-none absolute inset-0 z-[2] h-full w-full object-cover object-left opacity-20 select-none sm:opacity-25 rtl:object-right rtl:-scale-x-100"
      />

      <div className="relative z-20 mx-auto flex w-full max-w-[1300px] flex-col justify-start px-5 pb-10 pt-5 sm:min-h-[640px] sm:justify-center sm:px-10 sm:py-16 lg:min-h-[760px] lg:px-14 lg:py-20 xl:px-6">
        <div
          className={cn(
            "w-full max-w-[40rem]",
            isRtl
              ? "sm:max-w-[48%] lg:max-w-[42rem]"
              : "sm:max-w-[48%] lg:max-w-[44rem]",
          )}
        >
          <Link
            to={APP_ROUTES.public.home}
            className="hero-fade hero-fade-1 mb-5 inline-flex w-fit items-center gap-2 text-[13px] font-semibold text-white/70 transition-colors hover:text-white sm:mb-8 sm:text-[14px]"
          >
            <BackIcon className="size-4" strokeWidth={2.25} aria-hidden />
            {t("aboutPage.backHome")}
          </Link>

          <div className="hero-fade hero-fade-1 flex flex-col gap-1.5 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-4 sm:gap-y-2">
            <p
              className={cn(
                "text-[12px] font-extrabold uppercase text-[var(--gym-lime)] sm:text-[14px]",
                isRtl ? "tracking-normal" : "tracking-[0.14em]",
              )}
            >
              {t("aboutPage.eyebrow")}
            </p>
            <span
              aria-hidden
              className="hidden h-3 w-px bg-white/25 sm:block"
            />
            <p className="text-[12px] font-semibold text-white/60 sm:text-[14px]">
              {t("aboutPage.role")}
            </p>
          </div>

          <h1 className="hero-fade hero-fade-2 mt-4 sm:mt-5">
            <span
              className={cn(
                "block font-heading text-[14px] font-bold text-white/70 sm:text-[17px]",
                isRtl ? "tracking-normal" : "tracking-[0.04em]",
              )}
            >
              {t("aboutPage.nameLabel")}
            </span>
            <span
              className={cn(
                "mt-1.5 block font-heading text-[36px] font-extrabold leading-[1.08] text-white sm:mt-2 sm:text-[58px] lg:text-[72px]",
                isRtl ? "tracking-normal" : "tracking-tight",
              )}
            >
              {name}
            </span>
          </h1>

          <p
            className={cn(
              "hero-fade hero-fade-3 mt-4 max-w-[22ch] font-heading text-[20px] font-bold leading-[1.3] text-white sm:mt-7 sm:max-w-[22ch] sm:text-[30px] lg:text-[34px]",
              isRtl && "max-w-[16ch] tracking-normal sm:max-w-[18ch]",
            )}
          >
            {headline}
          </p>

          <div className="hero-fade hero-fade-4 mt-4 max-w-[36em] space-y-3 sm:mt-7 sm:space-y-4">
            <p className="text-[14px] font-medium leading-[1.7] text-white/82 sm:text-[16px] sm:leading-[1.75]">
              {lead}
            </p>
            <p className="text-[14px] font-medium leading-[1.7] text-white/70 sm:text-[16px] sm:leading-[1.75]">
              {leadSecondary}
            </p>
          </div>

          <div className="hero-fade hero-fade-5 mt-7 flex flex-wrap items-end gap-x-7 gap-y-4 border-t border-white/15 pt-5 sm:mt-11 sm:gap-x-12 sm:pt-7">
            <div>
              <p className="font-heading text-[32px] font-extrabold leading-none text-[var(--gym-lime)] sm:text-[42px]">
                {yearsValue}
              </p>
              <p className="mt-1.5 text-[11px] font-semibold text-white/60 sm:text-[13px]">
                {yearsLabel}
              </p>
            </div>
            <div className="max-w-[15rem]">
              <p className="font-heading text-[14px] font-bold text-white sm:text-[16px]">
                {metaTitle}
              </p>
              <p className="mt-1.5 text-[12px] leading-snug text-white/60 sm:text-[14px]">
                {metaBody}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
