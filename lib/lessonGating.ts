import type { SessionPayload } from "@/lib/auth";

type LessonRow = { id: string; order: number };
type LessonProgress = {
  completed?: boolean;
  passed?: boolean;
};
type LessonProgressMap = Record<string, LessonProgress | undefined>;

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
    const isCompleted =
      progressMap[lesson.id]?.completed ?? progressMap[lesson.id]?.passed;
    if (!isCompleted) prevAllCompleted = false;
  }
  return locks;
}
