import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { signSession, type Role } from "@/lib/auth";
import { newId } from "@/lib/ids";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function POST(req: Request) {
  try {
    const body = schema.parse(await req.json());
    const supabase = createAdminClient();

    const bootstrapEmail = process.env.SUPERADMIN_BOOTSTRAP_EMAIL?.trim().toLowerCase();
    const bootstrapPassword = process.env.SUPERADMIN_BOOTSTRAP_PASSWORD ?? "";
    const bootstrapFullName =
      process.env.SUPERADMIN_BOOTSTRAP_FULLNAME?.trim() || "Super Admin";

    const { data: user, error } = await supabase
      .from("User")
      .select("id, email, fullName, role, passwordHash, mustChangePassword")
      .eq("email", body.email)
      .maybeSingle();
    if (error) {
      return NextResponse.json({ error: "invalid" }, { status: 401 });
    }

    const isBootstrapAttempt =
      !!bootstrapEmail &&
      body.email.toLowerCase() === bootstrapEmail &&
      body.password === bootstrapPassword;

    // Safe production bootstrap:
    // If SUPERADMIN user isn't present yet (or password drifted), allow creating/resetting
    // it ONLY when explicitly configured via env vars. Force password change after login.
    if (!user || !user.passwordHash) {
      if (!isBootstrapAttempt) {
        return NextResponse.json({ error: "invalid" }, { status: 401 });
      }
      const passwordHash = await bcrypt.hash(body.password, 10);
      const id = newId();
      const { error: insErr } = await supabase.from("User").insert({
        id,
        email: body.email,
        fullName: bootstrapFullName,
        role: "SUPERADMIN",
        passwordHash,
        mustChangePassword: true,
      });
      if (insErr) {
        // In case of race/duplicate email, fall through to update path.
      } else {
        await signSession({
          sub: id,
          role: "SUPERADMIN",
          email: body.email,
          fullName: bootstrapFullName,
          mustChangePassword: true,
        });
        return NextResponse.json({ ok: true, role: "SUPERADMIN" });
      }
    }

    const ok = await bcrypt.compare(body.password, user.passwordHash);
    if (!ok) {
      if (!isBootstrapAttempt) {
        return NextResponse.json({ error: "invalid" }, { status: 401 });
      }
      const passwordHash = await bcrypt.hash(body.password, 10);
      await supabase
        .from("User")
        .update({
          passwordHash,
          role: "SUPERADMIN",
          mustChangePassword: true,
          fullName: user.fullName || bootstrapFullName,
        })
        .eq("id", user.id);
      await signSession({
        sub: user.id,
        role: "SUPERADMIN",
        email: user.email,
        fullName: user.fullName || bootstrapFullName,
        mustChangePassword: true,
      });
      return NextResponse.json({ ok: true, role: "SUPERADMIN" });
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
      mustChangePassword: !!user.mustChangePassword,
    });
    return NextResponse.json({ ok: true, role: normalizedRole });
  } catch {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }
}
