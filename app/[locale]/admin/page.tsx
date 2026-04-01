import { getLocale, getTranslations } from "next-intl/server";
import { Link, redirect } from "@/i18n/routing";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSession } from "@/lib/auth";
import { localizeAssignment, localizeCourse } from "@/lib/sampleCurriculumI18n";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    const locale = await getLocale();
    return redirect({ href: "/dashboard", locale });
  }

  const t = await getTranslations("admin");
  const tf = await getTranslations("form");
  const tc = await getTranslations("courses");
  const locale = await getLocale();
  const supabase = createAdminClient();

  const { data: coursesRaw } = await supabase
    .from("Course")
    .select("*")
    .order("createdAt", { ascending: false });
  const courses = coursesRaw ?? [];
  const { data: allAssignments } = await supabase
    .from("Assignment")
    .select("courseId");
  const countByCourse = new Map<string, number>();
  for (const a of allAssignments ?? []) {
    countByCourse.set(a.courseId, (countByCourse.get(a.courseId) ?? 0) + 1);
  }

  const { data: results } = await supabase
    .from("Result")
    .select("*")
    .order("updatedAt", { ascending: false })
    .limit(30);

  const resultRows = results ?? [];
  const studentIds = [...new Set(resultRows.map((r) => r.studentId))];
  const assignmentIds = [...new Set(resultRows.map((r) => r.assignmentId))];
  const { data: usersRaw } = studentIds.length
    ? await supabase
        .from("User")
        .select("id, fullName, email")
        .in("id", studentIds)
    : { data: [] };
  const users = usersRaw ?? [];
  const { data: asgnsRaw } = assignmentIds.length
    ? await supabase
        .from("Assignment")
        .select("id, title, courseId")
        .in("id", assignmentIds)
    : { data: [] };
  const asgns = asgnsRaw ?? [];
  const courseIds = [...new Set(asgns.map((a) => a.courseId))];
  const { data: resultCoursesRaw } = courseIds.length
    ? await supabase.from("Course").select("id, title").in("id", courseIds)
    : { data: [] };
  const coursesForResults = resultCoursesRaw ?? [];
  const userById = Object.fromEntries(users.map((u) => [u.id, u]));
  const courseById = Object.fromEntries(coursesForResults.map((c) => [c.id, c]));
  const asgnById = Object.fromEntries(
    asgns.map((a) => [
      a.id,
      {
        title: localizeAssignment(locale, { ...a, instructions: "" }).title,
        course: {
          title: localizeCourse(locale, {
            title: courseById[a.courseId]?.title ?? "",
            description: "",
          }).title,
        },
      },
    ]),
  );

  return (
    <div className="space-y-10">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#1c1d1f]">{t("title")}</h1>
          <p className="mt-2 text-[#6a6f73]">{t("subtitle")}</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/admin/courses/new"
            className="rounded-md bg-[#0056d2] px-4 py-2 text-sm font-semibold text-white hover:bg-[#00419e]"
          >
            {t("newCourse")}
          </Link>
          <Link
            href="/admin/assignments/new"
            className="rounded-md border border-[#0056d2] px-4 py-2 text-sm font-semibold text-[#0056d2] hover:bg-[#eef5ff]"
          >
            {t("newAssignment")}
          </Link>
        </div>
      </div>

      <section className="rounded-xl border border-[#e0e0e0] bg-white shadow-sm">
        <h2 className="border-b border-[#e0e0e0] px-6 py-4 text-lg font-bold">
          {t("allCourses")}
        </h2>
        <ul className="divide-y divide-[#e0e0e0]">
          {courses.map((c) => (
            <li
              key={c.id}
              className="flex flex-wrap items-center justify-between gap-3 px-6 py-4"
            >
              <div>
                <p className="font-semibold text-[#1c1d1f]">{c.title}</p>
                <p className="text-xs text-[#6a6f73]">
                  {countByCourse.get(c.id) ?? 0} {t("assignments").toLowerCase()}
                </p>
              </div>
              <Link
                href={`/courses/${c.id}`}
                className="text-sm font-semibold text-[#0056d2] hover:underline"
              >
                {tc("open")}
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-xl border border-[#e0e0e0] bg-white shadow-sm">
        <h2 className="border-b border-[#e0e0e0] px-6 py-4 text-lg font-bold">
          {t("students")}
        </h2>
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-[#f5f7fa] text-xs font-bold uppercase text-[#6a6f73]">
              <tr>
                <th className="px-6 py-3">{tf("user")}</th>
                <th className="px-6 py-3">{t("assignments")}</th>
                <th className="px-6 py-3">{tf("grade")}</th>
                <th className="px-6 py-3">{tf("feedback")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e0e0e0]">
              {resultRows.map((r) => (
                <tr key={r.id} className="hover:bg-[#fafafa]">
                  <td className="px-6 py-3">
                    <div className="font-medium text-[#1c1d1f]">
                      {userById[r.studentId]?.fullName ?? ""}
                    </div>
                    <div className="text-xs text-[#6a6f73]">
                      {userById[r.studentId]?.email ?? ""}
                    </div>
                  </td>
                  <td className="px-6 py-3 text-[#6a6f73]">
                    {asgnById[r.assignmentId]?.course.title ?? ""} —{" "}
                    {asgnById[r.assignmentId]?.title ?? ""}
                  </td>
                  <td className="px-6 py-3">{r.score ?? "—"}</td>
                  <td className="px-6 py-3 text-[#6a6f73]">{r.feedback || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
