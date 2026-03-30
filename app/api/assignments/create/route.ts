import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

const schema = z.object({
  courseId: z.string().min(1),
  title: z.string().min(2),
  instructions: z.string().optional(),
  starterCode: z.string(),
  expectedOutput: z.string(),
});

export async function POST(req: Request) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  try {
    const body = schema.parse(await req.json());
    const last = await prisma.assignment.findFirst({
      where: { courseId: body.courseId },
      orderBy: { order: "desc" },
    });
    const assignment = await prisma.assignment.create({
      data: {
        courseId: body.courseId,
        title: body.title,
        instructions: body.instructions ?? "",
        starterCode: body.starterCode,
        expectedOutput: body.expectedOutput,
        order: (last?.order ?? -1) + 1,
      },
    });
    return NextResponse.json(assignment);
  } catch {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }
}
