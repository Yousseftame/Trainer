import { Link } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { APP_ROUTES } from "@/config/constants"
import { useDocumentTitle } from "@/hooks/useDocumentTitle"

export function NotFoundPage() {
  const { t } = useTranslation()
  useDocumentTitle(t("notFound.documentTitle"))

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-5 bg-white px-6 text-center">
      <p className="font-heading text-[72px] font-extrabold leading-none tracking-tight text-[var(--gym-ink,#063434)] sm:text-[96px]">
        404
      </p>
      <h1 className="font-heading text-[20px] font-semibold text-[var(--gym-ink,#063434)] sm:text-[22px]">
        {t("notFound.title")}
      </h1>
      <Link
        to={APP_ROUTES.public.home}
        className="mt-2 inline-flex h-12 items-center justify-center rounded-full bg-[var(--gym-ink,#063434)] px-7 font-heading text-[15px] font-semibold text-white transition-opacity hover:opacity-90"
      >
        {t("notFound.cta")}
      </Link>
    </main>
  )
}
