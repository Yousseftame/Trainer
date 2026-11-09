import { listNutritionLogs, listNutritionPrograms } from "@/features/nutrition/service"
import {
  buildOverviewSnapshot,
  type LiveOverviewSnapshot,
  type OverviewLiveInput,
} from "@/features/overview/build-snapshot"
import { fetchMeasurements, fetchPhotos } from "@/features/progress/service"
import {
  fetchRegistrationRequests,
  fetchSubscribers,
} from "@/features/subscribers/service"
import {
  fetchPackages,
  fetchSubscriptions,
} from "@/features/subscriptions/service"
import {
  listWorkoutLogs,
  listWorkoutPrograms,
} from "@/features/workouts/service"

/**
 * Load the admin overview desk from live Firestore modules.
 * Summaries only — no demo seeds.
 */
export async function fetchOverviewDesk(): Promise<LiveOverviewSnapshot> {
  const [
    subscribers,
    subscriptions,
    packages,
    registrationRequests,
    measurements,
    photos,
    workoutLogs,
    nutritionLogs,
    workoutPrograms,
    nutritionPrograms,
  ] = await Promise.all([
    fetchSubscribers(),
    fetchSubscriptions(),
    fetchPackages(),
    fetchRegistrationRequests(),
    fetchMeasurements().catch((err) => {
      console.warn("[overview] measurements unavailable:", err)
      return []
    }),
    fetchPhotos().catch((err) => {
      console.warn("[overview] photos unavailable:", err)
      return []
    }),
    listWorkoutLogs().catch((err) => {
      console.warn("[overview] workout logs unavailable:", err)
      return []
    }),
    listNutritionLogs().catch((err) => {
      console.warn("[overview] nutrition logs unavailable:", err)
      return []
    }),
    listWorkoutPrograms().catch((err) => {
      console.warn("[overview] workouts unavailable:", err)
      return []
    }),
    listNutritionPrograms().catch((err) => {
      console.warn("[overview] nutrition unavailable:", err)
      return []
    }),
  ])

  const input: OverviewLiveInput = {
    subscribers,
    subscriptions,
    packages,
    registrationRequests,
    measurements,
    photos,
    workoutLogs,
    nutritionLogs,
    workoutPrograms,
    nutritionPrograms,
    now: new Date(),
  }

  return buildOverviewSnapshot(input)
}
