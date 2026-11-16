import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react"
import { Trans, useTranslation } from "react-i18next"
import {
  DEFAULT_COACHES_COUNT,
  usePublicTrustedPartnersQuery,
} from "@/features/website"
import { useLocale } from "@/hooks/useLocale"
import { resolveBilingualText } from "@/lib/program-text"
import { cn } from "@/lib/utils"

function LogoMark({
  children,
  className = "",
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <span
      className={cn(
        "inline-flex h-9 items-center whitespace-nowrap px-1 font-heading text-[15px] font-bold tracking-[0.04em] text-[var(--gym-ink)]/45 sm:h-10 sm:text-[17px]",
        className,
      )}
    >
      {children}
    </span>
  )
}

type MarqueeItem = { key: string; node: ReactNode }

const PLACEHOLDER_LOGOS: MarqueeItem[] = [
  { key: "opd", node: <LogoMark className="tracking-tight">OPD GYM</LogoMark> },
  {
    key: "henley",
    node: <LogoMark className="tracking-[0.18em]">HENLEY FITNESS</LogoMark>,
  },
  {
    key: "winning",
    node: (
      <LogoMark className="italic tracking-wide">WINNING MENTALITY</LogoMark>
    ),
  },
  {
    key: "redefining",
    node: <LogoMark className="tracking-wide">REDEFINING STRENGTH</LogoMark>,
  },
  {
    key: "strength",
    node: <LogoMark className="tracking-[0.08em]">STRENGTH BASE</LogoMark>,
  },
  {
    key: "boulay",
    node: <LogoMark className="tracking-[0.14em]">BOULAYFIT</LogoMark>,
  },
  {
    key: "integrit",
    node: <LogoMark className="tracking-wide">INTEGRIT PERFORMANCE</LogoMark>,
  },
  {
    key: "bsf",
    node: (
      <LogoMark className="italic tracking-wide">B-S-F PERFORMANCE</LogoMark>
    ),
  },
]

function LogoSet({
  items,
  setRef,
  ariaHidden = false,
}: {
  items: MarqueeItem[]
  setRef?: (node: HTMLDivElement | null) => void
  ariaHidden?: boolean
}) {
  return (
    <div
      ref={setRef}
      className="trust-marquee__set flex shrink-0 items-center gap-12 pr-12 sm:gap-14 sm:pr-14"
      aria-hidden={ariaHidden || undefined}
    >
      {items.map((item) => (
        <div key={item.key} className="flex h-10 shrink-0 items-center sm:h-11">
          {item.node}
        </div>
      ))}
    </div>
  )
}

function repeatItems(items: MarqueeItem[], times: number): MarqueeItem[] {
  if (items.length === 0 || times <= 1) return items
  const out: MarqueeItem[] = []
  for (let i = 0; i < times; i += 1) {
    for (const item of items) {
      out.push({ ...item, key: `${item.key}__${i}` })
    }
  }
  return out
}

