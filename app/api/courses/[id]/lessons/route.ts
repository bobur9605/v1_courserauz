import { NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSession } from "@/lib/auth";
import { canManageCourseContent } from "@/lib/coursePermissions";
import { newId } from "@/lib/ids";
import {
  isSchemaNotReadyError,
  schemaNotReadyResponse,
} from "@/lib/supabase/schemaErrors";

type Ctx = { params: Promise<{ id: string }> };

const createSchema = z.object({
  title: z.string().min(2),
  content: z.string().optional(),
  assignmentTitle: z.string().min(2).optional(),
  assignmentInstructions: z.string().optional(),
  starterCode: z.string().optional(),
  expectedOutput: z.string().optional(),
  language: z.enum(["javascript", "html", "css"]).optional(),
});

export async function GET(_req: Request, ctx: Ctx) {
  const { id: courseId } = await ctx.params;
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const supabase = createAdminClient();

  const { data: course, error: courseError } = await supabase
    .from("Course")
    .select("*")
    .eq("id", courseId)
    .maybeSingle();
  const canManage =
    !!course &&
    (canManageCourseContent(session, course.teacherId) ||
      // Support legacy courses with null teacherId until data is fully backfilled.
      (session.role === "TEACHER" && !course.teacherId));
  if (courseError || !course || !canManage) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const { data: lessons, error: lessonsError } = await supabase
    .from("Lesson")
    .select("id, title, content, order, isPublished, assignmentId")
    .eq("courseId", courseId)
    .order("order", { ascending: true });
  if (isSchemaNotReadyError(lessonsError)) {
    return schemaNotReadyResponse("lessons");
  }

  return NextResponse.json(lessons ?? []);
}

export async function POST(req: Request, ctx: Ctx) {
  const { id: courseId } = await ctx.params;
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const supabase = createAdminClient();

  const { data: course, error: courseError } = await supabase
    .from("Course")
    .select("*")
    .eq("id", courseId)
    .maybeSingle();
  const canManage =
    !!course &&
    (canManageCourseContent(session, course.teacherId) ||
      // Support legacy courses with null teacherId until data is fully backfilled.
      (session.role === "TEACHER" && !course.teacherId));
  if (courseError || !course || !canManage) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  let body: z.infer<typeof createSchema>;
  try {
    body = createSchema.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }

  const { data: lastRows } = await supabase
    .from("Lesson")
    .select("order")
    .eq("courseId", courseId)
    .order("order", { ascending: false })
    .limit(1);
  const nextOrder = (lastRows?.[0]?.order ?? -1) + 1;

  let assignmentId: string | null = null;
  if (
    body.assignmentTitle &&
    body.expectedOutput !== undefined &&
    body.starterCode !== undefined
  ) {
    assignmentId = newId();
    const { error: assignmentError } = await supabase.from("Assignment").insert({
      id: assignmentId,
      courseId,
      title: body.assignmentTitle,
      instructions: body.assignmentInstructions ?? "",
      starterCode: body.starterCode,
      expectedOutput: body.expectedOutput,
      language: body.language ?? "javascript",
      order: nextOrder,
    });
    if (assignmentError) {
      if (isSchemaNotReadyError(assignmentError)) {
        return schemaNotReadyResponse("lessons");
      }
      return NextResponse.json({ error: "bad_request" }, { status: 400 });
    }
  }

  const lessonId = newId();
  const { data: lesson, error: lessonError } = await supabase
    .from("Lesson")
    .insert({
      id: lessonId,
      courseId,
      title: body.title,
      content: body.content ?? "",
      order: nextOrder,
      isPublished: true,
      assignmentId,
    })
    .select("id, title, content, order, isPublished, assignmentId")
    .single();
  if (lessonError || !lesson) {
    if (isSchemaNotReadyError(lessonError)) {
      return schemaNotReadyResponse("lessons");
    }
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }

  if (assignmentId) {
    const { error: linkError } = await supabase
      .from("Assignment")
      .update({ lessonId })
      .eq("id", assignmentId);
    if (isSchemaNotReadyError(linkError)) {
      return schemaNotReadyResponse("lessons");
    }
  }

  return NextResponse.json(lesson);
}
