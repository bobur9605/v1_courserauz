import { z } from "zod";
import bcrypt from "bcryptjs";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSession, signSession, type Role } from "@/lib/auth";

const schema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(6),
});

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }

  let body: z.infer<typeof schema>;
  try {
    body = schema.parse(await req.json());
  } catch {
    return Response.json({ error: "bad_request" }, { status: 400 });
  }

  const supabase = createAdminClient();
  const { data: user, error } = await supabase
    .from("User")
    .select("id, email, fullName, role, passwordHash, mustChangePassword, profileImageUrl")
    .eq("id", session.sub)
    .maybeSingle();
  if (error || !user) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }

  const ok = await bcrypt.compare(body.currentPassword, user.passwordHash);
  if (!ok) {
    return Response.json({ error: "invalid" }, { status: 401 });
  }

  const passwordHash = await bcrypt.hash(body.newPassword, 10);
  const { error: upErr } = await supabase
    .from("User")
    .update({
      passwordHash,
      mustChangePassword: false,
      tempPasswordIssuedAt: null,
    })
    .eq("id", user.id);
  if (upErr) {
    return Response.json({ error: "bad_request" }, { status: 400 });
  }

  await signSession({
    sub: user.id,
    role: user.role as Role,
    email: user.email,
    fullName: user.fullName,
    profileImageUrl: user.profileImageUrl,
    mustChangePassword: false,
  });

  return Response.json({ ok: true });
}

