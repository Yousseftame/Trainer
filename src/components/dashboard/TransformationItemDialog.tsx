import { useEffect, useId, useRef, useState } from "react"
import { createPortal } from "react-dom"
import { useTranslation } from "react-i18next"
import { Check, ImagePlus, X } from "lucide-react"
import {
  TRANSFORMATIONS_UPLOAD_LIMITS,
  formatBytesLabel,
  isRenderableImageSrc,
  mirrorBilingual,
  type SaveTransformationItemInput,
} from "@/features/website"
import { useLocale } from "@/hooks/useLocale"
import { appToast } from "@/lib/toast"
import { cn } from "@/lib/utils"
import type { TransformationItem, TransformationLoop } from "@/types/website"

type TransformationItemDialogProps = {
  open: boolean
  initialItem?: TransformationItem | null
  defaultLoop?: TransformationLoop
  busy?: boolean
  adminName?: string
  onClose: () => void
  onSave: (input: SaveTransformationItemInput) => Promise<unknown>
}

type FieldPair = { en: string; ar: string }

const EMPTY: FieldPair = { en: "", ar: "" }

export function TransformationItemDialog({
  open,
  initialItem,
  defaultLoop = "top",
  busy = false,
  adminName,
  onClose,
  onSave,
}: TransformationItemDialogProps) {
  const { t } = useTranslation()
  const { locale, isRtl } = useLocale()
  const isAr = locale === "ar"
  const isEditing = Boolean(initialItem)
  const titleId = useId()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [name, setName] = useState<FieldPair>(EMPTY)
  const [description, setDescription] = useState<FieldPair>(EMPTY)
  const [date, setDate] = useState<FieldPair>(EMPTY)
  const [imageAlt, setImageAlt] = useState<FieldPair>(EMPTY)
  const [loop, setLoop] = useState<TransformationLoop>(defaultLoop)
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
    if (initialItem) {
      setName({ ...initialItem.name })
      setDescription({ ...initialItem.description })
      setDate({ ...initialItem.date })
      setImageAlt({ ...initialItem.imageAlt })
      setLoop(initialItem.loop)
      setEnabled(initialItem.enabled)
      setPreviewUrl(
        isRenderableImageSrc(initialItem.imageUrl)
          ? initialItem.imageUrl
          : null,
      )
    } else {
      setName(EMPTY)
      setDescription(EMPTY)
      setDate(EMPTY)
      setImageAlt(EMPTY)
      setLoop(defaultLoop)
      setEnabled(true)
      setPreviewUrl(null)
    }
  }, [open, initialItem, defaultLoop])

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

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    if (busy) return
    setError(null)

    const mirroredName = mirrorBilingual(name.en, name.ar)
    const mirroredDesc = mirrorBilingual(description.en, description.ar)
    if (!mirroredName || !mirroredDesc) {
      const message = t("admin.website.commonTransformations.errors.required")
      setError(message)
      appToast.error(message)
      return
    }

    if (!file && !isRenderableImageSrc(previewUrl)) {
      const message = t("admin.website.commonTransformations.errors.imageRequired")
      setError(message)
      appToast.error(message)
      return
    }

    if (file && file.size > TRANSFORMATIONS_UPLOAD_LIMITS.imageBytes) {
      const message = t("admin.website.commonTransformations.errors.imageTooLarge", {
        limit: formatBytesLabel(TRANSFORMATIONS_UPLOAD_LIMITS.imageBytes),
      })
      setError(message)
      appToast.error(message)
      return
    }

    try {
      setUploadPercent(file ? 0 : null)
      await onSave({
        id: initialItem?.id,
        name: mirroredName,
        description: mirroredDesc,
        date: mirrorBilingual(date.en, date.ar) || { en: "", ar: "" },
        imageAlt:
          mirrorBilingual(imageAlt.en, imageAlt.ar) || mirroredName,
        loop,
        enabled,
        file,
        updatedBy: adminName,
        onUploadProgress: setUploadPercent,
      })
      onClose()
    } catch (err) {
      setUploadPercent(null)
      const message =
        err instanceof Error
          ? err.message
          : t("admin.website.commonTransformations.toasts.error")
      setError(message)
      appToast.error(message)
    }
  }

  return createPortal(
    <div
      className="fixed inset-0 z-[80] flex items-end justify-center bg-black/40 p-3 sm:items-center sm:p-6"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !busy) onClose()
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        dir={isRtl ? "rtl" : "ltr"}
        className="max-h-[min(92dvh,820px)] w-full max-w-[720px] overflow-y-auto rounded-[24px] bg-white p-5 shadow-xl sm:p-7"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2
              id={titleId}
              className="text-[18px] font-bold text-[var(--gym-ink,#111111)]"
            >
              {isEditing
                ? t("admin.website.commonTransformations.editTitle")
                : t("admin.website.commonTransformations.addTitle")}
            </h2>
            <p className="mt-1 text-[13px] font-medium text-[#6B7280]">
              {t("admin.website.commonTransformations.formHint")}
            </p>
          </div>
          <button
            type="button"
            disabled={busy}
            onClick={onClose}
            className="flex size-9 items-center justify-center rounded-full bg-[#F4F4F4] disabled:opacity-60"
            aria-label={t("admin.website.commonTransformations.close")}
          >
            <X className="size-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div>
            <div className="overflow-hidden rounded-[18px] bg-[#F4F4F4]">
              {previewUrl ? (
                <img
                  src={previewUrl}
                  alt=""
                  className="h-44 w-full object-cover"
                />
              ) : (
                <div className="flex h-44 flex-col items-center justify-center gap-2 text-[#8c8c8c]">
                  <ImagePlus className="size-6" strokeWidth={1.6} />
                  <p className="text-[12px] font-medium">
                    {t("admin.website.commonTransformations.imageEmpty")}
                  </p>
                </div>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              disabled={busy}
              onChange={(e) => {
                setFile(e.target.files?.[0] ?? null)
                e.target.value = ""
              }}
            />
            <button
              type="button"
              disabled={busy}
              onClick={() => fileInputRef.current?.click()}
              className="mt-3 inline-flex h-9 items-center gap-1.5 rounded-full bg-[#F4F4F4] px-3 text-[12px] font-bold disabled:opacity-60"
            >
              <ImagePlus className="size-3.5" />
              {previewUrl
                ? t("admin.website.commonTransformations.replaceImage")
                : t("admin.website.commonTransformations.chooseImage")}
            </button>
            <p className="mt-2 text-[12px] font-medium text-[#6B7280]">
              {t("admin.website.commonTransformations.imageHint", {
                limit: formatBytesLabel(TRANSFORMATIONS_UPLOAD_LIMITS.imageBytes),
              })}
            </p>
            {uploadPercent != null ? (
              <p className="mt-1 text-[12px] font-bold">{uploadPercent}%</p>
            ) : null}
          </div>

          <div className="flex flex-wrap gap-2">
            {(["top", "bottom"] as const).map((value) => (
              <button
                key={value}
                type="button"
                disabled={busy}
                onClick={() => setLoop(value)}
                className={cn(
                  "inline-flex h-9 items-center rounded-full px-3.5 text-[12px] font-bold transition",
                  loop === value
                    ? "bg-[var(--gym-ink,#111111)] text-white"
                    : "bg-[#F4F4F4] text-[#6B7280]",
                )}
              >
                {t(`admin.website.commonTransformations.loop.${value}`)}
              </button>
            ))}
            <button
              type="button"
              disabled={busy}
              onClick={() => setEnabled((prev) => !prev)}
              className={cn(
                "inline-flex h-9 items-center rounded-full px-3.5 text-[12px] font-bold",
                enabled
                  ? "bg-[#E8FFF1] text-[#15803D]"
                  : "bg-[#F4F4F4] text-[#6B7280]",
              )}
            >
              {enabled
                ? t("admin.website.commonTransformations.status.live")
                : t("admin.website.commonTransformations.status.hidden")}
            </button>
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <label className="flex flex-col gap-1.5">
              <span className="text-[12px] font-bold text-[#374151]">
                {t("admin.website.commonTransformations.fields.name")} (
                {isAr ? "عربي" : "Arabic"})
              </span>
              <input
                dir="rtl"
                value={name.ar}
                disabled={busy}
                onChange={(e) =>
                  setName((prev) => ({ ...prev, ar: e.target.value }))
                }
                className={inputClass}
                style={{ fontFamily: "var(--font-arabic)" }}
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-[12px] font-bold text-[#374151]">
                {t("admin.website.commonTransformations.fields.name")} (
                {isAr ? "إنجليزي" : "English"})
              </span>
              <input
                dir="ltr"
                value={name.en}
                disabled={busy}
                onChange={(e) =>
                  setName((prev) => ({ ...prev, en: e.target.value }))
                }
                className={inputClass}
              />
            </label>
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <label className="flex flex-col gap-1.5">
              <span className="text-[12px] font-bold text-[#374151]">
                {t("admin.website.commonTransformations.fields.description")} (
                {isAr ? "عربي" : "Arabic"})
              </span>
              <textarea
                dir="rtl"
                value={description.ar}
                disabled={busy}
                onChange={(e) =>
                  setDescription((prev) => ({ ...prev, ar: e.target.value }))
                }
                className={textareaClass}
                style={{ fontFamily: "var(--font-arabic)" }}
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-[12px] font-bold text-[#374151]">
                {t("admin.website.commonTransformations.fields.description")} (
                {isAr ? "إنجليزي" : "English"})
              </span>
              <textarea
                dir="ltr"
                value={description.en}
                disabled={busy}
                onChange={(e) =>
                  setDescription((prev) => ({ ...prev, en: e.target.value }))
                }
                className={textareaClass}
              />
            </label>
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <label className="flex flex-col gap-1.5">
              <span className="text-[12px] font-bold text-[#374151]">
                {t("admin.website.commonTransformations.fields.date")} (
                {isAr ? "عربي" : "Arabic"})
              </span>
              <input
                dir="rtl"
                value={date.ar}
                disabled={busy}
                placeholder={t(
                  "admin.website.commonTransformations.datePlaceholder",
                )}
                onChange={(e) =>
                  setDate((prev) => ({ ...prev, ar: e.target.value }))
                }
                className={inputClass}
                style={{ fontFamily: "var(--font-arabic)" }}
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-[12px] font-bold text-[#374151]">
                {t("admin.website.commonTransformations.fields.date")} (
                {isAr ? "إنجليزي" : "English"})
              </span>
              <input
                dir="ltr"
                value={date.en}
                disabled={busy}
                placeholder="March 2024"
                onChange={(e) =>
                  setDate((prev) => ({ ...prev, en: e.target.value }))
                }
                className={inputClass}
              />
            </label>
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <label className="flex flex-col gap-1.5">
              <span className="text-[12px] font-bold text-[#374151]">
                {t("admin.website.commonTransformations.fields.imageAlt")} (
                {isAr ? "عربي" : "Arabic"})
              </span>
              <input
                dir="rtl"
                value={imageAlt.ar}
                disabled={busy}
                onChange={(e) =>
                  setImageAlt((prev) => ({ ...prev, ar: e.target.value }))
                }
                className={inputClass}
                style={{ fontFamily: "var(--font-arabic)" }}
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-[12px] font-bold text-[#374151]">
                {t("admin.website.commonTransformations.fields.imageAlt")} (
                {isAr ? "إنجليزي" : "English"})
              </span>
              <input
                dir="ltr"
                value={imageAlt.en}
                disabled={busy}
                onChange={(e) =>
                  setImageAlt((prev) => ({ ...prev, en: e.target.value }))
                }
                className={inputClass}
              />
            </label>
          </div>

          {error ? (
            <p className="text-[13px] font-medium text-[#C44536]">{error}</p>
          ) : null}

          <div className="flex justify-end gap-2 border-t border-black/[0.06] pt-4">
            <button
              type="button"
              disabled={busy}
              onClick={onClose}
              className="inline-flex h-11 items-center rounded-full bg-[#F4F4F4] px-5 text-[13px] font-bold disabled:opacity-60"
            >
              {t("admin.website.commonTransformations.cancel")}
            </button>
            <button
              type="submit"
              disabled={busy}
              className="inline-flex h-11 items-center gap-2 rounded-full bg-[var(--gym-ink,#111111)] px-5 text-[13px] font-bold text-white disabled:opacity-60"
            >
              <Check className="size-4" strokeWidth={2.4} />
              {busy
                ? t("admin.website.commonTransformations.saving")
                : t("admin.website.commonTransformations.save")}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body,
  )
}
