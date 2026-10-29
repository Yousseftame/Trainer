import { cn } from "@/lib/utils"

type HamburgerButtonProps = {
  open: boolean
  onClick: () => void
  label: string
  className?: string
}

/** Lime circular control — three lines morph into an X when open. */
export function HamburgerButton({ open, onClick, label, className }: HamburgerButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-expanded={open}
      aria-label={label}
      className={cn(
        "relative inline-flex size-12 shrink-0 items-center justify-center rounded-full bg-[var(--gym-lime)] text-white transition-transform duration-300 ease-out active:scale-95 lg:hidden",
        className,
      )}
    >
      <span className="relative block size-5">
        <span
          className={cn(
            "absolute left-0 block h-[2px] w-5 rounded-full bg-current transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
            open ? "top-1/2 -translate-y-1/2 rotate-45" : "top-[3px]",
          )}
        />
        <span
          className={cn(
            "absolute left-0 top-1/2 block h-[2px] w-5 -translate-y-1/2 rounded-full bg-current transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
            open ? "scale-x-0 opacity-0" : "scale-x-100 opacity-100",
          )}
        />
        <span
          className={cn(
            "absolute left-0 block h-[2px] w-5 rounded-full bg-current transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
            open ? "top-1/2 -translate-y-1/2 -rotate-45" : "bottom-[3px]",
          )}
        />
      </span>
    </button>
  )
}
