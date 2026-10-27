import { Link } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { APP_ROUTES } from "@/config/constants"
import { useDocumentTitle } from "@/hooks/useDocumentTitle"

export function RegisterPage() {
  const { t } = useTranslation()
  useDocumentTitle(t("auth.registerTitle"))

  return (
    <section className="flex flex-col gap-4 py-8">
      <h1 className="text-2xl font-semibold">{t("auth.registerTitle")}</h1>
      <p className="text-sm text-muted-foreground">{t("app.comingSoon")}</p>
      <p className="text-sm text-muted-foreground">
        <Link to={APP_ROUTES.public.login} className="underline underline-offset-4">
          {t("nav.login")}
        </Link>
      </p>
    </section>
  )
}
