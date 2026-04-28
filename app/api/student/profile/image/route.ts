import { getSession } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { PROFILE_IMAGES_BUCKET } from "@/lib/profileImagesBucket";

const MAX_IMAGE_SIZE = 2 * 1024 * 1024; // 2MB

export async function POST(req: Request) {
  const session = await getSession();
  if (!session || session.role !== "STUDENT") {
    return Response.json({ error: "forbidden" }, { status: 403 });
  }

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return Response.json({ error: "bad_request" }, { status: 400 });
  }

  const file = form.get("file");
  if (!(file instanceof File) || file.size < 1) {
    return Response.json({ error: "file_required" }, { status: 400 });
  }
  if (!file.type.startsWith("image/")) {
    return Response.json({ error: "invalid_file_type" }, { status: 400 });
  }
  if (file.size > MAX_IMAGE_SIZE) {
    return Response.json({ error: "file_too_large" }, { status: 400 });
  }

  const safeName = file.name.replace(/[^\w.\-]+/g, "_") || "avatar.png";
  const storagePath = `${session.sub}/${Date.now()}-${safeName}`;
  const buf = Buffer.from(await file.arrayBuffer());
  const supabase = createAdminClient();

  const { error: upErr } = await supabase.storage
    .from(PROFILE_IMAGES_BUCKET)
    .upload(storagePath, buf, {
      contentType: file.type || "application/octet-stream",
      upsert: true,
    });
  if (upErr) {
    return Response.json({ error: "upload_failed" }, { status: 400 });
  }

  const { data } = supabase.storage.from(PROFILE_IMAGES_BUCKET).getPublicUrl(storagePath);
  return Response.json({ url: data.publicUrl });
}
