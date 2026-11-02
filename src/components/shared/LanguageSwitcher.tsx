import { useTranslation } from "react-i18next"
import { useLocale } from "@/hooks/useLocale"
import type { AppLocale } from "@/i18n/rtl"
import { cn } from "@/lib/utils"

const options: { value: AppLocale; label: string }[] = [
  { value: "ar", label: "AR" },
  { value: "en", label: "EN" },
]

type LanguageSwitcherProps = {
  className?: string
  variant?: "default" | "dashboard"
}

export function LanguageSwitcher({
  className,
  variant = "default",
}: LanguageSwitcherProps) {
  const { t } = useTranslation()
  const { locale, setLocale } = useLocale()
  const isDashboard = variant === "dashboard"

  return (
    <div
      role="group"
      aria-label={t("nav.language")}
      className={cn(
        "inline-flex shrink-0 items-center rounded-full p-0.5 sm:p-1",
        isDashboard
          ? "h-9 sm:h-11 bg-[var(--gym-ink,#111111)]"
          : "h-9 sm:h-10 border border-[var(--gym-ink,#111111)] bg-white",
        className,
      )}
    >
      {options.map((option) => {
        const active = locale === option.value

        return (
          <button
            key={option.value}
            type="button"
            onClick={() => setLocale(option.value)}
            aria-pressed={active}
            className={cn(
              "inline-flex items-center justify-center rounded-full font-bold tracking-wide transition-colors duration-200 ease-out",
              isDashboard
                ? cn(
                    "h-8 sm:h-9 min-w-7 sm:min-w-9 px-2 sm:px-3 text-[11px] sm:text-[12px]",
                    active
                      ? "bg-[var(--gym-lime,#fb5001)] text-white"
                      : "text-white/70 hover:text-white",
                  )
                : cn(
                    "h-8 min-w-8 sm:min-w-10 px-2.5 sm:px-3 text-[12px] sm:text-[13px] font-semibold",
                    active
                      ? "bg-[var(--gym-ink,#111111)] text-white"
                      : "text-[var(--gym-ink,#111111)] hover:bg-[var(--gym-ink,#111111)]/5",
                  ),
            )}
          >
            {option.label}
          </button>
        )
      })}
    </div>
  )
}
