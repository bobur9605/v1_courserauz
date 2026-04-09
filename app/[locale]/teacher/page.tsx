import { getLocale, getTranslations } from "next-intl/server";
import { Link, redirect } from "@/i18n/routing";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSession } from "@/lib/auth";
import { localizeCourse } from "@/lib/sampleCurriculumI18n";

export const dynamic = "force-dynamic";

export default async function TeacherHomePage() {
  const session = await getSession();
  if (!session) {
    const locale = await getLocale();
    return redirect({ href: "/login", locale });
  }
  if (session.role !== "TEACHER" && session.role !== "ADMIN") {
    const locale = await getLocale();
    return redirect({ href: "/dashboard", locale });
  }

  const locale = await getLocale();
  const t = await getTranslations("teacher");
  const tc = await getTranslations("courses");
  const supabase = createAdminClient();

  let query = supabase.from("Course").select("*").order("createdAt", { ascending: false });
  if (session.role === "TEACHER") {
    query = query.eq("teacherId", session.sub);
  }
  const { data: coursesRaw } = await query;
  const courses = coursesRaw ?? [];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-[#1c1d1f]">{t("title")}</h1>
        <p className="mt-2 text-[#6a6f73]">{t("subtitle")}</p>
      </div>

      <section className="rounded-xl border border-[#e0e0e0] bg-white shadow-sm">
        <h2 className="border-b border-[#e0e0e0] px-6 py-4 text-lg font-bold text-[#1c1d1f]">
          {t("myCourses")}
        </h2>
        <ul className="divide-y divide-[#e0e0e0]">
          {courses.map((c) => {
            const loc = localizeCourse(locale, c);
            return (
              <li
                key={c.id}
                className="flex flex-wrap items-center justify-between gap-3 px-6 py-4"
              >
                <p className="font-semibold text-[#1c1d1f]">{loc.title}</p>
                <Link
                  href={`/teacher/courses/${c.id}`}
                  className="text-sm font-semibold text-[#0056d2] hover:underline"
                >
                  {tc("open")}
                </Link>
              </li>
            );
          })}
        </ul>
        {courses.length === 0 && (
          <p className="px-6 py-8 text-center text-sm text-[#6a6f73]">
            {t("noCourses")}
          </p>
        )}
      </section>
    </div>
  );
}
