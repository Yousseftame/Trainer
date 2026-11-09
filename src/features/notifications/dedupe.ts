/** Prevents the same notice from firing two browser alerts (FCM + Firestore). */
const recent = new Map<string, number>()
const TTL_MS = 60_000

export function claimNoticeAlert(noticeId: string | undefined | null): boolean {
  if (!noticeId) return true
  const now = Date.now()
  for (const [id, at] of recent) {
    if (now - at > TTL_MS) recent.delete(id)
  }
  if (recent.has(noticeId)) return false
  recent.set(noticeId, now)
  return true
}
