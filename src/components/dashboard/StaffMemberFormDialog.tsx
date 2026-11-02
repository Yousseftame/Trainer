import { useState } from "react"
import { createPortal } from "react-dom"
import {
  Check,
  CheckSquare,
  Eye,
  EyeOff,
  KeyRound,
  Shield,
  Square,
  X,
} from "lucide-react"
import { PERMISSIONS, ROLE_PERMISSIONS, type Permission } from "@/lib/permissions/permissions"
import { PERMISSION_MODULES, type StaffMember, type StaffRole, type StaffStatus } from "@/types/staff"
import { useLocale } from "@/hooks/useLocale"
import { appToast } from "@/lib/toast"
import { cn } from "@/lib/utils"

interface StaffMemberFormDialogProps {
  open: boolean
  onClose: () => void
  initialMember?: StaffMember | null
  onSave: (input: {
    id?: string
    displayName: string
    email: string
    password?: string
    phone?: string
    role: StaffRole
    status: StaffStatus
    permissions: Permission[]
    customTitle?: { en: string; ar: string }
    notes?: string
  }) => Promise<unknown>
}

const ROLES_LIST: { key: StaffRole; en: string; ar: string; descEn: string; descAr: string }[] = [
  {
    key: "head_coach",
    en: "Head Coach",
    ar: "كبير المدربين (المؤسس)",
    descEn: "Full unalterable administrative access across all modules.",
    descAr: "صلاحيات إدارية كاملة غير مقيدة على كافة أقسام المنصة.",
  },
  {
    key: "assistant",
    en: "Assistant Coach",
    ar: "مساعد مدرب رئيسي",
    descEn: "Covers subscriber onboarding, workout & nutrition assignments, and reports.",
    descAr: "إدارة المشتركين، تعيين البرامج والخطط، ومتابعة التقارير.",
  },
  {
    key: "trainer",
    en: "Fitness Trainer",
    ar: "مدرب لياقة وبناء أجسام",
    descEn: "Focuses on workout programming, video demos, and progress review.",
    descAr: "تصميم جداول التمارين، شروحات الفيديو، وتتبع أوزان المشتركين.",
  },
  {
    key: "nutritionist",
    en: "Nutrition Specialist",
    ar: "أخصائي تغذية رياضية",
    descEn: "Builds meal templates, calculates macros, and sets food alternatives.",
    descAr: "إعداد خطط التغذية، حساب السعرات والماكروز، وبدائل الأطعمة.",
  },
  {
    key: "physiotherapist",
    en: "Physical Therapist",
    ar: "أخصائي علاج طبيعي وتأهيل",
    descEn: "Assesses movement restrictions, injuries, and prescribes safe gym substitutes.",
    descAr: "تشخيص الإصابات، تحديد موانع الحركة في الجيم، ووصف تمارين التأهيل.",
  },
]

