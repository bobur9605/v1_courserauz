import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSession } from "@/lib/auth";
import { canManageCourseContent } from "@/lib/coursePermissions";

type Ctx = { params: Promise<{ id: string }> };

const schema = z.object({
  orderedIds: z.array(z.string().min(1)).min(1),
});

export async function POST(req: Request, ctx: Ctx) {
  const session = await getSession();
  if (!session) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }

  let body: z.infer<typeof schema>;
  try {
    body = schema.parse(await req.json());
  } catch {
    return Response.json({ error: "bad_request" }, { status: 400 });
  }

  const { id: courseId } = await ctx.params;
  const supabase = createAdminClient();
  const { data: course } = await supabase
    .from("Course")
    .select("teacherId")
    .eq("id", courseId)
    .maybeSingle();
  if (!course || !canManageCourseContent(session, course.teacherId)) {
    return Response.json({ error: "forbidden" }, { status: 403 });
  }

  const { data: rows } = await supabase
    .from("Lesson")
    .select("id, assignmentId")
    .eq("courseId", courseId);
  const existing = new Set((rows ?? []).map((r) => r.id));
  if (body.orderedIds.some((id) => !existing.has(id))) {
    return Response.json({ error: "bad_request" }, { status: 400 });
  }
  if (body.orderedIds.length !== (rows ?? []).length) {
    return Response.json({ error: "bad_request" }, { status: 400 });
  }

  for (let i = 0; i < body.orderedIds.length; i++) {
    const id = body.orderedIds[i];
    const { error } = await supabase
      .from("Lesson")
      .update({ order: i, updatedAt: new Date().toISOString() })
      .eq("id", id)
      .eq("courseId", courseId);
    if (error) return Response.json({ error: "bad_request" }, { status: 400 });
  }

  for (let i = 0; i < body.orderedIds.length; i++) {
    const lesson = rows?.find((l) => l.id === body.orderedIds[i]);
    if (!lesson?.assignmentId) continue;
    await supabase
      .from("Assignment")
      .update({ order: i })
      .eq("id", lesson.assignmentId)
      .eq("courseId", courseId);
  }

  return Response.json({ ok: true });
}
