import { useEffect, useId, useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { Check, LayoutTemplate, Pencil } from "lucide-react"
import { HowICoachCardDialog } from "@/components/dashboard/HowICoachCardDialog"
import { StatCard } from "@/components/dashboard/StatCard"
import { useAuth } from "@/features/auth/auth-context"
import {
  ABOUT_HOW_I_COACH_CARDS_MAX,
  ABOUT_HOW_I_COACH_CARD_IDS,
  DEFAULT_ABOUT_HOW_I_COACH_COPY,
  createDefaultAboutHowICoachContent,
  type SaveAboutHowICoachCardInput,
} from "@/features/website/aboutHowICoach"
import { mirrorBilingual } from "@/features/website/service"
import {
  useAboutHowICoachContentQuery,
  useSaveAboutHowICoachCardMutation,
  useSaveAboutHowICoachHeaderMutation,
} from "@/features/website/hooks"
import { useDocumentTitle } from "@/hooks/useDocumentTitle"
import { useLocale } from "@/hooks/useLocale"
import { resolveBilingualText } from "@/lib/program-text"
import { appToast } from "@/lib/toast"
import type { BilingualText } from "@/types/program"
import type {
  AboutHowICoachCard,
  AboutHowICoachCardId,
} from "@/types/website"

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

export function AboutHowICoachPage() {
  const { t } = useTranslation()
  const { locale, isRtl } = useLocale()
  const isAr = locale === "ar"
  const { user, hasPermission } = useAuth()
  const canManage = hasPermission("content:manage")
  useDocumentTitle(t("admin.website.sections.aboutHowICoach"))

  const {
    data: content,
    isLoading,
    isError,
    refetch,
  } = useAboutHowICoachContentQuery({ audience: "admin" })
  const saveHeaderMutation = useSaveAboutHowICoachHeaderMutation()
  const saveCardMutation = useSaveAboutHowICoachCardMutation()

  const formId = useId()
  const [title, setTitle] = useState<FieldPair>(EMPTY)
  const [subtitle, setSubtitle] = useState<FieldPair>(EMPTY)
  const [headerError, setHeaderError] = useState<string | null>(null)
  const [editingCardId, setEditingCardId] =
    useState<AboutHowICoachCardId | null>(null)

  const resolved = content ?? createDefaultAboutHowICoachContent()

  useEffect(() => {
    setTitle(toPair(content?.title, DEFAULT_ABOUT_HOW_I_COACH_COPY.title))
    setSubtitle(
      toPair(content?.subtitle, DEFAULT_ABOUT_HOW_I_COACH_COPY.subtitle),
    )
    setHeaderError(null)
  }, [content])

  const actionsBusy =
    saveHeaderMutation.isPending || saveCardMutation.isPending

  const editingCard = editingCardId
    ? resolved.cards.find((card) => card.id === editingCardId) ?? null
    : null
  const editingIndex = editingCardId
    ? ABOUT_HOW_I_COACH_CARD_IDS.indexOf(editingCardId)
    : -1

  const previewTitle = resolveBilingualText(
    { en: title.en, ar: title.ar },
    locale,
    DEFAULT_ABOUT_HOW_I_COACH_COPY.title[locale],
  )
  const previewSubtitle = resolveBilingualText(
    { en: subtitle.en, ar: subtitle.ar },
    locale,
    DEFAULT_ABOUT_HOW_I_COACH_COPY.subtitle[locale],
  )

  const inputClass =
    "h-11 w-full rounded-[16px] border border-black/10 bg-[#F7F7F7] px-3.5 text-[14px] font-medium text-[#111111] outline-none transition-colors focus:border-[#111111] focus:bg-white disabled:opacity-60"
  const textareaClass =
    "min-h-[96px] w-full resize-y rounded-[16px] border border-black/10 bg-[#F7F7F7] px-3.5 py-2.5 text-[14px] font-medium text-[#111111] outline-none transition-colors focus:border-[#111111] focus:bg-white disabled:opacity-60"

  async function handleSaveHeader(event: React.FormEvent) {
    event.preventDefault()
    if (!canManage || actionsBusy) return
    setHeaderError(null)
    const mirroredTitle = mirrorBilingual(title.en, title.ar)
    const mirroredSubtitle = mirrorBilingual(subtitle.en, subtitle.ar)
    if (!mirroredTitle || !mirroredSubtitle) {
      const message = t("admin.website.aboutHowICoach.errors.headerRequired")
      setHeaderError(message)
      appToast.error(message)
      return
    }
    try {
      await saveHeaderMutation.mutateAsync({
        title: mirroredTitle,
        subtitle: mirroredSubtitle,
        updatedBy: user?.displayName || user?.email || undefined,
      })
      appToast.success(t("admin.website.aboutHowICoach.toasts.headerSaved"))
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : t("admin.website.aboutHowICoach.toasts.error")
      setHeaderError(message)
      appToast.error(message)
    }
  }

  async function handleSaveCard(input: SaveAboutHowICoachCardInput) {
    await saveCardMutation.mutateAsync(input)
    appToast.success(t("admin.website.aboutHowICoach.toasts.cardSaved"))
  }

  const stats = useMemo(
    () => ({
      cards: ABOUT_HOW_I_COACH_CARDS_MAX,
      fields: 2,
    }),
    [],
  )

  return (
    <div className="flex flex-col gap-4 sm:gap-5">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 lg:gap-4">
        <StatCard
          label={t("admin.website.aboutHowICoach.stats.section")}
          value={t("admin.website.aboutHowICoach.stats.pillars")}
          icon={<LayoutTemplate className="size-4" strokeWidth={1.8} />}
        />
        <StatCard
          label={t("admin.website.aboutHowICoach.stats.cards")}
          value={stats.cards}
          icon={<Check className="size-4" strokeWidth={1.8} />}
        />
        <StatCard
          label={t("admin.website.aboutHowICoach.stats.headerFields")}
          value={stats.fields}
          icon={<Pencil className="size-4" strokeWidth={1.8} />}
        />
      </div>

      {isError ? (
        <div className="flex min-h-40 flex-col items-center justify-center gap-3 rounded-[24px] bg-white px-4 py-10 text-center">
          <p className="text-sm font-medium text-[#8c8c8c]">
            {t("admin.website.aboutHowICoach.loadError")}
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
          {t("admin.website.aboutHowICoach.loading")}
        </div>
      ) : (
        <>
          <section className="rounded-[24px] bg-white p-4 sm:p-6 lg:p-7">
            <div className="mb-5 flex flex-col gap-1.5 sm:mb-6">
              <h2 className="text-[18px] font-bold tracking-tight text-[var(--gym-ink,#111111)] sm:text-[20px]">
                {t("admin.website.aboutHowICoach.headerTitle")}
              </h2>
              <p className="max-w-[62ch] text-[13px] font-medium leading-relaxed text-[#6B7280] sm:text-[14px]">
                {t("admin.website.aboutHowICoach.headerHint")}
              </p>
            </div>

            <form
              id={formId}
              onSubmit={handleSaveHeader}
              dir={isRtl ? "rtl" : "ltr"}
              className="space-y-4"
            >
              <div className="grid grid-cols-1 gap-3.5 md:grid-cols-2">
                <label className="flex flex-col gap-1.5">
                  <span className="text-[12px] font-bold text-[#374151]">
                    {t("admin.website.aboutHowICoach.fields.title")} (
                    {isAr ? "عربي" : "Arabic"})
                  </span>
                  <input
                    dir="rtl"
                    value={title.ar}
                    disabled={!canManage || actionsBusy}
                    onChange={(e) =>
                      setTitle((prev) => ({ ...prev, ar: e.target.value }))
                    }
                    className={inputClass}
                    style={{ fontFamily: "var(--font-arabic)" }}
                  />
                </label>
                <label className="flex flex-col gap-1.5">
                  <span className="text-[12px] font-bold text-[#374151]">
                    {t("admin.website.aboutHowICoach.fields.title")} (
                    {isAr ? "إنجليزي" : "English"})
                  </span>
                  <input
                    dir="ltr"
                    value={title.en}
                    disabled={!canManage || actionsBusy}
                    onChange={(e) =>
                      setTitle((prev) => ({ ...prev, en: e.target.value }))
                    }
                    className={inputClass}
                  />
                </label>
              </div>

              <div className="grid grid-cols-1 gap-3.5 md:grid-cols-2">
                <label className="flex flex-col gap-1.5">
                  <span className="text-[12px] font-bold text-[#374151]">
                    {t("admin.website.aboutHowICoach.fields.subtitle")} (
                    {isAr ? "عربي" : "Arabic"})
                  </span>
                  <textarea
                    dir="rtl"
                    value={subtitle.ar}
                    disabled={!canManage || actionsBusy}
                    onChange={(e) =>
                      setSubtitle((prev) => ({ ...prev, ar: e.target.value }))
                    }
                    className={textareaClass}
                    style={{ fontFamily: "var(--font-arabic)" }}
                  />
                </label>
                <label className="flex flex-col gap-1.5">
                  <span className="text-[12px] font-bold text-[#374151]">
                    {t("admin.website.aboutHowICoach.fields.subtitle")} (
                    {isAr ? "إنجليزي" : "English"})
                  </span>
                  <textarea
                    dir="ltr"
                    value={subtitle.en}
                    disabled={!canManage || actionsBusy}
                    onChange={(e) =>
                      setSubtitle((prev) => ({ ...prev, en: e.target.value }))
                    }
                    className={textareaClass}
                  />
                </label>
              </div>

              {headerError ? (
                <div
                  role="alert"
                  className="rounded-[16px] bg-rose-50 px-4 py-3 text-[13px] font-semibold text-rose-700"
                >
                  {headerError}
                </div>
              ) : null}

              {canManage ? (
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={actionsBusy}
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-[var(--gym-ink,#111111)] px-5 text-[13px] font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
                  >
                    <Check className="size-4" strokeWidth={2.4} />
                    {saveHeaderMutation.isPending
                      ? t("admin.website.aboutHowICoach.saving")
                      : t("admin.website.aboutHowICoach.saveHeader")}
                  </button>
                </div>
              ) : null}
            </form>
          </section>

          <section className="rounded-[24px] bg-white p-4 sm:p-6 lg:p-7">
            <div className="mb-5 flex flex-col gap-1.5 sm:mb-6">
              <h2 className="text-[18px] font-bold tracking-tight text-[var(--gym-ink,#111111)] sm:text-[20px]">
                {t("admin.website.aboutHowICoach.cardsTitle")}
              </h2>
              <p className="max-w-[62ch] text-[13px] font-medium leading-relaxed text-[#6B7280] sm:text-[14px]">
                {t("admin.website.aboutHowICoach.cardsHint")}
              </p>
            </div>

            <div className="mb-5 overflow-hidden rounded-[20px] bg-[var(--gym-dark,#24030c)] p-5 text-white">
              <p className="text-[11px] font-extrabold uppercase tracking-[0.12em] text-[var(--gym-lime,#fb5001)]">
                {t("aboutPage.pillars.eyebrow")}
              </p>
              <p className="mt-3 font-heading text-[22px] font-bold leading-snug sm:text-[26px]">
                {previewTitle}
              </p>
              <p className="mt-2 max-w-[42ch] text-[13px] leading-relaxed text-white/70">
                {previewSubtitle}
              </p>
            </div>

            <ul className="grid grid-cols-1 gap-4 md:grid-cols-3">
              {resolved.cards.map((card, index) => (
                <li key={card.id}>
                  <HowICoachAdminCard
                    card={card}
                    index={index}
                    locale={locale}
                    canManage={canManage}
                    actionsBusy={actionsBusy}
                    onEdit={() => setEditingCardId(card.id)}
                  />
                </li>
              ))}
            </ul>
          </section>
        </>
      )}

      {editingCard && editingCardId ? (
        <HowICoachCardDialog
          open
          cardId={editingCardId}
          cardIndex={Math.max(0, editingIndex)}
          initialCard={editingCard}
          busy={saveCardMutation.isPending}
          adminName={user?.displayName || user?.email || undefined}
          onClose={() => {
            if (saveCardMutation.isPending) return
            setEditingCardId(null)
          }}
          onSave={handleSaveCard}
        />
      ) : null}
    </div>
  )
}

function HowICoachAdminCard({
  card,
  index,
  locale,
  canManage,
  actionsBusy,
  onEdit,
}: {
  card: AboutHowICoachCard
  index: number
  locale: "en" | "ar"
  canManage: boolean
  actionsBusy: boolean
  onEdit: () => void
}) {
  const { t } = useTranslation()
  const title = resolveBilingualText(
    card.title,
    locale,
    t("admin.website.aboutHowICoach.untitled"),
  )
  const body = resolveBilingualText(card.body, locale)

  return (
    <article className="flex h-full flex-col overflow-hidden rounded-[20px] border border-black/[0.06] bg-[var(--gym-dark,#24030c)] text-white shadow-[0_8px_24px_rgba(36,3,12,0.18)]">
      <div className="flex flex-1 flex-col p-5">
        <span className="font-heading text-[48px] font-extrabold leading-none text-[var(--gym-lime,#fb5001)]/30">
          {String(index + 1).padStart(2, "0")}
        </span>
        <h3 className="mt-4 line-clamp-2 font-heading text-[18px] font-bold leading-snug">
          {title}
        </h3>
        {body ? (
          <p className="mt-3 line-clamp-5 text-[13px] leading-relaxed text-white/65">
            {body}
          </p>
        ) : null}
      </div>
      {canManage ? (
        <div className="border-t border-white/10 px-4 py-2.5">
          <button
            type="button"
            disabled={actionsBusy}
            onClick={onEdit}
            className="inline-flex h-8 items-center gap-1.5 rounded-full bg-white px-2.5 text-[11px] font-bold text-[var(--gym-ink,#111111)] transition hover:opacity-90 disabled:opacity-60"
          >
            <Pencil className="size-3.5" />
            {t("admin.website.aboutHowICoach.edit")}
          </button>
        </div>
      ) : null}
    </article>
  )
}
