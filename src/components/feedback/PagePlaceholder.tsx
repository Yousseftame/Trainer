import { useTranslation } from "react-i18next"

type PagePlaceholderProps = {
  titleKey: string
  description?: string
}

export function PagePlaceholder({ titleKey, description }: PagePlaceholderProps) {
  const { t } = useTranslation()

  return (
    <section className="rounded-[24px] bg-white p-6 sm:p-8">
      <h1 className="font-heading text-[22px] font-extrabold tracking-tight text-[var(--dash-ink,#0a0f1d)] sm:text-[24px]">
        {t(titleKey)}
      </h1>
      <p className="mt-2 max-w-xl text-[14px] leading-relaxed text-[var(--dash-muted,#8c8c8c)] sm:text-[15px]">
        {description ?? t("app.comingSoon")}
      </p>
    </section>
  )
}
