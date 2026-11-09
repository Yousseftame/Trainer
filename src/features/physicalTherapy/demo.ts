/**
 * Compatibility shim — demo physical therapy seed data removed.
 * Prefer Firestore services via `@/features/physicalTherapy/service`.
 */
import type { PhysicalTherapyRecord } from "@/types/physicalTherapy"

/** @deprecated Empty — live data comes from Firestore `physical_therapy` */
export const DEMO_PT_RECORDS: PhysicalTherapyRecord[] = []
