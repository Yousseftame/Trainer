import { useEffect, useMemo, useState, type ReactNode } from "react"
import { Link } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { motion } from "motion/react"
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import {
  Activity,
  Apple,
  Bell,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  Dumbbell,
  Inbox,
  Users,
} from "lucide-react"
import adminBanner from "@/assets/admin.webp"
import { APP_ROUTES } from "@/config/constants"
import { useAuth } from "@/features/auth/auth-context"
import { overviewSnapshot, type PriorityKind } from "@/features/overview"
import { useDocumentTitle } from "@/hooks/useDocumentTitle"
import { useLocale } from "@/hooks/useLocale"
import { formatChartDate, formatDate, initials } from "@/lib/format"
import { cn } from "@/lib/utils"
import type { Permission } from "@/lib/permissions/permissions"

const INK = "var(--gym-ink,#063434)"
const LIME = "var(--gym-lime,#b8fe22)"
const EASE = [0.22, 1, 0.36, 1] as const

const MIX_COLORS: Record<string, string> = {
  active: "#063434",
  expired: "#B8B8B8",
  pending: "#4A7C78",
  suspended: "#7E9198",
}

const KIND_TONE: Record<PriorityKind, string> = {
  request: "bg-[#FFF3D6] text-[#9A6B00]",
  expiring: "bg-[var(--gym-lime,#b8fe22)]/35 text-[var(--gym-ink,#063434)]",
  expired: "bg-[#FFE8E4] text-[#C44536]",
  stale: "bg-[#EEEEEE] text-[#6B7280]",
}

const TOOLTIP_STYLE = {
  background: "#063434",
  border: "none",
  borderRadius: 12,
  color: "#fff",
  fontSize: 12,
  fontWeight: 600,
}

function fadeUp(delay = 0) {
  return {
    initial: { opacity: 0, y: 16 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.48, delay, ease: EASE },
  }
}

function signed(value: number) {
  if (value > 0) return `+${value}`
  if (value < 0) return `−${Math.abs(value)}`
  return "0"
}

