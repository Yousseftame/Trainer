import { useEffect, useId, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import {
  Check,
  ImageOff,
  ImagePlus,
  LayoutTemplate,
  Trash2,
  UserRound,
} from "lucide-react"
import { ConfirmActionDialog } from "@/components/dashboard/ConfirmActionDialog"
import { StatCard } from "@/components/dashboard/StatCard"
import { useAuth } from "@/features/auth/auth-context"
import {
  ABOUT_HERO_UPLOAD_LIMITS,
  DEFAULT_ABOUT_HERO_COPY,
  formatBytesLabel,
  isRenderableImageSrc,
  mirrorBilingual,
  useAboutHeroContentQuery,
  useClearAboutHeroImageMutation,
  useSaveAboutHeroContentMutation,
  type SaveAboutHeroContentInput,
} from "@/features/website"
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

export function AboutHeroPage() {
  const { t } = useTranslation()
  const { locale, isRtl } = useLocale()
  const isAr = locale === "ar"
  const { user, hasPermission } = useAuth()
  const canManage = hasPermission("content:manage")
  useDocumentTitle(t("admin.website.sections.aboutHero"))

  const {
    data: content,
    isLoading,
    isError,
    refetch,
  } = useAboutHeroContentQuery({ audience: "admin" })
  const saveMutation = useSaveAboutHeroContentMutation()
  const clearImageMutation = useClearAboutHeroImageMutation()

  const fileInputRef = useRef<HTMLInputElement>(null)
  const formId = useId()

  const [name, setName] = useState<FieldPair>(EMPTY)
  const [headline, setHeadline] = useState<FieldPair>(EMPTY)
  const [lead, setLead] = useState<FieldPair>(EMPTY)
  const [leadSecondary, setLeadSecondary] = useState<FieldPair>(EMPTY)
  const [yearsValue, setYearsValue] = useState<FieldPair>(EMPTY)
  const [yearsLabel, setYearsLabel] = useState<FieldPair>(EMPTY)
  const [metaTitle, setMetaTitle] = useState<FieldPair>(EMPTY)
  const [metaBody, setMetaBody] = useState<FieldPair>(EMPTY)
  const [imageAlt, setImageAlt] = useState<FieldPair>(EMPTY)
  const [file, setFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [removeImage, setRemoveImage] = useState(false)
  const [uploadPercent, setUploadPercent] = useState<number | null>(null)
  const [confirmClearImage, setConfirmClearImage] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setName(toPair(content?.name, DEFAULT_ABOUT_HERO_COPY.name))
    setHeadline(toPair(content?.headline, DEFAULT_ABOUT_HERO_COPY.headline))
    setLead(toPair(content?.lead, DEFAULT_ABOUT_HERO_COPY.lead))
    setLeadSecondary(
      toPair(content?.leadSecondary, DEFAULT_ABOUT_HERO_COPY.leadSecondary),
    )
    setYearsValue(
      toPair(content?.yearsValue, DEFAULT_ABOUT_HERO_COPY.yearsValue),
    )
    setYearsLabel(
      toPair(content?.yearsLabel, DEFAULT_ABOUT_HERO_COPY.yearsLabel),
    )
    setMetaTitle(toPair(content?.metaTitle, DEFAULT_ABOUT_HERO_COPY.metaTitle))
    setMetaBody(toPair(content?.metaBody, DEFAULT_ABOUT_HERO_COPY.metaBody))
    setImageAlt(toPair(content?.imageAlt, DEFAULT_ABOUT_HERO_COPY.imageAlt))
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

  const previewName =
    resolveBilingualText(
      { en: name.en, ar: name.ar },
      locale,
      DEFAULT_ABOUT_HERO_COPY.name[locale],
    ) || t("admin.website.aboutHero.untitled")
  const previewHeadline = resolveBilingualText(
    { en: headline.en, ar: headline.ar },
    locale,
    DEFAULT_ABOUT_HERO_COPY.headline[locale],
  )
  const previewLead = resolveBilingualText(
    { en: lead.en, ar: lead.ar },
    locale,
    DEFAULT_ABOUT_HERO_COPY.lead[locale],
  )
  const previewLeadSecondary = resolveBilingualText(
    { en: leadSecondary.en, ar: leadSecondary.ar },
    locale,
    DEFAULT_ABOUT_HERO_COPY.leadSecondary[locale],
  )
  const previewYearsValue = resolveBilingualText(
    { en: yearsValue.en, ar: yearsValue.ar },
    locale,
    DEFAULT_ABOUT_HERO_COPY.yearsValue[locale],
  )
  const previewYearsLabel = resolveBilingualText(
    { en: yearsLabel.en, ar: yearsLabel.ar },
    locale,
    DEFAULT_ABOUT_HERO_COPY.yearsLabel[locale],
  )
  const previewMetaTitle = resolveBilingualText(
    { en: metaTitle.en, ar: metaTitle.ar },
    locale,
    DEFAULT_ABOUT_HERO_COPY.metaTitle[locale],
  )
  const previewMetaBody = resolveBilingualText(
    { en: metaBody.en, ar: metaBody.ar },
    locale,
    DEFAULT_ABOUT_HERO_COPY.metaBody[locale],
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

    const mirroredName = mirrorBilingual(name.en, name.ar)
    const mirroredHeadline = mirrorBilingual(headline.en, headline.ar)
    const mirroredLead = mirrorBilingual(lead.en, lead.ar)
    const mirroredLeadSecondary = mirrorBilingual(
      leadSecondary.en,
      leadSecondary.ar,
    )
    const mirroredYearsValue = mirrorBilingual(yearsValue.en, yearsValue.ar)
    const mirroredYearsLabel = mirrorBilingual(yearsLabel.en, yearsLabel.ar)
    const mirroredMetaTitle = mirrorBilingual(metaTitle.en, metaTitle.ar)
    const mirroredMetaBody = mirrorBilingual(metaBody.en, metaBody.ar)
    const mirroredAlt = mirrorBilingual(imageAlt.en, imageAlt.ar)

    if (
      !mirroredName ||
      !mirroredHeadline ||
      !mirroredLead ||
      !mirroredLeadSecondary ||
      !mirroredYearsValue ||
      !mirroredYearsLabel ||
      !mirroredMetaTitle ||
      !mirroredMetaBody ||
      !mirroredAlt
    ) {
      showError(t("admin.website.aboutHero.errors.requiredFields"))
      return
    }

    if (file && file.size > ABOUT_HERO_UPLOAD_LIMITS.imageBytes) {
      showError(
        t("admin.website.aboutHero.errors.imageTooLarge", {
          limit: formatBytesLabel(ABOUT_HERO_UPLOAD_LIMITS.imageBytes),
        }),
      )
      return
    }

    if (file && !file.type.match(/^image\//)) {
      showError(t("admin.website.aboutHero.errors.imageType"))
      return
    }

    const payload: SaveAboutHeroContentInput = {
      name: mirroredName,
      headline: mirroredHeadline,
      lead: mirroredLead,
      leadSecondary: mirroredLeadSecondary,
      yearsValue: mirroredYearsValue,
      yearsLabel: mirroredYearsLabel,
      metaTitle: mirroredMetaTitle,
      metaBody: mirroredMetaBody,
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
      appToast.success(t("admin.website.aboutHero.toasts.saved"))
      setFile(null)
      setRemoveImage(false)
    } catch (err) {
      showError(
        err instanceof Error
          ? err.message
          : t("admin.website.aboutHero.errors.saveFailed"),
      )
    } finally {
      setUploadPercent(null)
    }
  }

  return (
    <div className="flex flex-col gap-4 sm:gap-5">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 lg:gap-4">
        <StatCard
          label={t("admin.website.aboutHero.stats.section")}
          value={t("admin.website.aboutHero.stats.hero")}
          icon={<LayoutTemplate className="size-4" strokeWidth={1.8} />}
        />
        <StatCard
          label={t("admin.website.aboutHero.stats.photo")}
          value={
            hasStoredImage || Boolean(file)
              ? t("admin.website.aboutHero.stats.photoSet")
              : t("admin.website.aboutHero.stats.photoMissing")
          }
          icon={<UserRound className="size-4" strokeWidth={1.8} />}
        />
        <StatCard
          label={t("admin.website.aboutHero.stats.fields")}
          value="8"
          icon={<Check className="size-4" strokeWidth={1.8} />}
        />
      </div>

      {isError ? (
        <div className="flex min-h-40 flex-col items-center justify-center gap-3 rounded-[24px] bg-white px-4 py-10 text-center">
          <p className="text-sm font-medium text-[#8c8c8c]">
            {t("admin.website.aboutHero.loadError")}
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
          {t("admin.website.aboutHero.loading")}
        </div>
      ) : (
        <form
          id={formId}
          onSubmit={handleSubmit}
          dir={isRtl ? "rtl" : "ltr"}
          className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]"
        >
          <section className="rounded-[24px] bg-white p-4 sm:p-6 lg:p-7">
            <div className="mb-5">
              <h2 className="text-[18px] font-bold text-[var(--gym-ink,#111111)]">
                {t("admin.website.aboutHero.editorTitle")}
              </h2>
              <p className="mt-1 text-[13px] font-medium text-[#6B7280]">
                {t("admin.website.aboutHero.editorHint")}
              </p>
            </div>

            <div className="space-y-5">
              <div className="space-y-2.5">
                <p className="text-[12px] font-bold text-[#374151]">
                  {t("admin.website.aboutHero.fields.image")}
                </p>
                <div className="overflow-hidden rounded-[20px] border border-black/10 bg-[#24030c]">
                  <div className="relative aspect-[16/10] w-full">
                    {previewUrl && !removeImage ? (
                      <img
                        src={previewUrl}
                        alt=""
                        className="absolute inset-0 size-full object-cover object-[20%_center]"
                      />
                    ) : (
                      <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-white/55">
                        <ImagePlus className="size-8" strokeWidth={1.5} />
                        <span className="px-4 text-center text-[13px] font-medium">
                          {t("admin.website.aboutHero.imageEmpty")}
                        </span>
                      </div>
                    )}
                    <div
                      aria-hidden
                      className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,#24030c_0%,rgba(36,3,12,0.75)_42%,rgba(36,3,12,0)_72%)]"
                    />
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
                      ? t("admin.website.aboutHero.replaceImage")
                      : t("admin.website.aboutHero.chooseImage")}
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
                      {t("admin.website.aboutHero.removeImage")}
                    </button>
                  ) : null}
                  <p className="text-[12px] font-medium text-[#6B7280]">
                    {t("admin.website.aboutHero.imageHint", {
                      limit: formatBytesLabel(
                        ABOUT_HERO_UPLOAD_LIMITS.imageBytes,
                      ),
                    })}
                  </p>
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
                label: t("admin.website.aboutHero.fields.name"),
                value: name,
                onChange: setName,
                placeholderEn: "Mike Vasquez",
                placeholderAr: "مايك فاسكيز",
              })}
              {renderBilingual({
                label: t("admin.website.aboutHero.fields.headline"),
                value: headline,
                onChange: setHeadline,
                multiline: true,
              })}
              {renderBilingual({
                label: t("admin.website.aboutHero.fields.lead"),
                value: lead,
                onChange: setLead,
                multiline: true,
              })}
              {renderBilingual({
                label: t("admin.website.aboutHero.fields.leadSecondary"),
                value: leadSecondary,
                onChange: setLeadSecondary,
                multiline: true,
              })}
              {renderBilingual({
                label: t("admin.website.aboutHero.fields.yearsValue"),
                value: yearsValue,
                onChange: setYearsValue,
                placeholderEn: "14+",
                placeholderAr: "+14",
              })}
              {renderBilingual({
                label: t("admin.website.aboutHero.fields.yearsLabel"),
                value: yearsLabel,
                onChange: setYearsLabel,
              })}
              {renderBilingual({
                label: t("admin.website.aboutHero.fields.metaTitle"),
                value: metaTitle,
                onChange: setMetaTitle,
                placeholderEn: "Science-backed coaching",
                placeholderAr: "تدريب مدعوم علمياً",
              })}
              {renderBilingual({
                label: t("admin.website.aboutHero.fields.metaBody"),
                value: metaBody,
                onChange: setMetaBody,
                multiline: true,
              })}
              {renderBilingual({
                label: t("admin.website.aboutHero.fields.imageAlt"),
                value: imageAlt,
                onChange: setImageAlt,
              })}
            </div>

            {error ? (
              <div
                role="alert"
                className="mt-5 rounded-[16px] bg-rose-50 px-4 py-3 text-[13px] font-semibold text-rose-700"
              >
                {error}
              </div>
            ) : null}

            {canManage ? (
              <div className="mt-6 flex justify-end">
                <button
                  type="submit"
                  disabled={busy}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-[var(--gym-ink,#111111)] px-5 text-[13px] font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
                >
                  <Check className="size-4" strokeWidth={2.4} />
                  {busy
                    ? t("admin.website.aboutHero.saving")
                    : t("admin.website.aboutHero.save")}
                </button>
              </div>
            ) : null}
          </section>

          <section className="rounded-[24px] bg-white p-4 sm:p-6 lg:p-7">
            <div className="mb-4">
              <h2 className="text-[18px] font-bold text-[var(--gym-ink,#111111)]">
                {t("admin.website.aboutHero.preview")}
              </h2>
              <p className="mt-1 text-[13px] font-medium text-[#6B7280]">
                {t("admin.website.aboutHero.previewHint")}
              </p>
            </div>

            <div className="overflow-hidden rounded-[20px] bg-[#24030c] text-white shadow-[0_16px_40px_rgba(36,3,12,0.25)]">
              <div className="relative min-h-[420px] p-5 sm:p-7">
                {previewUrl && !removeImage ? (
                  <img
                    src={previewUrl}
                    alt=""
                    className="pointer-events-none absolute inset-0 size-full object-cover object-[70%_center] opacity-55"
                  />
                ) : (
                  <div className="pointer-events-none absolute inset-0 flex items-center justify-center text-white/30">
                    <ImageOff className="size-10" strokeWidth={1.4} />
                  </div>
                )}
                <div
                  aria-hidden
                  className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,#24030c_0%,rgba(36,3,12,0.92)_48%,rgba(36,3,12,0.35)_100%)]"
                />

                <div className="relative z-[1] max-w-[28rem]">
                  <p className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-[var(--gym-lime,#fb5001)]">
                    {t("aboutPage.eyebrow")}
                  </p>
                  <p className="mt-3 text-[12px] font-bold text-white/70">
                    {t("aboutPage.nameLabel")}
                  </p>
                  <p className="mt-1 font-heading text-[28px] font-extrabold leading-tight sm:text-[34px]">
                    {previewName}
                  </p>
                  <p className="mt-4 font-heading text-[16px] font-bold leading-snug sm:text-[18px]">
                    {previewHeadline}
                  </p>
                  <p className="mt-4 text-[13px] leading-relaxed text-white/80">
                    {previewLead}
                  </p>
                  <p className="mt-3 text-[13px] leading-relaxed text-white/65">
                    {previewLeadSecondary}
                  </p>
                  <div className="mt-6 flex flex-wrap items-end gap-x-8 gap-y-4 border-t border-white/15 pt-5">
                    <div>
                      <p className="font-heading text-[28px] font-extrabold leading-none text-[var(--gym-lime,#fb5001)]">
                        {previewYearsValue}
                      </p>
                      <p className="mt-1.5 text-[12px] font-semibold text-white/60">
                        {previewYearsLabel}
                      </p>
                    </div>
                    <div className="max-w-[15rem]">
                      <p className="font-heading text-[14px] font-bold text-white">
                        {previewMetaTitle}
                      </p>
                      <p className="mt-1.5 text-[12px] leading-snug text-white/60">
                        {previewMetaBody}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </form>
      )}

      <ConfirmActionDialog
        open={confirmClearImage}
        title={t("admin.website.aboutHero.clearImageTitle")}
        description={t("admin.website.aboutHero.clearImageDescription")}
        tone="danger"
        confirmLabel={t("admin.website.aboutHero.removeImage")}
        onCancel={() => setConfirmClearImage(false)}
        onConfirm={async () => {
          try {
            await clearImageMutation.mutateAsync(
              user?.displayName || user?.email || undefined,
            )
            appToast.success(t("admin.website.aboutHero.toasts.imageRemoved"))
            setConfirmClearImage(false)
            setPreviewUrl(null)
            setRemoveImage(false)
            setFile(null)
          } catch (err) {
            appToast.error(
              err instanceof Error
                ? err.message
                : t("admin.website.aboutHero.toasts.error"),
            )
            throw err
          }
        }}
      />
    </div>
  )
}
