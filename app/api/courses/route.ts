import { NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSession } from "@/lib/auth";
import { newId } from "@/lib/ids";

export async function GET() {
  const session = await getSession();
  const supabase = createAdminClient();
  const { data: courses, error: cErr } = await supabase
    .from("Course")
    .select("*")
    .order("createdAt", { ascending: true });
  if (cErr || !courses) {
    return NextResponse.json([], { status: 200 });
  }
  const { data: assignments } = await supabase
    .from("Assignment")
    .select("id, courseId");
  const byCourse = new Map<string, number>();
  for (const a of assignments ?? []) {
    byCourse.set(a.courseId, (byCourse.get(a.courseId) ?? 0) + 1);
  }

  let enrolledIds: string[] = [];
  if (session) {
    const { data: en } = await supabase
      .from("Enrollment")
      .select("courseId")
      .eq("userId", session.sub);
    enrolledIds = (en ?? []).map((e) => e.courseId);
  }

  return NextResponse.json(
    courses.map((c) => ({
      id: c.id,
      title: c.title,
      description: c.description,
      durationHours: c.durationHours,
      difficultyLevel: c.difficultyLevel,
      assignmentCount: byCourse.get(c.id) ?? 0,
      enrolled: enrolledIds.includes(c.id),
    })),
  );
}

const createSchema = z.object({
  title: z.string().min(2),
  description: z.string().min(2),
  durationHours: z.coerce.number().int().min(1),
  difficultyLevel: z.string().min(1),
  teacherId: z.string().min(1),
});

export async function POST(req: Request) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  try {
    const body = createSchema.parse(await req.json());
    const supabase = createAdminClient();
    const { data: teacher, error: tErr } = await supabase
      .from("User")
      .select("id")
      .eq("id", body.teacherId)
      .eq("role", "TEACHER")
      .maybeSingle();
    if (tErr || !teacher) {
      return NextResponse.json({ error: "invalid_teacher" }, { status: 400 });
    }
    const { data: course, error } = await supabase
      .from("Course")
      .insert({
        id: newId(),
        title: body.title,
        description: body.description,
        durationHours: body.durationHours,
        difficultyLevel: body.difficultyLevel,
        teacherId: body.teacherId,
      })
      .select("*")
      .single();
    if (error || !course) {
      return NextResponse.json({ error: "bad_request" }, { status: 400 });
    }
    return NextResponse.json(course);
  } catch {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }
}
