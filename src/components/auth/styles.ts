import { cn } from "@/lib/utils"

/** Shared auth form field styles — used by login / register / forgot password */
export const authLabelClass =
  "mb-2 block font-heading text-[13px] font-semibold text-[var(--gym-ink)]"

export const authInputClass = cn(
  "w-full rounded-[14px] border border-[var(--gym-ink)]/12 bg-[#f5f5f5] px-4 py-3",
  "font-heading text-[15px] text-[var(--gym-ink)] outline-none",
  "placeholder:text-[var(--gym-muted)]/50",
  "transition-[border-color,background-color] duration-300",
  "hover:border-[var(--gym-ink)]/20 hover:bg-[#f0f0f0]",
  "focus:border-[var(--gym-ink)]/30 focus:bg-white"
)

export const authPrimaryBtnClass = cn(
  "inline-flex h-[48px] w-full items-center justify-center rounded-[14px]",
  "bg-[var(--gym-dark,#24030c)] font-heading text-[15px] font-bold text-white",
  "transition-[background-color,opacity] duration-300 ease-out",
  "hover:bg-[#3d0616]",
  "disabled:pointer-events-none disabled:opacity-60"
)

export const authSecondaryBtnClass = cn(
  "inline-flex h-[48px] w-full items-center justify-center gap-2 rounded-[14px]",
  "border border-[var(--gym-ink)]/15 bg-white font-heading text-[15px] font-bold text-[var(--gym-ink)]",
  "transition-[background-color,border-color] duration-300 ease-out",
  "hover:border-[var(--gym-ink)]/30 hover:bg-[#f5f5f5]"
)

export const authLinkClass = cn(
  "font-heading text-[13px] font-semibold text-[var(--gym-ink)]",
  "underline-offset-4 transition-colors duration-200 hover:text-[var(--gym-ink)]/70 hover:underline"
)

export const authPageTitleClass =
  "mt-1.5 font-heading text-[18px] font-semibold text-[var(--gym-ink)]/75 sm:text-[20px]"
