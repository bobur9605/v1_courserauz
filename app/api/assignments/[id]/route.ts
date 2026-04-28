import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSession } from "@/lib/auth";
import { studentMayAccessLessonOrder } from "@/lib/lessonGatingServer";
import { z } from "zod";
import { canManageCourseContent } from "@/lib/coursePermissions";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();
  const { data: row, error } = await supabase
    .from("Assignment")
    .select(
      "id, title, instructions, starterCode, expectedOutput, courseId, order, language, lessonId",
    )
    .eq("id", id)
    .maybeSingle();
  if (error || !row) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  const { data: lesson } = row.lessonId
    ? await supabase
        .from("Lesson")
        .select("order")
        .eq("id", row.lessonId)
        .maybeSingle()
    : { data: null };
  if (
    session.role === "STUDENT" &&
    lesson &&
    !(await studentMayAccessLessonOrder(
      session.sub,
      row.courseId,
      lesson.order,
    ))
  ) {
    return NextResponse.json({ error: "sequence_locked" }, { status: 403 });
  }
  const { data: course } = await supabase
    .from("Course")
    .select("title")
    .eq("id", row.courseId)
    .maybeSingle();

  let result = null as null | {
    score: number | null;
    feedback: string | null;
    passed: boolean;
    submittedCode: string;
  };

  const { data: r } = await supabase
    .from("Result")
    .select("score, feedback, passed, submittedCode")
    .eq("studentId", session.sub)
    .eq("assignmentId", id)
    .maybeSingle();
  if (r) {
    result = {
      score: r.score,
      feedback: r.feedback,
      passed: r.passed,
      submittedCode: r.submittedCode,
    };
  }

  return NextResponse.json({
    id: row.id,
    title: row.title,
    instructions: row.instructions,
    starterCode: row.starterCode,
    expectedOutput: row.expectedOutput,
    language: row.language,
    courseId: row.courseId,
    courseTitle: course?.title ?? "",
    result,
  });
}

const patchSchema = z.object({
  title: z.string().min(2).optional(),
  instructions: z.string().optional(),
  starterCode: z.string().optional(),
  expectedOutput: z.string().optional(),
  language: z.enum(["javascript", "html", "css"]).optional(),
});

export async function PATCH(req: Request, ctx: Ctx) {
  const { id } = await ctx.params;
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
  const { data: row } = await supabase
    .from("Assignment")
    .select("id, courseId")
    .eq("id", id)
    .maybeSingle();
  if (!row) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const { data: course } = await supabase
    .from("Course")
    .select("teacherId")
    .eq("id", row.courseId)
    .maybeSingle();
  if (!course || !canManageCourseContent(session, course.teacherId)) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const patch: Record<string, unknown> = {};
  if (body.title !== undefined) patch.title = body.title;
  if (body.instructions !== undefined) patch.instructions = body.instructions;
  if (body.starterCode !== undefined) patch.starterCode = body.starterCode;
  if (body.expectedOutput !== undefined) patch.expectedOutput = body.expectedOutput;
  if (body.language !== undefined) patch.language = body.language;

  const { data: updated, error } = await supabase
    .from("Assignment")
    .update(patch)
    .eq("id", id)
    .select(
      "id, title, instructions, starterCode, expectedOutput, courseId, order, language",
    )
    .single();
  if (error || !updated) {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }
  return NextResponse.json(updated);
}
