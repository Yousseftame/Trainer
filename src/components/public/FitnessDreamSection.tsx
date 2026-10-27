import {
  useCallback,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from "react"
import { Link } from "react-router-dom"
import { useTranslation } from "react-i18next"
import {
  animate,
  motion,
  useMotionValue,
  type PanInfo,
} from "motion/react"
import { ArrowLeft, ArrowRight } from "lucide-react"
import { APP_ROUTES } from "@/config/constants"
import { useLocale } from "@/hooks/useLocale"
import { cn } from "@/lib/utils"

type DreamCard = {
  id: string
  titleKey: string
  bodyKey: string
  image: string
  imageAltKey: string
}

const DREAMS: DreamCard[] = [
  {
    id: "strength",
    titleKey: "dreams.items.strength.title",
    bodyKey: "dreams.items.strength.body",
    imageAltKey: "dreams.items.strength.alt",
    image:
      "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?auto=format&fit=crop&w=800&q=75",
  },
  {
    id: "nutrition",
    titleKey: "dreams.items.nutrition.title",
    bodyKey: "dreams.items.nutrition.body",
    imageAltKey: "dreams.items.nutrition.alt",
    image:
      "https://images.unsplash.com/photo-1490645935967-10de6ba17061?auto=format&fit=crop&w=800&q=75",
  },
  {
    id: "online",
    titleKey: "dreams.items.online.title",
    bodyKey: "dreams.items.online.body",
    imageAltKey: "dreams.items.online.alt",
    image:
      "https://images.unsplash.com/photo-1518310383802-640c2de311b2?auto=format&fit=crop&w=800&q=75",
  },
  {
    id: "group",
    titleKey: "dreams.items.group.title",
    bodyKey: "dreams.items.group.body",
    imageAltKey: "dreams.items.group.alt",
    image:
      "https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=800&q=75",
  },
  {
    id: "stress",
    titleKey: "dreams.items.stress.title",
    bodyKey: "dreams.items.stress.body",
    imageAltKey: "dreams.items.stress.alt",
    image:
      "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=800&q=75",
  },
  {
    id: "mobility",
    titleKey: "dreams.items.mobility.title",
    bodyKey: "dreams.items.mobility.body",
    imageAltKey: "dreams.items.mobility.alt",
    image:
      "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&w=800&q=75",
  },
]

/** Warm cream + light gray — alternate one by one */
const CARD_TONES = ["bg-[#f3f0e8]", "bg-[#F5F5F5]"] as const

/** Tween is smoother than spring on mid/low-end mobile GPUs */
const SLIDE = {
  type: "tween" as const,
  duration: 0.42,
  ease: [0.25, 0.1, 0.25, 1] as [number, number, number, number],
}

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n))
}

function NavButton({
  label,
  disabled,
  onClick,
  children,
}: {
  label: string
  disabled: boolean
  onClick: () => void
  children: ReactNode
}) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "inline-flex size-14 items-center justify-center rounded-full border-2 border-[var(--gym-ink)]/30 text-[var(--gym-ink)]/85 transition-[border-color,color,transform] duration-300 ease-out sm:size-16",
        "hover:border-[var(--gym-ink)]/55 hover:text-[var(--gym-ink)]",
        "active:scale-[0.96]",
        "disabled:pointer-events-none disabled:opacity-35"
      )}
    >
      {children}
    </button>
  )
}

