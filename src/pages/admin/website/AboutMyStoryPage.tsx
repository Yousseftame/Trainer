import { useEffect, useId, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import {
  ArrowDown,
  ArrowUp,
  Check,
  ImageOff,
  ImagePlus,
  Plus,
  Trash2,
} from "lucide-react"
import { ConfirmActionDialog } from "@/components/dashboard/ConfirmActionDialog"
import { StatCard } from "@/components/dashboard/StatCard"
import { useAuth } from "@/features/auth/auth-context"
import {
  ABOUT_MY_STORY_POINTS_MAX,
  ABOUT_MY_STORY_UPLOAD_LIMITS,
  DEFAULT_ABOUT_MY_STORY_COPY,
  formatBytesLabel,
  isRenderableImageSrc,
  mirrorBilingual,
  useAboutMyStoryContentQuery,
  useClearAboutMyStoryImageMutation,
  useSaveAboutMyStoryContentMutation,
} from "@/features/website"
import { useDocumentTitle } from "@/hooks/useDocumentTitle"
import { useLocale } from "@/hooks/useLocale"
import { resolveBilingualText } from "@/lib/program-text"
import { appToast } from "@/lib/toast"
import { cn } from "@/lib/utils"
import type { BilingualText } from "@/types/program"
import type { AboutMyStoryPoint } from "@/types/website"

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

function newPointId() {
  return `point_${Math.random().toString(36).slice(2, 10)}`
}

export function AboutMyStoryPage() {
  const { t } = useTranslation()
  const { locale, isRtl } = useLocale()
  const isAr = locale === "ar"
  const { user, hasPermission } = useAuth()
  const canManage = hasPermission("content:manage")
  useDocumentTitle(t("admin.website.sections.aboutMyStory"))

  const {
    data: content,
    isLoading,
    isError,
    refetch,
  } = useAboutMyStoryContentQuery({ audience: "admin" })
  const saveMutation = useSaveAboutMyStoryContentMutation()
  const clearImageMutation = useClearAboutMyStoryImageMutation()

  const fileInputRef = useRef<HTMLInputElement>(null)
  const formId = useId()

  const [watermark, setWatermark] = useState<FieldPair>(EMPTY)
  const [imageAlt, setImageAlt] = useState<FieldPair>(EMPTY)
  const [points, setPoints] = useState<Array<{ id: string; text: FieldPair }>>(
    [],
  )
  const [file, setFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [removeImage, setRemoveImage] = useState(false)
  const [uploadPercent, setUploadPercent] = useState<number | null>(null)
  const [confirmClearImage, setConfirmClearImage] = useState(false)

  useEffect(() => {
    setWatermark(
      toPair(content?.watermark, DEFAULT_ABOUT_MY_STORY_COPY.watermark),
    )
    setImageAlt(
      toPair(content?.imageAlt, DEFAULT_ABOUT_MY_STORY_COPY.imageAlt),
    )
    const sourcePoints =
      content?.points?.length
        ? content.points
        : DEFAULT_ABOUT_MY_STORY_COPY.points.map((p) => ({
            id: p.id,
            text: { ...p.text },
          }))
    setPoints(
      sourcePoints.map((p) => ({
        id: p.id,
        text: toPair(p.text),
      })),
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

  const previewWatermark = resolveBilingualText(
    { en: watermark.en, ar: watermark.ar },
    locale,
    DEFAULT_ABOUT_MY_STORY_COPY.watermark[locale],
  )

  const previewPoints = points
    .map((point) => ({
      id: point.id,
      text: resolveBilingualText(point.text, locale),
    }))
    .filter((point) => point.text.trim())

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

  async function handleSave() {
    if (!canManage || busy) return

    if (!mirrorBilingual(watermark.en, watermark.ar)) {
      appToast.error(
        t("admin.website.aboutMyStory.errors.requiredField", {
          field: t("admin.website.aboutMyStory.fields.watermark"),
        }),
      )
      return
    }
    if (!mirrorBilingual(imageAlt.en, imageAlt.ar)) {
      appToast.error(
        t("admin.website.aboutMyStory.errors.requiredField", {
          field: t("admin.website.aboutMyStory.fields.imageAlt"),
        }),
      )
      return
    }

    const normalizedPoints: AboutMyStoryPoint[] = []
    for (const point of points) {
      const text = mirrorBilingual(point.text.en, point.text.ar)
      if (!text) {
        appToast.error(t("admin.website.aboutMyStory.errors.pointRequired"))
        return
      }
      normalizedPoints.push({ id: point.id, text })
    }
    if (normalizedPoints.length === 0) {
      appToast.error(t("admin.website.aboutMyStory.errors.pointsEmpty"))
      return
    }
    if (normalizedPoints.length > ABOUT_MY_STORY_POINTS_MAX) {
      appToast.error(
        t("admin.website.aboutMyStory.errors.pointsMax", {
          max: ABOUT_MY_STORY_POINTS_MAX,
        }),
      )
      return
    }

    if (file && file.size > ABOUT_MY_STORY_UPLOAD_LIMITS.imageBytes) {
      appToast.error(
        t("admin.website.aboutMyStory.errors.imageTooLarge", {
          limit: formatBytesLabel(ABOUT_MY_STORY_UPLOAD_LIMITS.imageBytes),
        }),
      )
      return
    }
    if (file && !file.type.match(/^image\//)) {
      appToast.error(t("admin.website.aboutMyStory.errors.imageType"))
      return
    }

    try {
      setUploadPercent(file ? 0 : null)
      await saveMutation.mutateAsync({
        watermark: mirrorBilingual(watermark.en, watermark.ar)!,
        imageAlt: mirrorBilingual(imageAlt.en, imageAlt.ar)!,
        points: normalizedPoints,
        file: file ?? null,
        removeImage: removeImage && !file,
        updatedBy: user?.displayName || user?.email || undefined,
        onUploadProgress: file
          ? (percent) => setUploadPercent(percent)
          : undefined,
      })
      setFile(null)
      setRemoveImage(false)
      appToast.success(t("admin.website.aboutMyStory.toasts.saved"))
    } catch (err) {
      appToast.error(
        err instanceof Error
          ? err.message
          : t("admin.website.aboutMyStory.toasts.error"),
      )
    } finally {
      setUploadPercent(null)
    }
  }

  return (
    <div className="flex flex-col gap-4 sm:gap-5">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 lg:gap-4">
        <StatCard
          label={t("admin.website.aboutMyStory.stats.points")}
          value={`${points.length}/${ABOUT_MY_STORY_POINTS_MAX}`}
          icon={<Check className="size-4" strokeWidth={1.8} />}
        />
        <StatCard
          label={t("admin.website.aboutMyStory.stats.watermark")}
          value={previewWatermark || "—"}
          icon={<span className="text-[13px] font-extrabold">+</span>}
        />
        <StatCard
          label={t("admin.website.aboutMyStory.stats.photo")}
          value={
            previewUrl || hasStoredImage
              ? t("admin.website.aboutMyStory.stats.photoSet")
              : t("admin.website.aboutMyStory.stats.photoMissing")
          }
          icon={<ImagePlus className="size-4" strokeWidth={1.8} />}
        />
      </div>

      {isError ? (
        <div className="flex min-h-40 flex-col items-center justify-center gap-3 rounded-[24px] bg-white px-4 py-10 text-center">
          <p className="text-sm font-medium text-[#8c8c8c]">
            {t("admin.website.aboutMyStory.loadError")}
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
          {t("admin.website.aboutMyStory.loading")}
        </div>
      ) : (
        <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
          <section className="overflow-hidden rounded-[24px] bg-white p-4 sm:p-5">
            <p className="text-[12px] font-bold uppercase tracking-[0.12em] text-[#8c8c8c]">
              {t("admin.website.aboutMyStory.preview")}
            </p>

            <div className="relative mt-3 overflow-hidden rounded-[20px] bg-[#fafafa] p-4 sm:p-5">
              <p
                aria-hidden
                className="pointer-events-none absolute -top-3 end-2 select-none font-heading text-[5.5rem] font-extrabold leading-none text-[var(--gym-ink)]/[0.06]"
              >
                {previewWatermark || "14+"}
              </p>

              <div className="relative z-[1] grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
                <div>
                  <p className="font-heading text-[11px] font-extrabold uppercase tracking-[0.12em] text-[var(--gym-lime,#fb5001)]">
                    {t("aboutPage.story.eyebrow")}
                  </p>
                  <p className="mt-2 font-heading text-[20px] font-bold leading-snug text-[var(--gym-ink,#111111)]">
                    {t("aboutPage.story.title")}
                  </p>
                  <div className="mt-4 overflow-hidden rounded-[16px] bg-black/5">
                    {previewUrl && !removeImage ? (
                      <img
                        src={previewUrl}
                        alt=""
                        className="aspect-[4/5] w-full object-cover object-center"
                      />
                    ) : (
                      <div className="flex aspect-[4/5] flex-col items-center justify-center gap-2 text-[#8c8c8c]">
                        <ImageOff className="size-8" strokeWidth={1.4} />
                        <span className="px-3 text-center text-[12px] font-medium">
                          {t("admin.website.aboutMyStory.imageEmpty")}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex flex-col gap-4">
                  {(previewPoints.length > 0
                    ? previewPoints
                    : [{ id: "empty", text: "—" }]
                  ).map((point, index) => (
                    <div key={point.id} className="relative ps-4">
                      <span
                        aria-hidden
                        className="absolute start-0 top-1 h-[calc(100%-0.25rem)] w-[2px] rounded-full bg-[var(--gym-lime,#fb5001)]/30"
                      />
                      <span className="mb-1.5 block font-heading text-[11px] font-extrabold text-[var(--gym-lime,#fb5001)]">
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      <p className="text-[13px] leading-relaxed text-[var(--gym-muted,#6b7280)]">
                        {point.text}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {canManage ? (
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex h-10 items-center gap-2 rounded-full bg-[var(--gym-ink,#111111)] px-4 text-[13px] font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
                >
                  <ImagePlus className="size-4" />
                  {previewUrl && !removeImage
                    ? t("admin.website.aboutMyStory.replaceImage")
                    : t("admin.website.aboutMyStory.chooseImage")}
                </button>
                {(previewUrl || hasStoredImage) && (
                  <button
                    type="button"
                    disabled={busy}
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
                    {t("admin.website.aboutMyStory.removeImage")}
                  </button>
                )}
                <p className="text-[12px] font-medium text-[#6B7280]">
                  {t("admin.website.aboutMyStory.imageHint", {
                    limit: formatBytesLabel(
                      ABOUT_MY_STORY_UPLOAD_LIMITS.imageBytes,
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
                    setFile(e.target.files?.[0] ?? null)
                    e.target.value = ""
                  }}
                />
                {uploadPercent != null ? (
                  <div className="h-2 w-full overflow-hidden rounded-full bg-black/5">
                    <div
                      className="h-full rounded-full bg-[var(--gym-lime,#fb5001)] transition-all"
                      style={{ width: `${uploadPercent}%` }}
                    />
                  </div>
                ) : null}
              </div>
            ) : null}
          </section>

          <section
            className="rounded-[24px] bg-white p-4 sm:p-6 lg:p-7"
            dir={isRtl ? "rtl" : "ltr"}
          >
            <div className="space-y-5">
              <div>
                <h2 className="font-heading text-[18px] font-extrabold text-[var(--gym-ink,#111111)] sm:text-[20px]">
                  {t("admin.website.aboutMyStory.editorTitle")}
                </h2>
                <p className="mt-1 text-[13px] font-medium text-[#6B7280]">
                  {t("admin.website.aboutMyStory.editorHint")}
                </p>
              </div>

              {renderBilingual({
                label: t("admin.website.aboutMyStory.fields.watermark"),
                value: watermark,
                onChange: setWatermark,
                placeholderEn: "14+",
                placeholderAr: "+14",
              })}
              {renderBilingual({
                label: t("admin.website.aboutMyStory.fields.imageAlt"),
                value: imageAlt,
                onChange: setImageAlt,
              })}

              <div className="space-y-3 border-t border-black/[0.06] pt-5">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h3 className="font-heading text-[16px] font-extrabold text-[var(--gym-ink,#111111)]">
                      {t("admin.website.aboutMyStory.pointsTitle")}
                    </h3>
                    <p className="mt-0.5 text-[12px] font-medium text-[#6B7280]">
                      {t("admin.website.aboutMyStory.pointsHint", {
                        max: ABOUT_MY_STORY_POINTS_MAX,
                      })}
                    </p>
                  </div>
                  {canManage ? (
                    <button
                      type="button"
                      disabled={busy || points.length >= ABOUT_MY_STORY_POINTS_MAX}
                      onClick={() =>
                        setPoints((prev) => {
                          if (prev.length >= ABOUT_MY_STORY_POINTS_MAX) return prev
                          return [...prev, { id: newPointId(), text: EMPTY }]
                        })
                      }
                      className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full bg-[#F4F4F4] px-3 text-[12px] font-bold text-[var(--gym-ink,#111111)] transition hover:bg-black/5 disabled:opacity-60"
                    >
                      <Plus className="size-3.5" />
                      {t("admin.website.aboutMyStory.addPoint")}
                    </button>
                  ) : null}
                </div>

                <ul className="space-y-3">
                  {points.map((point, index) => (
                    <li
                      key={point.id}
                      className="rounded-[18px] bg-[#F4F4F4] p-3.5 sm:p-4"
                    >
                      <div className="mb-3 flex items-center justify-between gap-2">
                        <span className="inline-flex size-7 items-center justify-center rounded-full bg-[var(--gym-lime,#fb5001)] text-[12px] font-bold text-white">
                          {String(index + 1).padStart(2, "0")}
                        </span>
                        {canManage ? (
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              disabled={busy || index === 0}
                              onClick={() =>
                                setPoints((prev) => {
                                  if (index === 0) return prev
                                  const next = [...prev]
                                  ;[next[index - 1], next[index]] = [
                                    next[index],
                                    next[index - 1],
                                  ]
                                  return next
                                })
                              }
                              className="flex size-8 items-center justify-center rounded-full bg-white text-[var(--gym-ink,#111111)] shadow-sm disabled:opacity-40"
                              aria-label={t("admin.website.aboutMyStory.moveUp")}
                            >
                              <ArrowUp className="size-3.5" />
                            </button>
                            <button
                              type="button"
                              disabled={busy || index === points.length - 1}
                              onClick={() =>
                                setPoints((prev) => {
                                  if (index >= prev.length - 1) return prev
                                  const next = [...prev]
                                  ;[next[index], next[index + 1]] = [
                                    next[index + 1],
                                    next[index],
                                  ]
                                  return next
                                })
                              }
                              className="flex size-8 items-center justify-center rounded-full bg-white text-[var(--gym-ink,#111111)] shadow-sm disabled:opacity-40"
                              aria-label={t(
                                "admin.website.aboutMyStory.moveDown",
                              )}
                            >
                              <ArrowDown className="size-3.5" />
                            </button>
                            <button
                              type="button"
                              disabled={busy || points.length <= 1}
                              onClick={() =>
                                setPoints((prev) =>
                                  prev.filter((p) => p.id !== point.id),
                                )
                              }
                              className="flex size-8 items-center justify-center rounded-full bg-[#FFE8E4] text-[#C44536] disabled:opacity-40"
                              aria-label={t(
                                "admin.website.aboutMyStory.deletePoint",
                              )}
                            >
                              <Trash2 className="size-3.5" />
                            </button>
                          </div>
                        ) : null}
                      </div>
                      {renderBilingual({
                        label: t("admin.website.aboutMyStory.fields.point"),
                        value: point.text,
                        onChange: (next) =>
                          setPoints((prev) =>
                            prev.map((p) =>
                              p.id === point.id ? { ...p, text: next } : p,
                            ),
                          ),
                        multiline: true,
                      })}
                    </li>
                  ))}
                </ul>
              </div>

              {canManage ? (
                <div className="flex justify-end border-t border-black/[0.06] pt-5">
                  <button
                    type="button"
                    id={formId}
                    disabled={busy}
                    onClick={() => void handleSave()}
                    className={cn(
                      "inline-flex h-11 items-center gap-2 rounded-full bg-[var(--gym-ink,#111111)] px-5 text-[13px] font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-60",
                    )}
                  >
                    <Check className="size-4" strokeWidth={2.4} />
                    {busy
                      ? t("admin.website.aboutMyStory.saving")
                      : t("admin.website.aboutMyStory.save")}
                  </button>
                </div>
              ) : null}
            </div>
          </section>
        </div>
      )}

      <ConfirmActionDialog
        open={confirmClearImage}
        title={t("admin.website.aboutMyStory.clearImageTitle")}
        description={t("admin.website.aboutMyStory.clearImageDescription")}
        tone="danger"
        confirmLabel={t("admin.website.aboutMyStory.removeImage")}
        onCancel={() => setConfirmClearImage(false)}
        onConfirm={async () => {
          try {
            await clearImageMutation.mutateAsync(
              user?.displayName || user?.email || undefined,
            )
            setPreviewUrl(null)
            setFile(null)
            setRemoveImage(false)
            appToast.success(
              t("admin.website.aboutMyStory.toasts.imageRemoved"),
            )
          } catch (err) {
            appToast.error(
              err instanceof Error
                ? err.message
                : t("admin.website.aboutMyStory.toasts.error"),
            )
            throw err
          }
        }}
      />
    </div>
  )
}
