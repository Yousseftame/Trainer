/**
 * Cloud Functions entry — export only.
 * Domain logic lives under:
 *   admin/       staff dashboard callables
 *   subscriber/  subscriber dashboard callables (future)
 *   shared/      cross-domain helpers
 *   lib/         authz + utils
 *   config/      firebase + collection names
 */
import "./config/firebase.js";

export {
  bootstrapStaffClaims,
  createStaffMember,
  updateStaffMember,
  setStaffAccountStatus,
  deleteStaffMember,
  purgeDemoStaffData,
  createSubscriberAccount,
  updateSubscriberAccount,
  setSubscriberAccountStatus,
  deleteSubscriberAccount,
  purgeDemoSubscriberData,
  approveRegistrationRequest,
  rejectRegistrationRequest,
} from "./admin/index.js";

export {listSubscriberContentLibrary} from "./subscriber/index.js";

export {
  dispatchNotice,
  registerFcmToken,
  unregisterFcmToken,
  onRegistrationRequestCreated,
  onSubscriptionWritten,
  scanExpiringSubscriptions,
} from "./notifications/index.js";
