import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSession } from "@/lib/auth";
import { lessonLockMap } from "@/lib/lessonGating";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  const supabase = createAdminClient();
  const { data: course, error } = await supabase
    .from("Course")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error || !course) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  const { data: lessons } = await supabase
    .from("Lesson")
    .select("id, title, order, assignmentId, isPublished")
    .eq("courseId", id)
    .order("order", { ascending: true });

  const session = await getSession();
  let progressMap: Record<string, { completed: boolean; score: number | null }> =
    {};
  if (session && lessons?.length) {
    const assignmentIds = lessons.map((l) => l.assignmentId).filter(Boolean);
    const { data: results } = assignmentIds.length
      ? await supabase
      .from("Result")
      .select("assignmentId, passed, score")
      .eq("studentId", session.sub)
      .in("assignmentId", assignmentIds)
      : { data: [] as { assignmentId: string; passed: boolean; score: number | null }[] };
    const { data: completions } = await supabase
      .from("LessonCompletion")
      .select("lessonId")
      .eq("studentId", session.sub)
      .in("lessonId", lessons.map((l) => l.id));
    const completionSet = new Set((completions ?? []).map((c) => c.lessonId));
    const resultByAssignment = Object.fromEntries(
      (results ?? []).map((r) => [
        r.assignmentId,
        { passed: r.passed, score: r.score },
      ]),
    );
    progressMap = Object.fromEntries(
      lessons.map((lesson) => {
        const assignmentResult = lesson.assignmentId
          ? resultByAssignment[lesson.assignmentId]
          : null;
        return [
          lesson.id,
          {
            completed: lesson.assignmentId
              ? !!assignmentResult?.passed
              : completionSet.has(lesson.id),
            score: assignmentResult?.score ?? null,
          },
        ];
      }),
    );
  }

  const lockById = lessonLockMap(
    (lessons ?? []).map((l) => ({ id: l.id, order: l.order })),
    progressMap,
    session,
  );
  return NextResponse.json({
    id: course.id,
    title: course.title,
    description: course.description,
    durationHours: course.durationHours,
    difficultyLevel: course.difficultyLevel,
    teacherId: (course as { teacherId?: string | null }).teacherId ?? null,
    lessons: (lessons ?? []).map((l) => ({
      id: l.id,
      title: l.title,
      order: l.order,
      assignmentId: l.assignmentId,
      isPublished: l.isPublished,
      done: !!progressMap[l.id]?.completed,
      score: progressMap[l.id]?.score ?? null,
      locked: !!lockById[l.id],
    })),
  });
}
