import { Link } from "react-router-dom"
import { ArrowRight } from "lucide-react"
import { useLocale } from "@/hooks/useLocale"
import { cn } from "@/lib/utils"

type ArrowCtaLinkProps = {
  to: string
  label: string
  className?: string
  onClick?: () => void
  /** outline = navbar style; lime = hero “Book a class” style */
  variant?: "outline" | "lime"
}

function isExternalHref(href: string) {
  return /^(https?:|mailto:|tel:)/i.test(href.trim())
}

/**
 * GymTrainer-style CTA: pill + circle touching at one point.
 * LTR: ↗ → hover →
 * RTL: ↖ → hover ←
 */
export function ArrowCtaLink({
  to,
  label,
  className,
  onClick,
  variant = "outline",
}: ArrowCtaLinkProps) {
  const { isRtl } = useLocale()
  const isLime = variant === "lime"
  const external = isExternalHref(to)

  const classNames = cn(
    "group inline-flex h-[50px] items-center text-[16px] font-medium leading-none text-[var(--gym-ink)]",
    className,
  )

  const content = (
    <>
      <span
        className={cn(
          "inline-flex h-full items-center rounded-full px-[25px]",
          isLime
            ? "border-0 bg-[var(--gym-lime)] text-white"
            : "border border-[var(--gym-ink)] bg-white",
        )}
      >
        {label}
      </span>
      <span
        className={cn(
          "inline-flex size-[50px] shrink-0 items-center justify-center rounded-full",
          isLime ? "bg-white text-[var(--gym-ink)]" : "bg-[var(--gym-ink)] text-white",
        )}
      >
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
    </>
  )

  if (external) {
    return (
      <a
        href={to}
        onClick={onClick}
        target="_blank"
        rel="noopener noreferrer"
        className={classNames}
      >
        {content}
      </a>
    )
  }

  return (
    <Link to={to} onClick={onClick} className={classNames}>
      {content}
    </Link>
  )
}
