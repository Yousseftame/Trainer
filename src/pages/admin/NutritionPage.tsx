import { useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { Apple, ClipboardCopy, FileText, Plus, Search, UtensilsCrossed, Users } from "lucide-react"
import { FilterChip, StatCard } from "@/components/dashboard/StatCard"
import { StatusBadge } from "@/components/dashboard/StatusBadge"
import { getSubscriberById } from "@/features/subscribers/demo"
import {
  dayMacros,
  DEMO_NUTRITION,
  mealCount,
  type DemoNutritionProgram,
} from "@/features/nutrition/demo"
import { useDocumentTitle } from "@/hooks/useDocumentTitle"
import { useLocale } from "@/hooks/useLocale"
import { formatDate } from "@/lib/format"
import { appToast } from "@/lib/toast"
import { cn } from "@/lib/utils"

type Scope = "template" | "active" | "archived"

export function NutritionPage() {
  const { t } = useTranslation()
  const { locale } = useLocale()
  useDocumentTitle(t("nav.nutrition"))

  const [scope, setScope] = useState<Scope>("template")
  const [query, setQuery] = useState("")
  const [selectedId, setSelectedId] = useState(DEMO_NUTRITION[0]?.id ?? "")
  const [weekday, setWeekday] = useState(0)

  const list = useMemo(() => {
    const q = query.trim().toLowerCase()
    return DEMO_NUTRITION.filter((item) => {
      if (item.status !== scope) return false
      if (!q) return true
      const subscriber = item.subscriberId ? getSubscriberById(item.subscriberId) : undefined
      return (
        item.title[locale].toLowerCase().includes(q) ||
        (subscriber?.displayName.toLowerCase().includes(q) ?? false)
      )
    })
  }, [scope, query, locale])

  const selected = list.find((item) => item.id === selectedId) ?? list[0]
  const selectedDay = selected?.days.find((day) => day.weekday === weekday) ?? selected?.days[0]
  const macros = dayMacros(selectedDay)

  const stats = useMemo(() => {
    const templates = DEMO_NUTRITION.filter((item) => item.status === "template").length
    const assigned = DEMO_NUTRITION.filter((item) => item.status === "active").length
    const archived = DEMO_NUTRITION.filter((item) => item.status === "archived").length
    const logged = DEMO_NUTRITION.filter((item) => item.status === "active").reduce(
      (sum, item) => sum + (item.adherence?.done ?? 0),
      0,
    )
    return { templates, assigned, archived, logged }
  }, [])

  function pickScope(next: Scope) {
    setScope(next)
    const first = DEMO_NUTRITION.find((item) => item.status === next)
    setSelectedId(first?.id ?? "")
    setWeekday(first?.days.find((day) => day.meals.length > 0)?.weekday ?? 0)
  }

  function pickProgram(program: DemoNutritionProgram) {
    setSelectedId(program.id)
    setWeekday(program.days.find((day) => day.meals.length > 0)?.weekday ?? 0)
  }

  return (
    <div className="flex flex-col gap-4 sm:gap-5">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
        <StatCard
          label={t("admin.nutrition.stats.templates")}
          value={stats.templates}
          icon={<ClipboardCopy className="size-4" strokeWidth={1.8} />}
        />
        <StatCard
          label={t("admin.nutrition.stats.assigned")}
          value={stats.assigned}
          icon={<Users className="size-4" strokeWidth={1.8} />}
        />
        <StatCard
          label={t("admin.nutrition.stats.logged")}
          value={stats.logged}
          icon={<UtensilsCrossed className="size-4" strokeWidth={1.8} />}
        />
        <StatCard
          label={t("admin.nutrition.stats.archived")}
          value={stats.archived}
          icon={<Apple className="size-4" strokeWidth={1.8} />}
        />
      </div>

      <section className="rounded-[24px] bg-white p-4 sm:p-6 lg:p-7">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 flex-1 flex-col gap-3 sm:flex-row sm:items-center">
            <div className="flex gap-1.5 overflow-x-auto pb-0.5">
              {(["template", "active", "archived"] as const).map((item) => (
                <FilterChip key={item} active={scope === item} onClick={() => pickScope(item)}>
                  {t(`admin.nutrition.scope.${item}`)}
                </FilterChip>
              ))}
            </div>
            <label className="relative min-w-0 flex-1 sm:max-w-[280px]">
              <Search className="pointer-events-none absolute start-3.5 top-1/2 size-4 -translate-y-1/2 text-[#8c8c8c]" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={t("admin.nutrition.search")}
                className="h-11 w-full rounded-full bg-[#F4F4F4] pe-4 ps-10 text-[14px] font-medium text-[var(--gym-ink,#063434)] outline-none placeholder:font-normal placeholder:text-[#8c8c8c]"
              />
            </label>
          </div>
          <button
            type="button"
            onClick={() => appToast.success(t("admin.common.demoOnly"))}
            className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-full bg-[var(--gym-ink,#063434)] px-5 text-[13px] font-bold text-white"
          >
            <Plus className="size-4" strokeWidth={2} />
            {scope === "template" ? t("admin.nutrition.newTemplate") : t("admin.nutrition.assign")}
          </button>
        </div>

        {list.length === 0 || !selected ? (
          <div className="mt-5 flex min-h-40 items-center justify-center rounded-[20px] bg-[#F4F4F4] text-sm font-medium text-[#8c8c8c]">
            {t("admin.nutrition.empty")}
          </div>
        ) : (
          <div className="mt-5 grid gap-4 lg:grid-cols-[260px_minmax(0,1fr)] xl:grid-cols-[280px_minmax(0,1fr)]">
            <div className="flex max-h-[520px] flex-col gap-2 overflow-y-auto pe-1">
              {list.map((program) => {
                const subscriber = program.subscriberId
                  ? getSubscriberById(program.subscriberId)
                  : undefined
                const active = program.id === selected.id
                return (
                  <button
                    key={program.id}
                    type="button"
                    onClick={() => pickProgram(program)}
                    className={cn(
                      "rounded-2xl p-3.5 text-start transition-colors",
                      active
                        ? "bg-[var(--gym-ink,#063434)] text-white"
                        : "bg-[#F4F4F4] text-[var(--gym-ink,#063434)] hover:bg-[#ececec]",
                    )}
                  >
                    <p className="truncate text-[14px] font-bold">{program.title[locale]}</p>
                    <p className={cn("mt-1 text-[12px] font-medium", active ? "text-white/70" : "text-[#8c8c8c]")}>
                      {subscriber
                        ? subscriber.displayName
                        : t("admin.nutrition.mealsCount", { count: mealCount(program) })}
                    </p>
                  </button>
                )
              })}
            </div>

            <div className="min-w-0 rounded-[22px] bg-[#F4F4F4] p-4 sm:p-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-heading text-[20px] font-extrabold tracking-tight text-[var(--gym-ink,#063434)]">
                      {selected.title[locale]}
                    </h2>
                    <StatusBadge
                      label={t(`admin.workouts.format.${selected.format}`)}
                      tone={selected.format === "pdf" ? "info" : "success"}
                    />
                    {selected.targetCalories ? (
                      <StatusBadge
                        label={t("admin.nutrition.target", { value: selected.targetCalories })}
                        tone="muted"
                      />
                    ) : null}
                  </div>
                  <p className="mt-1 text-[13px] font-medium text-[#8c8c8c]">
                    {t("admin.workouts.updated", { date: formatDate(selected.updatedAt, locale) })}
                    {selected.templateId
                      ? ` · ${t("admin.nutrition.copied")}`
                      : ` · ${t("admin.nutrition.reusable")}`}
                  </p>
                </div>
                {selected.adherence ? (
                  <div className="rounded-2xl bg-white px-3.5 py-2">
                    <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#8c8c8c]">
                      {t("admin.nutrition.thisWeek")}
                    </p>
                    <p className="font-heading text-[18px] font-extrabold text-[var(--gym-ink,#063434)]">
                      {selected.adherence.done}/{selected.adherence.total}
                    </p>
                  </div>
                ) : null}
              </div>

              {selected.format === "pdf" ? (
                <div className="mt-5 flex min-h-40 flex-col items-start justify-center rounded-[20px] bg-white p-5">
                  <FileText className="size-8 text-[var(--gym-ink,#063434)]" strokeWidth={1.6} />
                  <p className="mt-3 font-heading text-[16px] font-bold text-[var(--gym-ink,#063434)]">
                    {selected.pdfName?.[locale]}
                  </p>
                  <p className="mt-1 max-w-md text-[13px] text-[#8c8c8c]">{t("admin.nutrition.pdfHint")}</p>
                </div>
              ) : (
                <>
                  <div className="mt-5 grid grid-cols-7 gap-1.5 sm:gap-2">
                    {selected.days.map((day) => {
                      const active = day.weekday === weekday
                      const planned = day.meals.length > 0
                      return (
                        <button
                          key={day.id}
                          type="button"
                          onClick={() => setWeekday(day.weekday)}
                          className={cn(
                            "flex min-h-[72px] flex-col items-center justify-center rounded-2xl px-1 py-2 text-center transition-colors sm:min-h-[84px]",
                            active
                              ? "bg-[var(--gym-ink,#063434)] text-white"
                              : "bg-white text-[var(--gym-ink,#063434)] hover:bg-white/70",
                          )}
                        >
                          <span
                            className={cn(
                              "text-[10px] font-bold uppercase tracking-[0.06em] sm:text-[11px]",
                              active ? "text-white/70" : "text-[#8c8c8c]",
                            )}
                          >
                            {t(`admin.workouts.weekdays.${day.weekday}`)}
                          </span>
                          <span
                            className={cn(
                              "mt-1 size-2 rounded-full",
                              planned
                                ? active
                                  ? "bg-[var(--gym-lime,#b8fe22)]"
                                  : "bg-[var(--gym-ink,#063434)]"
                                : active
                                  ? "bg-white/30"
                                  : "bg-[#D9D9D9]",
                            )}
                          />
                          <span className="mt-1 hidden text-[10px] font-semibold sm:block">
                            {planned
                              ? t("admin.nutrition.mealsShort", { count: day.meals.length })
                              : t("admin.nutrition.off")}
                          </span>
                        </button>
                      )
                    })}
                  </div>

                  <div className="mt-4 rounded-[20px] bg-white p-4 sm:p-5">
                    <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <h3 className="font-heading text-[16px] font-extrabold text-[var(--gym-ink,#063434)]">
                        {t(`admin.workouts.weekdays.${selectedDay?.weekday ?? 0}`)}
                      </h3>
                      {macros ? (
                        <div className="flex flex-wrap gap-1.5 text-[11px] font-bold text-[var(--gym-ink,#063434)]">
                          <span className="rounded-full bg-[#F4F4F4] px-2.5 py-1">{macros.calories} kcal</span>
                          <span className="rounded-full bg-[#F4F4F4] px-2.5 py-1">P {macros.protein}g</span>
                          <span className="rounded-full bg-[#F4F4F4] px-2.5 py-1">C {macros.carbs}g</span>
                          <span className="rounded-full bg-[#F4F4F4] px-2.5 py-1">F {macros.fats}g</span>
                        </div>
                      ) : (
                        <p className="text-[12px] font-bold text-[#8c8c8c]">
                          {t("admin.nutrition.noMacros")}
                        </p>
                      )}
                    </div>

                    {!selectedDay?.meals.length ? (
                      <p className="rounded-2xl bg-[#F4F4F4] px-4 py-8 text-center text-[14px] font-medium text-[#8c8c8c]">
                        {t("admin.nutrition.emptyDay")}
                      </p>
                    ) : (
                      <ul className="flex flex-col gap-3">
                        {selectedDay.meals.map((slot) => (
                          <li key={slot.id} className="rounded-2xl bg-[#F4F4F4] p-3.5 sm:p-4">
                            <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#8c8c8c]">
                              {t(`admin.nutrition.slots.${slot.slot}`)}
                            </p>
                            <ul className="mt-2.5 flex flex-col gap-2.5">
                              {slot.items.map((item) => (
                                <li key={item.id}>
                                  <div className="flex items-start justify-between gap-3">
                                    <div className="min-w-0">
                                      <p className="font-heading text-[15px] font-bold text-[var(--gym-ink,#063434)]">
                                        {item.name}
                                      </p>
                                      {item.quantity ? (
                                        <p className="mt-0.5 text-[13px] font-medium text-[#6B7280]">
                                          {item.quantity}
                                        </p>
                                      ) : null}
                                    </div>
                                    {item.calories ? (
                                      <span className="shrink-0 text-[12px] font-bold text-[var(--gym-ink,#063434)]">
                                        {item.calories} kcal
                                      </span>
                                    ) : null}
                                  </div>
                                  {item.notes ? (
                                    <p className="mt-1.5 text-[12px] font-medium text-[#8c8c8c]">
                                      {item.notes}
                                    </p>
                                  ) : null}
                                  {item.protein || item.carbs || item.fats ? (
                                    <p className="mt-1.5 text-[11px] font-bold text-[#6B7280]">
                                      P {item.protein ?? 0} · C {item.carbs ?? 0} · F {item.fats ?? 0}
                                    </p>
                                  ) : null}
                                </li>
                              ))}
                            </ul>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </section>
    </div>
  )
}
