import { useTranslation } from "react-i18next"

type PagePlaceholderProps = {
  titleKey: string
  description?: string
}

export function PagePlaceholder({ titleKey, description }: PagePlaceholderProps) {
  const { t } = useTranslation()

  return (
    <section className="mx-auto flex w-full max-w-3xl flex-col gap-3 px-4 py-10">
      <h1 className="text-2xl font-semibold tracking-tight text-foreground">{t(titleKey)}</h1>
      <p className="text-sm text-muted-foreground">{description ?? t("app.comingSoon")}</p>
    </section>
  )
}
