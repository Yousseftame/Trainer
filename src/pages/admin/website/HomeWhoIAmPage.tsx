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
  UserRound,
} from "lucide-react"
import { ConfirmActionDialog } from "@/components/dashboard/ConfirmActionDialog"
import { StatCard } from "@/components/dashboard/StatCard"
import { useAuth } from "@/features/auth/auth-context"
import {
  DEFAULT_WHO_I_AM_COPY,
  formatBytesLabel,
  isRenderableImageSrc,
  mirrorBilingual,
  useClearWhoIAmImageMutation,
  useSaveWhoIAmContentMutation,
  useWhoIAmContentQuery,
  WHO_I_AM_UPLOAD_LIMITS,
} from "@/features/website"
import { useDocumentTitle } from "@/hooks/useDocumentTitle"
import { useLocale } from "@/hooks/useLocale"
import { resolveBilingualText } from "@/lib/program-text"
import { appToast } from "@/lib/toast"
import { cn } from "@/lib/utils"
import type { BilingualText } from "@/types/program"
import type { WhoIAmPoint } from "@/types/website"

type FieldPair = { en: string; ar: string }

const EMPTY: FieldPair = { en: "", ar: "" }

function toPair(value: BilingualText | undefined, fallback?: BilingualText): FieldPair {
  return {
    en: value?.en || fallback?.en || "",
    ar: value?.ar || fallback?.ar || "",
  }
}

function newPointId() {
  return `point_${Math.random().toString(36).slice(2, 10)}`
}

