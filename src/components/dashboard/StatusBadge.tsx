import { cn } from "@/lib/utils"
import type { SubscriptionStatus } from "@/types/subscription"
import type { UserStatus } from "@/types/user"

type Tone = "success" | "warning" | "danger" | "muted" | "info"

const TONE_CLASS: Record<Tone, string> = {
  success: "bg-[var(--gym-lime,#b8fe22)]/35 text-[var(--gym-ink,#063434)]",
  warning: "bg-[#FFF3D6] text-[#9A6B00]",
  danger: "bg-[#FFE8E4] text-[#C44536]",
  muted: "bg-[#EEEEEE] text-[#6B7280]",
  info: "bg-[var(--gym-ink,#063434)]/8 text-[var(--gym-ink,#063434)]",
}

export function StatusBadge({
  label,
  tone,
  className,
}: {
  label: string
  tone: Tone
  className?: string
}) {
  return (
    <span
      className={cn(
        "inline-flex h-7 items-center rounded-full px-2.5 text-[12px] font-bold whitespace-nowrap",
        TONE_CLASS[tone],
        className,
      )}
    >
      {label}
    </span>
  )
}

export function accountStatusTone(status: UserStatus): Tone {
  if (status === "active") return "success"
  if (status === "pending") return "warning"
  if (status === "suspended" || status === "rejected") return "danger"
  return "muted"
}

export function subscriptionStatusTone(status: SubscriptionStatus): Tone {
  if (status === "active") return "success"
  if (status === "pending") return "warning"
  if (status === "expired") return "muted"
  if (status === "suspended" || status === "cancelled") return "danger"
  return "info"
}
