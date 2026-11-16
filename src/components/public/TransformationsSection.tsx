import { useEffect, useEffectEvent, useId, useMemo, useRef, useState } from "react"
import { createPortal } from "react-dom"
import { Link } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { AnimatePresence, motion } from "motion/react"
import { ArrowLeft, ArrowRight, X } from "lucide-react"
import {
  pickTransformationsForLoop,
  useTransformationItemsQuery,
} from "@/features/website"
import { APP_ROUTES } from "@/config/constants"
import { useLocale } from "@/hooks/useLocale"
import { resolveBilingualText } from "@/lib/program-text"
import { cn } from "@/lib/utils"
import hoverIcon from "@/assets/gallery/hover-icon.svg"
import gallery02 from "@/assets/gallery/6757f6685db1adece749f71a_cc286e43a2f9cd6232b2f6e5c6ed4be6_gallery-image-02.avif"
import gallery03 from "@/assets/gallery/6757f66821429a6cd7446d56_733051bf79ad056a7cf7f0ab0cd3c166_gallery-image-03.avif"
import gallery04 from "@/assets/gallery/6757f668eb422a288c7d88a6_266a3dd91c4716421c652ec035edacfa_gallery-image-04.avif"
import gallery05 from "@/assets/gallery/6757f66825bfb94fb1e33fa8_dcabc1dad11785a8a7c25849e0c9234d_gallery-image-05.avif"
import gallery06 from "@/assets/gallery/6757f668750b42ca3dcd9555_gallery-image-06.avif"
import gallery07 from "@/assets/gallery/6757f668f59653b165679b74_60ba3c56e36cf1be0f42a51b5a288205_gallery-image-07.avif"
import gallery08 from "@/assets/gallery/6757f668f68e568a0d457849_aabff8eafa3a9dc8fc8245ff8d3db1c8_gallery-image-08.avif"

type GallerySlide = {
  id: string
  imageUrl: string
  name: string
  description: string
  date: string
  alt: string
}

/** GymTrainer gallery assets — native 800×600 before/after composites */
const STATIC_GALLERY_URLS = [
  gallery02,
  gallery03,
  gallery04,
  gallery05,
  gallery06,
  gallery07,
  gallery08,
] as const

/** Static reference: 7 cards ≈ 80s / 90s — keep the same px/s for short CMS rows */
const MARQUEE_REF_COUNT = 7
const MARQUEE_DURATION_LEFT_SEC = 80
const MARQUEE_DURATION_RIGHT_SEC = 90
/** Enough copies so one set usually covers the viewport; still keeps CMS order. */
const MARQUEE_MIN_SET_COUNT = 4

function buildStaticSlides(
  imageAlt: (n: number) => string,
): GallerySlide[] {
  return STATIC_GALLERY_URLS.map((url, index) => ({
    id: `static-${index}`,
    imageUrl: url,
    name: "",
    description: "",
    date: "",
    alt: imageAlt(index + 1),
  }))
}

/**
 * Repeat unique slides until the set is wide enough for a seamless -50% loop.
 * Keeps original ids so lightbox open still resolves correctly.
 */
function padSlidesForMarquee(slides: GallerySlide[]): GallerySlide[] {
  if (slides.length === 0 || slides.length >= MARQUEE_MIN_SET_COUNT) {
    return slides
  }
  const out: GallerySlide[] = []
  let i = 0
  while (out.length < MARQUEE_MIN_SET_COUNT) {
    out.push(slides[i % slides.length]!)
    i += 1
  }
  return out
}

function marqueeDurationSec(
  slideCount: number,
  direction: "left" | "right",
): number {
  const base =
    direction === "right"
      ? MARQUEE_DURATION_RIGHT_SEC
      : MARQUEE_DURATION_LEFT_SEC
  const count = Math.max(slideCount, 1)
  return Math.max(12, (count / MARQUEE_REF_COUNT) * base)
}

