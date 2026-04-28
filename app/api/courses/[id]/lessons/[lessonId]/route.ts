import { NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSession } from "@/lib/auth";
import { canManageCourseContent } from "@/lib/coursePermissions";
import { bypassesLessonSequence } from "@/lib/lessonGating";
import { studentMayAccessLessonOrder } from "@/lib/lessonGatingServer";

type Ctx = { params: Promise<{ id: string; lessonId: string }> };

const patchSchema = z.object({
  title: z.string().min(2).optional(),
  content: z.string().optional(),
  isPublished: z.boolean().optional(),
});

export async function GET(_req: Request, ctx: Ctx) {
  const { id: courseId, lessonId } = await ctx.params;
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const supabase = createAdminClient();

  const { data: lesson } = await supabase
    .from("Lesson")
    .select("id, courseId, title, content, order, isPublished, assignmentId")
    .eq("id", lessonId)
    .eq("courseId", courseId)
    .maybeSingle();
  if (!lesson) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const { data: course } = await supabase
    .from("Course")
    .select("teacherId")
    .eq("id", courseId)
    .maybeSingle();
  if (!course) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  if (session.role === "STUDENT") {
    const { data: enrollment } = await supabase
      .from("Enrollment")
      .select("id")
      .eq("userId", session.sub)
      .eq("courseId", courseId)
      .maybeSingle();
    if (!enrollment) {
      return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }

    if (
      !bypassesLessonSequence(session) &&
      !(await studentMayAccessLessonOrder(session.sub, courseId, lesson.order))
    ) {
      return NextResponse.json({ error: "sequence_locked" }, { status: 403 });
    }
  } else if (!canManageCourseContent(session, course.teacherId)) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  let assignment = null as null | {
    id: string;
    title: string;
    instructions: string;
    starterCode: string;
    expectedOutput: string;
    language: string;
  };
  if (lesson.assignmentId) {
    const { data: row } = await supabase
      .from("Assignment")
      .select("id, title, instructions, starterCode, expectedOutput, language")
      .eq("id", lesson.assignmentId)
      .maybeSingle();
    if (row) assignment = row;
  }

  const { data: completion } = await supabase
    .from("LessonCompletion")
    .select("id")
    .eq("lessonId", lesson.id)
    .eq("studentId", session.sub)
    .maybeSingle();

  return NextResponse.json({
    ...lesson,
    assignment,
    completed: !!completion || false,
  });
}

export async function PATCH(req: Request, ctx: Ctx) {
  const { id: courseId, lessonId } = await ctx.params;
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let body: z.infer<typeof patchSchema>;
  try {
    body = patchSchema.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }

  const supabase = createAdminClient();
  const { data: course } = await supabase
    .from("Course")
    .select("teacherId")
    .eq("id", courseId)
    .maybeSingle();
  if (!course || !canManageCourseContent(session, course.teacherId)) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const patch: Record<string, unknown> = { updatedAt: new Date().toISOString() };
  if (body.title !== undefined) patch.title = body.title;
  if (body.content !== undefined) patch.content = body.content;
  if (body.isPublished !== undefined) patch.isPublished = body.isPublished;

  const { data: updated, error } = await supabase
    .from("Lesson")
    .update(patch)
    .eq("id", lessonId)
    .eq("courseId", courseId)
    .select("id, title, content, order, isPublished, assignmentId")
    .single();
  if (error || !updated) {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }
  return NextResponse.json(updated);
}
