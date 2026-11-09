import {HttpsError, onCall} from "firebase-functions/v2/https";
import {COLLECTIONS} from "../config/collections.js";
import {db} from "../config/firebase.js";
import {stripUndefined} from "../lib/utils.js";

function tokenDocId(uid: string, token: string) {
  return `${uid}_${token.slice(-12)}`;
}

export const registerFcmToken = onCall(async (request) => {
  if (!request.auth?.uid) {
    throw new HttpsError("unauthenticated", "Sign in required.");
  }
  const uid = request.auth.uid;
  const data = (request.data ?? {}) as {token?: string; platform?: string};
  const token = String(data.token ?? "").trim();
  if (!token || token.length < 20) {
    throw new HttpsError("invalid-argument", "Valid FCM token required.");
  }
  const platform = String(data.platform ?? "web");
  const id = tokenDocId(uid, token);
  await db.collection(COLLECTIONS.fcmTokens).doc(id).set(
    stripUndefined({
      id,
      uid,
      token,
      platform,
      role: request.auth.token.role ?? null,
      updatedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    }),
    {merge: true},
  );
  return {ok: true, id};
});

export const unregisterFcmToken = onCall(async (request) => {
  if (!request.auth?.uid) {
    throw new HttpsError("unauthenticated", "Sign in required.");
  }
  const uid = request.auth.uid;
  const token = String(
    (request.data as {token?: string} | undefined)?.token ?? "",
  ).trim();
  if (!token) {
    throw new HttpsError("invalid-argument", "token is required.");
  }
  await db.collection(COLLECTIONS.fcmTokens).doc(tokenDocId(uid, token)).delete();
  return {ok: true};
});