function GalleryCard({
  slide,
  onOpen,
}: {
  slide: GallerySlide
  onOpen: () => void
}) {
  const name = slide.name.trim()
  const date = slide.date.trim()
  const description = slide.description.trim()
  const hasCopy = Boolean(name || description || date)

  return (
    <button
      type="button"
      onClick={onOpen}
      className="gallery-card group relative shrink-0 cursor-zoom-in overflow-hidden rounded-[30px] text-start outline-none focus-visible:ring-2 focus-visible:ring-[var(--gym-lime)] focus-visible:ring-offset-2"
      aria-label={slide.alt}
    >
      <img
        src={slide.imageUrl}
        alt=""
        className="gallery-card__image pointer-events-none block size-full object-cover"
        loading="eager"
        decoding="async"
        draggable={false}
      />
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-[30px] bg-[var(--gym-dark)] opacity-0 transition-opacity duration-300 group-hover:opacity-50 group-focus-visible:opacity-50"
      />
      <span className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-1.5 px-4 opacity-0 transition-opacity duration-300 group-hover:opacity-100 group-focus-visible:opacity-100 sm:gap-2 sm:px-5">
        {hasCopy && name ? (
          <span className="line-clamp-2 max-w-[90%] break-words text-center font-heading text-[15px] font-bold leading-snug text-white sm:text-[17px] md:text-[18px]">
            {name}
          </span>
        ) : null}
        {hasCopy && date ? (
          <span className="max-w-[90%] break-words text-center text-[11px] font-semibold tracking-[0.06em] text-[var(--gym-lime,#fb5001)] sm:text-[12px]">
            {date}
          </span>
        ) : null}
        <img
          src={hoverIcon}
          alt=""
          aria-hidden
          className="mt-0.5 size-10 shrink-0 sm:mt-1 sm:size-[50px]"
        />
        {hasCopy && description ? (
          <span className="line-clamp-2 max-w-[92%] break-words text-center text-[12px] font-medium leading-snug text-white/85 sm:text-[13px] md:text-[14px]">
            {description}
          </span>
        ) : null}
      </span>
    </button>
  )
}

function GallerySet({
  slides,
  ariaHidden = false,
  onOpen,
  setKey,
}: {
  slides: GallerySlide[]
  ariaHidden?: boolean
  onOpen: (id: string) => void
  setKey: string
}) {
  return (
    <div
      className="gallery-marquee__set flex shrink-0 items-stretch"
      aria-hidden={ariaHidden || undefined}
    >
      {slides.map((slide, index) => (
        <GalleryCard
          key={`${setKey}-${slide.id}-${index}`}
          slide={slide}
          onOpen={() => onOpen(slide.id)}
        />
      ))}
    </div>
  )
}

function GalleryRow({
  slides,
  direction,
  onOpen,
  trackKey,
  isRtl,
}: {
  slides: GallerySlide[]
  direction: "left" | "right"
  onOpen: (id: string) => void
  trackKey: string
  isRtl: boolean
}) {
  if (slides.length === 0) return null

  const padded = padSlidesForMarquee(slides)
  const durationSec = marqueeDurationSec(padded.length, direction)

  return (
    <div
      dir="ltr"
      className={cn(
        "gallery-marquee",
        direction === "right" && "gallery-marquee--reverse",
        isRtl && "gallery-marquee--rtl",
      )}
    >
      <div
        key={trackKey}
        className="gallery-marquee__track"
        style={
          {
            "--gallery-marquee-duration": `${durationSec}s`,
          } as React.CSSProperties
        }
      >
        <GallerySet
          slides={padded}
          onOpen={onOpen}
          setKey={`${trackKey}-a`}
        />
        <GallerySet
          slides={padded}
          ariaHidden
          onOpen={onOpen}
          setKey={`${trackKey}-b`}
        />
      </div>
    </div>
  )
}

