import { createAdminClient } from "@/lib/supabase/admin";

export async function studentMayAccessAssignmentOrder(
  studentId: string,
  courseId: string,
  assignmentOrder: number,
): Promise<boolean> {
  const supabase = createAdminClient();
  const { data: priors } = await supabase
    .from("Assignment")
    .select("id, order")
    .eq("courseId", courseId)
    .lt("order", assignmentOrder);
  if (!priors?.length) return true;
  const ids = priors.map((p) => p.id);
  const { data: passedRows } = await supabase
    .from("Result")
    .select("assignmentId")
    .eq("studentId", studentId)
    .eq("passed", true)
    .in("assignmentId", ids);
  const passed = new Set((passedRows ?? []).map((r) => r.assignmentId));
  const ordered = [...priors].sort((a, b) => a.order - b.order);
  for (const p of ordered) {
    if (!passed.has(p.id)) return false;
  }
  return true;
}
