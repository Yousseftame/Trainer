import { useEffect, useMemo, useState } from "react"
import { createPortal } from "react-dom"
import { Check, Link2, ShieldCheck, Users, X } from "lucide-react"
import {
  defaultEntitlementForCategory,
  evaluateSubscriberContentAccess,
  type DemoContentAsset,
} from "@/features/content/demo"
import type { UpdateContentAssociationsInput } from "@/features/content/service"
import { DEMO_NUTRITION } from "@/features/nutrition/demo"
import {
  subscriberDisplayName,
  type DemoSubscriber,
} from "@/features/subscribers/demo"
import type { DemoPackage } from "@/features/subscriptions/demo"
import { DEMO_WORKOUTS } from "@/features/workouts/demo"
import { useLocale } from "@/hooks/useLocale"
import { cn } from "@/lib/utils"
import type { ContentVisibility } from "@/types/content"
import type { PackageEntitlementKey } from "@/types/subscription"

type ContentAssociationDialogProps = {
  open: boolean
  asset: DemoContentAsset | null
  initialTab?: "programs" | "subscribers" | "packages"
  packages: DemoPackage[]
  subscribers: DemoSubscriber[]
  busy?: boolean
  onClose: () => void
  onSave: (input: UpdateContentAssociationsInput) => Promise<unknown>
}

const ENTITLEMENT_OPTIONS: Array<{
  id: PackageEntitlementKey
  ar: string
  en: string
}> = [
  { id: "exerciseVideos", ar: "مكتبة الفيديوهات التعليمية", en: "Exercise video library" },
  { id: "workoutProgram", ar: "برامج التمارين", en: "Workout programs" },
  { id: "nutritionProgram", ar: "برامج التغذية", en: "Nutrition programs" },
  { id: "pdfDocuments", ar: "ملفات PDF والمستندات", en: "PDFs & educational docs" },
  { id: "progressTracking", ar: "تتبع التقدم", en: "Progress tracking" },
]

