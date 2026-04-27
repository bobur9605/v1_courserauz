import { NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSession } from "@/lib/auth";
import { newId } from "@/lib/ids";
import { canManageCourseContent } from "@/lib/coursePermissions";

const schema = z.object({
  courseId: z.string().min(1),
  title: z.string().min(2),
  instructions: z.string().optional(),
  starterCode: z.string(),
  expectedOutput: z.string(),
  language: z.enum(["javascript", "html", "css"]).optional(),
});

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  try {
    const body = schema.parse(await req.json());
    const supabase = createAdminClient();
    const { data: course } = await supabase
      .from("Course")
      .select("teacherId")
      .eq("id", body.courseId)
      .maybeSingle();
    if (!course || !canManageCourseContent(session, course.teacherId)) {
      return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }
    const { data: rows } = await supabase
      .from("Assignment")
      .select("order")
      .eq("courseId", body.courseId)
      .order("order", { ascending: false })
      .limit(1);
    const nextOrder = (rows?.[0]?.order ?? -1) + 1;
    const { data: assignment, error } = await supabase
      .from("Assignment")
      .insert({
        id: newId(),
        courseId: body.courseId,
        title: body.title,
        instructions: body.instructions ?? "",
        starterCode: body.starterCode,
        expectedOutput: body.expectedOutput,
        language: body.language ?? "javascript",
        order: nextOrder,
      })
      .select("*")
      .single();
    if (error || !assignment) {
      return NextResponse.json({ error: "bad_request" }, { status: 400 });
    }
    return NextResponse.json(assignment);
  } catch {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }
}
