import {HttpsError, onCall} from "firebase-functions/v2/https";
import {assertStaffCaller} from "../lib/authz.js";
import {dispatchExistingNotice} from "../shared/notices.js";

export const dispatchNotice = onCall(async (request) => {
  assertStaffCaller(request.auth, "notifications:send");
  const noticeId = String(
    (request.data as {noticeId?: string} | undefined)?.noticeId ?? "",
  ).trim();
  if (!noticeId) {
    throw new HttpsError("invalid-argument", "noticeId is required.");
  }
  try {
    const result = await dispatchExistingNotice(noticeId);
    return {ok: true, ...result};
  } catch (err) {
    const message = err instanceof Error ? err.message : "Dispatch failed";
    if (message === "Notice not found") {
      throw new HttpsError("not-found", message);
    }
    throw new HttpsError("internal", message);
  }
});
