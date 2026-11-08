/**
 * Compatibility shim — demo registration requests removed.
 */
export type {
  RegistrationRequest as DemoRegistrationRequest,
  RegistrationRequestStatus,
} from "@/features/subscribers/types"

import type { RegistrationRequest } from "@/features/subscribers/types"

/** @deprecated Empty — use useRegistrationRequestsQuery / fetchRegistrationRequests */
export const DEMO_REGISTRATION_REQUESTS: RegistrationRequest[] = []