function GalleryLightbox({
  slides,
  index,
  onClose,
  onIndexChange,
}: {
  slides: GallerySlide[]
  index: number
  onClose: () => void
  onIndexChange: (next: number) => void
}) {
  const { t } = useTranslation()
  const { isRtl } = useLocale()
  const titleId = useId()
  const dialogRef = useRef<HTMLDivElement>(null)
  const touchStartX = useRef<number | null>(null)
  const total = slides.length
  const slide = slides[index]

  const goPrev = useEffectEvent(() => {
    onIndexChange((index - 1 + total) % total)
  })

  const goNext = useEffectEvent(() => {
    onIndexChange((index + 1) % total)
  })

  useEffect(() => {
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"
    document.body.classList.add("gallery-lightbox-open")
    dialogRef.current?.focus()

    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault()
        onClose()
        return
      }
      if (event.key === "ArrowLeft") {
        event.preventDefault()
        if (isRtl) goNext()
        else goPrev()
      }
      if (event.key === "ArrowRight") {
        event.preventDefault()
        if (isRtl) goPrev()
        else goNext()
      }
    }

    window.addEventListener("keydown", onKey)
    return () => {
      document.body.style.overflow = prevOverflow
      document.body.classList.remove("gallery-lightbox-open")
      window.removeEventListener("keydown", onKey)
    }
  }, [isRtl, onClose])

  function onTouchStart(event: React.TouchEvent) {
    touchStartX.current = event.changedTouches[0]?.clientX ?? null
  }

  function onTouchEnd(event: React.TouchEvent) {
    const start = touchStartX.current
    const end = event.changedTouches[0]?.clientX
    touchStartX.current = null
    if (start == null || end == null) return
    const delta = end - start
    if (Math.abs(delta) < 48) return
    if (delta < 0) {
      if (isRtl) goPrev()
      else goNext()
    } else if (isRtl) goNext()
    else goPrev()
  }

  if (!slide) return null

  const PrevIcon = isRtl ? ArrowRight : ArrowLeft
  const NextIcon = isRtl ? ArrowLeft : ArrowRight
  const hasDetails = Boolean(
    slide.name.trim() || slide.description.trim() || slide.date.trim(),
  )
  const showNav = total > 1

  return createPortal(
    <motion.div
      key="gallery-lightbox"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      ref={dialogRef}
      tabIndex={-1}
      dir={isRtl ? "rtl" : "ltr"}
      className="fixed inset-0 z-[10000] flex flex-col bg-[#0a0a0a] outline-none"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.22 }}
      onClick={onClose}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      <h2 id={titleId} className="sr-only">
        {t("transformations.lightboxTitle")}
      </h2>

      <div className="relative z-20 flex shrink-0 items-center justify-between gap-3 px-4 pb-1 pt-[max(0.75rem,env(safe-area-inset-top))] sm:px-6 sm:pt-4">
        <p
          dir="ltr"
          className="font-heading text-[14px] font-semibold tabular-nums text-white/75 sm:text-[15px]"
        >
          {t("transformations.counter", { current: index + 1, total })}
        </p>
        <button
          type="button"
          onClick={onClose}
          className="inline-flex size-10 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gym-lime)] sm:size-11"
          aria-label={t("transformations.close")}
        >
          <X className="size-5" strokeWidth={2.25} />
        </button>
      </div>

      <div
        className="relative flex min-h-0 flex-1 flex-col"
        onClick={(event) => event.stopPropagation()}
      >
        {showNav ? (
          <>
            <button
              type="button"
              onClick={goPrev}
              className={cn(
                "absolute top-[38%] z-20 inline-flex size-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gym-lime)] sm:size-12",
                isRtl ? "right-3 sm:right-5" : "left-3 sm:left-5",
              )}
              aria-label={t("transformations.prev")}
            >
              <PrevIcon className="size-5 sm:size-6" strokeWidth={2.25} />
            </button>
            <button
              type="button"
              onClick={goNext}
              className={cn(
                "absolute top-[38%] z-20 inline-flex size-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gym-lime)] sm:size-12",
                isRtl ? "left-3 sm:left-5" : "right-3 sm:right-5",
              )}
              aria-label={t("transformations.next")}
            >
              <NextIcon className="size-5 sm:size-6" strokeWidth={2.25} />
            </button>
          </>
        ) : null}

        <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-3 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:gap-4 sm:px-16 md:px-20">
          <AnimatePresence mode="wait">
            <motion.div
              key={slide.id}
              className="flex w-full max-w-[920px] flex-col items-center"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              <img
                src={slide.imageUrl}
                alt={slide.alt}
                className={cn(
                  "mx-auto block h-auto w-auto max-w-full rounded-[14px] object-contain shadow-[0_20px_60px_rgba(0,0,0,0.45)] sm:rounded-[20px] md:rounded-[24px]",
                  hasDetails
                    ? "max-h-[min(56dvh,640px)] sm:max-h-[min(60dvh,700px)]"
                    : "max-h-[min(78dvh,820px)]",
                )}
                draggable={false}
              />

              {hasDetails ? (
                <div className="mt-3 w-full max-w-[560px] px-1 text-center sm:mt-4">
                  {slide.name.trim() ? (
                    <p className="break-words font-heading text-[20px] font-bold leading-snug text-white sm:text-[24px] md:text-[26px]">
                      {slide.name}
                    </p>
                  ) : null}
                  {slide.date.trim() ? (
                    <p className="mt-1.5 break-words text-[12px] font-semibold tracking-[0.06em] text-[#fb5001] sm:text-[13px]">
                      {slide.date}
                    </p>
                  ) : null}
                  {slide.description.trim() ? (
                    <p className="mt-2 line-clamp-4 break-words text-[13px] font-medium leading-relaxed text-white/75 [overflow-wrap:anywhere] sm:mt-2.5 sm:line-clamp-5 sm:text-[14px] md:text-[15px]">
                      {slide.description}
                    </p>
                  ) : null}
                </div>
              ) : null}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </motion.div>,
    document.body,
  )
}

