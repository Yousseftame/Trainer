import { useEffect, useId, useState } from "react"
import { createPortal } from "react-dom"
import { useTranslation } from "react-i18next"
import { Check, Copy, KeyRound, X } from "lucide-react"
import { FaWhatsapp } from "react-icons/fa6"
import { BrandLogo } from "@/components/shared/BrandLogo"
import gmailIcon from "@/assets/google_mail_gmail_logo_icon_159346.webp"
import { useLocale } from "@/hooks/useLocale"
import {
  getPublicLoginUrl,
  getPublicLogoUrl,
  openCredentialsWhatsApp,
  type ShareCredentialsPayload,
} from "@/lib/share-credentials"
import { callSendSubscriberCredentialsEmail } from "@/lib/firebase/callables"
import { appToast } from "@/lib/toast"
import { cn } from "@/lib/utils"

type ShareCredentialsDialogProps = {
  open: boolean
  payload: ShareCredentialsPayload | null
  onClose: () => void
}

export function ShareCredentialsDialog({
  open,
  payload,
  onClose,
}: ShareCredentialsDialogProps) {
  const { t } = useTranslation()
  const { locale, isRtl } = useLocale()
  const titleId = useId()
  const [sendingEmail, setSendingEmail] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!open) {
      setSendingEmail(false)
      setCopied(false)
      return
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !sendingEmail) onClose()
    }
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"
    document.addEventListener("keydown", onKeyDown)
    return () => {
      document.body.style.overflow = previousOverflow
      document.removeEventListener("keydown", onKeyDown)
    }
  }, [open, sendingEmail, onClose])

  if (!open || !payload || typeof document === "undefined") return null

  const loginUrl = getPublicLoginUrl()
  const canWhatsApp = Boolean(payload.phone.trim())
  const canEmail = Boolean(payload.email.trim() && payload.password.trim())

  async function handleCopy() {
    const text =
      locale === "ar"
        ? `البريد: ${payload!.email}\nكلمة المرور: ${payload!.password}\nالدخول: ${loginUrl}`
        : `Email: ${payload!.email}\nPassword: ${payload!.password}\nLogin: ${loginUrl}`
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1600)
      appToast.success(t("admin.shareCredentials.toasts.copied"))
    } catch {
      appToast.error(t("admin.shareCredentials.toasts.copyFailed"))
    }
  }

  function handleWhatsApp() {
    const ok = openCredentialsWhatsApp(payload!, locale)
    if (!ok) {
      appToast.error(t("admin.shareCredentials.toasts.whatsappFailed"))
      return
    }
    appToast.success(t("admin.shareCredentials.toasts.whatsappOpened"))
  }

  async function handleEmail() {
    if (!canEmail || sendingEmail) return
    setSendingEmail(true)
    try {
      await callSendSubscriberCredentialsEmail({
        subscriberId: payload!.subscriberId,
        toEmail: payload!.email,
        password: payload!.password,
        displayName: payload!.displayName,
        loginUrl,
        logoUrl: getPublicLogoUrl(),
        locale,
      })
      appToast.success(t("admin.shareCredentials.toasts.emailSent"))
    } catch (err) {
      appToast.error(
        err instanceof Error
          ? err.message
          : t("admin.shareCredentials.toasts.emailFailed"),
      )
    } finally {
      setSendingEmail(false)
    }
  }

  return createPortal(
    <div
      className="fixed inset-0 z-[130] flex items-end justify-center bg-black/45 p-3 sm:items-center sm:p-6"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !sendingEmail) onClose()
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        dir={isRtl ? "rtl" : "ltr"}
        className="max-h-[min(92dvh,720px)] w-full max-w-[520px] overflow-y-auto rounded-[24px] bg-white p-5 shadow-xl sm:p-7"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="mb-3">
              <BrandLogo variant="onLight" className="h-8" />
            </div>
            <h2
              id={titleId}
              className="text-[18px] font-bold text-[var(--gym-ink,#111111)]"
            >
              {t("admin.shareCredentials.title")}
            </h2>
            <p className="mt-1 text-[13px] font-medium leading-relaxed text-[#6B7280]">
              {t("admin.shareCredentials.hint")}
            </p>
          </div>
          <button
            type="button"
            disabled={sendingEmail}
            onClick={onClose}
            className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[#F4F4F4] disabled:opacity-60"
            aria-label={t("admin.shareCredentials.close")}
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="mt-5 rounded-[18px] border border-black/[0.06] bg-[#F7F7F7] p-4">
          <p className="text-[12px] font-bold uppercase tracking-[0.04em] text-[#8c8c8c]">
            {payload.displayName || t("admin.shareCredentials.member")}
          </p>
          <dl className="mt-3 space-y-2.5 text-[14px]">
            <div className="flex items-start justify-between gap-3">
              <dt className="text-[#8c8c8c]">{t("admin.shareCredentials.email")}</dt>
              <dd className="max-w-[65%] break-all text-end font-semibold text-[var(--gym-ink,#111111)]">
                {payload.email || "—"}
              </dd>
            </div>
            <div className="flex items-start justify-between gap-3">
              <dt className="inline-flex items-center gap-1.5 text-[#8c8c8c]">
                <KeyRound className="size-3.5" />
                {t("admin.shareCredentials.password")}
              </dt>
              <dd className="font-semibold tracking-wide text-[var(--gym-ink,#111111)]">
                {payload.password || "—"}
              </dd>
            </div>
            <div className="flex items-start justify-between gap-3">
              <dt className="text-[#8c8c8c]">{t("admin.shareCredentials.phone")}</dt>
              <dd className="font-semibold text-[var(--gym-ink,#111111)]" dir="ltr">
                {payload.phone || "—"}
              </dd>
            </div>
          </dl>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
          <button
            type="button"
            disabled={!canWhatsApp || sendingEmail}
            onClick={handleWhatsApp}
            className={cn(
              "inline-flex h-12 items-center justify-center gap-2 rounded-full px-4 text-[13px] font-bold text-white transition",
              canWhatsApp
                ? "bg-[#25D366] hover:opacity-90"
                : "cursor-not-allowed bg-[#25D366]/45",
            )}
          >
            <FaWhatsapp className="size-[18px]" aria-hidden />
            {t("admin.shareCredentials.whatsapp")}
          </button>
          <button
            type="button"
            disabled={!canEmail || sendingEmail}
            onClick={() => void handleEmail()}
            className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-[var(--gym-ink,#111111)] px-4 text-[13px] font-bold text-white transition hover:opacity-90 disabled:opacity-55"
          >
            <img
              src={gmailIcon}
              alt=""
              aria-hidden
              className="size-[18px] object-contain"
              draggable={false}
            />
            {sendingEmail
              ? t("admin.shareCredentials.sendingEmail")
              : t("admin.shareCredentials.emailAction")}
          </button>
        </div>

        <button
          type="button"
          disabled={sendingEmail}
          onClick={() => void handleCopy()}
          className="mt-3 inline-flex h-11 w-full items-center justify-center gap-2 rounded-full bg-[#F4F4F4] px-4 text-[13px] font-bold text-[var(--gym-ink,#111111)] transition hover:bg-[#ececec] disabled:opacity-60"
        >
          {copied ? (
            <Check className="size-4 text-[#15803D]" />
          ) : (
            <Copy className="size-4" />
          )}
          {copied
            ? t("admin.shareCredentials.copied")
            : t("admin.shareCredentials.copy")}
        </button>

        <p className="mt-4 text-[12px] font-medium leading-relaxed text-[#8c8c8c]">
          {t("admin.shareCredentials.emailFromHint", {
            from: "tamerosama73@gmail.com",
          })}
        </p>
      </div>
    </div>,
    document.body,
  )
}
