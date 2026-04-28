import { createAdminClient } from "@/lib/supabase/admin";

type CourseRow = {
  id: string;
  title: string;
};

type LessonRow = {
  id: string;
  courseId: string;
  title: string;
  order: number;
  assignmentId: string | null;
};

type ResultRow = {
  assignmentId: string;
  passed: boolean;
  score: number | null;
};

type CompletionRow = {
  lessonId: string;
};

export type StudentCourseProgress = {
  courseId: string;
  courseTitle: string;
  completedLessons: number;
  totalLessons: number;
  percent: number;
  nextLessonId: string | null;
  nextLessonTitle: string | null;
  isComplete: boolean;
};

export async function getStudentCourseProgress(
  userId: string,
  courseRows: CourseRow[],
): Promise<Record<string, StudentCourseProgress>> {
  const courseIds = courseRows.map((row) => row.id);
  if (!courseIds.length) {
    return {};
  }

  const supabase = createAdminClient();
  const { data: lessonsRaw } = await supabase
    .from("Lesson")
    .select("id, courseId, title, order, assignmentId")
    .in("courseId", courseIds)
    .order("courseId", { ascending: true })
    .order("order", { ascending: true });
  const lessons = (lessonsRaw ?? []) as LessonRow[];

  const lessonIds = lessons.map((lesson) => lesson.id);
  const assignmentIds = lessons.map((lesson) => lesson.assignmentId).filter(Boolean);

  const { data: resultRows } = assignmentIds.length
    ? await supabase
        .from("Result")
        .select("assignmentId, passed, score")
        .eq("studentId", userId)
        .in("assignmentId", assignmentIds)
    : { data: [] as ResultRow[] };
  const { data: completionRows } = lessonIds.length
    ? await supabase
        .from("LessonCompletion")
        .select("lessonId")
        .eq("studentId", userId)
        .in("lessonId", lessonIds)
    : { data: [] as CompletionRow[] };

  const resultByAssignment = new Map(
    (resultRows ?? []).map((row) => [row.assignmentId, { passed: row.passed, score: row.score }]),
  );
  const completedLessonIds = new Set((completionRows ?? []).map((row) => row.lessonId));
  const lessonsByCourse = new Map<string, LessonRow[]>();
  for (const lesson of lessons) {
    const rows = lessonsByCourse.get(lesson.courseId) ?? [];
    rows.push(lesson);
    lessonsByCourse.set(lesson.courseId, rows);
  }

  return Object.fromEntries(
    courseRows.map((course) => {
      const courseLessons = (lessonsByCourse.get(course.id) ?? []).sort(
        (a, b) => a.order - b.order,
      );
      const completedCount = courseLessons.filter((lesson) => {
        if (lesson.assignmentId) {
          return !!resultByAssignment.get(lesson.assignmentId)?.passed;
        }
        return completedLessonIds.has(lesson.id);
      }).length;
      const totalLessons = courseLessons.length;
      const nextLesson =
        courseLessons.find((lesson) => {
          if (lesson.assignmentId) {
            return !resultByAssignment.get(lesson.assignmentId)?.passed;
          }
          return !completedLessonIds.has(lesson.id);
        }) ?? null;
      const percent = totalLessons ? Math.round((completedCount / totalLessons) * 100) : 0;

      return [
        course.id,
        {
          courseId: course.id,
          courseTitle: course.title,
          completedLessons: completedCount,
          totalLessons,
          percent,
          nextLessonId: nextLesson?.id ?? null,
          nextLessonTitle: nextLesson?.title ?? null,
          isComplete: totalLessons > 0 && completedCount === totalLessons,
        } satisfies StudentCourseProgress,
      ];
    }),
  );
}
