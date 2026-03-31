import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSession } from "@/lib/auth";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  const supabase = createAdminClient();
  const { data: row, error } = await supabase
    .from("Assignment")
    .select("id, title, instructions, starterCode, expectedOutput, courseId")
    .eq("id", id)
    .maybeSingle();
  if (error || !row) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  const { data: course } = await supabase
    .from("Course")
    .select("title")
    .eq("id", row.courseId)
    .maybeSingle();

  const session = await getSession();
  let result = null as null | {
    score: number | null;
    feedback: string | null;
    passed: boolean;
    submittedCode: string;
  };

  if (session) {
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
