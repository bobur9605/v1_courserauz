import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSession } from "@/lib/auth";
import { canManageCourseContent } from "@/lib/coursePermissions";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, ctx: Ctx) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const { id: courseId } = await ctx.params;
  const supabase = createAdminClient();

  const { data: course } = await supabase
    .from("Course")
    .select("teacherId")
    .eq("id", courseId)
    .maybeSingle();
  if (!course || !canManageCourseContent(session, course.teacherId)) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const { data: lessons } = await supabase
    .from("Lesson")
    .select("id, title, order, assignmentId")
    .eq("courseId", courseId)
    .order("order", { ascending: true });
  const lessonIds = (lessons ?? []).map((l) => l.id);
  const assignmentIds = (lessons ?? []).map((l) => l.assignmentId).filter(Boolean);

  const { data: enrollRows } = await supabase
    .from("Enrollment")
    .select("userId")
    .eq("courseId", courseId);
  const userIds = [...new Set((enrollRows ?? []).map((e) => e.userId))];

  const { data: users } = userIds.length
    ? await supabase
        .from("User")
        .select("id, fullName, email")
        .in("id", userIds)
    : { data: [] as { id: string; fullName: string; email: string }[] };

  const { data: results } = userIds.length && assignmentIds.length
    ? await supabase
        .from("Result")
        .select("studentId, assignmentId, passed")
        .in("studentId", userIds)
        .in("assignmentId", assignmentIds)
    : { data: [] as { studentId: string; assignmentId: string; passed: boolean }[] };
  const { data: completions } = userIds.length && lessonIds.length
    ? await supabase
        .from("LessonCompletion")
        .select("studentId, lessonId")
        .in("studentId", userIds)
        .in("lessonId", lessonIds)
    : { data: [] as { studentId: string; lessonId: string }[] };

  const passedByStudent = new Map<string, Set<string>>();
  const completedByStudent = new Map<string, Set<string>>();
  for (const uid of userIds) {
    passedByStudent.set(uid, new Set());
    completedByStudent.set(uid, new Set());
  }
  for (const row of results ?? []) {
    if (!row.passed) continue;
    passedByStudent.get(row.studentId)?.add(row.assignmentId);
  }
  for (const row of completions ?? []) {
    completedByStudent.get(row.studentId)?.add(row.lessonId);
  }

  return NextResponse.json({
    totalLessons: lessons?.length ?? 0,
    students: (users ?? []).map((u) => {
      const passedAssignments = passedByStudent.get(u.id) ?? new Set<string>();
      const completedLessons = completedByStudent.get(u.id) ?? new Set<string>();
      let finishedCount = 0;
      let lastCompletedLesson: string | null = null;
      const lessonStatuses = (lessons ?? []).map((lesson) => {
        const completed = lesson.assignmentId
          ? passedAssignments.has(lesson.assignmentId)
          : completedLessons.has(lesson.id);
        if (completed) {
          finishedCount += 1;
          lastCompletedLesson = lesson.title;
        }
        return { lessonId: lesson.id, lessonTitle: lesson.title, completed };
      });
      return {
        userId: u.id,
        fullName: u.fullName,
        email: u.email,
        completedLessons: finishedCount,
        completionPercent:
          (lessons?.length ?? 0) > 0
            ? Math.round((finishedCount / (lessons?.length ?? 1)) * 100)
            : 0,
        lastCompletedLesson,
        lessonStatuses,
      };
    }),
  });
}
