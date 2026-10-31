import { useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import {
  Archive,
  CalendarDays,
  ChevronDown,
  ClipboardCopy,
  Dumbbell,
  FileText,
  History,
  Pencil,
  Play,
  Plus,
  RotateCcw,
  Search,
  Trash2,
  UserPlus,
  Users,
} from "lucide-react"
import { ContentPreviewDialog } from "@/components/dashboard/ContentPreviewDialog"
import { ProgramHistoryDialog } from "@/components/dashboard/ProgramHistoryDialog"
import { ProgramLogsDialog } from "@/components/dashboard/ProgramLogsDialog"
import { FilterChip, StatCard } from "@/components/dashboard/StatCard"
import { StatusBadge } from "@/components/dashboard/StatusBadge"
import {
  WorkoutProgramFormDialog,
  type WorkoutDialogMode,
} from "@/components/dashboard/WorkoutProgramFormDialog"
import { useContentAssetsQuery } from "@/features/content/hooks"
import { useSubscribersQuery } from "@/features/subscribers/hooks"
import {
  formatRest,
  resolveBilingualText,
  trainingDayCount,
} from "@/features/workouts/demo"
import {
  useArchiveWorkoutMutation,
  useAssignWorkoutMutation,
  useDeleteWorkoutMutation,
  useSaveWorkoutProgramMutation,
  useWorkoutLogsQuery,
  useWorkoutProgramsQuery,
} from "@/features/workouts/hooks"
import { useDocumentTitle } from "@/hooks/useDocumentTitle"
import { useLocale } from "@/hooks/useLocale"
import { formatDate } from "@/lib/format"
import { appToast } from "@/lib/toast"
import { cn } from "@/lib/utils"
import type { ContentAsset } from "@/types/content"
import type { WorkoutProgram } from "@/types/program"

const WEEKDAY_NAMES_EN = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
const WEEKDAY_NAMES_AR = ["الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت", "الأحد"]

type Scope = "template" | "active" | "archived"
type FormatFilter = "all" | "interactive" | "pdf"

export function WorkoutsPage() {
  const { t } = useTranslation()
  const { locale } = useLocale()
  const isAr = locale === "ar"
  useDocumentTitle(t("nav.workouts"))

  const [scope, setScope] = useState<Scope>("template")
  const [formatFilter, setFormatFilter] = useState<FormatFilter>("all")
  const [query, setQuery] = useState("")
  const [selectedId, setSelectedId] = useState<string>("")
  const [weekday, setWeekday] = useState(0)

  // Dialog States
  const [formModal, setFormModal] = useState<{
    open: boolean
    mode: WorkoutDialogMode | null
  }>({ open: false, mode: null })

  const [historyModal, setHistoryModal] = useState<{
    open: boolean
    program: WorkoutProgram | null
  }>({ open: false, program: null })

  const [logsModal, setLogsModal] = useState<{
    open: boolean
    subscriberId?: string
    subscriberName?: string
  }>({ open: false })

  const [previewAsset, setPreviewAsset] = useState<ContentAsset | null>(null)

  // React Query Hooks
  const { data: allPrograms = [] } = useWorkoutProgramsQuery()
  const { data: subscribers = [] } = useSubscribersQuery()
  const { data: contentAssets = [] } = useContentAssetsQuery()
  const { data: allLogs = [] } = useWorkoutLogsQuery()

  const saveMutation = useSaveWorkoutProgramMutation()
  const assignMutation = useAssignWorkoutMutation()
  const archiveMutation = useArchiveWorkoutMutation()
  const deleteMutation = useDeleteWorkoutMutation()

  // Filtered List
  const list = useMemo(() => {
    const q = query.trim().toLowerCase()
    return allPrograms.filter((item) => {
      if (item.status !== scope) return false
      if (formatFilter !== "all" && item.format !== formatFilter) return false
      if (!q) return true
      const subscriber = item.subscriberId
        ? subscribers.find((s) => s.id === item.subscriberId)
        : undefined
      return (
        item.title[locale].toLowerCase().includes(q) ||
        item.title.en.toLowerCase().includes(q) ||
        item.title.ar.includes(q) ||
        (subscriber?.displayName.toLowerCase().includes(q) ?? false)
      )
    })
  }, [allPrograms, scope, formatFilter, query, locale, subscribers])

  const selected = list.find((item) => item.id === selectedId) ?? list[0]
  const selectedDay =
    selected?.days.find((day) => day.weekday === weekday) ?? selected?.days[0]

  const stats = useMemo(() => {
    const templates = allPrograms.filter((item) => item.status === "template").length
    const assigned = allPrograms.filter((item) => item.status === "active").length
    const archived = allPrograms.filter((item) => item.status === "archived").length
    const sessions = allPrograms
      .filter((item) => item.status === "active")
      .reduce((sum, item) => sum + (item.completion?.done ?? 0), 0)
    return { templates, assigned, archived, sessions }
  }, [allPrograms])

  function pickScope(next: Scope) {
    setScope(next)
    const first = allPrograms.find((item) => item.status === next)
    setSelectedId(first?.id ?? "")
    setWeekday(first?.days.find((day) => !day.isRest)?.weekday ?? 0)
  }

  function pickProgram(program: WorkoutProgram) {
    setSelectedId(program.id)
    setWeekday(program.days.find((day) => !day.isRest)?.weekday ?? 0)
  }

  async function handleArchiveToggle(program: WorkoutProgram) {
    if (program.status === "active") {
      await archiveMutation.mutateAsync(program.id)
      appToast.success(
        isAr ? "تم نقل البرنامج إلى الأرشيف" : "Program moved to history archive",
      )
    } else if (program.status === "archived") {
      await saveMutation.mutateAsync({
        ...program,
        status: "active",
      })
      appToast.success(
        isAr ? "تمت استعادة البرنامج إلى الحالة النشطة" : "Program restored to active",
      )
    }
  }

  async function handleDelete(program: WorkoutProgram) {
    const confirmText = isAr
      ? `هل أنت متأكد من حذف "${program.title[locale]}" نهائياً؟`
      : `Are you sure you want to permanently delete "${program.title[locale]}"?`
    if (!window.confirm(confirmText)) return

    await deleteMutation.mutateAsync(program.id)
    appToast.success(isAr ? "تم حذف البرنامج" : "Program deleted")
  }

  // Subscriber information for selected program
  const selectedSubscriber = selected?.subscriberId
    ? subscribers.find((s) => s.id === selected.subscriberId)
    : undefined

  // Find all version records for selected subscriber/program
  const relatedVersions = useMemo(() => {
    if (!selected?.subscriberId) return [selected].filter(Boolean)
    return allPrograms.filter((p) => p.subscriberId === selected.subscriberId)
  }, [allPrograms, selected])

  // Logs for selected program
  const subscriberLogs = useMemo(() => {
    if (!selected?.subscriberId) return []
    return allLogs.filter((l) => l.subscriberId === selected.subscriberId)
  }, [allLogs, selected])

  return (
    <div className="flex flex-col gap-4 sm:gap-5">
      {/* Stat Cards */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
        <StatCard
          label={t("admin.workouts.stats.templates")}
          value={stats.templates}
          icon={<ClipboardCopy className="size-4" strokeWidth={1.8} />}
        />
        <StatCard
          label={t("admin.workouts.stats.assigned")}
          value={stats.assigned}
          icon={<Users className="size-4" strokeWidth={1.8} />}
        />
        <StatCard
          label={t("admin.workouts.stats.sessions")}
          value={stats.sessions}
          icon={<Dumbbell className="size-4" strokeWidth={1.8} />}
        />
        <StatCard
          label={t("admin.workouts.stats.archived")}
          value={stats.archived}
          icon={<CalendarDays className="size-4" strokeWidth={1.8} />}
        />
      </div>

      <section className="rounded-[24px] bg-white p-4 sm:p-6 lg:p-7">
        <div className="flex flex-col gap-3.5">
          {/* Top row: Search input + Format Filter dropdown + Action button */}
          <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
            <label className="relative w-full sm:max-w-[340px]">
              <Search className="pointer-events-none absolute start-3.5 top-1/2 size-4 -translate-y-1/2 text-[#8c8c8c]" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={t("admin.workouts.search")}
                className="h-11 w-full rounded-full bg-[#F4F4F4] pe-4 ps-10 text-[14px] font-medium text-[var(--gym-ink,#063434)] outline-none placeholder:font-normal placeholder:text-[#8c8c8c]"
              />
            </label>

            <div className="flex shrink-0 items-center gap-2 sm:gap-2.5">
              <div className="relative inline-flex items-center">
                <select
                  value={formatFilter}
                  onChange={(e) => setFormatFilter(e.target.value as FormatFilter)}
                  className="h-11 w-auto min-w-[130px] max-w-[170px] cursor-pointer appearance-none rounded-full bg-[#F4F4F4] pe-8 ps-4 text-[13px] font-bold text-[var(--gym-ink,#111111)] outline-none transition hover:bg-black/5 truncate"
                >
                  <option value="all">
                    {isAr ? "كل الصيغ" : "All formats"}
                  </option>
                  <option value="interactive">
                    {t("admin.workouts.format.interactive")}
                  </option>
                  <option value="pdf">
                    {t("admin.workouts.format.pdf")}
                  </option>
                </select>
                <ChevronDown className="pointer-events-none absolute end-3 size-4 text-[#8c8c8c]" />
              </div>

              {scope === "template" ? (
                <button
                  type="button"
                  onClick={() =>
                    setFormModal({
                      open: true,
                      mode: { type: "create-template" },
                    })
                  }
                  className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-full bg-[var(--gym-ink,#063434)] px-5 text-[13px] font-bold text-white transition hover:opacity-95"
                >
                  <Plus className="size-4" strokeWidth={2} />
                  {t("admin.workouts.newTemplate")}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() =>
                    setFormModal({
                      open: true,
                      mode: { type: "assign" },
                    })
                  }
                  className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-full bg-[var(--gym-ink,#063434)] px-5 text-[13px] font-bold text-white transition hover:opacity-95"
                >
                  <UserPlus className="size-4" strokeWidth={2} />
                  {t("admin.workouts.assign")}
                </button>
              )}
            </div>
          </div>

          {/* Bottom row: Scope filter chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 pt-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {(["template", "active", "archived"] as const).map((item) => (
              <FilterChip key={item} active={scope === item} onClick={() => pickScope(item)}>
                {t(`admin.workouts.scope.${item}`)}
              </FilterChip>
            ))}
          </div>
        </div>

        {list.length === 0 || !selected ? (
          <div className="mt-5 flex min-h-40 items-center justify-center rounded-[20px] bg-[#F4F4F4] text-sm font-medium text-[#8c8c8c]">
            {t("admin.workouts.empty")}
          </div>
        ) : (
          <div className="mt-5 grid gap-4 lg:grid-cols-[260px_minmax(0,1fr)] xl:grid-cols-[280px_minmax(0,1fr)]">
            {/* Sidebar list of programs */}
            <div className="flex max-h-[560px] flex-col gap-2 overflow-y-auto pe-1">
              {list.map((program) => {
                const subscriber = program.subscriberId
                  ? subscribers.find((s) => s.id === program.subscriberId)
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
                        ? "bg-[var(--gym-ink,#063434)] text-white shadow-sm"
                        : "bg-[#F4F4F4] text-[var(--gym-ink,#063434)] hover:bg-[#ececec]",
                    )}
                  >
                    <div className="flex items-center justify-between gap-1">
                      <p className="truncate text-[14px] font-bold">{program.title[locale]}</p>
                      <span
                        className={cn(
                          "rounded-full px-1.5 py-0.5 text-[10px] font-bold shrink-0",
                          active
                            ? "bg-white/20 text-white"
                            : "bg-black/5 text-[#8c8c8c]",
                        )}
                      >
                        v{program.version}
                      </span>
                    </div>
                    <p
                      className={cn(
                        "mt-1 text-[12px] font-medium",
                        active ? "text-white/70" : "text-[#8c8c8c]",
                      )}
                    >
                      {subscriber
                        ? subscriber.displayName
                        : t("admin.workouts.daysCount", { count: trainingDayCount(program) })}
                    </p>
                  </button>
                )
              })}
            </div>

            {/* Selected Program Detail View */}
            <div className="min-w-0 rounded-[22px] bg-[#F4F4F4] p-4 sm:p-5 flex flex-col gap-4">
              {/* Program Header with Actions */}
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-heading text-[20px] font-extrabold tracking-tight text-[var(--gym-ink,#063434)]">
                      {selected.title[locale]}
                    </h2>
                    <StatusBadge
                      label={t(`admin.workouts.format.${selected.format}`, {
                        defaultValue:
                          selected.format === "pdf"
                            ? "PDF"
                            : isAr
                              ? "تفاعلي"
                              : "Interactive",
                      })}
                      tone={selected.format === "pdf" ? "info" : "success"}
                    />
                    <StatusBadge
                      label={t("admin.workouts.version", {
                        version: selected.version,
                        defaultValue: `v${selected.version}`,
                      })}
                      tone="muted"
                    />
                    {selected.status === "archived" ? (
                      <StatusBadge label={isAr ? "مؤرشف" : "Archived"} tone="warning" />
                    ) : null}
                  </div>

                  <p className="mt-1 text-[13px] font-medium text-[#8c8c8c]">
                    {t("admin.workouts.updated", {
                      date: formatDate(selected.updatedAt, locale),
                      defaultValue: `${isAr ? "تم التحديث" : "Updated"} ${formatDate(selected.updatedAt, locale)}`,
                    })}
                    {selected.subscriberId
                      ? ` · ${isAr ? "مخصص للمشترك: " : "Assigned to: "}${selectedSubscriber?.displayName || selected.subscriberId}`
                      : ` · ${t("admin.workouts.reusable", {
                          defaultValue: isAr
                            ? "قالب قابل لإعادة الاستخدام — التعيين ينشئ نسخة"
                            : "Reusable template — assigning creates a copy",
                        })}`}
                  </p>
                </div>

                {/* Right controls: completion badge + action buttons */}
                <div className="flex flex-wrap items-center gap-2">
                  {selected.completion ? (
                    <button
                      type="button"
                      onClick={() =>
                        setLogsModal({
                          open: true,
                          subscriberId: selected.subscriberId,
                          subscriberName: selectedSubscriber?.displayName,
                        })
                      }
                      className="rounded-2xl bg-white px-3.5 py-2 text-start shadow-sm transition hover:bg-[#F9F9F9]"
                      title={isAr ? "عرض سجل الجلسات" : "View session log"}
                    >
                      <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-[#8c8c8c]">
                        {t("admin.workouts.thisWeek")}
                      </p>
                      <p className="font-heading text-[16px] font-extrabold text-[var(--gym-ink,#063434)]">
                        {selected.completion.done}/{selected.completion.total}
                      </p>
                    </button>
                  ) : null}

                  {/* Edit button */}
                  <button
                    type="button"
                    onClick={() =>
                      setFormModal({
                        open: true,
                        mode:
                          selected.status === "template"
                            ? { type: "edit-template", program: selected }
                            : { type: "edit-assignment", program: selected },
                      })
                    }
                    className="flex size-9 items-center justify-center rounded-full bg-white text-[var(--gym-ink,#063434)] shadow-sm hover:bg-black/5"
                    title={isAr ? "تعديل البرنامج" : "Edit program"}
                  >
                    <Pencil className="size-4" />
                  </button>

                  {/* Version history button (for assigned programs) */}
                  {selected.subscriberId ? (
                    <button
                      type="button"
                      onClick={() =>
                        setHistoryModal({
                          open: true,
                          program: selected,
                        })
                      }
                      className="flex size-9 items-center justify-center rounded-full bg-white text-[var(--gym-ink,#063434)] shadow-sm hover:bg-black/5"
                      title={isAr ? "سجل الإصدارات السابقة" : "Version history"}
                    >
                      <History className="size-4" />
                    </button>
                  ) : null}

                  {/* Archive / Restore button */}
                  <button
                    type="button"
                    onClick={() => handleArchiveToggle(selected)}
                    className="flex size-9 items-center justify-center rounded-full bg-white text-[var(--gym-ink,#063434)] shadow-sm hover:bg-black/5"
                    title={
                      selected.status === "archived"
                        ? isAr
                          ? "استعادة البرنامج"
                          : "Restore program"
                        : isAr
                          ? "أرشفة البرنامج"
                          : "Archive program"
                    }
                  >
                    {selected.status === "archived" ? (
                      <RotateCcw className="size-4 text-emerald-600" />
                    ) : (
                      <Archive className="size-4" />
                    )}
                  </button>

                  {/* Delete button */}
                  <button
                    type="button"
                    onClick={() => handleDelete(selected)}
                    className="flex size-9 items-center justify-center rounded-full bg-white text-red-500 shadow-sm hover:bg-red-50"
                    title={isAr ? "حذف نهائي" : "Delete permanently"}
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
              </div>

              {/* PDF Format Display */}
              {selected.format === "pdf" ? (
                <div className="flex min-h-40 flex-col items-start justify-center rounded-[20px] bg-white p-5 shadow-sm">
                  <FileText className="size-8 text-[var(--gym-ink,#063434)]" strokeWidth={1.6} />
                  <p className="mt-3 font-heading text-[16px] font-bold text-[var(--gym-ink,#063434)]">
                    {selected.pdfName?.[locale] || (isAr ? "مستند البرنامج التدريبي PDF" : "Workout Program PDF")}
                  </p>
                  <p className="mt-1 max-w-md text-[13px] text-[#8c8c8c]">
                    {t("admin.workouts.pdfHint")}
                  </p>
                </div>
              ) : (
                /* Interactive Schedule & Exercises */
                <>
                  {/* Weekday Selector Bar */}
                  <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
                    {selected.days.map((day) => {
                      const active = day.weekday === weekday
                      const trained = !day.isRest && day.exercises.length > 0
                      return (
                        <button
                          key={day.id}
                          type="button"
                          onClick={() => setWeekday(day.weekday)}
                          className={cn(
                            "flex min-h-[72px] flex-col items-center justify-center rounded-2xl px-1 py-2 text-center transition-colors sm:min-h-[84px] overflow-hidden",
                            active
                              ? "bg-[var(--gym-ink,#063434)] text-white shadow-sm"
                              : "bg-white text-[var(--gym-ink,#063434)] hover:bg-white/80",
                          )}
                        >
                          <span
                            className={cn(
                              "block w-full max-w-full truncate px-0.5 text-center text-[10px] font-bold uppercase tracking-[0.04em] sm:text-[11px]",
                              active ? "text-white/70" : "text-[#8c8c8c]",
                            )}
                          >
                            {t(`admin.workouts.weekdays.${day.weekday}`, {
                              defaultValue: isAr ? WEEKDAY_NAMES_AR[day.weekday] : WEEKDAY_NAMES_EN[day.weekday],
                            })}
                          </span>
                          <span
                            className={cn(
                              "mt-1 size-2 rounded-full",
                              trained
                                ? active
                                  ? "bg-[var(--gym-lime,#b8fe22)]"
                                  : "bg-[var(--gym-ink,#063434)]"
                                : active
                                  ? "bg-white/30"
                                  : "bg-[#D9D9D9]",
                            )}
                          />
                          <span className="mt-1 hidden text-[10px] font-semibold sm:block">
                            {trained
                              ? t("admin.workouts.session", { defaultValue: isAr ? "تمرين" : "Train" })
                              : t("admin.workouts.restLabel", { defaultValue: isAr ? "راحة" : "Rest" })}
                          </span>
                        </button>
                      )
                    })}
                  </div>

                  {/* Day Exercise List Container */}
                  <div className="rounded-[20px] bg-white p-4 sm:p-5 shadow-sm">
                    <div className="mb-4 flex items-center justify-between gap-3">
                      <h3 className="font-heading text-[16px] font-extrabold text-[var(--gym-ink,#063434)]">
                        {t(`admin.workouts.weekdays.${selectedDay?.weekday ?? 0}`, {
                          defaultValue:
                            isAr
                              ? WEEKDAY_NAMES_AR[selectedDay?.weekday ?? 0]
                              : WEEKDAY_NAMES_EN[selectedDay?.weekday ?? 0],
                        })}
                      </h3>
                      <p className="text-[12px] font-bold text-[#8c8c8c]">
                        {selectedDay?.isRest
                          ? t("admin.workouts.restDay")
                          : t("admin.workouts.exerciseCount", {
                              count: selectedDay?.exercises.length ?? 0,
                            })}
                      </p>
                    </div>

                    {selectedDay?.isRest || !selectedDay?.exercises.length ? (
                      <p className="rounded-2xl bg-[#F4F4F4] px-4 py-8 text-center text-[14px] font-medium text-[#8c8c8c]">
                        {t("admin.workouts.restHint")}
                      </p>
                    ) : (
                      <ul className="flex flex-col gap-2.5">
                        {selectedDay.exercises.map((exercise) => {
                          const exName = resolveBilingualText(exercise.name, locale)
                          const exDesc = resolveBilingualText(exercise.description, locale)
                          const exNotes = resolveBilingualText(exercise.notes, locale)
                          const linkedVideo = contentAssets.find(
                            (a) => a.id === exercise.videoContentId,
                          )

                          return (
                            <li
                              key={exercise.id}
                              className="rounded-2xl bg-[#F4F4F4] p-3.5 sm:p-4"
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                  <p className="font-heading text-[15px] font-bold text-[var(--gym-ink,#063434)]">
                                    {exName}
                                  </p>
                                  {exDesc ? (
                                    <p className="mt-1 text-[13px] leading-relaxed text-[#6B7280]">
                                      {exDesc}
                                    </p>
                                  ) : null}
                                </div>

                                {/* Video Play Pill (Links to Content Library preview) */}
                                {exercise.videoContentId ? (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      if (linkedVideo) {
                                        setPreviewAsset(linkedVideo)
                                      } else {
                                        appToast.info(
                                          isAr
                                            ? "معرف الفيديو مسجل ولكن غير متوفر في المكتبة حالياً"
                                            : "Video ID recorded but asset not found in library",
                                        )
                                      }
                                    }}
                                    className="inline-flex size-8 shrink-0 items-center justify-center rounded-full bg-[var(--gym-ink,#063434)] text-[var(--gym-lime,#b8fe22)] transition hover:scale-105"
                                    title={isAr ? "مشاهدة الفيديو التعليمي" : "Watch instructional video"}
                                  >
                                    <Play className="size-3.5 fill-current" />
                                  </button>
                                ) : null}
                              </div>

                              <div className="mt-3 flex flex-wrap gap-2 text-[12px] font-bold text-[var(--gym-ink,#063434)]">
                                <span className="rounded-full bg-white px-2.5 py-1">
                                  {t("admin.workouts.sets", { count: exercise.sets ?? 0 })}
                                </span>
                                <span className="rounded-full bg-white px-2.5 py-1">
                                  {t("admin.workouts.reps", { value: exercise.reps ?? "—" })}
                                </span>
                                <span className="rounded-full bg-white px-2.5 py-1">
                                  {t("admin.workouts.restTime", { value: formatRest(exercise.restSeconds) })}
                                </span>
                              </div>

                              {exNotes ? (
                                <p className="mt-2 text-[12px] font-medium text-[#8c8c8c]">
                                  {exNotes}
                                </p>
                              ) : null}
                            </li>
                          )
                        })}
                      </ul>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </section>

      {/* Program Create / Edit / Assign Dialog */}
      {formModal.open && formModal.mode ? (
        <WorkoutProgramFormDialog
          open={formModal.open}
          mode={formModal.mode}
          templates={allPrograms.filter((p) => p.status === "template")}
          onClose={() => setFormModal({ open: false, mode: null })}
          onSaveProgram={async (input) => {
            await saveMutation.mutateAsync(input)
            appToast.success(
              isAr ? "تم حفظ البرنامج بنجاح" : "Workout program saved successfully",
            )
          }}
          onAssignProgram={async (input) => {
            await assignMutation.mutateAsync(input)
            appToast.success(
              isAr ? "تم تعيين البرنامج للمشترك بنجاح" : "Program assigned successfully",
            )
          }}
        />
      ) : null}

      {/* Historical Versions Dialog */}
      {historyModal.open && historyModal.program ? (
        <ProgramHistoryDialog
          open={historyModal.open}
          title={isAr ? "سجل إصدارات البرنامج" : "Program Version History"}
          subscriberName={selectedSubscriber?.displayName}
          programs={relatedVersions}
          type="workout"
          onClose={() => setHistoryModal({ open: false, program: null })}
        />
      ) : null}

      {/* Subscriber Workout Logs Dialog */}
      {logsModal.open ? (
        <ProgramLogsDialog
          open={logsModal.open}
          title={isAr ? "سجل إنجاز وأداء التمارين" : "Workout Completion & Performance"}
          subscriberName={logsModal.subscriberName}
          workoutLogs={subscriberLogs}
          type="workout"
          onClose={() => setLogsModal({ open: false })}
        />
      ) : null}

      {/* Video Preview Dialog */}
      {previewAsset ? (
        <ContentPreviewDialog
          asset={previewAsset}
          onClose={() => setPreviewAsset(null)}
        />
      ) : null}
    </div>
  )
}
