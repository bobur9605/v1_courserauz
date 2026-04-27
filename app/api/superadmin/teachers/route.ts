import { z } from "zod";
import bcrypt from "bcryptjs";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSession } from "@/lib/auth";
import { newId } from "@/lib/ids";

const schema = z.object({
  email: z.string().email(),
  fullName: z.string().min(2),
});

function generateTempPassword(): string {
  // 20 chars; avoids ambiguous chars; includes digits.
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
  const bytes = crypto.getRandomValues(new Uint8Array(20));
  let out = "";
  for (const b of bytes) out += alphabet[b % alphabet.length];
  return out;
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session || session.role !== "SUPERADMIN") {
    return Response.json({ error: "forbidden" }, { status: 403 });
  }

  let body: z.infer<typeof schema>;
  try {
    body = schema.parse(await req.json());
  } catch {
    return Response.json({ error: "bad_request" }, { status: 400 });
  }

  const supabase = createAdminClient();
  const email = body.email.trim().toLowerCase();
  const fullName = body.fullName.trim();

  const { data: existing } = await supabase
    .from("User")
    .select("id")
    .eq("email", email)
    .maybeSingle();
  if (existing) {
    return Response.json({ error: "email_in_use" }, { status: 409 });
  }

  const tempPassword = generateTempPassword();
  const passwordHash = await bcrypt.hash(tempPassword, 10);
  const id = newId();

  const { error } = await supabase.from("User").insert({
    id,
    email,
    fullName,
    role: "TEACHER",
    passwordHash,
    mustChangePassword: true,
    tempPasswordIssuedAt: new Date().toISOString(),
  });
  if (error) {
    return Response.json({ error: "bad_request" }, { status: 400 });
  }

  return Response.json({
    id,
    email,
    fullName,
    tempPassword,
  });
}