export function HomeWhoIAmPage() {
  const { t } = useTranslation()
  const { locale, isRtl } = useLocale()
  const isAr = locale === "ar"
  const { user, hasPermission } = useAuth()
  const canManage = hasPermission("content:manage")
  useDocumentTitle(t("admin.website.sections.homeWhoIAm"))

  const {
    data: content,
    isLoading,
    isError,
    refetch,
  } = useWhoIAmContentQuery({ audience: "admin" })
  const saveMutation = useSaveWhoIAmContentMutation()
  const clearImageMutation = useClearWhoIAmImageMutation()

  const fileInputRef = useRef<HTMLInputElement>(null)
  const formId = useId()

  const [yearsValue, setYearsValue] = useState<FieldPair>(EMPTY)
  const [yearsLabel, setYearsLabel] = useState<FieldPair>(EMPTY)
  const [eyebrow, setEyebrow] = useState<FieldPair>(EMPTY)
  const [titleLine1, setTitleLine1] = useState<FieldPair>(EMPTY)
  const [titleLine2, setTitleLine2] = useState<FieldPair>(EMPTY)
  const [body, setBody] = useState<FieldPair>(EMPTY)
  const [cta, setCta] = useState<FieldPair>(EMPTY)
  const [pointsTitle, setPointsTitle] = useState<FieldPair>(EMPTY)
  const [points, setPoints] = useState<Array<{ id: string; text: FieldPair }>>(
    [],
  )
  const [file, setFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [removeImage, setRemoveImage] = useState(false)
  const [uploadPercent, setUploadPercent] = useState<number | null>(null)
  const [confirmClearImage, setConfirmClearImage] = useState(false)

  useEffect(() => {
    const source = content
    setYearsValue(toPair(source?.yearsValue, DEFAULT_WHO_I_AM_COPY.yearsValue))
    setYearsLabel(toPair(source?.yearsLabel, DEFAULT_WHO_I_AM_COPY.yearsLabel))
    setEyebrow(toPair(source?.eyebrow, DEFAULT_WHO_I_AM_COPY.eyebrow))
    setTitleLine1(toPair(source?.titleLine1, DEFAULT_WHO_I_AM_COPY.titleLine1))
    setTitleLine2(toPair(source?.titleLine2, DEFAULT_WHO_I_AM_COPY.titleLine2))
    setBody(toPair(source?.body, DEFAULT_WHO_I_AM_COPY.body))
    setCta(toPair(source?.cta, DEFAULT_WHO_I_AM_COPY.cta))
    setPointsTitle(
      toPair(source?.pointsTitle, DEFAULT_WHO_I_AM_COPY.pointsTitle),
    )
    const sourcePoints =
      source?.points?.length
        ? source.points
        : DEFAULT_WHO_I_AM_COPY.points.map((p) => ({
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
      source?.imageUrl && isRenderableImageSrc(source.imageUrl)
        ? source.imageUrl
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

    const fields: Array<{ label: string; pair: FieldPair }> = [
      { label: t("admin.website.whoIAm.fields.yearsValue"), pair: yearsValue },
      { label: t("admin.website.whoIAm.fields.yearsLabel"), pair: yearsLabel },
      { label: t("admin.website.whoIAm.fields.eyebrow"), pair: eyebrow },
      { label: t("admin.website.whoIAm.fields.titleLine1"), pair: titleLine1 },
      { label: t("admin.website.whoIAm.fields.titleLine2"), pair: titleLine2 },
      { label: t("admin.website.whoIAm.fields.body"), pair: body },
      { label: t("admin.website.whoIAm.fields.cta"), pair: cta },
      {
        label: t("admin.website.whoIAm.fields.pointsTitle"),
        pair: pointsTitle,
      },
    ]

    for (const field of fields) {
      if (!mirrorBilingual(field.pair.en, field.pair.ar)) {
        appToast.error(
          t("admin.website.whoIAm.errors.requiredField", {
            field: field.label,
          }),
        )
        return
      }
    }

    const normalizedPoints: WhoIAmPoint[] = []
    for (const point of points) {
      const text = mirrorBilingual(point.text.en, point.text.ar)
      if (!text) {
        appToast.error(t("admin.website.whoIAm.errors.pointRequired"))
        return
      }
      normalizedPoints.push({ id: point.id, text })
    }
    if (normalizedPoints.length === 0) {
      appToast.error(t("admin.website.whoIAm.errors.pointsEmpty"))
      return
    }

    if (file && file.size > WHO_I_AM_UPLOAD_LIMITS.imageBytes) {
      appToast.error(
        t("admin.website.whoIAm.errors.imageTooLarge", {
          limit: formatBytesLabel(WHO_I_AM_UPLOAD_LIMITS.imageBytes),
        }),
      )
      return
    }

    try {
      setUploadPercent(file ? 0 : null)
      await saveMutation.mutateAsync({
        yearsValue: mirrorBilingual(yearsValue.en, yearsValue.ar)!,
        yearsLabel: mirrorBilingual(yearsLabel.en, yearsLabel.ar)!,
        eyebrow: mirrorBilingual(eyebrow.en, eyebrow.ar)!,
        titleLine1: mirrorBilingual(titleLine1.en, titleLine1.ar)!,
        titleLine2: mirrorBilingual(titleLine2.en, titleLine2.ar)!,
        body: mirrorBilingual(body.en, body.ar)!,
        cta: mirrorBilingual(cta.en, cta.ar)!,
        pointsTitle: mirrorBilingual(pointsTitle.en, pointsTitle.ar)!,
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
      appToast.success(t("admin.website.whoIAm.toasts.saved"))
    } catch (err) {
      appToast.error(
        err instanceof Error
          ? err.message
          : t("admin.website.whoIAm.toasts.error"),
      )
    } finally {
      setUploadPercent(null)
    }
  }

  const previewYears = resolveBilingualText(
    { en: yearsValue.en || yearsValue.ar, ar: yearsValue.ar || yearsValue.en },
    locale,
  )
  const previewYearsLabel = resolveBilingualText(
    {
      en: yearsLabel.en || yearsLabel.ar,
      ar: yearsLabel.ar || yearsLabel.en,
    },
    locale,
  )

  return (
    <div className="flex flex-col gap-4 sm:gap-5">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 lg:gap-4">
        <StatCard
          label={t("admin.website.whoIAm.stats.points")}
          value={points.length}
          icon={<Check className="size-4" strokeWidth={1.8} />}
        />
        <StatCard
          label={t("admin.website.whoIAm.stats.years")}
          value={previewYears || "—"}
          icon={<UserRound className="size-4" strokeWidth={1.8} />}
        />
        <StatCard
          label={t("admin.website.whoIAm.stats.photo")}
          value={
            previewUrl || hasStoredImage
              ? t("admin.website.whoIAm.stats.photoSet")
              : t("admin.website.whoIAm.stats.photoMissing")
          }
          icon={<ImagePlus className="size-4" strokeWidth={1.8} />}
        />
      </div>

      {isError ? (
        <div className="flex min-h-40 flex-col items-center justify-center gap-3 rounded-[24px] bg-white px-4 py-10 text-center">
          <p className="text-sm font-medium text-[#8c8c8c]">
            {t("admin.website.whoIAm.loadError")}
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
          {t("admin.website.whoIAm.loading")}
        </div>
      ) : (
        <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
          {/* Live preview */}
          <section className="overflow-hidden rounded-[24px] bg-white p-4 sm:p-5">
            <p className="text-[12px] font-bold uppercase tracking-[0.12em] text-[#8c8c8c]">
              {t("admin.website.whoIAm.preview")}
            </p>
            <div className="relative mt-3 aspect-[4/5] w-full overflow-hidden rounded-[22px] bg-[var(--gym-dark,#24030c)]">
              {previewUrl ? (
                <img
                  src={previewUrl}
                  alt=""
                  className="absolute inset-0 size-full object-cover object-center"
                />
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-white/40">
                  <ImageOff className="size-10" strokeWidth={1.5} />
                  <span className="text-[13px] font-medium">
                    {t("admin.website.whoIAm.imageEmpty")}
                  </span>
                </div>
              )}
              <div
                aria-hidden
                className="pointer-events-none absolute inset-0"
                style={{
                  background:
                    "linear-gradient(to top, rgba(26,2,8,0.88) 0%, rgba(26,2,8,0.55) 22%, transparent 70%)",
                }}
              />
              <div
                className={cn(
                  "absolute bottom-6 z-[2] text-end",
                  isRtl ? "start-6" : "end-6",
                )}
              >
                <p className="font-heading text-[56px] font-extrabold leading-none tracking-tight text-[var(--gym-lime,#fb5001)] sm:text-[64px]">
                  {previewYears || "—"}
                </p>
                <p className="mt-1 font-heading text-[15px] font-bold text-white sm:text-[17px]">
                  {previewYearsLabel || "—"}
                </p>
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
                  {previewUrl
                    ? t("admin.website.whoIAm.replaceImage")
                    : t("admin.website.whoIAm.chooseImage")}
                </button>
                {(previewUrl || hasStoredImage) && (
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => {
                      if (hasStoredImage && !file) {
                        setConfirmClearImage(true)
                      } else {
                        setFile(null)
                        setPreviewUrl(null)
                        setRemoveImage(true)
                      }
                    }}
                    className="inline-flex h-10 items-center gap-2 rounded-full bg-[#FFE8E4] px-4 text-[13px] font-bold text-[#C44536] transition hover:bg-[#ffd8d1] disabled:opacity-60"
                  >
                    <Trash2 className="size-3.5" />
                    {t("admin.website.whoIAm.removeImage")}
                  </button>
                )}
                <p className="w-full text-[12px] font-medium text-[#6B7280]">
                  {t("admin.website.whoIAm.imageHint", {
                    limit: formatBytesLabel(WHO_I_AM_UPLOAD_LIMITS.imageBytes),
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

          {/* Editor */}
          <section className="rounded-[24px] bg-white p-4 sm:p-6 lg:p-7">
            <div className="space-y-5">
              <div>
                <h2 className="font-heading text-[18px] font-extrabold text-[var(--gym-ink,#111111)] sm:text-[20px]">
                  {t("admin.website.whoIAm.leftTitle")}
                </h2>
                <p className="mt-1 text-[13px] font-medium text-[#6B7280]">
                  {t("admin.website.whoIAm.leftHint")}
                </p>
              </div>

              {renderBilingual({
                label: t("admin.website.whoIAm.fields.yearsValue"),
                value: yearsValue,
                onChange: setYearsValue,
                placeholderEn: "14+",
                placeholderAr: "+14",
              })}
              {renderBilingual({
                label: t("admin.website.whoIAm.fields.yearsLabel"),
                value: yearsLabel,
                onChange: setYearsLabel,
                placeholderEn: "Years of Experience",
                placeholderAr: "سنوات من الخبرة",
              })}

              <div className="border-t border-black/[0.06] pt-5">
                <h2 className="font-heading text-[18px] font-extrabold text-[var(--gym-ink,#111111)] sm:text-[20px]">
                  {t("admin.website.whoIAm.rightTitle")}
                </h2>
                <p className="mt-1 text-[13px] font-medium text-[#6B7280]">
                  {t("admin.website.whoIAm.rightHint")}
                </p>
              </div>

              {renderBilingual({
                label: t("admin.website.whoIAm.fields.eyebrow"),
                value: eyebrow,
                onChange: setEyebrow,
                placeholderEn: "Who I Am",
                placeholderAr: "من أنا",
              })}
              {renderBilingual({
                label: t("admin.website.whoIAm.fields.titleLine1"),
                value: titleLine1,
                onChange: setTitleLine1,
              })}
              {renderBilingual({
                label: t("admin.website.whoIAm.fields.titleLine2"),
                value: titleLine2,
                onChange: setTitleLine2,
              })}
              {renderBilingual({
                label: t("admin.website.whoIAm.fields.body"),
                value: body,
                onChange: setBody,
                multiline: true,
              })}
              {renderBilingual({
                label: t("admin.website.whoIAm.fields.cta"),
                value: cta,
                onChange: setCta,
                placeholderEn: "Get to know me",
                placeholderAr: "تعرّف عليّ",
              })}
              {renderBilingual({
                label: t("admin.website.whoIAm.fields.pointsTitle"),
                value: pointsTitle,
                onChange: setPointsTitle,
                placeholderEn: "Certifications",
                placeholderAr: "الشهادات",
              })}

              <div className="space-y-3 border-t border-black/[0.06] pt-5">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="font-heading text-[16px] font-extrabold text-[var(--gym-ink,#111111)]">
                    {t("admin.website.whoIAm.pointsTitle")}
                  </h3>
                  {canManage ? (
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() =>
                        setPoints((prev) => [
                          ...prev,
                          { id: newPointId(), text: EMPTY },
                        ])
                      }
                      className="inline-flex h-9 items-center gap-1.5 rounded-full bg-[#F4F4F4] px-3 text-[12px] font-bold text-[var(--gym-ink,#111111)] transition hover:bg-black/5 disabled:opacity-60"
                    >
                      <Plus className="size-3.5" />
                      {t("admin.website.whoIAm.addPoint")}
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
                        <span className="inline-flex size-7 items-center justify-center rounded-full bg-[var(--gym-ink,#111111)] text-[12px] font-bold text-white">
                          {index + 1}
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
                              aria-label={t("admin.website.whoIAm.moveUp")}
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
                              aria-label={t("admin.website.whoIAm.moveDown")}
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
                              aria-label={t("admin.website.whoIAm.deletePoint")}
                            >
                              <Trash2 className="size-3.5" />
                            </button>
                          </div>
                        ) : null}
                      </div>
                      {renderBilingual({
                        label: t("admin.website.whoIAm.fields.point"),
                        value: point.text,
                        onChange: (next) =>
                          setPoints((prev) =>
                            prev.map((p) =>
                              p.id === point.id ? { ...p, text: next } : p,
                            ),
                          ),
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
                    className="inline-flex h-11 items-center gap-2 rounded-full bg-[var(--gym-ink,#111111)] px-5 text-[13px] font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
                  >
                    <Check className="size-4" strokeWidth={2.4} />
                    {busy
                      ? t("admin.website.whoIAm.saving")
                      : t("admin.website.whoIAm.save")}
                  </button>
                </div>
              ) : null}
            </div>
          </section>
        </div>
      )}

      <ConfirmActionDialog
        open={confirmClearImage}
        title={t("admin.website.whoIAm.clearImageTitle")}
        description={t("admin.website.whoIAm.clearImageDescription")}
        tone="danger"
        confirmLabel={t("admin.website.whoIAm.removeImage")}
        onCancel={() => setConfirmClearImage(false)}
        onConfirm={async () => {
          try {
            await clearImageMutation.mutateAsync(
              user?.displayName || user?.email || undefined,
            )
            setPreviewUrl(null)
            setFile(null)
            setRemoveImage(false)
            appToast.success(t("admin.website.whoIAm.toasts.imageRemoved"))
          } catch (err) {
            appToast.error(
              err instanceof Error
                ? err.message
                : t("admin.website.whoIAm.toasts.error"),
            )
            throw err
          }
        }}
      />
    </div>
  )
}
