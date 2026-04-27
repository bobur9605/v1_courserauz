import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSession } from "@/lib/auth";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();

  if (session.role === "SUPERADMIN") {
    const { data: rows } = await supabase
      .from("Result")
      .select("*")
      .order("updatedAt", { ascending: false })
      .limit(200);
    if (!rows?.length) {
      return NextResponse.json([]);
    }
    const studentIds = [...new Set(rows.map((r) => r.studentId))];
    const assignmentIds = [...new Set(rows.map((r) => r.assignmentId))];
    const { data: users } = await supabase
      .from("User")
      .select("id, fullName, email")
      .in("id", studentIds);
    const { data: asgns } = await supabase
      .from("Assignment")
      .select("id, title, courseId")
      .in("id", assignmentIds);
    const courseIds = [...new Set((asgns ?? []).map((a) => a.courseId))];
    const { data: courses } = await supabase
      .from("Course")
      .select("id, title")
      .in("id", courseIds);
    const userById = Object.fromEntries((users ?? []).map((u) => [u.id, u]));
    const courseById = Object.fromEntries((courses ?? []).map((c) => [c.id, c]));
    const asgnById = Object.fromEntries(
      (asgns ?? []).map((a) => [
        a.id,
        { ...a, courseTitle: courseById[a.courseId]?.title ?? "" },
      ]),
    );
    return NextResponse.json(
      rows.map((r) => ({
        id: r.id,
        studentName: userById[r.studentId]?.fullName ?? "",
        studentEmail: userById[r.studentId]?.email ?? "",
        courseTitle: asgnById[r.assignmentId]?.courseTitle ?? "",
        assignmentTitle: asgnById[r.assignmentId]?.title ?? "",
        score: r.score,
        passed: r.passed,
        feedback: r.feedback,
      })),
    );
  }

  const { data: rows } = await supabase
    .from("Result")
    .select("*")
    .eq("studentId", session.sub)
    .order("updatedAt", { ascending: false });
  if (!rows?.length) {
    return NextResponse.json([]);
  }
  const assignmentIds = [...new Set(rows.map((r) => r.assignmentId))];
  const { data: asgns } = await supabase
    .from("Assignment")
    .select("id, title, courseId")
    .in("id", assignmentIds);
  const courseIds = [...new Set((asgns ?? []).map((a) => a.courseId))];
  const { data: courses } = await supabase
    .from("Course")
    .select("id, title")
    .in("id", courseIds);
  const courseById = Object.fromEntries((courses ?? []).map((c) => [c.id, c]));
  const asgnById = Object.fromEntries(
    (asgns ?? []).map((a) => [
      a.id,
      { title: a.title, courseTitle: courseById[a.courseId]?.title ?? "" },
    ]),
  );

  return NextResponse.json(
    rows.map((r) => ({
      id: r.id,
      courseTitle: asgnById[r.assignmentId]?.courseTitle ?? "",
      assignmentTitle: asgnById[r.assignmentId]?.title ?? "",
      score: r.score,
      passed: r.passed,
      feedback: r.feedback,
    })),
  );
}
