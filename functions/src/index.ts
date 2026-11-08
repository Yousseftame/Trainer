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
  createSubscriberAccount,
  updateSubscriberAccount,
  setSubscriberAccountStatus,
  deleteSubscriberAccount,
  purgeDemoSubscriberData,
  approveRegistrationRequest,
  rejectRegistrationRequest,
} from "./admin/index.js";
