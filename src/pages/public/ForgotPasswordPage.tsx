import { useEffect, useMemo, useState, type FormEvent } from "react"
import { Link } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { ArrowLeft } from "lucide-react"
import { sendPasswordResetEmail } from "firebase/auth"
import { APP_ROUTES } from "@/config/constants"
import { firebaseAuthErrorKey } from "@/features/auth/errors"
import { useDocumentTitle } from "@/hooks/useDocumentTitle"
import { getFirebaseAuth } from "@/lib/firebase/auth"
import { appToast } from "@/lib/toast"
import { cn } from "@/lib/utils"
import {
  authInputClass,
  authLabelClass,
  authPageTitleClass,
  authPrimaryBtnClass,
  authSecondaryBtnClass,
} from "@/components/auth/styles"

const COOLDOWN_MS = 60_000
const STORAGE_KEY = "trainer.auth.resetCooldown"

type CooldownState = {
  email: string
  until: number
}

function readCooldown(): CooldownState | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as CooldownState
    if (!parsed?.until || parsed.until <= Date.now()) {
      sessionStorage.removeItem(STORAGE_KEY)
      return null
    }
    return parsed
  } catch {
    return null
  }
}

function writeCooldown(state: CooldownState | null) {
  try {
    if (!state) {
      sessionStorage.removeItem(STORAGE_KEY)
      return
    }
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {
    // private mode / quota
  }
}

export function ForgotPasswordPage() {
  const { t } = useTranslation()
  useDocumentTitle(t("auth.forgotTitle"))

  const [email, setEmail] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [sentTo, setSentTo] = useState<string | null>(null)
  const [cooldownUntil, setCooldownUntil] = useState(0)
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    const saved = readCooldown()
    if (!saved) return
    setEmail(saved.email)
    setSentTo(saved.email)
    setCooldownUntil(saved.until)
  }, [])

  const remainingMs = Math.max(0, cooldownUntil - now)
  const coolingDown = remainingMs > 0
  const remainingSec = Math.ceil(remainingMs / 1000)
  const progress = useMemo(
    () => (coolingDown ? remainingMs / COOLDOWN_MS : 0),
    [coolingDown, remainingMs],
  )

  useEffect(() => {
    if (!coolingDown) return
    const id = window.setInterval(() => {
      const tNow = Date.now()
      setNow(tNow)
      if (tNow >= cooldownUntil) writeCooldown(null)
    }, 80)
    return () => window.clearInterval(id)
  }, [coolingDown, cooldownUntil])

  function startCooldown(nextEmail: string) {
    const until = Date.now() + COOLDOWN_MS
    const next = { email: nextEmail, until }
    writeCooldown(next)
    setSentTo(nextEmail)
    setCooldownUntil(until)
    setNow(Date.now())
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (coolingDown || submitting) return

    const form = event.currentTarget
    if (!form.checkValidity()) {
      form.reportValidity()
      appToast.error(t("auth.toast.invalid"))
      return
    }

    const nextEmail = email.trim()
    setSubmitting(true)
    try {
      await sendPasswordResetEmail(getFirebaseAuth(), nextEmail)
      appToast.success(t("auth.toast.resetSent"))
      startCooldown(nextEmail)
    } catch (error) {
      const key = firebaseAuthErrorKey(error)
      if (key === "auth.errors.invalidCredential") {
        appToast.success(t("auth.toast.resetSent"))
        startCooldown(nextEmail)
      } else {
        appToast.error(t(key))
      }
    } finally {
      setSubmitting(false)
    }
  }

  const title = sentTo ? t("auth.forgotSentTitle") : t("auth.forgotTitle")
  const subtitle = sentTo
    ? t("auth.forgotSentSubtitle", { email: sentTo })
    : t("auth.forgotSubtitle")
  const submitLabel = submitting
    ? t("auth.submitting")
    : coolingDown
      ? t("auth.forgotResendIn", { seconds: remainingSec })
      : sentTo
        ? t("auth.forgotResend")
        : t("auth.forgotSubmit")

  return (
    <section className="flex w-full flex-col items-stretch gap-3 sm:items-center sm:gap-4 lg:gap-5">
      <div className="w-full text-center lg:max-w-[360px]">
        <h1
          className={cn(
            authPageTitleClass,
            "mt-0 text-[17px] sm:text-[20px]",
            sentTo && "font-bold text-[var(--gym-ink)]",
          )}
        >
          {title}
        </h1>
        <p className="mt-1.5 text-[12.5px] leading-snug text-[var(--gym-muted)]/85 sm:mt-2 sm:text-[14px]">
          {subtitle}
        </p>
      </div>

      <form
        className="flex w-full flex-col gap-3 sm:max-w-[360px] sm:gap-3.5"
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
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder={t("auth.placeholders.email")}
            className={authInputClass}
            readOnly={coolingDown}
          />
        </label>

        <div className="mt-1 flex flex-col gap-2.5">
          <button
            type="submit"
            disabled={submitting || coolingDown}
            className={cn(
              authPrimaryBtnClass,
              "relative overflow-hidden",
              coolingDown && "disabled:opacity-100",
            )}
          >
            <span className="relative z-10">{submitLabel}</span>
            {coolingDown ? (
              <span
                aria-hidden
                className="pointer-events-none absolute inset-x-0 bottom-0 h-[5px] bg-white/20"
              >
                <span
                  className="block h-full origin-left bg-[var(--gym-lime,#fb5001)] rtl:origin-right"
                  style={{ transform: `scaleX(${progress})` }}
                />
              </span>
            ) : null}
          </button>

          <Link to={APP_ROUTES.public.login} className={authSecondaryBtnClass}>
            <ArrowLeft className="size-4 rtl:rotate-180" strokeWidth={2} />
            {t("auth.backToLogin")}
          </Link>
        </div>
      </form>
    </section>
  )
}
