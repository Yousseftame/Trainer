import { useTranslation } from "react-i18next"

export function FullPageSpinner() {
  const { t } = useTranslation()

  return (
    <div className="flex min-h-dvh items-center justify-center bg-background text-sm text-muted-foreground">
      {t("app.loading")}
    </div>
  )
}
