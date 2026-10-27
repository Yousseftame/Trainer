import { useState, type FormEvent } from "react"
import { Link, useLocation } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { APP_ROUTES } from "@/config/constants"
import { appToast } from "@/lib/toast"
import { cn } from "@/lib/utils"
import footerPattern from "@/assets/footer/footer-bg-pattern.avif"
import phoneIcon from "@/assets/footer/footer-icon-phone.svg"
import mailIcon from "@/assets/footer/footer-icon-mail.svg"

const PAGE_LINKS = [
  { labelKey: "footer.pages.home", to: APP_ROUTES.public.home, end: true },
  { labelKey: "footer.pages.about", to: APP_ROUTES.public.about },
  { labelKey: "footer.pages.services", to: APP_ROUTES.public.services },
  { labelKey: "footer.pages.packages", to: `${APP_ROUTES.public.home}#packages` },
] as const

const UTILITY_LINKS = [
  { labelKey: "footer.utility.login", to: APP_ROUTES.public.login },
  { labelKey: "footer.utility.register", to: APP_ROUTES.public.register },
  { labelKey: "footer.utility.dashboard", to: APP_ROUTES.subscriber.overview, end: true },
  { labelKey: "footer.utility.workout", to: APP_ROUTES.subscriber.workout },
] as const

const fieldClass = cn(
  "w-full border-0 border-b border-[#133e3e] bg-transparent px-0 py-2 sm:py-2.5",
  "font-heading text-[15px] text-[#d7dddd] outline-none sm:text-[16px]",
  "placeholder:text-[#d7dddd]/80",
  "transition-[border-color] duration-300",
  "focus:border-[var(--gym-lime)]"
)

function FooterNavLink({
  label,
  to,
  end,
}: {
  label: string
  to: string
  end?: boolean
}) {
  const location = useLocation()
  const [pathPart, hashPart] = to.split("#")
  const pathOnly = pathPart || "/"
  const hash = hashPart ? `#${hashPart}` : ""

  const isCurrent = hash
    ? location.pathname === pathOnly && location.hash === hash
    : end
      ? location.pathname === pathOnly
      : location.pathname === pathOnly ||
        (pathOnly !== "/" && location.pathname.startsWith(pathOnly))

  return (
    <Link
      to={to}
      className={cn(
        "font-heading text-[14px] transition-colors duration-300 sm:text-[16px]",
        isCurrent ? "text-[var(--gym-lime)]" : "text-[#d7dddd] hover:text-[var(--gym-lime)]"
      )}
      aria-current={isCurrent ? "page" : undefined}
    >
      {label}
    </Link>
  )
}

