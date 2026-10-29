import { useEffect, useId, useState, type FormEvent, type ReactNode } from "react"
import { useNavigate } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { AnimatePresence, motion } from "motion/react"
import { Eye, EyeOff, KeyRound, LogOut, Settings2, X } from "lucide-react"
import { LogoutConfirmDialog } from "@/components/dashboard/LogoutConfirmDialog"
import { APP_ROUTES } from "@/config/constants"
import { useAuth } from "@/features/auth/auth-context"
import { firebaseAuthErrorKey } from "@/features/auth/errors"
import { initials } from "@/lib/format"
import { appToast } from "@/lib/toast"
import { cn } from "@/lib/utils"
import type { Role } from "@/lib/permissions/roles"

const EASE = [0.22, 1, 0.36, 1] as const

type DialogKind = "settings" | "password"

type ProfileMenuProps = {
  onRequestSignOut?: () => void
}

export function ProfileMenu({ onRequestSignOut }: ProfileMenuProps) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { user, signOut, updateAccount, changePassword } = useAuth()
  const menuId = useId()
  const [open, setOpen] = useState(false)
  const [dialog, setDialog] = useState<DialogKind | null>(null)
  const [logoutOpen, setLogoutOpen] = useState(false)

  useEffect(() => {
    if (!open && !dialog) return

    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== "Escape") return
      if (dialog) {
        setDialog(null)
        return
      }
      setOpen(false)
    }

    document.addEventListener("keydown", onKeyDown)
    const previous = document.body.style.overflow
    document.body.style.overflow = "hidden"

    return () => {
      document.removeEventListener("keydown", onKeyDown)
      document.body.style.overflow = previous
    }
  }, [open, dialog])

  if (!user) return null
  const account = user

  const name = account.displayName || t("dashboard.user")
  const roleLabel = t(`dashboard.profile.roles.${account.role as Role}`)

  function closeMenu() {
    setOpen(false)
  }

  function openDialog(kind: DialogKind) {
    setOpen(false)
    setDialog(kind)
  }

  function handleSignOutClick() {
    setOpen(false)
    if (onRequestSignOut) {
      onRequestSignOut()
      return
    }
    setLogoutOpen(true)
  }

  async function handleConfirmSignOut() {
    try {
      await signOut()
      setLogoutOpen(false)
      appToast.success(t("auth.toast.signedOut"))
      navigate(APP_ROUTES.public.login, { replace: true, state: null })
    } catch (error) {
      appToast.error(t(firebaseAuthErrorKey(error)))
    }
  }

  async function handleSettingsSave(displayName: string, phone: string) {
    await updateAccount({ displayName, phone })
    setDialog(null)
    appToast.success(t("dashboard.profile.settingsSaved"))
  }

  async function handlePasswordSave(currentPassword: string, nextPassword: string) {
    await changePassword(currentPassword, nextPassword)
    setDialog(null)
    appToast.success(t("dashboard.profile.passwordUpdated"))
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        aria-label={t("nav.profile")}
        className={cn(
          "inline-flex size-11 items-center justify-center rounded-full bg-[var(--gym-ink,#063434)] text-[13px] font-bold text-white transition-[opacity,box-shadow] hover:opacity-90",
          open && "shadow-[0_0_0_3px_rgba(184,254,34,0.55)]",
        )}
      >
        {initials(name)}
      </button>

      <AnimatePresence>
        {open ? (
          <>
            <motion.div
              key="profile-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
              className="fixed inset-0 z-[70] bg-[var(--gym-ink,#063434)]/30 sm:bg-transparent"
              onClick={closeMenu}
            />
            <motion.div
              key="profile-menu"
              id={menuId}
              role="menu"
              aria-label={t("nav.profile")}
              initial={{ opacity: 0, y: 16, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.98 }}
              transition={{ duration: 0.22, ease: EASE }}
              className={cn(
                "z-[80] overflow-hidden bg-white shadow-[0_22px_60px_rgba(6,52,52,0.16)]",
                "fixed inset-x-3 bottom-[max(12px,env(safe-area-inset-bottom))] rounded-[24px] p-2",
                "sm:absolute sm:inset-x-auto sm:bottom-auto sm:end-0 sm:top-[calc(100%+10px)] sm:w-[300px] sm:rounded-[22px]",
              )}
            >
              <div className="mb-1 flex justify-center sm:hidden">
                <span className="mt-1 mb-2 h-1 w-10 rounded-full bg-[#E5E7EB]" />
              </div>

              <div className="flex items-center gap-3 rounded-[18px] px-3 py-3">
                <span className="inline-flex size-11 shrink-0 items-center justify-center rounded-full bg-[var(--gym-ink,#063434)] text-[13px] font-bold text-[var(--gym-lime,#b8fe22)]">
                  {initials(name)}
                </span>
                <span className="min-w-0">
                  <span className="block truncate font-heading text-[15px] font-extrabold text-[var(--gym-ink,#063434)]">
                    {name}
                  </span>
                  <span className="block truncate text-[12px] font-medium text-[#8c8c8c]">
                    {account.email}
                  </span>
                  <span className="mt-0.5 block truncate text-[11px] font-semibold text-[var(--gym-ink,#063434)]/70">
                    {roleLabel}
                  </span>
                </span>
              </div>

              <div className="my-1 h-px bg-[#F0F0F0]" />

              <MenuItem
                icon={<Settings2 className="size-[18px]" strokeWidth={1.8} />}
                label={t("dashboard.profile.settings")}
                onClick={() => openDialog("settings")}
              />
              <MenuItem
                icon={<KeyRound className="size-[18px]" strokeWidth={1.8} />}
                label={t("dashboard.profile.changePassword")}
                onClick={() => openDialog("password")}
              />

              <div className="my-1 h-px bg-[#F0F0F0]" />

              <MenuItem
                icon={<LogOut className="size-[18px] rtl:-scale-x-100" strokeWidth={1.8} />}
                label={t("nav.logout")}
                danger
                onClick={handleSignOutClick}
              />
            </motion.div>
          </>
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {dialog === "settings" ? (
          <SettingsDialog
            name={account.displayName}
            email={account.email}
            phone={account.phone ?? ""}
            onClose={() => setDialog(null)}
            onSave={handleSettingsSave}
          />
        ) : null}
        {dialog === "password" ? (
          <PasswordDialog onClose={() => setDialog(null)} onSave={handlePasswordSave} />
        ) : null}
      </AnimatePresence>

      <LogoutConfirmDialog
        open={logoutOpen}
        onCancel={() => setLogoutOpen(false)}
        onConfirm={handleConfirmSignOut}
      />
    </div>
  )
}

function MenuItem({
  icon,
  label,
  onClick,
  danger = false,
}: {
  icon: ReactNode
  label: string
  onClick: () => void
  danger?: boolean
}) {
  return (
    <button
      type="button"
      role="menuitem"
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-3 rounded-[16px] px-3 py-3 text-start text-[14px] font-semibold transition-colors",
        danger
          ? "text-[#FF6A55] hover:bg-[#FFE8E4]"
          : "text-[var(--gym-ink,#063434)] hover:bg-[#F4F4F4]",
      )}
    >
      <span className="inline-flex size-[18px] shrink-0 items-center justify-center">{icon}</span>
      {label}
    </button>
  )
}

