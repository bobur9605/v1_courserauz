import { createAdminClient } from "@/lib/supabase/admin";

export async function studentMayAccessLessonOrder(
  studentId: string,
  courseId: string,
  lessonOrder: number,
): Promise<boolean> {
  const supabase = createAdminClient();
  const { data: priors } = await supabase
    .from("Lesson")
    .select("id, order, assignmentId")
    .eq("courseId", courseId)
    .lt("order", lessonOrder)
    .order("order", { ascending: true });
  if (!priors?.length) return true;

  const assignmentIds = priors.map((p) => p.assignmentId).filter(Boolean);
  const { data: passedRows } = assignmentIds.length
    ? await supabase
        .from("Result")
        .select("assignmentId")
        .eq("studentId", studentId)
        .eq("passed", true)
        .in("assignmentId", assignmentIds)
    : { data: [] as { assignmentId: string }[] };
  const passedAssignments = new Set((passedRows ?? []).map((r) => r.assignmentId));

  const { data: completedRows } = await supabase
    .from("LessonCompletion")
    .select("lessonId")
    .eq("studentId", studentId)
    .in("lessonId", priors.map((p) => p.id));
  const completedLessons = new Set((completedRows ?? []).map((r) => r.lessonId));

  for (const prior of priors) {
    if (prior.assignmentId) {
      if (!passedAssignments.has(prior.assignmentId)) return false;
      continue;
    }
    if (!completedLessons.has(prior.id)) return false;
  }
  return true;
}
