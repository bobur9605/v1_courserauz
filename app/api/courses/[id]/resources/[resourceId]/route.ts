import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSession } from "@/lib/auth";
import { canManageCourseContent } from "@/lib/coursePermissions";
import { COURSE_RESOURCES_BUCKET } from "@/lib/courseResourcesBucket";

type Ctx = { params: Promise<{ id: string; resourceId: string }> };

export async function DELETE(_req: Request, ctx: Ctx) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const { id: courseId, resourceId } = await ctx.params;
  const supabase = createAdminClient();
  const { data: course } = await supabase
    .from("Course")
    .select("teacherId")
    .eq("id", courseId)
    .maybeSingle();
  if (!course || !canManageCourseContent(session, course.teacherId)) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  const { data: res } = await supabase
    .from("CourseResource")
    .select("id, storagePath")
    .eq("id", resourceId)
    .eq("courseId", courseId)
    .maybeSingle();
  if (!res) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  await supabase.storage.from(COURSE_RESOURCES_BUCKET).remove([res.storagePath]);
  const { error } = await supabase.from("CourseResource").delete().eq("id", res.id);
  if (error) {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }
  return NextResponse.json({ ok: true });
}
