/**
 * Compatibility shim — demo workout seed data removed.
 * Prefer `@/lib/program-text` helpers and Firestore workout services.
 */
export type { WorkoutProgram as DemoWorkoutProgram, WorkoutDay as DemoWorkoutDay } from "@/types/program"
export {
  resolveBilingualText,
  formatRest,
  trainingDayCount,
} from "@/lib/program-text"

/** @deprecated Empty — live data comes from Firestore */
export const DEMO_WORKOUTS: import("@/types/program").WorkoutProgram[] = []

/** @deprecated Empty — live logs come from Firestore */
export const INITIAL_WORKOUT_LOGS: import("@/types/program").WorkoutSessionLog[] =
  []
