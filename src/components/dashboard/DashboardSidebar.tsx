import { useEffect, useRef, useState, type ReactNode } from "react"
import { Link, useLocation } from "react-router-dom"
import { AnimatePresence, motion } from "motion/react"
import { useTranslation } from "react-i18next"
import { ChevronDown, ChevronsLeft, LogOut, X } from "lucide-react"
import type { NavItem } from "@/config/navigation"
import { BrandLogo } from "@/components/shared/BrandLogo"
import { useLocale } from "@/hooks/useLocale"
import { cn } from "@/lib/utils"

const SIDEBAR_EASE = "duration-[400ms] ease-[cubic-bezier(0.22,1,0.36,1)]"

type DashboardSidebarProps = {
  items: NavItem[]
  brand: string
  areaLabel: string
  homeTo: string
  mobileOpen: boolean
  collapsed: boolean
  onMobileClose: () => void
  onToggle: () => void
  onSignOut: () => void
}

function childIsActive(pathname: string, item: NavItem, homeTo: string) {
  return isNavActive(pathname, item.to, homeTo)
}

function groupIsActive(pathname: string, item: NavItem, homeTo: string) {
  if (!item.children?.length) return isNavActive(pathname, item.to, homeTo)
  return item.children.some((child) => childIsActive(pathname, child, homeTo))
}

