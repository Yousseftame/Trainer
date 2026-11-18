import { useEffect, useMemo, useState } from "react"
import { createPortal } from "react-dom"
import { ArrowLeftRight, Camera, X } from "lucide-react"
import { ProgressPhotoImage } from "@/components/dashboard/ProgressPhotoImage"
import { useLocale } from "@/hooks/useLocale"
import { formatDate } from "@/lib/format"
import { cn } from "@/lib/utils"
import type { ProgressPhoto, ProgressPhotoPose } from "@/types/progress"

type PhotoComparisonDialogProps = {
  open: boolean
  photos: ProgressPhoto[]
  subscriberName?: string
  onClose: () => void
}

/**
 * Pick any two progress photos and compare them side-by-side
 * (e.g. first check-in vs latest) to review physical change over time.
 */
export function PhotoComparisonDialog({
  open,
  photos,
  subscriberName,
  onClose,
}: PhotoComparisonDialogProps) {
  const { locale } = useLocale()
  const isAr = locale === "ar"

  const [selectedPose, setSelectedPose] = useState<ProgressPhotoPose | "all">("all")
  const [photoAId, setPhotoAId] = useState("")
  const [photoBId, setPhotoBId] = useState("")

  const filteredPhotos = useMemo(() => {
    if (selectedPose === "all") return photos
    return photos.filter((p) => p.pose === selectedPose)
  }, [photos, selectedPose])

  // Reset selection whenever the dialog opens or the photo set changes.
  useEffect(() => {
    if (!open) return
    setSelectedPose("all")
    setPhotoAId(photos[0]?.id ?? "")
    setPhotoBId(
      photos.length > 1 ? photos[photos.length - 1]?.id ?? "" : photos[0]?.id ?? "",
    )
  }, [open, photos])

  useEffect(() => {
    if (!open) return
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault()
        onClose()
      }
    }
    window.addEventListener("keydown", onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      window.removeEventListener("keydown", onKey)
      document.body.style.overflow = prev
    }
  }, [open, onClose])

  const photoA = useMemo(() => {
    if (photoAId) {
      const found = filteredPhotos.find((p) => p.id === photoAId)
      if (found) return found
    }
    return filteredPhotos[0]
  }, [filteredPhotos, photoAId])

  const photoB = useMemo(() => {
    if (photoBId) {
      const found = filteredPhotos.find((p) => p.id === photoBId)
      if (found) return found
    }
    return filteredPhotos.length > 1
      ? filteredPhotos[filteredPhotos.length - 1]
      : filteredPhotos[0]
  }, [filteredPhotos, photoBId])

  const daysDiff = useMemo(() => {
    if (!photoA || !photoB) return 0
    const tA = new Date(photoA.takenAt).getTime()
    const tB = new Date(photoB.takenAt).getTime()
    return Math.abs(Math.round((tB - tA) / (1000 * 60 * 60 * 24)))
  }, [photoA, photoB])

  const poseCounts = useMemo(() => {
    const counts = { front: 0, side: 0, back: 0 }
    for (const p of photos) {
      if (p.pose === "front" || p.pose === "side" || p.pose === "back") {
        counts[p.pose] += 1
      }
    }
    return counts
  }, [photos])

  if (!open) return null

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-5"
      role="dialog"
      aria-modal="true"
      aria-label={isAr ? "مقارنة صور التقدم" : "Compare progress photos"}
    >
      <div className="fixed inset-0 bg-black/60" onClick={onClose} aria-hidden />

      <div className="relative z-10 flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-[28px] bg-white shadow-2xl">
        <div className="flex shrink-0 items-center justify-between border-b border-[#F0F0F0] px-5 py-4 sm:px-7">
          <div className="flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-2xl bg-[var(--gym-ink,#111111)] text-[var(--gym-lime,#fb5001)]">
              <ArrowLeftRight className="size-5" />
            </span>
            <div>
              <h2 className="font-heading text-[18px] font-extrabold text-[var(--gym-ink,#111111)] sm:text-[20px]">
                {isAr ? "مقارنة صورتين جنباً إلى جنب" : "Compare two photos side-by-side"}
              </h2>
              <p className="text-[12px] font-medium text-[#8c8c8c]">
                {subscriberName
                  ? isAr
                    ? `${subscriberName} · اختر صورتين لرؤية التغير عبر الوقت`
                    : `${subscriberName} · Pick any two photos to review change over time`
                  : isAr
                    ? "اختر صورتين لرؤية التغير عبر الوقت"
                    : "Pick any two photos to review change over time"}
                {photoA && photoB
                  ? isAr
                    ? ` · ${daysDiff} يوم بينهما`
                    : ` · ${daysDiff} days apart`
                  : ""}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex size-8 items-center justify-center rounded-full bg-[#F4F4F4] text-[#8c8c8c] hover:bg-black/5"
            aria-label={isAr ? "إغلاق" : "Close"}
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-[#F0F0F0] bg-[#FAFAFA] px-5 py-2.5 sm:px-7">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-bold text-[#8c8c8c]">
              {isAr ? "تصفية الوضعية:" : "Filter pose:"}
            </span>
            {(["all", "front", "side", "back"] as const).map((p) => {
              const active = selectedPose === p
              const count =
                p === "all"
                  ? photos.length
                  : poseCounts[p]
              const disabled = p !== "all" && count === 0
              return (
                <button
                  key={p}
                  type="button"
                  disabled={disabled}
                  onClick={() => {
                    setSelectedPose(p)
                    setPhotoAId("")
                    setPhotoBId("")
                  }}
                  className={cn(
                    "rounded-full px-3 py-1 text-[11px] font-bold transition",
                    active
                      ? "bg-[var(--gym-ink,#111111)] text-white shadow-xs"
                      : disabled
                        ? "cursor-not-allowed bg-white/60 text-[#c4c4c4]"
                        : "bg-white text-[#8c8c8c] hover:bg-[#F0F0F0] hover:text-[var(--gym-ink,#111111)]",
                  )}
                >
                  {p === "all"
                    ? isAr
                      ? `الكل (${count})`
                      : `All (${count})`
                    : isAr
                      ? `${p === "front" ? "أمامي" : p === "side" ? "جانبي" : "خلفي"} (${count})`
                      : `${p.toUpperCase()} (${count})`}
                </button>
              )
            })}
          </div>

          <span className="text-[11px] font-bold text-[#8c8c8c]">
            {filteredPhotos.length} {isAr ? "صور متاحة" : "photos available"}
          </span>
        </div>

        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {filteredPhotos.length < 2 ? (
            <div className="flex min-h-60 flex-col items-center justify-center rounded-2xl bg-[#F4F4F4] p-6 text-center text-[#8c8c8c]">
              <Camera className="size-10 stroke-[1.5]" />
              <p className="mt-3 font-heading text-[15px] font-bold text-[var(--gym-ink,#111111)]">
                {isAr
                  ? "تحتاج إلى صورتين على الأقل لإجراء المقارنة"
                  : "At least 2 photos required for comparison"}
              </p>
              <p className="mt-1 text-[12px]">
                {isAr
                  ? "جرّب فلتر «الكل» أو ارفع المزيد من صور التقدم."
                  : "Try the All filter, or upload more progress photos."}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <ComparePane
                badge={isAr ? "الصورة أ" : "Photo A"}
                badgeClass="bg-[var(--gym-ink,#111111)] text-white"
                photo={photoA}
                options={filteredPhotos}
                onSelect={setPhotoAId}
                locale={locale}
                isAr={isAr}
              />
              <ComparePane
                badge={isAr ? "الصورة ب" : "Photo B"}
                badgeClass="bg-[var(--gym-lime,#fb5001)] text-[var(--gym-ink,#111111)]"
                photo={photoB}
                options={filteredPhotos}
                onSelect={setPhotoBId}
                locale={locale}
                isAr={isAr}
              />
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body,
  )
}

function ComparePane({
  badge,
  badgeClass,
  photo,
  options,
  onSelect,
  locale,
  isAr,
}: {
  badge: string
  badgeClass: string
  photo: ProgressPhoto | undefined
  options: ProgressPhoto[]
  onSelect: (id: string) => void
  locale: "en" | "ar"
  isAr: boolean
}) {
  return (
    <div className="flex flex-col overflow-hidden rounded-[22px] border border-black/5 bg-[#F9F9F9] p-3.5">
      <div className="mb-2.5 flex flex-wrap items-center justify-between gap-2">
        <span
          className={cn(
            "rounded-full px-3 py-1 text-[11px] font-extrabold",
            badgeClass,
          )}
        >
          {badge}
        </span>
        <select
          value={photo?.id ?? ""}
          onChange={(e) => onSelect(e.target.value)}
          className="max-w-full rounded-xl border border-black/10 bg-white px-2.5 py-1 text-[12px] font-bold text-[var(--gym-ink,#111111)] outline-none"
          aria-label={isAr ? "اختر صورة" : "Choose photo"}
        >
          {options.map((p) => (
            <option key={p.id} value={p.id}>
              {formatDate(p.takenAt, locale)} ·{" "}
              {p.pose?.toUpperCase() || (isAr ? "صورة" : "PHOTO")}
            </option>
          ))}
        </select>
      </div>

      <div className="relative flex aspect-[3/4] w-full items-center justify-center overflow-hidden rounded-2xl bg-[var(--gym-ink,#111111)] shadow-xs">
        {photo ? <ProgressPhotoImage photo={photo} /> : null}
        <span className="absolute bottom-2.5 start-2.5 rounded-lg bg-black/70 px-2 py-1 text-[11px] font-bold text-white backdrop-blur-xs">
          {formatDate(photo?.takenAt || "", locale)}
        </span>
      </div>

      {photo?.caption ? (
        <p className="mt-2 text-[12px] font-medium text-[#6B7280]">
          &ldquo;{photo.caption}&rdquo;
        </p>
      ) : null}
    </div>
  )
}
