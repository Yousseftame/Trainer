import { createPortal } from "react-dom"
import { Link } from "react-router-dom"
import {
  Check,
  Clapperboard,
  Copy,
  Download,
  ExternalLink,
  FileText,
  FolderTree,
  Lock,
  Printer,
  ShieldCheck,
  X,
} from "lucide-react"
import { useMemo, useState } from "react"
import { APP_ROUTES } from "@/config/constants"
import { useAuth } from "@/features/auth/auth-context"
import {
  evaluateSubscriberContentAccess,
  type DemoContentAsset,
} from "@/features/content/demo"
import { useSubscribersQuery } from "@/features/subscribers/hooks"
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
  const { user, isAdmin } = useAuth()
  const { data: subscribers = [] } = useSubscribersQuery()

  const currentSubscriber = useMemo(() => {
    if (!user) return subscribers[0]
    return (
      subscribers.find(
        (s) =>
          s.id === user.uid ||
          s.email.toLowerCase() === (user.email ?? "").toLowerCase(),
      ) ?? subscribers[0]
    )
  }, [subscribers, user])

  const access = useMemo(() => {
    if (isAdmin) {
      return {
        allowed: true,
        reason: {
          en: "Admin full access",
          ar: "صلاحية المشرف الكاملة",
        },
      }
    }
    if (!asset) {
      return {
        allowed: false,
        reason: { en: "Asset not found", ar: "الملف غير موجود" },
      }
    }
    if (asset.category === "reference") {
      return {
        allowed: false,
        reason: {
          en: "Internal staff reference document — restricted from subscriber access",
          ar: "مستند مرجعي داخلي للفريق — محظور على المشتركين",
        },
      }
    }
    if (!currentSubscriber) {
      return {
        allowed: false,
        reason: {
          en: "Active subscriber account required",
          ar: "يتطلب حساب مشترك نشط",
        },
      }
    }
    return evaluateSubscriberContentAccess(asset, currentSubscriber.id)
  }, [isAdmin, asset, currentSubscriber])

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

  function handlePrintDoc() {
    window.print()
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
          {/* Security Gate Check */}
          {!access.allowed ? (
            <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
              <div className="flex size-16 items-center justify-center rounded-3xl bg-[var(--gym-ink,#111111)] text-[var(--gym-lime,#fb5001)] shadow-xl ring-8 ring-black/5 mb-4">
                <Lock className="size-8" strokeWidth={2.2} />
              </div>
              <h3 className="font-heading text-[20px] font-black text-[var(--gym-ink,#111111)]">
                {isAr ? "المحتوى غير متاح لحسابك" : "Content Restricted"}
              </h3>
              <p className="mt-2 max-w-md text-[13.5px] font-semibold text-[#6B7280]">
                {access.reason[locale]}
              </p>
              <p className="mt-1 max-w-sm text-[12px] text-[#8c8c8c]">
                {isAr
                  ? "للوصول إلى هذه المواد التدريبية المخصصة، يرجى ترقية باقة اشتراكك أو التواصل مع مدربك الشخصي."
                  : "To unlock this training material, please upgrade your subscription or ask your coach."}
              </p>
              <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                <Link
                  to={APP_ROUTES.subscriber.subscription}
                  onClick={onClose}
                  className="inline-flex h-11 items-center justify-center rounded-full bg-[var(--gym-lime,#fb5001)] hover:bg-[#e04500] px-6 text-[13px] font-extrabold text-white shadow-md transition"
                >
                  {isAr ? "ترقية الباقة لفتح المحتوى" : "Upgrade Subscription"}
                </Link>
                <button
                  type="button"
                  onClick={onClose}
                  className="inline-flex h-11 items-center justify-center rounded-full bg-[#F4F4F4] hover:bg-black/10 px-6 text-[13px] font-bold text-[var(--gym-ink,#111111)] transition"
                >
                  {isAr ? "إغلاق" : "Close"}
                </button>
              </div>
            </div>
          ) : (
            <>
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
                  <div className="relative flex aspect-video w-full flex-col items-center justify-center overflow-hidden rounded-2xl bg-[var(--gym-ink,#111111)] p-6 text-center text-white">
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
                <div className="h-[440px] w-full overflow-hidden rounded-2xl border border-black/10 bg-[#F4F4F4]">
                  <iframe
                    src={mediaUrl}
                    title={asset.title[locale]}
                    className="size-full border-0"
                  />
                </div>
              ) : (
                /* Interactive Document Reader View */
                <div className="rounded-2xl border border-black/8 bg-white p-6 shadow-xs space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-black/8 pb-4">
                    <div className="flex items-center gap-3">
                      <span className="inline-flex size-12 items-center justify-center rounded-2xl bg-[var(--gym-ink,#111111)] text-[var(--gym-lime,#fb5001)]">
                        <FileText className="size-6" strokeWidth={1.7} />
                      </span>
                      <div>
                        <p className="font-heading text-[16px] font-extrabold text-[var(--gym-ink,#111111)]">
                          {asset.fileName ?? `${asset.id}.pdf`}
                        </p>
                        <p className="text-[12px] font-semibold text-[#8c8c8c]">
                          {asset.sizeLabel}
                          {asset.pageCount
                            ? ` · ${asset.pageCount} ${isAr ? "صفحة معتمدة" : "certified pages"}`
                            : ""}
                        </p>
                      </div>
                    </div>
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--gym-lime,#fb5001)]/10 px-3 py-1 text-[11px] font-bold text-[var(--gym-lime,#fb5001)]">
                      <ShieldCheck className="size-3.5" />
                      {isAr ? "معتمد وموثّق من المدرب" : "Coach Approved"}
                    </span>
                  </div>

                  <div className="space-y-2">
                    <h4 className="text-[13px] font-bold uppercase tracking-wider text-[#8c8c8c]">
                      {isAr ? "ملخص الدليل الإرشادي" : "Guide Summary & Directives"}
                    </h4>
                    <p className="text-[14px] font-medium leading-relaxed text-[var(--gym-ink,#111111)]">
                      {asset.description[locale]}
                    </p>
                  </div>

                  {/* Highlights Box */}
                  <div className="rounded-xl bg-[#F8F8F8] p-4 text-[12.5px] font-semibold text-[var(--gym-ink,#111111)] space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[#8c8c8c]">
                        {isAr ? "التصنيف:" : "Category:"}
                      </span>
                      <span className="font-bold">
                        {asset.category === "workoutPdf"
                          ? isAr ? "دليل تمارين" : "Workout PDF"
                          : asset.category === "nutritionPdf"
                            ? isAr ? "دليل تغذية" : "Nutrition PDF"
                            : isAr ? "كتيب تعليمي" : "Educational Guide"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[#8c8c8c]">
                        {isAr ? "الكلمات الدلالية:" : "Tags:"}
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {asset.tags.map((t) => (
                          <span key={t} className="rounded-md bg-black/5 px-2 py-0.5 text-[11px]">
                            {t}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Interactive Action: Print / Save */}
                  <div className="flex justify-end pt-2">
                    <button
                      type="button"
                      onClick={handlePrintDoc}
                      className="inline-flex items-center gap-2 rounded-full bg-[var(--gym-ink,#111111)] hover:bg-[var(--gym-lime,#fb5001)] px-5 py-2.5 text-[12.5px] font-bold text-white transition"
                    >
                      <Printer className="size-4" />
                      <span>{isAr ? "طباعة / حفظ كـ PDF" : "Print / Save PDF"}</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Canonical Storage Path & Infrastructure (Admin Staff Only) */}
              {isAdmin ? (
                <div className="rounded-2xl border border-black/8 bg-[#FAFAFA] p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <FolderTree className="size-4 text-[var(--gym-lime,#fb5001)]" />
                      <span className="text-[12px] font-bold text-[var(--gym-ink,#111111)]">
                        {isAr
                          ? "مسار التخزين المنظم (Canonical Storage Path — Admin Only)"
                          : "Canonical Storage Path (Admin Only)"}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={handleCopyPath}
                      className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1 text-[11px] font-bold text-[var(--gym-ink,#111111)] ring-1 ring-black/10 transition hover:bg-black/5"
                    >
                      {copied ? (
                        <Check className="size-3 text-[var(--gym-lime,#fb5001)]" />
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
                    <ShieldCheck className="size-3.5 shrink-0 text-[var(--gym-lime,#fb5001)]" />
                    {isAr
                      ? `صلاحية الوصول المطلوبة: (${asset.requiredEntitlement}) · وضع الظهور: (${asset.visibility})`
                      : `Required entitlement: (${asset.requiredEntitlement}) · Visibility: (${asset.visibility})`}
                  </p>
                </div>
              ) : null}
            </>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2.5 border-t border-black/8 px-6 py-4 sm:px-7">
          <div className="flex flex-wrap gap-2">
            {access.allowed && mediaUrl ? (
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
            {isAdmin && onEdit ? (
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

