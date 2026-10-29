import { useTranslation } from "react-i18next"

export function FullPageSpinner() {
  const { t } = useTranslation()

  return (
    <div
      role="status"
      aria-live="polite"
      className="flex min-h-dvh flex-col items-center justify-center gap-2.5 bg-background px-6 text-center"
    >
      <p className="text-sm font-semibold text-foreground/85">
        {t("app.loading")}
      </p>
      <span
        aria-hidden
        className="size-4 animate-spin rounded-full border-2 border-foreground/15 border-t-foreground/75"
      />
    </div>
  )
}
