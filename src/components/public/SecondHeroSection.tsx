import { useTranslation } from "react-i18next"
import { DiaTextReveal } from "@/components/ui/dia-text-reveal"
import { useLocale } from "@/hooks/useLocale"
import secondHero from "@/assets/Second-Hero-1.png"

/** Solid white band — reveal only, no rainbow colors */
const WHITE_REVEAL = ["#ffffff", "#ffffff", "#ffffff"] as const

export function SecondHeroSection() {
  const { t, i18n } = useTranslation()
  const { isRtl } = useLocale()
  const title = t("secondHero.title")

  return (
    <section className="relative w-full overflow-hidden px-6 py-14 md:px-10 md:py-20 lg:px-14">
      {/* Same dark green family as hero / announcement bar */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "linear-gradient(160deg, #1a0208 0%, #24030c 38%, #6e001f 58%, #24030c 78%, #1a0208 100%)",
        }}
      />

      <div className="relative z-[1] mx-auto flex w-full max-w-[980px] flex-col items-center">
        <h2 className="max-w-[18ch] text-center sm:max-w-[22ch] md:max-w-none">
          <DiaTextReveal
            key={`${i18n.language}:${title}`}
            text={title}
            textColor="#ffffff"
            colors={[...WHITE_REVEAL]}
            direction={isRtl ? "rtl" : "ltr"}
            duration={1.65}
            delay={0.05}
            startOnView
            once
            className="block w-full text-center font-heading text-[30px] font-bold leading-[1.15] sm:text-[36px] md:text-[42px] lg:text-[46px]"
          />
        </h2>

        <img
          src={secondHero}
          alt={t("secondHero.imageAlt")}
          className="mt-8 h-auto w-full max-w-[860px] select-none object-contain sm:mt-10"
          loading="lazy"
          decoding="async"
          draggable={false}
        />

        <p className="mt-8 max-w-[36em] text-center font-heading text-[17px] font-bold leading-[1.35] text-white/90 sm:mt-10 sm:text-[19px] md:text-[21px] md:leading-[1.35]">
          {t("secondHero.caption")}
        </p>
      </div>
    </section>
  )
}
