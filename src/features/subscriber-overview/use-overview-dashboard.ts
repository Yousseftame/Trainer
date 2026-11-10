import { useMemo } from "react"
import {
  computeAdherenceWeeks,
  latestAdherenceWeek,
  type AdherenceWeek,
} from "@/features/progress/adherence"
import { useMeasurementsQuery } from "@/features/progress/hooks"
import {
  latestMeasurement,
  sortMeasurementsAsc,
  weightDelta,
} from "@/features/progress/metrics"
import {
  useNutritionLogsQuery,
  useNutritionProgramsQuery,
} from "@/features/nutrition/hooks"
import { usePanelSubscriber } from "@/features/subscribers/use-panel-subscriber"
import {
  canAccessPackageEntitlement,
  pickCurrentSubscription,
} from "@/features/subscriptions/entitlements"
import {
  usePackageByIdQuery,
  useSubscriberSubscriptionsQuery,
} from "@/features/subscriptions/hooks"
import {
  useWorkoutLogsQuery,
  useWorkoutProgramsQuery,
} from "@/features/workouts/hooks"
import type { AppLocale } from "@/i18n/rtl"

export type OverviewChartPoint = {
  week: string
  weekShort: string
  weekEn: string
  weekStart: string
  weight: number | null
  adherence: number | null
  workouts: number
  isCurrent: boolean
}

