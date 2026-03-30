import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET() {
  const session = await getSession();
  const courses = await prisma.course.findMany({
    orderBy: { createdAt: "asc" },
    include: {
      assignments: { select: { id: true } },
      _count: { select: { enrollments: true } },
    },
  });

  let enrolledIds: string[] = [];
  if (session) {
    const en = await prisma.enrollment.findMany({
      where: { userId: session.sub },
      select: { courseId: true },
    });
    enrolledIds = en.map((e) => e.courseId);
  }

  return NextResponse.json(
    courses.map((c) => ({
      id: c.id,
      title: c.title,
      description: c.description,
      durationHours: c.durationHours,
      difficultyLevel: c.difficultyLevel,
      assignmentCount: c.assignments.length,
      enrolled: enrolledIds.includes(c.id),
    })),
  );
}

const createSchema = z.object({
  title: z.string().min(2),
  description: z.string().min(2),
  durationHours: z.coerce.number().int().min(1),
  difficultyLevel: z.string().min(1),
});

export async function POST(req: Request) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  try {
    const body = createSchema.parse(await req.json());
    const course = await prisma.course.create({ data: body });
    return NextResponse.json(course);
  } catch {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }
}
