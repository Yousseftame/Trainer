import { useEffect, useId, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import {
  Check,
  ImageOff,
  ImagePlus,
  LayoutTemplate,
  Link2,
  Trash2,
} from "lucide-react"
import { ConfirmActionDialog } from "@/components/dashboard/ConfirmActionDialog"
import { StatCard } from "@/components/dashboard/StatCard"
import { useAuth } from "@/features/auth/auth-context"
import {
  ABOUT_CLOSING_BANNER_UPLOAD_LIMITS,
  DEFAULT_ABOUT_CLOSING_BANNER_COPY,
  formatBytesLabel,
  isRenderableImageSrc,
  mirrorBilingual,
  useAboutClosingBannerContentQuery,
  useClearAboutClosingBannerImageMutation,
  useSaveAboutClosingBannerContentMutation,
  type SaveAboutClosingBannerContentInput,
} from "@/features/website"
import { useDocumentTitle } from "@/hooks/useDocumentTitle"
import { useLocale } from "@/hooks/useLocale"
import { resolveBilingualText } from "@/lib/program-text"
import { appToast } from "@/lib/toast"
import type { BilingualText } from "@/types/program"
import adminImage from "@/assets/admin.webp"

type FieldPair = { en: string; ar: string }

const EMPTY: FieldPair = { en: "", ar: "" }

function toPair(
  value: BilingualText | undefined,
  fallback?: BilingualText,
): FieldPair {
  return {
    en: value?.en || fallback?.en || "",
    ar: value?.ar || fallback?.ar || "",
  }
}

export function AboutClosingBannerPage() {
  const { t } = useTranslation()
  const { locale, isRtl } = useLocale()
  const isAr = locale === "ar"
  const { user, hasPermission } = useAuth()
  const canManage = hasPermission("content:manage")
  useDocumentTitle(t("admin.website.sections.aboutClosingBanner"))

  const {
    data: content,
    isLoading,
    isError,
    refetch,
  } = useAboutClosingBannerContentQuery({ audience: "admin" })
  const saveMutation = useSaveAboutClosingBannerContentMutation()
  const clearImageMutation = useClearAboutClosingBannerImageMutation()

  const fileInputRef = useRef<HTMLInputElement>(null)
  const formId = useId()

  const [title, setTitle] = useState<FieldPair>(EMPTY)
  const [body, setBody] = useState<FieldPair>(EMPTY)
  const [ctaLabel, setCtaLabel] = useState<FieldPair>(EMPTY)
  const [ctaHref, setCtaHref] = useState<string>(
    DEFAULT_ABOUT_CLOSING_BANNER_COPY.ctaHref,
  )
  const [imageAlt, setImageAlt] = useState<FieldPair>(EMPTY)
  const [file, setFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [removeImage, setRemoveImage] = useState(false)
  const [uploadPercent, setUploadPercent] = useState<number | null>(null)
  const [confirmClearImage, setConfirmClearImage] = useState(false)

  useEffect(() => {
    setTitle(toPair(content?.title, DEFAULT_ABOUT_CLOSING_BANNER_COPY.title))
    setBody(toPair(content?.body, DEFAULT_ABOUT_CLOSING_BANNER_COPY.body))
    setCtaLabel(
      toPair(content?.ctaLabel, DEFAULT_ABOUT_CLOSING_BANNER_COPY.ctaLabel),
    )
    setCtaHref(
      content?.ctaHref?.trim() || DEFAULT_ABOUT_CLOSING_BANNER_COPY.ctaHref,
    )
    setImageAlt(
      toPair(content?.imageAlt, DEFAULT_ABOUT_CLOSING_BANNER_COPY.imageAlt),
    )
    setFile(null)
    setRemoveImage(false)
    setPreviewUrl(
      content?.imageUrl && isRenderableImageSrc(content.imageUrl)
        ? content.imageUrl
        : null,
    )
  }, [content])

  useEffect(() => {
    if (!file) return
    const url = URL.createObjectURL(file)
    setPreviewUrl(url)
    setRemoveImage(false)
    return () => URL.revokeObjectURL(url)
  }, [file])

  const busy = saveMutation.isPending || clearImageMutation.isPending
  const hasStoredImage = Boolean(
    content?.imageUrl && isRenderableImageSrc(content.imageUrl) && !removeImage,
  )
  const displayImage = previewUrl || adminImage

  const previewTitle = resolveBilingualText(
    title,
    locale,
    DEFAULT_ABOUT_CLOSING_BANNER_COPY.title[locale],
  )
  const previewBody = resolveBilingualText(
    body,
    locale,
    DEFAULT_ABOUT_CLOSING_BANNER_COPY.body[locale],
  )
  const previewCta = resolveBilingualText(
    ctaLabel,
    locale,
    DEFAULT_ABOUT_CLOSING_BANNER_COPY.ctaLabel[locale],
  )

  const inputClass =
    "h-11 w-full rounded-[16px] border border-black/10 bg-[#F7F7F7] px-3.5 text-[14px] font-medium text-[#111111] outline-none transition-colors focus:border-[#111111] focus:bg-white disabled:opacity-60"

  const textareaClass =
    "min-h-[96px] w-full resize-y rounded-[16px] border border-black/10 bg-[#F7F7F7] px-3.5 py-3 text-[14px] font-medium text-[#111111] outline-none transition-colors focus:border-[#111111] focus:bg-white disabled:opacity-60"

  function renderBilingual(params: {
    label: string
    value: FieldPair
    onChange: (next: FieldPair) => void
    multiline?: boolean
  }) {
    const Field = params.multiline ? "textarea" : "input"
    return (
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <label className="flex flex-col gap-1.5">
          <span className="text-[12px] font-bold text-[#374151]">
            {params.label} ({isAr ? "عربي" : "Arabic"})
          </span>
          <Field
            dir="rtl"
            value={params.value.ar}
            disabled={!canManage || busy}
            onChange={(e) =>
              params.onChange({ ...params.value, ar: e.target.value })
            }
            className={params.multiline ? textareaClass : inputClass}
            style={{ fontFamily: "var(--font-arabic)" }}
          />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-[12px] font-bold text-[#374151]">
            {params.label} ({isAr ? "إنجليزي" : "English"})
          </span>
          <Field
            dir="ltr"
            value={params.value.en}
            disabled={!canManage || busy}
            onChange={(e) =>
              params.onChange({ ...params.value, en: e.target.value })
            }
            className={params.multiline ? textareaClass : inputClass}
          />
        </label>
      </div>
    )
  }

  async function handleSave(event: React.FormEvent) {
    event.preventDefault()
    if (!canManage || busy) return

    const mirroredTitle = mirrorBilingual(title.en, title.ar)
    const mirroredBody = mirrorBilingual(body.en, body.ar)
    const mirroredCta = mirrorBilingual(ctaLabel.en, ctaLabel.ar)
    const mirroredAlt = mirrorBilingual(imageAlt.en, imageAlt.ar)

    if (!mirroredTitle || !mirroredBody || !mirroredCta || !mirroredAlt) {
      appToast.error(
        t("admin.website.aboutClosingBanner.errors.requiredFields"),
      )
      return
    }

    const href = ctaHref.trim()
    if (!href) {
      appToast.error(t("admin.website.aboutClosingBanner.errors.hrefRequired"))
      return
    }

    if (file && file.size > ABOUT_CLOSING_BANNER_UPLOAD_LIMITS.imageBytes) {
      appToast.error(
        t("admin.website.aboutClosingBanner.errors.imageTooLarge", {
          limit: formatBytesLabel(ABOUT_CLOSING_BANNER_UPLOAD_LIMITS.imageBytes),
        }),
      )
      return
    }
    if (file && !file.type.match(/^image\//)) {
      appToast.error(t("admin.website.aboutClosingBanner.errors.imageType"))
      return
    }

    const payload: SaveAboutClosingBannerContentInput = {
      title: mirroredTitle,
      body: mirroredBody,
      ctaLabel: mirroredCta,
      ctaHref: href,
      imageAlt: mirroredAlt,
      file,
      removeImage: removeImage && !file,
      updatedBy: user?.displayName || user?.email || undefined,
      onUploadProgress: setUploadPercent,
    }

    try {
      setUploadPercent(file ? 0 : null)
      await saveMutation.mutateAsync(payload)
      setFile(null)
      setRemoveImage(false)
      setUploadPercent(null)
      appToast.success(t("admin.website.aboutClosingBanner.toasts.saved"))
    } catch (err) {
      setUploadPercent(null)
      appToast.error(
        err instanceof Error
          ? err.message
          : t("admin.website.aboutClosingBanner.errors.saveFailed"),
      )
    }
  }

  return (
    <div className="flex flex-col gap-4 sm:gap-5">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 lg:gap-4">
        <StatCard
          label={t("admin.website.aboutClosingBanner.stats.section")}
          value={t("admin.website.aboutClosingBanner.stats.label")}
          icon={<LayoutTemplate className="size-4" strokeWidth={1.8} />}
        />
        <StatCard
          label={t("admin.website.aboutClosingBanner.stats.photo")}
          value={
            hasStoredImage || Boolean(file)
              ? t("admin.website.aboutClosingBanner.stats.photoSet")
              : t("admin.website.aboutClosingBanner.stats.photoMissing")
          }
          icon={<ImagePlus className="size-4" strokeWidth={1.8} />}
        />
        <StatCard
          label={t("admin.website.aboutClosingBanner.stats.link")}
          value={ctaHref || "—"}
          icon={<Link2 className="size-4" strokeWidth={1.8} />}
        />
      </div>

      {isError ? (
        <div className="flex min-h-40 flex-col items-center justify-center gap-3 rounded-[24px] bg-white px-4 py-10 text-center">
          <p className="text-sm font-medium text-[#8c8c8c]">
            {t("admin.website.aboutClosingBanner.loadError")}
          </p>
          <button
            type="button"
            onClick={() => void refetch()}
            className="inline-flex h-10 items-center justify-center rounded-full bg-[var(--gym-ink,#111111)] px-5 text-[13px] font-bold text-white"
          >
            {t("admin.common.retry")}
          </button>
        </div>
      ) : isLoading ? (
        <div className="flex min-h-40 items-center justify-center rounded-[24px] bg-white px-4 py-10 text-sm font-medium text-[#8c8c8c]">
          {t("admin.website.aboutClosingBanner.loading")}
        </div>
      ) : (
        <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
          <section className="rounded-[24px] bg-white p-4 sm:p-5">
            <p className="text-[12px] font-bold uppercase tracking-[0.12em] text-[#8c8c8c]">
              {t("admin.website.aboutClosingBanner.preview")}
            </p>
            <p className="mt-1 text-[12px] font-medium text-[#6B7280]">
              {t("admin.website.aboutClosingBanner.previewHint")}
            </p>
            <div className="relative mt-4 overflow-hidden rounded-[20px] bg-[var(--gym-ink,#111111)] px-5 py-8 text-white">
              <img
                src={displayImage}
                alt=""
                aria-hidden
                className="pointer-events-none absolute inset-0 size-full object-cover object-[68%_center] opacity-90"
              />
              <div
                aria-hidden
                className="pointer-events-none absolute inset-0"
                style={{
                  background:
                    "linear-gradient(90deg, #111111 0%, rgba(17,17,17,0.92) 36%, rgba(17,17,17,0.45) 62%, rgba(17,17,17,0.12) 100%)",
                }}
              />
              <div className="relative z-[1] max-w-[22rem]">
                <p className="font-heading text-[22px] font-extrabold leading-tight">
                  {previewTitle}
                </p>
                <p className="mt-2 text-[13px] leading-relaxed text-white/75">
                  {previewBody}
                </p>
                <span className="mt-5 inline-flex h-10 items-center rounded-full bg-[var(--gym-lime,#fb5001)] px-4 text-[13px] font-bold text-white">
                  {previewCta}
                </span>
              </div>
            </div>
          </section>

          <section
            className="rounded-[24px] bg-white p-4 sm:p-6 lg:p-7"
            dir={isRtl ? "rtl" : "ltr"}
          >
            <form id={formId} onSubmit={handleSave} className="space-y-5">
              <div>
                <h2 className="text-[18px] font-bold text-[var(--gym-ink,#111111)]">
                  {t("admin.website.aboutClosingBanner.editorTitle")}
                </h2>
                <p className="mt-1 text-[13px] font-medium text-[#6B7280]">
                  {t("admin.website.aboutClosingBanner.editorHint")}
                </p>
              </div>

              <div>
                <p className="mb-2 text-[12px] font-bold text-[#374151]">
                  {t("admin.website.aboutClosingBanner.fields.image")}
                </p>
                <div className="overflow-hidden rounded-[18px] bg-[#F4F4F4]">
                  {previewUrl && !removeImage ? (
                    <img
                      src={previewUrl}
                      alt=""
                      className="h-40 w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-40 flex-col items-center justify-center gap-2 text-[#8c8c8c]">
                      <ImageOff className="size-6" strokeWidth={1.6} />
                      <p className="text-[12px] font-medium">
                        {t("admin.website.aboutClosingBanner.imageEmpty")}
                      </p>
                    </div>
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  disabled={!canManage || busy}
                  onChange={(e) => {
                    const next = e.target.files?.[0] ?? null
                    setFile(next)
                    e.target.value = ""
                  }}
                />
                {canManage ? (
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => fileInputRef.current?.click()}
                      className="inline-flex h-9 items-center gap-1.5 rounded-full bg-[#F4F4F4] px-3 text-[12px] font-bold text-[var(--gym-ink,#111111)] transition hover:bg-black/5 disabled:opacity-60"
                    >
                      <ImagePlus className="size-3.5" />
                      {previewUrl && !removeImage
                        ? t("admin.website.aboutClosingBanner.replaceImage")
                        : t("admin.website.aboutClosingBanner.chooseImage")}
                    </button>
                    {(hasStoredImage || file) && !removeImage ? (
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => {
                          if (file) {
                            setFile(null)
                            setPreviewUrl(
                              content?.imageUrl &&
                                isRenderableImageSrc(content.imageUrl)
                                ? content.imageUrl
                                : null,
                            )
                            return
                          }
                          setConfirmClearImage(true)
                        }}
                        className="inline-flex h-9 items-center gap-1.5 rounded-full bg-[#FFE8E4] px-3 text-[12px] font-bold text-[#C44536] disabled:opacity-60"
                      >
                        <Trash2 className="size-3.5" />
                        {t("admin.website.aboutClosingBanner.removeImage")}
                      </button>
                    ) : null}
                  </div>
                ) : null}
                <p className="mt-2 text-[12px] font-medium text-[#6B7280]">
                  {t("admin.website.aboutClosingBanner.imageHint", {
                    limit: formatBytesLabel(
                      ABOUT_CLOSING_BANNER_UPLOAD_LIMITS.imageBytes,
                    ),
                  })}
                </p>
                {uploadPercent != null ? (
                  <p className="mt-1 text-[12px] font-bold text-[var(--gym-ink,#111111)]">
                    {uploadPercent}%
                  </p>
                ) : null}
              </div>

              {renderBilingual({
                label: t("admin.website.aboutClosingBanner.fields.title"),
                value: title,
                onChange: setTitle,
              })}
              {renderBilingual({
                label: t("admin.website.aboutClosingBanner.fields.body"),
                value: body,
                onChange: setBody,
                multiline: true,
              })}
              {renderBilingual({
                label: t("admin.website.aboutClosingBanner.fields.ctaLabel"),
                value: ctaLabel,
                onChange: setCtaLabel,
              })}

              <label className="flex flex-col gap-1.5">
                <span className="text-[12px] font-bold text-[#374151]">
                  {t("admin.website.aboutClosingBanner.fields.ctaHref")}
                </span>
                <input
                  dir="ltr"
                  value={ctaHref}
                  disabled={!canManage || busy}
                  onChange={(e) => setCtaHref(e.target.value)}
                  placeholder="/#contact"
                  className={inputClass}
                />
                <span className="text-[11px] font-medium text-[#6B7280]">
                  {t("admin.website.aboutClosingBanner.hrefHint")}
                </span>
              </label>

              {renderBilingual({
                label: t("admin.website.aboutClosingBanner.fields.imageAlt"),
                value: imageAlt,
                onChange: setImageAlt,
              })}

              {canManage ? (
                <div className="flex justify-end border-t border-black/[0.06] pt-5">
                  <button
                    type="submit"
                    disabled={busy}
                    className="inline-flex h-11 items-center gap-2 rounded-full bg-[var(--gym-ink,#111111)] px-5 text-[13px] font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
                  >
                    <Check className="size-4" strokeWidth={2.4} />
                    {busy
                      ? t("admin.website.aboutClosingBanner.saving")
                      : t("admin.website.aboutClosingBanner.save")}
                  </button>
                </div>
              ) : null}
            </form>
          </section>
        </div>
      )}

      <ConfirmActionDialog
        open={confirmClearImage}
        title={t("admin.website.aboutClosingBanner.clearImageTitle")}
        description={t("admin.website.aboutClosingBanner.clearImageDescription")}
        tone="danger"
        confirmLabel={t("admin.website.aboutClosingBanner.removeImage")}
        onCancel={() => setConfirmClearImage(false)}
        onConfirm={async () => {
          try {
            await clearImageMutation.mutateAsync(
              user?.displayName || user?.email || undefined,
            )
            appToast.success(
              t("admin.website.aboutClosingBanner.toasts.imageRemoved"),
            )
            setConfirmClearImage(false)
            setPreviewUrl(null)
            setRemoveImage(false)
            setFile(null)
          } catch (err) {
            appToast.error(
              err instanceof Error
                ? err.message
                : t("admin.website.aboutClosingBanner.toasts.error"),
            )
          }
        }}
      />
    </div>
  )
}
