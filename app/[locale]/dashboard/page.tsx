import { getLocale, getTranslations } from "next-intl/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSession } from "@/lib/auth";
import { Link, redirect } from "@/i18n/routing";
import { localizeAssignment, localizeCourse } from "@/lib/sampleCurriculumI18n";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const locale = await getLocale();
  const session = await getSession();
  if (!session) {
    return redirect({ href: "/login", locale });
  }

  const userId = session.sub;
  const t = await getTranslations("dashboard");
  const supabase = createAdminClient();

  const { data: enrollRows } = await supabase
    .from("Enrollment")
    .select("courseId")
    .eq("userId", userId);
  const enrolledCourseIds = [...new Set((enrollRows ?? []).map((e) => e.courseId))];
  const { data: myCoursesRaw } = enrolledCourseIds.length
    ? await supabase.from("Course").select("id, title").in("id", enrolledCourseIds)
    : { data: [] };
  const myCourses = myCoursesRaw ?? [];

  let progressByCourse: Record<string, { done: number; total: number }> = {};
  if (enrolledCourseIds.length) {
    const { data: allAsg } = await supabase
      .from("Assignment")
      .select("id, courseId")
      .in("courseId", enrolledCourseIds);
    const { data: myPassed } = await supabase
      .from("Result")
      .select("assignmentId, passed")
      .eq("studentId", userId)
      .eq("passed", true);
    const passedIds = new Set(
      (myPassed ?? []).filter((r) => r.passed).map((r) => r.assignmentId),
    );
    const totalByCourse = new Map<string, number>();
    for (const a of allAsg ?? []) {
      totalByCourse.set(a.courseId, (totalByCourse.get(a.courseId) ?? 0) + 1);
    }
    const doneByCourse = new Map<string, number>();
    for (const a of allAsg ?? []) {
      if (passedIds.has(a.id)) {
        doneByCourse.set(a.courseId, (doneByCourse.get(a.courseId) ?? 0) + 1);
      }
    }
    for (const cid of enrolledCourseIds) {
      progressByCourse[cid] = {
        done: doneByCourse.get(cid) ?? 0,
        total: totalByCourse.get(cid) ?? 0,
      };
    }
  }

  const { data: rowsRaw } = await supabase
    .from("Result")
    .select("*")
    .eq("studentId", userId)
    .order("updatedAt", { ascending: false });
  const rows = rowsRaw ?? [];

  const assignmentIds = [...new Set(rows.map((r) => r.assignmentId))];
  const { data: asgnsRaw } = assignmentIds.length
    ? await supabase
        .from("Assignment")
        .select("id, title, courseId")
        .in("id", assignmentIds)
    : { data: [] };
  const asgns = asgnsRaw ?? [];
  const courseIds = [...new Set(asgns.map((a) => a.courseId))];
  const { data: coursesRaw } = courseIds.length
    ? await supabase.from("Course").select("id, title").in("id", courseIds)
    : { data: [] };
  const courses = coursesRaw ?? [];
  const courseById = Object.fromEntries(courses.map((c) => [c.id, c]));
  const asgnById = Object.fromEntries(
    asgns.map((a) => [
      a.id,
      {
        title: localizeAssignment(locale, { ...a, instructions: "" }).title,
        courseTitle: localizeCourse(locale, {
          title: courseById[a.courseId]?.title ?? "",
          description: "",
        }).title,
      },
    ]),
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-[#1c1d1f]">{t("title")}</h1>
        <p className="mt-2 text-[#6a6f73]">{t("subtitle")}</p>
      </div>

      <div className="overflow-hidden rounded-xl border border-[#e0e0e0] bg-white shadow-sm">
        <h2 className="border-b border-[#e0e0e0] px-6 py-4 text-lg font-bold text-[#1c1d1f]">
          {t("myCourses")}
        </h2>
        {myCourses.length === 0 ? (
          <p className="p-8 text-center text-sm text-[#6a6f73]">
            {t("noCourses")}
          </p>
        ) : (
          <ul className="divide-y divide-[#e0e0e0]">
            {myCourses.map((c) => {
              const loc = localizeCourse(locale, {
                title: c.title,
                description: "",
              });
              const pr = progressByCourse[c.id] ?? { done: 0, total: 0 };
              const pct = pr.total ? Math.round((pr.done / pr.total) * 100) : 0;
              return (
                <li
                  key={c.id}
                  className="flex flex-wrap items-center justify-between gap-3 px-6 py-4"
                >
                  <div>
                    <p className="font-semibold text-[#1c1d1f]">{loc.title}</p>
                    <p className="text-xs text-[#6a6f73]">
                      {t("progressLabel", {
                        done: String(pr.done),
                        total: String(pr.total),
                        pct: String(pct),
                      })}
                    </p>
                  </div>
                  <Link
                    href={`/courses/${c.id}`}
                    className="text-sm font-semibold text-[#0056d2] hover:underline"
                  >
                    {t("openCourse")}
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <div className="overflow-hidden rounded-xl border border-[#e0e0e0] bg-white shadow-sm">
        <h2 className="border-b border-[#e0e0e0] px-6 py-4 text-lg font-bold text-[#1c1d1f]">
          {t("myResults")}
        </h2>
        {rows.length === 0 ? (
          <p className="p-8 text-center text-sm text-[#6a6f73]">
            {t("noResults")}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-[#f5f7fa] text-xs font-bold uppercase tracking-wide text-[#6a6f73]">
                <tr>
                  <th className="px-6 py-3">{t("course")}</th>
                  <th className="px-6 py-3">{t("assignment")}</th>
                  <th className="px-6 py-3">{t("score")}</th>
                  <th className="px-6 py-3">{t("status")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e0e0e0]">
                {rows.map((r) => (
                  <tr key={r.id} className="hover:bg-[#fafafa]">
                    <td className="px-6 py-3 font-medium text-[#1c1d1f]">
                      {asgnById[r.assignmentId]?.courseTitle ?? ""}
                    </td>
                    <td className="px-6 py-3 text-[#6a6f73]">
                      {asgnById[r.assignmentId]?.title ?? ""}
                    </td>
                    <td className="px-6 py-3">{r.score ?? "—"}</td>
                    <td className="px-6 py-3">
                      <span
                        className={
                          r.passed
                            ? "rounded-full bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-800"
                            : "rounded-full bg-amber-50 px-2 py-1 text-xs font-semibold text-amber-900"
                        }
                      >
                        {r.passed ? t("passed") : t("failed")}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
