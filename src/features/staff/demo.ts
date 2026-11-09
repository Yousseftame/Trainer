import type { StaffMember } from "@/types/staff"

/**
 * Demo staff seed removed — staff accounts are created only via Cloud Functions
 * (Auth user + claims + Firestore profile). Kept as an empty export so any
 * leftover imports fail closed instead of minting fake admin identities.
 */
export const DEMO_STAFF_MEMBERS: StaffMember[] = []