function DialogShell({
  title,
  onClose,
  children,
}: {
  title: string
  onClose: () => void
  children: ReactNode
}) {
  const { t } = useTranslation()

  return (
    <motion.div
      className="fixed inset-0 z-[90] flex items-end justify-center p-3 sm:items-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.18 }}
    >
      <button
        type="button"
        aria-label={t("nav.closeMenu")}
        className="absolute inset-0 bg-[var(--gym-ink,#063434)]/35"
        onClick={onClose}
      />
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-labelledby="profile-dialog-title"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 16 }}
        transition={{ duration: 0.22, ease: EASE }}
        className="relative max-h-[min(640px,calc(100dvh-24px))] w-full max-w-[420px] overflow-y-auto rounded-[24px] bg-white p-5 shadow-[0_24px_70px_rgba(6,52,52,0.2)] sm:p-6"
      >
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2
            id="profile-dialog-title"
            className="font-heading text-[18px] font-extrabold tracking-tight text-[var(--gym-ink,#063434)]"
          >
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex size-9 items-center justify-center rounded-full bg-[#F4F4F4] text-[var(--gym-ink,#063434)]"
            aria-label={t("nav.closeMenu")}
          >
            <X className="size-4" strokeWidth={1.8} />
          </button>
        </div>
        {children}
      </motion.div>
    </motion.div>
  )
}

function SettingsDialog({
  name,
  email,
  phone,
  onClose,
  onSave,
}: {
  name: string
  email: string
  phone: string
  onClose: () => void
  onSave: (name: string, phone: string) => Promise<void>
}) {
  const { t } = useTranslation()
  const [displayName, setDisplayName] = useState(name)
  const [nextPhone, setNextPhone] = useState(phone)
  const [saving, setSaving] = useState(false)

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const trimmed = displayName.trim()
    if (!trimmed) {
      appToast.error(t("dashboard.profile.nameRequired"))
      return
    }
    setSaving(true)
    try {
      await onSave(trimmed, nextPhone)
    } catch (error) {
      appToast.error(t(firebaseAuthErrorKey(error)))
    } finally {
      setSaving(false)
    }
  }

  return (
    <DialogShell title={t("dashboard.profile.settings")} onClose={onClose}>
      <form className="flex flex-col gap-3.5" onSubmit={onSubmit}>
        <Field
          label={t("dashboard.profile.name")}
          value={displayName}
          onChange={setDisplayName}
          autoComplete="name"
        />
        <Field
          label={t("dashboard.profile.phone")}
          value={nextPhone}
          onChange={setNextPhone}
          autoComplete="tel"
          type="tel"
        />
        <Field label={t("dashboard.profile.email")} value={email} readOnly />
        <DialogActions
          cancelLabel={t("dashboard.profile.cancel")}
          confirmLabel={saving ? t("auth.submitting") : t("dashboard.profile.save")}
          onCancel={onClose}
          disabled={saving}
        />
      </form>
    </DialogShell>
  )
}

