import { getLocale, getTranslations } from "next-intl/server";
import { Link, redirect } from "@/i18n/routing";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSession } from "@/lib/auth";
import TeacherProfileCard from "@/components/TeacherProfileCard";

export const dynamic = "force-dynamic";

export default async function TeacherHomePage() {
  const session = await getSession();
  if (!session) {
    const locale = await getLocale();
    return redirect({ href: "/login", locale });
  }
  if (session.role !== "TEACHER" && session.role !== "SUPERADMIN") {
    const locale = await getLocale();
    return redirect({ href: "/dashboard", locale });
  }

  const t = await getTranslations("teacher");
  const tc = await getTranslations("courses");
  const supabase = createAdminClient();

  let query = supabase.from("Course").select("*").order("createdAt", { ascending: false });
  if (session.role === "TEACHER") {
    query = query.eq("teacherId", session.sub);
  }
  const { data: coursesRaw } = await query;
  const courses = coursesRaw ?? [];
  const { data: profileRaw } = await supabase
    .from("User")
    .select("fullName, email, age, gender, profileImageUrl")
    .eq("id", session.sub)
    .maybeSingle();
  const profile = profileRaw ?? {
    fullName: session.fullName,
    email: session.email,
    age: null,
    gender: null,
    profileImageUrl: null,
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-[#1c1d1f]">{t("title")}</h1>
        <p className="mt-2 text-[#6a6f73]">{t("subtitle")}</p>
      </div>

      <TeacherProfileCard
        fullName={profile.fullName}
        email={profile.email}
        age={profile.age}
        gender={profile.gender}
        profileImageUrl={profile.profileImageUrl}
      />

      <section className="rounded-xl border border-[#e0e0e0] bg-white shadow-sm">
        <h2 className="border-b border-[#e0e0e0] px-6 py-4 text-lg font-bold text-[#1c1d1f]">
          {t("myCourses")}
        </h2>
        <ul className="divide-y divide-[#e0e0e0]">
          {courses.map((c) => {
            return (
              <li
                key={c.id}
                className="flex flex-wrap items-center justify-between gap-3 px-6 py-4"
              >
                <p className="font-semibold text-[#1c1d1f]">{c.title}</p>
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