export function DashboardSidebar({
  items,
  brand,
  areaLabel,
  homeTo,
  mobileOpen,
  collapsed,
  onMobileClose,
  onToggle,
  onSignOut,
}: DashboardSidebarProps) {
  const { t } = useTranslation()
  const { locale } = useLocale()
  const location = useLocation()
  const asideRef = useRef<HTMLElement>(null)
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({})

  useEffect(() => {
    setOpenGroups((prev) => {
      const next = { ...prev }
      for (const item of items) {
        if (!item.children?.length) continue
        if (groupIsActive(location.pathname, item, homeTo)) {
          next[item.to] = true
        }
      }
      return next
    })
  }, [location.pathname, items, homeTo])

  useEffect(() => {
    if (!mobileOpen) return
    asideRef.current?.scrollTo({ top: 0 })
  }, [mobileOpen])

  function toggleGroup(key: string) {
    setOpenGroups((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  return (
    <>
      <div
        className={cn(
          "fixed inset-0 z-[60] bg-[var(--gym-ink,#063434)]/30 transition-opacity duration-300 lg:hidden",
          mobileOpen ? "opacity-100" : "pointer-events-none opacity-0",
        )}
        onClick={onMobileClose}
        aria-hidden
      />

      <aside
        ref={asideRef}
        className={cn(
          "fixed inset-y-0 start-0 z-[70] flex h-dvh max-h-dvh shrink-0 flex-col overflow-x-hidden overscroll-none bg-[#F4F4F4] transition-[width,transform,padding] lg:relative lg:h-full lg:max-h-none lg:overflow-y-auto lg:overscroll-auto lg:py-6",
          /* Hide the bar: mobile must not scroll-clip the brand/Overview under the topbar */
          "max-lg:overflow-hidden max-lg:pt-[max(12px,env(safe-area-inset-top))] max-lg:pb-[max(12px,env(safe-area-inset-bottom))]",
          "no-scrollbar",
          SIDEBAR_EASE,
          collapsed ? "lg:w-[76px] lg:px-3" : "lg:w-[340px] lg:px-5",
          "w-[min(340px,88vw)] px-5",
          mobileOpen
            ? "max-lg:translate-x-0"
            : "max-lg:-translate-x-full max-lg:rtl:translate-x-full",
        )}
      >
        <div
          className={cn(
            "mb-3 flex shrink-0 items-center justify-between gap-2 lg:mb-4",
            collapsed ? "lg:h-11 lg:justify-center" : "h-12 px-3",
          )}
        >
          <Link
            to={homeTo}
            onClick={onMobileClose}
            className={cn(
              "relative flex min-w-0 shrink items-center overflow-hidden transition-[width,height]",
              SIDEBAR_EASE,
              collapsed ? "lg:h-11 lg:w-full lg:justify-center" : "h-11 flex-1",
            )}
            aria-label={brand}
          >
            <div
              className={cn(
                "flex min-w-0 flex-col justify-center gap-0.5 transition-opacity",
                SIDEBAR_EASE,
                collapsed ? "lg:opacity-0" : "opacity-100",
              )}
            >
              <BrandLogo className="h-[30px] max-w-[160px]" />
              <span
                className={cn(
                  "min-w-0 text-[11px] font-semibold text-[#8c8c8c]",
                  locale === "ar" ? "tracking-normal" : "tracking-[0.14em] uppercase",
                )}
              >
                {areaLabel}
              </span>
            </div>

            <span
              className={cn(
                "absolute flex items-center justify-center opacity-0 transition-opacity",
                SIDEBAR_EASE,
                collapsed && "lg:opacity-100",
              )}
              aria-hidden
            >
              <BrandLogo className="h-7 max-w-[52px] object-center" />
            </span>
          </Link>

          <button
            type="button"
            onClick={onMobileClose}
            aria-label={t("nav.closeMenu")}
            className="inline-flex size-11 shrink-0 items-center justify-center rounded-full bg-white text-[var(--gym-ink,#063434)] shadow-[0_8px_24px_rgba(6,52,52,0.08)] transition-transform active:scale-[0.97] lg:hidden"
          >
            <X className="size-5" strokeWidth={1.8} />
          </button>
        </div>

        <nav className="flex min-h-0 flex-1 flex-col justify-start gap-0.5 lg:gap-1" aria-label={t("nav.main")}>
          {items.map((item) =>
            item.children?.length ? (
              <SidebarNavGroup
                key={item.labelKey}
                item={item}
                homeTo={homeTo}
                collapsed={collapsed}
                open={Boolean(openGroups[item.to])}
                onToggle={() => toggleGroup(item.to)}
                onNavigate={onMobileClose}
                onExpandSidebar={collapsed ? onToggle : undefined}
              />
            ) : (
              <SidebarNavLink
                key={item.to}
                item={item}
                label={t(item.labelKey)}
                collapsed={collapsed}
                active={isNavActive(location.pathname, item.to, homeTo)}
                onClick={onMobileClose}
              />
            ),
          )}
        </nav>

        <div className="mt-3 flex shrink-0 flex-col gap-0.5 lg:mt-4 lg:gap-1">
          <button
            type="button"
            onClick={onToggle}
            title={collapsed ? t("dashboard.expand") : t("dashboard.collapse")}
            aria-label={collapsed ? t("dashboard.expand") : t("dashboard.collapse")}
            className={cn(navItemClass({ collapsed }), "hidden justify-start lg:flex")}
          >
            <span className="relative inline-flex size-[18px] shrink-0 items-center justify-center">
              <ChevronsLeft
                className={cn(
                  "size-[18px] transition-transform rtl:rotate-180",
                  SIDEBAR_EASE,
                  collapsed && "lg:rotate-180 rtl:lg:rotate-0",
                )}
                strokeWidth={1.8}
              />
            </span>
            <SidebarLabel collapsed={collapsed}>
              {collapsed ? t("dashboard.expand") : t("dashboard.collapse")}
            </SidebarLabel>
          </button>

          <button
            type="button"
            onClick={onMobileClose}
            title={t("nav.closeMenu")}
            aria-label={t("nav.closeMenu")}
            className={cn(navItemClass({ collapsed: false }), "justify-start lg:hidden")}
          >
            <span className="relative inline-flex size-[18px] shrink-0 items-center justify-center">
              <ChevronsLeft
                className="size-[18px] rtl:rotate-180"
                strokeWidth={1.8}
              />
            </span>
            <SidebarLabel collapsed={false}>{t("dashboard.collapse")}</SidebarLabel>
          </button>

          <button
            type="button"
            onClick={onSignOut}
            title={t("nav.logout")}
            className={cn(navItemClass({ collapsed, danger: true }), "justify-start")}
          >
            <span className="relative inline-flex size-[18px] shrink-0 items-center justify-center">
              <LogOut className="size-[18px] rtl:-scale-x-100" strokeWidth={1.8} />
            </span>
            <SidebarLabel collapsed={collapsed}>{t("nav.logout")}</SidebarLabel>
          </button>
        </div>
      </aside>
    </>
  )
}

function SidebarNavGroup({
  item,
  homeTo,
  collapsed,
  open,
  onToggle,
  onNavigate,
  onExpandSidebar,
}: {
  item: NavItem
  homeTo: string
  collapsed: boolean
  open: boolean
  onToggle: () => void
  onNavigate: () => void
  onExpandSidebar?: () => void
}) {
  const { t } = useTranslation()
  const location = useLocation()
  const Icon = item.icon
  const active = groupIsActive(location.pathname, item, homeTo)
  const children = item.children ?? []

  function handleParentClick() {
    if (collapsed && onExpandSidebar) {
      onExpandSidebar()
      onToggle()
      return
    }
    onToggle()
  }

  return (
    <div className="flex flex-col">
      <button
        type="button"
        title={t(item.labelKey)}
        onClick={handleParentClick}
        aria-expanded={open && !collapsed}
        className={cn(navItemClass({ collapsed, active: active && !open }), "justify-start")}
      >
        <span className="relative inline-flex size-[18px] shrink-0 items-center justify-center">
          <Icon className="size-[18px]" strokeWidth={1.8} />
        </span>
        <SidebarLabel collapsed={collapsed}>{t(item.labelKey)}</SidebarLabel>
        <ChevronDown
          className={cn(
            "ms-auto size-4 shrink-0 text-current transition-transform",
            SIDEBAR_EASE,
            open && "rotate-180",
            collapsed && "lg:hidden",
          )}
          strokeWidth={2}
        />
      </button>

      <AnimatePresence initial={false}>
        {open && !collapsed ? (
          <motion.div
            key={`${item.labelKey}-children`}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <div className="ms-4 mt-1 flex flex-col gap-0.5 border-s border-[var(--gym-ink,#063434)]/10 ps-2">
              {children.map((child) => (
                <SidebarNavLink
                  key={child.to}
                  item={child}
                  label={t(child.labelKey)}
                  collapsed={false}
                  active={childIsActive(location.pathname, child, homeTo)}
                  onClick={onNavigate}
                  nested
                />
              ))}
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>

    </div>
  )
}

function SidebarNavLink({
  item,
  label,
  collapsed,
  active,
  onClick,
  nested = false,
}: {
  item: NavItem
  label: string
  collapsed: boolean
  active: boolean
  onClick: () => void
  nested?: boolean
}) {
  const Icon = item.icon

  return (
    <Link
      to={item.to}
      title={label}
      onClick={onClick}
      className={cn(
        navItemClass({ collapsed, active }),
        "justify-start",
        nested && "py-2.5 text-[14px]",
      )}
    >
      <span className="relative inline-flex size-[18px] shrink-0 items-center justify-center">
        <Icon className="size-[18px]" strokeWidth={1.8} />
      </span>
      <SidebarLabel collapsed={collapsed}>{label}</SidebarLabel>
    </Link>
  )
}

function navItemClass({
  collapsed,
  active = false,
  danger = false,
}: {
  collapsed: boolean
  active?: boolean
  danger?: boolean
}) {
  return cn(
    "flex items-center text-[15px] font-medium transition-[width,height,background-color,color,box-shadow,gap,border-radius]",
    SIDEBAR_EASE,
    collapsed
      ? "gap-3 px-3 py-2.5 lg:mx-auto lg:h-11 lg:w-11 lg:justify-center lg:gap-0 lg:rounded-2xl lg:px-0 lg:py-0"
      : "w-full gap-3 rounded-2xl px-3 py-2.5 lg:py-3",
    danger
      ? "text-[#FF6A55] hover:bg-[#FFE8E4] hover:text-[#FF6A55]"
      : active
        ? "bg-white font-semibold text-[var(--gym-ink,#063434)] shadow-[0_8px_24px_rgba(6,52,52,0.08)]"
        : "text-[#6B7280] hover:bg-white/70 hover:text-[var(--gym-ink,#063434)]",
  )
}

function isNavActive(pathname: string, href: string, homeTo: string) {
  if (href === homeTo) return pathname === href
  return pathname === href || pathname.startsWith(`${href}/`)
}

function SidebarLabel({
  collapsed,
  children,
}: {
  collapsed: boolean
  children: ReactNode
}) {
  return (
    <span
      className={cn(
        "grid min-w-0 transition-[grid-template-columns,opacity]",
        SIDEBAR_EASE,
        collapsed ? "lg:grid-cols-[0fr] lg:opacity-0" : "grid-cols-[1fr] opacity-100",
      )}
    >
      <span className="overflow-hidden text-start whitespace-nowrap">{children}</span>
    </span>
  )
}
