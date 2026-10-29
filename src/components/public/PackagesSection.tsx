import { Link } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { ArrowRight } from "lucide-react"
import { APP_ROUTES } from "@/config/constants"
import { useLocale } from "@/hooks/useLocale"
import { cn } from "@/lib/utils"

const PACKAGES = [
  {
    id: "quick",
    featured: false,
    tone: "light" as const,
    featureCount: 5,
    ctaTo: APP_ROUTES.public.contact,
  },
  {
    id: "transform",
    featured: true,
    tone: "dark" as const,
    featureCount: 6,
    ctaTo: APP_ROUTES.public.contact,
  },
  {
    id: "elite",
    featured: false,
    tone: "sage" as const,
    featureCount: 6,
    ctaTo: APP_ROUTES.public.contact,
  },
] as const

export function PackagesSection() {
  const { t } = useTranslation()
  const { isRtl } = useLocale()

  return (
    <section
      id="packages"
      className="w-full scroll-mt-24 bg-white px-6 pb-8 pt-16 md:px-10 md:pb-10 md:pt-20 lg:px-14 lg:pb-12 lg:pt-[72px] xl:pb-14 xl:pt-[96px]"
    >
      <div className="mx-auto w-full max-w-[1300px]">
        <h2 className="text-center font-heading text-[36px] font-bold leading-[1.25] text-[var(--gym-ink)] sm:text-[42px] md:text-[46px] lg:text-[52px]">
          {t("packages.title")}
        </h2>

        <div className="mt-10 grid grid-cols-1 items-stretch gap-5 pt-4 md:mt-12 md:grid-cols-2 md:gap-[20px] lg:mt-14 lg:grid-cols-3 xl:gap-[20px]">
          {PACKAGES.map((pkg) => {
            const isDark = pkg.tone === "dark"
            const features = Array.from({ length: pkg.featureCount }, (_, i) =>
              t(`packages.items.${pkg.id}.features.${i}`)
            )

            return (
              <article
                key={pkg.id}
                className={cn(
                  "relative flex h-full flex-col rounded-[30px] p-5 sm:p-6 xl:p-[50px]",
                  pkg.tone === "light" && "bg-[#f5f5f5]",
                  pkg.tone === "dark" && "bg-[var(--gym-dark)]",
                  pkg.tone === "sage" && "bg-[#f3f0e8]"
                )}
              >
                {pkg.featured ? (
                  <span className="pointer-events-none absolute left-1/2 top-0 z-10 -translate-x-1/2 -translate-y-1/2 whitespace-nowrap rounded-full bg-[var(--gym-lime)] px-5 py-[5px] text-[15px] font-medium leading-[1.3] text-white sm:text-[16px]">
                    {t("packages.bestValue")}
                  </span>
                ) : null}

                {/* Shared top stack — same heights on every card so rows align */}
                <div className="flex flex-col">
                  <h3
                    className={cn(
                      "min-h-[2.5em] font-heading text-[20px] font-bold leading-[1.25] sm:text-[22px] xl:text-[24px]",
                      isDark ? "text-white" : "text-[var(--gym-ink)]"
                    )}
                  >
                    {t(`packages.items.${pkg.id}.name`)}
                  </h3>

                  <div className="mt-4 flex min-h-[3.25rem] flex-wrap items-end gap-1 sm:mt-5 sm:min-h-[3.5rem] xl:min-h-[3.75rem]">
                    <p
                      className={cn(
                        "font-heading text-[40px] font-semibold leading-none tracking-tight sm:text-[44px] xl:text-[52px]",
                        isDark ? "text-[var(--gym-lime)]" : "text-[#1e2222]"
                      )}
                    >
                      {t(`packages.items.${pkg.id}.price`)}
                    </p>
                    <p
                      className={cn(
                        "mb-1.5 font-heading text-[18px] font-semibold leading-[1.3] sm:mb-2 sm:text-[20px] xl:text-[22px]",
                        isDark ? "text-[var(--gym-lime)]" : "text-[#1e2222]"
                      )}
                    >
                      {t(`packages.items.${pkg.id}.period`)}
                    </p>
                  </div>

                  <Link
                    to={pkg.ctaTo}
                    className={cn(
                      "mt-7 inline-flex h-[50px] w-full shrink-0 items-center justify-center rounded-full border px-[25px] text-center text-[16px] font-medium leading-none transition-colors duration-300 sm:mt-8",
                      isDark
                        ? "border-white bg-transparent text-white hover:border-[var(--gym-lime)] hover:bg-[var(--gym-lime)] hover:text-white"
                        : "border-[#1e2222] bg-white text-[#1e2222] hover:bg-[var(--gym-ink)] hover:text-white"
                    )}
                  >
                    {t(`packages.items.${pkg.id}.cta`)}
                  </Link>
                </div>

                <div
                  className={cn(
                    "mt-7 flex flex-1 flex-col gap-4 border-t pt-6 sm:mt-8 sm:gap-5",
                    isDark ? "border-white/15" : "border-[var(--gym-ink)]/10"
                  )}
                >
                  <p
                    className={cn(
                      "text-[16px] sm:text-[17px] xl:text-[18px]",
                      isDark ? "text-white/70" : "text-[var(--gym-muted)]"
                    )}
                  >
                    {t("packages.included")}
                  </p>

                  <ul className="flex flex-col gap-3.5 sm:gap-4">
                    {features.map((feature) => (
                      <li
                        key={feature}
                        className={cn(
                          "flex items-start gap-2.5 text-[15px] font-medium leading-[1.45] sm:text-[16px]",
                          isDark ? "text-white" : "text-[#1e2222]"
                        )}
                      >
                        <ArrowRight
                          aria-hidden
                          className={cn(
                            "mt-1 size-3.5 shrink-0 sm:size-4",
                            isDark ? "text-[var(--gym-lime)]" : "text-[var(--gym-ink)]",
                            isRtl && "rotate-180"
                          )}
                          strokeWidth={2.25}
                        />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </article>
            )
          })}
        </div>
      </div>
    </section>
  )
}
