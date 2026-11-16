import { useEffect, useId, useState } from "react"
import { useTranslation } from "react-i18next"
import {
  ArrowDown,
  ArrowUp,
  Check,
  LayoutTemplate,
  Plus,
  Trash2,
} from "lucide-react"
import { StatCard } from "@/components/dashboard/StatCard"
import { useAuth } from "@/features/auth/auth-context"
import {
  ABOUT_CERTIFICATIONS_POINTS_MAX,
  DEFAULT_ABOUT_CERTIFICATIONS_COPY,
} from "@/features/website/aboutCertifications"
import { mirrorBilingual } from "@/features/website/service"
import {
  useAboutCertificationsContentQuery,
  useSaveAboutCertificationsContentMutation,
} from "@/features/website/hooks"
import { useDocumentTitle } from "@/hooks/useDocumentTitle"
import { useLocale } from "@/hooks/useLocale"
import { resolveBilingualText } from "@/lib/program-text"
import { appToast } from "@/lib/toast"
import type { BilingualText } from "@/types/program"
import type { AboutCertificationPoint } from "@/types/website"

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

export function AboutCertificationsPage() {
  const { t } = useTranslation()
  const { locale, isRtl } = useLocale()
  const isAr = locale === "ar"
  const { user, hasPermission } = useAuth()
  const canManage = hasPermission("content:manage")
  useDocumentTitle(t("admin.website.sections.aboutCertifications"))

  const {
    data: content,
    isLoading,
    isError,
    refetch,
  } = useAboutCertificationsContentQuery({ audience: "admin" })
  const saveMutation = useSaveAboutCertificationsContentMutation()

  const formId = useId()
  const [title, setTitle] = useState<FieldPair>(EMPTY)
  const [points, setPoints] = useState<Array<{ id: string; text: FieldPair }>>(
    [],
  )

  useEffect(() => {
    setTitle(toPair(content?.title, DEFAULT_ABOUT_CERTIFICATIONS_COPY.title))
    const sourcePoints =
      content?.points?.length
        ? content.points
        : DEFAULT_ABOUT_CERTIFICATIONS_COPY.points.map((p) => ({
            id: p.id,
            text: { ...p.text },
          }))
    setPoints(sourcePoints.map((p) => ({ id: p.id, text: toPair(p.text) })))
  }, [content])

  const busy = saveMutation.isPending
  const previewTitle = resolveBilingualText(
    title,
    locale,
    DEFAULT_ABOUT_CERTIFICATIONS_COPY.title[locale],
  )
  const previewPoints = points
    .map((point) => ({
      id: point.id,
      text: resolveBilingualText(point.text, locale),
    }))
    .filter((point) => point.text.trim())

  const inputClass =
    "h-11 w-full rounded-[16px] border border-black/10 bg-[#F7F7F7] px-3.5 text-[14px] font-medium text-[#111111] outline-none transition-colors focus:border-[#111111] focus:bg-white disabled:opacity-60"

  function renderBilingual(params: {
    label: string
    value: FieldPair
    onChange: (next: FieldPair) => void
  }) {
    return (
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <label className="flex flex-col gap-1.5">
          <span className="text-[12px] font-bold text-[#374151]">
            {params.label} ({isAr ? "عربي" : "Arabic"})
          </span>
          <input
            dir="rtl"
            value={params.value.ar}
            disabled={!canManage || busy}
            onChange={(e) =>
              params.onChange({ ...params.value, ar: e.target.value })
            }
            className={inputClass}
            style={{ fontFamily: "var(--font-arabic)" }}
          />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-[12px] font-bold text-[#374151]">
            {params.label} ({isAr ? "إنجليزي" : "English"})
          </span>
          <input
            dir="ltr"
            value={params.value.en}
            disabled={!canManage || busy}
            onChange={(e) =>
              params.onChange({ ...params.value, en: e.target.value })
            }
            className={inputClass}
          />
        </label>
      </div>
    )
  }

  async function handleSave(event: React.FormEvent) {
    event.preventDefault()
    if (!canManage || busy) return

    const mirroredTitle = mirrorBilingual(title.en, title.ar)
    if (!mirroredTitle) {
      appToast.error(
        t("admin.website.aboutCertifications.errors.titleRequired"),
      )
      return
    }

    const normalizedPoints: AboutCertificationPoint[] = []
    for (const point of points) {
      const text = mirrorBilingual(point.text.en, point.text.ar)
      if (!text) {
        appToast.error(
          t("admin.website.aboutCertifications.errors.pointRequired"),
        )
        return
      }
      normalizedPoints.push({ id: point.id, text })
    }
    if (normalizedPoints.length === 0) {
      appToast.error(t("admin.website.aboutCertifications.errors.pointsEmpty"))
      return
    }
    if (normalizedPoints.length > ABOUT_CERTIFICATIONS_POINTS_MAX) {
      appToast.error(
        t("admin.website.aboutCertifications.errors.pointsMax", {
          max: ABOUT_CERTIFICATIONS_POINTS_MAX,
        }),
      )
      return
    }

    try {
      await saveMutation.mutateAsync({
        title: mirroredTitle,
        points: normalizedPoints,
        updatedBy: user?.displayName || user?.email || undefined,
      })
      appToast.success(t("admin.website.aboutCertifications.toasts.saved"))
    } catch (err) {
      appToast.error(
        err instanceof Error
          ? err.message
          : t("admin.website.aboutCertifications.toasts.error"),
      )
    }
  }

  return (
    <div className="flex flex-col gap-4 sm:gap-5">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 lg:gap-4">
        <StatCard
          label={t("admin.website.aboutCertifications.stats.section")}
          value={t("admin.website.aboutCertifications.stats.label")}
          icon={<LayoutTemplate className="size-4" strokeWidth={1.8} />}
        />
        <StatCard
          label={t("admin.website.aboutCertifications.stats.points")}
          value={`${points.length}/${ABOUT_CERTIFICATIONS_POINTS_MAX}`}
          icon={<Check className="size-4" strokeWidth={1.8} />}
        />
        <StatCard
          label={t("admin.website.aboutCertifications.stats.title")}
          value={previewTitle || "—"}
          icon={<span className="text-[12px] font-extrabold">Aa</span>}
        />
      </div>

      {isError ? (
        <div className="flex min-h-40 flex-col items-center justify-center gap-3 rounded-[24px] bg-white px-4 py-10 text-center">
          <p className="text-sm font-medium text-[#8c8c8c]">
            {t("admin.website.aboutCertifications.loadError")}
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
          {t("admin.website.aboutCertifications.loading")}
        </div>
      ) : (
        <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
          <section className="rounded-[24px] bg-white p-4 sm:p-5">
            <p className="text-[12px] font-bold uppercase tracking-[0.12em] text-[#8c8c8c]">
              {t("admin.website.aboutCertifications.preview")}
            </p>
            <div className="relative mt-4 overflow-hidden rounded-[20px] bg-[var(--gym-dark,#24030c)] p-5 text-white">
              <p className="font-heading text-[11px] font-extrabold uppercase tracking-[0.12em] text-[var(--gym-lime,#fb5001)]">
                {t("whoIAm.certsTitle")}
              </p>
              <p className="mt-2 font-heading text-[22px] font-bold">
                {previewTitle}
              </p>
              <ul className="mt-5 grid gap-2.5 sm:grid-cols-2">
                {(previewPoints.length
                  ? previewPoints
                  : [{ id: "empty", text: "—" }]
                ).map((point) => (
                  <li
                    key={point.id}
                    className="flex items-center gap-3 rounded-[14px] border border-white/10 bg-white/[0.05] px-3.5 py-3"
                  >
                    <span className="inline-flex size-8 shrink-0 items-center justify-center rounded-full bg-[var(--gym-lime,#fb5001)]">
                      <Check className="size-3.5" strokeWidth={3} />
                    </span>
                    <span className="text-[13px] font-semibold leading-snug">
                      {point.text}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </section>

          <section
            className="rounded-[24px] bg-white p-4 sm:p-6 lg:p-7"
            dir={isRtl ? "rtl" : "ltr"}
          >
            <form id={formId} onSubmit={handleSave} className="space-y-5">
              <div>
                <h2 className="text-[18px] font-bold text-[var(--gym-ink,#111111)]">
                  {t("admin.website.aboutCertifications.editorTitle")}
                </h2>
                <p className="mt-1 text-[13px] font-medium text-[#6B7280]">
                  {t("admin.website.aboutCertifications.editorHint")}
                </p>
              </div>

              {renderBilingual({
                label: t("admin.website.aboutCertifications.fields.title"),
                value: title,
                onChange: setTitle,
              })}

              <div className="space-y-3 border-t border-black/[0.06] pt-5">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h3 className="font-heading text-[16px] font-extrabold text-[var(--gym-ink,#111111)]">
                      {t("admin.website.aboutCertifications.pointsTitle")}
                    </h3>
                    <p className="mt-0.5 text-[12px] font-medium text-[#6B7280]">
                      {t("admin.website.aboutCertifications.pointsHint", {
                        max: ABOUT_CERTIFICATIONS_POINTS_MAX,
                      })}
                    </p>
                  </div>
                  {canManage ? (
                    <button
                      type="button"
                      disabled={
                        busy || points.length >= ABOUT_CERTIFICATIONS_POINTS_MAX
                      }
                      onClick={() =>
                        setPoints((prev) => {
                          if (prev.length >= ABOUT_CERTIFICATIONS_POINTS_MAX) {
                            return prev
                          }
                          return [...prev, { id: newPointId(), text: EMPTY }]
                        })
                      }
                      className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full bg-[#F4F4F4] px-3 text-[12px] font-bold text-[var(--gym-ink,#111111)] transition hover:bg-black/5 disabled:opacity-60"
                    >
                      <Plus className="size-3.5" />
                      {t("admin.website.aboutCertifications.addPoint")}
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
                              aria-label={t(
                                "admin.website.aboutCertifications.moveUp",
                              )}
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
                                "admin.website.aboutCertifications.moveDown",
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
                                "admin.website.aboutCertifications.deletePoint",
                              )}
                            >
                              <Trash2 className="size-3.5" />
                            </button>
                          </div>
                        ) : null}
                      </div>
                      {renderBilingual({
                        label: t(
                          "admin.website.aboutCertifications.fields.point",
                        ),
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
                    type="submit"
                    disabled={busy}
                    className="inline-flex h-11 items-center gap-2 rounded-full bg-[var(--gym-ink,#111111)] px-5 text-[13px] font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
                  >
                    <Check className="size-4" strokeWidth={2.4} />
                    {busy
                      ? t("admin.website.aboutCertifications.saving")
                      : t("admin.website.aboutCertifications.save")}
                  </button>
                </div>
              ) : null}
            </form>
          </section>
        </div>
      )}
    </div>
  )
}
