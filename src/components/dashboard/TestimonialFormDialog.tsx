import { useEffect, useId, useRef, useState } from "react"
import { createPortal } from "react-dom"
import { useTranslation } from "react-i18next"
import { Check, ImagePlus, X } from "lucide-react"
import {
  formatBytesLabel,
  isRenderableImageSrc,
  TESTIMONIALS_UPLOAD_LIMITS,
} from "@/features/website/paths"
import { mirrorBilingual } from "@/features/website/service"
import type { SaveTestimonialInput } from "@/features/website/testimonials"
import { useLocale } from "@/hooks/useLocale"
import { appToast } from "@/lib/toast"
import { cn } from "@/lib/utils"
import type { TestimonialItem } from "@/types/website"
import starsSrc from "@/assets/feedback-stars.svg"

type TestimonialFormDialogProps = {
  open: boolean
  slotId: string
  slotLabel: string
  initialItem?: TestimonialItem | null
  busy?: boolean
  adminName?: string
  onClose: () => void
  onSave: (input: SaveTestimonialInput) => Promise<unknown>
}

type FieldPair = { en: string; ar: string }

const EMPTY: FieldPair = { en: "", ar: "" }

export function TestimonialFormDialog({
  open,
  slotId,
  slotLabel,
  initialItem,
  busy = false,
  adminName,
  onClose,
  onSave,
}: TestimonialFormDialogProps) {
  const { t } = useTranslation()
  const { locale, isRtl } = useLocale()
  const isAr = locale === "ar"
  const isEditing = Boolean(initialItem)
  const titleId = useId()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [title, setTitle] = useState<FieldPair>(EMPTY)
  const [body, setBody] = useState<FieldPair>(EMPTY)
  const [author, setAuthor] = useState<FieldPair>(EMPTY)
  const [file, setFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [uploadPercent, setUploadPercent] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    setError(null)
    setFile(null)
    setUploadPercent(null)
    if (initialItem) {
      setTitle({ ...initialItem.title })
      setBody({ ...initialItem.body })
      setAuthor({ ...initialItem.author })
      setPreviewUrl(
        isRenderableImageSrc(initialItem.imageUrl)
          ? initialItem.imageUrl
          : null,
      )
    } else {
      setTitle(EMPTY)
      setBody(EMPTY)
      setAuthor(EMPTY)
      setPreviewUrl(null)
    }
  }, [open, initialItem])

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
  const textareaClass =
    "min-h-[110px] w-full resize-y rounded-[16px] border border-black/10 bg-[#F7F7F7] px-3.5 py-2.5 text-[14px] font-medium text-[#111111] outline-none transition-colors focus:border-[#111111] focus:bg-white disabled:opacity-60"

  function showError(message: string) {
    setError(message)
    appToast.error(message)
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    if (busy) return
    setError(null)

    const mirroredTitle = mirrorBilingual(title.en, title.ar)
    const mirroredBody = mirrorBilingual(body.en, body.ar)
    const mirroredAuthor = mirrorBilingual(author.en, author.ar)

    if (!mirroredTitle || !mirroredBody || !mirroredAuthor) {
      showError(t("admin.website.testimonials.errors.requiredFields"))
      return
    }

    if (!isEditing && !file) {
      showError(t("admin.website.testimonials.errors.imageRequired"))
      return
    }

    if (file && file.size > TESTIMONIALS_UPLOAD_LIMITS.imageBytes) {
      showError(
        t("admin.website.testimonials.errors.imageTooLarge", {
          limit: formatBytesLabel(TESTIMONIALS_UPLOAD_LIMITS.imageBytes),
        }),
      )
      return
    }

    if (file && !file.type.match(/^image\//)) {
      showError(t("admin.website.testimonials.errors.imageType"))
      return
    }

    try {
      setUploadPercent(file ? 0 : null)
      await onSave({
        slotId,
        title: mirroredTitle,
        body: mirroredBody,
        author: mirroredAuthor,
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
          : t("admin.website.testimonials.errors.saveFailed"),
      )
    } finally {
      setUploadPercent(null)
    }
  }

  function renderBilingual(params: {
    labelKey: string
    value: FieldPair
    onChange: (next: FieldPair) => void
    multiline?: boolean
    placeholderEn?: string
    placeholderAr?: string
  }) {
    const Field = params.multiline ? "textarea" : "input"
    return (
      <div className="grid grid-cols-1 gap-3.5 md:grid-cols-2">
        <label className="flex flex-col gap-1.5">
          <span className="text-[12px] font-bold text-[#374151]">
            {t(params.labelKey)} ({isAr ? "عربي" : "Arabic"})
          </span>
          <Field
            dir="rtl"
            value={params.value.ar}
            disabled={busy}
            onChange={(e) =>
              params.onChange({ ...params.value, ar: e.target.value })
            }
            placeholder={params.placeholderAr}
            className={params.multiline ? textareaClass : inputClass}
            style={{ fontFamily: "var(--font-arabic)" }}
          />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-[12px] font-bold text-[#374151]">
            {t(params.labelKey)} ({isAr ? "إنجليزي" : "English"})
          </span>
          <Field
            dir="ltr"
            value={params.value.en}
            disabled={busy}
            onChange={(e) =>
              params.onChange({ ...params.value, en: e.target.value })
            }
            placeholder={params.placeholderEn}
            className={params.multiline ? textareaClass : inputClass}
          />
        </label>
      </div>
    )
  }

  const previewTitle =
    (isAr ? title.ar || title.en : title.en || title.ar) ||
    t("admin.website.testimonials.untitled")
  const previewBody =
    (isAr ? body.ar || body.en : body.en || body.ar) || "—"
  const previewAuthor =
    (isAr ? author.ar || author.en : author.en || author.ar) || "—"

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
        className="flex max-h-[92dvh] w-full max-w-[760px] flex-col overflow-hidden rounded-[28px] bg-white shadow-[0_24px_70px_rgba(0,0,0,0.25)]"
      >
        <div className="flex items-start justify-between gap-3 border-b border-black/[0.07] px-5 py-4 sm:px-7 sm:py-5">
          <div className="min-w-0">
            <h2
              id={titleId}
              className="text-[20px] font-bold tracking-tight text-[#0d1117] sm:text-[22px]"
            >
              {isEditing
                ? t("admin.website.testimonials.editTitle")
                : t("admin.website.testimonials.addTitle")}
            </h2>
            <p className="mt-0.5 text-[13px] font-medium text-[#6B7280]">
              {slotLabel} · {t("admin.website.testimonials.formHint")}
            </p>
          </div>
          <button
            type="button"
            disabled={busy}
            onClick={onClose}
            className="inline-flex size-9 shrink-0 items-center justify-center rounded-full bg-[#F4F4F4] text-[#111111] transition-colors hover:bg-black/10"
            aria-label={t("admin.website.testimonials.close")}
          >
            <X className="size-4" strokeWidth={2} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
          <div className="no-scrollbar flex-1 space-y-5 overflow-y-auto px-5 py-5 sm:px-7">
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-[140px_minmax(0,1fr)] sm:items-start">
              <div className="space-y-2.5">
                <p className="text-[12px] font-bold text-[#374151]">
                  {t("admin.website.testimonials.fields.image")}
                </p>
                <div className="mx-auto size-[120px] overflow-hidden rounded-full border-4 border-[var(--gym-lime,#fb5001)] bg-[#F4F4F4] sm:mx-0">
                  {previewUrl ? (
                    <img
                      src={previewUrl}
                      alt=""
                      className="size-full object-cover"
                    />
                  ) : (
                    <div className="flex size-full flex-col items-center justify-center gap-1 text-[#8c8c8c]">
                      <ImagePlus className="size-7" strokeWidth={1.5} />
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-full bg-[var(--gym-ink,#111111)] px-4 text-[13px] font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
                >
                  <ImagePlus className="size-4" strokeWidth={2} />
                  {previewUrl
                    ? t("admin.website.testimonials.replaceImage")
                    : t("admin.website.testimonials.chooseImage")}
                </button>
                <p className="text-[11px] font-medium text-[#6B7280]">
                  {t("admin.website.testimonials.imageHint", {
                    limit: formatBytesLabel(
                      TESTIMONIALS_UPLOAD_LIMITS.imageBytes,
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
                {uploadPercent != null ? (
                  <div className="h-2 overflow-hidden rounded-full bg-black/5">
                    <div
                      className="h-full rounded-full bg-[var(--gym-lime,#fb5001)] transition-all"
                      style={{ width: `${uploadPercent}%` }}
                    />
                  </div>
                ) : null}
              </div>

              <div className="rounded-[20px] bg-[#F7F7F7] p-4 sm:p-5">
                <img
                  src={starsSrc}
                  alt=""
                  aria-hidden
                  className="h-[16px] w-[120px]"
                  draggable={false}
                />
                <p className="mt-3 font-heading text-[15px] font-bold text-[var(--gym-ink,#111111)]">
                  {previewTitle}
                </p>
                <p className="mt-2 line-clamp-4 text-[13px] leading-relaxed text-[#1e2222]">
                  {previewBody}
                </p>
                <p className="mt-3 text-[13px] text-[var(--gym-muted,#6b7280)]">
                  {previewAuthor}
                </p>
              </div>
            </div>

            {renderBilingual({
              labelKey: "admin.website.testimonials.fields.title",
              value: title,
              onChange: setTitle,
              placeholderEn: "I achieved my fitness goals",
              placeholderAr: "حققت أهداف لياقتي",
            })}
            {renderBilingual({
              labelKey: "admin.website.testimonials.fields.body",
              value: body,
              onChange: setBody,
              multiline: true,
            })}
            {renderBilingual({
              labelKey: "admin.website.testimonials.fields.author",
              value: author,
              onChange: setAuthor,
              placeholderEn: "— Sarah L.",
              placeholderAr: "— سارة ل.",
            })}
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
                {t("admin.website.testimonials.cancel")}
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
                  ? t("admin.website.testimonials.saving")
                  : t("admin.website.testimonials.save")}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>,
    document.body,
  )
}
