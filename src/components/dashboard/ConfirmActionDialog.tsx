import { useEffect, useId, useState, type ReactNode } from "react"
import { createPortal } from "react-dom"
import { AnimatePresence, motion } from "motion/react"
import { AlertTriangle, Trash2 } from "lucide-react"
import { useLocale } from "@/hooks/useLocale"
import { cn } from "@/lib/utils"

const EASE = [0.22, 1, 0.36, 1] as const

export type ConfirmActionDialogProps = {
  open: boolean
  title: string
  description?: string
  confirmLabel?: string
  cancelLabel?: string
  tone?: "danger" | "primary" | "warning"
  icon?: ReactNode
  onCancel: () => void
  onConfirm: () => Promise<void> | void
}

export function ConfirmActionDialog({
  open,
  title,
  description,
  confirmLabel,
  cancelLabel,
  tone = "danger",
  icon,
  onCancel,
  onConfirm,
}: ConfirmActionDialogProps) {
  const { locale, isRtl } = useLocale()
  const isAr = locale === "ar"
  const titleId = useId()
  const descId = useId()
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!open) {
      setSubmitting(false)
      return
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !submitting) {
        onCancel()
      }
    }

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"
    document.addEventListener("keydown", onKeyDown)

    return () => {
      document.body.style.overflow = previousOverflow
      document.removeEventListener("keydown", onKeyDown)
    }
  }, [open, submitting, onCancel])

  async function handleConfirm() {
    if (submitting) return
    setSubmitting(true)
    try {
      await onConfirm()
      onCancel()
    } finally {
      setSubmitting(false)
    }
  }

  const defaultConfirmLabel =
    confirmLabel ??
    (tone === "danger"
      ? isAr
        ? "تأكيد الحذف"
        : "Delete"
      : isAr
        ? "تأكيد"
        : "Confirm")

  const defaultCancelLabel = cancelLabel ?? (isAr ? "إلغاء" : "Cancel")

  return createPortal(
    <AnimatePresence>
      {open ? (
        <motion.div
          key="confirm-action-overlay"
          dir={isRtl ? "rtl" : "ltr"}
          className="fixed inset-0 z-[120] flex items-center justify-center p-4"
          style={{
            fontFamily:
              'var(--font-arabic, "Cairo Variable", "Cairo", sans-serif)',
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
        >
          {/* Backdrop (Solid clean overlay without delayed GPU backdrop-filter blur) */}
          <button
            type="button"
            aria-label={isAr ? "إغلاق النافذة" : "Close dialog"}
            disabled={submitting}
            onClick={onCancel}
            className="absolute inset-0 bg-black/40 disabled:pointer-events-none"
          />

          {/* Dialog Modal Container */}
          <motion.div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby={titleId}
            aria-describedby={descId}
            initial={{ opacity: 0, y: 14, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.98 }}
            transition={{ duration: 0.22, ease: EASE }}
            className={cn(
              "relative w-full max-w-[430px] overflow-hidden text-start",
              "rounded-[28px] bg-white px-7 py-7 sm:px-8 sm:py-8",
              "shadow-[0_24px_70px_rgba(0,0,0,0.18)] border border-black/5",
            )}
          >
            {/* Header Icon + Title */}
            <div className="flex items-start gap-4">
              <span
                className={cn(
                  "flex size-12 shrink-0 items-center justify-center rounded-2xl shadow-xs",
                  tone === "danger"
                    ? "bg-[#FFE8E4] text-[#C44536]"
                    : tone === "warning"
                      ? "bg-[#FFF3D6] text-[#B45309]"
                      : "bg-[var(--gym-ink,#111111)] text-[var(--gym-lime,#fb5001)]",
                )}
              >
                {icon ? (
                  icon
                ) : tone === "danger" ? (
                  <Trash2 className="size-5.5" strokeWidth={2.2} />
                ) : (
                  <AlertTriangle className="size-5.5" strokeWidth={2.2} />
                )}
              </span>

              <div className="min-w-0 flex-1">
                <h2
                  id={titleId}
                  className="text-[21px] sm:text-[23px] font-black leading-tight tracking-tight text-[var(--gym-ink,#111111)]"
                >
                  {title}
                </h2>

                {description ? (
                  <p
                    id={descId}
                    className="mt-2 text-[14px] font-medium leading-relaxed text-[#737373]"
                  >
                    {description}
                  </p>
                ) : null}
              </div>
            </div>

            {/* Actions Row */}
            <div className="mt-7 flex items-center justify-end gap-3 pt-1">
              <button
                type="button"
                onClick={onCancel}
                disabled={submitting}
                className="inline-flex h-12 items-center justify-center rounded-full border border-[#E5E7EB] bg-white px-6 text-[14px] font-bold text-[var(--gym-ink,#111111)] transition-colors hover:bg-[#F4F4F4] active:scale-[0.98] disabled:opacity-50"
              >
                {defaultCancelLabel}
              </button>

              <button
                type="button"
                onClick={() => void handleConfirm()}
                disabled={submitting}
                className={cn(
                  "inline-flex h-12 items-center justify-center rounded-full px-7 text-[14px] font-bold text-white shadow-xs transition-all active:scale-[0.98] disabled:opacity-60",
                  tone === "danger"
                    ? "bg-[#C44536] hover:bg-[#af3b2e]"
                    : tone === "warning"
                      ? "bg-[#B45309] hover:bg-[#92400E]"
                      : "bg-[var(--gym-ink,#111111)] hover:opacity-90",
                )}
              >
                {submitting
                  ? isAr
                    ? "جاري المعالجة..."
                    : "Processing..."
                  : defaultConfirmLabel}
              </button>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>,
    document.body,
  )
}

