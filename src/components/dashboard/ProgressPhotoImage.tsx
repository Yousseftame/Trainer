import { Camera } from "lucide-react"
import { useProgressPhotoUrlQuery } from "@/features/progress/hooks"
import { isRenderablePhotoSrc } from "@/features/progress/paths"
import { cn } from "@/lib/utils"
import type { ProgressPhoto } from "@/types/progress"

type ProgressPhotoImageProps = {
  photo: Pick<ProgressPhoto, "storagePath" | "downloadUrl" | "pose" | "caption">
  className?: string
  imgClassName?: string
  alt?: string
}

export function ProgressPhotoImage({
  photo,
  className,
  imgClassName,
  alt,
}: ProgressPhotoImageProps) {
  const immediate =
    (photo.downloadUrl && isRenderablePhotoSrc(photo.downloadUrl)
      ? photo.downloadUrl
      : null) ||
    (isRenderablePhotoSrc(photo.storagePath) ? photo.storagePath : null)

  const { data: resolvedUrl, isLoading } = useProgressPhotoUrlQuery(
    immediate ? null : photo,
  )
  const src = immediate || resolvedUrl || null

  if (src) {
    return (
      <img
        src={src}
        alt={alt || photo.caption || photo.pose || "Progress photo"}
        className={cn("h-full w-full object-cover", imgClassName)}
      />
    )
  }

  return (
    <div
      className={cn(
        "flex h-full w-full flex-col items-center justify-center gap-1 bg-[var(--gym-ink,#111111)] text-white/70",
        className,
      )}
    >
      <Camera className={cn("size-6", isLoading && "animate-pulse")} />
      <span className="text-[10px] font-bold uppercase tracking-[0.08em]">
        {photo.pose || "photo"}
      </span>
    </div>
  )
}
