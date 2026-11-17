import { useEffect, useId, useMemo, useState, type ReactNode } from "react"
import { createPortal } from "react-dom"
import { useTranslation } from "react-i18next"
import { Check, Copy, X } from "lucide-react"
import { FaWhatsapp } from "react-icons/fa6"
import { BrandLogo } from "@/components/shared/BrandLogo"
import { useLocale } from "@/hooks/useLocale"
import {
  buildRegistrationOfferWhatsAppMessage,
  openRegistrationOfferWhatsApp,
  resolveStoreWhatsAppPhone,
  type OfferRecipientMode,
  type RegistrationOfferPayload,
} from "@/lib/registration-offer"
import { toWhatsAppDigits } from "@/lib/whatsapp"
import { appToast } from "@/lib/toast"
import { cn } from "@/lib/utils"

type SendRegistrationOfferDialogProps = {
  open: boolean
  payload: RegistrationOfferPayload | null
  onClose: () => void
}

function renderWhatsAppPreview(text: string): ReactNode[] {
  const nodes: ReactNode[] = []
  const parts = text.split(/(\*[^*\n]+\*)/g)
  parts.forEach((part, index) => {
    if (part.startsWith("*") && part.endsWith("*") && part.length > 2) {
      nodes.push(
        <strong
          key={`b-${index}`}
          className="font-bold text-[var(--gym-ink,#111111)]"
        >
          {part.slice(1, -1)}
        </strong>,
      )
      return
    }
    nodes.push(<span key={`t-${index}`}>{part}</span>)
  })
  return nodes
}

