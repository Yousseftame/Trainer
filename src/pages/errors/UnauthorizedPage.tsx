import { Link } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { APP_ROUTES } from "@/config/constants"

export function UnauthorizedPage() {
  const { t } = useTranslation()

  return (
    <section className="mx-auto flex min-h-dvh max-w-lg flex-col items-center justify-center gap-3 px-4 text-center">
      <h1 className="text-2xl font-semibold">403</h1>
      <p className="text-sm text-muted-foreground">{t("auth.unauthorized")}</p>
      <Link to={APP_ROUTES.public.home} className="text-sm font-medium underline underline-offset-4">
        {t("nav.home")}
      </Link>
    </section>
  )
}
