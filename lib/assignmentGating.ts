import type { SessionPayload } from "@/lib/auth";

export function bypassesAssignmentSequence(session: SessionPayload | null): boolean {
  return session?.role === "ADMIN" || session?.role === "TEACHER";
}

type AssignmentRow = { id: string; order: number };
type ResultsMap = Record<string, { passed?: boolean } | undefined>;

/** Per assignment id: true if this student may not open it yet (sequential lessons). */
export function assignmentLockMap(
  assignments: AssignmentRow[],
  resultsMap: ResultsMap,
  session: SessionPayload | null,
): Record<string, boolean> {
  if (bypassesAssignmentSequence(session)) {
    return Object.fromEntries(assignments.map((a) => [a.id, false]));
  }
  const sorted = [...assignments].sort((a, b) => a.order - b.order);
  const locks: Record<string, boolean> = {};
  let prevAllPassed = true;
  for (const a of sorted) {
    locks[a.id] = !prevAllPassed;
    if (!resultsMap[a.id]?.passed) prevAllPassed = false;
  }
  return locks;
}
