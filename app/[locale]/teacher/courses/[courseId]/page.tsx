import { getLocale, getTranslations } from "next-intl/server";
import { Link, redirect } from "@/i18n/routing";
import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSession } from "@/lib/auth";
import { canManageCourseContent } from "@/lib/coursePermissions";
import { TeacherResourcesSection } from "@/components/TeacherResourcesSection";
import { TeacherLessonsManager } from "@/components/TeacherLessonsManager";
import { isSchemaNotReadyError } from "@/lib/supabase/schemaErrors";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ locale: string; courseId: string }> };

export default async function TeacherCoursePage(props: Props) {
  const { courseId } = await props.params;
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

  const { data: lessonsRaw, error: lessonsError } = await supabase
    .from("Lesson")
    .select("id, title, content, order, isPublished, assignmentId")
    .eq("courseId", courseId)
    .order("order", { ascending: true });
  const lessons = lessonsRaw ?? [];
  const lessonsSchemaMissing = isSchemaNotReadyError(lessonsError);

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
  const assignmentIds = lessons.map((l) => l.assignmentId).filter(Boolean);
  const { data: allResults } = userIds.length && assignmentIds.length
    ? await supabase
        .from("Result")
        .select("studentId, assignmentId, passed")
        .in("studentId", userIds)
        .in("assignmentId", assignmentIds)
    : { data: [] };
  const lessonIds = lessons.map((l) => l.id);
  const { data: allCompletions } = userIds.length && lessonIds.length
    ? await supabase
        .from("LessonCompletion")
        .select("studentId, lessonId")
        .in("studentId", userIds)
        .in("lessonId", lessonIds)
    : { data: [] };

  const resultsByStudent = new Map<string, { passed: Set<string>; completed: Set<string> }>();
  for (const uid of userIds) {
    resultsByStudent.set(uid, { passed: new Set(), completed: new Set() });
  }
  for (const r of allResults ?? []) {
    if (!r.passed) continue;
    const entry = resultsByStudent.get(r.studentId);
    if (entry) entry.passed.add(r.assignmentId);
  }
  for (const row of allCompletions ?? []) {
    const entry = resultsByStudent.get(row.studentId);
    if (entry) entry.completed.add(row.lessonId);
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
            {course.title}
          </h1>
        </div>

        <div className="flex flex-wrap gap-3">
          <Link
            href={`/courses/${courseId}`}
            className="rounded-md border border-[#0056d2] px-4 py-2 text-sm font-semibold text-[#0056d2] hover:bg-[#eef5ff]"
          >
            {t("viewPublicCourse")}
          </Link>
        </div>

        <section className="rounded-xl border border-[#e0e0e0] bg-white shadow-sm">
          <h2 className="border-b border-[#e0e0e0] px-6 py-4 text-lg font-bold">
            Lessons
          </h2>
          <div className="px-6 py-4">
            {lessonsSchemaMissing ? (
              <p className="mb-4 text-sm text-red-600">
                Database setup for lessons is incomplete. Run the latest Supabase
                migrations, then retry.
              </p>
            ) : null}
            <TeacherLessonsManager courseId={courseId} lessons={lessons} />
          </div>
          {lessons.length === 0 && (
            <p className="px-6 py-8 text-center text-sm text-[#6a6f73]">
              No lessons yet.
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
                  <th className="px-6 py-3">Lessons</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e0e0e0]">
                {userIds.map((uid) => {
                  const u = userById[uid];
                  const row = resultsByStudent.get(uid);
                  let passedCount = 0;
                  for (const lesson of lessons) {
                    const done = lesson.assignmentId
                      ? row?.passed.has(lesson.assignmentId)
                      : row?.completed.has(lesson.id);
                    if (done) passedCount += 1;
                  }
                  const total = lessons.length;
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
                      <td className="px-6 py-3">
                        <div className="flex flex-wrap gap-1">
                          {lessons.map((lesson, idx) => {
                            const done = lesson.assignmentId
                              ? row?.passed.has(lesson.assignmentId)
                              : row?.completed.has(lesson.id);
                            return (
                              <span
                                key={lesson.id}
                                className={`rounded px-2 py-1 text-xs font-semibold ${
                                  done
                                    ? "bg-emerald-100 text-emerald-800"
                                    : "bg-[#eef2f7] text-[#6a6f73]"
                                }`}
                                title={lesson.title}
                              >
                                {idx + 1}:{done ? "P" : "N"}
                              </span>
                            );
                          })}
                        </div>
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
