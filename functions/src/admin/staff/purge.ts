import {onCall} from "firebase-functions/v2/https";
import {auth, db} from "../../config/firebase.js";
import {COLLECTIONS} from "../../config/collections.js";
import {assertStaffCaller} from "../../lib/authz.js";
import {isFirebaseUid} from "../../lib/utils.js";

/** Known seed emails from the retired client demo staff list. */
const DEMO_STAFF_EMAILS = new Set([
  "youssef@derpyfit.com",
  "ziad@derpyfit.com",
  "nour@derpyfit.com",
  "tarek@derpyfit.com",
  "salma@derpyfit.com",
]);

/**
 * Removes fake staff directory rows that were client-seeded (non-Auth ids)
 * and known demo emails. Real Firebase Auth staff profiles are kept.
 */
export const purgeDemoStaffData = onCall(async (request) => {
  assertStaffCaller(request.auth, "staff:manage");

  const snap = await db.collection(COLLECTIONS.staff).get();
  let deleted = 0;
  let batch = db.batch();
  let ops = 0;

  const commitIfNeeded = async (force = false) => {
    if (ops === 0) return;
    if (!force && ops < 400) return;
    await batch.commit();
    batch = db.batch();
    ops = 0;
  };

  for (const docSnap of snap.docs) {
    const id = docSnap.id;
    const data = docSnap.data() ?? {};
    const email = String(data.email ?? "").trim().toLowerCase();
    const role = String(data.role ?? "");

    const fakeId =
      !isFirebaseUid(id) ||
      id.startsWith("staff-") ||
      id.startsWith("auth-");
    const fakeEmail = DEMO_STAFF_EMAILS.has(email);

    // Keep real Auth-backed profiles, including the live head coach.
    if (!fakeId && !fakeEmail) continue;
    // Never delete a real-uid head coach just because email matched allowlist.
    if (isFirebaseUid(id) && role === "head_coach" && !fakeId) continue;

    batch.delete(docSnap.ref);
    deleted += 1;
    ops += 1;
    await commitIfNeeded();

    // Demo rows never had real Auth users; skip Auth delete for fake ids.
    if (isFirebaseUid(id) && fakeEmail) {
      try {
        await auth.deleteUser(id);
      } catch {
        // ignore missing Auth users
      }
    }
  }

  await commitIfNeeded(true);
  return {ok: true, deleted};
});
