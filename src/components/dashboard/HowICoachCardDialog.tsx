import { useEffect, useId, useState } from "react"
import { createPortal } from "react-dom"
import { useTranslation } from "react-i18next"
import { Check, X } from "lucide-react"
import type { SaveAboutHowICoachCardInput } from "@/features/website/aboutHowICoach"
import { mirrorBilingual } from "@/features/website/service"
import { useLocale } from "@/hooks/useLocale"
import { appToast } from "@/lib/toast"
import type {
  AboutHowICoachCard,
  AboutHowICoachCardId,
} from "@/types/website"

type HowICoachCardDialogProps = {
  open: boolean
  cardId: AboutHowICoachCardId
  cardIndex: number
  initialCard: AboutHowICoachCard
  busy?: boolean
  adminName?: string
  onClose: () => void
  onSave: (input: SaveAboutHowICoachCardInput) => Promise<unknown>
}

type FieldPair = { en: string; ar: string }

const EMPTY: FieldPair = { en: "", ar: "" }

export function HowICoachCardDialog({
  open,
  cardId,
  cardIndex,
  initialCard,
  busy = false,
  adminName,
  onClose,
  onSave,
}: HowICoachCardDialogProps) {
  const { t } = useTranslation()
  const { locale, isRtl } = useLocale()
  const isAr = locale === "ar"
  const titleId = useId()

  const [title, setTitle] = useState<FieldPair>(EMPTY)
  const [body, setBody] = useState<FieldPair>(EMPTY)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    setError(null)
    setTitle({ ...initialCard.title })
    setBody({ ...initialCard.body })
  }, [open, initialCard])

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

  const inputClass =
    "h-11 w-full rounded-[16px] border border-black/10 bg-[#F7F7F7] px-3.5 text-[14px] font-medium text-[#111111] outline-none transition-colors focus:border-[#111111] focus:bg-white disabled:opacity-60"
  const textareaClass =
    "min-h-[110px] w-full resize-y rounded-[16px] border border-black/10 bg-[#F7F7F7] px-3.5 py-2.5 text-[14px] font-medium text-[#111111] outline-none transition-colors focus:border-[#111111] focus:bg-white disabled:opacity-60"

  function showError(message: string) {
    setError(message)
    appToast.error(message)
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    if (busy) return
    setError(null)

    const mirroredTitle = mirrorBilingual(title.en, title.ar)
    const mirroredBody = mirrorBilingual(body.en, body.ar)
    if (!mirroredTitle || !mirroredBody) {
      showError(t("admin.website.aboutHowICoach.errors.cardRequired"))
      return
    }

    try {
      await onSave({
        cardId,
        title: mirroredTitle,
        body: mirroredBody,
        updatedBy: adminName,
      })
      onClose()
    } catch (err) {
      showError(
        err instanceof Error
          ? err.message
          : t("admin.website.aboutHowICoach.errors.saveFailed"),
      )
    }
  }

  function renderBilingual(params: {
    labelKey: string
    value: FieldPair
    onChange: (next: FieldPair) => void
    multiline?: boolean
  }) {
    const Field = params.multiline ? "textarea" : "input"
    return (
      <div className="grid grid-cols-1 gap-3.5 md:grid-cols-2">
        <label className="flex flex-col gap-1.5">
          <span className="text-[12px] font-bold text-[#374151]">
            {t(params.labelKey)} ({isAr ? "عربي" : "Arabic"})
          </span>
          <Field
            dir="rtl"
            value={params.value.ar}
            disabled={busy}
            onChange={(e) =>
              params.onChange({ ...params.value, ar: e.target.value })
            }
            className={params.multiline ? textareaClass : inputClass}
            style={{ fontFamily: "var(--font-arabic)" }}
          />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-[12px] font-bold text-[#374151]">
            {t(params.labelKey)} ({isAr ? "إنجليزي" : "English"})
          </span>
          <Field
            dir="ltr"
            value={params.value.en}
            disabled={busy}
            onChange={(e) =>
              params.onChange({ ...params.value, en: e.target.value })
            }
            className={params.multiline ? textareaClass : inputClass}
          />
        </label>
      </div>
    )
  }

  const previewTitle =
    (isAr ? title.ar || title.en : title.en || title.ar) ||
    t("admin.website.aboutHowICoach.untitled")
  const previewBody =
    (isAr ? body.ar || body.en : body.en || body.ar) || "—"

  return createPortal(
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center bg-black/50 p-3 backdrop-blur-[3px] sm:p-5"
      onClick={() => {
        if (!busy) onClose()
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        dir={isRtl ? "rtl" : "ltr"}
        style={{
          fontFamily: isAr ? "var(--font-arabic)" : "var(--font-sans)",
        }}
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[92dvh] w-full max-w-[720px] flex-col overflow-hidden rounded-[28px] bg-white shadow-[0_24px_70px_rgba(0,0,0,0.25)]"
      >
        <div className="flex items-start justify-between gap-3 border-b border-black/[0.07] px-5 py-4 sm:px-7 sm:py-5">
          <div className="min-w-0">
            <h2
              id={titleId}
              className="text-[20px] font-bold tracking-tight text-[#0d1117] sm:text-[22px]"
            >
              {t("admin.website.aboutHowICoach.editCardTitle")}
            </h2>
            <p className="mt-0.5 text-[13px] font-medium text-[#6B7280]">
              {t("admin.website.aboutHowICoach.cardLabel", {
                n: cardIndex + 1,
              })}
            </p>
          </div>
          <button
            type="button"
            disabled={busy}
            onClick={onClose}
            className="inline-flex size-9 shrink-0 items-center justify-center rounded-full bg-[#F4F4F4] text-[#111111] transition-colors hover:bg-black/10"
            aria-label={t("admin.website.aboutHowICoach.close")}
          >
            <X className="size-4" strokeWidth={2} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
          <div className="no-scrollbar flex-1 space-y-5 overflow-y-auto px-5 py-5 sm:px-7">
            <div className="rounded-[20px] bg-[var(--gym-dark,#24030c)] p-5 text-white">
              <span className="font-heading text-[40px] font-extrabold leading-none text-[var(--gym-lime,#fb5001)]/35">
                {String(cardIndex + 1).padStart(2, "0")}
              </span>
              <p className="mt-4 font-heading text-[18px] font-bold">
                {previewTitle}
              </p>
              <p className="mt-2 line-clamp-4 text-[13px] leading-relaxed text-white/65">
                {previewBody}
              </p>
            </div>

            {renderBilingual({
              labelKey: "admin.website.aboutHowICoach.fields.cardTitle",
              value: title,
              onChange: setTitle,
            })}
            {renderBilingual({
              labelKey: "admin.website.aboutHowICoach.fields.cardBody",
              value: body,
              onChange: setBody,
              multiline: true,
            })}
          </div>

          <div className="shrink-0 space-y-3 border-t border-black/[0.07] px-5 py-4 sm:px-7">
            {error ? (
              <div
                role="alert"
                className="rounded-[16px] bg-rose-50 px-4 py-3 text-[13px] font-semibold text-rose-700"
              >
                {error}
              </div>
            ) : null}
            <div className="flex flex-col-reverse gap-2.5 sm:flex-row sm:justify-end">
              <button
                type="button"
                disabled={busy}
                onClick={onClose}
                className="inline-flex h-11 items-center justify-center rounded-full bg-[#F4F4F4] px-5 text-[13px] font-bold text-[var(--gym-ink,#111111)] transition-colors hover:bg-black/10 disabled:opacity-60"
              >
                {t("admin.website.aboutHowICoach.cancel")}
              </button>
              <button
                type="submit"
                disabled={busy}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-[var(--gym-ink,#111111)] px-5 text-[13px] font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
              >
                <Check className="size-4" strokeWidth={2.4} />
                {busy
                  ? t("admin.website.aboutHowICoach.saving")
                  : t("admin.website.aboutHowICoach.saveCard")}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>,
    document.body,
  )
}