export function StaffMemberFormDialog({
  open,
  onClose,
  initialMember,
  onSave,
}: StaffMemberFormDialogProps) {
  const { locale } = useLocale()
  const isAr = locale === "ar"

  const [displayName, setDisplayName] = useState(initialMember?.displayName || "")
  const [email, setEmail] = useState(initialMember?.email || "")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [phone, setPhone] = useState(initialMember?.phone || "")
  const [role, setRole] = useState<StaffRole>(initialMember?.role || "assistant")
  const [status, setStatus] = useState<StaffStatus>(initialMember?.status || "active")
  const [titleEn, setTitleEn] = useState(initialMember?.customTitle?.en || "")
  const [titleAr, setTitleAr] = useState(initialMember?.customTitle?.ar || "")
  const [notes, setNotes] = useState(initialMember?.notes || "")

  const [selectedPermissions, setSelectedPermissions] = useState<Permission[]>(
    initialMember
      ? [...initialMember.permissions]
      : [...ROLE_PERMISSIONS.assistant],
  )

  const [saving, setSaving] = useState(false)

  if (!open) return null

  const isHeadCoach = role === "head_coach"

  function handleRoleChange(newRole: StaffRole) {
    setRole(newRole)
    if (newRole === "head_coach") {
      setSelectedPermissions([...PERMISSIONS])
      setStatus("active")
    } else {
      setSelectedPermissions([...ROLE_PERMISSIONS[newRole]])
    }
  }

  function togglePermission(perm: Permission) {
    if (isHeadCoach) return
    setSelectedPermissions((prev) =>
      prev.includes(perm) ? prev.filter((p) => p !== perm) : [...prev, perm],
    )
  }

  function toggleModulePermissions(modulePerms: Permission[]) {
    if (isHeadCoach) return
    const allSelected = modulePerms.every((p) => selectedPermissions.includes(p))
    if (allSelected) {
      setSelectedPermissions((prev) =>
        prev.filter((p) => !modulePerms.includes(p)),
      )
    } else {
      const merged = new Set([...selectedPermissions, ...modulePerms])
      setSelectedPermissions(Array.from(merged))
    }
  }

  function selectAll() {
    if (isHeadCoach) return
    setSelectedPermissions([...PERMISSIONS])
  }

  function clearAll() {
    if (isHeadCoach) return
    setSelectedPermissions([])
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!displayName.trim()) {
      appToast.error(isAr ? "يرجى إدخال اسم الموظف" : "Please enter staff member name")
      return
    }
    if (!email.trim() || !email.includes("@")) {
      appToast.error(isAr ? "يرجى إدخال بريد إلكتروني صحيح" : "Please enter a valid email address")
      return
    }
    if (!initialMember && (!password || password.length < 6)) {
      appToast.error(isAr ? "يرجى تعيين كلمة مرور لا تقل عن 6 أحرف" : "Please set a password of at least 6 characters")
      return
    }

    setSaving(true)
    try {
      await onSave({
        id: initialMember?.id,
        displayName: displayName.trim(),
        email: email.trim(),
        password: password.trim() || undefined,
        phone: phone.trim() || undefined,
        role,
        status: isHeadCoach ? "active" : status,
        permissions: isHeadCoach ? [...PERMISSIONS] : selectedPermissions,
        customTitle:
          titleEn.trim() || titleAr.trim()
            ? {
                en: titleEn.trim() || titleAr.trim(),
                ar: titleAr.trim() || titleEn.trim(),
              }
            : undefined,
        notes: notes.trim() || undefined,
      })
      appToast.success(
        initialMember
          ? isAr
            ? "تم تحديث بيانات وصلاحيات الموظف بنجاح"
            : "Staff member permissions updated successfully"
          : isAr
            ? "تم إنشاء حساب الموظف الإداري بنجاح"
            : "Administrative staff account created successfully",
      )
      onClose()
    } catch (err) {
      appToast.error(
        err instanceof Error
          ? err.message
          : isAr
            ? "حدث خطأ أثناء حفظ الحساب"
            : "Failed to save staff member",
      )
    } finally {
      setSaving(false)
    }
  }

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-5">
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />
      <div className="relative flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-[26px] bg-white shadow-2xl">
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-black/5 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-2xl bg-[var(--gym-ink,#063434)] text-white shadow-xs">
              <Shield className="size-5" />
            </div>
            <div>
              <h2 className="font-heading text-[18px] font-extrabold text-[var(--gym-ink,#063434)]">
                {initialMember
                  ? isAr
                    ? "تعديل حساب وصلاحيات الموظف الإداري"
                    : "Edit Staff Member & Permissions"
                  : isAr
                    ? "إضافة موظف إداري وتحديد الصلاحيات"
                    : "Add Administrative Staff Member"}
              </h2>
              <p className="text-[12px] font-medium text-[#8c8c8c]">
                {isAr
                  ? "تحديد الأدوار، وتوزيع صلاحيات الأقسام والصفحات، وحظر الحسابات"
                  : "Define administrative role, assign page module permissions, and manage access"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex size-8 items-center justify-center rounded-full text-[#8c8c8c] hover:bg-black/5 hover:text-black"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex flex-1 flex-col overflow-y-auto p-6 space-y-6">
          {/* Section 1: Basic Information */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <label className="mb-1.5 block text-[12px] font-bold text-[var(--gym-ink,#063434)]">
                {isAr ? "الاسم الكامل" : "Full Name"} *
              </label>
              <input
                type="text"
                required
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="e.g. Captain Youssef Nabil"
                className="h-11 w-full rounded-xl border border-black/10 bg-[#F8F8F8] px-3.5 text-[14px] font-medium text-[var(--gym-ink,#063434)] outline-none focus:border-[var(--gym-ink,#063434)]"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-[12px] font-bold text-[var(--gym-ink,#063434)]">
                {isAr ? "البريد الإلكتروني" : "Email Address"} *
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="staff@derpyfit.com"
                className="h-11 w-full rounded-xl border border-black/10 bg-[#F8F8F8] px-3.5 text-[14px] font-medium text-[var(--gym-ink,#063434)] outline-none focus:border-[var(--gym-ink,#063434)]"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-[12px] font-bold text-[var(--gym-ink,#063434)]">
                {isAr ? "كلمة المرور (تسجيل الدخول)" : "Password (Login)"} {!initialMember ? "*" : ""}
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={
                    initialMember
                      ? isAr
                        ? "اتركه فارغاً للإبقاء"
                        : "Leave empty to keep"
                      : "•••••••• (min 6)"
                  }
                  minLength={initialMember ? undefined : 6}
                  className="h-11 w-full rounded-xl border border-black/10 bg-[#F8F8F8] pe-10 ps-3.5 text-[14px] font-medium text-[var(--gym-ink,#063434)] outline-none focus:border-[var(--gym-ink,#063434)]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute inset-y-0 end-2.5 flex items-center text-[#8c8c8c] hover:text-black"
                >
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-[12px] font-bold text-[var(--gym-ink,#063434)]">
                {isAr ? "رقم الهاتف" : "Phone Number"}
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+20 100 000 0000"
                className="h-11 w-full rounded-xl border border-black/10 bg-[#F8F8F8] px-3.5 text-[14px] font-medium text-[var(--gym-ink,#063434)] outline-none focus:border-[var(--gym-ink,#063434)]"
              />
            </div>
          </div>

          {/* Section 2: Administrative Role & Status */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-[12px] font-bold text-[var(--gym-ink,#063434)]">
                {isAr ? "الدور الإداري (Administrative Role)" : "Administrative Role"} *
              </label>
              <select
                value={role}
                onChange={(e) => handleRoleChange(e.target.value as StaffRole)}
                disabled={initialMember?.role === "head_coach"}
                className="h-11 w-full rounded-xl border border-black/10 bg-[#F8F8F8] px-3.5 text-[14px] font-bold text-[var(--gym-ink,#063434)] outline-none focus:border-[var(--gym-ink,#063434)]"
              >
                {ROLES_LIST.map((r) => (
                  <option key={r.key} value={r.key}>
                    {isAr ? `${r.ar} (${r.en})` : `${r.en} (${r.ar})`}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-[11px] text-[#8c8c8c]">
                {isAr
                  ? ROLES_LIST.find((r) => r.key === role)?.descAr
                  : ROLES_LIST.find((r) => r.key === role)?.descEn}
              </p>
            </div>

            <div>
              <label className="mb-1.5 block text-[12px] font-bold text-[var(--gym-ink,#063434)]">
                {isAr ? "حالة الحساب (Account Status)" : "Account Status"}
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as StaffStatus)}
                disabled={isHeadCoach}
                className="h-11 w-full rounded-xl border border-black/10 bg-[#F8F8F8] px-3.5 text-[14px] font-bold text-[var(--gym-ink,#063434)] outline-none focus:border-[var(--gym-ink,#063434)]"
              >
                <option value="active">{isAr ? "نشط ومفعل (Active)" : "Active (Full access permitted)"}</option>
                <option value="suspended">{isAr ? "محظور / معلق (Suspended)" : "Suspended (Access blocked)"}</option>
              </select>
              {isHeadCoach ? (
                <p className="mt-1 text-[11px] font-bold text-amber-700">
                  {isAr ? "حساب كبير المدربين محمي ولا يمكن حظره أو تعليقه." : "Head Coach account is permanently active and cannot be suspended."}
                </p>
              ) : (
                <p className="mt-1 text-[11px] text-[#8c8c8c]">
                  {isAr
                    ? "عند تعليق الحساب، يتم منع تسجيل الدخول فوراً عبر قواعد الأمان."
                    : "Suspended accounts are immediately blocked from dashboard login and API access."}
                </p>
              )}
            </div>
          </div>

          {/* Section 3: Custom Job Title (Optional) */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-[12px] font-bold text-[var(--gym-ink,#063434)]">
                {isAr ? "المسمى الوظيفي المخصص (إنجليزي)" : "Custom Job Title (EN)"}
              </label>
              <input
                type="text"
                value={titleEn}
                onChange={(e) => setTitleEn(e.target.value)}
                placeholder="e.g. Senior Strength Coach"
                className="h-11 w-full rounded-xl border border-black/10 bg-[#F8F8F8] px-3.5 text-[13px] font-medium text-[var(--gym-ink,#063434)] outline-none"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-[12px] font-bold text-[var(--gym-ink,#063434)]">
                {isAr ? "المسمى الوظيفي المخصص (عربي)" : "Custom Job Title (AR)"}
              </label>
              <input
                type="text"
                value={titleAr}
                onChange={(e) => setTitleAr(e.target.value)}
                placeholder="مثال: كبير مدربي القوة واللياقة"
                className="h-11 w-full rounded-xl border border-black/10 bg-[#F8F8F8] px-3.5 text-[13px] font-medium text-[var(--gym-ink,#063434)] outline-none"
              />
            </div>
          </div>

          {/* Section 4: Module Permissions Matrix */}
          <div className="rounded-[22px] border border-black/10 bg-[#FAFAFA] p-4 sm:p-5 space-y-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-black/5 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <KeyRound className="size-4 text-[var(--gym-ink,#063434)]" />
                  <h3 className="font-heading text-[15px] font-extrabold text-[var(--gym-ink,#063434)]">
                    {isAr ? "مصفوفة صلاحيات الأقسام والصفحات (Module Permissions)" : "Module & Page Permissions Matrix"}
                  </h3>
                </div>
                <p className="mt-0.5 text-[12px] text-[#8c8c8c]">
                  {isHeadCoach
                    ? isAr
                      ? "يمتلك كبير المدربين كافة الصلاحيات على جميع الأقسام تلقائياً."
                      : "Head Coach automatically retains full privileges across all modules."
                    : isAr
                      ? `تم تحديد ${selectedPermissions.length} من إجمالي ${PERMISSIONS.length} صلاحيات لهذا الحساب.`
                      : `${selectedPermissions.length} of ${PERMISSIONS.length} permissions assigned.`}
                </p>
              </div>

              {!isHeadCoach ? (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={selectAll}
                    className="inline-flex items-center gap-1 rounded-lg bg-white px-3 py-1.5 text-[11px] font-bold text-[var(--gym-ink,#063434)] shadow-2xs hover:bg-[#F0F0F0]"
                  >
                    <CheckSquare className="size-3.5" />
                    {isAr ? "تحديد الكل" : "Select All"}
                  </button>
                  <button
                    type="button"
                    onClick={clearAll}
                    className="inline-flex items-center gap-1 rounded-lg bg-white px-3 py-1.5 text-[11px] font-bold text-red-600 shadow-2xs hover:bg-red-50"
                  >
                    <Square className="size-3.5" />
                    {isAr ? "إلغاء التحديد" : "Clear All"}
                  </button>
                </div>
              ) : null}
            </div>

            {/* List of Modules */}
            <div className="space-y-3">
              {PERMISSION_MODULES.map((mod) => {
                const modulePermKeys = mod.permissions.map((p) => p.key)
                const allModuleChecked = modulePermKeys.every((k) =>
                  selectedPermissions.includes(k),
                )
                const someModuleChecked = modulePermKeys.some((k) =>
                  selectedPermissions.includes(k),
                )

                return (
                  <div
                    key={mod.moduleId}
                    className="rounded-xl border border-black/5 bg-white p-3.5 shadow-2xs space-y-3"
                  >
                    <div className="flex items-center justify-between gap-2 border-b border-black/5 pb-2.5">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-heading text-[13px] font-bold text-[var(--gym-ink,#063434)]">
                            {isAr ? mod.title.ar : mod.title.en}
                          </span>
                          <span className="rounded bg-black/5 px-2 py-0.5 text-[10px] font-mono text-[#666]">
                            {mod.pageRoute}
                          </span>
                        </div>
                        <p className="mt-0.5 text-[11px] text-[#8c8c8c]">
                          {isAr ? mod.description.ar : mod.description.en}
                        </p>
                      </div>

                      {!isHeadCoach ? (
                        <button
                          type="button"
                          onClick={() => toggleModulePermissions(modulePermKeys)}
                          className={cn(
                            "rounded-lg px-2.5 py-1 text-[11px] font-bold transition",
                            allModuleChecked
                              ? "bg-emerald-50 text-emerald-800"
                              : someModuleChecked
                                ? "bg-amber-50 text-amber-800"
                                : "bg-[#F4F4F4] text-[#8c8c8c] hover:bg-black/5",
                          )}
                        >
                          {allModuleChecked
                            ? isAr
                              ? "مفعل بالكامل"
                              : "All Enabled"
                            : isAr
                              ? "تفعيل القسم"
                              : "Toggle Module"}
                        </button>
                      ) : (
                        <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-bold text-emerald-800">
                          {isAr ? "مفعل دائم" : "Always Active"}
                        </span>
                      )}
                    </div>

                    {/* Permissions Checkboxes */}
                    <div className="grid gap-2 sm:grid-cols-2">
                      {mod.permissions.map((perm) => {
                        const checked =
                          isHeadCoach || selectedPermissions.includes(perm.key)

                        return (
                          <label
                            key={perm.key}
                            className={cn(
                              "flex items-start gap-2.5 rounded-lg p-2 transition cursor-pointer select-none",
                              checked
                                ? "bg-emerald-50/40 border border-emerald-200/50"
                                : "bg-[#FBFBFB] border border-black/5 hover:bg-[#F5F5F5]",
                              isHeadCoach && "cursor-default opacity-85",
                            )}
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              disabled={isHeadCoach}
                              onChange={() => togglePermission(perm.key)}
                              className="size-4 shrink-0 mt-0.5 rounded text-[var(--gym-ink,#063434)] focus:ring-0"
                            />
                            <div className="min-w-0">
                              <p className="text-[12px] font-bold text-[var(--gym-ink,#063434)]">
                                {isAr ? perm.label.ar : perm.label.en}
                              </p>
                              <p className="text-[10px] leading-relaxed text-[#777]">
                                {isAr ? perm.description.ar : perm.description.en}
                              </p>
                            </div>
                          </label>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Section 5: Administrative Notes */}
          <div>
            <label className="mb-1.5 block text-[12px] font-bold text-[var(--gym-ink,#063434)]">
              {isAr ? "ملاحظات إدارية خاصة بالحساب" : "Administrative Notes (Internal)"}
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder={isAr ? "ملاحظات داخلية حول مسؤوليات الموظف أو أيام العمل..." : "Internal notes regarding roles, shifts, or responsibilities..."}
              className="w-full rounded-xl border border-black/10 bg-[#F8F8F8] p-3 text-[13px] font-medium outline-none focus:border-[var(--gym-ink,#063434)]"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-black/5">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="h-11 rounded-full px-5 text-[13px] font-bold text-[#8c8c8c] hover:bg-black/5"
            >
              {isAr ? "إلغاء" : "Cancel"}
            </button>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-[var(--gym-ink,#063434)] px-6 text-[13px] font-bold text-white transition hover:opacity-95 disabled:opacity-50"
            >
              <Check className="size-4" />
              {saving
                ? isAr
                  ? "جارٍ الحفظ..."
                  : "Saving..."
                : initialMember
                  ? isAr
                    ? "تحديث الحساب"
                    : "Update Member"
                  : isAr
                    ? "إنشاء الحساب"
                    : "Create Member"}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body,
  )
}
