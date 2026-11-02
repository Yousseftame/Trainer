import { useState, useMemo } from "react"
import { createPortal } from "react-dom"
import { ArrowLeftRight, Camera, X } from "lucide-react"
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

export function PhotoComparisonDialog({
  open,
  photos,
  subscriberName,
  onClose,
}: PhotoComparisonDialogProps) {
  const { locale } = useLocale()
  const isAr = locale === "ar"

  const [selectedPose, setSelectedPose] = useState<ProgressPhotoPose | "all">("all")

  const filteredPhotos = useMemo(() => {
    if (selectedPose === "all") return photos
    return photos.filter((p) => p.pose === selectedPose)
  }, [photos, selectedPose])

  const [photoAId, setPhotoAId] = useState<string>("")
  const [photoBId, setPhotoBId] = useState<string>("")

  // Default photo A to earliest and photo B to latest
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
    return filteredPhotos.length > 1 ? filteredPhotos[filteredPhotos.length - 1] : filteredPhotos[0]
  }, [filteredPhotos, photoBId])

  const daysDiff = useMemo(() => {
    if (!photoA || !photoB) return 0
    const tA = new Date(photoA.takenAt).getTime()
    const tB = new Date(photoB.takenAt).getTime()
    return Math.abs(Math.round((tB - tA) / (1000 * 60 * 60 * 24)))
  }, [photoA, photoB])

  if (!open) return null

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-5">
      {/* Overlay Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
        aria-hidden
      />

      {/* Modal Dialog */}
      <div className="relative z-10 flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-[28px] bg-white shadow-2xl">
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-[#F0F0F0] px-5 py-4 sm:px-7">
          <div className="flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-2xl bg-[var(--gym-ink,#063434)] text-[var(--gym-lime,#b8fe22)]">
              <ArrowLeftRight className="size-5" />
            </span>
            <div>
              <h2 className="font-heading text-[18px] font-extrabold text-[var(--gym-ink,#063434)] sm:text-[20px]">
                {isAr ? "مقارنة صور التقدم جنباً إلى جنب" : "Side-by-Side Photo Comparison"}
              </h2>
              {subscriberName ? (
                <p className="text-[12px] font-bold text-[#8c8c8c]">
                  {subscriberName} · {daysDiff} {isAr ? "يوم بين الصورتين" : "days apart"}
                </p>
              ) : null}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex size-8 items-center justify-center rounded-full bg-[#F4F4F4] text-[#8c8c8c] hover:bg-black/5"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Filter bar: Pose selector */}
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-[#F0F0F0] bg-[#FAFAFA] px-5 py-2.5 sm:px-7">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-[#8c8c8c]">
              {isAr ? "تصفية الوضعية:" : "Filter pose:"}
            </span>
            {(["all", "front", "side", "back"] as const).map((p) => {
              const active = selectedPose === p
              return (
                <button
                  key={p}
                  type="button"
                  onClick={() => setSelectedPose(p)}
                  className={cn(
                    "rounded-full px-3 py-1 text-[11px] font-bold transition",
                    active
                      ? "bg-[var(--gym-ink,#063434)] text-white shadow-xs"
                      : "bg-white text-[#8c8c8c] hover:bg-[#F0F0F0] hover:text-[var(--gym-ink,#063434)]",
                  )}
                >
                  {p === "all"
                    ? isAr ? "الكل" : "All"
                    : isAr
                      ? p === "front" ? "أمامي" : p === "side" ? "جانبي" : "خلفي"
                      : p.toUpperCase()}
                </button>
              )
            })}
          </div>

          <span className="text-[11px] font-bold text-[#8c8c8c]">
            {filteredPhotos.length} {isAr ? "صور متاحة" : "photos available"}
          </span>
        </div>

        {/* Comparison Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {filteredPhotos.length < 2 ? (
            <div className="flex min-h-60 flex-col items-center justify-center rounded-2xl bg-[#F4F4F4] p-6 text-center text-[#8c8c8c]">
              <Camera className="size-10 stroke-[1.5]" />
              <p className="mt-3 font-heading text-[15px] font-bold text-[var(--gym-ink,#063434)]">
                {isAr ? "تحتاج إلى صورتين على الأقل لإجراء المقارنة" : "At least 2 photos required for comparison"}
              </p>
              <p className="mt-1 text-[12px]">
                {isAr ? "قم برفع المزيد من صور التقدم لعرض التغير والتحول البدني." : "Upload more progress check-in photos to view physical transformation."}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {/* Card A: Earlier / Baseline */}
              <div className="flex flex-col overflow-hidden rounded-[22px] border border-black/5 bg-[#F9F9F9] p-3.5">
                <div className="mb-2.5 flex items-center justify-between">
                  <span className="rounded-full bg-[var(--gym-ink,#063434)] px-3 py-1 text-[11px] font-extrabold text-white">
                    {isAr ? "الصورة الأولى (البداية)" : "Photo A (Earlier)"}
                  </span>
                  <select
                    value={photoA?.id}
                    onChange={(e) => setPhotoAId(e.target.value)}
                    className="rounded-xl border border-black/10 bg-white px-2.5 py-1 text-[12px] font-bold text-[var(--gym-ink,#063434)] outline-none"
                  >
                    {filteredPhotos.map((p) => (
                      <option key={p.id} value={p.id}>
                        {formatDate(p.takenAt, locale)} · {p.pose?.toUpperCase()}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="relative flex aspect-[3/4] w-full items-center justify-center overflow-hidden rounded-2xl bg-[var(--gym-ink,#063434)] shadow-xs">
                  {photoA?.storagePath?.startsWith("data:") || photoA?.storagePath?.startsWith("http") ? (
                    <img
                      src={photoA.storagePath}
                      alt="Photo A"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center text-white/80 p-4 text-center">
                      <Camera className="size-10 mb-2 opacity-50" />
                      <span className="font-heading text-[20px] font-extrabold">
                        {photoA?.pose?.toUpperCase()}
                      </span>
                      <span className="text-[12px] opacity-75 mt-1">
                        {formatDate(photoA?.takenAt || "", locale)}
                      </span>
                    </div>
                  )}
                  <span className="absolute bottom-2.5 start-2.5 rounded-lg bg-black/70 px-2 py-1 text-[11px] font-bold text-white backdrop-blur-xs">
                    {formatDate(photoA?.takenAt || "", locale)}
                  </span>
                </div>

                {photoA?.caption ? (
                  <p className="mt-2 text-[12px] font-medium text-[#6B7280]">
                    "{photoA.caption}"
                  </p>
                ) : null}
              </div>

              {/* Card B: Latest / Current */}
              <div className="flex flex-col overflow-hidden rounded-[22px] border border-black/5 bg-[#F9F9F9] p-3.5">
                <div className="mb-2.5 flex items-center justify-between">
                  <span className="rounded-full bg-[var(--gym-lime,#b8fe22)] px-3 py-1 text-[11px] font-extrabold text-[var(--gym-ink,#063434)]">
                    {isAr ? "الصورة الثانية (الحالية)" : "Photo B (Latest)"}
                  </span>
                  <select
                    value={photoB?.id}
                    onChange={(e) => setPhotoBId(e.target.value)}
                    className="rounded-xl border border-black/10 bg-white px-2.5 py-1 text-[12px] font-bold text-[var(--gym-ink,#063434)] outline-none"
                  >
                    {filteredPhotos.map((p) => (
                      <option key={p.id} value={p.id}>
                        {formatDate(p.takenAt, locale)} · {p.pose?.toUpperCase()}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="relative flex aspect-[3/4] w-full items-center justify-center overflow-hidden rounded-2xl bg-[var(--gym-ink,#063434)] shadow-xs">
                  {photoB?.storagePath?.startsWith("data:") || photoB?.storagePath?.startsWith("http") ? (
                    <img
                      src={photoB.storagePath}
                      alt="Photo B"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center text-white/80 p-4 text-center">
                      <Camera className="size-10 mb-2 opacity-50" />
                      <span className="font-heading text-[20px] font-extrabold">
                        {photoB?.pose?.toUpperCase()}
                      </span>
                      <span className="text-[12px] opacity-75 mt-1">
                        {formatDate(photoB?.takenAt || "", locale)}
                      </span>
                    </div>
                  )}
                  <span className="absolute bottom-2.5 start-2.5 rounded-lg bg-black/70 px-2 py-1 text-[11px] font-bold text-white backdrop-blur-xs">
                    {formatDate(photoB?.takenAt || "", locale)}
                  </span>
                </div>

                {photoB?.caption ? (
                  <p className="mt-2 text-[12px] font-medium text-[#6B7280]">
                    "{photoB.caption}"
                  </p>
                ) : null}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body,
  )
}
