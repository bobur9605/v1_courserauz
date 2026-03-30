import { getLocale, getTranslations } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { redirect } from "@/i18n/routing";

export default async function DashboardPage() {
  const session = await getSession();
  if (!session) {
    const locale = await getLocale();
    return redirect({ href: "/login", locale });
  }

  const userId = session.sub;
  const t = await getTranslations("dashboard");

  const rows = await prisma.result.findMany({
    where: { studentId: userId },
    orderBy: { updatedAt: "desc" },
    include: {
      assignment: {
        select: { title: true, course: { select: { title: true } } },
      },
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-[#1c1d1f]">{t("title")}</h1>
        <p className="mt-2 text-[#6a6f73]">{t("subtitle")}</p>
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
                      {r.assignment.course.title}
                    </td>
                    <td className="px-6 py-3 text-[#6a6f73]">
                      {r.assignment.title}
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
