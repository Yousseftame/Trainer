import { useState, type FormEvent } from "react"
import { Link } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { Eye, EyeOff } from "lucide-react"
import { APP_ROUTES } from "@/config/constants"
import { useDocumentTitle } from "@/hooks/useDocumentTitle"
import { appToast } from "@/lib/toast"
import { cn } from "@/lib/utils"
import {
  authInputClass,
  authLabelClass,
  authLinkClass,
  authPageTitleClass,
  authPrimaryBtnClass,
} from "@/components/auth/styles"

export function LoginPage() {
  const { t } = useTranslation()
  useDocumentTitle(t("auth.loginTitle"))
  const [showPassword, setShowPassword] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = event.currentTarget
    if (!form.checkValidity()) {
      form.reportValidity()
      appToast.error(t("auth.toast.invalid"))
      return
    }

    setSubmitting(true)
    await new Promise((r) => window.setTimeout(r, 700))
    setSubmitting(false)
    appToast.success(t("app.comingSoon"))
  }

  return (
    <section className="flex w-full flex-col items-stretch gap-4 sm:items-center sm:gap-5 lg:gap-6">
      <div className="w-full text-center lg:max-w-[360px]">
        <h1 className={cn(authPageTitleClass, "mt-0 text-[17px] sm:text-[20px]")}>
          {t("auth.loginTitle")}
        </h1>
        <p className="mt-1.5 text-[12.5px] leading-snug text-[var(--gym-muted)]/85 sm:mt-2 sm:text-[14px]">
          {t("auth.loginSubtitle")}
        </p>
      </div>

      <form
        className="flex w-full flex-col gap-3 sm:max-w-[360px] sm:gap-3.5 lg:gap-4"
        onSubmit={onSubmit}
        noValidate
      >
        <label className="block">
          <span className={authLabelClass}>{t("auth.fields.email")}</span>
          <input
            name="email"
            type="email"
            autoComplete="email"
            required
            placeholder={t("auth.placeholders.email")}
            className={authInputClass}
          />
        </label>

        <label className="block">
          <span className={authLabelClass}>{t("auth.fields.password")}</span>
          <div className="relative">
            <input
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              required
              minLength={6}
              placeholder={t("auth.placeholders.password")}
              className={cn(authInputClass, "pe-12")}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute end-3 top-1/2 inline-flex size-8 -translate-y-1/2 items-center justify-center rounded-full text-[var(--gym-muted)] transition-colors hover:text-[var(--gym-ink)]"
              aria-label={showPassword ? t("auth.hidePassword") : t("auth.showPassword")}
            >
              {showPassword ? (
                <EyeOff className="size-[18px]" strokeWidth={1.75} />
              ) : (
                <Eye className="size-[18px]" strokeWidth={1.75} />
              )}
            </button>
          </div>
        </label>

        <div className="flex justify-end">
          <Link to={APP_ROUTES.public.forgotPassword} className={authLinkClass}>
            {t("auth.forgotPassword")}
          </Link>
        </div>

        <div className="mt-0.5 flex flex-col gap-2.5 sm:gap-3">
          <button type="submit" disabled={submitting} className={authPrimaryBtnClass}>
            {submitting ? t("auth.submitting") : t("auth.loginSubmit")}
          </button>

          <p className="relative z-10 text-center text-[13px] text-[var(--gym-muted)] sm:text-[14px]">
            {t("auth.noAccount")}{" "}
            <Link to={APP_ROUTES.public.register} className={cn(authLinkClass, "underline")}>
              {t("nav.register")}
            </Link>
          </p>
        </div>
      </form>
    </section>
  )
}
