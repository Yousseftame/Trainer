import {
  Ban,
  Calendar,
  CheckCircle2,
  Clock,
  Mail,
  Pencil,
  Phone,
  RotateCcw,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Trash2,
  User,
  X,
  XCircle,
} from "lucide-react"
import { StatusBadge } from "@/components/dashboard/StatusBadge"
import { useLocale } from "@/hooks/useLocale"
import { formatDate, initials } from "@/lib/format"
import { cn } from "@/lib/utils"
import {
  PERMISSION_MODULES,
  type StaffMember,
  type StaffRole,
} from "@/types/staff"

export const STAFF_ROLE_META: Record<
  StaffRole,
  { en: string; ar: string; descEn: string; descAr: string; tone: "info" | "success" | "warning" | "muted" }
> = {
  head_coach: {
    en: "Head Coach",
    ar: "كبير المدربين (المؤسس)",
    descEn: "Owner account with complete, unalterable administrative access across all 10 platform modules.",
    descAr: "حساب المؤسس والمالك بصلاحيات إدارية كاملة وغير قابلة للتقييد عبر كافة أقسام وصفحات المنصة.",
    tone: "info",
  },
  assistant: {
    en: "Assistant Coach",
    ar: "مساعد مدرب إداري",
    descEn: "Manages daily subscriber assignments, registrations, and client communications.",
    descAr: "إدارة تعيينات البرامج اليومية للمشتركين ومتابعة طلبات التسجيل والتواصل.",
    tone: "info",
  },
  trainer: {
    en: "Fitness Trainer",
    ar: "مدرب لياقة وبناء أجسام",
    descEn: "Builds workout programs, exercise video cues, alternatives, and logs workout adherence.",
    descAr: "تصميم جداول التمارين، وتعيين بدائل الأجهزة، ومراجعة سجلات تدريب المشتركين.",
    tone: "success",
  },
  nutritionist: {
    en: "Nutrition Specialist",
    ar: "أخصائي تغذية رياضية",
    descEn: "Builds meal templates, macro allocations, food alternatives, and tracks nutrition adherence.",
    descAr: "إعداد الخطط الغذائية، وتوزيع الماكروز، وتحديد بدائل الأطعمة، ومتابعة الالتزام الغذائي.",
    tone: "warning",
  },
  physiotherapist: {
    en: "Physical Therapist",
    ar: "أخصائي علاج طبيعي وتأهيل",
    descEn: "Assesses movement restrictions, injuries, and prescribes safe gym substitute protocols.",
    descAr: "تشخيص الإصابات، وتحديد موانع الحركة في الجيم، ووصف بروتوكولات التأهيل الآمنة.",
    tone: "info",
  },
}

interface StaffMemberDetailDialogProps {
  open: boolean
  onClose: () => void
  member: StaffMember | null
  onEdit: (member: StaffMember) => void
  onToggleStatus: (member: StaffMember) => void
  onDelete: (member: StaffMember) => void
}

