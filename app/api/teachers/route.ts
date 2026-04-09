import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSession } from "@/lib/auth";

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  const supabase = createAdminClient();
  const { data: rows, error } = await supabase
    .from("User")
    .select("id, fullName, email")
    .eq("role", "TEACHER")
    .order("fullName", { ascending: true });
  if (error) {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }
  return NextResponse.json(rows ?? []);
}
