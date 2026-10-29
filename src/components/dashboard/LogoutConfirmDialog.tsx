import { useEffect, useId, useState } from "react"
import { createPortal } from "react-dom"
import { useTranslation } from "react-i18next"
import { AnimatePresence, motion } from "motion/react"
import { cn } from "@/lib/utils"

const EASE = [0.22, 1, 0.36, 1] as const

type LogoutConfirmDialogProps = {
  open: boolean
  onCancel: () => void
  onConfirm: () => Promise<void>
}

export function LogoutConfirmDialog({
  open,
  onCancel,
  onConfirm,
}: LogoutConfirmDialogProps) {
  const { t } = useTranslation()
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
    } finally {
      setSubmitting(false)
    }
  }

  return createPortal(
    <AnimatePresence>
      {open ? (
        <motion.div
          key="logout-confirm-overlay"
          className="dashboard-shell fixed inset-0 z-[100] flex items-center justify-center p-4 font-[family-name:var(--font-arabic)]"
          style={{ fontFamily: 'var(--font-arabic, "Cairo Variable", "Cairo", sans-serif)' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
        >
          <button
            type="button"
            aria-label={t("nav.closeMenu")}
            disabled={submitting}
            onClick={onCancel}
            className="absolute inset-0 bg-black/35 transition-opacity disabled:pointer-events-none"
          />

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
              "relative w-full max-w-[420px] overflow-hidden text-start",
              "rounded-[28px] bg-white px-7 py-7 sm:px-8 sm:py-8",
              "shadow-[0_24px_70px_rgba(0,0,0,0.16)]",
            )}
          >
            <h2
              id={titleId}
              style={{ fontFamily: 'var(--font-arabic, "Cairo Variable", "Cairo", sans-serif)' }}
              className="text-[24px] font-extrabold leading-tight tracking-tight text-[var(--gym-ink,#111111)] sm:text-[26px]"
            >
              {t("dashboard.logoutModal.title")}
            </h2>

            <p
              id={descId}
              style={{ fontFamily: 'var(--font-arabic, "Cairo Variable", "Cairo", sans-serif)' }}
              className="mt-2.5 text-[14px] font-medium leading-relaxed text-[#8c8c8c] sm:text-[15px]"
            >
              {t("dashboard.logoutModal.description")}
            </p>

            <div className="mt-7 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onCancel}
                disabled={submitting}
                style={{ fontFamily: 'var(--font-arabic, "Cairo Variable", "Cairo", sans-serif)' }}
                className="inline-flex h-12 items-center justify-center rounded-full border border-[#E5E7EB] bg-white px-6 text-[14px] font-bold text-[var(--gym-ink,#111111)] transition-colors hover:bg-[#F4F4F4] active:scale-[0.98] disabled:opacity-50"
              >
                {t("dashboard.logoutModal.cancel")}
              </button>

              <button
                type="button"
                onClick={() => void handleConfirm()}
                disabled={submitting}
                style={{ fontFamily: 'var(--font-arabic, "Cairo Variable", "Cairo", sans-serif)' }}
                className="inline-flex h-12 items-center justify-center rounded-full bg-[var(--gym-ink,#111111)] px-7 text-[14px] font-bold text-white transition-opacity hover:opacity-90 active:scale-[0.98] disabled:opacity-60"
              >
                {submitting
                  ? t("auth.submitting")
                  : t("dashboard.logoutModal.confirm")}
              </button>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>,
    document.body,
  )
}
