import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { signSession, type Role } from "@/lib/auth";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function POST(req: Request) {
  try {
    const body = schema.parse(await req.json());
    const supabase = createAdminClient();

    const { data: user, error } = await supabase
      .from("User")
      .select("id, email, fullName, role, passwordHash, mustChangePassword, profileImageUrl")
      .eq("email", body.email)
      .maybeSingle();
    if (error) {
      return NextResponse.json({ error: "invalid" }, { status: 401 });
    }
    if (!user || !user.passwordHash) {
      return NextResponse.json({ error: "invalid" }, { status: 401 });
    }

    const ok = await bcrypt.compare(body.password, user.passwordHash);
    if (!ok) {
      return NextResponse.json({ error: "invalid" }, { status: 401 });
    }

    const rawRole = String(user.role ?? "").toUpperCase();
    const normalizedRole: Role =
      rawRole === "ADMIN"
        ? "SUPERADMIN"
        : rawRole === "SUPERADMIN" || rawRole === "TEACHER" || rawRole === "STUDENT"
          ? rawRole
          : "STUDENT";

    await signSession({
      sub: user.id,
      role: normalizedRole,
      email: user.email,
      fullName: user.fullName,
      profileImageUrl: user.profileImageUrl,
      mustChangePassword: !!user.mustChangePassword,
    });
    return NextResponse.json({ ok: true, role: normalizedRole });
  } catch {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }
}
