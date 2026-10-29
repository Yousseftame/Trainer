import { useTranslation } from "react-i18next"
import { useLocale } from "@/hooks/useLocale"
import type { AppLocale } from "@/i18n/rtl"
import { cn } from "@/lib/utils"

const options: { value: AppLocale; label: string }[] = [
  { value: "en", label: "EN" },
  { value: "ar", label: "AR" },
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
        "inline-flex items-center rounded-full p-1",
        isDashboard
          ? "h-11 bg-[var(--gym-ink,#111111)]"
          : "h-10 border border-[var(--gym-ink,#111111)] bg-white",
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
              "inline-flex items-center justify-center rounded-full text-[12px] font-bold tracking-wide transition-colors duration-200 ease-out",
              isDashboard
                ? cn(
                    "h-9 min-w-9 px-3",
                    active
                      ? "bg-[var(--gym-lime,#fb5001)] text-white"
                      : "text-white/70 hover:text-white",
                  )
                : cn(
                    "h-8 min-w-10 px-3 text-[13px] font-semibold",
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
