import { useEffect, useId, useRef, useState } from "react"
import { createPortal } from "react-dom"
import { useTranslation } from "react-i18next"
import { Check, ImagePlus, X } from "lucide-react"
import {
  formatBytesLabel,
  isRenderableImageSrc,
  TRUSTED_PARTNERS_UPLOAD_LIMITS,
} from "@/features/website/paths"
import { mirrorBilingual } from "@/features/website/service"
import type { SaveTrustedPartnerLogoInput } from "@/features/website/trustedPartners"
import { useLocale } from "@/hooks/useLocale"
import { appToast } from "@/lib/toast"
import { cn } from "@/lib/utils"
import type { TrustedPartnerLogo } from "@/types/website"

type TrustedPartnerLogoDialogProps = {
  open: boolean
  initialLogo?: TrustedPartnerLogo | null
  busy?: boolean
  adminName?: string
  onClose: () => void
  onSave: (input: SaveTrustedPartnerLogoInput) => Promise<unknown>
}

export function TrustedPartnerLogoDialog({
  open,
  initialLogo,
  busy = false,
  adminName,
  onClose,
  onSave,
}: TrustedPartnerLogoDialogProps) {
  const { t } = useTranslation()
  const { locale, isRtl } = useLocale()
  const isAr = locale === "ar"
  const isEditing = Boolean(initialLogo)
  const titleId = useId()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [nameEn, setNameEn] = useState("")
  const [nameAr, setNameAr] = useState("")
  const [enabled, setEnabled] = useState(true)
  const [file, setFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [uploadPercent, setUploadPercent] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    setError(null)
    setFile(null)
    setUploadPercent(null)
    if (initialLogo) {
      setNameEn(initialLogo.name.en)
      setNameAr(initialLogo.name.ar)
      setEnabled(initialLogo.enabled)
      setPreviewUrl(
        isRenderableImageSrc(initialLogo.imageUrl)
          ? initialLogo.imageUrl
          : null,
      )
    } else {
      setNameEn("")
      setNameAr("")
      setEnabled(true)
      setPreviewUrl(null)
    }
  }, [open, initialLogo])

  useEffect(() => {
    if (!file) return
    const url = URL.createObjectURL(file)
    setPreviewUrl(url)
    return () => URL.revokeObjectURL(url)
  }, [file])

  useEffect(() => {
    if (!open) return
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !busy) onClose()
    }
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"
    document.addEventListener("keydown", onKeyDown)
    return () => {
      document.body.style.overflow = previousOverflow
      document.removeEventListener("keydown", onKeyDown)
    }
  }, [open, busy, onClose])

  if (!open || typeof document === "undefined") return null

  const inputClass =
    "h-11 w-full rounded-[16px] border border-black/10 bg-[#F7F7F7] px-3.5 text-[14px] font-medium text-[#111111] outline-none transition-colors focus:border-[#111111] focus:bg-white disabled:opacity-60"

  function showError(message: string) {
    setError(message)
    appToast.error(message)
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    if (busy) return
    setError(null)

    if (!isEditing && !file) {
      showError(t("admin.website.trustedPartners.errors.imageRequired"))
      return
    }

    if (file && file.size > TRUSTED_PARTNERS_UPLOAD_LIMITS.imageBytes) {
      showError(
        t("admin.website.trustedPartners.errors.imageTooLarge", {
          limit: formatBytesLabel(TRUSTED_PARTNERS_UPLOAD_LIMITS.imageBytes),
        }),
      )
      return
    }

    if (file && !file.type.match(/^image\//)) {
      showError(t("admin.website.trustedPartners.errors.imageType"))
      return
    }

    const name =
      mirrorBilingual(nameEn, nameAr) ?? ({ en: "", ar: "" } as const)

    try {
      setUploadPercent(file ? 0 : null)
      await onSave({
        id: initialLogo?.id,
        enabled,
        name,
        file: file ?? null,
        updatedBy: adminName,
        onUploadProgress: file
          ? (percent) => setUploadPercent(percent)
          : undefined,
      })
      onClose()
    } catch (err) {
      showError(
        err instanceof Error
          ? err.message
          : t("admin.website.trustedPartners.errors.saveFailed"),
      )
    } finally {
      setUploadPercent(null)
    }
  }

  return createPortal(
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center bg-black/50 p-3 backdrop-blur-[3px] sm:p-5"
      onClick={() => {
        if (!busy) onClose()
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        dir={isRtl ? "rtl" : "ltr"}
        style={{
          fontFamily: isAr ? "var(--font-arabic)" : "var(--font-sans)",
        }}
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[92dvh] w-full max-w-[520px] flex-col overflow-hidden rounded-[28px] bg-white shadow-[0_24px_70px_rgba(0,0,0,0.25)]"
      >
        <div className="flex items-start justify-between gap-3 border-b border-black/[0.07] px-5 py-4 sm:px-7 sm:py-5">
          <div className="min-w-0">
            <h2
              id={titleId}
              className="text-[20px] font-bold tracking-tight text-[#0d1117] sm:text-[22px]"
            >
              {isEditing
                ? t("admin.website.trustedPartners.editLogo")
                : t("admin.website.trustedPartners.addLogo")}
            </h2>
            <p className="mt-0.5 text-[13px] font-medium text-[#6B7280]">
              {t("admin.website.trustedPartners.logoFormHint")}
            </p>
          </div>
          <button
            type="button"
            disabled={busy}
            onClick={onClose}
            className="inline-flex size-9 shrink-0 items-center justify-center rounded-full bg-[#F4F4F4] text-[#111111] transition-colors hover:bg-black/10"
            aria-label={t("admin.website.trustedPartners.close")}
          >
            <X className="size-4" strokeWidth={2} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
          <div className="no-scrollbar flex-1 space-y-5 overflow-y-auto px-5 py-5 sm:px-7">
            <div className="space-y-2.5">
              <p className="text-[12px] font-bold text-[#374151]">
                {t("admin.website.trustedPartners.fields.logo")}
              </p>
              <div className="flex min-h-[140px] items-center justify-center overflow-hidden rounded-[20px] border border-black/10 bg-[#F4F4F4] px-6 py-8">
                {previewUrl ? (
                  <img
                    src={previewUrl}
                    alt=""
                    className="max-h-16 w-auto max-w-full object-contain opacity-70 sm:max-h-20"
                  />
                ) : (
                  <div className="flex flex-col items-center gap-2 text-[#8c8c8c]">
                    <ImagePlus className="size-7" strokeWidth={1.5} />
                    <span className="text-[13px] font-medium">
                      {t("admin.website.trustedPartners.imageEmpty")}
                    </span>
                  </div>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-2.5">
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex h-10 items-center gap-2 rounded-full bg-[var(--gym-ink,#111111)] px-4 text-[13px] font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
                >
                  <ImagePlus className="size-4" strokeWidth={2} />
                  {previewUrl
                    ? t("admin.website.trustedPartners.replaceImage")
                    : t("admin.website.trustedPartners.chooseImage")}
                </button>
                <p className="text-[12px] font-medium text-[#6B7280]">
                  {t("admin.website.trustedPartners.imageHint", {
                    limit: formatBytesLabel(
                      TRUSTED_PARTNERS_UPLOAD_LIMITS.imageBytes,
                    ),
                  })}
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  disabled={busy}
                  onChange={(e) => {
                    const next = e.target.files?.[0] ?? null
                    setFile(next)
                    e.target.value = ""
                  }}
                />
              </div>
              {uploadPercent != null ? (
                <div className="h-2 overflow-hidden rounded-full bg-black/5">
                  <div
                    className="h-full rounded-full bg-[var(--gym-lime,#fb5001)] transition-all"
                    style={{ width: `${uploadPercent}%` }}
                  />
                </div>
              ) : null}
            </div>

            <label className="flex cursor-pointer items-center gap-3 rounded-[16px] border border-black/10 bg-[#F7F7F7] px-4 py-3">
              <input
                type="checkbox"
                checked={enabled}
                disabled={busy}
                onChange={(e) => setEnabled(e.target.checked)}
                className="size-4 accent-[var(--gym-lime,#fb5001)]"
              />
              <span className="text-[13px] font-semibold text-[#111111]">
                {t("admin.website.trustedPartners.fields.enabled")}
              </span>
            </label>

            <div className="grid grid-cols-1 gap-3.5 md:grid-cols-2">
              <label className="flex flex-col gap-1.5">
                <span className="text-[12px] font-bold text-[#374151]">
                  {t("admin.website.trustedPartners.fields.name")} (
                  {isAr ? "عربي" : "Arabic"})
                </span>
                <input
                  dir="rtl"
                  value={nameAr}
                  disabled={busy}
                  onChange={(e) => setNameAr(e.target.value)}
                  placeholder={
                    isAr ? "اختياري — اسم الشريك" : "Optional partner name"
                  }
                  className={inputClass}
                  style={{ fontFamily: "var(--font-arabic)" }}
                />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="text-[12px] font-bold text-[#374151]">
                  {t("admin.website.trustedPartners.fields.name")} (
                  {isAr ? "إنجليزي" : "English"})
                </span>
                <input
                  dir="ltr"
                  value={nameEn}
                  disabled={busy}
                  onChange={(e) => setNameEn(e.target.value)}
                  placeholder="Optional partner name"
                  className={inputClass}
                />
              </label>
            </div>
          </div>

          <div className="shrink-0 space-y-3 border-t border-black/[0.07] px-5 py-4 sm:px-7">
            {error ? (
              <div
                role="alert"
                className="rounded-[16px] bg-rose-50 px-4 py-3 text-[13px] font-semibold text-rose-700"
              >
                {error}
              </div>
            ) : null}
            <div className="flex flex-col-reverse gap-2.5 sm:flex-row sm:justify-end">
              <button
                type="button"
                disabled={busy}
                onClick={onClose}
                className="inline-flex h-11 items-center justify-center rounded-full bg-[#F4F4F4] px-5 text-[13px] font-bold text-[var(--gym-ink,#111111)] transition-colors hover:bg-black/10 disabled:opacity-60"
              >
                {t("admin.website.trustedPartners.cancel")}
              </button>
              <button
                type="submit"
                disabled={busy}
                className={cn(
                  "inline-flex h-11 items-center justify-center gap-2 rounded-full bg-[var(--gym-ink,#111111)] px-5 text-[13px] font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-60",
                )}
              >
                <Check className="size-4" strokeWidth={2.4} />
                {busy
                  ? t("admin.website.trustedPartners.saving")
                  : t("admin.website.trustedPartners.save")}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>,
    document.body,
  )
}
