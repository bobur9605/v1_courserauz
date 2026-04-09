import type { SessionPayload } from "@/lib/auth";

export function canManageCourseContent(
  session: SessionPayload | null,
  courseTeacherId: string | null | undefined,
): boolean {
  if (!session) return false;
  if (session.role === "ADMIN") return true;
  if (session.role !== "TEACHER") return false;
  return !!courseTeacherId && courseTeacherId === session.sub;
}

export function isStaffRole(role: string | undefined): boolean {
  return role === "ADMIN" || role === "TEACHER";
}
