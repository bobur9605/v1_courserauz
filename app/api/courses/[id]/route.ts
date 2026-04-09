import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSession } from "@/lib/auth";
import { assignmentLockMap } from "@/lib/assignmentGating";

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
  const { data: assignments } = await supabase
    .from("Assignment")
    .select("id, title, order")
    .eq("courseId", id)
    .order("order", { ascending: true });

  const session = await getSession();
  let resultsMap: Record<string, { passed: boolean; score: number | null }> =
    {};
  if (session && assignments?.length) {
    const ids = assignments.map((a) => a.id);
    const { data: results } = await supabase
      .from("Result")
      .select("assignmentId, passed, score")
      .eq("studentId", session.sub)
      .in("assignmentId", ids);
    resultsMap = Object.fromEntries(
      (results ?? []).map((r) => [
        r.assignmentId,
        { passed: r.passed, score: r.score },
      ]),
    );
  }

  const lockById = assignmentLockMap(
    assignments ?? [],
    resultsMap,
    session,
  );
  return NextResponse.json({
    id: course.id,
    title: course.title,
    description: course.description,
    durationHours: course.durationHours,
    difficultyLevel: course.difficultyLevel,
    teacherId: (course as { teacherId?: string | null }).teacherId ?? null,
    assignments: (assignments ?? []).map((a) => ({
      id: a.id,
      title: a.title,
      order: a.order,
      done: !!resultsMap[a.id]?.passed,
      score: resultsMap[a.id]?.score ?? null,
      locked: !!lockById[a.id],
    })),
  });
}
