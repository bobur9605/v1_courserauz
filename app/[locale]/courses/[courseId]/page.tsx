import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/routing";
import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSession } from "@/lib/auth";
import { EnrollButton } from "@/components/EnrollButton";
import { lessonLockMap } from "@/lib/lessonGating";
import { CourseResourcesList } from "@/components/CourseResourcesList";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ locale: string; courseId: string }>;
  searchParams: Promise<{ locked?: string }>;
};

export default async function CourseDetailPage(props: Props) {
  const { courseId, locale } = await props.params;
  const { locked } = await props.searchParams;
  const t = await getTranslations("course");
  const tc = await getTranslations("courses");
  const session = await getSession();
  const supabase = createAdminClient();

  const { data: course, error } = await supabase
    .from("Course")
    .select("*")
    .eq("id", courseId)
    .maybeSingle();
  if (error || !course) notFound();

  const { data: lessonsRaw } = await supabase
    .from("Lesson")
    .select("id, title, order, assignmentId, isPublished")
    .eq("courseId", courseId)
    .order("order", { ascending: true });
  const lessonsForLock = (lessonsRaw ?? []).map((l) => ({
    id: l.id,
    order: l.order,
  }));
  const lessons = lessonsRaw ?? [];

  let resultsMap: Record<string, { passed: boolean; score: number | null }> =
    {};
  let isEnrolled = false;

  if (session) {
    const assignmentIds = lessons.map((l) => l.assignmentId).filter(Boolean);
    const lessonIds = lessons.map((l) => l.id);
    const { data: enRow } = await supabase
      .from("Enrollment")
      .select("id")
      .eq("userId", session.sub)
      .eq("courseId", course.id)
      .maybeSingle();
    isEnrolled = !!enRow;
    const { data: resultRows } = assignmentIds.length
      ? await supabase
          .from("Result")
          .select("assignmentId, passed, score")
          .eq("studentId", session.sub)
          .in("assignmentId", assignmentIds)
      : { data: [] as { assignmentId: string; passed: boolean; score: number | null }[] };
    const { data: completionRows } = lessonIds.length
      ? await supabase
          .from("LessonCompletion")
          .select("lessonId")
          .eq("studentId", session.sub)
          .in("lessonId", lessonIds)
      : { data: [] as { lessonId: string }[] };
    const resultByAssignment = Object.fromEntries(
      (resultRows ?? []).map((r) => [
        r.assignmentId,
        { passed: r.passed, score: r.score },
      ]),
    );
    const completedLessonSet = new Set((completionRows ?? []).map((r) => r.lessonId));
    resultsMap = Object.fromEntries(
      lessons.map((lesson) => {
        const result = lesson.assignmentId ? resultByAssignment[lesson.assignmentId] : null;
        return [
          lesson.id,
          {
            passed: lesson.assignmentId ? !!result?.passed : completedLessonSet.has(lesson.id),
            score: result?.score ?? null,
          },
        ];
      }),
    );
  }

  const lockById = lessonLockMap(lessonsForLock, resultsMap, session);

  const total = lessons.length;
  const done = lessons.filter((a) => resultsMap[a.id]?.passed).length;
  const pct = total ? Math.round((done / total) * 100) : 0;

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <Link
            href="/courses"
            className="text-sm font-semibold text-[#0056d2] hover:underline"
          >
            {t("back")}
          </Link>
          <h1 className="mt-2 text-3xl font-bold text-[#1c1d1f]">
            {course.title}
          </h1>
          <p className="mt-3 max-w-3xl text-[#6a6f73]">
            {course.description}
          </p>
        </div>
        {session?.role === "STUDENT" && (
          <EnrollButton
            courseId={course.id}
            enrolled={isEnrolled}
            labelJoin={tc("join")}
            labelEnrolled={tc("enrolled")}
          />
        )}
      </div>

      {locked && session?.role === "STUDENT" && (
        <div
          className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-900"
          role="status"
        >
          {t("sequenceHint")}
        </div>
      )}

      {session && (session.role === "STUDENT" ? isEnrolled : true) && (
        <CourseResourcesList courseId={course.id} canManage={false} />
      )}

      <div className="rounded-xl border border-[#e0e0e0] bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h2 className="text-lg font-bold text-[#1c1d1f]">{t("progress")}</h2>
          <span className="text-sm font-semibold text-[#0056d2]">{pct}%</span>
        </div>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-[#e5e7eb]">
          <div
            className="h-full rounded-full bg-[#0056d2] transition-all"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="rounded-xl border border-[#e0e0e0] bg-white p-4 shadow-sm xl:sticky xl:top-24 xl:self-start">
          <h2 className="text-sm font-bold uppercase tracking-wide text-[#6a6f73]">
            {t("modules")}
          </h2>
          <ol className="mt-4 space-y-2">
            {lessons.map((a, i) => {
              const r = resultsMap[a.id];
              const locked = !!lockById[a.id];
              const completed = !!r?.passed;
              const current = !locked && !completed;
              const rowClass = `flex items-center justify-between rounded-lg px-3 py-2 text-sm font-semibold ${
                locked
                  ? "cursor-not-allowed opacity-50 text-[#6a6f73]"
                  : `hover:bg-[#eef5ff] ${completed ? "text-emerald-700" : "text-[#1c1d1f]"}`
              }`;
              return (
                <li key={a.id}>
                  {locked ? (
                    <span className={rowClass} title={t("locked")}>
                      <span className="min-w-0 flex-1 truncate pr-2">
                        {i + 1}. {a.title}
                      </span>
                      <span className="shrink-0 text-xs font-semibold">{t("lockedBadge")}</span>
                    </span>
                  ) : (
                    <Link
                      href={`/courses/${course.id}/lessons/${a.id}`}
                      className={rowClass}
                    >
                      <span className="min-w-0 flex-1 truncate pr-2">
                        {i + 1}. {a.title}
                      </span>
                      <span className="shrink-0 text-xs text-[#6a6f73]">
                        {completed ? t("completedBadge") : current ? t("currentBadge") : ""}
                      </span>
                    </Link>
                  )}
                </li>
              );
            })}
          </ol>
          {lessons.length === 0 && (
            <p className="mt-2 text-sm text-[#6a6f73]">{t("noAssignments")}</p>
          )}
        </aside>

        <div className="space-y-4 rounded-xl border border-[#e0e0e0] bg-white p-5 shadow-sm sm:p-6">
          <h2 className="text-lg font-bold text-[#1c1d1f]">{t("modules")}</h2>
          {lessons.length === 0 ? (
            <p className="text-sm text-[#6a6f73]">{t("noAssignments")}</p>
          ) : (
            <ul className="divide-y divide-[#e0e0e0]">
              {lessons.map((a, i) => {
                const locked = !!lockById[a.id];
                const completed = !!resultsMap[a.id]?.passed;
                return (
                  <li
                    key={a.id}
                    className="flex flex-wrap items-center justify-between gap-3 py-4 first:pt-0 last:pb-0"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-[#1c1d1f]">
                        {i + 1}. {a.title}
                      </p>
                      <p className="text-xs text-[#6a6f73]">
                        {locked
                          ? t("locked")
                          : completed
                            ? t("completedBadge")
                            : t("currentBadge")}
                      </p>
                    </div>
                    {locked ? (
                      <span className="rounded bg-[#e5e7eb] px-4 py-2 text-sm font-semibold text-[#6a6f73]">
                        {t("locked")}
                      </span>
                    ) : (
                      <Link
                        href={`/courses/${course.id}/lessons/${a.id}`}
                        className="w-full rounded bg-[#0056d2] px-4 py-2 text-center text-sm font-semibold text-white hover:bg-[#00419e] sm:w-auto"
                      >
                        Open
                      </Link>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
