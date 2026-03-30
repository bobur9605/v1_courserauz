import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  const row = await prisma.assignment.findUnique({
    where: { id },
    include: { course: true },
  });

  if (!row) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const session = await getSession();
  let result = null as null | {
    score: number | null;
    feedback: string | null;
    passed: boolean;
    submittedCode: string;
  };

  if (session) {
    const r = await prisma.result.findUnique({
      where: {
        studentId_assignmentId: {
          studentId: session.sub,
          assignmentId: id,
        },
      },
    });
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
    courseTitle: row.course.title,
    result,
  });
}
