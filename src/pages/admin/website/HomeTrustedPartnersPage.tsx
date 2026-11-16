import { useEffect, useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import {
  ArrowDown,
  ArrowUp,
  Check,
  CircleCheck,
  Eye,
  EyeOff,
  Hash,
  ImageOff,
  Images,
  Pencil,
  Plus,
  Search,
  Trash2,
} from "lucide-react"
import { ConfirmActionDialog } from "@/components/dashboard/ConfirmActionDialog"
import { FilterChip, StatCard } from "@/components/dashboard/StatCard"
import { TrustedPartnerLogoDialog } from "@/components/dashboard/TrustedPartnerLogoDialog"
import { useAuth } from "@/features/auth/auth-context"
import {
  DEFAULT_COACHES_COUNT,
  useDeleteTrustedPartnerLogoMutation,
  useReorderTrustedPartnerLogosMutation,
  useSaveTrustedPartnerLogoMutation,
  useSaveTrustedPartnersSettingsMutation,
  useSetTrustedPartnerLogoEnabledMutation,
  useTrustedPartnerLogosQuery,
  useTrustedPartnersSettingsQuery,
  type SaveTrustedPartnerLogoInput,
} from "@/features/website"
import { useDocumentTitle } from "@/hooks/useDocumentTitle"
import { useLocale } from "@/hooks/useLocale"
import { resolveBilingualText } from "@/lib/program-text"
import { appToast } from "@/lib/toast"
import { cn } from "@/lib/utils"
import type { TrustedPartnerLogo } from "@/types/website"

type Visibility = "all" | "live" | "hidden"

export function HomeTrustedPartnersPage() {
  const { t } = useTranslation()
  const { locale } = useLocale()
  const { user, hasPermission } = useAuth()
  const canManage = hasPermission("content:manage")
  useDocumentTitle(t("admin.website.sections.homeTrustedPartners"))

  const {
    data: settings,
    isLoading: settingsLoading,
    isError: settingsError,
    refetch: refetchSettings,
  } = useTrustedPartnersSettingsQuery()
  const {
    data: allLogos = [],
    isLoading: logosLoading,
    isError: logosError,
    refetch: refetchLogos,
  } = useTrustedPartnerLogosQuery({ audience: "admin" })

  const saveSettingsMutation = useSaveTrustedPartnersSettingsMutation()
  const saveLogoMutation = useSaveTrustedPartnerLogoMutation()
  const enabledMutation = useSetTrustedPartnerLogoEnabledMutation()
  const reorderMutation = useReorderTrustedPartnerLogosMutation()
  const deleteMutation = useDeleteTrustedPartnerLogoMutation()

  const [coachesCount, setCoachesCount] = useState(DEFAULT_COACHES_COUNT.en)
  const [query, setQuery] = useState("")
  const [visibility, setVisibility] = useState<Visibility>("all")
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<TrustedPartnerLogo | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<TrustedPartnerLogo | null>(
    null,
  )

  useEffect(() => {
    if (!settings) return
    setCoachesCount(
      settings.coachesCount.en ||
        settings.coachesCount.ar ||
        DEFAULT_COACHES_COUNT.en,
    )
  }, [settings])

  const actionsBusy =
    saveSettingsMutation.isPending ||
    saveLogoMutation.isPending ||
    enabledMutation.isPending ||
    reorderMutation.isPending ||
    deleteMutation.isPending

  const stats = useMemo(() => {
    const total = allLogos.length
    const live = allLogos.filter((l) => l.enabled).length
    return {
      total,
      live,
      hidden: total - live,
      countPreview: resolveBilingualText(
        settings?.coachesCount ?? DEFAULT_COACHES_COUNT,
        locale,
      ),
    }
  }, [allLogos, locale, settings])

  const logos = useMemo(() => {
    const q = query.trim().toLowerCase()
    return allLogos.filter((logo) => {
      if (visibility === "live" && !logo.enabled) return false
      if (visibility === "hidden" && logo.enabled) return false
      if (!q) return true
      return `${logo.name.en} ${logo.name.ar}`.toLowerCase().includes(q)
    })
  }, [allLogos, query, visibility])

  async function handleSaveCount() {
    if (!canManage || actionsBusy) return
    const value = coachesCount.trim()
    if (!value) {
      appToast.error(t("admin.website.trustedPartners.errors.countRequired"))
      return
    }
    try {
      await saveSettingsMutation.mutateAsync({
        coachesCount: { en: value, ar: value },
        updatedBy: user?.displayName || user?.email || undefined,
      })
      appToast.success(t("admin.website.trustedPartners.toasts.countSaved"))
    } catch (err) {
      appToast.error(
        err instanceof Error
          ? err.message
          : t("admin.website.trustedPartners.toasts.error"),
      )
    }
  }

  async function handleSaveLogo(input: SaveTrustedPartnerLogoInput) {
    await saveLogoMutation.mutateAsync(input)
    appToast.success(t("admin.website.trustedPartners.toasts.logoSaved"))
  }

  async function handleToggle(logo: TrustedPartnerLogo) {
    if (!canManage || actionsBusy) return
    try {
      await enabledMutation.mutateAsync({
        id: logo.id,
        enabled: !logo.enabled,
        updatedBy: user?.displayName || user?.email || undefined,
      })
      appToast.success(
        logo.enabled
          ? t("admin.website.trustedPartners.toasts.hidden")
          : t("admin.website.trustedPartners.toasts.shown"),
      )
    } catch (err) {
      appToast.error(
        err instanceof Error
          ? err.message
          : t("admin.website.trustedPartners.toasts.error"),
      )
    }
  }

  async function handleMove(logoId: string, direction: -1 | 1) {
    if (!canManage || actionsBusy) return
    const index = allLogos.findIndex((l) => l.id === logoId)
    const next = index + direction
    if (index < 0 || next < 0 || next >= allLogos.length) return
    const ordered = allLogos.map((l) => l.id)
    ;[ordered[index], ordered[next]] = [ordered[next], ordered[index]]
    try {
      await reorderMutation.mutateAsync({
        orderedIds: ordered,
        updatedBy: user?.displayName || user?.email || undefined,
      })
    } catch (err) {
      appToast.error(
        err instanceof Error
          ? err.message
          : t("admin.website.trustedPartners.toasts.error"),
      )
    }
  }

  const isLoading = settingsLoading || logosLoading
  const isError = settingsError || logosError
  const inputClass =
    "h-11 w-full rounded-[16px] border border-black/10 bg-[#F7F7F7] px-3.5 text-[14px] font-medium text-[var(--gym-ink,#111111)] outline-none transition-colors focus:border-[#111111] focus:bg-white disabled:opacity-60"

  return (
    <div className="flex flex-col gap-4 sm:gap-5">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
        <StatCard
          label={t("admin.website.trustedPartners.stats.logos")}
          value={stats.total}
          icon={<Images className="size-4" strokeWidth={1.8} />}
        />
        <StatCard
          label={t("admin.website.trustedPartners.stats.live")}
          value={stats.live}
          icon={<CircleCheck className="size-4" strokeWidth={1.8} />}
        />
        <StatCard
          label={t("admin.website.trustedPartners.stats.hidden")}
          value={stats.hidden}
          icon={<EyeOff className="size-4" strokeWidth={1.8} />}
        />
        <StatCard
          label={t("admin.website.trustedPartners.stats.count")}
          value={stats.countPreview || "—"}
          icon={<Hash className="size-4" strokeWidth={1.8} />}
        />
      </div>

      {/* Coaches count */}
      <section className="rounded-[24px] bg-white p-4 sm:p-6 lg:p-7">
        <div>
          <h2 className="font-heading text-[18px] font-extrabold tracking-tight text-[var(--gym-ink,#111111)] sm:text-[20px]">
            {t("admin.website.trustedPartners.countTitle")}
          </h2>
          <p className="mt-1 text-[13px] font-medium text-[#6B7280]">
            {t("admin.website.trustedPartners.countHint")}
          </p>
        </div>

        <label className="mt-4 flex max-w-md flex-col gap-1.5">
          <span className="text-[12px] font-bold text-[#374151]">
            {t("admin.website.trustedPartners.fields.count")}
          </span>
          <input
            dir="ltr"
            value={coachesCount}
            disabled={!canManage || actionsBusy}
            onChange={(e) => setCoachesCount(e.target.value)}
            placeholder="380,000"
            className={inputClass}
          />
        </label>

        {canManage ? (
          <div className="mt-4 flex justify-end">
            <button
              type="button"
              disabled={actionsBusy}
              onClick={() => void handleSaveCount()}
              className="inline-flex h-11 items-center gap-2 rounded-full bg-[var(--gym-ink,#111111)] px-5 text-[13px] font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
            >
              <Check className="size-4" strokeWidth={2.4} />
              {saveSettingsMutation.isPending
                ? t("admin.website.trustedPartners.saving")
                : t("admin.website.trustedPartners.saveCount")}
            </button>
          </div>
        ) : null}
      </section>

      {/* Logos gallery */}
      <section className="rounded-[24px] bg-white p-4 sm:p-6 lg:p-7">
        <div className="flex flex-col gap-3.5">
          <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
            <label className="relative w-full sm:max-w-[340px]">
              <Search className="pointer-events-none absolute start-3.5 top-1/2 size-4 -translate-y-1/2 text-[#8c8c8c]" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t("admin.website.trustedPartners.search")}
                className="h-11 w-full rounded-full bg-[#F4F4F4] pe-4 ps-10 text-[14px] font-medium text-[var(--gym-ink,#111111)] outline-none placeholder:font-normal placeholder:text-[#8c8c8c]"
              />
            </label>
            {canManage ? (
              <button
                type="button"
                disabled={actionsBusy}
                onClick={() => {
                  setEditing(null)
                  setFormOpen(true)
                }}
                className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-full bg-[var(--gym-ink,#111111)] px-5 text-[13px] font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
              >
                <Plus className="size-4" strokeWidth={2} />
                {t("admin.website.trustedPartners.addLogo")}
              </button>
            ) : null}
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 pt-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {(["all", "live", "hidden"] as const).map((item) => (
              <FilterChip
                key={item}
                active={visibility === item}
                onClick={() => setVisibility(item)}
              >
                {item === "all"
                  ? t("admin.common.all")
                  : t(`admin.website.trustedPartners.filter.${item}`)}
              </FilterChip>
            ))}
          </div>
        </div>

        {isError ? (
          <div className="mt-5 flex min-h-40 flex-col items-center justify-center gap-3 rounded-[20px] bg-[#F4F4F4] px-4 py-10 text-center">
            <p className="text-sm font-medium text-[#8c8c8c]">
              {t("admin.website.trustedPartners.loadError")}
            </p>
            <button
              type="button"
              onClick={() => {
                void refetchSettings()
                void refetchLogos()
              }}
              className="inline-flex h-10 items-center justify-center rounded-full bg-[var(--gym-ink,#111111)] px-5 text-[13px] font-bold text-white"
            >
              {t("admin.common.retry")}
            </button>
          </div>
        ) : isLoading ? (
          <div className="mt-5 flex min-h-40 items-center justify-center rounded-[20px] bg-[#F4F4F4] px-4 py-10 text-sm font-medium text-[#8c8c8c]">
            {t("admin.website.trustedPartners.loading")}
          </div>
        ) : logos.length === 0 ? (
          <div className="mt-5 flex min-h-40 flex-col items-center justify-center gap-3 rounded-[20px] bg-[#F4F4F4] px-4 py-10 text-center">
            <p className="text-sm font-medium text-[#8c8c8c]">
              {allLogos.length === 0
                ? t("admin.website.trustedPartners.emptyDescription")
                : t("admin.website.trustedPartners.emptyFiltered")}
            </p>
            {canManage && allLogos.length === 0 ? (
              <button
                type="button"
                onClick={() => {
                  setEditing(null)
                  setFormOpen(true)
                }}
                className="inline-flex h-10 items-center gap-2 rounded-full bg-[var(--gym-ink,#111111)] px-4 text-[12px] font-bold text-white"
              >
                <Plus className="size-3.5" />
                {t("admin.website.trustedPartners.addLogo")}
              </button>
            ) : null}
          </div>
        ) : (
          <ul className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {logos.map((logo) => {
              const globalIndex = allLogos.findIndex((l) => l.id === logo.id)
              const name = resolveBilingualText(logo.name, locale)
              return (
                <li key={logo.id}>
                  <article
                    className={cn(
                      "flex h-full flex-col overflow-hidden rounded-[22px] bg-[#F4F4F4] sm:rounded-[24px]",
                      !logo.enabled && "opacity-75",
                    )}
                  >
                    <div className="relative flex min-h-[120px] items-center justify-center bg-white px-6 py-8">
                      {logo.imageUrl ? (
                        <img
                          src={logo.imageUrl}
                          alt={name || ""}
                          className="max-h-12 w-auto max-w-full object-contain opacity-70 sm:max-h-14"
                        />
                      ) : (
                        <ImageOff className="size-8 text-[#8c8c8c]" />
                      )}
                      <span className="absolute start-3 top-3 inline-flex size-7 items-center justify-center rounded-full bg-[var(--gym-ink,#111111)] text-[12px] font-bold text-white">
                        {globalIndex + 1}
                      </span>
                      <span
                        className={cn(
                          "absolute end-3 top-3 inline-flex h-7 items-center rounded-full px-2.5 text-[11px] font-bold sm:text-[12px]",
                          logo.enabled
                            ? "bg-[var(--gym-lime,#fb5001)]/35 text-[var(--gym-ink,#111111)]"
                            : "bg-[#EEEEEE] text-[#6B7280]",
                        )}
                      >
                        {logo.enabled
                          ? t("admin.website.trustedPartners.status.live")
                          : t("admin.website.trustedPartners.status.hidden")}
                      </span>
                    </div>

                    <div className="flex flex-1 flex-col justify-between gap-3 p-4">
                      <p className="truncate text-[14px] font-bold text-[var(--gym-ink,#111111)]">
                        {name || t("admin.website.trustedPartners.unnamed")}
                      </p>

                      {canManage ? (
                        <div className="flex flex-wrap items-center gap-1.5">
                          <button
                            type="button"
                            disabled={
                              globalIndex <= 0 || reorderMutation.isPending
                            }
                            onClick={() => void handleMove(logo.id, -1)}
                            className="flex size-9 items-center justify-center rounded-full bg-white text-[var(--gym-ink,#111111)] shadow-sm transition hover:bg-black/5 disabled:opacity-40"
                            aria-label={t(
                              "admin.website.trustedPartners.moveUp",
                            )}
                          >
                            <ArrowUp className="size-4" />
                          </button>
                          <button
                            type="button"
                            disabled={
                              globalIndex < 0 ||
                              globalIndex >= allLogos.length - 1 ||
                              reorderMutation.isPending
                            }
                            onClick={() => void handleMove(logo.id, 1)}
                            className="flex size-9 items-center justify-center rounded-full bg-white text-[var(--gym-ink,#111111)] shadow-sm transition hover:bg-black/5 disabled:opacity-40"
                            aria-label={t(
                              "admin.website.trustedPartners.moveDown",
                            )}
                          >
                            <ArrowDown className="size-4" />
                          </button>
                          <button
                            type="button"
                            disabled={actionsBusy}
                            onClick={() => void handleToggle(logo)}
                            className="inline-flex h-9 items-center gap-1.5 rounded-full bg-white px-3 text-[12px] font-bold text-[var(--gym-ink,#111111)] shadow-sm transition hover:bg-black/5 disabled:opacity-60"
                          >
                            {logo.enabled ? (
                              <EyeOff className="size-3.5" />
                            ) : (
                              <Eye className="size-3.5" />
                            )}
                            {logo.enabled
                              ? t("admin.website.trustedPartners.hide")
                              : t("admin.website.trustedPartners.show")}
                          </button>
                          <button
                            type="button"
                            disabled={actionsBusy}
                            onClick={() => {
                              setEditing(logo)
                              setFormOpen(true)
                            }}
                            className="inline-flex h-9 items-center gap-1.5 rounded-full bg-white px-3 text-[12px] font-bold text-[var(--gym-ink,#111111)] shadow-sm transition hover:bg-black/5 disabled:opacity-60"
                          >
                            <Pencil className="size-3.5" />
                            {t("admin.website.trustedPartners.edit")}
                          </button>
                          <button
                            type="button"
                            disabled={actionsBusy}
                            onClick={() => setDeleteTarget(logo)}
                            className="inline-flex h-9 items-center gap-1.5 rounded-full bg-[#FFE8E4] px-3 text-[12px] font-bold text-[#C44536] transition hover:bg-[#ffd8d1] disabled:opacity-60"
                          >
                            <Trash2 className="size-3.5" />
                            {t("admin.website.trustedPartners.delete")}
                          </button>
                        </div>
                      ) : null}
                    </div>
                  </article>
                </li>
              )
            })}
          </ul>
        )}
      </section>

      <TrustedPartnerLogoDialog
        open={formOpen}
        initialLogo={editing}
        busy={saveLogoMutation.isPending}
        adminName={user?.displayName || user?.email || undefined}
        onClose={() => {
          if (saveLogoMutation.isPending) return
          setFormOpen(false)
          setEditing(null)
        }}
        onSave={handleSaveLogo}
      />

      <ConfirmActionDialog
        open={Boolean(deleteTarget)}
        title={t("admin.website.trustedPartners.deleteTitle")}
        description={t("admin.website.trustedPartners.deleteDescription")}
        tone="danger"
        confirmLabel={t("admin.website.trustedPartners.delete")}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={async () => {
          if (!deleteTarget) return
          try {
            await deleteMutation.mutateAsync(deleteTarget.id)
            appToast.success(
              t("admin.website.trustedPartners.toasts.deleted"),
            )
          } catch (err) {
            appToast.error(
              err instanceof Error
                ? err.message
                : t("admin.website.trustedPartners.toasts.error"),
            )
            throw err
          }
        }}
      />
    </div>
  )
}
