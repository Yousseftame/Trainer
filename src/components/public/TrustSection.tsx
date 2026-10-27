import type { ReactNode } from "react"
import { Trans, useTranslation } from "react-i18next"
import { useLocale } from "@/hooks/useLocale"
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
        className
      )}
    >
      {children}
    </span>
  )
}

const PLACEHOLDER_LOGOS = [
  { node: <LogoMark className="tracking-tight">OPD GYM</LogoMark>, key: "opd" },
  { node: <LogoMark className="tracking-[0.18em]">HENLEY FITNESS</LogoMark>, key: "henley" },
  {
    node: <LogoMark className="italic tracking-wide">WINNING MENTALITY</LogoMark>,
    key: "winning",
  },
  {
    node: <LogoMark className="tracking-wide">REDEFINING STRENGTH</LogoMark>,
    key: "redefining",
  },
  {
    node: <LogoMark className="tracking-[0.08em]">STRENGTH BASE</LogoMark>,
    key: "strength",
  },
  { node: <LogoMark className="tracking-[0.14em]">BOULAYFIT</LogoMark>, key: "boulay" },
  {
    node: <LogoMark className="tracking-wide">INTEGRIT PERFORMANCE</LogoMark>,
    key: "integrit",
  },
  {
    node: <LogoMark className="italic tracking-wide">B-S-F PERFORMANCE</LogoMark>,
    key: "bsf",
  },
]

function LogoSet({ ariaHidden = false }: { ariaHidden?: boolean }) {
  return (
    <div
      className="trust-marquee__set flex shrink-0 items-center gap-12 pr-12 sm:gap-14 sm:pr-14"
      aria-hidden={ariaHidden || undefined}
    >
      {PLACEHOLDER_LOGOS.map((item) => (
        <div key={item.key} className="shrink-0">
          {item.node}
        </div>
      ))}
    </div>
  )
}

export function TrustSection() {
  const { t, i18n } = useTranslation()
  const { isRtl } = useLocale()

  return (
    <section className="w-full bg-white px-6 pb-2 pt-2 md:px-10 md:pt-3 lg:px-14">
      <div className="flex w-full flex-col items-stretch gap-3 md:flex-row md:items-center md:gap-7">
        <p className="shrink-0 whitespace-nowrap font-heading text-[14px] leading-none text-[var(--gym-muted)] sm:text-[15px] md:text-[16px]">
          <Trans
            i18nKey="trust.trustedBy"
            components={{
              strong: <span className="font-bold text-[var(--gym-ink)]" />,
            }}
          />
        </p>

        <div
          className={cn(
            "trust-marquee min-w-0 w-full overflow-hidden md:flex-1",
            "isolate [transform:translateZ(0)]",
            isRtl && "trust-marquee--rtl"
          )}
          role="region"
          aria-label={t("trust.logosLabel")}
        >
          {/*
            Two identical sets + physical pr-* (not pe-*) so set widths stay equal
            under any page direction. Track itself is forced LTR in CSS.
          */}
          <div
            key={i18n.language}
            className="trust-marquee__track flex w-max items-center py-1 will-change-transform"
          >
            <LogoSet />
            <LogoSet ariaHidden />
          </div>
        </div>
      </div>
    </section>
  )
}
