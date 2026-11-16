import { useEffect, useId, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import {
  Check,
  ImageOff,
  ImagePlus,
  LayoutTemplate,
  MonitorSmartphone,
  Trash2,
} from "lucide-react"
import { ConfirmActionDialog } from "@/components/dashboard/ConfirmActionDialog"
import { StatCard } from "@/components/dashboard/StatCard"
import { useAuth } from "@/features/auth/auth-context"
import {
  DEFAULT_COACHING_APP_COPY,
  type SaveCoachingAppBannerInput,
} from "@/features/website/coachingApp"
import {
  COACHING_APP_UPLOAD_LIMITS,
  formatBytesLabel,
  isRenderableImageSrc,
} from "@/features/website/paths"
import { mirrorBilingual } from "@/features/website/service"
import {
  useClearCoachingAppImageMutation,
  useCoachingAppBannerQuery,
  useSaveCoachingAppBannerMutation,
} from "@/features/website/hooks"
import { useDocumentTitle } from "@/hooks/useDocumentTitle"
import { useLocale } from "@/hooks/useLocale"
import { resolveBilingualText } from "@/lib/program-text"
import { appToast } from "@/lib/toast"
import type { BilingualText } from "@/types/program"

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

export function HomeCoachingAppPage() {
  const { t } = useTranslation()
  const { locale, isRtl } = useLocale()
  const isAr = locale === "ar"
  const { user, hasPermission } = useAuth()
  const canManage = hasPermission("content:manage")
  useDocumentTitle(t("admin.website.sections.homeCoachingApp"))

  const {
    data: content,
    isLoading,
    isError,
    refetch,
  } = useCoachingAppBannerQuery({ audience: "admin" })
  const saveMutation = useSaveCoachingAppBannerMutation()
  const clearImageMutation = useClearCoachingAppImageMutation()

  const fileInputRef = useRef<HTMLInputElement>(null)
  const formId = useId()

  const [title, setTitle] = useState<FieldPair>(EMPTY)
  const [description, setDescription] = useState<FieldPair>(EMPTY)
  const [imageAlt, setImageAlt] = useState<FieldPair>(EMPTY)
  const [file, setFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [removeImage, setRemoveImage] = useState(false)
  const [uploadPercent, setUploadPercent] = useState<number | null>(null)
  const [confirmClearImage, setConfirmClearImage] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setTitle(toPair(content?.title, DEFAULT_COACHING_APP_COPY.title))
    setDescription(
      toPair(content?.description, DEFAULT_COACHING_APP_COPY.description),
    )
    setImageAlt(toPair(content?.imageAlt, DEFAULT_COACHING_APP_COPY.imageAlt))
    setFile(null)
    setRemoveImage(false)
    setError(null)
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

  const previewTitle =
    resolveBilingualText(
      { en: title.en, ar: title.ar },
      locale,
      DEFAULT_COACHING_APP_COPY.title[locale],
    ) || t("admin.website.coachingApp.untitled")
  const previewDescription = resolveBilingualText(
    { en: description.en, ar: description.ar },
    locale,
    DEFAULT_COACHING_APP_COPY.description[locale],
  )

  const inputClass =
    "h-11 w-full rounded-[16px] border border-black/10 bg-[#F7F7F7] px-3.5 text-[14px] font-medium text-[var(--gym-ink,#111111)] outline-none transition-colors focus:border-[#111111] focus:bg-white disabled:opacity-60"
  const textareaClass =
    "min-h-[96px] w-full resize-y rounded-[16px] border border-black/10 bg-[#F7F7F7] px-3.5 py-2.5 text-[14px] font-medium text-[var(--gym-ink,#111111)] outline-none transition-colors focus:border-[#111111] focus:bg-white disabled:opacity-60"

  function renderBilingual(params: {
    label: string
    value: FieldPair
    onChange: (next: FieldPair) => void
    multiline?: boolean
    placeholderEn?: string
    placeholderAr?: string
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
            placeholder={params.placeholderAr}
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
            placeholder={params.placeholderEn}
            className={params.multiline ? textareaClass : inputClass}
          />
        </label>
      </div>
    )
  }

  function showError(message: string) {
    setError(message)
    appToast.error(message)
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    if (!canManage || busy) return
    setError(null)

    const mirroredTitle = mirrorBilingual(title.en, title.ar)
    const mirroredDescription = mirrorBilingual(description.en, description.ar)
    const mirroredAlt = mirrorBilingual(imageAlt.en, imageAlt.ar)

    if (!mirroredTitle || !mirroredDescription || !mirroredAlt) {
      showError(t("admin.website.coachingApp.errors.requiredFields"))
      return
    }

    if (file && file.size > COACHING_APP_UPLOAD_LIMITS.imageBytes) {
      showError(
        t("admin.website.coachingApp.errors.imageTooLarge", {
          limit: formatBytesLabel(COACHING_APP_UPLOAD_LIMITS.imageBytes),
        }),
      )
      return
    }

    if (file && !file.type.match(/^image\//)) {
      showError(t("admin.website.coachingApp.errors.imageType"))
      return
    }

    const payload: SaveCoachingAppBannerInput = {
      title: mirroredTitle,
      description: mirroredDescription,
      imageAlt: mirroredAlt,
      file: file ?? null,
      removeImage: removeImage && !file,
      updatedBy: user?.displayName || user?.email || undefined,
      onUploadProgress: file
        ? (percent) => setUploadPercent(percent)
        : undefined,
    }

    try {
      setUploadPercent(file ? 0 : null)
      await saveMutation.mutateAsync(payload)
      appToast.success(t("admin.website.coachingApp.toasts.saved"))
      setFile(null)
      setRemoveImage(false)
    } catch (err) {
      showError(
        err instanceof Error
          ? err.message
          : t("admin.website.coachingApp.errors.saveFailed"),
      )
    } finally {
      setUploadPercent(null)
    }
  }

  return (
    <div className="flex flex-col gap-4 sm:gap-5">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 lg:gap-4">
        <StatCard
          label={t("admin.website.coachingApp.stats.section")}
          value={t("admin.website.coachingApp.stats.banner")}
          icon={<LayoutTemplate className="size-4" strokeWidth={1.8} />}
        />
        <StatCard
          label={t("admin.website.coachingApp.stats.photo")}
          value={
            hasStoredImage || Boolean(file)
              ? t("admin.website.coachingApp.stats.photoSet")
              : t("admin.website.coachingApp.stats.photoMissing")
          }
          icon={<MonitorSmartphone className="size-4" strokeWidth={1.8} />}
        />
        <StatCard
          label={t("admin.website.coachingApp.stats.fields")}
          value="3"
          icon={<Check className="size-4" strokeWidth={1.8} />}
        />
      </div>

      {isError ? (
        <div className="flex min-h-40 flex-col items-center justify-center gap-3 rounded-[24px] bg-white px-4 py-10 text-center">
          <p className="text-sm font-medium text-[#8c8c8c]">
            {t("admin.website.coachingApp.loadError")}
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
          {t("admin.website.coachingApp.loading")}
        </div>
      ) : (
        <form
          id={formId}
          onSubmit={handleSubmit}
          className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]"
        >
          <section className="rounded-[24px] bg-white p-4 sm:p-6 lg:p-7">
            <div className="mb-5">
              <h2 className="text-[18px] font-bold text-[var(--gym-ink,#111111)]">
                {t("admin.website.coachingApp.editorTitle")}
              </h2>
              <p className="mt-1 text-[13px] font-medium text-[#6B7280]">
                {t("admin.website.coachingApp.editorHint")}
              </p>
            </div>

            <div className="space-y-5">
              <div className="space-y-2.5">
                <p className="text-[12px] font-bold text-[#374151]">
                  {t("admin.website.coachingApp.fields.image")}
                </p>
                <div className="overflow-hidden rounded-[20px] border border-black/10 bg-[#111111]">
                  <div className="relative aspect-[16/10] w-full">
                    {previewUrl && !removeImage ? (
                      <img
                        src={previewUrl}
                        alt=""
                        className="absolute inset-0 size-full object-contain p-4"
                      />
                    ) : (
                      <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-white/55">
                        <ImagePlus className="size-8" strokeWidth={1.5} />
                        <span className="px-4 text-center text-[13px] font-medium">
                          {t("admin.website.coachingApp.imageEmpty")}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2.5">
                  <button
                    type="button"
                    disabled={!canManage || busy}
                    onClick={() => fileInputRef.current?.click()}
                    className="inline-flex h-10 items-center gap-2 rounded-full bg-[var(--gym-ink,#111111)] px-4 text-[13px] font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
                  >
                    <ImagePlus className="size-4" strokeWidth={2} />
                    {previewUrl && !removeImage
                      ? t("admin.website.coachingApp.replaceImage")
                      : t("admin.website.coachingApp.chooseImage")}
                  </button>
                  {hasStoredImage || (previewUrl && !removeImage) ? (
                    <button
                      type="button"
                      disabled={!canManage || busy}
                      onClick={() => {
                        if (hasStoredImage && !file) {
                          setConfirmClearImage(true)
                          return
                        }
                        setFile(null)
                        setRemoveImage(true)
                        setPreviewUrl(null)
                      }}
                      className="inline-flex h-10 items-center gap-2 rounded-full bg-[#FFE8E4] px-4 text-[13px] font-bold text-[#C44536] transition hover:bg-[#ffd8d1] disabled:opacity-60"
                    >
                      <Trash2 className="size-3.5" />
                      {t("admin.website.coachingApp.removeImage")}
                    </button>
                  ) : null}
                  <p className="text-[12px] font-medium text-[#6B7280]">
                    {t("admin.website.coachingApp.imageHint", {
                      limit: formatBytesLabel(
                        COACHING_APP_UPLOAD_LIMITS.imageBytes,
                      ),
                    })}
                  </p>
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

              {renderBilingual({
                label: t("admin.website.coachingApp.fields.title"),
                value: title,
                onChange: setTitle,
                placeholderEn: DEFAULT_COACHING_APP_COPY.title.en,
                placeholderAr: DEFAULT_COACHING_APP_COPY.title.ar,
              })}
              {renderBilingual({
                label: t("admin.website.coachingApp.fields.description"),
                value: description,
                onChange: setDescription,
                multiline: true,
                placeholderEn: DEFAULT_COACHING_APP_COPY.description.en,
                placeholderAr: DEFAULT_COACHING_APP_COPY.description.ar,
              })}
              {renderBilingual({
                label: t("admin.website.coachingApp.fields.imageAlt"),
                value: imageAlt,
                onChange: setImageAlt,
                placeholderEn: DEFAULT_COACHING_APP_COPY.imageAlt.en,
                placeholderAr: DEFAULT_COACHING_APP_COPY.imageAlt.ar,
              })}
            </div>

            {canManage ? (
              <div className="mt-6 space-y-3 border-t border-black/[0.07] pt-5">
                {error ? (
                  <div
                    role="alert"
                    className="rounded-[16px] bg-rose-50 px-4 py-3 text-[13px] font-semibold text-rose-700"
                  >
                    {error}
                  </div>
                ) : null}
                <button
                  type="submit"
                  disabled={busy}
                  className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-full bg-[var(--gym-ink,#111111)] px-5 text-[13px] font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-60 sm:w-auto"
                >
                  <Check className="size-4" strokeWidth={2.4} />
                  {busy
                    ? t("admin.website.coachingApp.saving")
                    : t("admin.website.coachingApp.save")}
                </button>
              </div>
            ) : null}
          </section>

          <section className="rounded-[24px] bg-white p-4 sm:p-6 lg:p-7">
            <div className="mb-4">
              <h2 className="text-[18px] font-bold text-[var(--gym-ink,#111111)]">
                {t("admin.website.coachingApp.preview")}
              </h2>
              <p className="mt-1 text-[13px] font-medium text-[#6B7280]">
                {t("admin.website.coachingApp.previewHint")}
              </p>
            </div>

            <div
              dir={isRtl ? "rtl" : "ltr"}
              className="relative overflow-hidden rounded-[22px] px-5 py-8 sm:px-8 sm:py-10"
              style={{
                background:
                  "linear-gradient(160deg, #1a0208 0%, #24030c 38%, #6e001f 58%, #24030c 78%, #1a0208 100%)",
              }}
            >
              <div className="mx-auto flex max-w-[520px] flex-col items-center text-center">
                <h3 className="font-heading text-[22px] font-bold leading-[1.2] text-white sm:text-[26px]">
                  {previewTitle}
                </h3>

                <div className="relative mt-6 w-full overflow-hidden rounded-[16px]">
                  {previewUrl && !removeImage ? (
                    <img
                      src={previewUrl}
                      alt=""
                      className="mx-auto h-auto w-full max-w-[420px] object-contain"
                    />
                  ) : (
                    <div className="flex aspect-[16/10] w-full flex-col items-center justify-center gap-2 rounded-[16px] bg-white/5 text-white/45">
                      <ImageOff className="size-8" strokeWidth={1.4} />
                      <span className="text-[12px] font-medium">
                        {t("admin.website.coachingApp.previewNoImage")}
                      </span>
                    </div>
                  )}
                </div>

                <p className="mt-6 max-w-[34em] font-heading text-[14px] font-bold leading-[1.4] text-white/90 sm:text-[15px]">
                  {previewDescription || "—"}
                </p>
              </div>
            </div>
          </section>
        </form>
      )}

      <ConfirmActionDialog
        open={confirmClearImage}
        title={t("admin.website.coachingApp.clearImageTitle")}
        description={t("admin.website.coachingApp.clearImageDescription")}
        tone="danger"
        confirmLabel={t("admin.website.coachingApp.removeImage")}
        onCancel={() => setConfirmClearImage(false)}
        onConfirm={async () => {
          try {
            if (content?.imageUrl) {
              await clearImageMutation.mutateAsync(
                user?.displayName || user?.email || undefined,
              )
            }
            setFile(null)
            setRemoveImage(true)
            setPreviewUrl(null)
            appToast.success(t("admin.website.coachingApp.toasts.imageRemoved"))
          } catch (err) {
            appToast.error(
              err instanceof Error
                ? err.message
                : t("admin.website.coachingApp.toasts.error"),
            )
            throw err
          }
        }}
      />
    </div>
  )
}
