import { useTranslation } from "react-i18next"
import { DiaTextReveal } from "@/components/ui/dia-text-reveal"
import { useCoachingAppBannerQuery } from "@/features/website/hooks"
import { isRenderableImageSrc } from "@/features/website/paths"
import { useLocale } from "@/hooks/useLocale"
import { resolveBilingualText } from "@/lib/program-text"
import secondHero from "@/assets/Second-Hero-1.png"

/** Solid white band — reveal only, no rainbow colors */
const WHITE_REVEAL = ["#ffffff", "#ffffff", "#ffffff"] as const

export function SecondHeroSection() {
  const { t, i18n } = useTranslation()
  const { locale, isRtl } = useLocale()

  const {
    data: content,
    isPending,
    isFetched,
    isError,
  } = useCoachingAppBannerQuery({ audience: "public" })

  const hasCms = Boolean(content)
  const useStaticFallback = isFetched && (isError || !hasCms)
  const awaitingCms = isPending && !hasCms

  const source = hasCms && !useStaticFallback ? content! : null

  const title = source
    ? resolveBilingualText(source.title, locale, t("secondHero.title"))
    : t("secondHero.title")
  const caption = source
    ? resolveBilingualText(
        source.description,
        locale,
        t("secondHero.caption"),
      )
    : t("secondHero.caption")
  const imageAlt = source
    ? resolveBilingualText(source.imageAlt, locale, t("secondHero.imageAlt"))
    : t("secondHero.imageAlt")
  const imageSrc =
    source?.imageUrl && isRenderableImageSrc(source.imageUrl)
      ? source.imageUrl
      : secondHero

  return (
    <section className="relative w-full overflow-hidden px-6 py-14 md:px-10 md:py-20 lg:px-14">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "linear-gradient(160deg, #1a0208 0%, #24030c 38%, #6e001f 58%, #24030c 78%, #1a0208 100%)",
        }}
      />

      <div className="relative z-[1] mx-auto flex w-full max-w-[980px] flex-col items-center">
        {awaitingCms ? (
          <div className="flex w-full flex-col items-center gap-8" aria-hidden>
            <div className="h-10 w-[min(100%,28rem)] animate-pulse rounded-lg bg-white/15" />
            <div className="aspect-[16/10] w-full max-w-[860px] animate-pulse rounded-2xl bg-white/10" />
            <div className="h-5 w-[min(100%,36rem)] animate-pulse rounded-md bg-white/12" />
          </div>
        ) : (
          <>
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
              src={imageSrc}
              alt={imageAlt}
              className="mt-8 h-auto w-full max-w-[860px] select-none object-contain sm:mt-10"
              loading="lazy"
              decoding="async"
              draggable={false}
            />

            <p className="mt-8 max-w-[36em] text-center font-heading text-[17px] font-bold leading-[1.35] text-white/90 sm:mt-10 sm:text-[19px] md:text-[21px] md:leading-[1.35]">
              {caption}
            </p>
          </>
        )}
      </div>
    </section>
  )
}
