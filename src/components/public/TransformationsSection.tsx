import { useEffect, useEffectEvent, useId, useRef, useState } from "react"
import { createPortal } from "react-dom"
import { Link } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { AnimatePresence, motion } from "motion/react"
import { ArrowLeft, ArrowRight, X } from "lucide-react"
import { APP_ROUTES } from "@/config/constants"
import { useLocale } from "@/hooks/useLocale"
import { cn } from "@/lib/utils"
import hoverIcon from "@/assets/gallery/hover-icon.svg"
import gallery02 from "@/assets/gallery/6757f6685db1adece749f71a_cc286e43a2f9cd6232b2f6e5c6ed4be6_gallery-image-02.avif"
import gallery03 from "@/assets/gallery/6757f66821429a6cd7446d56_733051bf79ad056a7cf7f0ab0cd3c166_gallery-image-03.avif"
import gallery04 from "@/assets/gallery/6757f668eb422a288c7d88a6_266a3dd91c4716421c652ec035edacfa_gallery-image-04.avif"
import gallery05 from "@/assets/gallery/6757f66825bfb94fb1e33fa8_dcabc1dad11785a8a7c25849e0c9234d_gallery-image-05.avif"
import gallery06 from "@/assets/gallery/6757f668750b42ca3dcd9555_gallery-image-06.avif"
import gallery07 from "@/assets/gallery/6757f668f59653b165679b74_60ba3c56e36cf1be0f42a51b5a288205_gallery-image-07.avif"
import gallery08 from "@/assets/gallery/6757f668f68e568a0d457849_aabff8eafa3a9dc8fc8245ff8d3db1c8_gallery-image-08.avif"

/** GymTrainer gallery assets — native 800×600 before/after composites */
const GALLERY_IMAGES = [
  gallery02,
  gallery03,
  gallery04,
  gallery05,
  gallery06,
  gallery07,
  gallery08,
] as const

const TOP_ROW = GALLERY_IMAGES
const BOTTOM_ROW = [...GALLERY_IMAGES].reverse()

function GalleryCard({
  src,
  alt,
  onOpen,
}: {
  src: string
  alt: string
  onOpen: () => void
}) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="gallery-card group relative shrink-0 cursor-zoom-in overflow-hidden rounded-[30px] text-start outline-none focus-visible:ring-2 focus-visible:ring-[var(--gym-lime)] focus-visible:ring-offset-2"
      aria-label={alt}
    >
      <img
        src={src}
        alt=""
        className="gallery-card__image pointer-events-none block size-full object-cover"
        loading="lazy"
        decoding="async"
        draggable={false}
      />
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-[30px] bg-[var(--gym-ink)] opacity-0 transition-opacity duration-300 group-hover:opacity-50 group-focus-visible:opacity-50"
      />
      <img
        src={hoverIcon}
        alt=""
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1/2 size-10 -translate-x-1/2 -translate-y-1/2 opacity-0 transition-opacity duration-300 group-hover:opacity-100 group-focus-visible:opacity-100 sm:size-[50px]"
      />
    </button>
  )
}

function GallerySet({
  images,
  ariaHidden = false,
  onOpen,
}: {
  images: readonly string[]
  ariaHidden?: boolean
  onOpen: (src: string) => void
}) {
  const { t } = useTranslation()

  return (
    <div
      className="gallery-marquee__set flex shrink-0 items-stretch"
      aria-hidden={ariaHidden || undefined}
    >
      {images.map((src, index) => (
        <GalleryCard
          key={`${ariaHidden ? "b" : "a"}-${index}`}
          src={src}
          alt={t("transformations.openImage", {
            n: GALLERY_IMAGES.indexOf(src as (typeof GALLERY_IMAGES)[number]) + 1,
          })}
          onOpen={() => onOpen(src)}
        />
      ))}
    </div>
  )
}

function GalleryRow({
  images,
  direction,
  onOpen,
  trackKey,
}: {
  images: readonly string[]
  direction: "left" | "right"
  onOpen: (src: string) => void
  trackKey: string
}) {
  return (
    <div
      className={cn(
        "gallery-marquee",
        direction === "right" && "gallery-marquee--reverse"
      )}
    >
      {/* Remount on language change so EN/AR both restart a clean LTR loop */}
      <div key={trackKey} className="gallery-marquee__track">
        <GallerySet images={images} onOpen={onOpen} />
        <GallerySet images={images} ariaHidden onOpen={onOpen} />
      </div>
    </div>
  )
}

