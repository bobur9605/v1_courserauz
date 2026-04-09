import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSession } from "@/lib/auth";
import { studentMayAccessAssignmentOrder } from "@/lib/assignmentGatingServer";

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
      "id, title, instructions, starterCode, expectedOutput, courseId, order",
    )
    .eq("id", id)
    .maybeSingle();
  if (error || !row) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  if (
    session.role === "STUDENT" &&
    !(await studentMayAccessAssignmentOrder(
      session.sub,
      row.courseId,
      row.order,
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
    courseId: row.courseId,
    courseTitle: course?.title ?? "",
    result,
  });
}
