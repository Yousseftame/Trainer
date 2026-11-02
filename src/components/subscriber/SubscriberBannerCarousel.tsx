import { useCallback, useEffect, useRef, useState } from "react"
import { Link } from "react-router-dom"
import { AnimatePresence, motion, type PanInfo } from "motion/react"
import { ArrowLeft, ArrowRight } from "lucide-react"
import militaryImage from "@/assets/Military_Workout_Package_High_Quality.jpg.jpeg"
import warriorImage from "@/assets/Warrior_Package_High_Quality.jpg.jpeg"
import familyImage from "@/assets/Family_Workout_Package_High_Quality.jpg.jpeg"
import { BRAND_LOGO_ON_DARK } from "@/components/shared/BrandLogo"
import { APP_ROUTES } from "@/config/constants"
import { useLocale } from "@/hooks/useLocale"
import { cn } from "@/lib/utils"

type BannerSlide = {
  id: string
  image: string
  position?: string
  cta: { en: string; ar: string }
  to: string
}

const SLIDES: BannerSlide[] = [
  {
    id: "military",
    image: militaryImage,
    position: "object-[center_20%]",
    cta: { en: "Workout Plan", ar: "برنامج التمارين" },
    to: APP_ROUTES.subscriber.workout,
  },
  {
    id: "warrior",
    image: warriorImage,
    position: "object-[center_18%]",
    cta: { en: "Community Hub", ar: "مجتمع المشتركين" },
    to: APP_ROUTES.subscriber.community,
  },
  {
    id: "family",
    image: familyImage,
    position: "object-[center_20%]",
    cta: { en: "Nutrition Plan", ar: "الخطة الغذائية" },
    to: APP_ROUTES.subscriber.nutrition,
  },
]

const AUTOPLAY_INTERVAL = 4500
const SWIPE_THRESHOLD = 50

