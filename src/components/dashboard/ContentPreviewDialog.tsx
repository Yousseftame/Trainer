import { createPortal } from "react-dom"
import {
  Check,
  Clapperboard,
  Copy,
  Download,
  ExternalLink,
  FileText,
  FolderTree,
  ShieldCheck,
  X,
} from "lucide-react"
import { useState } from "react"
import type { DemoContentAsset } from "@/features/content/demo"
import { useLocale } from "@/hooks/useLocale"
import { formatDuration } from "@/lib/format"
import { appToast } from "@/lib/toast"

type ContentPreviewDialogProps = {
  asset: DemoContentAsset | null
  onClose: () => void
  onEdit?: (asset: DemoContentAsset) => void
}

function toEmbedUrl(rawUrl: string): { type: "iframe" | "video"; url: string } {
  const trimmed = rawUrl.trim()
  if (
    trimmed.includes("youtube.com/watch?v=") ||
    trimmed.includes("youtu.be/")
  ) {
    const match =
      trimmed.match(/[?&]v=([^&]+)/)?.[1] ||
      trimmed.match(/youtu\.be\/([^?&]+)/)?.[1]
    if (match) {
      return {
        type: "iframe",
        url: `https://www.youtube.com/embed/${match}`,
      }
    }
  }
  if (trimmed.includes("vimeo.com/") && !trimmed.includes("player.vimeo.com")) {
    const id = trimmed.split("vimeo.com/")[1]?.split(/[?&/]/)[0]
    if (id && /^\d+$/.test(id)) {
      return {
        type: "iframe",
        url: `https://player.vimeo.com/video/${id}`,
      }
    }
  }
  if (
    trimmed.includes("iframe.mediadelivery.net") ||
    trimmed.includes("customer-") ||
    trimmed.includes("/embed/")
  ) {
    return { type: "iframe", url: trimmed }
  }
  return { type: "video", url: trimmed }
}