function GalleryLightbox({
  index,
  onClose,
  onIndexChange,
}: {
  index: number
  onClose: () => void
  onIndexChange: (next: number) => void
}) {
  const { t } = useTranslation()
  const { isRtl } = useLocale()
  const titleId = useId()
  const dialogRef = useRef<HTMLDivElement>(null)
  const touchStartX = useRef<number | null>(null)
  const total = GALLERY_IMAGES.length
  const src = GALLERY_IMAGES[index]

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
    // Swipe follows content direction: LTR swipe-left = next; RTL swipe-left = prev
    if (delta < 0) {
      if (isRtl) goPrev()
      else goNext()
    } else if (isRtl) goNext()
    else goPrev()
  }

  const PrevIcon = isRtl ? ArrowRight : ArrowLeft
  const NextIcon = isRtl ? ArrowLeft : ArrowRight

  return createPortal(
    <motion.div
      key="gallery-lightbox"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      ref={dialogRef}
      tabIndex={-1}
      dir={isRtl ? "rtl" : "ltr"}
      className="fixed inset-0 z-[10000] flex flex-col bg-black/92 outline-none backdrop-blur-[2px]"
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

        <div className="relative z-20 flex items-center justify-between gap-3 px-4 pb-2 pt-[max(1rem,env(safe-area-inset-top))] sm:px-6 sm:pt-5">
          <p className="font-heading text-[14px] font-semibold tabular-nums text-white/80 sm:text-[15px]">
            {t("transformations.counter", { current: index + 1, total })}
          </p>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex size-11 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gym-lime)] sm:size-12"
            aria-label={t("transformations.close")}
          >
            <X className="size-5 sm:size-6" strokeWidth={2.25} />
          </button>
        </div>

        <div
          className="relative flex min-h-0 flex-1 items-center justify-center px-3 pb-[max(1rem,env(safe-area-inset-bottom))] sm:px-16 md:px-20"
          onClick={(event) => event.stopPropagation()}
        >
          <button
            type="button"
            onClick={goPrev}
            className={cn(
              "absolute top-1/2 z-20 inline-flex size-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gym-lime)] sm:size-12",
              isRtl ? "right-2 sm:right-4" : "left-2 sm:left-4"
            )}
            aria-label={t("transformations.prev")}
          >
            <PrevIcon className="size-5 sm:size-6" strokeWidth={2.25} />
          </button>

          <AnimatePresence mode="wait">
            <motion.img
              key={src}
              src={src}
              alt={t("transformations.imageAlt", { n: index + 1 })}
              className="max-h-[min(78dvh,820px)] w-auto max-w-[min(100%,1100px)] rounded-[16px] object-contain sm:rounded-[24px] md:rounded-[30px]"
              draggable={false}
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.2 }}
            />
          </AnimatePresence>

          <button
            type="button"
            onClick={goNext}
            className={cn(
              "absolute top-1/2 z-20 inline-flex size-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gym-lime)] sm:size-12",
              isRtl ? "left-2 sm:left-4" : "right-2 sm:right-4"
            )}
            aria-label={t("transformations.next")}
          >
            <NextIcon className="size-5 sm:size-6" strokeWidth={2.25} />
          </button>
        </div>
    </motion.div>,
    document.body
  )
}

export function TransformationsSection() {
  const { t, i18n } = useTranslation()
  const { isRtl } = useLocale()
  const [activeIndex, setActiveIndex] = useState<number | null>(null)
  const trackKey = i18n.language

  function openSrc(src: string) {
    const index = GALLERY_IMAGES.indexOf(src as (typeof GALLERY_IMAGES)[number])
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
              isRtl ? "max-w-[14ch]" : "max-w-[16ch]"
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
                    : "-rotate-45 group-hover:rotate-0"
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
          images={TOP_ROW}
          direction="left"
          onOpen={openSrc}
          trackKey={`${trackKey}-top`}
        />
        <div className="gallery-marquee-spacer" />
        <GalleryRow
          images={BOTTOM_ROW}
          direction="right"
          onOpen={openSrc}
          trackKey={`${trackKey}-bottom`}
        />
      </div>

      {activeIndex != null ? (
        <GalleryLightbox
          index={activeIndex}
          onClose={() => setActiveIndex(null)}
          onIndexChange={setActiveIndex}
        />
      ) : null}
    </section>
  )
}
