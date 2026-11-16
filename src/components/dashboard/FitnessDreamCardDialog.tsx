import { useEffect, useId, useRef, useState } from "react"
import { createPortal } from "react-dom"
import { useTranslation } from "react-i18next"
import { Check, ImagePlus, X } from "lucide-react"
import {
  FITNESS_DREAM_UPLOAD_LIMITS,
  formatBytesLabel,
  isRenderableImageSrc,
} from "@/features/website/paths"
import { mirrorBilingual } from "@/features/website/service"
import type { SaveFitnessDreamCardInput } from "@/features/website/fitnessDream"
import { useLocale } from "@/hooks/useLocale"
import { appToast } from "@/lib/toast"
import { cn } from "@/lib/utils"
import type { FitnessDreamCard } from "@/types/website"

type FitnessDreamCardDialogProps = {
  open: boolean
  initialCard?: FitnessDreamCard | null
  busy?: boolean
  adminName?: string
  onClose: () => void
  onSave: (input: SaveFitnessDreamCardInput) => Promise<unknown>
}

type FieldPair = {
  en: string
  ar: string
}

const EMPTY_PAIR: FieldPair = { en: "", ar: "" }

export function FitnessDreamCardDialog({
  open,
  initialCard,
  busy = false,
  adminName,
  onClose,
  onSave,
}: FitnessDreamCardDialogProps) {
  const { t } = useTranslation()
  const { locale, isRtl } = useLocale()
  const isAr = locale === "ar"
  const isEditing = Boolean(initialCard)
  const titleId = useId()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [title, setTitle] = useState<FieldPair>(EMPTY_PAIR)
  const [description, setDescription] = useState<FieldPair>(EMPTY_PAIR)
  const [imageAlt, setImageAlt] = useState<FieldPair>(EMPTY_PAIR)
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
    if (initialCard) {
      setTitle({ ...initialCard.title })
      setDescription({ ...initialCard.description })
      setImageAlt({ ...initialCard.imageAlt })
      setEnabled(initialCard.enabled)
      setPreviewUrl(
        isRenderableImageSrc(initialCard.imageUrl)
          ? initialCard.imageUrl
          : null,
      )
    } else {
      setTitle(EMPTY_PAIR)
      setDescription(EMPTY_PAIR)
      setImageAlt(EMPTY_PAIR)
      setEnabled(true)
      setPreviewUrl(null)
    }
  }, [open, initialCard])

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
    "min-h-[96px] w-full resize-y rounded-[16px] border border-black/10 bg-[#F7F7F7] px-3.5 py-2.5 text-[14px] font-medium text-[#111111] outline-none transition-colors focus:border-[#111111] focus:bg-white disabled:opacity-60"

  function showError(message: string) {
    setError(message)
    appToast.error(message)
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    if (busy) return
    setError(null)

    const mirroredTitle = mirrorBilingual(title.en, title.ar)
    const mirroredDescription = mirrorBilingual(description.en, description.ar)
    const mirroredAlt = mirrorBilingual(imageAlt.en, imageAlt.ar)

    if (!mirroredTitle || !mirroredDescription || !mirroredAlt) {
      showError(t("admin.website.fitnessDream.errors.requiredFields"))
      return
    }

    if (!isEditing && !file) {
      showError(t("admin.website.fitnessDream.errors.imageRequired"))
      return
    }

    if (file && file.size > FITNESS_DREAM_UPLOAD_LIMITS.imageBytes) {
      showError(
        t("admin.website.fitnessDream.errors.imageTooLarge", {
          limit: formatBytesLabel(FITNESS_DREAM_UPLOAD_LIMITS.imageBytes),
        }),
      )
      return
    }

    if (file && !file.type.match(/^image\//)) {
      showError(t("admin.website.fitnessDream.errors.imageType"))
      return
    }

    try {
      setUploadPercent(file ? 0 : null)
      await onSave({
        id: initialCard?.id,
        enabled,
        title: mirroredTitle,
        description: mirroredDescription,
        imageAlt: mirroredAlt,
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
          : t("admin.website.fitnessDream.errors.saveFailed"),
      )
    } finally {
      setUploadPercent(null)
    }
  }

  function renderBilingualField(params: {
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
    t("admin.website.fitnessDream.untitled")
  const previewBody =
    (isAr ? description.ar || description.en : description.en || description.ar) ||
    "—"

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
                ? t("admin.website.fitnessDream.editTitle")
                : t("admin.website.fitnessDream.addTitle")}
            </h2>
            <p className="mt-0.5 text-[13px] font-medium text-[#6B7280]">
              {t("admin.website.fitnessDream.formHint")}
            </p>
          </div>
          <button
            type="button"
            disabled={busy}
            onClick={onClose}
            className="inline-flex size-9 shrink-0 items-center justify-center rounded-full bg-[#F4F4F4] text-[#111111] transition-colors hover:bg-black/10"
            aria-label={t("admin.website.fitnessDream.close")}
          >
            <X className="size-4" strokeWidth={2} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
          <div className="no-scrollbar flex-1 space-y-5 overflow-y-auto px-5 py-5 sm:px-7">
            <div className="space-y-2.5">
              <p className="text-[12px] font-bold text-[#374151]">
                {t("admin.website.fitnessDream.fields.image")}
              </p>
              <div className="mx-auto w-full max-w-[320px] overflow-hidden rounded-[16px] bg-[#f3f0e8]">
                <div className="flex h-[120px] flex-col px-5 pb-3 pt-5">
                  <p className="line-clamp-1 font-heading text-[18px] font-bold text-[var(--gym-ink,#111111)]">
                    {previewTitle}
                  </p>
                  <p className="mt-2 line-clamp-2 text-[13px] leading-relaxed text-[var(--gym-muted,#6b7280)]">
                    {previewBody}
                  </p>
                </div>
                <div className="relative aspect-[4/3] w-full overflow-hidden rounded-t-[16px] bg-[#111111]/10">
                  {previewUrl ? (
                    <img
                      src={previewUrl}
                      alt=""
                      className="absolute inset-0 size-full object-cover"
                    />
                  ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-[#111111]/45">
                      <ImagePlus className="size-8" strokeWidth={1.5} />
                      <span className="text-[13px] font-medium">
                        {t("admin.website.fitnessDream.imageEmpty")}
                      </span>
                    </div>
                  )}
                </div>
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
                    ? t("admin.website.fitnessDream.replaceImage")
                    : t("admin.website.fitnessDream.chooseImage")}
                </button>
                <p className="text-[12px] font-medium text-[#6B7280]">
                  {t("admin.website.fitnessDream.imageHint", {
                    limit: formatBytesLabel(
                      FITNESS_DREAM_UPLOAD_LIMITS.imageBytes,
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
                {t("admin.website.fitnessDream.fields.enabled")}
              </span>
            </label>

            {renderBilingualField({
              labelKey: "admin.website.fitnessDream.fields.title",
              value: title,
              onChange: setTitle,
              placeholderEn: "Personal training",
              placeholderAr: "تدريب شخصي",
            })}
            {renderBilingualField({
              labelKey: "admin.website.fitnessDream.fields.description",
              value: description,
              onChange: setDescription,
              multiline: true,
              placeholderEn:
                "Progressive programs designed to build muscle, power, and confidence.",
              placeholderAr:
                "برامج تدريجية لبناء العضلات والقوة والثقة بالنفس.",
            })}
            {renderBilingualField({
              labelKey: "admin.website.fitnessDream.fields.imageAlt",
              value: imageAlt,
              onChange: setImageAlt,
              placeholderEn: "Trainer coaching a client",
              placeholderAr: "مدرب يوجّه متدربًا",
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
                {t("admin.website.fitnessDream.cancel")}
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
                  ? t("admin.website.fitnessDream.saving")
                  : t("admin.website.fitnessDream.save")}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>,
    document.body,
  )
}
