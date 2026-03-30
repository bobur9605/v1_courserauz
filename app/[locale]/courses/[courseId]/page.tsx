import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/routing";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { EnrollButton } from "@/components/EnrollButton";

type Props = { params: Promise<{ locale: string; courseId: string }> };

export default async function CourseDetailPage(props: Props) {
  const { courseId } = await props.params;
  const t = await getTranslations("course");
  const tc = await getTranslations("courses");
  const session = await getSession();

  const course = await prisma.course.findUnique({
    where: { id: courseId },
    include: {
      assignments: { orderBy: { order: "asc" }, select: { id: true, title: true, order: true } },
    },
  });
  if (!course) notFound();

  let resultsMap: Record<string, { passed: boolean; score: number | null }> =
    {};
  let isEnrolled = false;

  if (session) {
    const [results, en] = await Promise.all([
      prisma.result.findMany({
        where: {
          studentId: session.sub,
          assignmentId: { in: course.assignments.map((a) => a.id) },
        },
      }),
      prisma.enrollment.findUnique({
        where: {
          userId_courseId: { userId: session.sub, courseId: course.id },
        },
      }),
    ]);
    isEnrolled = !!en;
    resultsMap = Object.fromEntries(
      results.map((r) => [
        r.assignmentId,
        { passed: r.passed, score: r.score },
      ]),
    );
  }

  const total = course.assignments.length;
  const done = course.assignments.filter((a) => resultsMap[a.id]?.passed).length;
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
          <h1 className="mt-2 text-3xl font-bold text-[#1c1d1f]">{course.title}</h1>
          <p className="mt-3 max-w-3xl text-[#6a6f73]">{course.description}</p>
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

      <div className="rounded-xl border border-[#e0e0e0] bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between gap-4">
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

      <div className="grid gap-8 lg:grid-cols-[280px_1fr]">
        <aside className="rounded-xl border border-[#e0e0e0] bg-white p-4 shadow-sm lg:sticky lg:top-24 lg:self-start">
          <h2 className="text-sm font-bold uppercase tracking-wide text-[#6a6f73]">
            {t("modules")}
          </h2>
          <ol className="mt-4 space-y-2">
            {course.assignments.map((a, i) => {
              const r = resultsMap[a.id];
              return (
                <li key={a.id}>
                  <Link
                    href={`/courses/${course.id}/assignment/${a.id}`}
                    className={`flex items-center justify-between rounded-lg px-3 py-2 text-sm font-semibold hover:bg-[#eef5ff] ${
                      r?.passed ? "text-emerald-700" : "text-[#1c1d1f]"
                    }`}
                  >
                    <span className="truncate pr-2">
                      {i + 1}. {a.title}
                    </span>
                    {r?.passed && (
                      <span className="text-xs text-emerald-600">✓</span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ol>
          {course.assignments.length === 0 && (
            <p className="mt-2 text-sm text-[#6a6f73]">{t("noAssignments")}</p>
          )}
        </aside>

        <div className="space-y-4 rounded-xl border border-[#e0e0e0] bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold text-[#1c1d1f]">{t("modules")}</h2>
          {course.assignments.length === 0 ? (
            <p className="text-sm text-[#6a6f73]">{t("noAssignments")}</p>
          ) : (
            <ul className="divide-y divide-[#e0e0e0]">
              {course.assignments.map((a, i) => (
                <li
                  key={a.id}
                  className="flex flex-wrap items-center justify-between gap-3 py-4 first:pt-0 last:pb-0"
                >
                  <div>
                    <p className="font-semibold text-[#1c1d1f]">
                      {i + 1}. {a.title}
                    </p>
                    <p className="text-xs text-[#6a6f73]">{t("assignment")}</p>
                  </div>
                  <Link
                    href={`/courses/${course.id}/assignment/${a.id}`}
                    className="rounded bg-[#0056d2] px-4 py-2 text-sm font-semibold text-white hover:bg-[#00419e]"
                  >
                    {t("start")}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