export function SubscriberBannerCarousel() {
  const { locale, isRtl } = useLocale()
  const [currentIndex, setCurrentIndex] = useState(0)
  const [direction, setDirection] = useState<1 | -1>(1)
  const [isPaused, setIsPaused] = useState(false)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const slideCount = SLIDES.length

  const paginate = useCallback(
    (newDirection: 1 | -1) => {
      setDirection(newDirection)
      setCurrentIndex((prev) => (prev + newDirection + slideCount) % slideCount)
    },
    [slideCount],
  )

  const goToSlide = (index: number) => {
    setDirection(index > currentIndex ? 1 : -1)
    setCurrentIndex(index)
  }

  // Autoplay management for mobile carousel
  useEffect(() => {
    if (isPaused) return
    timerRef.current = setInterval(() => {
      paginate(1)
    }, AUTOPLAY_INTERVAL)
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [paginate, isPaused])

  // Drag handler for mobile touch swipe
  const handleDragEnd = (_e: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const offset = info.offset.x
    const velocity = info.velocity.x

    const swipeFactor = isRtl ? -1 : 1
    const effectiveOffset = offset * swipeFactor

    if (effectiveOffset < -SWIPE_THRESHOLD || velocity * swipeFactor < -300) {
      paginate(1)
    } else if (effectiveOffset > SWIPE_THRESHOLD || velocity * swipeFactor > 300) {
      paginate(-1)
    }
  }

  const currentSlide = SLIDES[currentIndex]
  const ArrowIcon = isRtl ? ArrowLeft : ArrowRight

  // Smooth mobile card swap animation
  const variants = {
    enter: (dir: number) => ({
      x: dir > 0 ? (isRtl ? "-100%" : "100%") : (isRtl ? "100%" : "-100%"),
      opacity: 0,
    }),
    center: {
      zIndex: 1,
      x: "0%",
      opacity: 1,
      transition: {
        x: { type: "spring" as const, stiffness: 280, damping: 32 },
        opacity: { duration: 0.25 },
      },
    },
    exit: (dir: number) => ({
      zIndex: 0,
      x: dir > 0 ? (isRtl ? "100%" : "-100%") : (isRtl ? "-100%" : "100%"),
      opacity: 0,
      transition: {
        x: { type: "spring" as const, stiffness: 280, damping: 32 },
        opacity: { duration: 0.2 },
      },
    }),
  }

  return (
    <div dir={isRtl ? "rtl" : "ltr"} className="relative w-full select-none">
      {/* ======================================================== */}
      {/* DESKTOP VIEW: Balanced 3-Card Showcase Grid               */}
      {/* Eliminates stretched/zoomed images on wide screens        */}
      {/* ======================================================== */}
      <div className="hidden md:grid md:grid-cols-3 gap-4 lg:gap-5 w-full">
        {SLIDES.map((slide) => (
          <div
            key={slide.id}
            className="group relative h-[360px] lg:h-[390px] w-full overflow-hidden rounded-[22px] bg-[#161616] shadow-[0_8px_24px_rgba(0,0,0,0.12)] border border-black/10 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[0_16px_36px_rgba(0,0,0,0.22)]"
          >
            {/* Crisp Portrait Image with Focal Point */}
            <img
              src={slide.image}
              alt=""
              draggable={false}
              className={cn(
                "pointer-events-none absolute inset-0 size-full object-cover transition-transform duration-500 group-hover:scale-105",
                slide.position || "object-center",
              )}
            />

            {/* Bottom Controls Gradient */}
            <div
              aria-hidden
              className="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black/85 via-black/35 to-transparent"
            />

            {/* Bottom Controls Row: Button on Start, Logo on End */}
            <div className="absolute inset-x-0 bottom-0 z-20 flex items-center justify-between p-4 sm:p-5">
              <Link
                to={slide.to}
                className={cn(
                  "group/btn inline-flex items-center gap-2 rounded-full bg-[var(--gym-lime,#fb5001)] hover:bg-[#e04500] text-white px-4 py-2 sm:px-5 sm:py-2.5 text-[12.5px] sm:text-[13px] font-extrabold shadow-[0_8px_20px_rgba(251,80,1,0.5)] border border-white/20 transition-all hover:scale-105 active:scale-95",
                  isRtl ? "font-arabic" : "font-heading",
                )}
              >
                <span>{slide.cta[locale]}</span>
                <ArrowIcon className="size-3.5 rtl:rotate-180 transition-transform group-hover/btn:translate-x-1 rtl:group-hover/btn:-translate-x-1" />
              </Link>

              <div className="flex items-center rounded-xl bg-black/60 px-3 py-1.5 backdrop-blur-md border border-white/15 shadow-md">
                <img
                  src={BRAND_LOGO_ON_DARK}
                  alt="DerpyFit"
                  className="h-5 w-auto object-contain"
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ======================================================== */}
      {/* MOBILE VIEW: Full-Width Swipeable Story Carousel          */}
      {/* ======================================================== */}
      <div
        className="md:hidden w-full"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        onTouchStart={() => setIsPaused(true)}
        onTouchEnd={() => setIsPaused(false)}
      >
        <div className="group relative h-[380px] sm:h-[400px] w-full overflow-hidden rounded-[22px] bg-[#161616] shadow-[0_12px_32px_rgba(0,0,0,0.12)] border border-black/10">
          <AnimatePresence initial={false} custom={direction} mode="popLayout">
            <motion.div
              key={currentSlide.id}
              custom={direction}
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.2}
              onDragEnd={handleDragEnd}
              className="absolute inset-0 size-full cursor-grab active:cursor-grabbing"
            >
              {/* Clear Image */}
              <img
                src={currentSlide.image}
                alt=""
                draggable={false}
                className={cn(
                  "pointer-events-none absolute inset-0 size-full object-cover",
                  currentSlide.position || "object-center",
                )}
              />

              {/* Bottom Gradient for Action Controls */}
              <div
                aria-hidden
                className="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black/85 via-black/35 to-transparent"
              />

              {/* Bottom Controls Row: Button on Start, Logo on End */}
              <div className="absolute inset-x-0 bottom-0 z-20 flex items-center justify-between p-4 sm:p-5">
                <Link
                  to={currentSlide.to}
                  className={cn(
                    "group/btn inline-flex items-center gap-2 rounded-full bg-[var(--gym-lime,#fb5001)] hover:bg-[#e04500] text-white px-5 py-2.5 text-[13px] font-extrabold shadow-[0_8px_24px_rgba(251,80,1,0.5)] border border-white/25 transition-all hover:scale-105 active:scale-95",
                    isRtl ? "font-arabic" : "font-heading",
                  )}
                >
                  <span>{currentSlide.cta[locale]}</span>
                  <ArrowIcon className="size-3.5 rtl:rotate-180 transition-transform group-hover/btn:translate-x-1 rtl:group-hover/btn:-translate-x-1" />
                </Link>

                <div className="flex items-center rounded-xl bg-black/60 px-3.5 py-2 backdrop-blur-md border border-white/15 shadow-md">
                  <img
                    src={BRAND_LOGO_ON_DARK}
                    alt="DerpyFit"
                    className="h-5 w-auto object-contain"
                  />
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Mobile Pagination Dots */}
        <div className="mt-3.5 flex items-center justify-center gap-2">
          {SLIDES.map((slide, idx) => {
            const isActive = idx === currentIndex
            return (
              <button
                key={slide.id}
                type="button"
                onClick={() => goToSlide(idx)}
                aria-label={`Slide ${idx + 1}`}
                className={cn(
                  "h-2 rounded-full transition-all duration-300",
                  isActive
                    ? "w-7 bg-[var(--gym-lime,#fb5001)] shadow-[0_0_8px_rgba(251,80,1,0.6)]"
                    : "w-2 bg-black/20 hover:bg-black/40",
                )}
              />
            )
          })}
        </div>
      </div>
    </div>
  )
}