export function StaffMemberDetailDialog({
  open,
  onClose,
  member,
  onEdit,
  onToggleStatus,
  onDelete,
}: StaffMemberDetailDialogProps) {
  const { locale } = useLocale()
  const isAr = locale === "ar"

  if (!open || !member) return null

  const roleMeta = STAFF_ROLE_META[member.role]
  const isHead = member.role === "head_coach"
  const isSuspended = member.status === "suspended"

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div className="relative flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-[26px] bg-white shadow-2xl">
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-black/5 px-6 py-4 bg-[#FAFAFA]">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                "flex size-11 shrink-0 items-center justify-center rounded-2xl font-heading text-[15px] font-extrabold text-white shadow-2xs",
                isHead
                  ? "bg-[var(--gym-ink,#111111)] text-[var(--gym-lime,#fb5001)]"
                  : isSuspended
                    ? "bg-red-700 text-white"
                    : "bg-[var(--gym-ink,#111111)] text-white",
              )}
            >
              {initials(member.displayName)}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="font-heading text-[18px] font-extrabold text-[var(--gym-ink,#111111)]">
                  {member.displayName}
                </h2>
                <StatusBadge
                  label={isAr ? roleMeta.ar : roleMeta.en}
                  tone={isHead ? "info" : roleMeta.tone}
                />
                <StatusBadge
                  label={
                    isSuspended
                      ? isAr
                        ? "محظور / معلق"
                        : "Suspended"
                      : isAr
                        ? "نشط ومصرح"
                        : "Active"
                  }
                  tone={isSuspended ? "danger" : "success"}
                />
              </div>
              <p className="text-[12px] font-medium text-[#8c8c8c]">
                {member.customTitle?.[locale]
                  ? `${member.customTitle[locale]} · `
                  : ""}
                {member.email}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex size-9 items-center justify-center rounded-full text-[#8c8c8c] hover:bg-black/5 hover:text-black transition"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
          {/* Suspended Alert Banner */}
          {isSuspended ? (
            <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-red-900">
              <ShieldAlert className="size-5 shrink-0 text-red-600 mt-0.5" />
              <div className="text-[12.5px] leading-relaxed">
                <p className="font-bold text-red-950">
                  {isAr ? "هذا الحساب محظور حالياً من الوصول" : "This account is currently suspended"}
                </p>
                <p className="mt-0.5 text-red-800">
                  {isAr
                    ? "تم تعطيل صلاحيات تسجيل الدخول لهذا الموظف ولا يمكنه استعراض بيانات المشتركين أو إجراء أي عمليات."
                    : "Login privileges for this member are revoked. They cannot sign in or access any subscriber data."}
                </p>
              </div>
            </div>
          ) : null}

          {/* Section 1: Account Information */}
          <div className="rounded-2xl border border-black/5 bg-[#F9F9F9] p-4 sm:p-5">
            <h3 className="font-heading text-[14px] font-extrabold text-[var(--gym-ink,#111111)] mb-3 flex items-center gap-2">
              <User className="size-4 text-[var(--gym-ink,#111111)]" />
              <span>{isAr ? "بيانات الحساب والاتصال" : "Account & Contact Details"}</span>
            </h3>

            <div className="grid gap-3 sm:grid-cols-2 text-[12.5px]">
              <div className="flex items-center gap-2.5 rounded-xl bg-white p-3 border border-black/5">
                <Mail className="size-4 text-[#8c8c8c] shrink-0" />
                <div className="min-w-0">
                  <span className="block text-[11px] text-[#8c8c8c]">
                    {isAr ? "البريد الإلكتروني (تسجيل الدخول)" : "Login Email"}
                  </span>
                  <span className="font-semibold text-[var(--gym-ink,#111111)] truncate block">
                    {member.email}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2.5 rounded-xl bg-white p-3 border border-black/5">
                <Phone className="size-4 text-[#8c8c8c] shrink-0" />
                <div className="min-w-0">
                  <span className="block text-[11px] text-[#8c8c8c]">
                    {isAr ? "رقم الهاتف" : "Phone Number"}
                  </span>
                  <span className="font-semibold text-[var(--gym-ink,#111111)] truncate block">
                    {member.phone || (isAr ? "غير مسجل" : "Not provided")}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2.5 rounded-xl bg-white p-3 border border-black/5">
                <Calendar className="size-4 text-[#8c8c8c] shrink-0" />
                <div className="min-w-0">
                  <span className="block text-[11px] text-[#8c8c8c]">
                    {isAr ? "تاريخ إنشاء الحساب" : "Account Created"}
                  </span>
                  <span className="font-semibold text-[var(--gym-ink,#111111)] truncate block">
                    {formatDate(member.createdAt, locale)}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2.5 rounded-xl bg-white p-3 border border-black/5">
                <Clock className="size-4 text-[#8c8c8c] shrink-0" />
                <div className="min-w-0">
                  <span className="block text-[11px] text-[#8c8c8c]">
                    {isAr ? "آخر نشاط / تسجيل" : "Last Activity"}
                  </span>
                  <span className="font-semibold text-[var(--gym-ink,#111111)] truncate block">
                    {member.lastLoginAt
                      ? formatDate(member.lastLoginAt, locale)
                      : isAr
                        ? "حديثاً (نشط)"
                        : "Recently active"}
                  </span>
                </div>
              </div>
            </div>

            {/* Role Responsibility Card */}
            <div className="mt-3 rounded-xl bg-white p-3.5 border border-black/5 flex items-start gap-3">
              <Shield className="size-4 text-[var(--gym-ink,#111111)] shrink-0 mt-0.5" />
              <div className="text-[12px] leading-relaxed">
                <span className="font-bold text-[var(--gym-ink,#111111)] block">
                  {isAr ? "طبيعة الدور والمسؤوليات:" : "Role Responsibilities:"}
                </span>
                <span className="text-[#666]">
                  {isAr ? roleMeta.descAr : roleMeta.descEn}
                </span>
              </div>
            </div>
          </div>

          {/* Section 2: Module Permissions Matrix */}
          <div className="rounded-2xl border border-black/5 bg-[#F9F9F9] p-4 sm:p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-heading text-[14px] font-extrabold text-[var(--gym-ink,#111111)] flex items-center gap-2">
                <ShieldCheck className="size-4 text-[var(--gym-ink,#111111)]" />
                <span>{isAr ? "مصفوفة صلاحيات الأقسام والصفحات" : "Module Access & Permissions Matrix"}</span>
              </h3>
              <span className="text-[12px] font-bold text-[#8c8c8c]">
                {isHead
                  ? isAr
                    ? "وصول شامل لكافة الأقسام"
                    : "All 10 Modules Granted"
                  : `${member.permissions.length} ${isAr ? "صلاحيات دقيقة" : "capabilities"}`}
              </span>
            </div>

            <div className="grid gap-2.5 sm:grid-cols-2">
              {PERMISSION_MODULES.map((mod) => {
                const grantedPerms = mod.permissions.filter((p) =>
                  isHead ? true : member.permissions.includes(p.key),
                )
                const hasAccess = isHead || grantedPerms.length > 0
                const isFullAccess = isHead || grantedPerms.length === mod.permissions.length

                return (
                  <div
                    key={mod.moduleId}
                    className={cn(
                      "rounded-xl border p-3 transition flex flex-col justify-between gap-2",
                      hasAccess
                        ? "bg-white border-black/8 shadow-2xs"
                        : "bg-black/[0.02] border-dashed border-black/10 opacity-70",
                    )}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <span className="font-heading text-[13px] font-extrabold text-[var(--gym-ink,#111111)]">
                          {isAr ? mod.title.ar : mod.title.en}
                        </span>
                        {hasAccess ? (
                          <span
                            className={cn(
                              "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-extrabold",
                              isFullAccess
                                ? "bg-emerald-100 text-emerald-900"
                                : "bg-blue-100 text-blue-900",
                            )}
                          >
                            <CheckCircle2 className="size-3" />
                            {isFullAccess
                              ? isAr
                                ? "وصول كامل"
                                : "Full Access"
                              : isAr
                                ? "وصول جزئي"
                                : "Partial"}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-bold text-gray-500">
                            <XCircle className="size-3" />
                            {isAr ? "محجوب" : "No Access"}
                          </span>
                        )}
                      </div>

                      <p className="text-[11px] text-[#8c8c8c] line-clamp-1 mb-2">
                        {isAr ? mod.description.ar : mod.description.en}
                      </p>
                    </div>

                    {/* Permissions list chips */}
                    <div className="flex flex-wrap items-center gap-1 pt-1 border-t border-black/5">
                      {mod.permissions.map((p) => {
                        const isPermitted = isHead || member.permissions.includes(p.key)
                        return (
                          <span
                            key={p.key}
                            className={cn(
                              "inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-medium",
                              isPermitted
                                ? "bg-emerald-50 text-emerald-800 border border-emerald-200/60 font-semibold"
                                : "bg-black/5 text-[#999] line-through opacity-50",
                            )}
                            title={isAr ? p.description.ar : p.description.en}
                          >
                            {isPermitted ? "✓" : "×"} {isAr ? p.label.ar : p.label.en}
                          </span>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Section 3: Internal Notes */}
          {member.notes ? (
            <div className="rounded-2xl border border-black/5 bg-[#F9F9F9] p-4">
              <h4 className="text-[12px] font-bold text-[var(--gym-ink,#111111)] mb-1">
                {isAr ? "ملاحظات وتوجيهات إدارية:" : "Administrative Notes:"}
              </h4>
              <p className="text-[12.5px] text-[#555] leading-relaxed">
                {member.notes}
              </p>
            </div>
          ) : null}
        </div>

        {/* Footer Actions */}
        <div className="flex shrink-0 flex-wrap items-center justify-between gap-2.5 border-t border-black/5 bg-[#FAFAFA] px-6 py-4">
          <div className="flex items-center gap-2">
            {/* Edit Button */}
            <button
              type="button"
              onClick={() => {
                onClose()
                onEdit(member)
              }}
              className="inline-flex h-10 items-center gap-2 rounded-full bg-[var(--gym-ink,#111111)] px-4 sm:px-5 text-[12.5px] font-bold text-white transition hover:opacity-95 shadow-xs"
            >
              <Pencil className="size-3.5" />
              <span>{isAr ? "تعديل الصلاحيات والحساب" : "Edit Account & Permissions"}</span>
            </button>

            {/* Block / Unblock Toggle */}
            {!isHead ? (
              <button
                type="button"
                onClick={() => {
                  onToggleStatus(member)
                  onClose()
                }}
                className={cn(
                  "inline-flex h-10 items-center gap-1.5 rounded-full px-4 text-[12.5px] font-bold transition border shadow-xs",
                  isSuspended
                    ? "bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border-emerald-200"
                    : "bg-red-50 text-red-700 hover:bg-red-100 border-red-200",
                )}
              >
                {isSuspended ? (
                  <>
                    <RotateCcw className="size-3.5" />
                    <span>{isAr ? "إلغاء الحظر وتفعيل" : "Reactivate"}</span>
                  </>
                ) : (
                  <>
                    <Ban className="size-3.5" />
                    <span>{isAr ? "حظر الحساب" : "Suspend"}</span>
                  </>
                )}
              </button>
            ) : null}

            {/* Delete button (Protected for Head Coach) */}
            {!isHead ? (
              <button
                type="button"
                onClick={() => {
                  onDelete(member)
                  onClose()
                }}
                className="flex size-10 items-center justify-center rounded-full bg-white text-red-600 hover:bg-red-50 border border-black/10 transition shadow-xs"
                title={isAr ? "حذف نهائي" : "Delete Account"}
              >
                <Trash2 className="size-4" />
              </button>
            ) : null}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-10 items-center justify-center rounded-full bg-white px-5 text-[12.5px] font-bold text-[var(--gym-ink,#111111)] border border-black/10 hover:bg-black/5 transition"
          >
            {isAr ? "إغلاق" : "Close"}
          </button>
        </div>
      </div>
    </div>
  )
}
