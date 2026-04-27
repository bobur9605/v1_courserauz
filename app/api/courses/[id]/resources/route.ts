import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSession } from "@/lib/auth";
import { canManageCourseContent } from "@/lib/coursePermissions";
import { newId } from "@/lib/ids";
import { COURSE_RESOURCES_BUCKET } from "@/lib/courseResourcesBucket";

type Ctx = { params: Promise<{ id: string }> };

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
  if (!course) return { ok: false as const, status: 404 };
  if (session.role === "SUPERADMIN" || canManageCourseContent(session, course.teacherId)) {
    return { ok: true as const, supabase };
  }
  if (session.role !== "STUDENT") return { ok: false as const, status: 403 };
  const { data: en } = await supabase
    .from("Enrollment")
    .select("id")
    .eq("userId", session.sub)
    .eq("courseId", courseId)
    .maybeSingle();
  if (!en) return { ok: false as const, status: 403 };
  return { ok: true as const, supabase };
}

export async function GET(_req: Request, ctx: Ctx) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const { id: courseId } = await ctx.params;
  const gate = await assertCourseRead(session, courseId);
  if (!gate.ok) {
    return NextResponse.json({ error: "forbidden" }, { status: gate.status });
  }
  const { data: rows, error } = await gate.supabase
    .from("CourseResource")
    .select("id, title, mimeType, size, createdAt")
    .eq("courseId", courseId)
    .order("createdAt", { ascending: false });
  if (error) {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }
  return NextResponse.json(rows ?? []);
}

export async function POST(req: Request, ctx: Ctx) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const { id: courseId } = await ctx.params;
  const supabase = createAdminClient();
  const { data: course } = await supabase
    .from("Course")
    .select("teacherId")
    .eq("id", courseId)
    .maybeSingle();
  if (!course) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  if (!canManageCourseContent(session, course.teacherId)) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }
  const file = form.get("file");
  const titleRaw = form.get("title");
  if (!(file instanceof File) || file.size < 1) {
    return NextResponse.json({ error: "file_required" }, { status: 400 });
  }
  const title =
    typeof titleRaw === "string" && titleRaw.trim().length > 0
      ? titleRaw.trim()
      : file.name;
  const resourceId = newId();
  const safeName = file.name.replace(/[^\w.\-]+/g, "_") || "file";
  const storagePath = `${courseId}/${resourceId}/${safeName}`;
  const buf = Buffer.from(await file.arrayBuffer());
  const { error: upErr } = await supabase.storage
    .from(COURSE_RESOURCES_BUCKET)
    .upload(storagePath, buf, {
      contentType: file.type || "application/octet-stream",
      upsert: false,
    });
  if (upErr) {
    return NextResponse.json({ error: "upload_failed" }, { status: 400 });
  }
  const { data: row, error: insErr } = await supabase
    .from("CourseResource")
    .insert({
      id: resourceId,
      courseId,
      title,
      storagePath,
      mimeType: file.type || "application/octet-stream",
      size: file.size,
      uploadedBy: session.sub,
    })
    .select("id, title, mimeType, size, createdAt")
    .single();
  if (insErr || !row) {
    await supabase.storage.from(COURSE_RESOURCES_BUCKET).remove([storagePath]);
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }
  return NextResponse.json(row);
}