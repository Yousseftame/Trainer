import { useTranslation } from "react-i18next"
import { APP_ROUTES } from "@/config/constants"
import { ArrowCtaLink } from "@/components/public/ArrowCtaLink"
import { useLocale } from "@/hooks/useLocale"
import { cn } from "@/lib/utils"
import heroImage from "@/assets/herosection.png"
import heroPattern from "@/assets/hero-pattern.avif"

export function HeroSection() {
  const { t } = useTranslation()
  const { isRtl } = useLocale()

  return (
    <section className="w-full px-[15px] pb-6 pt-1 md:pb-7 lg:px-[30px]">
      <div className="hero-wrap relative mx-auto min-h-[560px] w-full overflow-hidden rounded-[24px] bg-[var(--gym-dark)] sm:min-h-[640px] sm:rounded-[30px] lg:min-h-[709px]">
        <img
          src={heroImage}
          alt=""
          draggable={false}
          className={cn(
            "pointer-events-none absolute inset-y-0 end-0 z-[1] h-full object-cover select-none",
            isRtl
              ? "w-full object-[18%_center] sm:object-[15%_center]"
              : "w-full object-[0%_center] sm:inset-y-0 sm:-right-[8%] sm:left-auto sm:w-[78%] sm:object-[14%_center] lg:-right-[9%] lg:w-[74%] lg:object-[12%_center]",
          )}
        />

        {/* Soft fade into photo — solid behind text, clear over the subject */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 z-[1]"
          style={{
            background: isRtl
              ? "linear-gradient(270deg, #24030c 0%, #24030c 30%, rgba(36, 3, 12, 0.55) 45%, rgba(36, 3, 12, 0) 62%)"
              : "linear-gradient(90deg, #24030c 0%, #24030c 34%, rgba(36, 3, 12, 0.62) 43%, rgba(36, 3, 12, 0) 52%)",
          }}
        />

        {/* Glass panes pattern */}
        <img
          src={heroPattern}
          alt=""
          aria-hidden
          draggable={false}
          className="pointer-events-none absolute inset-0 z-[2] h-full w-full object-cover object-left opacity-30 select-none rtl:object-right rtl:-scale-x-100"
        />

        {/* Copy */}
        <div
          className={cn(
            "relative z-20 flex min-h-[560px] flex-col justify-center px-8 py-14 sm:min-h-[640px] sm:px-12 lg:min-h-[709px] lg:ps-20 lg:pe-10 lg:py-20 xl:ps-24",
            isRtl ? "lg:max-w-[54%]" : "sm:max-w-[54%] lg:max-w-[46%] xl:max-w-[44%]",
          )}
        >
          <p className="hero-fade hero-fade-1 mb-3 text-[22px] font-extrabold text-white sm:mb-4 sm:text-[28px] lg:text-[38px]">
            {t("hero.greeting")}
          </p>

          <h1 className="hero-fade hero-fade-2 font-heading text-[48px] font-bold leading-[1.05] tracking-tight text-white sm:text-[64px] lg:text-[82px] lg:leading-[90px]">
            {t("hero.titleBefore")}{" "}
            <span className="text-[var(--gym-lime)]">{t("hero.titleAccent")}</span>{" "}
            {t("hero.titleAfter")}
          </h1>

          <p className="hero-fade hero-fade-3 mt-5 max-w-[480px] text-[17px] font-medium leading-relaxed tracking-tight text-white sm:text-[18px]">
            {t("hero.description")}
          </p>

          <div className="hero-fade hero-fade-4 mt-8 sm:mt-10">
            <ArrowCtaLink
              to={APP_ROUTES.public.contact}
              label={t("hero.cta")}
              variant="lime"
            />
          </div>
        </div>

        {/* Watermark — after the text column on both LTR and RTL */}
        <div
          aria-hidden
          className="hero-fade hero-fade-5 pointer-events-none absolute inset-x-0 bottom-0 z-[15] pb-0 ps-[min(16%,7rem)] pe-4 sm:ps-[min(18%,9rem)] lg:ps-[20%]"
        >
          <p className="hero-watermark font-heading select-none whitespace-nowrap text-[clamp(3rem,10vw,7.5rem)] font-semibold uppercase leading-none tracking-tight">
            {t("hero.watermark")}
          </p>
        </div>
      </div>
    </section>
  )
}