export function PublicFooter() {
  const { t } = useTranslation()
  const [sending, setSending] = useState(false)

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = event.currentTarget
    if (!form.checkValidity()) {
      form.reportValidity()
      appToast.error(t("footer.form.invalid"))
      return
    }

    setSending(true)
    await new Promise((r) => window.setTimeout(r, 700))
    setSending(false)
    form.reset()
    appToast.success(t("footer.form.success"))
  }

  return (
    <footer className="public-footer relative overflow-hidden bg-[var(--gym-ink)] pt-8 pb-6 sm:pt-14 sm:pb-9 lg:pt-[72px] lg:pb-12">
      {/* Background pattern — same asset & placement as GymTrainer */}
      <img
        src={footerPattern}
        alt=""
        aria-hidden
        className="pointer-events-none absolute start-0 top-0 w-[min(100%,680px)] max-w-none opacity-15 select-none"
        draggable={false}
      />
      <img
        src={footerPattern}
        alt=""
        aria-hidden
        className="pointer-events-none absolute -bottom-[180px] -end-[180px] w-[min(110%,680px)] max-w-none opacity-15 select-none"
        draggable={false}
      />

      <div className="relative z-10 mx-auto w-full max-w-[1300px] px-[15px] md:px-[30px]">
        <div className="grid grid-cols-1 items-start gap-7 sm:gap-10 md:grid-cols-2 md:gap-10 xl:grid-cols-[1fr_1fr_1fr] xl:gap-16">
          {/* Brand + contact */}
          <div className="flex h-full flex-col items-start gap-4 sm:gap-7">
            <Link
              to={APP_ROUTES.public.home}
              className="font-heading text-[28px] font-bold leading-none tracking-tight text-white transition-colors duration-300 hover:text-[var(--gym-lime)] sm:text-[40px] lg:text-[44px]"
            >
              {t("app.name")}
            </Link>

            <div className="flex w-full flex-col gap-4 sm:gap-7">
              <div className="flex items-start gap-2.5 sm:gap-5">
                <img
                  src={phoneIcon}
                  alt=""
                  aria-hidden
                  className="mt-0.5 size-6 shrink-0 sm:size-7"
                  width={28}
                  height={28}
                />
                <div className="flex min-w-0 flex-col gap-0.5 sm:gap-1.5">
                  <p className="text-[13px] text-white sm:text-[16px]">{t("footer.callLabel")}</p>
                  <a
                    href={`tel:${t("footer.phone1Raw")}`}
                    className="font-heading text-[14px] font-bold text-white transition-colors duration-300 hover:text-[var(--gym-lime)] sm:text-[17px]"
                  >
                    {t("footer.phone1")}
                  </a>
                  <a
                    href={`tel:${t("footer.phone2Raw")}`}
                    className="font-heading text-[14px] font-bold text-white transition-colors duration-300 hover:text-[var(--gym-lime)] sm:text-[17px]"
                  >
                    {t("footer.phone2")}
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-2.5 sm:gap-5">
                <img
                  src={mailIcon}
                  alt=""
                  aria-hidden
                  className="mt-0.5 size-6 shrink-0 sm:size-7"
                  width={28}
                  height={28}
                />
                <div className="flex min-w-0 flex-col gap-0.5 sm:gap-1.5">
                  <p className="text-[13px] text-white sm:text-[16px]">{t("footer.emailLabel")}</p>
                  <a
                    href={`mailto:${t("footer.email")}`}
                    className="font-heading text-[14px] font-bold text-white transition-colors duration-300 hover:text-[var(--gym-lime)] sm:text-[17px]"
                  >
                    {t("footer.email")}
                  </a>
                </div>
              </div>
            </div>

            {/* Credit stays with brand on desktop; moved to footer end on mobile */}
            <p className="mt-auto hidden text-[14px] leading-relaxed text-[#d7dddd] sm:block sm:text-[15px]">
              {t("footer.creditBefore")}{" "}
              <span className="text-[var(--gym-lime)]">{t("footer.creditBrand")}</span>
            </p>
          </div>

          {/* Pages + Account — always 2 cols so mobile stays short */}
          <div className="grid grid-cols-2 gap-5 sm:gap-5 md:gap-[30px] xl:gap-10">
            <div>
              <h2 className="mb-2.5 font-heading text-[16px] font-bold text-white sm:mb-4 sm:text-[18px] xl:mb-5 xl:text-[22px]">
                {t("footer.pagesTitle")}
              </h2>
              <ul className="flex flex-col items-start gap-2 sm:gap-3">
                {PAGE_LINKS.map((item) => (
                  <li key={item.labelKey}>
                    <FooterNavLink
                      label={t(item.labelKey)}
                      to={item.to}
                      end={"end" in item ? item.end : false}
                    />
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h2 className="mb-2.5 font-heading text-[16px] font-bold text-white sm:mb-4 sm:text-[18px] xl:mb-5 xl:text-[22px]">
                {t("footer.utilityTitle")}
              </h2>
              <ul className="flex flex-col items-start gap-2 sm:gap-3">
                {UTILITY_LINKS.map((item) => (
                  <li key={item.labelKey}>
                    <FooterNavLink
                      label={t(item.labelKey)}
                      to={item.to}
                      end={"end" in item ? item.end : false}
                    />
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Contact form */}
          <div className="md:col-span-2 xl:col-span-1">
            <h2 className="mb-3 font-heading text-[18px] font-bold text-white sm:mb-4 sm:text-[24px] xl:mb-5 xl:text-[28px]">
              {t("footer.formTitle")}
            </h2>

            <form className="flex flex-col gap-3 sm:gap-5" onSubmit={onSubmit} noValidate>
              <input
                name="name"
                type="text"
                required
                autoComplete="name"
                aria-label={t("footer.form.name")}
                placeholder={t("footer.form.name")}
                className={fieldClass}
              />

              <input
                name="email"
                type="email"
                required
                autoComplete="email"
                aria-label={t("footer.form.email")}
                placeholder={t("footer.form.email")}
                className={fieldClass}
              />

              <textarea
                name="message"
                required
                rows={2}
                aria-label={t("footer.form.message")}
                placeholder={t("footer.form.message")}
                className={cn(fieldClass, "min-h-[44px] resize-y sm:min-h-[64px]")}
              />

              <button
                type="submit"
                disabled={sending}
                className="mt-0.5 inline-flex h-11 w-full items-center justify-center rounded-[10px] bg-[var(--gym-lime)] px-5 font-heading text-[15px] font-medium text-[#1e2222] transition-opacity duration-300 hover:opacity-90 disabled:opacity-70 sm:h-12 sm:w-auto sm:px-[25px] sm:text-[17px]"
              >
                {sending ? t("footer.form.sending") : t("footer.form.submit")}
              </button>
            </form>
          </div>
        </div>

        <p className="mt-6 text-[13px] leading-relaxed text-[#d7dddd] sm:hidden">
          {t("footer.creditBefore")}{" "}
          <span className="text-[var(--gym-lime)]">{t("footer.creditBrand")}</span>
        </p>
      </div>
    </footer>
  )
}
