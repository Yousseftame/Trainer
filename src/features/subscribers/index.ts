export type {
  Subscriber,
  SubscriberRow,
  RegistrationRequest,
  RegistrationRequestStatus,
} from "@/features/subscribers/types"
export {
  subscriberDisplayName,
  isFirebaseAuthUid,
  clearSubscriberLocalCaches,
} from "@/features/subscribers/types"
export {
  buildSubscriberRow,
  fetchSubscribers,
  fetchSubscriberById,
  fetchSubscriberByEmail,
  fetchRegistrationRequests,
  saveSubscriber,
  subscribePendingRegistrationRequestCount,
  subscribeSubscriberById,
  updateMySubscriberProfile,
  updateSubscriberAccountStatus,
  deleteSubscriberAccount,
  createRegistrationRequest,
  reviewRegistrationRequest,
  updateSubscriberCoachNotes,
  purgeDemoSubscriberData,
} from "@/features/subscribers/service"
export type {
  SaveSubscriberInput,
  UpdateMyProfileInput,
} from "@/features/subscribers/service"

/** @deprecated Use Subscriber */
export type { Subscriber as DemoSubscriber } from "@/features/subscribers/types"
/** @deprecated Use RegistrationRequest */
export type { RegistrationRequest as DemoRegistrationRequest } from "@/features/subscribers/types"