export function SendRegistrationOfferDialog({
  open,
  payload,
  onClose,
}: SendRegistrationOfferDialogProps) {
  const { t } = useTranslation()
  const { isRtl } = useLocale()
  const titleId = useId()
  const [mode, setMode] = useState<OfferRecipientMode>("customer")
  const [customPhone, setCustomPhone] = useState("")
  const [copied, setCopied] = useState(false)
  const [messageLocale, setMessageLocale] = useState<"en" | "ar">("en")

  const storePhone = resolveStoreWhatsAppPhone(
    t("whatsappBanner.phoneRaw", { defaultValue: "" }),
  )

  useEffect(() => {
    if (!open) {
      setMode("customer")
      setCustomPhone("")
      setCopied(false)
      return
    }
    setMessageLocale(payload?.locale === "ar" ? "ar" : "en")
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose()
    }
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"
    document.addEventListener("keydown", onKeyDown)
    return () => {
      document.body.style.overflow = previousOverflow
      document.removeEventListener("keydown", onKeyDown)
    }
  }, [open, onClose, payload?.locale])

  const preview = useMemo(() => {
    if (!payload) return ""
    return buildRegistrationOfferWhatsAppMessage(payload, messageLocale)
  }, [payload, messageLocale])

  useEffect(() => {
    if (!open || !payload || !preview) return
    void navigator.clipboard.writeText(preview).catch(() => undefined)
  }, [open, payload, preview])

  if (!open || !payload || typeof document === "undefined") return null

  const customerPhone = payload.phone.trim()
  const resolvedPhone =
    mode === "customer"
      ? customerPhone
      : mode === "store"
        ? storePhone
        : customPhone.trim()

  const canSend = Boolean(toWhatsAppDigits(resolvedPhone))

  const recipients: Array<{
    id: OfferRecipientMode
    title: string
    subtitle: string
    disabled?: boolean
  }> = [
    {
      id: "customer",
      title: t("admin.requests.offer.recipients.customer"),
      subtitle: customerPhone || t("admin.requests.offer.noPhone"),
      disabled: !customerPhone,
    },
    {
      id: "store",
      title: t("admin.requests.offer.recipients.store"),
      subtitle: storePhone,
    },
    {
      id: "custom",
      title: t("admin.requests.offer.recipients.custom"),
      subtitle: t("admin.requests.offer.recipients.customHint"),
    },
  ]

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(preview)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1600)
      appToast.success(t("admin.requests.offer.toasts.copied"))
    } catch {
      appToast.error(t("admin.requests.offer.toasts.copyFailed"))
    }
  }

  function handleWhatsApp() {
    if (!canSend) {
      appToast.error(t("admin.requests.offer.toasts.whatsappFailed"))
      return
    }
    const ok = openRegistrationOfferWhatsApp(
      resolvedPhone,
      payload!,
      messageLocale,
    )
    if (!ok) {
      appToast.error(t("admin.requests.offer.toasts.whatsappFailed"))
      return
    }
    appToast.success(t("admin.requests.offer.toasts.whatsappOpened"))
  }

  return createPortal(
    <div
      className="fixed inset-0 z-[130] flex items-end justify-center bg-[rgba(17,17,17,0.4)] p-0 sm:items-center sm:p-6"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      {/* One scroll container only — no nested preview scroll */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        dir={isRtl ? "rtl" : "ltr"}
        className={cn(
          "relative w-full max-w-[820px] overflow-y-auto overscroll-contain bg-white",
          "max-h-[min(94dvh,900px)] rounded-t-[22px] shadow-[0_24px_80px_rgba(0,0,0,0.16)]",
          "sm:rounded-[26px]",
        )}
      >
        <div className="px-5 pb-6 pt-5 sm:px-8 sm:pb-8 sm:pt-7">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <BrandLogo variant="onLight" className="h-7 sm:h-8" />
              <h2
                id={titleId}
                className="mt-5 font-heading text-[22px] font-extrabold tracking-tight text-[var(--gym-ink,#111111)] sm:text-[26px]"
              >
                {t("admin.requests.offer.title")}
              </h2>
              <p className="mt-2 max-w-[48ch] text-[13.5px] font-medium leading-relaxed text-[var(--gym-muted,#7a7a7a)] sm:text-[15px]">
                {t("admin.requests.offer.hint")}
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="inline-flex size-10 shrink-0 items-center justify-center rounded-full bg-[#F4F4F4] text-[var(--gym-ink,#111111)] transition hover:bg-[#ebebeb]"
              aria-label={t("admin.requests.offer.close")}
            >
              <X className="size-4" strokeWidth={2.25} />
            </button>
          </div>

          <div className="mt-7 grid gap-7 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] lg:items-start lg:gap-8">
            {/* Left: recipient + actions */}
            <div className="min-w-0">
              <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-[#9A9A9A]">
                {t("admin.requests.offer.sendTo")}
              </p>

              <div className="mt-3 flex flex-col gap-2.5">
                {recipients.map((item) => {
                  const selected = mode === item.id
                  return (
                    <button
                      key={item.id}
                      type="button"
                      disabled={item.disabled}
                      onClick={() => setMode(item.id)}
                      className={cn(
                        "flex w-full items-center justify-between gap-3 rounded-[16px] border px-4 py-3.5 text-start transition",
                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gym-lime,#fb5001)]/35",
                        selected
                          ? "border-[var(--gym-lime,#fb5001)] bg-[color-mix(in_srgb,var(--gym-lime,#fb5001)_10%,white)]"
                          : "border-[var(--gym-ink,#111111)]/8 bg-[#F7F7F7] hover:bg-[#F2F2F2]",
                        item.disabled && "cursor-not-allowed opacity-40",
                      )}
                    >
                      <div className="min-w-0">
                        <p className="text-[14px] font-bold text-[var(--gym-ink,#111111)]">
                          {item.title}
                        </p>
                        <p
                          className="mt-1 break-all text-[13px] font-medium text-[#8C8C8C]"
                          dir="ltr"
                        >
                          {item.subtitle}
                        </p>
                      </div>
                      <span
                        aria-hidden
                        className={cn(
                          "inline-flex size-[18px] shrink-0 items-center justify-center rounded-full border-2",
                          selected
                            ? "border-[var(--gym-lime,#fb5001)] bg-[var(--gym-lime,#fb5001)]"
                            : "border-[#D0D0D0] bg-white",
                        )}
                      >
                        {selected ? (
                          <span className="size-[6px] rounded-full bg-white" />
                        ) : null}
                      </span>
                    </button>
                  )
                })}
              </div>

              {mode === "custom" ? (
                <label className="mt-3 block">
                  <span className="mb-2 block text-[13px] font-semibold text-[#6B7280]">
                    {t("admin.requests.offer.customPhone")}
                  </span>
                  <input
                    type="tel"
                    inputMode="tel"
                    autoFocus
                    value={customPhone}
                    onChange={(e) => setCustomPhone(e.target.value)}
                    placeholder={t(
                      "admin.requests.offer.customPhonePlaceholder",
                    )}
                    className={cn(
                      "h-12 w-full rounded-2xl border border-[var(--gym-ink,#111111)]/8 bg-[#F7F7F7] px-4",
                      "font-heading text-[15px] font-medium text-[var(--gym-ink,#111111)] outline-none",
                      "transition focus:border-[var(--gym-ink,#111111)]/20 focus:bg-white",
                    )}
                    dir="ltr"
                  />
                </label>
              ) : null}

              <div className="mt-6 hidden flex-col gap-3 lg:flex">
                <button
                  type="button"
                  disabled={!canSend}
                  onClick={handleWhatsApp}
                  className={cn(
                    "inline-flex h-[52px] w-full items-center justify-center gap-2.5 rounded-full px-5",
                    "text-[15px] font-bold text-white transition",
                    canSend
                      ? "bg-[#25D366] hover:brightness-[1.03]"
                      : "cursor-not-allowed bg-[#25D366]/40",
                  )}
                >
                  <FaWhatsapp className="size-5" aria-hidden />
                  {t("admin.requests.offer.sendWhatsapp")}
                </button>
                <p className="text-[12.5px] font-medium leading-relaxed text-[#8C8C8C]">
                  {t("admin.requests.offer.footerHint")}
                </p>
              </div>
            </div>

            {/* Right: message — grows with content, no inner scrollbar */}
            <div className="min-w-0">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-[#9A9A9A]">
                  {t("admin.requests.offer.preview")}
                </p>
                <div className="flex items-center gap-2">
                  <div className="inline-flex rounded-full bg-[#F0F0F0] p-1">
                    {(["en", "ar"] as const).map((lang) => {
                      const active = messageLocale === lang
                      return (
                        <button
                          key={lang}
                          type="button"
                          onClick={() => setMessageLocale(lang)}
                          className={cn(
                            "h-8 min-w-[44px] rounded-full px-3 text-[12px] font-bold transition",
                            active
                              ? "bg-[var(--gym-ink,#111111)] text-white"
                              : "text-[#6B7280] hover:text-[var(--gym-ink,#111111)]",
                          )}
                        >
                          {lang === "en"
                            ? t("admin.requests.offer.langEn")
                            : t("admin.requests.offer.langAr")}
                        </button>
                      )
                    })}
                  </div>
                  <button
                    type="button"
                    onClick={() => void handleCopy()}
                    className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-[13px] font-bold text-[var(--gym-lime,#fb5001)] transition hover:bg-[color-mix(in_srgb,var(--gym-lime,#fb5001)_10%,white)]"
                  >
                    {copied ? (
                      <Check className="size-3.5" strokeWidth={2.5} />
                    ) : (
                      <Copy className="size-3.5" strokeWidth={2.25} />
                    )}
                    {copied
                      ? t("admin.requests.offer.copied")
                      : t("admin.requests.offer.copy")}
                  </button>
                </div>
              </div>

              <div
                dir={messageLocale === "ar" ? "rtl" : "ltr"}
                className="mt-3 min-w-0 overflow-hidden rounded-[20px] border border-[var(--gym-ink,#111111)]/8 bg-[#F7F7F7] px-5 py-5 sm:px-6 sm:py-6"
              >
                <p className="whitespace-pre-wrap break-words [overflow-wrap:anywhere] font-heading text-[14px] font-medium leading-[1.7] text-[var(--gym-ink,#111111)]/85 sm:text-[15px]">
                  {renderWhatsAppPreview(preview)}
                </p>
              </div>
            </div>
          </div>

          {/* Mobile CTA — after content, still one page scroll */}
          <div className="mt-7 flex flex-col gap-3 lg:hidden">
            <button
              type="button"
              disabled={!canSend}
              onClick={handleWhatsApp}
              className={cn(
                "inline-flex h-[52px] w-full items-center justify-center gap-2.5 rounded-full px-5",
                "text-[15px] font-bold text-white transition",
                canSend
                  ? "bg-[#25D366] hover:brightness-[1.03]"
                  : "cursor-not-allowed bg-[#25D366]/40",
              )}
            >
              <FaWhatsapp className="size-5" aria-hidden />
              {t("admin.requests.offer.sendWhatsapp")}
            </button>
            <p className="text-center text-[12.5px] font-medium leading-relaxed text-[#8C8C8C]">
              {t("admin.requests.offer.footerHint")}
            </p>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  )
}
