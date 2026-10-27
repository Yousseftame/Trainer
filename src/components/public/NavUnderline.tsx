import { cn } from "@/lib/utils"

type NavUnderlineProps = {
  active?: boolean
  className?: string
}

/** Simple lime underline — solid when active, soft fade on hover. */
export function NavUnderline({ active = false, className }: NavUnderlineProps) {
  return (
    <span
      aria-hidden
      className={cn(
        "pointer-events-none absolute inset-x-0 bottom-0 h-[3px] bg-[var(--gym-lime)]",
        "opacity-0 transition-opacity duration-200 ease-out",
        "group-hover:opacity-100 group-focus-visible:opacity-100",
        active && "opacity-100",
        className,
      )}
    />
  )
}
