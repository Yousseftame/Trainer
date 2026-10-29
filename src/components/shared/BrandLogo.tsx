import { useTranslation } from "react-i18next"
import { cn } from "@/lib/utils"

/** White + orange wordmark for dark surfaces. */
export const BRAND_LOGO_ON_DARK = "/derbyfit-logo.png"
/** Ink + orange wordmark for light surfaces. */
export const BRAND_LOGO_ON_LIGHT = "/derbyfit-logo-ink.png"

type BrandLogoProps = {
  /** `onLight` for white/gray chrome, `onDark` for ink backgrounds. */
  variant?: "onLight" | "onDark"
  className?: string
}

export function BrandLogo({ variant = "onLight", className }: BrandLogoProps) {
  const { t } = useTranslation()

  return (
    <img
      src={variant === "onDark" ? BRAND_LOGO_ON_DARK : BRAND_LOGO_ON_LIGHT}
      alt={t("app.name")}
      className={cn("h-9 w-auto select-none object-contain object-left", className)}
      draggable={false}
    />
  )
}
