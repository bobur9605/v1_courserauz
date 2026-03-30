import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  const course = await prisma.course.findUnique({
    where: { id },
    include: {
      assignments: { orderBy: { order: "asc" }, select: { id: true, title: true, order: true } },
    },
  });
  if (!course) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const session = await getSession();
  let resultsMap: Record<string, { passed: boolean; score: number | null }> = {};
  if (session) {
    const results = await prisma.result.findMany({
      where: {
        studentId: session.sub,
        assignmentId: { in: course.assignments.map((a) => a.id) },
      },
    });
    resultsMap = Object.fromEntries(
      results.map((r) => [
        r.assignmentId,
        { passed: r.passed, score: r.score },
      ]),
    );
  }

  return NextResponse.json({
    id: course.id,
    title: course.title,
    description: course.description,
    durationHours: course.durationHours,
    difficultyLevel: course.difficultyLevel,
    assignments: course.assignments.map((a) => ({
      id: a.id,
      title: a.title,
      order: a.order,
      done: !!resultsMap[a.id]?.passed,
      score: resultsMap[a.id]?.score ?? null,
    })),
  });
}
