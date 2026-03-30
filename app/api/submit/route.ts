import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { normalizeOutput, runStudentCode } from "@/lib/runner";

const schema = z.object({
  assignmentId: z.string().min(1),
  code: z.string(),
});

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  try {
    const body = schema.parse(await req.json());
    const assignment = await prisma.assignment.findUnique({
      where: { id: body.assignmentId },
    });
    if (!assignment) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }

    const { stdout, ok, error } = runStudentCode(body.code);
    const expected = normalizeOutput(assignment.expectedOutput);
    const got = normalizeOutput(stdout);
    const passed = ok && got === expected;
    const score = passed ? 100 : ok ? 40 : 0;

    const record = await prisma.result.upsert({
      where: {
        studentId_assignmentId: {
          studentId: session.sub,
          assignmentId: assignment.id,
        },
      },
      create: {
        studentId: session.sub,
        assignmentId: assignment.id,
        submittedCode: body.code,
        stdout,
        passed,
        score,
        feedback: passed
          ? null
          : error
            ? `Runtime: ${error}`
            : `Expected: "${expected}" but got: "${got}"`,
      },
      update: {
        submittedCode: body.code,
        stdout,
        passed,
        score,
        feedback: passed
          ? null
          : error
            ? `Runtime: ${error}`
            : `Expected: "${expected}" but got: "${got}"`,
      },
    });

    return NextResponse.json({
      passed,
      score: record.score,
      stdout,
      error: error ?? null,
      feedback: record.feedback,
    });
  } catch {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }
}
