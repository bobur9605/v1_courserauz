import { getLocale, getTranslations } from "next-intl/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSession } from "@/lib/auth";
import { Link, redirect } from "@/i18n/routing";
import StudentProfileCard from "@/components/StudentProfileCard";
import { StudentProgressCharts } from "@/components/StudentProgressCharts";
import { getStudentCourseProgress } from "@/lib/studentProgress";
import { ensureStudentUserRecord } from "@/lib/userProfile";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const locale = await getLocale();
  const session = await getSession();
  if (!session) {
    return redirect({ href: "/login", locale });
  }
  if (session.role !== "STUDENT") {
    return redirect({ href: session.role === "SUPERADMIN" ? "/admin" : "/teacher", locale });
  }

  const userId = session.sub;
  const t = await getTranslations("dashboard");
  const supabase = createAdminClient();
  const profile = await ensureStudentUserRecord(session);

  const { data: enrollRows } = await supabase
    .from("Enrollment")
    .select("courseId")
    .eq("userId", userId);
  const enrolledCourseIds = [...new Set((enrollRows ?? []).map((e) => e.courseId))];
  const { data: myCoursesRaw } = enrolledCourseIds.length
    ? await supabase.from("Course").select("id, title").in("id", enrolledCourseIds)
    : { data: [] };
  const myCourses = myCoursesRaw ?? [];
  const progressByCourse = await getStudentCourseProgress(userId, myCourses);

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
        title: a.title,
        courseTitle: courseById[a.courseId]?.title ?? "",
      },
    ]),
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-[#1c1d1f]">{t("title")}</h1>
        <p className="mt-2 text-[#6a6f73]">{t("subtitle")}</p>
      </div>

      <StudentProfileCard
        fullName={profile.fullName}
        email={profile.email}
        age={profile.age}
        gender={profile.gender}
        profileImageUrl={profile.profileImageUrl}
      />

      <StudentProgressCharts summaries={Object.values(progressByCourse)} />

      <div className="overflow-hidden rounded-xl border border-[#e0e0e0] bg-white shadow-sm">
        <h2 className="border-b border-[#e0e0e0] px-4 py-4 text-lg font-bold text-[#1c1d1f] sm:px-6">
          {t("myCourses")}
        </h2>
        {myCourses.length === 0 ? (
          <p className="p-8 text-center text-sm text-[#6a6f73]">
            {t("noCourses")}
          </p>
        ) : (
          <ul className="divide-y divide-[#e0e0e0]">
            {myCourses.map((c) => {
              const pr = progressByCourse[c.id] ?? {
                completedLessons: 0,
                totalLessons: 0,
                percent: 0,
                nextLessonTitle: null,
                isComplete: false,
              };
              return (
                <li
                  key={c.id}
                  className="flex flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-6"
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-[#1c1d1f]">{c.title}</p>
                    <p className="text-xs text-[#6a6f73]">
                      {t("progressLabel", {
                        done: String(pr.completedLessons),
                        total: String(pr.totalLessons),
                        pct: String(pr.percent),
                      })}
                    </p>
                    <p className="mt-1 text-xs text-[#6a6f73]">
                      {pr.isComplete
                        ? t("courseCompleted")
                        : t("nextLessonLabel", {
                            title: pr.nextLessonTitle ?? t("nextLessonFallback"),
                          })}
                    </p>
                  </div>
                  <Link
                    href={`/courses/${c.id}`}
                    className="w-full text-sm font-semibold text-[#0056d2] hover:underline sm:w-auto"
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
        <h2 className="border-b border-[#e0e0e0] px-4 py-4 text-lg font-bold text-[#1c1d1f] sm:px-6">
          {t("myResults")}
        </h2>
        {rows.length === 0 ? (
          <p className="p-8 text-center text-sm text-[#6a6f73]">
            {t("noResults")}
          </p>
        ) : (
          <>
            <div className="divide-y divide-[#e0e0e0] md:hidden">
              {rows.map((r) => (
                <article key={r.id} className="space-y-3 px-4 py-4">
                  <div className="space-y-1">
                    <p className="text-xs font-semibold uppercase tracking-wide text-[#6a6f73]">
                      {t("course")}
                    </p>
                    <p className="font-medium text-[#1c1d1f]">
                      {asgnById[r.assignmentId]?.courseTitle ?? ""}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-semibold uppercase tracking-wide text-[#6a6f73]">
                      {t("assignment")}
                    </p>
                    <p className="text-sm text-[#6a6f73]">
                      {asgnById[r.assignmentId]?.title ?? ""}
                    </p>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-[#6a6f73]">
                        {t("score")}
                      </p>
                      <p className="text-sm font-semibold text-[#1c1d1f]">{r.score ?? "—"}</p>
                    </div>
                    <span
                      className={
                        r.passed
                          ? "rounded-full bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-800"
                          : "rounded-full bg-amber-50 px-2 py-1 text-xs font-semibold text-amber-900"
                      }
                    >
                      {r.passed ? t("passed") : t("failed")}
                    </span>
                  </div>
                </article>
              ))}
            </div>
            <div className="hidden overflow-x-auto md:block">
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
          </>
        )}
      </div>
    </div>
  );
}