function DreamCardView({ item, tone }: { item: DreamCard; tone: string }) {
  const { t } = useTranslation()
  const { isRtl } = useLocale()

  return (
    <article
      className={cn(
        "group/card flex h-[500px] flex-col overflow-hidden rounded-[16px] sm:h-[520px] lg:h-[540px]",
        tone
      )}
    >
      <div className="flex h-[190px] shrink-0 flex-col px-7 pb-5 pt-8 sm:h-[200px] sm:px-8 sm:pt-9 lg:h-[210px] lg:px-9">
        <h3 className="font-heading text-[22px] font-bold leading-tight text-[var(--gym-ink)] sm:text-[26px] lg:text-[28px]">
          {t(item.titleKey)}
        </h3>
        <p className="mt-4 line-clamp-4 text-[16px] leading-[1.6] text-[#2a4a45] sm:mt-5 sm:text-[17px] lg:text-[18px]">
          {t(item.bodyKey)}
        </p>
      </div>

      <div className="relative min-h-0 w-full flex-1 overflow-hidden rounded-t-[16px]">
        <img
          src={item.image}
          alt={t(item.imageAltKey)}
          className={cn(
            "absolute inset-0 size-full object-cover object-center",
            // Hover zoom only on fine pointers — avoids sticky hover jank on touch
            "transition-transform duration-[850ms] ease-out will-change-transform",
            "[@media(hover:hover)_and_(pointer:fine)]:group-hover/card:scale-[1.07]"
          )}
          loading="lazy"
          decoding="async"
          draggable={false}
        />
        <Link
          to={APP_ROUTES.public.services}
          aria-label={t("dreams.openItem", { title: t(item.titleKey) })}
          className={cn(
            "absolute bottom-5 end-5 z-10 inline-flex size-12 items-center justify-center rounded-full sm:bottom-6 sm:end-6",
            "bg-white text-[var(--gym-ink)] shadow-[0_6px_16px_rgba(6,52,52,0.12)]",
            "transition-colors duration-[450ms] ease-out",
            "[@media(hover:hover)_and_(pointer:fine)]:group-hover/card:bg-[var(--gym-lime)]",
            "active:scale-95"
          )}
        >
          <ArrowRight
            className={cn(
              "transition-transform duration-[450ms] ease-out",
              isRtl
                ? "-rotate-[135deg] [@media(hover:hover)_and_(pointer:fine)]:group-hover/card:-rotate-180"
                : "-rotate-45 [@media(hover:hover)_and_(pointer:fine)]:group-hover/card:rotate-0"
            )}
            size={18}
            strokeWidth={1.75}
          />
        </Link>
      </div>
    </article>
  )
}

