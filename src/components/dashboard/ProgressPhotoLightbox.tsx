import { useEffect, useId, useRef } from "react"
import { createPortal } from "react-dom"
import { ArrowLeft, ArrowRight, X } from "lucide-react"
import { ProgressPhotoImage } from "@/components/dashboard/ProgressPhotoImage"
import { useLocale } from "@/hooks/useLocale"
import { formatDate } from "@/lib/format"
import { cn } from "@/lib/utils"
import type { ProgressPhoto } from "@/types/progress"

type ProgressPhotoLightboxProps = {
  open: boolean
  photos: ProgressPhoto[]
  index: number
  onClose: () => void
  onIndexChange: (next: number) => void
}

/** Fullscreen viewer for admin/subscriber progress photos. */
export function ProgressPhotoLightbox({
  open,
  photos,
  index,
  onClose,
  onIndexChange,
}: ProgressPhotoLightboxProps) {
  const { locale, isRtl } = useLocale()
  const isAr = locale === "ar"
  const titleId = useId()
  const dialogRef = useRef<HTMLDivElement>(null)
  const touchStartX = useRef<number | null>(null)
  const total = photos.length
  const photo = photos[index]

  useEffect(() => {
    if (!open) return
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"
    dialogRef.current?.focus()

    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault()
        onClose()
        return
      }
      if (total <= 1) return
      if (event.key === "ArrowLeft") {
        event.preventDefault()
        onIndexChange(isRtl ? (index + 1) % total : (index - 1 + total) % total)
      }
      if (event.key === "ArrowRight") {
        event.preventDefault()
        onIndexChange(isRtl ? (index - 1 + total) % total : (index + 1) % total)
      }
    }

    window.addEventListener("keydown", onKey)
    return () => {
      document.body.style.overflow = prevOverflow
      window.removeEventListener("keydown", onKey)
    }
  }, [open, index, total, isRtl, onClose, onIndexChange])

  if (!open || !photo) return null

  const goPrev = () => onIndexChange((index - 1 + total) % total)
  const goNext = () => onIndexChange((index + 1) % total)
  const PrevIcon = isRtl ? ArrowRight : ArrowLeft
  const NextIcon = isRtl ? ArrowLeft : ArrowRight
  const showNav = total > 1

  function onTouchStart(event: React.TouchEvent) {
    touchStartX.current = event.changedTouches[0]?.clientX ?? null
  }

  function onTouchEnd(event: React.TouchEvent) {
    const start = touchStartX.current
    const end = event.changedTouches[0]?.clientX
    touchStartX.current = null
    if (start == null || end == null || !showNav) return
    const delta = end - start
    if (Math.abs(delta) < 48) return
    if (delta < 0) {
      if (isRtl) goPrev()
      else goNext()
    } else if (isRtl) goNext()
    else goPrev()
  }

  return createPortal(
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      tabIndex={-1}
      dir={isRtl ? "rtl" : "ltr"}
      className="fixed inset-0 z-[10000] flex flex-col bg-[#0a0a0a] outline-none"
      onClick={onClose}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      <h2 id={titleId} className="sr-only">
        {isAr ? "عرض صورة التقدم" : "Progress photo viewer"}
      </h2>

      <div className="relative z-20 flex shrink-0 items-center justify-between gap-3 px-4 pb-1 pt-[max(0.75rem,env(safe-area-inset-top))] sm:px-6 sm:pt-4">
        <p
          dir="ltr"
          className="font-heading text-[14px] font-semibold tabular-nums text-white/75 sm:text-[15px]"
        >
          {index + 1} / {total}
        </p>
        <button
          type="button"
          onClick={onClose}
          className="inline-flex size-10 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gym-lime)] sm:size-11"
          aria-label={isAr ? "إغلاق" : "Close"}
        >
          <X className="size-5" strokeWidth={2.25} />
        </button>
      </div>

      <div
        className="relative flex min-h-0 flex-1 flex-col"
        onClick={(event) => event.stopPropagation()}
      >
        {showNav ? (
          <>
            <button
              type="button"
              onClick={goPrev}
              className={cn(
                "absolute top-[38%] z-20 inline-flex size-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20 sm:size-12",
                isRtl ? "right-3 sm:right-5" : "left-3 sm:left-5",
              )}
              aria-label={isAr ? "السابق" : "Previous"}
            >
              <PrevIcon className="size-5 sm:size-6" strokeWidth={2.25} />
            </button>
            <button
              type="button"
              onClick={goNext}
              className={cn(
                "absolute top-[38%] z-20 inline-flex size-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20 sm:size-12",
                isRtl ? "left-3 sm:left-5" : "right-3 sm:right-5",
              )}
              aria-label={isAr ? "التالي" : "Next"}
            >
              <NextIcon className="size-5 sm:size-6" strokeWidth={2.25} />
            </button>
          </>
        ) : null}

        <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-3 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:gap-4 sm:px-16 md:px-20">
          <div className="flex w-full max-w-[920px] flex-col items-center">
            <div className="relative mx-auto flex max-h-[min(78dvh,820px)] w-full max-w-full items-center justify-center overflow-hidden rounded-[14px] bg-black/40 sm:rounded-[20px]">
              <ProgressPhotoImage
                photo={photo}
                imgClassName="!h-auto !w-auto max-h-[min(78dvh,820px)] max-w-full object-contain"
              />
            </div>
            <div className="mt-3 w-full max-w-[560px] px-1 text-center sm:mt-4">
              <p className="font-heading text-[15px] font-bold text-white sm:text-[16px]">
                {formatDate(photo.takenAt, locale)}
                {photo.pose
                  ? ` · ${
                      isAr
                        ? photo.pose === "front"
                          ? "أمامي"
                          : photo.pose === "side"
                            ? "جانبي"
                            : "خلفي"
                        : photo.pose.toUpperCase()
                    }`
                  : ""}
              </p>
              {photo.caption ? (
                <p className="mt-1 text-[13px] font-medium text-white/70">
                  {photo.caption}
                </p>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  )
}
