import { getLocale, getTranslations } from "next-intl/server";
import { Link, redirect } from "@/i18n/routing";
import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSession } from "@/lib/auth";
import { canManageCourseContent } from "@/lib/coursePermissions";
import { localizeAssignment, localizeCourse } from "@/lib/sampleCurriculumI18n";
import { TeacherResourcesSection } from "@/components/TeacherResourcesSection";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ locale: string; courseId: string }> };

export default async function TeacherCoursePage(props: Props) {
  const { courseId, locale } = await props.params;
  const session = await getSession();
  if (!session) {
    const loc = await getLocale();
    return redirect({ href: "/login", locale: loc });
  }

  const supabase = createAdminClient();
  const { data: course, error } = await supabase
    .from("Course")
    .select("*")
    .eq("id", courseId)
    .maybeSingle();
  if (error || !course) notFound();

  if (!canManageCourseContent(session, course.teacherId)) {
    const loc = await getLocale();
    return redirect({ href: "/teacher", locale: loc });
  }

  const t = await getTranslations("teacher");
  const tc = await getTranslations("course");
  const localizedCourse = localizeCourse(locale, course);

  const { data: assignmentsRaw } = await supabase
    .from("Assignment")
    .select("id, title, order")
    .eq("courseId", courseId)
    .order("order", { ascending: true });
  const assignments = (assignmentsRaw ?? []).map((a) =>
    localizeAssignment(locale, { ...a, instructions: "" }),
  );

  const { data: enrollRows } = await supabase
    .from("Enrollment")
    .select("userId")
    .eq("courseId", courseId);
  const userIds = [...new Set((enrollRows ?? []).map((e) => e.userId))];
  const { data: users } = userIds.length
    ? await supabase
        .from("User")
        .select("id, fullName, email")
        .in("id", userIds)
    : { data: [] };
  const { data: allResults } = userIds.length
    ? await supabase
        .from("Result")
        .select("studentId, assignmentId, passed")
        .in("studentId", userIds)
    : { data: [] };

  const assignmentIds = assignments.map((a) => a.id);
  const resultsByStudent = new Map<
    string,
    { passed: Set<string> }
  >();
  for (const uid of userIds) {
    resultsByStudent.set(uid, { passed: new Set() });
  }
  for (const r of allResults ?? []) {
    if (!r.passed) continue;
    const entry = resultsByStudent.get(r.studentId);
    if (entry) entry.passed.add(r.assignmentId);
  }

  const userById = Object.fromEntries((users ?? []).map((u) => [u.id, u]));

  return (
    <div className="space-y-8">
        <div>
          <Link
            href="/teacher"
            className="text-sm font-semibold text-[#0056d2] hover:underline"
          >
            ← {t("title")}
          </Link>
          <h1 className="mt-3 text-2xl font-bold text-[#1c1d1f] md:text-3xl">
            {localizedCourse.title}
          </h1>
        </div>

        <div className="flex flex-wrap gap-3">
          <Link
            href={`/teacher/courses/${courseId}/assignments/new`}
            className="rounded-md bg-[#0056d2] px-4 py-2 text-sm font-semibold text-white hover:bg-[#00419e]"
          >
            {t("newAssignment")}
          </Link>
          <Link
            href={`/courses/${courseId}`}
            className="rounded-md border border-[#0056d2] px-4 py-2 text-sm font-semibold text-[#0056d2] hover:bg-[#eef5ff]"
          >
            {t("viewPublicCourse")}
          </Link>
        </div>

        <section className="rounded-xl border border-[#e0e0e0] bg-white shadow-sm">
          <h2 className="border-b border-[#e0e0e0] px-6 py-4 text-lg font-bold">
            {t("assignmentsList")}
          </h2>
          <ul className="divide-y divide-[#e0e0e0]">
            {assignments.map((a, i) => (
              <li
                key={a.id}
                className="flex flex-wrap items-center justify-between gap-2 px-6 py-3"
              >
                <span className="text-sm font-semibold text-[#1c1d1f]">
                  {i + 1}. {a.title}
                </span>
                <Link
                  href={`/courses/${courseId}/assignment/${a.id}`}
                  className="text-sm font-semibold text-[#0056d2] hover:underline"
                >
                  {tc("start")}
                </Link>
              </li>
            ))}
          </ul>
          {assignments.length === 0 && (
            <p className="px-6 py-8 text-center text-sm text-[#6a6f73]">
              {t("noAssignments")}
            </p>
          )}
        </section>

        <TeacherResourcesSection courseId={courseId} />

        <section className="rounded-xl border border-[#e0e0e0] bg-white shadow-sm">
          <h2 className="border-b border-[#e0e0e0] px-6 py-4 text-lg font-bold">
            {t("studentsProgress")}
          </h2>
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-[#f5f7fa] text-xs font-bold uppercase text-[#6a6f73]">
                <tr>
                  <th className="px-6 py-3">{t("student")}</th>
                  <th className="px-6 py-3">{t("progressCol")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e0e0e0]">
                {userIds.map((uid) => {
                  const u = userById[uid];
                  const passedCount =
                    resultsByStudent.get(uid)?.passed.size ?? 0;
                  const total = assignmentIds.length;
                  const pct = total ? Math.round((passedCount / total) * 100) : 0;
                  return (
                    <tr key={uid} className="hover:bg-[#fafafa]">
                      <td className="px-6 py-3">
                        <div className="font-medium text-[#1c1d1f]">
                          {u?.fullName ?? uid}
                        </div>
                        <div className="text-xs text-[#6a6f73]">
                          {u?.email ?? ""}
                        </div>
                      </td>
                      <td className="px-6 py-3 text-[#6a6f73]">
                        {passedCount}/{total} ({pct}%)
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {userIds.length === 0 && (
            <p className="px-6 py-8 text-center text-sm text-[#6a6f73]">
              {t("noStudents")}
            </p>
          )}
        </section>
    </div>
  );
}
