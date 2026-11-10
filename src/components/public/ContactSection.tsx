import { useEffect, useRef, useState, type ReactNode } from "react"
import { useTranslation } from "react-i18next"
import { AnimatePresence, motion } from "motion/react"
import { Check, Headphones, Mail } from "lucide-react"
import SlideCommit from "@/components/SlideCommit.tsx"
import { useCreateRegistrationRequestMutation } from "@/features/subscribers/hooks"
import { usePackagesQuery } from "@/features/subscriptions/hooks"
import { useLocale } from "@/hooks/useLocale"
import { appToast } from "@/lib/toast"
import { cn } from "@/lib/utils"
import contactImage from "@/assets/contact.webp"

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const PHONE_RE = /^\+?[\d\s()-]{8,20}$/
const MESSAGE_MIN = 10
const MESSAGE_MAX = 1000

type FieldKey =
  | "firstName"
  | "lastName"
  | "email"
  | "phone"
  | "plan"
  | "message"

type FieldErrors = Partial<Record<FieldKey, string>>

const FIELD_ORDER: FieldKey[] = [
  "firstName",
  "lastName",
  "email",
  "phone",
  "plan",
  "message",
]

const baseFieldClass = cn(
  "w-full rounded-2xl border bg-[#f7f7f7] px-5",
  "font-heading text-[15px] font-medium text-[var(--gym-ink)] outline-none",
  "placeholder:font-normal placeholder:text-[var(--gym-muted)]/55",
  "transition-[background-color,box-shadow,border-color] duration-300 ease-out",
  "sm:text-[15px]",
)

const fieldIdleClass = cn(
  "border-[var(--gym-ink)]/8",
  "hover:border-[var(--gym-ink)]/14 hover:bg-[#f3f3f3]",
  "focus:border-[var(--gym-ink)]/20 focus:bg-white focus:shadow-[0_8px_28px_rgba(0,0,0,0.08)]",
)

const fieldErrorClass = cn(
  "border-[#e5484d]/55 bg-[#fff7f7]",
  "focus:border-[#e5484d]/70 focus:bg-white focus:shadow-[0_8px_28px_rgba(229,72,77,0.12)]",
)

const inputFieldClass = cn(baseFieldClass, "h-[54px] sm:h-[58px]")
const textareaFieldClass = cn(
  baseFieldClass,
  "min-h-[128px] resize-y py-4 leading-relaxed sm:min-h-[140px]",
)

const labelClass =
  "mb-2.5 block font-heading text-[13px] font-semibold tracking-[0.02em] text-[var(--gym-ink)]/80 sm:text-[14px]"

function fieldClassName(hasError: boolean, extra?: string) {
  return cn(extra, hasError ? fieldErrorClass : fieldIdleClass)
}

