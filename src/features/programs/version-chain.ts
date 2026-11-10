/**
 * Walk previousVersionId links (older + newer) from a clicked program
 * so History / admin dialogs show the meaningful lineage, not every plan
 * ever assigned to the subscriber.
 */
export function collectProgramVersionChain<
  T extends { id: string; previousVersionId?: string },
>(startId: string, programs: T[]): T[] {
  const byId = new Map(programs.map((p) => [p.id, p]))
  if (!byId.has(startId)) return programs

  const chainIds = new Set<string>([startId])

  let cursor = byId.get(startId)
  while (cursor?.previousVersionId && byId.has(cursor.previousVersionId)) {
    if (chainIds.has(cursor.previousVersionId)) break
    chainIds.add(cursor.previousVersionId)
    cursor = byId.get(cursor.previousVersionId)
  }

  let grew = true
  while (grew) {
    grew = false
    for (const program of programs) {
      if (
        program.previousVersionId &&
        chainIds.has(program.previousVersionId) &&
        !chainIds.has(program.id)
      ) {
        chainIds.add(program.id)
        grew = true
      }
    }
  }

  return programs
    .filter((p) => chainIds.has(p.id))
    .sort(
      (a, b) =>
        ("updatedAt" in a && "updatedAt" in b
          ? new Date(String((b as { updatedAt?: string }).updatedAt ?? 0)).getTime() -
            new Date(String((a as { updatedAt?: string }).updatedAt ?? 0)).getTime()
          : 0),
    )
}
