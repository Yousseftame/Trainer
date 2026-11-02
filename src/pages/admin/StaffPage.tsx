import { useMemo, useState } from "react"
import {
  ChevronDown,
  Plus,
  Search,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Trash2,
  UserCheck,
  UserX,
  Users,
} from "lucide-react"
import { DataTable, TableAction } from "@/components/dashboard/DataTable"
import { FilterChip, StatCard } from "@/components/dashboard/StatCard"
import { StatusBadge } from "@/components/dashboard/StatusBadge"
import { StaffMemberDetailDialog } from "@/components/dashboard/StaffMemberDetailDialog"
import { StaffMemberFormDialog } from "@/components/dashboard/StaffMemberFormDialog"
import {
  useDeleteStaffMemberMutation,
  useSaveStaffMemberMutation,
  useStaffMembersQuery,
  useToggleStaffStatusMutation,
} from "@/features/staff/hooks"
import {
  PERMISSION_MODULES,
  type StaffMember,
  type StaffRole,
  type StaffStatus,
} from "@/types/staff"
import { useDocumentTitle } from "@/hooks/useDocumentTitle"
import { useLocale } from "@/hooks/useLocale"
import { formatDate, initials } from "@/lib/format"
import { appToast } from "@/lib/toast"
import { cn } from "@/lib/utils"

const ROLE_META: Record<
  StaffRole,
  { en: string; ar: string; tone: "info" | "success" | "warning" | "muted" }
> = {
  head_coach: { en: "Head Coach", ar: "كبير المدربين", tone: "info" },
  assistant: { en: "Assistant Coach", ar: "مساعد مدرب", tone: "info" },
  trainer: { en: "Fitness Trainer", ar: "مدرب لياقة", tone: "success" },
  nutritionist: { en: "Nutritionist", ar: "أخصائي تغذية", tone: "warning" },
  physiotherapist: { en: "Physiotherapist", ar: "أخصائي علاج طبيعي", tone: "info" },
}

