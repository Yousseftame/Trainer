import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import { AnimatePresence, motion, type PanInfo } from "motion/react"
import { ArrowCtaLink } from "@/components/public/ArrowCtaLink"
import { useHomeHeroSlidesQuery } from "@/features/website/hooks"
import { useLocale } from "@/hooks/useLocale"
import { resolveBilingualText } from "@/lib/program-text"
import { cn } from "@/lib/utils"
import type { HomeHeroSlide } from "@/types/website"
import heroImage from "@/assets/herosection.png"
import heroPattern from "@/assets/hero-pattern.avif"

const AUTOPLAY_MS = 7000
const SWIPE_THRESHOLD = 56
const SLIDE_EASE = [0.22, 1, 0.36, 1] as const
const SLIDE_DURATION = 0.78

type HeroPanelContent = {
  id: string
  imageSrc: string
  greeting: string
  titleBefore: string
  titleAccent: string
  titleAfter: string
  description: string
  cta: string
  watermark: string
}

function slideToPanel(
  slide: HomeHeroSlide,
  locale: "en" | "ar",
): HeroPanelContent {
  return {
    id: slide.id,
    imageSrc: slide.imageUrl,
    greeting: resolveBilingualText(slide.greeting, locale),
    titleBefore: resolveBilingualText(slide.titleBefore, locale),
    titleAccent: resolveBilingualText(slide.titleAccent, locale),
    titleAfter: resolveBilingualText(slide.titleAfter, locale),
    description: resolveBilingualText(slide.description, locale),
    cta: resolveBilingualText(slide.cta, locale),
    watermark: resolveBilingualText(slide.watermark, locale),
  }
}

function HeroPanel({
  content,
  isRtl,
  animateEntrance,
}: {
  content: HeroPanelContent
  isRtl: boolean
  animateEntrance: boolean
}) {
  const fade = (n: number) =>
    animateEntrance ? `hero-fade hero-fade-${n}` : undefined

  return (
    <div className="hero-wrap relative mx-auto min-h-[560px] w-full overflow-hidden rounded-[24px] bg-[var(--gym-dark)] sm:min-h-[640px] sm:rounded-[30px] lg:min-h-[709px]">
      <img
        src={content.imageSrc}
        alt=""
        draggable={false}
        className={cn(
          "pointer-events-none absolute inset-y-0 end-0 z-[1] h-full object-cover select-none",
          isRtl
            ? "w-full object-[18%_center] sm:object-[15%_center]"
            : "w-full object-[0%_center] sm:inset-y-0 sm:-right-[8%] sm:left-auto sm:w-[78%] sm:object-[14%_center] lg:-right-[9%] lg:w-[74%] lg:object-[12%_center]",
        )}
      />

      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-[1]"
        style={{
          background: isRtl
            ? "linear-gradient(270deg, #24030c 0%, #24030c 30%, rgba(36, 3, 12, 0.55) 45%, rgba(36, 3, 12, 0) 62%)"
            : "linear-gradient(90deg, #24030c 0%, #24030c 34%, rgba(36, 3, 12, 0.62) 43%, rgba(36, 3, 12, 0) 52%)",
        }}
      />

      <img
        src={heroPattern}
        alt=""
        aria-hidden
        draggable={false}
        className="pointer-events-none absolute inset-0 z-[2] h-full w-full object-cover object-left opacity-30 select-none rtl:object-right rtl:-scale-x-100"
      />

      <div
        className={cn(
          "relative z-20 flex min-h-[560px] flex-col justify-center px-8 py-14 sm:min-h-[640px] sm:px-12 lg:min-h-[709px] lg:ps-20 lg:pe-10 lg:py-20 xl:ps-24",
          isRtl ? "lg:max-w-[54%]" : "sm:max-w-[54%] lg:max-w-[46%] xl:max-w-[44%]",
        )}
      >
        <p
          className={cn(
            "mb-3 text-[22px] font-extrabold text-white sm:mb-4 sm:text-[28px] lg:text-[38px]",
            fade(1),
          )}
        >
          {content.greeting}
        </p>

        <h1
          className={cn(
            "font-heading text-[48px] font-bold leading-[1.05] tracking-tight text-white sm:text-[64px] lg:text-[82px] lg:leading-[90px]",
            fade(2),
          )}
        >
          {content.titleBefore}{" "}
          <span className="text-[var(--gym-lime)]">{content.titleAccent}</span>{" "}
          {content.titleAfter}
        </h1>

        <p
          className={cn(
            "mt-5 max-w-[480px] text-[17px] font-medium leading-relaxed tracking-tight text-white sm:text-[18px]",
            fade(3),
          )}
        >
          {content.description}
        </p>

        <div className={cn("mt-8 sm:mt-10", fade(4))}>
          <ArrowCtaLink to="#contact" label={content.cta} variant="lime" />
        </div>
      </div>

      <div
        aria-hidden
        className={cn(
          "pointer-events-none absolute inset-x-0 bottom-0 z-[15] pb-0 ps-[min(16%,7rem)] pe-4 sm:ps-[min(18%,9rem)] lg:ps-[20%]",
          fade(5),
        )}
      >
        <p className="hero-watermark font-heading select-none whitespace-nowrap text-[clamp(3rem,10vw,7.5rem)] font-semibold uppercase leading-none tracking-tight">
          {content.watermark}
        </p>
      </div>
    </div>
  )
}