export function ContentAssociationDialog({
  open,
  asset,
  initialTab = "programs",
  packages,
  subscribers,
  busy = false,
  onClose,
  onSave,
}: ContentAssociationDialogProps) {
  const { locale, isRtl } = useLocale()
  const isAr = locale === "ar"

  const [tab, setTab] = useState<"programs" | "subscribers" | "packages">(
    initialTab,
  )
  const [visibility, setVisibility] = useState<ContentVisibility>("package")
  const [requiredEntitlement, setRequiredEntitlement] =
    useState<PackageEntitlementKey>("exerciseVideos")
  const [packageIds, setPackageIds] = useState<string[]>([])
  const [subscriberIds, setSubscriberIds] = useState<string[]>([])
  const [programIds, setProgramIds] = useState<string[]>([])
  const [exerciseNamesText, setExerciseNamesText] = useState("")

  const allPrograms = useMemo(
    () => [
      ...DEMO_WORKOUTS.map((p) => ({
        id: p.id,
        title: p.title,
        domain: "workout" as const,
        status: p.status,
      })),
      ...DEMO_NUTRITION.map((p) => ({
        id: p.id,
        title: p.title,
        domain: "nutrition" as const,
        status: p.status,
      })),
    ],
    [],
  )

  useEffect(() => {
    if (!open || !asset) return
    setTab(initialTab)
    setVisibility(asset.visibility)
    setRequiredEntitlement(
      asset.requiredEntitlement ?? defaultEntitlementForCategory(asset.category),
    )
    setPackageIds(asset.packageIds ?? [])
    setSubscriberIds(asset.subscriberIds ?? [])
    setProgramIds(asset.programIds ?? [])
    setExerciseNamesText((asset.exerciseNames ?? []).join(", "))
  }, [open, asset, initialTab])

  if (!open || !asset || typeof document === "undefined") return null

  function toggleItem(
    list: string[],
    id: string,
    setter: (v: string[]) => void,
  ) {
    setter(list.includes(id) ? list.filter((x) => x !== id) : [...list, id])
  }

  // Simulated draft asset to evaluate subscriber access in real time inside the modal
  const draftAsset: DemoContentAsset = {
    ...asset,
    visibility,
    requiredEntitlement,
    packageIds,
    subscriberIds,
    programIds,
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    if (!asset) return

    await onSave({
      assetId: asset.id,
      visibility,
      requiredEntitlement,
      packageIds,
      subscriberIds,
      programIds,
      exerciseNames:
        asset.kind === "video"
          ? exerciseNamesText
              .split(/[,،]/)
              .map((s) => s.trim())
              .filter(Boolean)
          : asset.exerciseNames,
    })
  }

  return createPortal(
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center bg-black/55 p-3 backdrop-blur-[2px] sm:p-5"
      onClick={() => {
        if (!busy) onClose()
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        dir={isRtl ? "rtl" : "ltr"}
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-[28px] bg-white shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-black/8 px-6 py-4 sm:px-7">
          <div className="flex items-center gap-3">
            <span className="inline-flex size-10 items-center justify-center rounded-2xl bg-[var(--gym-ink,#111111)] text-[var(--gym-lime,#fb5001)]">
              <Link2 className="size-5" strokeWidth={2} />
            </span>
            <div>
              <h2 className="font-heading text-[18px] font-extrabold text-[var(--gym-ink,#111111)]">
                {isAr
                  ? "ربط المحتوى والتحكم بصلاحيات الوصول"
                  : "Associate content & manage access rules"}
              </h2>
              <p className="text-[12px] font-medium text-[#8c8c8c]">
                {asset.title[locale]} · <span className="font-mono">{asset.storagePath}</span>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            className="inline-flex size-9 items-center justify-center rounded-full bg-[#F4F4F4] text-[#6B7280] transition hover:bg-black/10"
          >
            <X className="size-4" strokeWidth={2} />
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          className="no-scrollbar flex-1 space-y-5 overflow-y-auto px-6 py-5 sm:px-7"
        >
          {/* Access Rule & Required Entitlement */}
          <div className="grid gap-3 rounded-2xl bg-[#F4F4F4] p-4 sm:grid-cols-2">
            <label className="flex flex-col gap-1">
              <span className="text-[11px] font-bold text-[#6B7280]">
                {isAr ? "قاعدة الظهور والوصول" : "Visibility rule"}
              </span>
              <select
                value={visibility}
                onChange={(e) =>
                  setVisibility(e.target.value as ContentVisibility)
                }
                className="h-10 rounded-xl bg-white px-3 text-[12px] font-bold text-[var(--gym-ink,#111111)] outline-none ring-1 ring-black/8"
              >
                <option value="package">
                  {isAr
                    ? "مرتبط بالباقات (Package-gated)"
                    : "Package-gated"}
                </option>
                <option value="assigned">
                  {isAr
                    ? "مخصص لبرامج / مشتركين (Assigned)"
                    : "Assigned only"}
                </option>
                <option value="library">
                  {isAr
                    ? "مكتبة عامة (يتطلب صلاحية الباقة)"
                    : "Library resource"}
                </option>
              </select>
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-[11px] font-bold text-[#6B7280]">
                {isAr
                  ? "صلاحية الاشتراك المطلوبة"
                  : "Required subscription entitlement"}
              </span>
              <select
                value={requiredEntitlement}
                onChange={(e) =>
                  setRequiredEntitlement(
                    e.target.value as PackageEntitlementKey,
                  )
                }
                className="h-10 rounded-xl bg-white px-3 text-[12px] font-bold text-[var(--gym-ink,#111111)] outline-none ring-1 ring-black/8"
              >
                {ENTITLEMENT_OPTIONS.map((opt) => (
                  <option key={opt.id} value={opt.id}>
                    {opt[locale]}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {/* Section Switcher Tabs */}
          <div className="flex flex-wrap gap-2">
            {(
              [
                {
                  id: "programs",
                  ar: `البرامج التدريبية والغذائية (${programIds.length})`,
                  en: `Programs (${programIds.length})`,
                },
                {
                  id: "subscribers",
                  ar: `المشتركون ومعاينة الصلاحيات (${subscriberIds.length})`,
                  en: `Subscribers & Access Check (${subscriberIds.length})`,
                },
                {
                  id: "packages",
                  ar: `الباقات (${packageIds.length})`,
                  en: `Packages (${packageIds.length})`,
                },
              ] as const
            ).map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setTab(item.id)}
                className={cn(
                  "rounded-full px-4 py-2 text-[12px] font-bold transition",
                  tab === item.id
                    ? "bg-[var(--gym-ink,#111111)] text-white"
                    : "bg-[#F4F4F4] text-[#6B7280] hover:bg-black/8",
                )}
              >
                {item[locale]}
              </button>
            ))}
          </div>

          {tab === "programs" ? (
            <div className="space-y-4">
              {asset.kind === "video" ? (
                <label className="flex flex-col gap-1.5">
                  <span className="text-[12px] font-bold text-[#6B7280]">
                    {isAr
                      ? "أسماء التمارين المرتبطة بهذا الفيديو (مفصولة بفاصلة)"
                      : "Exercise names linked to this video (comma-separated)"}
                  </span>
                  <input
                    value={exerciseNamesText}
                    onChange={(e) => setExerciseNamesText(e.target.value)}
                    placeholder="e.g. Barbell bench press, Seated dumbbell press"
                    className="h-11 rounded-2xl bg-[#F4F4F4] px-4 text-[13px] font-medium text-[var(--gym-ink,#111111)] outline-none"
                  />
                </label>
              ) : null}

              <div className="grid gap-2 sm:grid-cols-2">
                {allPrograms.map((prog) => {
                  const selected = programIds.includes(prog.id)
                  return (
                    <button
                      key={prog.id}
                      type="button"
                      onClick={() =>
                        toggleItem(programIds, prog.id, setProgramIds)
                      }
                      className={cn(
                        "flex items-center justify-between gap-3 rounded-2xl border p-3.5 text-start transition",
                        selected
                          ? "border-[var(--gym-ink,#111111)] bg-[var(--gym-ink,#111111)] text-white"
                          : "border-black/8 bg-[#F4F4F4] text-[var(--gym-ink,#111111)] hover:bg-black/5",
                      )}
                    >
                      <div className="min-w-0">
                        <p className="truncate text-[13px] font-bold">
                          {prog.title[locale]}
                        </p>
                        <p
                          className={cn(
                            "text-[11px] font-medium",
                            selected ? "text-white/70" : "text-[#8c8c8c]",
                          )}
                        >
                          {prog.domain === "workout"
                            ? isAr
                              ? "برنامج تمارين"
                              : "Workout program"
                            : isAr
                              ? "برنامج تغذية"
                              : "Nutrition program"}{" "}
                          · {prog.status}
                        </p>
                      </div>
                      <span
                        className={cn(
                          "inline-flex size-5 shrink-0 items-center justify-center rounded-md border",
                          selected
                            ? "border-[var(--gym-lime,#fb5001)] bg-[var(--gym-lime,#fb5001)] text-white"
                            : "border-black/20 bg-white text-transparent",
                        )}
                      >
                        <Check className="size-3" strokeWidth={3} />
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>
          ) : null}

          {tab === "subscribers" ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2 rounded-2xl bg-[#FAFAFA] px-3.5 py-2.5 text-[12px] font-medium text-[#6B7280]">
                <ShieldCheck className="size-4 shrink-0 text-emerald-600" />
                <span>
                  {isAr
                    ? "معاينة حية لصلاحيات الوصول: توضح حالة وصول كل مشترك بناءً على حسابه واشتراكه وباقته الحالية."
                    : "Live entitlement inspector: shows each subscriber's effective access based on their active subscription and package."}
                </span>
              </div>
              <div className="grid gap-2">
                {subscribers.map((sub) => {
                  const selected = subscriberIds.includes(sub.id)
                  const access = evaluateSubscriberContentAccess(
                    draftAsset,
                    sub.id,
                  )
                  return (
                    <div
                      key={sub.id}
                      className={cn(
                        "flex flex-wrap items-center justify-between gap-3 rounded-2xl border p-3.5 transition",
                        selected
                          ? "border-[var(--gym-ink,#111111)] bg-[#F9FAFB]"
                          : "border-black/8 bg-white",
                      )}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-[13px] font-bold text-[var(--gym-ink,#111111)]">
                            {subscriberDisplayName(sub, locale)}
                          </p>
                          <span
                            className={cn(
                              "rounded-full px-2 py-0.5 text-[10px] font-bold",
                              access.allowed
                                ? "bg-emerald-50 text-emerald-700"
                                : "bg-amber-50 text-amber-800",
                            )}
                          >
                            {access.allowed
                              ? isAr
                                ? "مسموح بالوصول"
                                : "Access granted"
                              : isAr
                                ? "مقيّد"
                                : "Restricted"}
                          </span>
                        </div>
                        <p className="mt-0.5 text-[11px] font-medium text-[#8c8c8c]">
                          {access.reason[locale]}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          toggleItem(subscriberIds, sub.id, setSubscriberIds)
                        }
                        className={cn(
                          "inline-flex h-9 items-center gap-1.5 rounded-full px-3.5 text-[12px] font-bold transition",
                          selected
                            ? "bg-[var(--gym-ink,#111111)] text-white"
                            : "bg-[#F4F4F4] text-[var(--gym-ink,#111111)] hover:bg-black/10",
                        )}
                      >
                        <Users className="size-3.5" />
                        {selected
                          ? isAr
                            ? "معيّن مباشرة ✓"
                            : "Directly assigned ✓"
                          : isAr
                            ? "تعيين للمشترك"
                            : "Assign to subscriber"}
                      </button>
                    </div>
                  )
                })}
              </div>
            </div>
          ) : null}

          {tab === "packages" ? (
            <div className="grid gap-2.5 sm:grid-cols-2">
              {packages.map((pkg) => {
                const selected = packageIds.includes(pkg.id)
                return (
                  <button
                    key={pkg.id}
                    type="button"
                    onClick={() =>
                      toggleItem(packageIds, pkg.id, setPackageIds)
                    }
                    className={cn(
                      "flex items-center justify-between gap-3 rounded-2xl border p-4 text-start transition",
                      selected
                        ? "border-[var(--gym-ink,#111111)] bg-[var(--gym-ink,#111111)] text-white"
                        : "border-black/8 bg-[#F4F4F4] text-[var(--gym-ink,#111111)] hover:bg-black/5",
                    )}
                  >
                    <div>
                      <p className="text-[14px] font-bold">{pkg.name[locale]}</p>
                      <p
                        className={cn(
                          "text-[12px] font-medium",
                          selected ? "text-white/70" : "text-[#8c8c8c]",
                        )}
                      >
                        {pkg.price[locale]} {pkg.period[locale]}
                      </p>
                    </div>
                    <span
                      className={cn(
                        "inline-flex size-5 shrink-0 items-center justify-center rounded-md border",
                        selected
                          ? "border-[var(--gym-lime,#fb5001)] bg-[var(--gym-lime,#fb5001)] text-white"
                          : "border-black/20 bg-white text-transparent",
                      )}
                    >
                      <Check className="size-3" strokeWidth={3} />
                    </span>
                  </button>
                )
              })}
            </div>
          ) : null}

          <div className="flex items-center justify-end gap-2.5 border-t border-black/8 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={busy}
              className="inline-flex h-11 items-center justify-center rounded-full bg-[#F4F4F4] px-5 text-[13px] font-bold text-[var(--gym-ink,#111111)] transition hover:bg-black/10"
            >
              {isAr ? "إلغاء" : "Cancel"}
            </button>
            <button
              type="submit"
              disabled={busy}
              className="inline-flex h-11 items-center justify-center rounded-full bg-[var(--gym-ink,#111111)] px-6 text-[13px] font-bold text-white transition hover:opacity-95 disabled:opacity-50"
            >
              {busy
                ? isAr
                  ? "جارٍ الحفظ..."
                  : "Saving..."
                : isAr
                  ? "حفظ الارتباطات والصلاحيات"
                  : "Save associations"}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body,
  )
}

