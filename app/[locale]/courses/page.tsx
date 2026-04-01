import { getLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/routing";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSession } from "@/lib/auth";
import { localizeCourse } from "@/lib/sampleCurriculumI18n";

export const dynamic = "force-dynamic";

type PageProps = { searchParams: Promise<{ q?: string }> };

export default async function CoursesPage(props: PageProps) {
  const locale = await getLocale();
  const { q } = await props.searchParams;
  const search = q?.trim().toLowerCase() ?? "";
  const t = await getTranslations("courses");
  const session = await getSession();
  const supabase = createAdminClient();

  const { data: allCoursesRaw } = await supabase
    .from("Course")
    .select("*")
    .order("createdAt", { ascending: true });
  const allCourses = (allCoursesRaw ?? []).map((c) => localizeCourse(locale, c));
  const { data: assignmentRowsRaw } = await supabase
    .from("Assignment")
    .select("id, courseId");
  const assignmentRows = assignmentRowsRaw ?? [];
  const countByCourse = new Map<string, number>();
  for (const a of assignmentRows) {
    countByCourse.set(a.courseId, (countByCourse.get(a.courseId) ?? 0) + 1);
  }
  const courses = search
    ? allCourses.filter(
        (c) =>
          c.title.toLowerCase().includes(search) ||
          c.description.toLowerCase().includes(search),
      )
    : allCourses;

  let enrolledSet = new Set<string>();
  if (session) {
    const { data: enrolled } = await supabase
      .from("Enrollment")
      .select("courseId")
      .eq("userId", session.sub);
    enrolledSet = new Set((enrolled ?? []).map((e) => e.courseId));
  }

  function levelLabel(key: string) {
    if (key === "beginner") return t("beginner");
    if (key === "intermediate") return t("intermediate");
    if (key === "advanced") return t("advanced");
    return key;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-[#1c1d1f]">
          {search ? t("searchResults") : t("title")}
        </h1>
        <p className="mt-2 max-w-2xl text-[#6a6f73]">
          {search
            ? courses.length
              ? `“${q?.trim()}”`
              : t("noMatch")
            : t("subtitle")}
        </p>
      </div>

      {courses.length === 0 ? (
        <p className="rounded-lg border border-[#e0e0e0] bg-white p-8 text-center text-[#6a6f73]">
          {search ? t("noMatch") : t("empty")}
        </p>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {courses.map((c) => (
            <article
              key={c.id}
              className="flex flex-col rounded-xl border border-[#e0e0e0] bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className="flex flex-1 flex-col p-5">
                <h2 className="text-lg font-bold text-[#1c1d1f]">{c.title}</h2>
                <p className="mt-2 line-clamp-3 text-sm text-[#6a6f73]">
                  {c.description}
                </p>
                <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold">
                  <span className="rounded bg-[#eef5ff] px-2 py-1 text-[#0056d2]">
                    {c.durationHours} {t("hours")}
                  </span>
                  <span className="rounded bg-[#f5f7fa] px-2 py-1 text-[#1c1d1f]">
                    {t("level")}: {levelLabel(c.difficultyLevel)}
                  </span>
                  {enrolledSet.has(c.id) && (
                    <span className="rounded bg-emerald-50 px-2 py-1 text-emerald-800">
                      {t("enrolled")}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center justify-between border-t border-[#e0e0e0] px-5 py-3">
                <span className="text-xs text-[#6a6f73]">
                  {countByCourse.get(c.id) ?? 0} tasks
                </span>
                <Link
                  href={`/courses/${c.id}`}
                  className="text-sm font-semibold text-[#0056d2] hover:underline"
                >
                  {t("open")}
                </Link>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
