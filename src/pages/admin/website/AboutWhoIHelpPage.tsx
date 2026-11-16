import { useEffect, useId, useState } from "react"
import { useTranslation } from "react-i18next"
import { Check, LayoutTemplate } from "lucide-react"
import { StatCard } from "@/components/dashboard/StatCard"
import { useAuth } from "@/features/auth/auth-context"
import {
  ABOUT_WHO_I_HELP_POINT_IDS,
  ABOUT_WHO_I_HELP_POINTS_MAX,
  DEFAULT_ABOUT_WHO_I_HELP_COPY,
  createDefaultAboutWhoIHelpContent,
} from "@/features/website/aboutWhoIHelp"
import { mirrorBilingual } from "@/features/website/service"
import {
  useAboutWhoIHelpContentQuery,
  useSaveAboutWhoIHelpContentMutation,
} from "@/features/website/hooks"
import { useDocumentTitle } from "@/hooks/useDocumentTitle"
import { useLocale } from "@/hooks/useLocale"
import { resolveBilingualText } from "@/lib/program-text"
import { appToast } from "@/lib/toast"
import type { BilingualText } from "@/types/program"
import type { AboutWhoIHelpPointId } from "@/types/website"

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

export function AboutWhoIHelpPage() {
  const { t } = useTranslation()
  const { locale, isRtl } = useLocale()
  const isAr = locale === "ar"
  const { user, hasPermission } = useAuth()
  const canManage = hasPermission("content:manage")
  useDocumentTitle(t("admin.website.sections.aboutWhoIHelp"))

  const {
    data: content,
    isLoading,
    isError,
    refetch,
  } = useAboutWhoIHelpContentQuery({ audience: "admin" })
  const saveMutation = useSaveAboutWhoIHelpContentMutation()

  const formId = useId()
  const [title, setTitle] = useState<FieldPair>(EMPTY)
  const [points, setPoints] = useState<
    Record<AboutWhoIHelpPointId, FieldPair>
  >({
    strength: EMPTY,
    fatLoss: EMPTY,
    health: EMPTY,
    athletes: EMPTY,
  })

  useEffect(() => {
    const source = content ?? createDefaultAboutWhoIHelpContent()
    setTitle(toPair(source.title, DEFAULT_ABOUT_WHO_I_HELP_COPY.title))
    const next = { ...points }
    for (const id of ABOUT_WHO_I_HELP_POINT_IDS) {
      const point = source.points.find((p) => p.id === id)
      next[id] = toPair(point?.text, DEFAULT_ABOUT_WHO_I_HELP_COPY.points[id])
    }
    setPoints(next)
    // eslint-disable-next-line react-hooks/exhaustive-deps -- sync from CMS only
  }, [content])

  const busy = saveMutation.isPending
  const previewTitle = resolveBilingualText(
    title,
    locale,
    DEFAULT_ABOUT_WHO_I_HELP_COPY.title[locale],
  )

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
      appToast.error(t("admin.website.aboutWhoIHelp.errors.titleRequired"))
      return
    }

    const normalizedPoints = []
    for (const id of ABOUT_WHO_I_HELP_POINT_IDS) {
      const text = mirrorBilingual(points[id].en, points[id].ar)
      if (!text) {
        appToast.error(t("admin.website.aboutWhoIHelp.errors.pointRequired"))
        return
      }
      normalizedPoints.push({ id, text })
    }

    try {
      await saveMutation.mutateAsync({
        title: mirroredTitle,
        points: normalizedPoints,
        updatedBy: user?.displayName || user?.email || undefined,
      })
      appToast.success(t("admin.website.aboutWhoIHelp.toasts.saved"))
    } catch (err) {
      appToast.error(
        err instanceof Error
          ? err.message
          : t("admin.website.aboutWhoIHelp.toasts.error"),
      )
    }
  }

  return (
    <div className="flex flex-col gap-4 sm:gap-5">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 lg:gap-4">
        <StatCard
          label={t("admin.website.aboutWhoIHelp.stats.section")}
          value={t("admin.website.aboutWhoIHelp.stats.label")}
          icon={<LayoutTemplate className="size-4" strokeWidth={1.8} />}
        />
        <StatCard
          label={t("admin.website.aboutWhoIHelp.stats.points")}
          value={ABOUT_WHO_I_HELP_POINTS_MAX}
          icon={<Check className="size-4" strokeWidth={1.8} />}
        />
        <StatCard
          label={t("admin.website.aboutWhoIHelp.stats.title")}
          value={previewTitle || "—"}
          icon={<span className="text-[12px] font-extrabold">Aa</span>}
        />
      </div>

      {isError ? (
        <div className="flex min-h-40 flex-col items-center justify-center gap-3 rounded-[24px] bg-white px-4 py-10 text-center">
          <p className="text-sm font-medium text-[#8c8c8c]">
            {t("admin.website.aboutWhoIHelp.loadError")}
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
          {t("admin.website.aboutWhoIHelp.loading")}
        </div>
      ) : (
        <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
          <section className="rounded-[24px] bg-white p-4 sm:p-5">
            <p className="text-[12px] font-bold uppercase tracking-[0.12em] text-[#8c8c8c]">
              {t("admin.website.aboutWhoIHelp.preview")}
            </p>
            <div className="mt-4">
              <p className="font-heading text-[11px] font-extrabold uppercase tracking-[0.12em] text-[var(--gym-lime,#fb5001)]">
                {t("aboutPage.focus.eyebrow")}
              </p>
              <p className="mt-2 font-heading text-[24px] font-bold text-[var(--gym-ink,#111111)]">
                {previewTitle}
              </p>
              <ul className="mt-5 space-y-2.5">
                {ABOUT_WHO_I_HELP_POINT_IDS.map((id, index) => {
                  const text = resolveBilingualText(
                    points[id],
                    locale,
                    DEFAULT_ABOUT_WHO_I_HELP_COPY.points[id][locale],
                  )
                  return (
                    <li
                      key={id}
                      className="flex items-center gap-3 rounded-[16px] border border-black/[0.06] bg-[#fafafa] px-3.5 py-3"
                    >
                      <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-full bg-[var(--gym-dark,#24030c)] font-heading text-[12px] font-extrabold text-[var(--gym-lime,#fb5001)]">
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      <span className="text-[14px] font-semibold text-[var(--gym-ink,#111111)]">
                        {text}
                      </span>
                    </li>
                  )
                })}
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
                  {t("admin.website.aboutWhoIHelp.editorTitle")}
                </h2>
                <p className="mt-1 text-[13px] font-medium text-[#6B7280]">
                  {t("admin.website.aboutWhoIHelp.editorHint")}
                </p>
              </div>

              {renderBilingual({
                label: t("admin.website.aboutWhoIHelp.fields.title"),
                value: title,
                onChange: setTitle,
              })}

              <div className="space-y-3 border-t border-black/[0.06] pt-5">
                <h3 className="font-heading text-[16px] font-extrabold text-[var(--gym-ink,#111111)]">
                  {t("admin.website.aboutWhoIHelp.pointsTitle")}
                </h3>
                {ABOUT_WHO_I_HELP_POINT_IDS.map((id, index) => (
                  <div
                    key={id}
                    className="rounded-[18px] bg-[#F4F4F4] p-3.5 sm:p-4"
                  >
                    <span className="mb-3 inline-flex size-7 items-center justify-center rounded-full bg-[var(--gym-dark,#24030c)] text-[12px] font-bold text-[var(--gym-lime,#fb5001)]">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    {renderBilingual({
                      label: t("admin.website.aboutWhoIHelp.fields.point"),
                      value: points[id],
                      onChange: (next) =>
                        setPoints((prev) => ({ ...prev, [id]: next })),
                    })}
                  </div>
                ))}
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
                      ? t("admin.website.aboutWhoIHelp.saving")
                      : t("admin.website.aboutWhoIHelp.save")}
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
