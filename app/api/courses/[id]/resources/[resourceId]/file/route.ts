import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSession } from "@/lib/auth";
import { canManageCourseContent } from "@/lib/coursePermissions";
import { COURSE_RESOURCES_BUCKET } from "@/lib/courseResourcesBucket";

type Ctx = { params: Promise<{ id: string; resourceId: string }> };

async function assertCourseRead(
  session: NonNullable<Awaited<ReturnType<typeof getSession>>>,
  courseId: string,
) {
  const supabase = createAdminClient();
  const { data: course } = await supabase
    .from("Course")
    .select("teacherId")
    .eq("id", courseId)
    .maybeSingle();
  if (!course) return { ok: false as const, status: 404, supabase };
  if (session.role === "ADMIN" || canManageCourseContent(session, course.teacherId)) {
    return { ok: true as const, supabase };
  }
  if (session.role !== "STUDENT") return { ok: false as const, status: 403, supabase };
  const { data: en } = await supabase
    .from("Enrollment")
    .select("id")
    .eq("userId", session.sub)
    .eq("courseId", courseId)
    .maybeSingle();
  if (!en) return { ok: false as const, status: 403, supabase };
  return { ok: true as const, supabase };
}

export async function GET(_req: Request, ctx: Ctx) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const { id: courseId, resourceId } = await ctx.params;
  const gate = await assertCourseRead(session, courseId);
  if (!gate.ok) {
    return NextResponse.json({ error: "forbidden" }, { status: gate.status });
  }
  const { data: meta } = await gate.supabase
    .from("CourseResource")
    .select("storagePath, title, mimeType")
    .eq("id", resourceId)
    .eq("courseId", courseId)
    .maybeSingle();
  if (!meta) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  const { data: blob, error: dErr } = await gate.supabase.storage
    .from(COURSE_RESOURCES_BUCKET)
    .download(meta.storagePath);
  if (dErr || !blob) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  const safe =
    meta.title.replace(/[^\w.\-]+/g, "_").slice(0, 120) || "download";
  return new NextResponse(blob, {
    headers: {
      "Content-Type": meta.mimeType || "application/octet-stream",
      "Content-Disposition": `attachment; filename="${safe}"`,
    },
  });
}