export function OverviewPage() {
  const { t } = useTranslation()
  const { locale } = useLocale()
  const { user, hasPermission } = useAuth()
  useDocumentTitle(t("nav.overview"))

  const data = useMemo(() => overviewSnapshot(), [])
  const rtl = locale === "ar"
  const Chevron = rtl ? ChevronLeft : ChevronRight
  const name = user?.displayName ?? ""

  const mix = useMemo(
    () =>
      (["active", "expired", "pending", "suspended"] as const)
        .map((key) => ({
          key,
          value: data.subscriptions[key],
          label: t(`admin.overview.mix.${key}`),
        }))
        .filter((item) => item.value > 0),
    [data.subscriptions, t],
  )

  const trend = useMemo(
    () =>
      data.adherence.trend.map((item) => ({
        date: formatChartDate(item.week, locale),
        workout: item.workout,
        nutrition: item.nutrition,
      })),
    [data.adherence.trend, locale],
  )

  const progressTotal = data.progress.onTrack + data.progress.attention + data.progress.quiet || 1
  const adherenceDelta =
    data.adherence.overall != null && data.adherence.previous != null
      ? data.adherence.overall - data.adherence.previous
      : null
  const checkInDelta = data.checkIns.now - data.checkIns.previous

  const actions = (
    [
      {
        to: APP_ROUTES.admin.registrationRequests,
        permission: "subscribers:approve" as Permission,
        icon: <Inbox className="size-4" strokeWidth={1.8} />,
        title: t("admin.overview.actions.requests"),
        hint: t("admin.overview.actions.requestsHint", { count: data.requests }),
      },
      {
        to: APP_ROUTES.admin.progress,
        permission: "progress:read" as Permission,
        icon: <Activity className="size-4" strokeWidth={1.8} />,
        title: t("admin.overview.actions.progress"),
        hint: t("admin.overview.actions.progressHint"),
      },
      {
        to: APP_ROUTES.admin.subscriptions,
        permission: "subscriptions:manage" as Permission,
        icon: <CreditCard className="size-4" strokeWidth={1.8} />,
        title: t("admin.overview.actions.subscriptions"),
        hint: t("admin.overview.actions.subscriptionsHint"),
      },
      {
        to: APP_ROUTES.admin.reports,
        permission: "reports:read" as Permission,
        icon: <Bell className="size-4" strokeWidth={1.8} />,
        title: t("admin.overview.actions.reports"),
        hint: t("admin.overview.actions.reportsHint"),
      },
    ] as const
  ).filter((item) => hasPermission(item.permission))

  return (
    <div className="flex flex-col gap-4 sm:gap-5">
      <motion.section
        {...fadeUp(0)}
        className="relative isolate overflow-hidden rounded-[22px] bg-[var(--gym-ink,#063434)] sm:rounded-[28px]"
      >
        <img
          src={adminBanner}
          alt=""
          className="absolute inset-0 size-full object-cover object-[68%_center] select-none sm:object-[center_42%]"
          draggable={false}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 sm:hidden"
          style={{
            background:
              "linear-gradient(180deg, rgba(6,52,52,0.28) 0%, rgba(6,52,52,0.42) 40%, rgba(6,52,52,0.82) 100%)",
          }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 hidden sm:block rtl:-scale-x-100"
          style={{
            background:
              "linear-gradient(90deg, #063434 0%, rgba(6,52,52,0.92) 36%, rgba(6,52,52,0.45) 62%, rgba(6,52,52,0.12) 100%)",
          }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 hidden sm:block bg-[linear-gradient(180deg,rgba(6,52,52,0.15)_0%,rgba(6,52,52,0.55)_100%)]"
        />

        <div className="relative z-10 flex flex-col justify-end gap-3 p-4 sm:min-h-[228px] sm:flex-row sm:items-end sm:justify-between sm:gap-5 sm:p-7 lg:min-h-[248px] lg:p-8">
          <div className="min-w-0 max-w-2xl">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--gym-lime,#b8fe22)] sm:text-[11px]">
              {formatDate(data.today, locale)}
            </p>
            <h2 className="mt-1 font-heading text-[22px] font-extrabold leading-[1.12] tracking-tight text-white sm:mt-2 sm:text-[34px] lg:text-[40px]">
              {t("admin.overview.hello", { name })}
            </h2>
            <p className="mt-1.5 max-w-lg text-[12.5px] font-medium leading-snug text-white/80 sm:mt-2 sm:text-[15px] sm:leading-relaxed">
              {t("admin.overview.hint")}
            </p>
          </div>
          {data.queue > 0 && hasPermission("subscribers:approve") ? (
            <Link
              to={APP_ROUTES.admin.registrationRequests}
              className="inline-flex h-10 w-fit shrink-0 items-center justify-center gap-1.5 self-start rounded-full bg-[var(--gym-lime,#b8fe22)] px-4 text-[12.5px] font-bold text-[var(--gym-ink,#063434)] shadow-[0_10px_28px_rgba(184,254,34,0.28)] rtl:self-end sm:h-11 sm:gap-2 sm:self-auto sm:px-5 sm:text-[13px] sm:rtl:self-auto"
            >
              {t("admin.overview.queueCta", { count: data.queue })}
              <Chevron className="size-3.5 sm:size-4" strokeWidth={2} />
            </Link>
          ) : null}
        </div>
      </motion.section>

      <div className="grid grid-cols-2 gap-2 sm:gap-3 lg:grid-cols-4 lg:gap-4">
        <Kpi
          delay={0.04}
          label={t("admin.overview.stats.subscribers")}
          value={data.subscribers.total}
          hint={t("admin.overview.stats.subscribersHint", { count: data.subscribers.active })}
          icon={<Users className="size-4" strokeWidth={1.8} />}
        />
        <Kpi
          delay={0.08}
          label={t("admin.overview.stats.activeSubs")}
          value={data.subscriptions.active}
          hint={t("admin.overview.stats.activeSubsHint", { count: data.subscriptions.expiring })}
          icon={<CreditCard className="size-4" strokeWidth={1.8} />}
        />
        <Kpi
          delay={0.12}
          label={t("admin.overview.stats.adherence")}
          value={data.adherence.overall ?? 0}
          suffix="%"
          delta={adherenceDelta}
          hint={t("admin.overview.stats.vsLastWeek")}
          icon={<Activity className="size-4" strokeWidth={1.8} />}
        />
        <Kpi
          delay={0.16}
          label={t("admin.overview.stats.queue")}
          value={data.queue}
          hint={t("admin.overview.stats.queueHint", { count: data.requests })}
          icon={<Inbox className="size-4" strokeWidth={1.8} />}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.35fr)_minmax(280px,0.85fr)]">
        <motion.section {...fadeUp(0.2)} className="rounded-[24px] bg-white p-4 sm:p-6">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#8c8c8c]">
                {t("admin.overview.charts.adherence")}
              </p>
              <p className="mt-1 text-[13px] font-medium text-[#8c8c8c]">
                {t("admin.overview.charts.adherenceHint")}
              </p>
            </div>
            <div className="flex gap-5">
              <AdherenceRing
                value={data.adherence.workout}
                label={t("admin.overview.charts.workout")}
                color="#063434"
              />
              <AdherenceRing
                value={data.adherence.nutrition}
                label={t("admin.overview.charts.nutrition")}
                color="#7A9A16"
              />
            </div>
          </div>
          <div className="mt-4 h-[220px] w-full sm:h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trend} margin={{ top: 12, right: 8, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="overviewWorkout" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#063434" stopOpacity={0.2} />
                    <stop offset="100%" stopColor="#063434" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="#EFEFEF" strokeDasharray="4 6" vertical={false} />
                <XAxis
                  dataKey="date"
                  tick={{ fill: "#8c8c8c", fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  tickMargin={10}
                  minTickGap={28}
                  interval="preserveStartEnd"
                />
                <YAxis
                  domain={[0, 100]}
                  ticks={[0, 50, 100]}
                  tick={{ fill: "#8c8c8c", fontSize: 11 }}
                  tickFormatter={(value) => `${value}%`}
                  axisLine={false}
                  tickLine={false}
                  tickMargin={8}
                  width={42}
                />
                <Tooltip
                  contentStyle={TOOLTIP_STYLE}
                  formatter={(value, name) => [`${value ?? "—"}%`, String(name)]}
                />
                <Area
                  type="monotone"
                  dataKey="workout"
                  name={t("admin.overview.charts.workout")}
                  stroke={INK}
                  strokeWidth={2.4}
                  fill="url(#overviewWorkout)"
                  dot={{ r: 3, fill: INK, stroke: "#fff", strokeWidth: 2 }}
                  activeDot={{ r: 5 }}
                  connectNulls
                />
                <Area
                  type="monotone"
                  dataKey="nutrition"
                  name={t("admin.overview.charts.nutrition")}
                  stroke={LIME}
                  strokeWidth={2.2}
                  fill="none"
                  dot={{ r: 3, fill: LIME, stroke: "#063434", strokeWidth: 1.4 }}
                  connectNulls
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.section>

        <motion.section {...fadeUp(0.24)} className="flex flex-col rounded-[24px] bg-white p-4 sm:p-6">
          <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#8c8c8c]">
            {t("admin.overview.charts.subscriptions")}
          </p>
          <div className="relative mx-auto mt-2 h-[180px] w-[180px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={mix}
                  dataKey="value"
                  nameKey="label"
                  innerRadius={58}
                  outerRadius={80}
                  paddingAngle={3}
                  stroke="none"
                >
                  {mix.map((item) => (
                    <Cell key={item.key} fill={MIX_COLORS[item.key]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={TOOLTIP_STYLE}
                  formatter={(value, name) => [value ?? 0, String(name)]}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
              <p className="font-heading text-[28px] font-extrabold leading-none text-[var(--gym-ink,#063434)]">
                <Count value={data.subscriptions.active} />
              </p>
              <p className="mt-1 text-[11px] font-bold text-[#8c8c8c]">{t("admin.overview.charts.live")}</p>
            </div>
          </div>
          <ul className="mx-auto mt-auto flex w-full max-w-[240px] flex-col gap-2 pt-3">
            {mix.map((item) => (
              <li key={item.key} className="flex items-center gap-2.5 text-[13px]">
                <span className="size-2.5 shrink-0 rounded-full" style={{ background: MIX_COLORS[item.key] }} />
                <span className="min-w-0 flex-1 font-bold text-[var(--gym-ink,#063434)]">{item.label}</span>
                <span className="font-bold text-[#8c8c8c]">{item.value}</span>
              </li>
            ))}
          </ul>
        </motion.section>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <motion.section {...fadeUp(0.28)} className="rounded-[24px] bg-white p-4 sm:p-6">
          <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#8c8c8c]">
            {t("admin.overview.charts.packages")}
          </p>
          <ul className="mt-5 flex flex-col gap-4">
            {data.packages.map((row, index) => (
              <li key={row.pkg.id}>
                <div className="flex items-baseline justify-between gap-3">
                  <span className="text-[14px] font-bold text-[var(--gym-ink,#063434)]">
                    {row.pkg.name[locale]}
                  </span>
                  <span className="text-[12px] font-semibold text-[#8c8c8c]">
                    {t("admin.overview.charts.seatsOn", { count: row.active, share: row.share })}
                  </span>
                </div>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-[#F4F4F4]">
                  <motion.div
                    className="h-full rounded-full bg-[var(--gym-ink,#063434)]"
                    initial={{ width: 0 }}
                    animate={{ width: `${row.share}%` }}
                    transition={{ duration: 0.75, delay: 0.3 + index * 0.08, ease: EASE }}
                  />
                </div>
              </li>
            ))}
          </ul>
          <p className="mt-5 text-[12px] font-medium text-[#8c8c8c]">
            {t("admin.overview.programs.workouts", { count: data.programs.workouts })} ·{" "}
            {t("admin.overview.programs.nutrition", { count: data.programs.nutrition })}
          </p>
        </motion.section>

        <motion.section {...fadeUp(0.32)} className="rounded-[24px] bg-white p-4 sm:p-6">
          <div className="flex items-start justify-between gap-3">
            <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#8c8c8c]">
              {t("admin.overview.charts.progress")}
            </p>
            <p className="text-[12px] font-semibold text-[#8c8c8c]">
              {t("admin.overview.progress.checkIns", { count: data.checkIns.now })}
              {checkInDelta !== 0 ? (
                <span className={cn("ms-1", checkInDelta > 0 ? "text-[#2F7D32]" : "text-[#C44536]")}>
                  {signed(checkInDelta)}
                </span>
              ) : null}
            </p>
          </div>
          <div className="mt-5 grid grid-cols-3 gap-2">
            <ProgressStat label={t("admin.overview.progress.onTrack")} value={data.progress.onTrack} tone="live" />
            <ProgressStat
              label={t("admin.overview.progress.attention")}
              value={data.progress.attention}
              tone="warn"
            />
            <ProgressStat label={t("admin.overview.progress.quiet")} value={data.progress.quiet} tone="muted" />
          </div>
          <div className="mt-4 flex h-2.5 overflow-hidden rounded-full bg-[#F4F4F4]">
            <motion.div
              className="h-full bg-[var(--gym-lime,#b8fe22)]"
              initial={{ width: 0 }}
              animate={{ width: `${(data.progress.onTrack / progressTotal) * 100}%` }}
              transition={{ duration: 0.7, delay: 0.4, ease: EASE }}
            />
            <motion.div
              className="h-full bg-[#C9A227]"
              initial={{ width: 0 }}
              animate={{ width: `${(data.progress.attention / progressTotal) * 100}%` }}
              transition={{ duration: 0.7, delay: 0.48, ease: EASE }}
            />
            <motion.div
              className="h-full bg-[#D4D4D4]"
              initial={{ width: 0 }}
              animate={{ width: `${(data.progress.quiet / progressTotal) * 100}%` }}
              transition={{ duration: 0.7, delay: 0.56, ease: EASE }}
            />
          </div>
        </motion.section>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
        <motion.section {...fadeUp(0.36)} className="rounded-[24px] bg-white p-4 sm:p-6">
          <div className="flex items-center justify-between gap-3">
            <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#8c8c8c]">
              {t("admin.overview.attention.title")}
            </p>
            <span className="text-[12px] font-bold text-[#8c8c8c]">{data.priority.length}</span>
          </div>
          <ul className="mt-2 flex flex-col">
            {data.priority.map((item) => (
              <li key={item.id} className="border-b border-black/[0.05] last:border-b-0">
                <Link
                  to={item.href}
                  className="flex items-center gap-3 py-3 text-start transition-opacity hover:opacity-80"
                >
                  <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-2xl bg-[#F4F4F4] font-heading text-[12px] font-bold text-[var(--gym-ink,#063434)]">
                    {initials(item.name)}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-center gap-2">
                      <span className="truncate text-[13px] font-bold text-[var(--gym-ink,#063434)]">
                        {item.name}
                      </span>
                      <span
                        className={cn(
                          "inline-flex h-5 items-center rounded-full px-2 text-[10px] font-bold",
                          KIND_TONE[item.kind],
                        )}
                      >
                        {t(`admin.overview.kind.${item.kind}`)}
                      </span>
                    </span>
                    <span className="mt-0.5 block truncate text-[12px] font-medium text-[#8c8c8c]">
                      {item.kind === "request"
                        ? `${item.packageName?.[locale] ?? t("admin.overview.attention.request")} · ${formatDate(item.createdAt, locale)}`
                        : item.kind === "expiring"
                          ? t("admin.overview.attention.expiring", { count: item.daysLeft ?? 0 })
                          : item.kind === "expired"
                            ? t("admin.overview.attention.expired")
                            : t("admin.overview.attention.stale", { count: item.days ?? 0 })}
                    </span>
                  </span>
                  <span className="text-[#C5C5C5]">
                    <Chevron className="size-4" strokeWidth={1.8} />
                  </span>
                </Link>
              </li>
            ))}
            {!data.priority.length ? (
              <li className="py-10 text-center text-[13px] font-medium text-[#8c8c8c]">
                {t("admin.overview.attention.empty")}
              </li>
            ) : null}
          </ul>
        </motion.section>

        <motion.section {...fadeUp(0.4)} className="rounded-[24px] bg-white p-4 sm:p-6">
          <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#8c8c8c]">
            {t("admin.overview.actions.title")}
          </p>
          <div className="mt-3 flex flex-col gap-2">
            {actions.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className="group flex items-center gap-3 rounded-[18px] bg-[#F4F4F4] p-3.5 transition-colors hover:bg-[var(--gym-ink,#063434)] hover:text-white"
              >
                <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-2xl bg-white text-[var(--gym-ink,#063434)] transition-colors group-hover:bg-[var(--gym-lime,#b8fe22)]">
                  {item.icon}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[13px] font-bold">{item.title}</span>
                  <span className="mt-0.5 block text-[12px] font-medium text-[#8c8c8c] group-hover:text-white/70">
                    {item.hint}
                  </span>
                </span>
                <span className="text-[#C5C5C5] group-hover:text-white/70">
                  <Chevron className="size-4" strokeWidth={1.8} />
                </span>
              </Link>
            ))}
            {hasPermission("workouts:manage") ? (
              <div className="mt-1 grid grid-cols-2 gap-2">
                <Link
                  to={APP_ROUTES.admin.workouts}
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-full bg-[#F4F4F4] text-[12px] font-bold text-[var(--gym-ink,#063434)]"
                >
                  <Dumbbell className="size-3.5" strokeWidth={1.8} />
                  {t("admin.overview.actions.workouts")}
                </Link>
                <Link
                  to={APP_ROUTES.admin.nutrition}
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-full bg-[#F4F4F4] text-[12px] font-bold text-[var(--gym-ink,#063434)]"
                >
                  <Apple className="size-3.5" strokeWidth={1.8} />
                  {t("admin.overview.actions.nutrition")}
                </Link>
              </div>
            ) : null}
          </div>
        </motion.section>
      </div>
    </div>
  )
}

function Count({ value }: { value: number }) {
  const [n, setN] = useState(0)
  useEffect(() => {
    const start = performance.now()
    let frame = 0
    const tick = (time: number) => {
      const p = Math.min(1, (time - start) / 640)
      const eased = 1 - (1 - p) ** 3
      setN(Math.round(value * eased))
      if (p < 1) frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [value])
  return <>{n}</>
}

function Kpi({
  label,
  value,
  hint,
  icon,
  suffix,
  delta,
  delay,
}: {
  label: string
  value: number
  hint: string
  icon: ReactNode
  suffix?: string
  delta?: number | null
  delay: number
}) {
  return (
    <motion.div
      {...fadeUp(delay)}
      className="rounded-[20px] bg-white p-3.5 shadow-[0_8px_24px_rgba(6,52,52,0.04)] sm:rounded-[24px] sm:p-5"
    >
      <div className="flex items-start justify-between gap-3">
        <p className="text-[12px] font-semibold text-[#8c8c8c] sm:text-[13px]">{label}</p>
        <span className="inline-flex size-8 items-center justify-center rounded-2xl bg-[#F4F4F4] text-[var(--gym-ink,#063434)] sm:size-9">
          {icon}
        </span>
      </div>
      <p className="mt-2 flex items-end gap-2 font-heading text-[24px] font-extrabold leading-none tracking-tight text-[var(--gym-ink,#063434)] sm:mt-3 sm:text-[28px] lg:text-[32px]">
        <Count value={value} />
        {suffix ? <span className="text-[18px] sm:text-[20px]">{suffix}</span> : null}
        {delta != null && delta !== 0 ? (
          <span
            className={cn(
              "mb-0.5 text-[12px] font-bold sm:text-[13px]",
              delta > 0 ? "text-[#2F7D32]" : "text-[#C44536]",
            )}
          >
            {signed(delta)}
          </span>
        ) : null}
      </p>
      <p className="mt-2 text-[12px] font-medium text-[#8c8c8c]">{hint}</p>
    </motion.div>
  )
}

function AdherenceRing({
  value,
  label,
  color,
}: {
  value: number | null
  label: string
  color: string
}) {
  const r = 16
  const c = 2 * Math.PI * r
  const pct = Math.max(0, Math.min(100, value ?? 0))
  return (
    <div className="flex items-center gap-2">
      <svg width="42" height="42" viewBox="0 0 42 42" className="-rotate-90">
        <circle cx="21" cy="21" r={r} fill="none" stroke="#F0F0F0" strokeWidth="4.5" />
        <motion.circle
          cx="21"
          cy="21"
          r={r}
          fill="none"
          stroke={color}
          strokeWidth="4.5"
          strokeLinecap="round"
          strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          animate={{ strokeDashoffset: c * (1 - pct / 100) }}
          transition={{ duration: 0.85, delay: 0.3, ease: EASE }}
        />
      </svg>
      <div>
        <p className="font-heading text-[16px] font-extrabold leading-none text-[var(--gym-ink,#063434)]">
          {value == null ? "—" : `${value}%`}
        </p>
        <p className="mt-1 text-[11px] font-bold text-[#8c8c8c]">{label}</p>
      </div>
    </div>
  )
}

function ProgressStat({
  label,
  value,
  tone,
}: {
  label: string
  value: number
  tone: "live" | "warn" | "muted"
}) {
  return (
    <div className="rounded-[16px] bg-[#F4F4F4] px-3 py-3">
      <p
        className={cn(
          "font-heading text-[22px] font-extrabold leading-none",
          tone === "live" && "text-[var(--gym-ink,#063434)]",
          tone === "warn" && "text-[#9A6B00]",
          tone === "muted" && "text-[#6B7280]",
        )}
      >
        <Count value={value} />
      </p>
      <p className="mt-1.5 text-[11px] font-bold text-[#8c8c8c]">{label}</p>
    </div>
  )
}