export function StaffPage() {
  const { locale } = useLocale()
  const isAr = locale === "ar"
  useDocumentTitle(isAr ? "الموظفون والصلاحيات الإدارية" : "Staff & Administrative Permissions")

  const [query, setQuery] = useState("")
  const [roleFilter, setRoleFilter] = useState<StaffRole | "all">("all")
  const [statusFilter, setStatusFilter] = useState<StaffStatus | "all">("all")

  // Modal States
  const [formOpen, setFormOpen] = useState(false)
  const [editingMember, setEditingMember] = useState<StaffMember | null>(null)
  const [detailMember, setDetailMember] = useState<StaffMember | null>(null)

  const { data: staff = [] } = useStaffMembersQuery()
  const saveMutation = useSaveStaffMemberMutation()
  const toggleStatusMutation = useToggleStaffStatusMutation()
  const deleteMutation = useDeleteStaffMemberMutation()

  // Stats
  const stats = useMemo(() => {
    const total = staff.length
    const active = staff.filter((s) => s.status === "active").length
    const suspended = staff.filter((s) => s.status === "suspended").length
    const headCoach = staff.find((s) => s.role === "head_coach")
    return { total, active, suspended, headCoach }
  }, [staff])

  // Filtered List
  const filteredStaff = useMemo(() => {
    const q = query.trim().toLowerCase()
    return staff.filter((member) => {
      if (statusFilter !== "all" && member.status !== statusFilter) return false
      if (roleFilter !== "all" && member.role !== roleFilter) return false
      if (!q) return true

      const name = member.displayName.toLowerCase()
      const email = member.email.toLowerCase()
      const title = member.customTitle?.[locale]?.toLowerCase() || ""
      const roleName = ROLE_META[member.role]?.en.toLowerCase() || ""

      return (
        name.includes(q) ||
        email.includes(q) ||
        title.includes(q) ||
        roleName.includes(q)
      )
    })
  }, [staff, statusFilter, roleFilter, query, locale])

  async function handleToggleStatus(member: StaffMember) {
    if (member.role === "head_coach") {
      appToast.error(
        isAr
          ? "حساب كبير المدربين محمي ولا يمكن حظره أو تعليقه"
          : "Head Coach account is protected and cannot be suspended.",
      )
      return
    }

    const nextStatus = member.status === "active" ? "suspended" : "active"
    const confirmMsg =
      nextStatus === "suspended"
        ? isAr
          ? `هل أنت متأكد من حظر حساب "${member.displayName}"؟ سيتم منعه من تسجيل الدخول فوراً.`
          : `Are you sure you want to suspend "${member.displayName}"? They will be immediately blocked from dashboard access.`
        : isAr
          ? `هل أنت متأكد من إعادة تفعيل حساب "${member.displayName}"؟`
          : `Reactivate "${member.displayName}" account?`

    if (!window.confirm(confirmMsg)) return

    try {
      await toggleStatusMutation.mutateAsync(member.id)
      appToast.success(
        nextStatus === "suspended"
          ? isAr
            ? "تم حظر الحساب بنجاح"
            : "Staff account suspended successfully"
          : isAr
            ? "تمت استعادة وتفعيل الحساب"
            : "Staff account reactivated successfully",
      )
    } catch (err) {
      appToast.error(
        err instanceof Error
          ? err.message
          : isAr
            ? "فشل تحديث حالة الحساب"
            : "Failed to update account status",
      )
    }
  }

  async function handleDelete(member: StaffMember) {
    if (member.role === "head_coach") {
      appToast.error(
        isAr
          ? "لا يمكن حذف حساب كبير المدربين والمؤسس"
          : "The Head Coach account cannot be deleted.",
      )
      return
    }

    const confirmMsg = isAr
      ? `هل أنت متأكد تماماً من حذف حساب "${member.displayName}" نهائياً؟ هذا الإجراء لا يمكن التراجع عنه.`
      : `Are you sure you want to permanently delete "${member.displayName}"? This action cannot be undone.`

    if (!window.confirm(confirmMsg)) return

    try {
      await deleteMutation.mutateAsync(member.id)
      appToast.success(isAr ? "تم حذف حساب الموظف بنجاح" : "Staff account deleted successfully")
    } catch (err) {
      appToast.error(
        err instanceof Error
          ? err.message
          : isAr
            ? "فشل حذف الحساب"
            : "Failed to delete account",
      )
    }
  }

  return (
    <div className="flex flex-col gap-4 sm:gap-5">
      {/* Stat Cards */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
        <StatCard
          label={isAr ? "إجمالي الفريق الإداري" : "Total Staff Members"}
          value={stats.total}
          icon={<Users className="size-4" strokeWidth={1.8} />}
        />
        <StatCard
          label={isAr ? "الحسابات النشطة" : "Active Staff"}
          value={stats.active}
          icon={<UserCheck className="size-4 text-emerald-600" strokeWidth={1.8} />}
        />
        <StatCard
          label={isAr ? "الحسابات المحظورة" : "Suspended Accounts"}
          value={stats.suspended}
          icon={<UserX className="size-4 text-red-500" strokeWidth={1.8} />}
        />
        <StatCard
          label={isAr ? "كبير المدربين (المؤسس)" : "Head Coach Account"}
          value={stats.headCoach ? (isAr ? "مفعل ودائم" : "Protected") : "—"}
          icon={<ShieldCheck className="size-4 text-[var(--gym-ink,#063434)]" strokeWidth={1.8} />}
        />
      </div>

      {/* Security Architecture Notice */}
      <div className="rounded-2xl border border-blue-200/80 bg-blue-50/50 p-4">
        <div className="flex items-start gap-3">
          <ShieldAlert className="size-5 shrink-0 text-blue-700 mt-0.5" />
          <div className="text-[12px] leading-relaxed text-blue-950">
            <p className="font-bold text-[13px] text-blue-950">
              {isAr
                ? "معايير الأمان والتحكم في الوصول (Security & Backend Boundaries)"
                : "Security Architecture & Backend Authorization Boundary"}
            </p>
            <p className="mt-1 text-blue-900/90">
              {isAr
                ? "يحتفظ كبير المدربين بكامل الصلاحيات الإدارية دون قيود. لا تُعد واجهة المستخدم (UI) وحدها حدود الأمان، بل يتم إنفاذ الصلاحيات وحظر الحسابات على مستوى السيرفر وقواعد بيانات Firestore لضمان حماية بيانات المشتركين الحساسة."
                : "The Head Coach retains full administrative privileges. Frontend visibility controls are never treated as the security boundary — permissions, account blocks, and role restrictions are enforced directly through backend Firestore security rules and token claims."}
            </p>
          </div>
        </div>
      </div>

      {/* Main Symmetrical DataTable */}
      <DataTable
        rows={filteredStaff}
        rowKey={(row) => row.id}
        toolbar={
          <div className="flex flex-col gap-3.5">
            {/* Top row: Search input + Role filter dropdown + Action button */}
            <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
              <label className="relative w-full sm:max-w-[340px]">
                <Search className="pointer-events-none absolute start-3.5 top-1/2 size-4 -translate-y-1/2 text-[#8c8c8c]" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={
                    isAr
                      ? "بحث بالاسم أو البريد أو المسمى..."
                      : "Search staff name, email, or role..."
                  }
                  className="h-11 w-full rounded-full bg-[#F4F4F4] pe-4 ps-10 text-[14px] font-medium text-[var(--gym-ink,#063434)] outline-none placeholder:font-normal placeholder:text-[#8c8c8c]"
                />
              </label>

              <div className="flex w-full shrink-0 items-center gap-2 sm:w-auto sm:gap-2.5">
                <div className="relative flex-1 sm:flex-initial inline-flex items-center">
                  <select
                    value={roleFilter}
                    onChange={(e) =>
                      setRoleFilter(e.target.value as StaffRole | "all")
                    }
                    className="h-11 w-full sm:w-auto sm:min-w-[140px] sm:max-w-[190px] cursor-pointer appearance-none rounded-full bg-[#F4F4F4] pe-8 ps-4 text-[13px] font-bold text-[var(--gym-ink,#111111)] outline-none transition hover:bg-black/5 truncate"
                  >
                    <option value="all">
                      {isAr ? "كل الأدوار الإدارية" : "All Staff Roles"}
                    </option>
                    {Object.entries(ROLE_META).map(([key, meta]) => (
                      <option key={key} value={key}>
                        {isAr ? meta.ar : meta.en}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute end-3 size-4 text-[#8c8c8c]" />
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setEditingMember(null)
                    setFormOpen(true)
                  }}
                  className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-full bg-[var(--gym-ink,#063434)] px-4 sm:px-5 text-[13px] font-bold text-white transition hover:opacity-95"
                >
                  <Plus className="size-4" strokeWidth={2} />
                  <span className="whitespace-nowrap">
                    {isAr ? "إضافة موظف جديد" : "Add Staff Member"}
                  </span>
                </button>
              </div>
            </div>

            {/* Bottom row: Filter Chips */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 pt-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              <FilterChip
                active={statusFilter === "all"}
                onClick={() => setStatusFilter("all")}
              >
                {isAr ? "الكل" : "All"} ({staff.length})
              </FilterChip>
              <FilterChip
                active={statusFilter === "active"}
                onClick={() => setStatusFilter("active")}
              >
                {isAr ? "حسابات نشطة" : "Active"} ({stats.active})
              </FilterChip>
              <FilterChip
                active={statusFilter === "suspended"}
                onClick={() => setStatusFilter("suspended")}
              >
                {isAr ? "حسابات محظورة" : "Suspended"} ({stats.suspended})
              </FilterChip>
            </div>
          </div>
        }
        empty={
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <Shield className="size-8 text-[#8c8c8c] mb-2" strokeWidth={1.5} />
            <p className="text-[14px] font-bold text-[var(--gym-ink,#063434)]">
              {isAr ? "لا يوجد موظفون يطابقون هذا البحث" : "No staff members match this filter"}
            </p>
            <p className="mt-1 text-[12px] text-[#8c8c8c]">
              {isAr
                ? "يمكنك إضافة مدربين ومساعدين وتخصيص صلاحياتهم حسب أدوارهم"
                : "Add trainers, nutritionists, or assistants to distribute responsibilities"}
            </p>
          </div>
        }
        columns={[
          {
            id: "member",
            header: isAr ? "الموظف الإداري" : "Staff Member",
            cell: (row) => {
              const isHead = row.role === "head_coach"
              const isSuspended = row.status === "suspended"
              return (
                <div
                  className="flex items-center gap-3 cursor-pointer group"
                  onClick={() => setDetailMember(row)}
                >
                  <div
                    className={cn(
                      "flex size-10 shrink-0 items-center justify-center rounded-2xl font-heading text-[13px] font-extrabold text-white shadow-2xs transition group-hover:scale-105",
                      isHead
                        ? "bg-[var(--gym-ink,#063434)] text-[var(--gym-lime,#b8fe22)]"
                        : isSuspended
                          ? "bg-red-700 text-white"
                          : "bg-[var(--gym-ink,#063434)] text-white",
                    )}
                  >
                    {initials(row.displayName)}
                  </div>
                  <div className="min-w-0">
                    <p className="font-heading text-[14px] font-extrabold text-[var(--gym-ink,#063434)] group-hover:text-[var(--gym-lime,#fb5001)] transition truncate">
                      {row.displayName}
                    </p>
                    <p className="text-[12px] text-[#8c8c8c] truncate">
                      {row.email}
                    </p>
                  </div>
                </div>
              )
            },
          },
          {
            id: "role",
            header: isAr ? "الدور الإداري" : "Role",
            cell: (row) => {
              const meta = ROLE_META[row.role]
              const title = row.customTitle?.[locale]
              return (
                <div className="flex flex-col gap-1">
                  <StatusBadge
                    label={isAr ? meta.ar : meta.en}
                    tone={row.role === "head_coach" ? "info" : meta.tone}
                  />
                  {title ? (
                    <span className="text-[11px] font-semibold text-[#666] line-clamp-1">
                      {title}
                    </span>
                  ) : null}
                </div>
              )
            },
          },
          {
            id: "status",
            header: isAr ? "حالة الحساب" : "Status",
            cell: (row) => (
              <StatusBadge
                label={
                  row.status === "active"
                    ? isAr
                      ? "نشط ومصرح"
                      : "Active"
                    : isAr
                      ? "محظور / معلق"
                      : "Suspended"
                }
                tone={row.status === "active" ? "success" : "danger"}
              />
            ),
          },
          {
            id: "modules",
            header: isAr ? "الأقسام والصلاحيات" : "Module Access",
            cell: (row) => {
              const isHead = row.role === "head_coach"
              const permittedModules = PERMISSION_MODULES.filter((mod) =>
                mod.permissions.some((p) => row.permissions.includes(p.key)),
              )

              if (isHead) {
                return (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--gym-ink,#063434)] px-3 py-1 text-[11px] font-bold text-[var(--gym-lime,#b8fe22)]">
                    <ShieldCheck className="size-3" />
                    <span>{isAr ? "كافة الأقسام (وصول كامل)" : "All Modules (Full)"}</span>
                  </span>
                )
              }

              if (permittedModules.length === 0) {
                return (
                  <span className="text-[11.5px] font-bold text-red-600">
                    {isAr ? "لا توجد صلاحيات" : "No permissions"}
                  </span>
                )
              }

              return (
                <div className="flex items-center gap-1.5">
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200/60 px-2.5 py-0.5 text-[11px] font-bold text-emerald-800">
                    {permittedModules.length} {isAr ? "أقسام مصرحة" : "modules"}
                  </span>
                  <span className="text-[11px] font-medium text-[#8c8c8c]">
                    ({row.permissions.length} {isAr ? "صلاحيات" : "perms"})
                  </span>
                </div>
              )
            },
          },
          {
            id: "joined",
            header: isAr ? "تاريخ الإضافة" : "Added",
            cell: (row) => (
              <span className="text-[12px] font-medium text-[#777]">
                {formatDate(row.createdAt, locale)}
              </span>
            ),
          },
        ]}
        actions={(row) => {
          const isHead = row.role === "head_coach"
          return (
            <div className="flex items-center gap-1.5">
              {/* Display Details Modal Action */}
              <TableAction
                label={isAr ? "عرض التفاصيل" : "View Details"}
                tone="primary"
                onClick={() => setDetailMember(row)}
              />

              {/* Edit Action */}
              <TableAction
                label={isAr ? "تعديل" : "Edit"}
                tone="default"
                onClick={() => {
                  setEditingMember(row)
                  setFormOpen(true)
                }}
              />

              {/* Suspend / Reactivate Action */}
              {!isHead ? (
                <TableAction
                  label={
                    row.status === "active"
                      ? isAr
                        ? "حظر"
                        : "Suspend"
                      : isAr
                        ? "تفعيل"
                        : "Reactivate"
                  }
                  tone={row.status === "active" ? "danger" : "default"}
                  onClick={() => void handleToggleStatus(row)}
                />
              ) : null}

              {/* Delete Action */}
              {!isHead ? (
                <button
                  type="button"
                  onClick={() => void handleDelete(row)}
                  className="flex size-8 items-center justify-center rounded-full text-red-500 hover:bg-red-50 transition"
                  title={isAr ? "حذف الحساب" : "Delete Account"}
                >
                  <Trash2 className="size-4" />
                </button>
              ) : null}
            </div>
          )
        }}
      />

      {/* Staff Display Details Modal */}
      <StaffMemberDetailDialog
        open={Boolean(detailMember)}
        member={detailMember}
        onClose={() => setDetailMember(null)}
        onEdit={(member) => {
          setEditingMember(member)
          setFormOpen(true)
        }}
        onToggleStatus={(member) => {
          void handleToggleStatus(member)
        }}
        onDelete={(member) => {
          void handleDelete(member)
        }}
      />

      {/* Staff Create/Edit Dialog */}
      <StaffMemberFormDialog
        open={formOpen}
        onClose={() => setFormOpen(false)}
        initialMember={editingMember}
        onSave={async (input) => {
          await saveMutation.mutateAsync(input)
        }}
      />
    </div>
  )
}
