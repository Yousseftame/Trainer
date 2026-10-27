import { Link, Outlet } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { APP_ROUTES } from "@/config/constants"
import { authBrandClass } from "@/components/auth/styles"
import { cn } from "@/lib/utils"
import heroImage from "@/assets/heroimage.avif"
import heroPattern from "@/assets/hero-pattern.avif"

/**
 * Shared shell for login / forgot-password.
 * Mobile: compact floating card. Desktop: half-page tall glass panel.
 * Terms always sit at the bottom of the card.
 */
export function AuthLayout() {
  const { t } = useTranslation()

  return (
    <div className="relative h-dvh overflow-hidden bg-[var(--gym-ink)]">
      <img
        src={heroImage}
        alt=""
        aria-hidden
        className={[
          "pointer-events-none absolute inset-y-0 end-0 z-[1] h-full w-full object-cover select-none sm:w-[88%] lg:w-[80%]",
          "object-[72%_center] sm:object-[72%_top]",
          "rtl:-scale-x-100 rtl:object-[28%_center] sm:rtl:object-[28%_top]",
        ].join(" ")}
        draggable={false}
      />

      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-[1] rtl:-scale-x-100"
        style={{
          background:
            "linear-gradient(90deg, #063434 0%, #063434 37%, rgba(6, 52, 52, 0))",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-[1] bg-[linear-gradient(180deg,rgba(6,52,52,0.35)_0%,rgba(6,52,52,0.55)_100%)] lg:hidden"
      />

      <img
        src={heroPattern}
        alt=""
        aria-hidden
        className="pointer-events-none absolute inset-0 z-[2] h-full w-full object-cover object-left opacity-30 select-none rtl:object-right rtl:-scale-x-100"
        draggable={false}
      />

      <div
        className={cn(
          "relative z-10 flex h-full",
          "items-center justify-center px-3 py-3",
          "sm:px-6 sm:py-5",
          "lg:items-stretch lg:justify-start lg:px-8 lg:py-6 xl:px-10"
        )}
      >
        <div
          className={cn(
            "flex min-h-0 w-full flex-col",
            "h-auto max-h-full",
            "lg:h-full lg:w-1/2 lg:max-w-[560px]",
            "rounded-[22px] sm:rounded-[28px] lg:rounded-[32px]",
            "border border-white/70",
            "bg-white/82 shadow-[inset_0_1px_0_rgba(255,255,255,0.75),0_28px_80px_rgba(0,0,0,0.28)]",
            "backdrop-blur-[28px] backdrop-saturate-150",
            "supports-[backdrop-filter]:bg-white/72"
          )}
        >
          <div className="flex min-h-0 w-full flex-1 flex-col px-5 py-6 sm:px-8 sm:py-8 lg:px-10 lg:pb-6 lg:pt-10">
            <Link
              to={APP_ROUTES.public.home}
              className={cn(
                authBrandClass,
                "shrink-0 text-center text-[30px] sm:text-[36px] lg:text-[40px]"
              )}
              aria-label={t("app.name")}
            >
              {t("app.name")}
            </Link>

            <div className="flex min-h-0 flex-1 flex-col justify-center py-4 sm:py-5 lg:py-6">
              <Outlet />
            </div>

            <p className="mt-auto shrink-0 pt-2 text-center text-[11px] leading-relaxed text-[var(--gym-muted)] sm:text-[12px]">
              <Link
                to={APP_ROUTES.public.home}
                className="relative z-10 transition-colors hover:text-[var(--gym-ink)]"
              >
                {t("auth.terms")}
              </Link>
              <span className="mx-1.5 text-[var(--gym-ink)]/25" aria-hidden>
                |
              </span>
              <Link
                to={APP_ROUTES.public.home}
                className="relative z-10 transition-colors hover:text-[var(--gym-ink)]"
              >
                {t("auth.privacy")}
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