function PasswordDialog({
  onClose,
  onSave,
}: {
  onClose: () => void
  onSave: (currentPassword: string, nextPassword: string) => Promise<void>
}) {
  const { t } = useTranslation()
  const [current, setCurrent] = useState("")
  const [next, setNext] = useState("")
  const [confirm, setConfirm] = useState("")
  const [saving, setSaving] = useState(false)

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!current || !next || !confirm) {
      appToast.error(t("auth.toast.invalid"))
      return
    }
    if (next.length < 8) {
      appToast.error(t("dashboard.profile.passwordShort"))
      return
    }
    if (next !== confirm) {
      appToast.error(t("dashboard.profile.passwordMismatch"))
      return
    }
    setSaving(true)
    try {
      await onSave(current, next)
    } catch (error) {
      appToast.error(t(firebaseAuthErrorKey(error)))
    } finally {
      setSaving(false)
    }
  }

  return (
    <DialogShell title={t("dashboard.profile.changePassword")} onClose={onClose}>
      <form className="flex flex-col gap-3.5" onSubmit={onSubmit}>
        <PasswordField
          label={t("dashboard.profile.currentPassword")}
          value={current}
          onChange={setCurrent}
          autoComplete="current-password"
        />
        <PasswordField
          label={t("dashboard.profile.newPassword")}
          value={next}
          onChange={setNext}
          autoComplete="new-password"
        />
        <PasswordField
          label={t("dashboard.profile.confirmPassword")}
          value={confirm}
          onChange={setConfirm}
          autoComplete="new-password"
        />
        <DialogActions
          cancelLabel={t("dashboard.profile.cancel")}
          confirmLabel={saving ? t("auth.submitting") : t("dashboard.profile.updatePassword")}
          onCancel={onClose}
          disabled={saving}
        />
      </form>
    </DialogShell>
  )
}

function Field({
  label,
  value,
  onChange,
  readOnly = false,
  type = "text",
  autoComplete,
}: {
  label: string
  value: string
  onChange?: (value: string) => void
  readOnly?: boolean
  type?: string
  autoComplete?: string
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[12px] font-bold text-[var(--gym-ink,#063434)]">
        {label}
      </span>
      <input
        type={type}
        value={value}
        readOnly={readOnly}
        autoComplete={autoComplete}
        onChange={onChange ? (event) => onChange(event.target.value) : undefined}
        className={cn(
          "h-11 w-full rounded-[14px] border border-[var(--gym-ink,#063434)]/12 bg-[#F4F4F4] px-3.5 text-[14px] font-medium text-[var(--gym-ink,#063434)] outline-none",
          readOnly
            ? "cursor-default text-[#8c8c8c]"
            : "focus:border-[var(--gym-ink,#063434)]/25 focus:bg-white",
        )}
      />
    </label>
  )
}

function PasswordField({
  label,
  value,
  onChange,
  autoComplete,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  autoComplete?: string
}) {
  const { t } = useTranslation()
  const [show, setShow] = useState(false)

  return (
    <label className="block">
      <span className="mb-1.5 block text-[12px] font-bold text-[var(--gym-ink,#063434)]">
        {label}
      </span>
      <span className="relative block">
        <input
          type={show ? "text" : "password"}
          value={value}
          autoComplete={autoComplete}
          onChange={(event) => onChange(event.target.value)}
          className="h-11 w-full rounded-[14px] border border-[var(--gym-ink,#063434)]/12 bg-[#F4F4F4] pe-11 ps-3.5 text-[14px] font-medium text-[var(--gym-ink,#063434)] outline-none focus:border-[var(--gym-ink,#063434)]/25 focus:bg-white"
        />
        <button
          type="button"
          onClick={() => setShow((prev) => !prev)}
          className="absolute inset-y-0 end-0 inline-flex w-11 items-center justify-center text-[#8c8c8c]"
          aria-label={show ? t("auth.hidePassword") : t("auth.showPassword")}
        >
          {show ? <EyeOff className="size-4" strokeWidth={1.8} /> : <Eye className="size-4" strokeWidth={1.8} />}
        </button>
      </span>
    </label>
  )
}

function DialogActions({
  cancelLabel,
  confirmLabel,
  onCancel,
  disabled = false,
}: {
  cancelLabel: string
  confirmLabel: string
  onCancel: () => void
  disabled?: boolean
}) {
  return (
    <div className="mt-1 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
      <button
        type="button"
        onClick={onCancel}
        disabled={disabled}
        className="inline-flex h-11 items-center justify-center rounded-full px-4 text-[13px] font-bold text-[var(--gym-ink,#063434)] hover:bg-[#F4F4F4] disabled:opacity-50"
      >
        {cancelLabel}
      </button>
      <button
        type="submit"
        disabled={disabled}
        className="inline-flex h-11 items-center justify-center rounded-full bg-[var(--gym-ink,#063434)] px-5 text-[13px] font-bold text-white disabled:opacity-50"
      >
        {confirmLabel}
      </button>
    </div>
  )
}
