import { NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSession } from "@/lib/auth";
import { canManageCourseContent } from "@/lib/coursePermissions";
import { newId } from "@/lib/ids";
import { bypassesLessonSequence } from "@/lib/lessonGating";
import { studentMayAccessLessonOrder } from "@/lib/lessonGatingServer";
import { parseYoutubeVideoId } from "@/lib/youtube";

type Ctx = { params: Promise<{ id: string; lessonId: string }> };

const codingTaskSchema = z.object({
  title: z.string().min(2),
  instructions: z.string().optional(),
  starterCode: z.string(),
  expectedOutput: z.string(),
  language: z.enum(["javascript", "html", "css"]).optional(),
});

const patchSchema = z
  .object({
    title: z.string().min(2).optional(),
    content: z.string().optional(),
    isPublished: z.boolean().optional(),
    youtubeUrl: z.union([z.string(), z.null()]).optional(),
    clearCodingTask: z.boolean().optional(),
    codingTask: codingTaskSchema.optional(),
  })
  .superRefine((val, ctx) => {
    if (val.clearCodingTask && val.codingTask) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "clearCodingTask and codingTask are mutually exclusive",
        path: ["codingTask"],
      });
    }
  });

function canManageLessonRoute(
  session: NonNullable<Awaited<ReturnType<typeof getSession>>>,
  courseTeacherId: string | null | undefined,
) {
  return (
    canManageCourseContent(session, courseTeacherId) ||
    (session.role === "TEACHER" && !courseTeacherId)
  );
}

export async function GET(_req: Request, ctx: Ctx) {
  const { id: courseId, lessonId } = await ctx.params;
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const supabase = createAdminClient();

  const { data: lesson } = await supabase
    .from("Lesson")
    .select("id, courseId, title, content, order, isPublished, assignmentId, youtubeVideoId")
    .eq("id", lessonId)
    .eq("courseId", courseId)
    .maybeSingle();
  if (!lesson) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const { data: course } = await supabase
    .from("Course")
    .select("teacherId")
    .eq("id", courseId)
    .maybeSingle();
  if (!course) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  if (session.role === "STUDENT") {
    const { data: enrollment } = await supabase
      .from("Enrollment")
      .select("id")
      .eq("userId", session.sub)
      .eq("courseId", courseId)
      .maybeSingle();
    if (!enrollment) {
      return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }

    if (
      !bypassesLessonSequence(session) &&
      !(await studentMayAccessLessonOrder(session.sub, courseId, lesson.order))
    ) {
      return NextResponse.json({ error: "sequence_locked" }, { status: 403 });
    }
  } else if (!canManageLessonRoute(session, course.teacherId)) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  let assignment = null as null | {
    id: string;
    title: string;
    instructions: string;
    starterCode: string;
    expectedOutput: string;
    language: string;
  };
  if (lesson.assignmentId) {
    const { data: row } = await supabase
      .from("Assignment")
      .select("id, title, instructions, starterCode, expectedOutput, language")
      .eq("id", lesson.assignmentId)
      .maybeSingle();
    if (row) assignment = row;
  }

  const { data: completion } = await supabase
    .from("LessonCompletion")
    .select("id")
    .eq("lessonId", lesson.id)
    .eq("studentId", session.sub)
    .maybeSingle();

  return NextResponse.json({
    ...lesson,
    assignment,
    completed: !!completion || false,
  });
}

