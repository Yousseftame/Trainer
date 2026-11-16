import { useEffect, useId, useRef, useState } from "react"
import { createPortal } from "react-dom"
import { useTranslation } from "react-i18next"
import { Check, ImagePlus, Trash2, X } from "lucide-react"
import {
  formatBytesLabel,
  GOALS_BANNER_UPLOAD_LIMITS,
  isRenderableImageSrc,
} from "@/features/website/paths"
import { mirrorBilingual } from "@/features/website/service"
import type { SaveGoalsBannerTabInput } from "@/features/website/goalsBanner"
import { useLocale } from "@/hooks/useLocale"
import { appToast } from "@/lib/toast"
import { cn } from "@/lib/utils"
import type { GoalsBannerTab, GoalsBannerTabId } from "@/types/website"

type GoalsBannerTabDialogProps = {
  open: boolean
  tabId: GoalsBannerTabId
  tabIndex: number
  initialTab: GoalsBannerTab
  busy?: boolean
  adminName?: string
  onClose: () => void
  onSave: (input: SaveGoalsBannerTabInput) => Promise<unknown>
}

type FieldPair = { en: string; ar: string }

const EMPTY: FieldPair = { en: "", ar: "" }

export function GoalsBannerTabDialog({
  open,
  tabId,
  tabIndex,
  initialTab,
  busy = false,
  adminName,
  onClose,
  onSave,
}: GoalsBannerTabDialogProps) {
  const { t } = useTranslation()
  const { locale, isRtl } = useLocale()
  const isAr = locale === "ar"
  const titleId = useId()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [tabLabel, setTabLabel] = useState<FieldPair>(EMPTY)
  const [title, setTitle] = useState<FieldPair>(EMPTY)
  const [description, setDescription] = useState<FieldPair>(EMPTY)
  const [cta, setCta] = useState<FieldPair>(EMPTY)
  const [imageAlt, setImageAlt] = useState<FieldPair>(EMPTY)
  const [file, setFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [removeImage, setRemoveImage] = useState(false)
  const [uploadPercent, setUploadPercent] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    setError(null)
    setFile(null)
    setRemoveImage(false)
    setUploadPercent(null)
    setTabLabel({ ...initialTab.tabLabel })
    setTitle({ ...initialTab.title })
    setDescription({ ...initialTab.description })
    setCta({ ...initialTab.cta })
    setImageAlt({ ...initialTab.imageAlt })
    setPreviewUrl(
      isRenderableImageSrc(initialTab.imageUrl) ? initialTab.imageUrl : null,
    )
  }, [open, initialTab])

  useEffect(() => {
    if (!file) return
    const url = URL.createObjectURL(file)
    setPreviewUrl(url)
    setRemoveImage(false)
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
    "min-h-[100px] w-full resize-y rounded-[16px] border border-black/10 bg-[#F7F7F7] px-3.5 py-2.5 text-[14px] font-medium text-[#111111] outline-none transition-colors focus:border-[#111111] focus:bg-white disabled:opacity-60"

  function showError(message: string) {
    setError(message)
    appToast.error(message)
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    if (busy) return
    setError(null)

    const mirroredLabel = mirrorBilingual(tabLabel.en, tabLabel.ar)
    const mirroredTitle = mirrorBilingual(title.en, title.ar)
    const mirroredDesc = mirrorBilingual(description.en, description.ar)
    const mirroredCta = mirrorBilingual(cta.en, cta.ar)
    const mirroredAlt = mirrorBilingual(imageAlt.en, imageAlt.ar)

    if (
      !mirroredLabel ||
      !mirroredTitle ||
      !mirroredDesc ||
      !mirroredCta ||
      !mirroredAlt
    ) {
      showError(t("admin.website.goalsBanner.errors.requiredFields"))
      return
    }

    if (file && file.size > GOALS_BANNER_UPLOAD_LIMITS.imageBytes) {
      showError(
        t("admin.website.goalsBanner.errors.imageTooLarge", {
          limit: formatBytesLabel(GOALS_BANNER_UPLOAD_LIMITS.imageBytes),
        }),
      )
      return
    }

    if (file && !file.type.match(/^image\//)) {
      showError(t("admin.website.goalsBanner.errors.imageType"))
      return
    }

    try {
      setUploadPercent(file ? 0 : null)
      await onSave({
        tabId,
        tabLabel: mirroredLabel,
        title: mirroredTitle,
        description: mirroredDesc,
        cta: mirroredCta,
        imageAlt: mirroredAlt,
        file: file ?? null,
        clearImage: removeImage && !file,
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
          : t("admin.website.goalsBanner.errors.saveFailed"),
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

  const previewTabLabel =
    (isAr ? tabLabel.ar || tabLabel.en : tabLabel.en || tabLabel.ar) || "—"
  const previewTitle =
    (isAr ? title.ar || title.en : title.en || title.ar) ||
    t("admin.website.goalsBanner.untitled")
  const previewDesc =
    (isAr ? description.ar || description.en : description.en || description.ar) ||
    "—"
  const previewCta =
    (isAr ? cta.ar || cta.en : cta.en || cta.ar) || "—"

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
        className="flex max-h-[92dvh] w-full max-w-[820px] flex-col overflow-hidden rounded-[28px] bg-white shadow-[0_24px_70px_rgba(0,0,0,0.25)]"
      >
        <div className="flex items-start justify-between gap-3 border-b border-black/[0.07] px-5 py-4 sm:px-7 sm:py-5">
          <div className="min-w-0">
            <h2
              id={titleId}
              className="text-[20px] font-bold tracking-tight text-[#0d1117] sm:text-[22px]"
            >
              {t("admin.website.goalsBanner.editTabTitle")}
            </h2>
            <p className="mt-0.5 text-[13px] font-medium text-[#6B7280]">
              {t("admin.website.goalsBanner.tabLabel", { n: tabIndex + 1 })} ·{" "}
              {t("admin.website.goalsBanner.formHint")}
            </p>
          </div>
          <button
            type="button"
            disabled={busy}
            onClick={onClose}
            className="inline-flex size-9 shrink-0 items-center justify-center rounded-full bg-[#F4F4F4] text-[#111111] transition-colors hover:bg-black/10"
            aria-label={t("admin.website.goalsBanner.close")}
          >
            <X className="size-4" strokeWidth={2} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
          <div className="no-scrollbar flex-1 space-y-5 overflow-y-auto px-5 py-5 sm:px-7">
            <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_220px] lg:items-start">
              <div className="rounded-[20px] bg-[#1a0208] p-4 text-white sm:p-5">
                <span className="inline-flex rounded-full border border-[var(--gym-lime,#fb5001)]/80 bg-white/[0.06] px-3 py-1 text-[12px] font-semibold text-[var(--gym-lime,#fb5001)]">
                  {previewTabLabel}
                </span>
                <p className="mt-4 font-heading text-[18px] font-extrabold leading-snug sm:text-[20px]">
                  {previewTitle}
                </p>
                <p className="mt-2 line-clamp-4 text-[13px] leading-relaxed text-white/70">
                  {previewDesc}
                </p>
                <span className="mt-4 inline-flex h-9 items-center rounded-full bg-[var(--gym-lime,#fb5001)] px-4 text-[11px] font-extrabold uppercase tracking-wide text-white">
                  {previewCta}
                </span>
                <p className="mt-3 text-[11px] font-medium text-white/45">
                  {t("admin.website.goalsBanner.ctaHint")}
                </p>
              </div>

              <div className="space-y-2.5">
                <p className="text-[12px] font-bold text-[#374151]">
                  {t("admin.website.goalsBanner.fields.image")}
                </p>
                <div className="aspect-[4/3] overflow-hidden rounded-[18px] border border-black/10 bg-[#F4F4F4]">
                  {previewUrl ? (
                    <img
                      src={previewUrl}
                      alt=""
                      className="size-full object-contain object-center"
                    />
                  ) : (
                    <div className="flex size-full flex-col items-center justify-center gap-1 text-[#8c8c8c]">
                      <ImagePlus className="size-7" strokeWidth={1.5} />
                      <span className="px-3 text-center text-[11px] font-medium">
                        {t("admin.website.goalsBanner.imageEmpty")}
                      </span>
                    </div>
                  )}
                </div>
                <div className="flex flex-col gap-2">
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => fileInputRef.current?.click()}
                    className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-full bg-[var(--gym-ink,#111111)] px-4 text-[13px] font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
                  >
                    <ImagePlus className="size-4" strokeWidth={2} />
                    {previewUrl
                      ? t("admin.website.goalsBanner.replaceImage")
                      : t("admin.website.goalsBanner.chooseImage")}
                  </button>
                  {previewUrl ? (
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => {
                        setFile(null)
                        setPreviewUrl(null)
                        setRemoveImage(true)
                      }}
                      className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-full bg-[#FFE8E4] px-4 text-[13px] font-bold text-[#C44536] transition hover:bg-[#ffd8d1] disabled:opacity-60"
                    >
                      <Trash2 className="size-4" strokeWidth={2} />
                      {t("admin.website.goalsBanner.removeImage")}
                    </button>
                  ) : null}
                </div>
                <p className="text-[11px] font-medium text-[#6B7280]">
                  {t("admin.website.goalsBanner.imageHint", {
                    limit: formatBytesLabel(
                      GOALS_BANNER_UPLOAD_LIMITS.imageBytes,
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
            </div>

            {renderBilingual({
              labelKey: "admin.website.goalsBanner.fields.tabLabel",
              value: tabLabel,
              onChange: setTabLabel,
              placeholderEn: "Workout Logging",
              placeholderAr: "تسجيل التمارين",
            })}
            {renderBilingual({
              labelKey: "admin.website.goalsBanner.fields.title",
              value: title,
              onChange: setTitle,
            })}
            {renderBilingual({
              labelKey: "admin.website.goalsBanner.fields.description",
              value: description,
              onChange: setDescription,
              multiline: true,
            })}
            {renderBilingual({
              labelKey: "admin.website.goalsBanner.fields.cta",
              value: cta,
              onChange: setCta,
              placeholderEn: "Get started",
              placeholderAr: "ابدأ الآن",
            })}
            {renderBilingual({
              labelKey: "admin.website.goalsBanner.fields.imageAlt",
              value: imageAlt,
              onChange: setImageAlt,
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
                {t("admin.website.goalsBanner.cancel")}
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
                  ? t("admin.website.goalsBanner.saving")
                  : t("admin.website.goalsBanner.saveTab")}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>,
    document.body,
  )
}
