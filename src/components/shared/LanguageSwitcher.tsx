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
}

export function LanguageSwitcher({ className }: LanguageSwitcherProps) {
  const { t } = useTranslation()
  const { locale, setLocale } = useLocale()

  return (
    <div
      role="group"
      aria-label={t("nav.language")}
      className={cn(
        "inline-flex h-10 items-center rounded-full border border-[var(--gym-ink,#063434)] bg-white p-1",
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
              "inline-flex h-8 min-w-10 items-center justify-center rounded-full px-3 text-[13px] font-semibold tracking-wide transition-colors duration-200 ease-out",
              active
                ? "bg-[var(--gym-ink,#063434)] text-white"
                : "text-[var(--gym-ink,#063434)] hover:bg-[var(--gym-ink,#063434)]/5",
            )}
          >
            {option.label}
          </button>
        )
      })}
    </div>
  )
}
