import { useEffect, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import { AnimatePresence, motion } from "motion/react"
import { Check, Headphones, Mail } from "lucide-react"
import SlideCommit from "@/components/SlideCommit.tsx"
import { useLocale } from "@/hooks/useLocale"
import { appToast } from "@/lib/toast"
import { cn } from "@/lib/utils"
import contactImage from "@/assets/contact.webp"

const PLAN_IDS = ["quick", "transform", "elite"] as const

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const PHONE_RE = /^\+?[\d\s()-]{8,20}$/
const MESSAGE_MIN = 10
const MESSAGE_MAX = 1000

const baseFieldClass = cn(
  "w-full rounded-2xl border border-[var(--gym-ink)]/8 bg-[#f7f7f7] px-5",
  "font-heading text-[15px] font-medium text-[var(--gym-ink)] outline-none",
  "placeholder:font-normal placeholder:text-[var(--gym-muted)]/55",
  "transition-[background-color,box-shadow,border-color] duration-300 ease-out",
  "hover:border-[var(--gym-ink)]/14 hover:bg-[#f3f3f3]",
  "focus:border-[var(--gym-ink)]/20 focus:bg-white focus:shadow-[0_8px_28px_rgba(0,0,0,0.08)]",
  "sm:text-[15px]"
)

const inputFieldClass = cn(baseFieldClass, "h-[54px] sm:h-[58px]")
const textareaFieldClass = cn(
  baseFieldClass,
  "min-h-[128px] resize-y py-4 leading-relaxed sm:min-h-[140px]"
)

const labelClass =
  "mb-2.5 block font-heading text-[13px] font-semibold tracking-[0.02em] text-[var(--gym-ink)]/80 sm:text-[14px]"

export function ContactSection() {
  const { t } = useTranslation()
  const { isRtl } = useLocale()
  const formRef = useRef<HTMLFormElement>(null)
  const slideWrapRef = useRef<HTMLDivElement>(null)
  const [slideWidth, setSlideWidth] = useState(320)
  const [submitted, setSubmitted] = useState(false)

  useEffect(() => {
    if (submitted) return
    const el = slideWrapRef.current
    if (!el) return

    const measure = () => {
      const w = Math.floor(el.clientWidth)
      setSlideWidth(Math.max(200, w))
    }
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [submitted])

  function isFormValid(): boolean {
    const form = formRef.current
    if (!form) return false

    const data = new FormData(form)
    const firstName = String(data.get("firstName") ?? "").trim()
    const lastName = String(data.get("lastName") ?? "").trim()
    const email = String(data.get("email") ?? "").trim()
    const phone = String(data.get("phone") ?? "").trim()
    const plan = String(data.get("plan") ?? "").trim()
    const message = String(data.get("message") ?? "").trim()

    if (firstName.length < 2 || lastName.length < 2) return false
    if (!EMAIL_RE.test(email)) return false
    if (!PHONE_RE.test(phone) || phone.replace(/\D/g, "").length < 8) return false
    if (!(PLAN_IDS as readonly string[]).includes(plan)) return false
    if (message.length < MESSAGE_MIN || message.length > MESSAGE_MAX) return false

    return true
  }

  async function handleConfirm() {
    if (!isFormValid()) {
      appToast.error(t("contact.toast.invalid"))
      throw new Error("invalid")
    }

    try {
      await new Promise<void>((resolve) => {
        window.setTimeout(resolve, 1400)
      })
    } catch {
      appToast.error(t("contact.toast.failed"))
      throw new Error("failed")
    }
  }

  return (
    <section
      id="contact"
      className="w-full scroll-mt-24 overflow-x-hidden bg-white px-6 pb-16 pt-8 md:px-10 md:pb-20 md:pt-10 lg:px-14 lg:pb-[72px] lg:pt-12 xl:pb-[96px] xl:pt-14"
    >
      <div className="mx-auto w-full min-w-0 max-w-[1300px]">
        <AnimatePresence mode="wait">
          {submitted ? (
            <motion.div
              key="success"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
              className="flex min-h-[420px] flex-col items-center justify-center py-16 text-center sm:min-h-[480px] sm:py-20"
            >
              <span className="inline-flex size-16 items-center justify-center rounded-full bg-[var(--gym-lime)] text-white sm:size-[72px]">
                <Check className="size-8 sm:size-9" strokeWidth={2.5} />
              </span>
              <h2 className="mt-6 max-w-[18ch] font-heading text-[32px] font-extrabold leading-[1.15] tracking-tight text-[var(--gym-ink)] sm:mt-8 sm:text-[40px] md:text-[46px]">
                {t("contact.success")}
              </h2>
              <p className="mt-4 max-w-[36em] text-[16px] leading-relaxed text-[var(--gym-muted)] sm:text-[17px]">
                {t("contact.successHint")}
              </p>
              <button
                type="button"
                onClick={() => setSubmitted(false)}
                className="mt-8 inline-flex h-[50px] items-center justify-center rounded-full border border-[var(--gym-ink)] bg-white px-7 font-heading text-[15px] font-bold text-[var(--gym-ink)] transition-colors duration-300 hover:bg-[var(--gym-ink)] hover:text-white sm:mt-10 sm:text-[16px]"
              >
                {t("contact.newForm")}
              </button>
            </motion.div>
          ) : (
            <motion.div
              key="form-layout"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              className="grid min-w-0 grid-cols-1 items-stretch gap-8 lg:grid-cols-2 lg:gap-8 xl:gap-10"
            >
              <div className="relative min-h-[420px] overflow-hidden rounded-[10px] sm:min-h-[520px] lg:min-h-full">
                <img
                  src={contactImage}
                  alt={t("contact.imageAlt")}
                  className="absolute inset-0 size-full object-cover object-center"
                  loading="lazy"
                  decoding="async"
                  draggable={false}
                />

                <div className="absolute inset-x-2.5 bottom-4 z-10 grid grid-cols-1 gap-2.5 sm:inset-x-3 sm:bottom-5 sm:grid-cols-2 sm:gap-3 lg:inset-x-2.5 xl:inset-x-3">
                  <a
                    href={`tel:${t("contact.emergencyPhoneRaw")}`}
                    className="flex items-center gap-3.5 rounded-[12px] bg-white px-4 py-4 shadow-[0_10px_30px_rgba(0,0,0,0.12)] transition-transform duration-300 hover:-translate-y-0.5 sm:gap-4 sm:px-5 sm:py-[18px]"
                  >
                    <span className="inline-flex shrink-0 items-center justify-center text-[var(--gym-ink)]">
                      <Headphones className="size-9 sm:size-10" strokeWidth={1.6} />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-[13px] font-medium text-[var(--gym-muted)] sm:text-[14px]">
                        {t("contact.emergencyLabel")}
                      </span>
                      <span className="mt-1 block truncate font-heading text-[16px] font-extrabold tracking-tight text-[var(--gym-ink)] sm:text-[18px]">
                        {t("contact.emergencyPhone")}
                      </span>
                    </span>
                  </a>

                  <a
                    href={`mailto:${t("contact.supportEmail")}`}
                    className="flex items-center gap-3.5 rounded-[12px] bg-[var(--gym-lime)] px-4 py-4 shadow-[0_10px_30px_rgba(0,0,0,0.12)] transition-transform duration-300 hover:-translate-y-0.5 sm:gap-4 sm:px-5 sm:py-[18px]"
                  >
                    <span className="inline-flex shrink-0 items-center justify-center text-white">
                      <Mail className="size-9 sm:size-10" strokeWidth={1.6} />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-[13px] font-medium text-white/85 sm:text-[14px]">
                        {t("contact.supportLabel")}
                      </span>
                      <span className="mt-1 block truncate font-heading text-[15px] font-extrabold uppercase tracking-tight text-white sm:text-[17px]">
                        {t("contact.supportEmail")}
                      </span>
                    </span>
                  </a>
                </div>
              </div>

              <div className="flex min-w-0 flex-col justify-center lg:py-2">
                <h2 className="max-w-[14ch] font-heading text-[36px] font-extrabold leading-[1.1] tracking-tight text-[var(--gym-ink)] sm:text-[44px] md:text-[50px] lg:text-[56px] xl:text-[60px]">
                  {t("contact.title")}
                </h2>

                <form
                  ref={formRef}
                  className="mt-8 flex flex-col gap-6 sm:mt-10 sm:gap-7"
                  noValidate
                  onSubmit={(event) => event.preventDefault()}
                >
                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 sm:gap-5">
                    <label className="block">
                      <span className={labelClass}>{t("contact.fields.firstName")}</span>
                      <input
                        name="firstName"
                        type="text"
                        autoComplete="given-name"
                        placeholder={t("contact.placeholders.firstName")}
                        className={inputFieldClass}
                      />
                    </label>
                    <label className="block">
                      <span className={labelClass}>{t("contact.fields.lastName")}</span>
                      <input
                        name="lastName"
                        type="text"
                        autoComplete="family-name"
                        placeholder={t("contact.placeholders.lastName")}
                        className={inputFieldClass}
                      />
                    </label>
                  </div>

                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 sm:gap-5">
                    <label className="block">
                      <span className={labelClass}>{t("contact.fields.email")}</span>
                      <input
                        name="email"
                        type="email"
                        autoComplete="email"
                        placeholder={t("contact.placeholders.email")}
                        className={inputFieldClass}
                      />
                    </label>
                    <label className="block">
                      <span className={labelClass}>{t("contact.fields.phone")}</span>
                      <input
                        name="phone"
                        type="tel"
                        autoComplete="tel"
                        placeholder={t("contact.placeholders.phone")}
                        className={inputFieldClass}
                      />
                    </label>
                  </div>

                  <label className="block">
                    <span className={labelClass}>{t("contact.fields.plan")}</span>
                    <div className="relative">
                      <select
                        name="plan"
                        defaultValue=""
                        className={cn(inputFieldClass, "appearance-none pe-12")}
                      >
                        <option value="" disabled>
                          {t("contact.placeholders.plan")}
                        </option>
                        {PLAN_IDS.map((id) => (
                          <option key={id} value={id}>
                            {t(`packages.items.${id}.name`)}
                          </option>
                        ))}
                      </select>
                      <span
                        aria-hidden
                        className={cn(
                          "pointer-events-none absolute top-1/2 inline-flex size-7 -translate-y-1/2 items-center justify-center rounded-full bg-white/70 text-[var(--gym-ink)]",
                          isRtl ? "left-3" : "right-3"
                        )}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
                          <path
                            d="M6 9l6 6 6-6"
                            stroke="currentColor"
                            strokeWidth="2.25"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </span>
                    </div>
                  </label>

                  <label className="block">
                    <span className={labelClass}>{t("contact.fields.message")}</span>
                    <textarea
                      name="message"
                      rows={5}
                      maxLength={MESSAGE_MAX}
                      placeholder={t("contact.placeholders.message")}
                      className={textareaFieldClass}
                    />
                  </label>

                  <div ref={slideWrapRef} className="mt-2 w-full min-w-0 max-w-full overflow-hidden">
                    <p className="mb-3 flex items-center gap-2 font-heading text-[13px] font-medium text-[var(--gym-muted)] sm:text-[14px]">
                      <span className="contact-slide-hint inline-flex items-center gap-1.5">
                        <span aria-hidden className="contact-slide-hint__chevron">
                          →
                        </span>
                        {t("contact.slideHint")}
                      </span>
                    </p>

                    <div className="w-full min-w-0 max-w-full overflow-hidden">
                      <SlideCommit
                        key={slideWidth}
                        label={t("contact.slideLabel")}
                        doneLabel={t("contact.slideDone")}
                        errorLabel={t("contact.slideError")}
                        onConfirm={handleConfirm}
                        onDone={() => {
                          appToast.success(t("contact.toast.success"))
                          window.setTimeout(() => setSubmitted(true), 900)
                        }}
                        trackColor="#24030c"
                        handleColor="#fb5001"
                        successColor="#fb5001"
                        dangerColor="#e5484d"
                        width={slideWidth}
                        height={56}
                        radius={28}
                        holdMs={1100}
                        landingDip={0}
                        className="contact-slide w-full max-w-full"
                      />
                    </div>
                  </div>
                </form>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  )
}
