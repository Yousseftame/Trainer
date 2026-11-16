import { useMemo, useState, type FormEvent } from "react"
import { Link, useLocation } from "react-router-dom"
import { useTranslation } from "react-i18next"
import {
  FaFacebookF,
  FaInstagram,
  FaLinkedinIn,
  FaTiktok,
  FaYoutube,
} from "react-icons/fa6"
import { BrandLogo } from "@/components/shared/BrandLogo"
import { APP_ROUTES } from "@/config/constants"
import {
  DEFAULT_FOOTER_CONTACT,
  DEFAULT_FOOTER_SOCIALS,
  useFooterContentQuery,
} from "@/features/website"
import { appToast } from "@/lib/toast"
import { cn } from "@/lib/utils"
import type { VideoBannerSocialNetwork } from "@/types/website"
import footerPattern from "@/assets/footer/footer-bg-pattern.avif"
import phoneIcon from "@/assets/footer/footer-icon-phone.svg"
import mailIcon from "@/assets/footer/footer-icon-mail.svg"

const SOCIAL_ICONS: Record<
  VideoBannerSocialNetwork,
  { Icon: typeof FaFacebookF; label: string }
> = {
  facebook: { Icon: FaFacebookF, label: "Facebook" },
  linkedin: { Icon: FaLinkedinIn, label: "LinkedIn" },
  youtube: { Icon: FaYoutube, label: "YouTube" },
  instagram: { Icon: FaInstagram, label: "Instagram" },
  tiktok: { Icon: FaTiktok, label: "TikTok" },
}

const PAGE_LINKS = [
  { labelKey: "footer.pages.home", to: APP_ROUTES.public.home, end: true },
  { labelKey: "footer.pages.about", to: APP_ROUTES.public.about },
  { labelKey: "footer.pages.faq", to: APP_ROUTES.public.faq },
  { labelKey: "footer.pages.services", to: APP_ROUTES.public.services },
  { labelKey: "footer.pages.packages", to: APP_ROUTES.public.packages },
] as const

const UTILITY_LINKS = [
  { labelKey: "footer.utility.login", to: APP_ROUTES.public.login },
  { labelKey: "footer.utility.dashboard", to: APP_ROUTES.subscriber.overview, end: true },
  { labelKey: "footer.utility.workout", to: APP_ROUTES.subscriber.workout },
] as const

const fieldClass = cn(
  "w-full border-0 border-b border-white/15 bg-transparent px-0 py-2 sm:py-2.5",
  "font-heading text-[15px] text-[#dcd6d8] outline-none sm:text-[16px]",
  "placeholder:text-[#dcd6d8]/80",
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
        isCurrent ? "text-[var(--gym-lime)]" : "text-[#dcd6d8] hover:text-[var(--gym-lime)]"
      )}
      aria-current={isCurrent ? "page" : undefined}
    >
      {label}
    </Link>
  )
}

function FooterSocialLinks({
  items,
}: {
  items: Array<{ network: VideoBannerSocialNetwork; href: string }>
}) {
  if (items.length === 0) return null

  return (
    <div className="flex flex-wrap items-center gap-2">
      {items.map(({ network, href }) => {
        const meta = SOCIAL_ICONS[network]
        const Icon = meta.Icon
        return (
          <a
            key={network}
            href={href}
            target="_blank"
            rel="noreferrer"
            aria-label={meta.label}
            className="inline-flex size-7 items-center justify-center rounded-[7px] bg-[var(--gym-lime)] text-white transition-transform duration-300 ease-out hover:scale-105 active:scale-95 sm:size-8 sm:rounded-[8px]"
          >
            <Icon className="size-3.5 sm:size-4" />
          </a>
        )
      })}
    </div>
  )
}

export function PublicFooter() {
  const { t } = useTranslation()
  const [sending, setSending] = useState(false)
  const { data: footerContent } = useFooterContentQuery({
    audience: "public",
  })

  const phone = footerContent?.phone?.trim() || t("footer.phone")
  const phoneRaw =
    footerContent?.phoneRaw?.trim() ||
    t("footer.phoneRaw") ||
    DEFAULT_FOOTER_CONTACT.phoneRaw
  const email = footerContent?.email?.trim() || t("footer.email")

  const socials = useMemo(() => {
    const source =
      footerContent?.socials?.length
        ? footerContent.socials
        : DEFAULT_FOOTER_SOCIALS
    return source
      .filter((item) => item.enabled)
      .map((item) => ({
        network: item.network,
        href: item.url.trim() || "#",
      }))
  }, [footerContent])

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
    <footer className="public-footer relative overflow-hidden bg-[var(--gym-dark)] pt-8 pb-6 sm:pt-14 sm:pb-9 lg:pt-[72px] lg:pb-12">
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
              className="inline-flex items-center transition-opacity duration-300 hover:opacity-90"
              aria-label={t("app.name")}
            >
              <BrandLogo variant="onDark" className="h-11 sm:h-14 lg:h-16" />
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
                  <p className="text-[13px] text-white sm:text-[16px]">
                    {t("footer.callLabel")}
                  </p>
                  <a
                    href={`tel:${phoneRaw}`}
                    className="font-heading text-[14px] font-bold text-white transition-colors duration-300 hover:text-[var(--gym-lime)] sm:text-[17px]"
                  >
                    {phone}
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
                  <p className="text-[13px] text-white sm:text-[16px]">
                    {t("footer.emailLabel")}
                  </p>
                  <a
                    href={`mailto:${email}`}
                    className="font-heading text-[14px] font-bold text-white transition-colors duration-300 hover:text-[var(--gym-lime)] sm:text-[17px]"
                  >
                    {email}
                  </a>
                </div>
              </div>

              {/* Mobile only — socials under email */}
              <div className="ps-[34px] sm:hidden">
                <FooterSocialLinks items={socials} />
              </div>
            </div>

            {/* Desktop — original position under contact block */}
            <div className="hidden flex-col items-start gap-4 pt-1 sm:flex">
              <FooterSocialLinks items={socials} />
              <p className="text-[14px] leading-relaxed text-[#dcd6d8] sm:text-[15px]">
                {t("footer.creditBefore")}{" "}
                <span className="text-[var(--gym-lime)]">
                  {t("footer.creditBrand")}
                </span>
              </p>
            </div>
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
                className="mt-0.5 inline-flex h-11 w-full items-center justify-center rounded-[10px] bg-[var(--gym-lime)] px-5 font-heading text-[15px] font-medium text-white transition-opacity duration-300 hover:opacity-90 disabled:opacity-70 sm:h-12 sm:w-auto sm:px-[25px] sm:text-[17px]"
              >
                {sending ? t("footer.form.sending") : t("footer.form.submit")}
              </button>
            </form>
          </div>
        </div>

        {/* Mobile only — credit after send message */}
        <p className="mt-5 text-[13px] leading-relaxed text-[#dcd6d8] sm:hidden">
          {t("footer.creditBefore")}{" "}
          <span className="text-[var(--gym-lime)]">
            {t("footer.creditBrand")}
          </span>
        </p>
      </div>
    </footer>
  )
}