function formatWeekLabel(
  weekStart: string,
  isCurrent: boolean,
  locale: AppLocale,
): { full: string; short: string; en: string } {
  if (isCurrent) {
    return {
      full: locale === "ar" ? "هذا الأسبوع" : "This week",
      short: locale === "ar" ? "الآن" : "Now",
      en: "Now",
    }
  }
  const date = new Date(weekStart)
  const full = date.toLocaleDateString(locale === "ar" ? "ar-EG" : "en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  })
  const short = date.toLocaleDateString(locale === "ar" ? "ar-EG" : "en-US", {
    month: "numeric",
    day: "numeric",
    timeZone: "UTC",
  })
  return { full, short, en: full }
}

function roundKg(value: number | null | undefined): number | null {
  if (value == null || !Number.isFinite(value)) return null
  return Math.round(value * 10) / 10
}

/**
 * Shared live desk for Member Portal Overview graphs + stat boxes.
 * Always scoped to the signed-in Auth UID via usePanelSubscriber.
 */
export function useSubscriberOverviewDashboard(locale: AppLocale) {
  const { subscriberId, subscriber, isLoading: profileLoading } =
    usePanelSubscriber()
  const uid = subscriberId || undefined
  const enabled = Boolean(uid)

  const measurementsQuery = useMeasurementsQuery(uid)
  const workoutProgramsQuery = useWorkoutProgramsQuery({
    subscriberId: uid,
    enabled,
  })
  const nutritionProgramsQuery = useNutritionProgramsQuery({
    subscriberId: uid,
    enabled,
  })
  const workoutLogsQuery = useWorkoutLogsQuery({
    subscriberId: uid,
    enabled,
  })
  const nutritionLogsQuery = useNutritionLogsQuery({
    subscriberId: uid,
    enabled,
  })
  const subscriptionsQuery = useSubscriberSubscriptionsQuery(uid)

  const measurements = measurementsQuery.data ?? []
  const workoutPrograms = workoutProgramsQuery.data ?? []
  const nutritionPrograms = nutritionProgramsQuery.data ?? []
  const workoutLogs = workoutLogsQuery.data ?? []
  const nutritionLogs = nutritionLogsQuery.data ?? []
  const subscriptions = subscriptionsQuery.data ?? []

  const currentSub = useMemo(
    () => pickCurrentSubscription(subscriptions),
    [subscriptions],
  )
  const { data: pkg } = usePackageByIdQuery(currentSub?.packageId)

  const canWorkout = canAccessPackageEntitlement(
    currentSub,
    pkg ?? undefined,
    "workoutProgram",
  )
  const canNutrition = canAccessPackageEntitlement(
    currentSub,
    pkg ?? undefined,
    "nutritionProgram",
  )
  const canProgress = canAccessPackageEntitlement(
    currentSub,
    pkg ?? undefined,
    "progressTracking",
  )

  const weeks: AdherenceWeek[] = useMemo(
    () =>
      computeAdherenceWeeks({
        workoutLogs,
        nutritionLogs,
        workoutPrograms,
        nutritionPrograms,
        weeks: 7,
      }),
    [workoutLogs, nutritionLogs, workoutPrograms, nutritionPrograms],
  )

  const currentWeek = latestAdherenceWeek(weeks)
  const previousWeek =
    weeks.length >= 2 ? weeks[weeks.length - 2] : undefined

  const currentAdherence =
    currentWeek && currentWeek.workoutTotal + currentWeek.nutritionTotal > 0
      ? Math.round(
          ((currentWeek.workoutDone + currentWeek.nutritionDone) /
            (currentWeek.workoutTotal + currentWeek.nutritionTotal)) *
            100,
        )
      : null
  const previousAdherence =
    previousWeek &&
    previousWeek.workoutTotal + previousWeek.nutritionTotal > 0
      ? Math.round(
          ((previousWeek.workoutDone + previousWeek.nutritionDone) /
            (previousWeek.workoutTotal + previousWeek.nutritionTotal)) *
            100,
        )
      : null
  const adherenceDelta =
    currentAdherence != null && previousAdherence != null
      ? currentAdherence - previousAdherence
      : null

  const latestWeight = roundKg(
    latestMeasurement(measurements)?.weightKg ??
      subscriber?.startingWeightKg ??
      null,
  )
  const weightChange = weightDelta(
    measurements,
    subscriber?.startingWeightKg,
  )

  const chartData: OverviewChartPoint[] = useMemo(() => {
    let lastKnownWeight: number | null = null
    return weeks.map((w, index) => {
      const start = new Date(w.weekStart)
      const end = new Date(start)
      end.setUTCDate(end.getUTCDate() + 7)
      const isCurrent = index === weeks.length - 1

      const inWeek = sortMeasurementsAsc(
        measurements.filter((m) => {
          if (m.weightKg == null) return false
          const t = new Date(m.recordedAt).getTime()
          return t >= start.getTime() && t < end.getTime()
        }),
      )
      const latestInWeek = latestMeasurement(inWeek)
      if (latestInWeek?.weightKg != null) {
        lastKnownWeight = roundKg(latestInWeek.weightKg)
      }

      const adherenceTotal = w.workoutTotal + w.nutritionTotal
      const adherenceDone = w.workoutDone + w.nutritionDone
      const adherencePct = adherenceTotal
        ? Math.round((adherenceDone / adherenceTotal) * 100)
        : null

      const labels = formatWeekLabel(w.weekStart, isCurrent, locale)

      return {
        week: labels.full,
        weekShort: labels.short,
        weekEn: labels.en,
        weekStart: w.weekStart,
        // Carry last known weight so the curve stays continuous across quiet weeks.
        weight: lastKnownWeight,
        adherence: adherencePct,
        workouts: w.workoutDone,
        isCurrent,
      }
    })
  }, [weeks, measurements, locale])

  const activeWorkout =
    workoutPrograms.find((p) => p.status === "active") ?? null
  const activeNutrition =
    nutritionPrograms.find((p) => p.status === "active") ?? null

  const isLoading =
    profileLoading ||
    (enabled &&
      (measurementsQuery.isLoading ||
        workoutProgramsQuery.isLoading ||
        nutritionProgramsQuery.isLoading ||
        workoutLogsQuery.isLoading ||
        nutritionLogsQuery.isLoading))

  const isError =
    measurementsQuery.isError ||
    workoutProgramsQuery.isError ||
    nutritionProgramsQuery.isError ||
    workoutLogsQuery.isError ||
    nutritionLogsQuery.isError

  return {
    subscriberId: uid,
    subscriber,
    isLoading,
    isError,
    canWorkout,
    canNutrition,
    canProgress,
    measurements,
    workoutPrograms,
    nutritionPrograms,
    workoutLogs,
    nutritionLogs,
    weeks,
    currentWeek,
    previousWeek,
    currentAdherence,
    adherenceDelta,
    latestWeight,
    weightChange,
    chartData,
    activeWorkout,
    activeNutrition,
  }
}
