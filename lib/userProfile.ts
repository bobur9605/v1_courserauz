import bcrypt from "bcryptjs";
import { z } from "zod";
import { type Role, type SessionPayload, signSession } from "@/lib/auth";
import { newId } from "@/lib/ids";
import { createAdminClient } from "@/lib/supabase/admin";

export const profileUpdateSchema = z.object({
  fullName: z.string().trim().min(2).max(120),
  age: z.number().int().min(16).max(100).nullable(),
  gender: z.enum(["male", "female", "other", ""]).nullable(),
  profileImageUrl: z.string().trim().url().max(500).nullable(),
  newPassword: z.string().min(6).max(100).optional(),
});

export type UserProfile = {
  id: string;
  fullName: string;
  email: string;
  age: number | null;
  gender: string | null;
  profileImageUrl: string | null;
};

export async function ensureStudentUserRecord(
  session: SessionPayload,
): Promise<UserProfile> {
  const supabase = createAdminClient();
  const { data: existing, error } = await supabase
    .from("User")
    .select("id, fullName, email, age, gender, profileImageUrl")
    .eq("id", session.sub)
    .maybeSingle();

  if (existing) {
    return existing;
  }
  if (error) {
    throw new Error("student_profile_lookup_failed");
  }

  const fallbackPasswordHash = await bcrypt.hash(newId(), 10);
  const payload = {
    id: session.sub,
    fullName: session.fullName.trim() || session.email,
    email: session.email,
    passwordHash: fallbackPasswordHash,
    role: "STUDENT" as const,
    profileImageUrl: session.profileImageUrl ?? null,
  };

  const { data: inserted, error: insertError } = await supabase
    .from("User")
    .insert(payload)
    .select("id, fullName, email, age, gender, profileImageUrl")
    .single();

  if (inserted) {
    return inserted;
  }
  if (insertError) {
    throw new Error("student_profile_create_failed");
  }
  throw new Error("student_profile_missing");
}

export async function getOwnUserProfile(session: SessionPayload): Promise<UserProfile | null> {
  if (session.role === "STUDENT") {
    return ensureStudentUserRecord(session);
  }

  const supabase = createAdminClient();
  const { data: user, error } = await supabase
    .from("User")
    .select("id, fullName, email, age, gender, profileImageUrl")
    .eq("id", session.sub)
    .maybeSingle();

  if (error || !user) {
    return null;
  }
  return user;
}

export async function updateOwnUserProfile(
  session: SessionPayload,
  body: z.infer<typeof profileUpdateSchema>,
) {
  if (session.role === "STUDENT") {
    await ensureStudentUserRecord(session);
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
    return false;
  }

  await signSession({
    sub: session.sub,
    role: session.role as Role,
    email: session.email,
    fullName: body.fullName,
    profileImageUrl: body.profileImageUrl,
    mustChangePassword: false,
  });
  return true;
}
