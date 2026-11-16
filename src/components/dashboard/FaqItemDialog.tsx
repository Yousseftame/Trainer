import { useEffect, useId, useState } from "react"
import { createPortal } from "react-dom"
import { useTranslation } from "react-i18next"
import { Check, Star, X } from "lucide-react"
import type { SaveFaqItemInput } from "@/features/website/faq"
import { FAQ_FEATURED_MAX, mirrorBilingual } from "@/features/website"
import { useLocale } from "@/hooks/useLocale"
import { appToast } from "@/lib/toast"
import { cn } from "@/lib/utils"
import type { FaqItem } from "@/types/website"

type FaqItemDialogProps = {
  open: boolean
  initialItem: FaqItem | null
  featuredCount: number
  busy?: boolean
  adminName?: string
  onClose: () => void
  onSave: (input: SaveFaqItemInput) => Promise<unknown>
}

type FieldPair = { en: string; ar: string }

const EMPTY: FieldPair = { en: "", ar: "" }

export function FaqItemDialog({
  open,
  initialItem,
  featuredCount,
  busy = false,
  adminName,
  onClose,
  onSave,
}: FaqItemDialogProps) {
  const { t } = useTranslation()
  const { locale, isRtl } = useLocale()
  const isAr = locale === "ar"
  const titleId = useId()

  const [question, setQuestion] = useState<FieldPair>(EMPTY)
  const [answer, setAnswer] = useState<FieldPair>(EMPTY)
  const [featured, setFeatured] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    setError(null)
    if (initialItem) {
      setQuestion({ ...initialItem.question })
      setAnswer({ ...initialItem.answer })
      setFeatured(initialItem.featured)
    } else {
      setQuestion(EMPTY)
      setAnswer(EMPTY)
      setFeatured(false)
    }
  }, [open, initialItem])

  useEffect(() => {
    if (!open) return
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !busy) onClose()
    }
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"
    document.addEventListener("keydown", onKeyDown)
    return () => {
      document.body.style.overflow = previousOverflow
      document.removeEventListener("keydown", onKeyDown)
    }
  }, [open, busy, onClose])

  if (!open || typeof document === "undefined") return null

  const othersFeatured = initialItem?.featured
    ? Math.max(0, featuredCount - 1)
    : featuredCount
  const canFeature = featured || othersFeatured < FAQ_FEATURED_MAX

  const inputClass =
    "h-11 w-full rounded-[16px] border border-black/10 bg-[#F7F7F7] px-3.5 text-[14px] font-medium text-[#111111] outline-none transition-colors focus:border-[#111111] focus:bg-white disabled:opacity-60"
  const textareaClass =
    "min-h-[110px] w-full resize-y rounded-[16px] border border-black/10 bg-[#F7F7F7] px-3.5 py-2.5 text-[14px] font-medium text-[#111111] outline-none transition-colors focus:border-[#111111] focus:bg-white disabled:opacity-60"

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    if (busy) return
    setError(null)

    const mirroredQ = mirrorBilingual(question.en, question.ar)
    const mirroredA = mirrorBilingual(answer.en, answer.ar)
    if (!mirroredQ || !mirroredA) {
      const message = t("admin.website.commonFaq.errors.required")
      setError(message)
      appToast.error(message)
      return
    }

    if (featured && !canFeature) {
      const message = t("admin.website.commonFaq.errors.featuredMax", {
        max: FAQ_FEATURED_MAX,
      })
      setError(message)
      appToast.error(message)
      return
    }

    try {
      await onSave({
        id: initialItem?.id,
        question: mirroredQ,
        answer: mirroredA,
        featured,
        updatedBy: adminName,
      })
      onClose()
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : t("admin.website.commonFaq.toasts.error")
      setError(message)
      appToast.error(message)
    }
  }

  return createPortal(
    <div
      className="fixed inset-0 z-[80] flex items-end justify-center bg-black/40 p-3 sm:items-center sm:p-6"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !busy) onClose()
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        dir={isRtl ? "rtl" : "ltr"}
        className="max-h-[min(92dvh,720px)] w-full max-w-[640px] overflow-y-auto rounded-[24px] bg-white p-5 shadow-xl sm:p-7"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2
              id={titleId}
              className="text-[18px] font-bold text-[var(--gym-ink,#111111)]"
            >
              {initialItem
                ? t("admin.website.commonFaq.editTitle")
                : t("admin.website.commonFaq.addTitle")}
            </h2>
            <p className="mt-1 text-[13px] font-medium text-[#6B7280]">
              {t("admin.website.commonFaq.formHint", { max: FAQ_FEATURED_MAX })}
            </p>
          </div>
          <button
            type="button"
            disabled={busy}
            onClick={onClose}
            className="flex size-9 items-center justify-center rounded-full bg-[#F4F4F4] text-[var(--gym-ink,#111111)] disabled:opacity-60"
            aria-label={t("admin.website.commonFaq.close")}
          >
            <X className="size-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <label className="flex flex-col gap-1.5">
              <span className="text-[12px] font-bold text-[#374151]">
                {t("admin.website.commonFaq.fields.question")} (
                {isAr ? "عربي" : "Arabic"})
              </span>
              <input
                dir="rtl"
                value={question.ar}
                disabled={busy}
                onChange={(e) =>
                  setQuestion((prev) => ({ ...prev, ar: e.target.value }))
                }
                className={inputClass}
                style={{ fontFamily: "var(--font-arabic)" }}
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-[12px] font-bold text-[#374151]">
                {t("admin.website.commonFaq.fields.question")} (
                {isAr ? "إنجليزي" : "English"})
              </span>
              <input
                dir="ltr"
                value={question.en}
                disabled={busy}
                onChange={(e) =>
                  setQuestion((prev) => ({ ...prev, en: e.target.value }))
                }
                className={inputClass}
              />
            </label>
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <label className="flex flex-col gap-1.5">
              <span className="text-[12px] font-bold text-[#374151]">
                {t("admin.website.commonFaq.fields.answer")} (
                {isAr ? "عربي" : "Arabic"})
              </span>
              <textarea
                dir="rtl"
                value={answer.ar}
                disabled={busy}
                onChange={(e) =>
                  setAnswer((prev) => ({ ...prev, ar: e.target.value }))
                }
                className={textareaClass}
                style={{ fontFamily: "var(--font-arabic)" }}
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-[12px] font-bold text-[#374151]">
                {t("admin.website.commonFaq.fields.answer")} (
                {isAr ? "إنجليزي" : "English"})
              </span>
              <textarea
                dir="ltr"
                value={answer.en}
                disabled={busy}
                onChange={(e) =>
                  setAnswer((prev) => ({ ...prev, en: e.target.value }))
                }
                className={textareaClass}
              />
            </label>
          </div>

          <button
            type="button"
            disabled={busy || (!featured && !canFeature)}
            onClick={() => setFeatured((prev) => !prev)}
            className={cn(
              "inline-flex h-10 items-center gap-2 rounded-full px-3.5 text-[13px] font-bold transition",
              featured
                ? "bg-[#FFF4EC] text-[var(--gym-lime,#fb5001)]"
                : "bg-[#F4F4F4] text-[var(--gym-ink,#111111)]",
              "disabled:opacity-50",
            )}
          >
            <Star
              className="size-4"
              fill={featured ? "currentColor" : "none"}
              strokeWidth={1.8}
            />
            {featured
              ? t("admin.website.commonFaq.featuredOn")
              : t("admin.website.commonFaq.featuredOff")}
          </button>
          <p className="text-[12px] font-medium text-[#6B7280]">
            {t("admin.website.commonFaq.featuredHint", {
              max: FAQ_FEATURED_MAX,
              count: othersFeatured + (featured ? 1 : 0),
            })}
          </p>

          {error ? (
            <p className="text-[13px] font-medium text-[#C44536]">{error}</p>
          ) : null}

          <div className="flex justify-end gap-2 border-t border-black/[0.06] pt-4">
            <button
              type="button"
              disabled={busy}
              onClick={onClose}
              className="inline-flex h-11 items-center rounded-full bg-[#F4F4F4] px-5 text-[13px] font-bold text-[var(--gym-ink,#111111)] disabled:opacity-60"
            >
              {t("admin.website.commonFaq.cancel")}
            </button>
            <button
              type="submit"
              disabled={busy}
              className="inline-flex h-11 items-center gap-2 rounded-full bg-[var(--gym-ink,#111111)] px-5 text-[13px] font-bold text-white disabled:opacity-60"
            >
              <Check className="size-4" strokeWidth={2.4} />
              {busy
                ? t("admin.website.commonFaq.saving")
                : t("admin.website.commonFaq.save")}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body,
  )
}
