import { useEffect, useId, useRef, useState } from "react"
import { createPortal } from "react-dom"
import { useTranslation } from "react-i18next"
import { Check, ImagePlus, X } from "lucide-react"
import {
  formatBytesLabel,
  HOME_HERO_UPLOAD_LIMITS,
  isRenderableImageSrc,
} from "@/features/website/paths"
import {
  mirrorBilingual,
  type SaveHomeHeroSlideInput,
} from "@/features/website/service"
import { useLocale } from "@/hooks/useLocale"
import { appToast } from "@/lib/toast"
import { cn } from "@/lib/utils"
import type { HomeHeroSlide } from "@/types/website"

type HomeHeroFormDialogProps = {
  open: boolean
  initialSlide?: HomeHeroSlide | null
  busy?: boolean
  adminName?: string
  onClose: () => void
  onSave: (input: SaveHomeHeroSlideInput) => Promise<unknown>
}

type FieldPair = {
  en: string
  ar: string
}

const EMPTY_PAIR: FieldPair = { en: "", ar: "" }

export function HomeHeroFormDialog({
  open,
  initialSlide,
  busy = false,
  adminName,
  onClose,
  onSave,
}: HomeHeroFormDialogProps) {
  const { t } = useTranslation()
  const { locale, isRtl } = useLocale()
  const isAr = locale === "ar"
  const isEditing = Boolean(initialSlide)
  const titleId = useId()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [greeting, setGreeting] = useState<FieldPair>(EMPTY_PAIR)
  const [titleBefore, setTitleBefore] = useState<FieldPair>(EMPTY_PAIR)
  const [titleAccent, setTitleAccent] = useState<FieldPair>(EMPTY_PAIR)
  const [titleAfter, setTitleAfter] = useState<FieldPair>(EMPTY_PAIR)
  const [description, setDescription] = useState<FieldPair>(EMPTY_PAIR)
  const [cta, setCta] = useState<FieldPair>(EMPTY_PAIR)
  const [watermark, setWatermark] = useState<FieldPair>(EMPTY_PAIR)
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
    if (initialSlide) {
      setGreeting({ ...initialSlide.greeting })
      setTitleBefore({ ...initialSlide.titleBefore })
      setTitleAccent({ ...initialSlide.titleAccent })
      setTitleAfter({ ...initialSlide.titleAfter })
      setDescription({ ...initialSlide.description })
      setCta({ ...initialSlide.cta })
      setWatermark({ ...initialSlide.watermark })
      setEnabled(initialSlide.enabled)
      setPreviewUrl(
        isRenderableImageSrc(initialSlide.imageUrl)
          ? initialSlide.imageUrl
          : null,
      )
    } else {
      setGreeting(EMPTY_PAIR)
      setTitleBefore(EMPTY_PAIR)
      setTitleAccent(EMPTY_PAIR)
      setTitleAfter(EMPTY_PAIR)
      setDescription(EMPTY_PAIR)
      setCta(EMPTY_PAIR)
      setWatermark(EMPTY_PAIR)
      setEnabled(true)
      setPreviewUrl(null)
    }
  }, [open, initialSlide])

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
    "min-h-[88px] w-full resize-y rounded-[16px] border border-black/10 bg-[#F7F7F7] px-3.5 py-2.5 text-[14px] font-medium text-[#111111] outline-none transition-colors focus:border-[#111111] focus:bg-white disabled:opacity-60"

  function showError(message: string) {
    setError(message)
    appToast.error(message)
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    if (busy) return
    setError(null)

    const fields: Array<{ key: string; pair: FieldPair }> = [
      { key: "greeting", pair: greeting },
      { key: "titleBefore", pair: titleBefore },
      { key: "titleAccent", pair: titleAccent },
      { key: "titleAfter", pair: titleAfter },
      { key: "description", pair: description },
      { key: "cta", pair: cta },
      { key: "watermark", pair: watermark },
    ]

    const mirrored: Record<string, ReturnType<typeof mirrorBilingual>> = {}
    for (const field of fields) {
      const value = mirrorBilingual(field.pair.en, field.pair.ar)
      if (!value) {
        showError(t("admin.website.homeHero.errors.requiredFields"))
        return
      }
      mirrored[field.key] = value
    }

    if (!isEditing && !file) {
      showError(t("admin.website.homeHero.errors.imageRequired"))
      return
    }

    if (file && file.size > HOME_HERO_UPLOAD_LIMITS.imageBytes) {
      showError(
        t("admin.website.homeHero.errors.imageTooLarge", {
          limit: formatBytesLabel(HOME_HERO_UPLOAD_LIMITS.imageBytes),
        }),
      )
      return
    }

    if (file && !file.type.match(/^image\//)) {
      showError(t("admin.website.homeHero.errors.imageType"))
      return
    }

    try {
      setUploadPercent(file ? 0 : null)
      await onSave({
        id: initialSlide?.id,
        enabled,
        greeting: mirrored.greeting!,
        titleBefore: mirrored.titleBefore!,
        titleAccent: mirrored.titleAccent!,
        titleAfter: mirrored.titleAfter!,
        description: mirrored.description!,
        cta: mirrored.cta!,
        watermark: mirrored.watermark!,
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
          : t("admin.website.homeHero.errors.saveFailed"),
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
        className="flex max-h-[92dvh] w-full max-w-[720px] flex-col overflow-hidden rounded-[28px] bg-white shadow-[0_24px_70px_rgba(0,0,0,0.25)]"
      >
        <div className="flex items-start justify-between gap-3 border-b border-black/[0.07] px-5 py-4 sm:px-7 sm:py-5">
          <div className="min-w-0">
            <h2
              id={titleId}
              className="text-[20px] font-bold tracking-tight text-[#0d1117] sm:text-[22px]"
            >
              {isEditing
                ? t("admin.website.homeHero.editTitle")
                : t("admin.website.homeHero.addTitle")}
            </h2>
            <p className="mt-0.5 text-[13px] font-medium text-[#6B7280]">
              {t("admin.website.homeHero.formHint")}
            </p>
          </div>
          <button
            type="button"
            disabled={busy}
            onClick={onClose}
            className="inline-flex size-9 shrink-0 items-center justify-center rounded-full bg-[#F4F4F4] text-[#111111] transition-colors hover:bg-black/10"
            aria-label={t("admin.website.homeHero.close")}
          >
            <X className="size-4" strokeWidth={2} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
          <div className="no-scrollbar flex-1 space-y-5 overflow-y-auto px-5 py-5 sm:px-7">
            {/* Image */}
            <div className="space-y-2.5">
              <p className="text-[12px] font-bold text-[#374151]">
                {t("admin.website.homeHero.fields.image")}
              </p>
              <div className="overflow-hidden rounded-[20px] border border-black/10 bg-[#111111]">
                <div className="relative aspect-[16/9] w-full sm:aspect-[21/9]">
                  {previewUrl ? (
                    <img
                      src={previewUrl}
                      alt=""
                      className="absolute inset-0 size-full object-cover"
                    />
                  ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-white/60">
                      <ImagePlus className="size-8" strokeWidth={1.5} />
                      <span className="text-[13px] font-medium">
                        {t("admin.website.homeHero.imageEmpty")}
                      </span>
                    </div>
                  )}
                  <div
                    aria-hidden
                    className="pointer-events-none absolute inset-0"
                    style={{
                      background:
                        "linear-gradient(90deg, #24030c 0%, #24030c 28%, rgba(36,3,12,0.45) 48%, transparent 62%)",
                    }}
                  />
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
                    ? t("admin.website.homeHero.replaceImage")
                    : t("admin.website.homeHero.chooseImage")}
                </button>
                <p className="text-[12px] font-medium text-[#6B7280]">
                  {t("admin.website.homeHero.imageHint", {
                    limit: formatBytesLabel(HOME_HERO_UPLOAD_LIMITS.imageBytes),
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
                {t("admin.website.homeHero.fields.enabled")}
              </span>
            </label>

            {renderBilingualField({
              labelKey: "admin.website.homeHero.fields.greeting",
              value: greeting,
              onChange: setGreeting,
              placeholderEn: "Hi, I'm Mike",
              placeholderAr: "مرحباً، أنا مايك",
            })}
            {renderBilingualField({
              labelKey: "admin.website.homeHero.fields.titleBefore",
              value: titleBefore,
              onChange: setTitleBefore,
              placeholderEn: "Your",
              placeholderAr: "مدربك",
            })}
            {renderBilingualField({
              labelKey: "admin.website.homeHero.fields.titleAccent",
              value: titleAccent,
              onChange: setTitleAccent,
              placeholderEn: "fitness",
              placeholderAr: "اللياقة",
            })}
            {renderBilingualField({
              labelKey: "admin.website.homeHero.fields.titleAfter",
              value: titleAfter,
              onChange: setTitleAfter,
              placeholderEn: "trainer",
              placeholderAr: "الشخصي",
            })}
            {renderBilingualField({
              labelKey: "admin.website.homeHero.fields.description",
              value: description,
              onChange: setDescription,
              multiline: true,
            })}
            {renderBilingualField({
              labelKey: "admin.website.homeHero.fields.cta",
              value: cta,
              onChange: setCta,
              placeholderEn: "Book a class",
              placeholderAr: "احجز حصة",
            })}
            {renderBilingualField({
              labelKey: "admin.website.homeHero.fields.watermark",
              value: watermark,
              onChange: setWatermark,
              placeholderEn: "Get Stronger",
              placeholderAr: "كن أقوى",
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
                {t("admin.website.homeHero.cancel")}
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
                  ? t("admin.website.homeHero.saving")
                  : t("admin.website.homeHero.save")}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>,
    document.body,
  )
}
