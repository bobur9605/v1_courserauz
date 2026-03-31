import { NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSession } from "@/lib/auth";
import { newId } from "@/lib/ids";

const schema = z.object({ courseId: z.string().min(1) });

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  try {
    const { courseId } = schema.parse(await req.json());
    const supabase = createAdminClient();
    const { data: existing } = await supabase
      .from("Enrollment")
      .select("id")
      .eq("userId", session.sub)
      .eq("courseId", courseId)
      .maybeSingle();
    if (existing) {
      return NextResponse.json({ ok: true });
    }
    const { error } = await supabase.from("Enrollment").insert({
      id: newId(),
      userId: session.sub,
      courseId,
    });
    if (error) {
      return NextResponse.json({ error: "bad_request" }, { status: 400 });
    }
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }
}
