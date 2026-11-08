import {onCall} from "firebase-functions/v2/https";
import {db} from "../../config/firebase.js";
import {COLLECTIONS} from "../../config/collections.js";
import {assertStaffCaller} from "../../lib/authz.js";
import {isFirebaseUid} from "../../lib/utils.js";

export const purgeDemoSubscriberData = onCall(async (request) => {
  assertStaffCaller(request.auth, "subscribers:write");

  const [subsSnap, reqsSnap] = await Promise.all([
    db.collection(COLLECTIONS.subscribers).get(),
    db.collection(COLLECTIONS.registrationRequests).get(),
  ]);

  let deletedSubscribers = 0;
  let deletedRequests = 0;
  let batch = db.batch();
  let ops = 0;

  const commitIfNeeded = async (force = false) => {
    if (ops === 0) return;
    if (!force && ops < 400) return;
    await batch.commit();
    batch = db.batch();
    ops = 0;
  };

  for (const docSnap of subsSnap.docs) {
    const id = docSnap.id;
    const looksDemo =
      !isFirebaseUid(id) ||
      id.startsWith("sub-") ||
      id.startsWith("auth-") ||
      id.startsWith("pdf-");
    if (!looksDemo) continue;
    batch.delete(docSnap.ref);
    deletedSubscribers += 1;
    ops += 1;
    await commitIfNeeded();
  }

  for (const docSnap of reqsSnap.docs) {
    const id = docSnap.id;
    const data = docSnap.data();
    const linked =
      typeof data.subscriberId === "string" ? data.subscriberId : "";
    const looksDemo =
      id.startsWith("req-") ||
      (linked && !isFirebaseUid(linked)) ||
      (!isFirebaseUid(id) && id.includes("-"));
    const isRealRequestId = isFirebaseUid(id);
    if (isRealRequestId && (!linked || isFirebaseUid(linked))) {
      const email = String(data.email ?? "");
      if (!email.endsWith("@trainer.app")) continue;
    }
    if (!looksDemo && !String(data.email ?? "").endsWith("@trainer.app")) {
      continue;
    }
    batch.delete(docSnap.ref);
    deletedRequests += 1;
    ops += 1;
    await commitIfNeeded();
  }

  await commitIfNeeded(true);

  return {ok: true, deletedSubscribers, deletedRequests};
});
