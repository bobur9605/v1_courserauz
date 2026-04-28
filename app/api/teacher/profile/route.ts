import { z } from "zod";
import bcrypt from "bcryptjs";
import { getSession, signSession, type Role } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

const updateSchema = z.object({
  fullName: z.string().trim().min(2).max(120),
  age: z.number().int().min(16).max(100).nullable(),
  gender: z.enum(["male", "female", "other", ""]).nullable(),
  profileImageUrl: z.string().trim().url().max(500).nullable(),
  newPassword: z.string().min(6).max(100).optional(),
});

export async function GET() {
  const session = await getSession();
  if (!session || (session.role !== "TEACHER" && session.role !== "SUPERADMIN")) {
    return Response.json({ error: "forbidden" }, { status: 403 });
  }

  const supabase = createAdminClient();
  const { data: user, error } = await supabase
    .from("User")
    .select("id, fullName, email, age, gender, profileImageUrl")
    .eq("id", session.sub)
    .maybeSingle();

  if (error || !user) {
    return Response.json({ error: "not_found" }, { status: 404 });
  }
  return Response.json(user);
}

export async function PATCH(req: Request) {
  const session = await getSession();
  if (!session || (session.role !== "TEACHER" && session.role !== "SUPERADMIN")) {
    return Response.json({ error: "forbidden" }, { status: 403 });
  }

  let body: z.infer<typeof updateSchema>;
  try {
    body = updateSchema.parse(await req.json());
  } catch {
    return Response.json({ error: "bad_request" }, { status: 400 });
  }

  const supabase = createAdminClient();
  const normalizedGender = body.gender === "" ? null : body.gender;

  const updatePayload: {
    fullName: string;
    age: number | null;
    gender: "male" | "female" | "other" | null;
    profileImageUrl: string | null;
    passwordHash?: string;
    mustChangePassword?: boolean;
    tempPasswordIssuedAt?: null;
  } = {
    fullName: body.fullName,
    age: body.age,
    gender: normalizedGender,
    profileImageUrl: body.profileImageUrl,
  };

  if (body.newPassword && body.newPassword.length > 0) {
    updatePayload.passwordHash = await bcrypt.hash(body.newPassword, 10);
    updatePayload.mustChangePassword = false;
    updatePayload.tempPasswordIssuedAt = null;
  }

  const { error } = await supabase.from("User").update(updatePayload).eq("id", session.sub);
  if (error) {
    return Response.json({ error: "bad_request" }, { status: 400 });
  }

  await signSession({
    sub: session.sub,
    role: session.role as Role,
    email: session.email,
    fullName: body.fullName,
    profileImageUrl: body.profileImageUrl,
    mustChangePassword: false,
  });

  return Response.json({ ok: true });
}