export function TrustSection() {
  const { t, i18n } = useTranslation()
  const { locale, isRtl } = useLocale()
  const { data } = usePublicTrustedPartnersQuery()

  const cmsLogos = data?.logos ?? []
  const hasCmsLogos = cmsLogos.length > 0
  const logosSignature = cmsLogos.map((l) => `${l.id}:${l.imageUrl}`).join("|")

  const coachesCount = resolveBilingualText(
    data?.settings?.coachesCount ?? DEFAULT_COACHES_COUNT,
    locale,
    DEFAULT_COACHES_COUNT[locale],
  )

  const viewportRef = useRef<HTMLDivElement>(null)
  const measureSetRef = useRef<HTMLDivElement | null>(null)
  const [repeatTimes, setRepeatTimes] = useState(2)
  const [imagesReady, setImagesReady] = useState(!hasCmsLogos)
  const [trackKey, setTrackKey] = useState(0)

  // Preload CMS images so width measurement + CSS animation start correctly.
  useEffect(() => {
    if (!hasCmsLogos) {
      setImagesReady(true)
      return
    }

    let cancelled = false
    let done = 0
    const total = cmsLogos.length
    setImagesReady(false)

    const finishOne = () => {
      done += 1
      if (!cancelled && done >= total) setImagesReady(true)
    }

    for (const logo of cmsLogos) {
      const img = new Image()
      let settled = false
      const finish = () => {
        if (settled) return
        settled = true
        finishOne()
      }
      img.onload = finish
      img.onerror = finish
      img.src = logo.imageUrl
      if (img.complete) finish()
    }

    return () => {
      cancelled = true
    }
    // logosSignature captures id+url changes; cmsLogos used for preload targets.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasCmsLogos, logosSignature])

  const sourceItems = useMemo<MarqueeItem[]>(() => {
    if (!hasCmsLogos) return PLACEHOLDER_LOGOS
    return cmsLogos.map((logo) => ({
      key: logo.id,
      node: (
        <img
          src={logo.imageUrl}
          alt={resolveBilingualText(logo.name, locale) || ""}
          draggable={false}
          className="h-7 w-auto max-w-[140px] object-contain opacity-45 sm:h-8 sm:max-w-[160px]"
        />
      ),
    }))
  }, [cmsLogos, hasCmsLogos, locale])

  const measureAndFill = useCallback(() => {
    const viewport = viewportRef.current
    const setEl = measureSetRef.current
    if (!viewport || !setEl || sourceItems.length === 0) return

    const setWidth = setEl.scrollWidth
    const viewWidth = viewport.clientWidth
    if (setWidth <= 0 || viewWidth <= 0) return

    // Each set must cover the viewport so the -50% CSS loop never shows a hole.
    const needed = Math.max(2, Math.ceil((viewWidth * 1.35) / setWidth))
    setRepeatTimes((prev) => (prev === needed ? prev : needed))
  }, [sourceItems.length])

  useEffect(() => {
    if (!imagesReady) return
    const id = window.requestAnimationFrame(() => {
      measureAndFill()
      setTrackKey((k) => k + 1)
    })
    return () => window.cancelAnimationFrame(id)
  }, [imagesReady, i18n.language, isRtl, measureAndFill, logosSignature])

  useEffect(() => {
    const viewport = viewportRef.current
    if (!viewport || typeof ResizeObserver === "undefined") return
    const ro = new ResizeObserver(() => measureAndFill())
    ro.observe(viewport)
    return () => ro.disconnect()
  }, [measureAndFill])

  const filledItems = useMemo(
    () => repeatItems(sourceItems, repeatTimes),
    [repeatTimes, sourceItems],
  )

  return (
    <section className="w-full bg-white px-6 pb-2 pt-2 md:px-10 md:pt-3 lg:px-14">
      <div className="flex w-full flex-col items-stretch gap-3 md:flex-row md:items-center md:gap-7">
        <p className="shrink-0 whitespace-nowrap font-heading text-[14px] leading-none text-[var(--gym-muted)] sm:text-[15px] md:text-[16px]">
          <Trans
            i18nKey="trust.trustedBy"
            values={{ count: coachesCount || DEFAULT_COACHES_COUNT.en }}
            components={{
              strong: <span className="font-bold text-[var(--gym-ink)]" />,
            }}
          />
        </p>

        <div
          ref={viewportRef}
          dir="ltr"
          className={cn(
            "trust-marquee relative min-w-0 w-full overflow-hidden md:flex-1",
            "isolate [transform:translateZ(0)]",
            isRtl && "trust-marquee--rtl",
          )}
          role="region"
          aria-label={t("trust.logosLabel")}
        >
          <div
            aria-hidden
            className="pointer-events-none absolute start-0 top-0 -z-10 flex w-max opacity-0"
          >
            <LogoSet
              items={sourceItems}
              setRef={(node) => {
                measureSetRef.current = node
              }}
            />
          </div>

          <div
            key={`${i18n.language}-${hasCmsLogos ? "cms" : "fb"}-r${repeatTimes}-t${trackKey}`}
            className="trust-marquee__track flex w-max items-center py-1 will-change-transform"
          >
            <LogoSet items={filledItems} />
            <LogoSet items={filledItems} ariaHidden />
          </div>
        </div>
      </div>
    </section>
  )
}
