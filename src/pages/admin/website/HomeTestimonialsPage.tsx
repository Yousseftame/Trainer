import { useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import {
  CircleCheck,
  ImageOff,
  MessageSquareQuote,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react"
import { ConfirmActionDialog } from "@/components/dashboard/ConfirmActionDialog"
import { StatCard } from "@/components/dashboard/StatCard"
import { TestimonialFormDialog } from "@/components/dashboard/TestimonialFormDialog"
import { useAuth } from "@/features/auth/auth-context"
import {
  useDeleteTestimonialMutation,
  useSaveTestimonialMutation,
  useTestimonialsQuery,
} from "@/features/website/hooks"
import {
  TESTIMONIALS_MAX,
  TESTIMONIAL_SLOTS,
  type SaveTestimonialInput,
} from "@/features/website/testimonials"
import { isRenderableImageSrc } from "@/features/website/paths"
import { useDocumentTitle } from "@/hooks/useDocumentTitle"
import { useLocale } from "@/hooks/useLocale"
import { resolveBilingualText } from "@/lib/program-text"
import { appToast } from "@/lib/toast"
import { cn } from "@/lib/utils"
import type { TestimonialItem } from "@/types/website"
import starsSrc from "@/assets/feedback-stars.svg"

export function HomeTestimonialsPage() {
  const { t } = useTranslation()
  const { locale } = useLocale()
  const { user, hasPermission } = useAuth()
  const canManage = hasPermission("content:manage")
  useDocumentTitle(t("admin.website.sections.homeTestimonials"))

  const {
    data: items = [],
    isLoading,
    isError,
    refetch,
  } = useTestimonialsQuery({ audience: "admin" })
  const saveMutation = useSaveTestimonialMutation()
  const deleteMutation = useDeleteTestimonialMutation()

  const [formSlotId, setFormSlotId] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<TestimonialItem | null>(
    null,
  )

  const actionsBusy = saveMutation.isPending || deleteMutation.isPending

  const bySlot = useMemo(() => {
    const map = new Map<string, TestimonialItem>()
    for (const item of items) map.set(item.id, item)
    return map
  }, [items])

  const stats = useMemo(() => {
    const filled = items.filter(
      (item) =>
        isRenderableImageSrc(item.imageUrl) &&
        (item.title.en.trim() || item.title.ar.trim()),
    ).length
    return {
      slots: TESTIMONIALS_MAX,
      filled,
      empty: TESTIMONIALS_MAX - filled,
    }
  }, [items])

  const formSlot = formSlotId
    ? TESTIMONIAL_SLOTS.find((s) => s.id === formSlotId) ?? null
    : null
  const editingItem = formSlotId ? bySlot.get(formSlotId) ?? null : null

  async function handleSave(input: SaveTestimonialInput) {
    await saveMutation.mutateAsync(input)
    appToast.success(t("admin.website.testimonials.toasts.saved"))
  }

  return (
    <div className="flex flex-col gap-4 sm:gap-5">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 lg:gap-4">
        <StatCard
          label={t("admin.website.testimonials.stats.slots")}
          value={stats.slots}
          icon={<MessageSquareQuote className="size-4" strokeWidth={1.8} />}
        />
        <StatCard
          label={t("admin.website.testimonials.stats.filled")}
          value={stats.filled}
          icon={<CircleCheck className="size-4" strokeWidth={1.8} />}
        />
        <StatCard
          label={t("admin.website.testimonials.stats.empty")}
          value={stats.empty}
          icon={<ImageOff className="size-4" strokeWidth={1.8} />}
        />
      </div>

      <section className="rounded-[24px] bg-white p-4 sm:p-6 lg:p-7">
        <div className="mb-5 flex flex-col gap-1.5 sm:mb-6">
          <h2 className="text-[18px] font-bold tracking-tight text-[var(--gym-ink,#111111)] sm:text-[20px]">
            {t("admin.website.testimonials.editorTitle")}
          </h2>
          <p className="max-w-[62ch] text-[13px] font-medium leading-relaxed text-[#6B7280] sm:text-[14px]">
            {t("admin.website.testimonials.editorHint")}
          </p>
        </div>

        {isError ? (
          <div className="flex min-h-40 flex-col items-center justify-center gap-3 rounded-[20px] bg-[#F4F4F4] px-4 py-10 text-center">
            <p className="text-sm font-medium text-[#8c8c8c]">
              {t("admin.website.testimonials.loadError")}
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
          <div className="flex min-h-40 items-center justify-center rounded-[20px] bg-[#F4F4F4] px-4 py-10 text-sm font-medium text-[#8c8c8c]">
            {t("admin.website.testimonials.loading")}
          </div>
        ) : (
          <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {TESTIMONIAL_SLOTS.map((slot) => {
              const item = bySlot.get(slot.id) ?? null
              return (
                <li key={slot.id}>
                  <TestimonialSlotCard
                    slotIndex={slot.slotIndex}
                    slotLabel={t("admin.website.testimonials.slotLabel", {
                      n: slot.slotIndex + 1,
                    })}
                    item={item}
                    locale={locale}
                    canManage={canManage}
                    actionsBusy={actionsBusy}
                    onEdit={() => setFormSlotId(slot.id)}
                    onDelete={() => {
                      if (item) setDeleteTarget(item)
                    }}
                  />
                </li>
              )
            })}
          </ul>
        )}
      </section>

      {formSlot ? (
        <TestimonialFormDialog
          open
          slotId={formSlot.id}
          slotLabel={t("admin.website.testimonials.slotLabel", {
            n: formSlot.slotIndex + 1,
          })}
          initialItem={editingItem}
          busy={saveMutation.isPending}
          adminName={user?.displayName || user?.email || undefined}
          onClose={() => {
            if (saveMutation.isPending) return
            setFormSlotId(null)
          }}
          onSave={handleSave}
        />
      ) : null}

      <ConfirmActionDialog
        open={Boolean(deleteTarget)}
        title={t("admin.website.testimonials.deleteTitle")}
        description={t("admin.website.testimonials.deleteDescription")}
        tone="danger"
        confirmLabel={t("admin.website.testimonials.delete")}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={async () => {
          if (!deleteTarget) return
          try {
            await deleteMutation.mutateAsync(deleteTarget.id)
            appToast.success(t("admin.website.testimonials.toasts.deleted"))
            setDeleteTarget(null)
          } catch (err) {
            appToast.error(
              err instanceof Error
                ? err.message
                : t("admin.website.testimonials.toasts.error"),
            )
            throw err
          }
        }}
      />
    </div>
  )
}

function TestimonialSlotCard({
  slotIndex,
  slotLabel,
  item,
  locale,
  canManage,
  actionsBusy,
  onEdit,
  onDelete,
}: {
  slotIndex: number
  slotLabel: string
  item: TestimonialItem | null
  locale: "en" | "ar"
  canManage: boolean
  actionsBusy: boolean
  onEdit: () => void
  onDelete: () => void
}) {
  const { t } = useTranslation()
  const filled = Boolean(
    item &&
      isRenderableImageSrc(item.imageUrl) &&
      (item.title.en.trim() || item.title.ar.trim()),
  )

  const title = item
    ? resolveBilingualText(
        item.title,
        locale,
        t("admin.website.testimonials.untitled"),
      )
    : t("admin.website.testimonials.emptyTitle")
  const body = item ? resolveBilingualText(item.body, locale) : ""
  const author = item ? resolveBilingualText(item.author, locale) : ""

  return (
    <article
      className={cn(
        "flex h-full flex-col overflow-hidden rounded-[20px] border border-black/[0.06] bg-[#F7F7F7] shadow-[0_8px_24px_rgba(0,0,0,0.04)]",
        !filled && "opacity-90",
      )}
    >
      <div className="flex items-center justify-between gap-2 px-4 pt-4">
        <span className="inline-flex size-8 items-center justify-center rounded-full bg-black/80 text-[13px] font-bold text-white">
          {slotIndex + 1}
        </span>
        <span
          className={cn(
            "inline-flex h-7 items-center rounded-full px-2.5 text-[11px] font-bold sm:text-[12px]",
            filled
              ? "bg-[var(--gym-lime,#fb5001)] text-white"
              : "bg-black/10 text-[#374151]",
          )}
        >
          {filled
            ? t("admin.website.testimonials.status.filled")
            : t("admin.website.testimonials.status.empty")}
        </span>
      </div>

      <div className="flex flex-1 flex-col gap-3 px-4 pb-4 pt-3 sm:px-5">
        <div className="flex items-start gap-3.5">
          <div
            className={cn(
              "size-[72px] shrink-0 overflow-hidden rounded-full border-4 bg-white",
              filled
                ? "border-[var(--gym-lime,#fb5001)]"
                : "border-white",
            )}
          >
            {filled && item ? (
              <img
                src={item.imageUrl}
                alt=""
                className="size-full object-cover"
                draggable={false}
              />
            ) : (
              <div className="flex size-full items-center justify-center text-[#8c8c8c]">
                <ImageOff className="size-6" strokeWidth={1.4} />
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-bold uppercase tracking-wide text-[#8c8c8c]">
              {slotLabel}
            </p>
            {filled ? (
              <>
                <img
                  src={starsSrc}
                  alt=""
                  aria-hidden
                  className="mt-1.5 h-[14px] w-[100px]"
                  draggable={false}
                />
                <h3 className="mt-2 line-clamp-2 font-heading text-[15px] font-bold leading-snug text-[var(--gym-ink,#111111)]">
                  {title}
                </h3>
              </>
            ) : (
              <p className="mt-2 text-[13px] font-medium leading-relaxed text-[#8c8c8c]">
                {t("admin.website.testimonials.emptyHint")}
              </p>
            )}
          </div>
        </div>

        {filled ? (
          <>
            {body ? (
              <p className="line-clamp-3 text-[13px] leading-relaxed text-[#1e2222]">
                {body}
              </p>
            ) : null}
            {author ? (
              <p className="text-[13px] text-[var(--gym-muted,#6b7280)]">
                {author}
              </p>
            ) : null}
          </>
        ) : null}
      </div>

      {canManage ? (
        <div className="flex flex-wrap items-center gap-1.5 border-t border-black/5 bg-white/80 px-3 py-2.5 backdrop-blur-sm sm:gap-2 sm:px-3.5">
          <button
            type="button"
            disabled={actionsBusy}
            onClick={onEdit}
            className="inline-flex h-8 items-center gap-1.5 rounded-full bg-[var(--gym-ink,#111111)] px-2.5 text-[11px] font-bold text-white transition hover:opacity-90 disabled:opacity-60"
          >
            {filled ? (
              <>
                <Pencil className="size-3.5" />
                {t("admin.website.testimonials.edit")}
              </>
            ) : (
              <>
                <Plus className="size-3.5" />
                {t("admin.website.testimonials.fillSlot")}
              </>
            )}
          </button>
          {filled ? (
            <button
              type="button"
              disabled={actionsBusy}
              onClick={onDelete}
              className="ms-auto inline-flex h-8 items-center gap-1.5 rounded-full bg-[#FFE8E4] px-2.5 text-[11px] font-bold text-[#C44536] transition hover:bg-[#ffd8d1] disabled:opacity-60"
            >
              <Trash2 className="size-3.5" />
              {t("admin.website.testimonials.delete")}
            </button>
          ) : null}
        </div>
      ) : null}
    </article>
  )
}
