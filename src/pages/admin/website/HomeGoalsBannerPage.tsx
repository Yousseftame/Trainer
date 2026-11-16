import { useEffect, useId, useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import {
  Check,
  CircleCheck,
  ImageOff,
  LayoutTemplate,
  Pencil,
  Trash2,
} from "lucide-react"
import { ConfirmActionDialog } from "@/components/dashboard/ConfirmActionDialog"
import { GoalsBannerTabDialog } from "@/components/dashboard/GoalsBannerTabDialog"
import { StatCard } from "@/components/dashboard/StatCard"
import { useAuth } from "@/features/auth/auth-context"
import {
  DEFAULT_GOALS_BANNER_COPY,
  GOALS_BANNER_TAB_IDS,
  createDefaultGoalsBannerContent,
  type SaveGoalsBannerTabInput,
} from "@/features/website/goalsBanner"
import { isRenderableImageSrc } from "@/features/website/paths"
import { mirrorBilingual } from "@/features/website/service"
import {
  useClearGoalsBannerTabImageMutation,
  useGoalsBannerContentQuery,
  useSaveGoalsBannerTabMutation,
  useSaveGoalsBannerTitleMutation,
} from "@/features/website/hooks"
import { useDocumentTitle } from "@/hooks/useDocumentTitle"
import { useLocale } from "@/hooks/useLocale"
import { resolveBilingualText } from "@/lib/program-text"
import { appToast } from "@/lib/toast"
import { cn } from "@/lib/utils"
import type { BilingualText } from "@/types/program"
import type {
  GoalsBannerTab,
  GoalsBannerTabId,
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

export function HomeGoalsBannerPage() {
  const { t } = useTranslation()
  const { locale, isRtl } = useLocale()
  const isAr = locale === "ar"
  const { user, hasPermission } = useAuth()
  const canManage = hasPermission("content:manage")
  useDocumentTitle(t("admin.website.sections.homeGoalsBanner"))

  const {
    data: content,
    isLoading,
    isError,
    refetch,
  } = useGoalsBannerContentQuery({ audience: "admin" })
  const saveTitleMutation = useSaveGoalsBannerTitleMutation()
  const saveTabMutation = useSaveGoalsBannerTabMutation()
  const clearImageMutation = useClearGoalsBannerTabImageMutation()

  const formId = useId()
  const [sectionTitle, setSectionTitle] = useState<FieldPair>(EMPTY)
  const [titleError, setTitleError] = useState<string | null>(null)
  const [editingTabId, setEditingTabId] = useState<GoalsBannerTabId | null>(
    null,
  )
  const [clearImageTab, setClearImageTab] = useState<GoalsBannerTab | null>(
    null,
  )

  const resolved = content ?? createDefaultGoalsBannerContent()

  useEffect(() => {
    setSectionTitle(toPair(content?.title, DEFAULT_GOALS_BANNER_COPY.title))
    setTitleError(null)
  }, [content])

  const actionsBusy =
    saveTitleMutation.isPending ||
    saveTabMutation.isPending ||
    clearImageMutation.isPending

  const stats = useMemo(() => {
    const tabs = resolved.tabs
    const withImage = tabs.filter((tab) =>
      isRenderableImageSrc(tab.imageUrl),
    ).length
    return {
      tabs: GOALS_BANNER_TAB_IDS.length,
      images: withImage,
      missing: GOALS_BANNER_TAB_IDS.length - withImage,
    }
  }, [resolved.tabs])

  const editingTab = editingTabId
    ? resolved.tabs.find((tab) => tab.id === editingTabId) ?? null
    : null
  const editingIndex = editingTabId
    ? GOALS_BANNER_TAB_IDS.indexOf(editingTabId)
    : -1

  const inputClass =
    "h-11 w-full rounded-[16px] border border-black/10 bg-[#F7F7F7] px-3.5 text-[14px] font-medium text-[#111111] outline-none transition-colors focus:border-[#111111] focus:bg-white disabled:opacity-60"

  async function handleSaveTitle(event: React.FormEvent) {
    event.preventDefault()
    if (!canManage || actionsBusy) return
    setTitleError(null)
    const mirrored = mirrorBilingual(sectionTitle.en, sectionTitle.ar)
    if (!mirrored) {
      const message = t("admin.website.goalsBanner.errors.titleRequired")
      setTitleError(message)
      appToast.error(message)
      return
    }
    try {
      await saveTitleMutation.mutateAsync({
        title: mirrored,
        updatedBy: user?.displayName || user?.email || undefined,
      })
      appToast.success(t("admin.website.goalsBanner.toasts.titleSaved"))
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : t("admin.website.goalsBanner.toasts.error")
      setTitleError(message)
      appToast.error(message)
    }
  }

  async function handleSaveTab(input: SaveGoalsBannerTabInput) {
    await saveTabMutation.mutateAsync(input)
    appToast.success(t("admin.website.goalsBanner.toasts.tabSaved"))
  }

  return (
    <div className="flex flex-col gap-4 sm:gap-5">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 lg:gap-4">
        <StatCard
          label={t("admin.website.goalsBanner.stats.tabs")}
          value={stats.tabs}
          icon={<LayoutTemplate className="size-4" strokeWidth={1.8} />}
        />
        <StatCard
          label={t("admin.website.goalsBanner.stats.images")}
          value={stats.images}
          icon={<CircleCheck className="size-4" strokeWidth={1.8} />}
        />
        <StatCard
          label={t("admin.website.goalsBanner.stats.defaultImages")}
          value={stats.missing}
          icon={<ImageOff className="size-4" strokeWidth={1.8} />}
        />
      </div>

      <section className="rounded-[24px] bg-white p-4 sm:p-6 lg:p-7">
        <div className="mb-5 flex flex-col gap-1.5 sm:mb-6">
          <h2 className="text-[18px] font-bold tracking-tight text-[var(--gym-ink,#111111)] sm:text-[20px]">
            {t("admin.website.goalsBanner.sectionTitle")}
          </h2>
          <p className="max-w-[62ch] text-[13px] font-medium leading-relaxed text-[#6B7280] sm:text-[14px]">
            {t("admin.website.goalsBanner.sectionHint")}
          </p>
        </div>

        {isError ? (
          <div className="flex min-h-32 flex-col items-center justify-center gap-3 rounded-[20px] bg-[#F4F4F4] px-4 py-10 text-center">
            <p className="text-sm font-medium text-[#8c8c8c]">
              {t("admin.website.goalsBanner.loadError")}
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
          <div className="flex min-h-32 items-center justify-center rounded-[20px] bg-[#F4F4F4] px-4 py-10 text-sm font-medium text-[#8c8c8c]">
            {t("admin.website.goalsBanner.loading")}
          </div>
        ) : (
          <form
            id={formId}
            onSubmit={handleSaveTitle}
            dir={isRtl ? "rtl" : "ltr"}
            className="space-y-4"
          >
            <div className="grid grid-cols-1 gap-3.5 md:grid-cols-2">
              <label className="flex flex-col gap-1.5">
                <span className="text-[12px] font-bold text-[#374151]">
                  {t("admin.website.goalsBanner.fields.sectionTitle")} (
                  {isAr ? "عربي" : "Arabic"})
                </span>
                <input
                  dir="rtl"
                  value={sectionTitle.ar}
                  disabled={!canManage || actionsBusy}
                  onChange={(e) =>
                    setSectionTitle((prev) => ({ ...prev, ar: e.target.value }))
                  }
                  className={inputClass}
                  style={{ fontFamily: "var(--font-arabic)" }}
                />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="text-[12px] font-bold text-[#374151]">
                  {t("admin.website.goalsBanner.fields.sectionTitle")} (
                  {isAr ? "إنجليزي" : "English"})
                </span>
                <input
                  dir="ltr"
                  value={sectionTitle.en}
                  disabled={!canManage || actionsBusy}
                  onChange={(e) =>
                    setSectionTitle((prev) => ({ ...prev, en: e.target.value }))
                  }
                  className={inputClass}
                />
              </label>
            </div>

            {titleError ? (
              <div
                role="alert"
                className="rounded-[16px] bg-rose-50 px-4 py-3 text-[13px] font-semibold text-rose-700"
              >
                {titleError}
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
                  {saveTitleMutation.isPending
                    ? t("admin.website.goalsBanner.saving")
                    : t("admin.website.goalsBanner.saveTitle")}
                </button>
              </div>
            ) : null}
          </form>
        )}
      </section>

      <section className="rounded-[24px] bg-white p-4 sm:p-6 lg:p-7">
        <div className="mb-5 flex flex-col gap-1.5 sm:mb-6">
          <h2 className="text-[18px] font-bold tracking-tight text-[var(--gym-ink,#111111)] sm:text-[20px]">
            {t("admin.website.goalsBanner.tabsTitle")}
          </h2>
          <p className="max-w-[62ch] text-[13px] font-medium leading-relaxed text-[#6B7280] sm:text-[14px]">
            {t("admin.website.goalsBanner.tabsHint")}
          </p>
        </div>

        {isError || isLoading ? null : (
          <ul className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {resolved.tabs.map((tab, index) => (
              <li key={tab.id}>
                <GoalsTabCard
                  tab={tab}
                  index={index}
                  locale={locale}
                  canManage={canManage}
                  actionsBusy={actionsBusy}
                  onEdit={() => setEditingTabId(tab.id)}
                  onClearImage={() => setClearImageTab(tab)}
                />
              </li>
            ))}
          </ul>
        )}
      </section>

      {editingTab && editingTabId ? (
        <GoalsBannerTabDialog
          open
          tabId={editingTabId}
          tabIndex={Math.max(0, editingIndex)}
          initialTab={editingTab}
          busy={saveTabMutation.isPending}
          adminName={user?.displayName || user?.email || undefined}
          onClose={() => {
            if (saveTabMutation.isPending) return
            setEditingTabId(null)
          }}
          onSave={handleSaveTab}
        />
      ) : null}

      <ConfirmActionDialog
        open={Boolean(clearImageTab)}
        title={t("admin.website.goalsBanner.clearImageTitle")}
        description={t("admin.website.goalsBanner.clearImageDescription")}
        tone="danger"
        confirmLabel={t("admin.website.goalsBanner.removeImage")}
        onCancel={() => setClearImageTab(null)}
        onConfirm={async () => {
          if (!clearImageTab) return
          try {
            await clearImageMutation.mutateAsync({
              tabId: clearImageTab.id,
              updatedBy: user?.displayName || user?.email || undefined,
            })
            appToast.success(t("admin.website.goalsBanner.toasts.imageRemoved"))
            setClearImageTab(null)
          } catch (err) {
            appToast.error(
              err instanceof Error
                ? err.message
                : t("admin.website.goalsBanner.toasts.error"),
            )
            throw err
          }
        }}
      />
    </div>
  )
}

function GoalsTabCard({
  tab,
  index,
  locale,
  canManage,
  actionsBusy,
  onEdit,
  onClearImage,
}: {
  tab: GoalsBannerTab
  index: number
  locale: "en" | "ar"
  canManage: boolean
  actionsBusy: boolean
  onEdit: () => void
  onClearImage: () => void
}) {
  const { t } = useTranslation()
  const hasImage = isRenderableImageSrc(tab.imageUrl)
  const tabLabel = resolveBilingualText(tab.tabLabel, locale)
  const title = resolveBilingualText(
    tab.title,
    locale,
    t("admin.website.goalsBanner.untitled"),
  )
  const description = resolveBilingualText(tab.description, locale)
  const cta = resolveBilingualText(tab.cta, locale)

  return (
    <article className="flex h-full flex-col overflow-hidden rounded-[20px] border border-black/[0.06] bg-[#F7F7F7] shadow-[0_8px_24px_rgba(0,0,0,0.04)]">
      <div className="flex items-center justify-between gap-2 px-4 pt-4">
        <span className="inline-flex size-8 items-center justify-center rounded-full bg-black/80 text-[13px] font-bold text-white">
          {index + 1}
        </span>
        <span
          className={cn(
            "inline-flex h-7 items-center rounded-full px-2.5 text-[11px] font-bold sm:text-[12px]",
            hasImage
              ? "bg-[var(--gym-lime,#fb5001)] text-white"
              : "bg-black/10 text-[#374151]",
          )}
        >
          {hasImage
            ? t("admin.website.goalsBanner.status.imageSet")
            : t("admin.website.goalsBanner.status.defaultImage")}
        </span>
      </div>

      <div className="grid flex-1 grid-cols-1 gap-3 p-4 sm:grid-cols-[minmax(0,1fr)_140px] sm:items-start">
        <div className="min-w-0">
          <p className="text-[11px] font-bold uppercase tracking-wide text-[#8c8c8c]">
            {t("admin.website.goalsBanner.tabLabel", { n: index + 1 })}
          </p>
          <span className="mt-2 inline-flex rounded-full border border-[var(--gym-lime,#fb5001)]/50 bg-white px-2.5 py-1 text-[12px] font-semibold text-[var(--gym-ink,#111111)]">
            {tabLabel}
          </span>
          <h3 className="mt-3 line-clamp-2 font-heading text-[16px] font-bold leading-snug text-[var(--gym-ink,#111111)]">
            {title}
          </h3>
          {description ? (
            <p className="mt-2 line-clamp-3 text-[13px] leading-relaxed text-[#1e2222]">
              {description}
            </p>
          ) : null}
          <p className="mt-3 text-[12px] font-bold uppercase tracking-wide text-[var(--gym-lime,#fb5001)]">
            {cta} → #contact
          </p>
        </div>

        <div className="aspect-[4/3] overflow-hidden rounded-[16px] border border-black/5 bg-white">
          {hasImage ? (
            <img
              src={tab.imageUrl}
              alt=""
              className="size-full object-contain object-center"
              draggable={false}
            />
          ) : (
            <div className="flex size-full items-center justify-center text-[#8c8c8c]">
              <ImageOff className="size-7" strokeWidth={1.4} />
            </div>
          )}
        </div>
      </div>

      {canManage ? (
        <div className="flex flex-wrap items-center gap-1.5 border-t border-black/5 bg-white/80 px-3 py-2.5 backdrop-blur-sm sm:gap-2 sm:px-3.5">
          <button
            type="button"
            disabled={actionsBusy}
            onClick={onEdit}
            className="inline-flex h-8 items-center gap-1.5 rounded-full bg-[var(--gym-ink,#111111)] px-2.5 text-[11px] font-bold text-white transition hover:opacity-90 disabled:opacity-60"
          >
            <Pencil className="size-3.5" />
            {t("admin.website.goalsBanner.edit")}
          </button>
          {hasImage ? (
            <button
              type="button"
              disabled={actionsBusy}
              onClick={onClearImage}
              className="ms-auto inline-flex h-8 items-center gap-1.5 rounded-full bg-[#FFE8E4] px-2.5 text-[11px] font-bold text-[#C44536] transition hover:bg-[#ffd8d1] disabled:opacity-60"
            >
              <Trash2 className="size-3.5" />
              {t("admin.website.goalsBanner.removeImage")}
            </button>
          ) : null}
        </div>
      ) : null}
    </article>
  )
}
