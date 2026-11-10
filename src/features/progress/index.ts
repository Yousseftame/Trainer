export type { AdherenceWeek } from "@/features/progress/adherence"
export type {
  ProgressFilter,
  RosterPerson,
  RosterTone,
} from "@/features/progress/roster"

export {
  computeAdherenceWeeks,
  adherenceScoreFromWeeks,
  latestAdherenceWeek,
} from "@/features/progress/adherence"

export {
  buildProgressRoster,
  progressStats,
  getRosterPerson,
} from "@/features/progress/roster"

export {
  latestMeasurement,
  firstMeasurement,
  previousMeasurement,
  weightDelta,
  daysSince,
  isStaleCheckIn,
  liftSeries,
  sortMeasurementsAsc,
  sortPhotosAsc,
  sortPerformanceAsc,
} from "@/features/progress/metrics"

export {
  PROGRESS_UPLOAD_LIMITS,
  buildProgressPhotoStoragePath,
  isRenderablePhotoSrc,
} from "@/features/progress/paths"

export {
  fetchMeasurements,
  fetchPhotos,
  fetchPerformance,
  saveMeasurement,
  savePhoto,
  savePerformance,
  deleteMeasurement,
  deletePhoto,
  deletePerformance,
  resolveProgressPhotoUrl,
} from "@/features/progress/service"

export {
  useMeasurementsQuery,
  usePhotosQuery,
  usePerformanceQuery,
  useProgressPhotoUrlQuery,
  useSaveMeasurementMutation,
  useSavePhotoMutation,
  useSavePerformanceMutation,
  useDeleteMeasurementMutation,
  useDeletePhotoMutation,
  useDeletePerformanceMutation,
  PROGRESS_QUERY_KEYS,
} from "@/features/progress/hooks"

