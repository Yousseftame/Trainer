export type {
  PhysicalTherapyRecord,
  PTAffectedArea,
  PTMovementRestriction,
  PTRehabExercise,
  PTSeverity,
  PTStatus,
} from "@/types/physicalTherapy"

export {
  listPhysicalTherapyRecords,
  fetchPTRecords,
  fetchSubscriberPTRecords,
  fetchSubscriberPTRecord,
  getPhysicalTherapyRecordById,
  savePhysicalTherapyRecord,
  savePTRecord,
  deletePhysicalTherapyRecord,
  deletePTRecord,
  exerciseConflictsWithRestriction,
  normalizePhysicalTherapyRecord,
} from "@/features/physicalTherapy/service"
export type { SavePTRecordInput } from "@/features/physicalTherapy/service"

export {
  usePTRecordsQuery,
  useSubscriberPTRecordsQuery,
  useSubscriberPTQuery,
  useSavePTRecordMutation,
  useDeletePTRecordMutation,
  PT_QUERY_KEYS,
  PT_QUERY_KEY,
} from "@/features/physicalTherapy/hooks"

export { buildRestrictionMatchTokens } from "@/features/physicalTherapy/paths"

/** @deprecated Empty seed */
export { DEMO_PT_RECORDS } from "@/features/physicalTherapy/demo"
