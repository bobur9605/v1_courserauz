import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSession } from "@/lib/auth";
import { newId } from "@/lib/ids";
import { studentMayAccessLessonOrder } from "@/lib/lessonGatingServer";

type Ctx = { params: Promise<{ id: string; lessonId: string }> };

export async function POST(_req: Request, ctx: Ctx) {
  const session = await getSession();
  if (!session || session.role !== "STUDENT") {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  const { id: courseId, lessonId } = await ctx.params;
  const supabase = createAdminClient();

  const { data: lesson } = await supabase
    .from("Lesson")
    .select("id, assignmentId, courseId, order")
    .eq("id", lessonId)
    .eq("courseId", courseId)
    .maybeSingle();
  if (!lesson) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  if (lesson.assignmentId) {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }

  const { data: enrollment } = await supabase
    .from("Enrollment")
    .select("id")
    .eq("userId", session.sub)
    .eq("courseId", courseId)
    .maybeSingle();
  if (!enrollment) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  if (!(await studentMayAccessLessonOrder(session.sub, courseId, lesson.order))) {
    return NextResponse.json({ error: "sequence_locked" }, { status: 403 });
  }

  const { error } = await supabase.from("LessonCompletion").upsert(
    {
      id: newId(),
      lessonId,
      studentId: session.sub,
      createdAt: new Date().toISOString(),
    },
    { onConflict: "lessonId,studentId" },
  );
  if (error) {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }
  return NextResponse.json({ ok: true });
}