export function HeroSection() {
  const { t } = useTranslation()
  const { locale, isRtl } = useLocale()
  const {
    data: cmsSlides,
    isPending,
    isError,
    isFetched,
  } = useHomeHeroSlidesQuery({
    audience: "public",
  })

  const fallbackPanel = useMemo<HeroPanelContent>(
    () => ({
      id: "static-fallback",
      imageSrc: heroImage,
      greeting: t("hero.greeting"),
      titleBefore: t("hero.titleBefore"),
      titleAccent: t("hero.titleAccent"),
      titleAfter: t("hero.titleAfter"),
      description: t("hero.description"),
      cta: t("hero.cta"),
      watermark: t("hero.watermark"),
    }),
    [t],
  )

  const hasCmsSlides = Boolean(cmsSlides && cmsSlides.length > 0)
  // Static default only after we know there is no CMS data (or fetch failed).
  const useStaticFallback = isFetched && (isError || !hasCmsSlides)
  const awaitingCms = isPending && !hasCmsSlides

  const panels = useMemo(() => {
    if (hasCmsSlides && cmsSlides) {
      return cmsSlides.map((slide) => slideToPanel(slide, locale))
    }
    if (useStaticFallback) return [fallbackPanel]
    return []
  }, [cmsSlides, fallbackPanel, hasCmsSlides, locale, useStaticFallback])

  const multi = panels.length > 1
  const [currentIndex, setCurrentIndex] = useState(0)
  const [direction, setDirection] = useState<1 | -1>(1)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    setCurrentIndex(0)
  }, [panels.length])

  useEffect(() => {
    if (!multi) return
    const next = panels[(currentIndex + 1) % panels.length]
    const prev = panels[(currentIndex - 1 + panels.length) % panels.length]
    for (const panel of [next, prev]) {
      if (!panel?.imageSrc) continue
      const img = new Image()
      img.src = panel.imageSrc
    }
  }, [currentIndex, multi, panels])

  const paginate = useCallback(
    (newDirection: 1 | -1) => {
      if (!multi) return
      setDirection(newDirection)
      setCurrentIndex(
        (prev) => (prev + newDirection + panels.length) % panels.length,
      )
    },
    [multi, panels.length],
  )

  const goToSlide = (index: number) => {
    if (index === currentIndex) return
    setDirection(index > currentIndex ? 1 : -1)
    setCurrentIndex(index)
  }

  useEffect(() => {
    if (!multi) return
    timerRef.current = setInterval(() => {
      paginate(1)
    }, AUTOPLAY_MS)
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [paginate, multi])

  const handleDragEnd = (
    _e: MouseEvent | TouchEvent | PointerEvent,
    info: PanInfo,
  ) => {
    if (!multi) return
    const swipeFactor = isRtl ? -1 : 1
    const effectiveOffset = info.offset.x * swipeFactor
    if (
      effectiveOffset < -SWIPE_THRESHOLD ||
      info.velocity.x * swipeFactor < -300
    ) {
      paginate(1)
    } else if (
      effectiveOffset > SWIPE_THRESHOLD ||
      info.velocity.x * swipeFactor > 300
    ) {
      paginate(-1)
    }
  }

  const current = panels[currentIndex]

  // Full-viewport travel so the rounded banner leaves/enters past the screen edge
  // (same feel as Transformations gallery cards exiting the page).
  const variants = {
    enter: (dir: number) => ({
      x: dir > 0 ? (isRtl ? "-100vw" : "100vw") : isRtl ? "100vw" : "-100vw",
    }),
    center: {
      x: 0,
      transition: {
        x: { type: "tween" as const, duration: SLIDE_DURATION, ease: SLIDE_EASE },
      },
    },
    exit: (dir: number) => ({
      x: dir > 0 ? (isRtl ? "100vw" : "-100vw") : isRtl ? "-100vw" : "100vw",
      transition: {
        x: { type: "tween" as const, duration: SLIDE_DURATION, ease: SLIDE_EASE },
      },
    }),
  }

  return (
    <section className="w-full pb-6 pt-1 md:pb-7">
      {awaitingCms || !current ? (
        <div className="px-[15px] lg:px-[30px]">
          <div
            aria-hidden
            className="hero-wrap relative mx-auto min-h-[560px] w-full overflow-hidden rounded-[24px] bg-[var(--gym-dark)] sm:min-h-[640px] sm:rounded-[30px] lg:min-h-[709px]"
          >
            <div
              className="pointer-events-none absolute inset-0"
              style={{
                background: isRtl
                  ? "linear-gradient(270deg, #24030c 0%, #24030c 30%, rgba(36, 3, 12, 0.55) 45%, rgba(36, 3, 12, 0) 62%)"
                  : "linear-gradient(90deg, #24030c 0%, #24030c 34%, rgba(36, 3, 12, 0.62) 43%, rgba(36, 3, 12, 0) 52%)",
              }}
            />
            <img
              src={heroPattern}
              alt=""
              draggable={false}
              className="pointer-events-none absolute inset-0 h-full w-full object-cover object-left opacity-20 select-none rtl:object-right rtl:-scale-x-100"
            />
          </div>
        </div>
      ) : !multi ? (
        <div className="px-[15px] lg:px-[30px]">
          <HeroPanel content={current} isRtl={isRtl} animateEntrance />
        </div>
      ) : (
        <div className="relative">
          {/* Full-bleed stage: clips at the viewport edge, not the card edge */}
          <div className="relative left-1/2 w-screen max-w-[100vw] -translate-x-1/2 overflow-hidden">
            <div className="relative min-h-[560px] px-[15px] sm:min-h-[640px] lg:min-h-[709px] lg:px-[30px]">
              <AnimatePresence initial={false} custom={direction}>
                <motion.div
                  key={current.id}
                  custom={direction}
                  variants={variants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  drag="x"
                  dragConstraints={{ left: 0, right: 0 }}
                  dragElastic={0.12}
                  onDragEnd={handleDragEnd}
                  className="absolute inset-x-[15px] top-0 w-auto cursor-grab will-change-transform active:cursor-grabbing lg:inset-x-[30px]"
                  style={{ touchAction: "pan-y" }}
                >
                  <HeroPanel
                    content={current}
                    isRtl={isRtl}
                    animateEntrance={false}
                  />
                </motion.div>
              </AnimatePresence>
            </div>
          </div>

          <div className="mt-4 flex items-center justify-center gap-2 px-[15px] lg:px-[30px]">
            {panels.map((panel, idx) => {
              const isActive = idx === currentIndex
              return (
                <button
                  key={panel.id}
                  type="button"
                  onClick={() => goToSlide(idx)}
                  aria-label={`Banner ${idx + 1}`}
                  aria-current={isActive ? "true" : undefined}
                  className={cn(
                    "h-2 rounded-full transition-all duration-300",
                    isActive
                      ? "w-7 bg-[var(--gym-lime,#fb5001)]"
                      : "w-2 bg-[var(--gym-ink,#111111)]/20 hover:bg-[var(--gym-ink,#111111)]/40",
                  )}
                />
              )
            })}
          </div>
        </div>
      )}
    </section>
  )
}
