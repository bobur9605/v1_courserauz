import { getTranslations } from "next-intl/server";
import type { StudentCourseProgress } from "@/lib/studentProgress";

type Props = {
  summaries: StudentCourseProgress[];
};

export async function StudentProgressCharts({ summaries }: Props) {
  const t = await getTranslations("dashboard");
  const totalLessons = summaries.reduce((sum, item) => sum + item.totalLessons, 0);
  const completedLessons = summaries.reduce((sum, item) => sum + item.completedLessons, 0);
  const totalPercent = totalLessons ? Math.round((completedLessons / totalLessons) * 100) : 0;
  const activeCourses = summaries.filter((item) => !item.isComplete).length;
  const completedCourses = summaries.filter((item) => item.isComplete).length;

  return (
    <section className="grid gap-4 lg:grid-cols-[320px_1fr]">
      <div className="rounded-xl border border-[#e0e0e0] bg-white p-6 shadow-sm">
        <p className="text-sm font-semibold text-[#6a6f73]">{t("overallProgress")}</p>
        <p className="mt-2 text-4xl font-bold text-[#1c1d1f]">{totalPercent}%</p>
        <div className="mt-4 h-3 overflow-hidden rounded-full bg-[#e5e7eb]">
          <div
            className="h-full rounded-full bg-[#0056d2] transition-all"
            style={{ width: `${totalPercent}%` }}
          />
        </div>
        <p className="mt-3 text-sm text-[#6a6f73]">
          {t("lessonsProgressLabel", {
            done: String(completedLessons),
            total: String(totalLessons),
          })}
        </p>
        <dl className="mt-5 grid grid-cols-2 gap-3">
          <div className="rounded-lg bg-[#f5f7fa] p-3">
            <dt className="text-xs font-semibold uppercase tracking-wide text-[#6a6f73]">
              {t("activeCourses")}
            </dt>
            <dd className="mt-1 text-2xl font-bold text-[#1c1d1f]">{activeCourses}</dd>
          </div>
          <div className="rounded-lg bg-[#f5f7fa] p-3">
            <dt className="text-xs font-semibold uppercase tracking-wide text-[#6a6f73]">
              {t("completedCourses")}
            </dt>
            <dd className="mt-1 text-2xl font-bold text-[#1c1d1f]">{completedCourses}</dd>
          </div>
        </dl>
      </div>

      <div className="rounded-xl border border-[#e0e0e0] bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-[#1c1d1f]">{t("progressChartTitle")}</h2>
            <p className="mt-1 text-sm text-[#6a6f73]">{t("progressChartSubtitle")}</p>
          </div>
        </div>
        {summaries.length === 0 ? (
          <p className="mt-6 text-sm text-[#6a6f73]">{t("noCourses")}</p>
        ) : (
          <ul className="mt-6 space-y-4">
            {summaries.map((item) => (
              <li key={item.courseId}>
                <div className="flex items-center justify-between gap-3 text-sm">
                  <span className="font-semibold text-[#1c1d1f]">{item.courseTitle}</span>
                  <span className="text-[#6a6f73]">{item.percent}%</span>
                </div>
                <div className="mt-2 h-3 overflow-hidden rounded-full bg-[#eef0f2]">
                  <div
                    className="h-full rounded-full bg-emerald-500 transition-all"
                    style={{ width: `${item.percent}%` }}
                  />
                </div>
                <p className="mt-2 text-xs text-[#6a6f73]">
                  {item.isComplete
                    ? t("courseCompleted")
                    : t("nextLessonLabel", {
                        title: item.nextLessonTitle ?? t("nextLessonFallback"),
                      })}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