export async function PATCH(req: Request, ctx: Ctx) {
  const { id: courseId, lessonId } = await ctx.params;
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let body: z.infer<typeof patchSchema>;
  try {
    body = patchSchema.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }

  const supabase = createAdminClient();
  const { data: course } = await supabase
    .from("Course")
    .select("teacherId")
    .eq("id", courseId)
    .maybeSingle();
  if (!course || !canManageLessonRoute(session, course.teacherId)) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const { data: lesson, error: lessonReadErr } = await supabase
    .from("Lesson")
    .select("id, order, assignmentId")
    .eq("id", lessonId)
    .eq("courseId", courseId)
    .maybeSingle();
  if (lessonReadErr || !lesson) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  let assignmentId = lesson.assignmentId;

  if (body.clearCodingTask && assignmentId) {
    const { error: delA } = await supabase
      .from("Assignment")
      .delete()
      .eq("id", assignmentId)
      .eq("courseId", courseId);
    if (delA) {
      return NextResponse.json({ error: "bad_request" }, { status: 400 });
    }
    assignmentId = null;
  }

  if (body.codingTask) {
    const ct = body.codingTask;
    if (assignmentId) {
      const { error: upA } = await supabase
        .from("Assignment")
        .update({
          title: ct.title,
          instructions: ct.instructions ?? "",
          starterCode: ct.starterCode,
          expectedOutput: ct.expectedOutput,
          language: ct.language ?? "javascript",
        })
        .eq("id", assignmentId)
        .eq("courseId", courseId);
      if (upA) {
        return NextResponse.json({ error: "bad_request" }, { status: 400 });
      }
    } else {
      const newAssignmentId = newId();
      const { error: insA } = await supabase.from("Assignment").insert({
        id: newAssignmentId,
        courseId,
        title: ct.title,
        instructions: ct.instructions ?? "",
        starterCode: ct.starterCode,
        expectedOutput: ct.expectedOutput,
        language: ct.language ?? "javascript",
        order: lesson.order,
        lessonId,
      });
      if (insA) {
        return NextResponse.json({ error: "bad_request" }, { status: 400 });
      }
      assignmentId = newAssignmentId;
    }
  }

  const patch: Record<string, unknown> = { updatedAt: new Date().toISOString() };
  if (body.title !== undefined) patch.title = body.title;
  if (body.content !== undefined) patch.content = body.content;
  if (body.isPublished !== undefined) patch.isPublished = body.isPublished;
  if (body.youtubeUrl !== undefined) {
    if (
      body.youtubeUrl === null ||
      (typeof body.youtubeUrl === "string" && body.youtubeUrl.trim() === "")
    ) {
      patch.youtubeVideoId = null;
    } else {
      const id = parseYoutubeVideoId(body.youtubeUrl);
      if (!id) {
        return NextResponse.json({ error: "invalid_youtube_url" }, { status: 400 });
      }
      patch.youtubeVideoId = id;
    }
  }
  if (body.clearCodingTask || body.codingTask) {
    patch.assignmentId = assignmentId;
  }

  const { data: updated, error } = await supabase
    .from("Lesson")
    .update(patch)
    .eq("id", lessonId)
    .eq("courseId", courseId)
    .select("id, title, content, order, isPublished, assignmentId, youtubeVideoId")
    .single();
  if (error || !updated) {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }
  return NextResponse.json(updated);
}

export async function DELETE(_req: Request, ctx: Ctx) {
  const { id: courseId, lessonId } = await ctx.params;
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();
  const { data: course } = await supabase
    .from("Course")
    .select("teacherId")
    .eq("id", courseId)
    .maybeSingle();
  if (!course || !canManageLessonRoute(session, course.teacherId)) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const { data: lesson, error: readErr } = await supabase
    .from("Lesson")
    .select("id, assignmentId")
    .eq("id", lessonId)
    .eq("courseId", courseId)
    .maybeSingle();
  if (readErr || !lesson) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  if (lesson.assignmentId) {
    const { error: delA } = await supabase
      .from("Assignment")
      .delete()
      .eq("id", lesson.assignmentId)
      .eq("courseId", courseId);
    if (delA) {
      return NextResponse.json({ error: "bad_request" }, { status: 400 });
    }
  }

  const { error: delL } = await supabase
    .from("Lesson")
    .delete()
    .eq("id", lessonId)
    .eq("courseId", courseId);
  if (delL) {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }

  return new NextResponse(null, { status: 204 });
}
