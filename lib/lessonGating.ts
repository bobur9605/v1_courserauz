import type { SessionPayload } from "@/lib/auth";

type LessonRow = { id: string; order: number };
type LessonProgressMap = Record<string, { completed?: boolean } | undefined>;

export function bypassesLessonSequence(session: SessionPayload | null): boolean {
  return session?.role === "SUPERADMIN" || session?.role === "TEACHER";
}

export function lessonLockMap(
  lessons: LessonRow[],
  progressMap: LessonProgressMap,
  session: SessionPayload | null,
): Record<string, boolean> {
  if (bypassesLessonSequence(session)) {
    return Object.fromEntries(lessons.map((l) => [l.id, false]));
  }
  const sorted = [...lessons].sort((a, b) => a.order - b.order);
  const locks: Record<string, boolean> = {};
  let prevAllCompleted = true;
  for (const lesson of sorted) {
    locks[lesson.id] = !prevAllCompleted;
    if (!progressMap[lesson.id]?.completed) prevAllCompleted = false;
  }
  return locks;
}
