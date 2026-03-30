import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  if (session.role === "ADMIN") {
    const rows = await prisma.result.findMany({
      orderBy: { updatedAt: "desc" },
      include: {
        student: { select: { fullName: true, email: true } },
        assignment: {
          select: { title: true, course: { select: { title: true } } },
        },
      },
      take: 200,
    });
    return NextResponse.json(
      rows.map((r) => ({
        id: r.id,
        studentName: r.student.fullName,
        studentEmail: r.student.email,
        courseTitle: r.assignment.course.title,
        assignmentTitle: r.assignment.title,
        score: r.score,
        passed: r.passed,
        feedback: r.feedback,
      })),
    );
  }

  const rows = await prisma.result.findMany({
    where: { studentId: session.sub },
    orderBy: { updatedAt: "desc" },
    include: {
      assignment: {
        select: { title: true, course: { select: { title: true } } },
      },
    },
  });

  return NextResponse.json(
    rows.map((r) => ({
      id: r.id,
      courseTitle: r.assignment.course.title,
      assignmentTitle: r.assignment.title,
      score: r.score,
      passed: r.passed,
      feedback: r.feedback,
    })),
  );
}