export function TransformationsSection() {
  const { t, i18n } = useTranslation()
  const { locale, isRtl } = useLocale()
  const { data: cmsItems } = useTransformationItemsQuery({ audience: "public" })
  const [activeIndex, setActiveIndex] = useState<number | null>(null)
  const trackKey = i18n.language

  const { topSlides, bottomSlides, lightboxSlides } = useMemo(() => {
    if (cmsItems && cmsItems.length > 0) {
      const top = pickTransformationsForLoop(cmsItems, "top").map((item) => ({
        id: item.id,
        imageUrl: item.imageUrl,
        name: resolveBilingualText(item.name, locale),
        description: resolveBilingualText(item.description, locale),
        date: resolveBilingualText(item.date, locale),
        alt:
          resolveBilingualText(item.imageAlt, locale) ||
          resolveBilingualText(item.name, locale),
      }))
      const bottom = pickTransformationsForLoop(cmsItems, "bottom").map(
        (item) => ({
          id: item.id,
          imageUrl: item.imageUrl,
          name: resolveBilingualText(item.name, locale),
          description: resolveBilingualText(item.description, locale),
          date: resolveBilingualText(item.date, locale),
          alt:
            resolveBilingualText(item.imageAlt, locale) ||
            resolveBilingualText(item.name, locale),
        }),
      )
      // Lightbox navigates unique live slides (top then bottom), no duplicates.
      const seen = new Set<string>()
      const lightbox: GallerySlide[] = []
      for (const slide of [...top, ...bottom]) {
        if (seen.has(slide.id)) continue
        seen.add(slide.id)
        lightbox.push(slide)
      }
      return {
        topSlides: top,
        bottomSlides: bottom,
        lightboxSlides: lightbox,
      }
    }

    const staticSlides = buildStaticSlides((n) =>
      t("transformations.imageAlt", { n }),
    )
    return {
      topSlides: staticSlides,
      bottomSlides: [...staticSlides].reverse(),
      lightboxSlides: staticSlides,
    }
  }, [cmsItems, locale, t])

  function openById(id: string) {
    const index = lightboxSlides.findIndex((slide) => slide.id === id)
    if (index >= 0) setActiveIndex(index)
  }

  return (
    <section
      id="transformations"
      className="gallery-section w-full scroll-mt-24 overflow-hidden bg-white pb-[48px] pt-4 sm:pb-[60px] sm:pt-5 md:pb-16 md:pt-6 lg:pb-20 lg:pt-8"
    >
      <div className="mx-auto w-full max-w-[1300px] px-6 md:px-10 lg:px-14">
        <div className="flex flex-col items-start justify-between gap-5 sm:gap-6 md:flex-row md:items-center md:gap-10 lg:gap-20">
          <h2
            className={cn(
              "font-heading text-[28px] font-bold leading-[1.2] text-[var(--gym-ink)] sm:text-[36px] md:text-[46px] lg:text-[52px]",
              isRtl ? "max-w-[14ch]" : "max-w-[16ch]",
            )}
          >
            {t("transformations.title")}
          </h2>

          <Link
            to={APP_ROUTES.public.about}
            className="group inline-flex h-[46px] shrink-0 items-center text-[15px] font-medium leading-none text-[var(--gym-ink)] sm:h-[50px] sm:text-[16px]"
          >
            <span className="inline-flex h-full items-center rounded-full border border-[var(--gym-ink)] bg-white px-5 sm:px-[25px]">
              {t("transformations.viewAll")}
            </span>
            <span className="inline-flex size-[46px] shrink-0 items-center justify-center rounded-full bg-[var(--gym-ink)] text-white sm:size-[50px]">
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
        </div>
      </div>

      <div className="mt-7 sm:mt-9 md:mt-10 lg:mt-12">
        <GalleryRow
          slides={topSlides}
          direction="left"
          onOpen={openById}
          trackKey={`${trackKey}-top`}
          isRtl={isRtl}
        />
        <div className="gallery-marquee-spacer" />
        <GalleryRow
          slides={bottomSlides}
          direction="right"
          onOpen={openById}
          trackKey={`${trackKey}-bottom`}
          isRtl={isRtl}
        />
      </div>

      {activeIndex != null && lightboxSlides.length > 0 ? (
        <GalleryLightbox
          slides={lightboxSlides}
          index={Math.min(activeIndex, lightboxSlides.length - 1)}
          onClose={() => setActiveIndex(null)}
          onIndexChange={setActiveIndex}
        />
      ) : null}
    </section>
  )
}
