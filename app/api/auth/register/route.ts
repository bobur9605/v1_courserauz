import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { signSession, type Role } from "@/lib/auth";
import { newId } from "@/lib/ids";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  fullName: z.string().min(2),
});

export async function POST(req: Request) {
  try {
    const body = schema.parse(await req.json());
    const supabase = createAdminClient();
    const { data: exists } = await supabase
      .from("User")
      .select("id")
      .eq("email", body.email)
      .maybeSingle();
    if (exists) {
      return NextResponse.json({ error: "exists" }, { status: 400 });
    }
    const passwordHash = await bcrypt.hash(body.password, 10);
    const id = newId();
    const { data: user, error } = await supabase
      .from("User")
      .insert({
        id,
        email: body.email,
        fullName: body.fullName,
        passwordHash,
        role: "STUDENT",
      })
      .select("id, email, fullName, role")
      .single();
    if (error || !user) {
      return NextResponse.json({ error: "bad_request" }, { status: 400 });
    }
    await signSession({
      sub: user.id,
      role: user.role as Role,
      email: user.email,
      fullName: user.fullName,
    });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }
}