export function FitnessDreamSection() {
  const { t } = useTranslation()
  const { isRtl } = useLocale()
  const viewportRef = useRef<HTMLDivElement>(null)
  const trackRef = useRef<HTMLDivElement>(null)
  const x = useMotionValue(0)
  const animRef = useRef<ReturnType<typeof animate> | null>(null)
  const indexRef = useRef(0)
  const metricsRef = useRef({ step: 0, maxOffset: 0, maxIndex: 0 })
  const [index, setIndex] = useState(0)
  const [maxIndex, setMaxIndex] = useState(0)
  const [dragBounds, setDragBounds] = useState({ left: 0, right: 0 })

  const slideTo = useCallback(
    (next: number) => {
      const { step, maxOffset, maxIndex: max } = metricsRef.current
      if (step <= 0) return

      const clamped = clamp(next, 0, max)
      indexRef.current = clamped
      setIndex(clamped)

      animRef.current?.stop()
      animRef.current = animate(
        x,
        -Math.min(clamped * step, maxOffset),
        SLIDE
      )
    },
    [x]
  )

  const measure = useCallback(() => {
    const viewport = viewportRef.current
    const track = trackRef.current
    if (!viewport || !track) return

    const firstCard = track.querySelector<HTMLElement>("[data-dream-card]")
    if (!firstCard) return

    const styles = getComputedStyle(track)
    const gap = Number.parseFloat(styles.columnGap || styles.gap || "20") || 20
    const cardWidth = firstCard.getBoundingClientRect().width
    const nextStep = cardWidth + gap
    const visible = viewport.clientWidth
    const total = track.scrollWidth
    const nextMaxOffset = Math.max(0, total - visible)
    const nextMax =
      nextStep > 0 ? Math.max(0, Math.round(nextMaxOffset / nextStep)) : 0

    metricsRef.current = {
      step: nextStep,
      maxOffset: nextMaxOffset,
      maxIndex: nextMax,
    }

    setDragBounds({ left: -nextMaxOffset, right: 0 })
    setMaxIndex(nextMax)

    const clamped = Math.min(indexRef.current, nextMax)
    if (clamped !== indexRef.current) {
      indexRef.current = clamped
      setIndex(clamped)
    }

    // Snap without fighting an in-flight user slide
    x.set(-Math.min(clamped * nextStep, nextMaxOffset))
  }, [x])

  useLayoutEffect(() => {
    measure()
    const viewport = viewportRef.current
    if (!viewport) return

    let raf = 0
    const schedule = () => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(measure)
    }

    const ro = new ResizeObserver(schedule)
    ro.observe(viewport)
    if (trackRef.current) ro.observe(trackRef.current)
    window.addEventListener("resize", schedule, { passive: true })
    return () => {
      cancelAnimationFrame(raf)
      animRef.current?.stop()
      ro.disconnect()
      window.removeEventListener("resize", schedule)
    }
  }, [measure])

  const onDragStart = () => {
    animRef.current?.stop()
  }

  const onDragEnd = (_: unknown, info: PanInfo) => {
    const { step } = metricsRef.current
    if (step <= 0) return

    const current = indexRef.current
    const swipe = info.offset.x
    const flick = info.velocity.x

    let next = current
    if (swipe < -48 || flick < -500) next = current + 1
    else if (swipe > 48 || flick > 500) next = current - 1
    else {
      next = Math.round(-x.get() / step)
    }

    slideTo(next)
  }

  const navButtons = (
    <>
      <NavButton
        label={t("dreams.prev")}
        disabled={index <= 0}
        onClick={() => slideTo(indexRef.current - 1)}
      >
        {isRtl ? (
          <ArrowRight className="size-6" strokeWidth={2.25} />
        ) : (
          <ArrowLeft className="size-6" strokeWidth={2.25} />
        )}
      </NavButton>
      <NavButton
        label={t("dreams.next")}
        disabled={index >= maxIndex}
        onClick={() => slideTo(indexRef.current + 1)}
      >
        {isRtl ? (
          <ArrowLeft className="size-6" strokeWidth={2.25} />
        ) : (
          <ArrowRight className="size-6" strokeWidth={2.25} />
        )}
      </NavButton>
    </>
  )

  return (
    <section className="w-full bg-white px-6 pb-14 pt-4 md:px-10 md:pb-20 md:pt-6 lg:px-14">
      {/* Mobile: title alone. md+: title + arrows top-right */}
      <div className="mb-6 flex items-start justify-between gap-4 md:mb-10">
        <h2 className="font-heading text-[30px] font-bold leading-[1.08] text-[var(--gym-ink)] sm:text-[36px] md:text-[42px] lg:text-[46px]">
          <span className="block">{t("dreams.titleLine1")}</span>
          <span className="block">{t("dreams.titleLine2")}</span>
        </h2>

        <div className="hidden shrink-0 items-center gap-3 pt-1 md:flex md:gap-3.5">
          {navButtons}
        </div>
      </div>

      <div ref={viewportRef} className="overflow-hidden touch-pan-y">
        <motion.div
          ref={trackRef}
          style={{ x }}
          className="flex gap-8 will-change-transform sm:gap-10 lg:gap-12"
          drag="x"
          dragConstraints={dragBounds}
          dragElastic={0.08}
          dragMomentum={false}
          onDragStart={onDragStart}
          onDragEnd={onDragEnd}
        >
          {DREAMS.map((item, i) => (
            <div
              key={item.id}
              data-dream-card
              className={cn(
                "shrink-0",
                "w-full",
                "sm:w-[calc((100%-2.5rem)/2)]",
                "lg:w-[calc((100%-6rem)/3)]"
              )}
            >
              <DreamCardView item={item} tone={CARD_TONES[i % 2]} />
            </div>
          ))}
        </motion.div>
      </div>

      {/* Mobile only: arrows centered under the card */}
      <div className="mt-6 flex items-center justify-center gap-3 md:hidden">
        {navButtons}
      </div>
    </section>
  )
}