export function ContactSection() {
  const { t } = useTranslation()
  const { locale, isRtl } = useLocale()
  const { data: packages = [] } = usePackagesQuery()
  const createRequestMutation = useCreateRegistrationRequestMutation()
  const activePackages = packages.filter((pkg) => pkg.isActive)

  const formRef = useRef<HTMLFormElement>(null)
  const slideWrapRef = useRef<HTMLDivElement>(null)
  const fieldRefs = useRef<Partial<Record<FieldKey, HTMLElement | null>>>({})
  const [slideWidth, setSlideWidth] = useState(320)
  const [submitted, setSubmitted] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState("")
  const [errors, setErrors] = useState<FieldErrors>({})

  useEffect(() => {
    function onSelectPackage(event: Event) {
      const detail = (event as CustomEvent<{ packageId?: string }>).detail
      if (detail?.packageId) {
        setSelectedPlan(detail.packageId)
        clearFieldError("plan")
      }
    }
    window.addEventListener("derpyfit:select-package", onSelectPackage)
    return () =>
      window.removeEventListener("derpyfit:select-package", onSelectPackage)
  }, [])

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

  function clearFieldError(field: FieldKey) {
    setErrors((prev) => {
      if (!prev[field]) return prev
      const next = { ...prev }
      delete next[field]
      return next
    })
  }

  function readFormValues() {
    const form = formRef.current
    if (!form) {
      return {
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        plan: "",
        message: "",
      }
    }
    const data = new FormData(form)
    return {
      firstName: String(data.get("firstName") ?? "").trim(),
      lastName: String(data.get("lastName") ?? "").trim(),
      email: String(data.get("email") ?? "").trim(),
      phone: String(data.get("phone") ?? "").trim(),
      plan: String(data.get("plan") ?? "").trim(),
      message: String(data.get("message") ?? "").trim(),
    }
  }

  function validateForm(): FieldErrors {
    const { firstName, lastName, email, phone, plan, message } = readFormValues()
    const next: FieldErrors = {}

    if (!firstName) next.firstName = t("contact.errors.firstNameRequired")
    else if (firstName.length < 2) next.firstName = t("contact.errors.firstNameShort")

    if (!lastName) next.lastName = t("contact.errors.lastNameRequired")
    else if (lastName.length < 2) next.lastName = t("contact.errors.lastNameShort")

    if (!email) next.email = t("contact.errors.emailRequired")
    else if (!EMAIL_RE.test(email)) next.email = t("contact.errors.emailInvalid")

    if (!phone) next.phone = t("contact.errors.phoneRequired")
    else if (!PHONE_RE.test(phone) || phone.replace(/\D/g, "").length < 8) {
      next.phone = t("contact.errors.phoneInvalid")
    }

    if (!plan) next.plan = t("contact.errors.planRequired")

    if (!message) next.message = t("contact.errors.messageRequired")
    else if (message.length < MESSAGE_MIN) {
      next.message = t("contact.errors.messageShort", { min: MESSAGE_MIN })
    } else if (message.length > MESSAGE_MAX) {
      next.message = t("contact.errors.messageLong", { max: MESSAGE_MAX })
    }

    return next
  }

  function focusFirstError(nextErrors: FieldErrors) {
    const firstKey = FIELD_ORDER.find((key) => nextErrors[key])
    if (!firstKey) return
    const el = fieldRefs.current[firstKey]
    if (!el) return
    el.scrollIntoView({ behavior: "smooth", block: "center" })
    if (typeof (el as HTMLInputElement).focus === "function") {
      window.setTimeout(() => (el as HTMLInputElement).focus(), 180)
    }
  }

  async function handleConfirm() {
    const nextErrors = validateForm()
    setErrors(nextErrors)

    const firstKey = FIELD_ORDER.find((key) => nextErrors[key])
    if (firstKey) {
      appToast.error(nextErrors[firstKey] || t("contact.toast.invalid"))
      focusFirstError(nextErrors)
      throw new Error("invalid")
    }

    const form = formRef.current
    if (!form) throw new Error("invalid")
    const { firstName, lastName, email, phone, plan, message } = readFormValues()

    try {
      const fullName = `${firstName} ${lastName}`.trim()
      await createRequestMutation.mutateAsync({
        displayName: fullName,
        name: { en: fullName, ar: fullName },
        email,
        phone,
        locale,
        packageId: plan || null,
        goal: { en: message, ar: message },
        source: "contact",
      })
    } catch {
      appToast.error(t("contact.toast.failed"))
      throw new Error("failed")
    }
  }

  function resetForm() {
    setSubmitted(false)
    setErrors({})
    setSelectedPlan("")
    window.setTimeout(() => formRef.current?.reset(), 0)
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
                onClick={resetForm}
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
                    <Field
                      label={t("contact.fields.firstName")}
                      error={errors.firstName}
                      errorId="contact-error-firstName"
                    >
                      <input
                        ref={(el) => {
                          fieldRefs.current.firstName = el
                        }}
                        name="firstName"
                        type="text"
                        autoComplete="given-name"
                        placeholder={t("contact.placeholders.firstName")}
                        aria-invalid={Boolean(errors.firstName)}
                        aria-describedby={
                          errors.firstName ? "contact-error-firstName" : undefined
                        }
                        onInput={() => clearFieldError("firstName")}
                        className={fieldClassName(
                          Boolean(errors.firstName),
                          inputFieldClass,
                        )}
                      />
                    </Field>
                    <Field
                      label={t("contact.fields.lastName")}
                      error={errors.lastName}
                      errorId="contact-error-lastName"
                    >
                      <input
                        ref={(el) => {
                          fieldRefs.current.lastName = el
                        }}
                        name="lastName"
                        type="text"
                        autoComplete="family-name"
                        placeholder={t("contact.placeholders.lastName")}
                        aria-invalid={Boolean(errors.lastName)}
                        aria-describedby={
                          errors.lastName ? "contact-error-lastName" : undefined
                        }
                        onInput={() => clearFieldError("lastName")}
                        className={fieldClassName(
                          Boolean(errors.lastName),
                          inputFieldClass,
                        )}
                      />
                    </Field>
                  </div>

                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 sm:gap-5">
                    <Field
                      label={t("contact.fields.email")}
                      error={errors.email}
                      errorId="contact-error-email"
                    >
                      <input
                        ref={(el) => {
                          fieldRefs.current.email = el
                        }}
                        name="email"
                        type="email"
                        autoComplete="email"
                        inputMode="email"
                        placeholder={t("contact.placeholders.email")}
                        aria-invalid={Boolean(errors.email)}
                        aria-describedby={
                          errors.email ? "contact-error-email" : undefined
                        }
                        onInput={() => clearFieldError("email")}
                        className={fieldClassName(
                          Boolean(errors.email),
                          inputFieldClass,
                        )}
                      />
                    </Field>
                    <Field
                      label={t("contact.fields.phone")}
                      error={errors.phone}
                      errorId="contact-error-phone"
                    >
                      <input
                        ref={(el) => {
                          fieldRefs.current.phone = el
                        }}
                        name="phone"
                        type="tel"
                        autoComplete="tel"
                        inputMode="tel"
                        placeholder={t("contact.placeholders.phone")}
                        aria-invalid={Boolean(errors.phone)}
                        aria-describedby={
                          errors.phone ? "contact-error-phone" : undefined
                        }
                        onInput={() => clearFieldError("phone")}
                        className={fieldClassName(
                          Boolean(errors.phone),
                          inputFieldClass,
                        )}
                      />
                    </Field>
                  </div>

                  <Field
                    label={t("contact.fields.plan")}
                    error={errors.plan}
                    errorId="contact-error-plan"
                  >
                    <div className="relative">
                      <select
                        ref={(el) => {
                          fieldRefs.current.plan = el
                        }}
                        name="plan"
                        value={selectedPlan}
                        aria-invalid={Boolean(errors.plan)}
                        aria-describedby={
                          errors.plan ? "contact-error-plan" : undefined
                        }
                        onChange={(e) => {
                          setSelectedPlan(e.target.value)
                          clearFieldError("plan")
                        }}
                        className={fieldClassName(
                          Boolean(errors.plan),
                          cn(inputFieldClass, "appearance-none pe-12"),
                        )}
                      >
                        <option value="" disabled>
                          {t("contact.placeholders.plan")}
                        </option>
                        {activePackages.map((pkg) => (
                          <option key={pkg.id} value={pkg.id}>
                            {pkg.name[locale]} — {pkg.price[locale]}
                          </option>
                        ))}
                      </select>
                      <span
                        aria-hidden
                        className={cn(
                          "pointer-events-none absolute top-1/2 inline-flex size-7 -translate-y-1/2 items-center justify-center rounded-full bg-white/70 text-[var(--gym-ink)]",
                          isRtl ? "left-3" : "right-3",
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
                  </Field>

                  <Field
                    label={t("contact.fields.message")}
                    error={errors.message}
                    errorId="contact-error-message"
                  >
                    <textarea
                      ref={(el) => {
                        fieldRefs.current.message = el
                      }}
                      name="message"
                      rows={5}
                      maxLength={MESSAGE_MAX}
                      placeholder={t("contact.placeholders.message")}
                      aria-invalid={Boolean(errors.message)}
                      aria-describedby={
                        errors.message ? "contact-error-message" : undefined
                      }
                      onInput={() => clearFieldError("message")}
                      className={fieldClassName(
                        Boolean(errors.message),
                        textareaFieldClass,
                      )}
                    />
                  </Field>

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

function Field({
  label,
  error,
  errorId,
  children,
}: {
  label: string
  error?: string
  errorId?: string
  children: ReactNode
}) {
  return (
    <label className="block">
      <span className={labelClass}>{label}</span>
      {children}
      {error ? (
        <span
          id={errorId}
          role="alert"
          className="mt-2 block text-[12.5px] font-medium leading-snug text-[#c44536]"
        >
          {error}
        </span>
      ) : null}
    </label>
  )
}
