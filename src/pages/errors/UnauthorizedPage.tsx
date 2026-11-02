import { useEffect } from "react"
import { Link, useNavigate } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { ArrowLeft, ArrowRight, Home, ShieldAlert, UserCheck } from "lucide-react"
import { APP_ROUTES } from "@/config/constants"
import { useAuth } from "@/features/auth/auth-context"
import { useLocale } from "@/hooks/useLocale"

export function UnauthorizedPage() {
  const { t } = useTranslation()
  const { isRtl, locale } = useLocale()
  const isAr = locale === "ar"
  const navigate = useNavigate()
  const { status, user, isSubscriber, isAdmin } = useAuth()

  const destination = isSubscriber
    ? APP_ROUTES.subscriber.root
    : isAdmin
      ? APP_ROUTES.admin.root
      : APP_ROUTES.public.login

  const destinationLabel = isSubscriber
    ? isAr
      ? "الانتقال إلى لوحة المشترك"
      : "Go to Subscriber Portal"
    : isAdmin
      ? isAr
        ? "الانتقال إلى لوحة الإدارة"
        : "Go to Admin Dashboard"
      : isAr
        ? "تسجيل الدخول"
        : "Sign In"

  // Auto-redirect authenticated users to their home dashboard after brief notice
  useEffect(() => {
    if (status === "authenticated" && user) {
      const timer = window.setTimeout(() => {
        navigate(destination, { replace: true })
      }, 1500)
      return () => window.clearTimeout(timer)
    }
  }, [status, user, destination, navigate])

  return (
    <section className="mx-auto flex min-h-dvh max-w-lg flex-col items-center justify-center gap-4 px-4 text-center">
      <div className="flex size-16 items-center justify-center rounded-3xl bg-[var(--gym-ink,#111111)] text-[var(--gym-lime,#fb5001)] shadow-xl">
        <ShieldAlert className="size-8" strokeWidth={1.8} />
      </div>

      <div className="space-y-1.5">
        <h1 className="font-heading text-3xl font-extrabold text-[var(--gym-ink,#111111)]">403</h1>
        <p className="text-[14px] font-medium text-[#6B7280]">
          {t("auth.unauthorized")}
        </p>
      </div>

      <div className="mt-2 flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
        <button
          type="button"
          onClick={() => navigate(destination, { replace: true })}
          className="inline-flex h-11 w-full sm:w-auto items-center justify-center gap-2 rounded-full bg-[var(--gym-ink,#111111)] px-6 text-[13px] font-bold text-white transition hover:opacity-95 shadow-md"
        >
          <UserCheck className="size-4 text-[var(--gym-lime,#fb5001)]" />
          <span>{destinationLabel}</span>
          {isRtl ? <ArrowLeft className="size-4" /> : <ArrowRight className="size-4" />}
        </button>

        <Link
          to={APP_ROUTES.public.home}
          className="inline-flex h-11 w-full sm:w-auto items-center justify-center gap-2 rounded-full bg-[#F4F4F4] px-5 text-[13px] font-bold text-[var(--gym-ink,#111111)] transition hover:bg-black/10"
        >
          <Home className="size-4 text-[#8c8c8c]" />
          <span>{t("nav.home")}</span>
        </Link>
      </div>
    </section>
  )
}