export function ContentPreviewDialog({
  asset,
  onClose,
  onEdit,
}: ContentPreviewDialogProps) {
  const { locale, isRtl } = useLocale()
  const isAr = locale === "ar"
  const [copied, setCopied] = useState(false)

  if (!asset || typeof document === "undefined") return null

  const mediaUrl = asset.streamUrl || asset.fileUrl

  function handleCopyPath() {
    if (!asset) return
    void navigator.clipboard?.writeText(asset.storagePath)
    setCopied(true)
    appToast.success(
      isAr ? "تم نسخ مسار التخزين" : "Storage path copied to clipboard",
    )
    setTimeout(() => setCopied(false), 1800)
  }

  return createPortal(
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center bg-black/60 p-3 backdrop-blur-[3px] sm:p-5"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        dir={isRtl ? "rtl" : "ltr"}
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-[28px] bg-white shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-black/8 px-6 py-4 sm:px-7">
          <div className="flex min-w-0 items-center gap-3">
            <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-2xl bg-[var(--gym-ink,#111111)] text-[var(--gym-lime,#fb5001)]">
              {asset.kind === "video" ? (
                <Clapperboard className="size-5" strokeWidth={2} />
              ) : (
                <FileText className="size-5" strokeWidth={2} />
              )}
            </span>
            <div className="min-w-0">
              <h2 className="truncate font-heading text-[18px] font-extrabold text-[var(--gym-ink,#111111)]">
                {asset.title[locale]}
              </h2>
              <p className="truncate text-[12px] font-medium text-[#8c8c8c]">
                {asset.fileName ?? asset.id} · {asset.sizeLabel}
                {asset.kind === "video"
                  ? ` · ${formatDuration(asset.durationSeconds)}`
                  : asset.pageCount
                    ? ` · ${asset.pageCount} ${isAr ? "صفحات" : "pages"}`
                    : ""}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex size-9 items-center justify-center rounded-full bg-[#F4F4F4] text-[#6B7280] transition hover:bg-black/10"
          >
            <X className="size-4" strokeWidth={2} />
          </button>
        </div>

        <div className="no-scrollbar flex-1 space-y-4 overflow-y-auto px-6 py-5 sm:px-7">
          {/* Media Player or PDF Viewer */}
          {asset.kind === "video" ? (
            mediaUrl ? (
              (() => {
                const parsed = toEmbedUrl(mediaUrl)
                return parsed.type === "iframe" ? (
                  <div className="aspect-video w-full overflow-hidden rounded-2xl bg-black">
                    <iframe
                      src={parsed.url}
                      title={asset.title[locale]}
                      className="size-full border-0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  </div>
                ) : (
                  <video
                    src={parsed.url}
                    controls
                    className="aspect-video w-full rounded-2xl bg-black object-contain"
                  />
                )
              })()
            ) : (
              <div className="relative flex aspect-video w-full flex-col items-center justify-center overflow-hidden rounded-2xl bg-[var(--gym-ink,#063434)] p-6 text-center text-white">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_25%_80%,rgba(251,80,1,0.28),transparent_48%)]" />
                <Clapperboard
                  className="relative size-12 text-[var(--gym-lime,#fb5001)]"
                  strokeWidth={1.6}
                />
                <p className="relative mt-3 font-heading text-[18px] font-extrabold">
                  {asset.title[locale]}
                </p>
                <p className="relative mt-1 max-w-md text-[13px] text-white/75">
                  {asset.description[locale]}
                </p>
                <div className="relative mt-4 flex flex-wrap items-center justify-center gap-2 text-[11px] font-bold">
                  <span className="rounded-full bg-white/15 px-3 py-1">
                    Provider: {(asset.videoProvider ?? "bunny").toUpperCase()}
                  </span>
                  {asset.videoAssetId ? (
                    <span className="rounded-full bg-white/15 px-3 py-1 font-mono">
                      Asset ID: {asset.videoAssetId}
                    </span>
                  ) : null}
                  <span className="rounded-full bg-white/15 px-3 py-1">
                    {formatDuration(asset.durationSeconds)}
                  </span>
                </div>
              </div>
            )
          ) : mediaUrl ? (
            <div className="h-[420px] w-full overflow-hidden rounded-2xl border border-black/10 bg-[#F4F4F4]">
              <iframe
                src={mediaUrl}
                title={asset.title[locale]}
                className="size-full border-0"
              />
            </div>
          ) : (
            <div className="flex flex-col items-start justify-between gap-4 rounded-2xl bg-[#F4F4F4] p-6">
              <div className="flex items-center gap-3">
                <span className="inline-flex size-12 items-center justify-center rounded-2xl bg-[var(--gym-ink,#111111)] text-white">
                  <FileText className="size-6" strokeWidth={1.7} />
                </span>
                <div>
                  <p className="font-heading text-[16px] font-bold text-[var(--gym-ink,#111111)]">
                    {asset.fileName ?? `${asset.id}.pdf`}
                  </p>
                  <p className="text-[12px] font-medium text-[#6B7280]">
                    {asset.sizeLabel}
                    {asset.pageCount
                      ? ` · ${asset.pageCount} ${isAr ? "صفحة" : "pages"}`
                      : ""}
                  </p>
                </div>
              </div>
              <p className="text-[13px] font-medium leading-relaxed text-[var(--gym-ink,#111111)]">
                {asset.description[locale]}
              </p>
            </div>
          )}

          {/* Storage Path & Infrastructure Card */}
          <div className="rounded-2xl border border-black/8 bg-[#FAFAFA] p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <FolderTree className="size-4 text-[var(--gym-lime,#fb5001)]" />
                <span className="text-[12px] font-bold text-[var(--gym-ink,#111111)]">
                  {isAr
                    ? "مسار التخزين المنظم (Canonical Storage Path)"
                    : "Canonical Storage Path"}
                </span>
              </div>
              <button
                type="button"
                onClick={handleCopyPath}
                className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1 text-[11px] font-bold text-[var(--gym-ink,#111111)] ring-1 ring-black/10 transition hover:bg-black/5"
              >
                {copied ? (
                  <Check className="size-3 text-emerald-600" />
                ) : (
                  <Copy className="size-3" />
                )}
                {copied
                  ? isAr
                    ? "تم النسخ"
                    : "Copied"
                  : isAr
                    ? "نسخ المسار"
                    : "Copy path"}
              </button>
            </div>
            <p
              dir="ltr"
              className="mt-2 break-all rounded-xl bg-white px-3 py-2 font-mono text-[12px] font-semibold text-[var(--gym-ink,#111111)] ring-1 ring-black/6"
            >
              {asset.storagePath}
            </p>
            <p className="mt-2 flex items-center gap-1.5 text-[11px] font-medium text-[#6B7280]">
              <ShieldCheck className="size-3.5 shrink-0 text-emerald-600" />
              {isAr
                ? `صلاحية الوصول المطلوبة: (${asset.requiredEntitlement}) · وضع الظهور: (${asset.visibility})`
                : `Required entitlement: (${asset.requiredEntitlement}) · Visibility: (${asset.visibility})`}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2.5 border-t border-black/8 px-6 py-4 sm:px-7">
          <div className="flex flex-wrap gap-2">
            {mediaUrl ? (
              <a
                href={mediaUrl}
                target="_blank"
                rel="noreferrer"
                download={asset.fileName}
                className="inline-flex h-10 items-center gap-1.5 rounded-full bg-[#F4F4F4] px-4 text-[12px] font-bold text-[var(--gym-ink,#111111)] transition hover:bg-black/10"
              >
                {mediaUrl.startsWith("data:") || mediaUrl.startsWith("blob:") ? (
                  <Download className="size-3.5" />
                ) : (
                  <ExternalLink className="size-3.5" />
                )}
                {isAr ? "فتح / تحميل الملف" : "Open / download file"}
              </a>
            ) : null}
          </div>
          <div className="flex items-center gap-2">
            {onEdit ? (
              <button
                type="button"
                onClick={() => {
                  onClose()
                  onEdit(asset)
                }}
                className="inline-flex h-10 items-center justify-center rounded-full bg-[var(--gym-ink,#111111)] px-5 text-[12px] font-bold text-white transition hover:opacity-95"
              >
                {isAr ? "تعديل بيانات أو رفع ملف" : "Edit / upload file"}
              </button>
            ) : null}
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-10 items-center justify-center rounded-full bg-[#F4F4F4] px-5 text-[12px] font-bold text-[var(--gym-ink,#111111)] transition hover:bg-black/10"
            >
              {isAr ? "إغلاق" : "Close"}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  )
}

