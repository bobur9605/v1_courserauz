import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/routing";
import { HomeFAQ } from "@/components/HomeFAQ";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

function StarRow({ n }: { n: number }) {
  return (
    <span className="flex items-center gap-1 text-xs text-[#b4690e]">
      <span aria-hidden>★</span>
      <span className="font-bold text-[#1c1d1f]">{n.toFixed(1)}</span>
    </span>
  );
}

export default async function HomePage() {
  const t = await getTranslations("home");

  const supabase = createAdminClient();
  const { data: coursesRaw } = await supabase
    .from("Course")
    .select("*")
    .order("createdAt", { ascending: true });
  const courses = coursesRaw ?? [];
  const { data: assignmentsRaw } = await supabase
    .from("Assignment")
    .select("*");
  const allAssignments = assignmentsRaw ?? [];
  const assignmentsByCourse = new Map<string, typeof allAssignments>();
  for (const a of allAssignments) {
    const list = assignmentsByCourse.get(a.courseId) ?? [];
    list.push(a);
    assignmentsByCourse.set(a.courseId, list);
  }
  const coursesWithAssignments = courses.map((c) => ({
    ...c,
    assignments: assignmentsByCourse.get(c.id) ?? [],
  }));

  const trendCols: (typeof coursesWithAssignments)[] = [[], [], []];
  coursesWithAssignments.forEach((c, i) => trendCols[i % 3].push(c));

  const faqItems = [
    { q: t("faq1q"), a: t("faq1a") },
    { q: t("faq2q"), a: t("faq2a") },
    { q: t("faq3q"), a: t("faq3a") },
    { q: t("faq4q"), a: t("faq4a") },
  ];

  const categories = [
    { href: "/courses", key: "catWeb" as const, emoji: "💼" },
    { href: "/courses", key: "catFront" as const, emoji: "🖥" },
    { href: "/courses", key: "catJs" as const, emoji: "⚡" },
    { href: "/courses", key: "catHtml" as const, emoji: "◧" },
    { href: "/courses", key: "catCss" as const, emoji: "🎨" },
    { href: "/courses", key: "catTools" as const, emoji: "🛠" },
  ];

  const partnerLabels = ["HTML5", "CSS3", "JavaScript", "ES6+", "Git", "REST"];

  return (
    <div className="space-y-14 lg:space-y-20">
      <section className="grid gap-4 lg:grid-cols-2">
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#e8faf3] to-[#f0fdf4] p-8 shadow-sm ring-1 ring-[#e8eaed] lg:p-10">
          <div className="absolute -right-8 -top-8 h-40 w-40 rounded-full bg-[#0056d2]/10 blur-2xl" />
          <div className="relative">
            <div className="inline-flex items-center gap-2 rounded-lg bg-white px-3 py-1 text-xs font-bold text-[#0056d2] shadow-sm ring-1 ring-[#d9e9ff]">
              <span className="rounded bg-[#0056d2] px-2 py-0.5 text-white">
                WD-EDU
              </span>
              {t("heroBadgeSave")}
            </div>
            <h1 className="mt-5 text-2xl font-bold leading-tight tracking-tight text-[#1c1d1f] md:text-3xl">
              {t("heroLeftTitle")}
            </h1>
            <p className="mt-4 max-w-md text-sm leading-relaxed text-[#6a6f73] md:text-base">
              {t("heroLeftSub")}
            </p>
            <Link
              href="/courses"
              className="mt-6 inline-flex items-center gap-2 rounded-sm bg-[#0056d2] px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-[#00419e]"
            >
              {t("heroLeftCta")}
              <span aria-hidden>→</span>
            </Link>
            <div className="mt-8 flex flex-wrap gap-2">
              {["W", "◇", "◆", "○"].map((x, i) => (
                <span
                  key={i}
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-[#e0e0e0] bg-white text-xs font-bold text-[#0056d2]"
                >
                  {x}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#0056d2] to-[#1a56b9] p-8 text-white shadow-sm lg:p-10">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cpath%20d%3D%22M30%200L60%2030L30%2060L0%2030Z%22%20fill%3D%22%23ffffff%22%20fill-opacity%3D%220.04%22%2F%3E%3C%2Fsvg%3E')] opacity-60" />
          <div className="relative">
            <p className="text-xs font-bold uppercase tracking-wider text-white/80">
              {t("heroRightKicker")}
            </p>
            <h2 className="mt-4 text-2xl font-bold leading-tight md:text-3xl">
              {t("heroRightTitle")}
            </h2>
            <p className="mt-4 max-w-md text-sm text-white/90 md:text-base">
              {t("heroRightSub")}
            </p>
            <Link
              href="/admin"
              className="mt-6 inline-flex items-center gap-2 rounded-sm bg-white px-5 py-3 text-sm font-bold text-[#0056d2] transition hover:bg-[#eef5ff]"
            >
              {t("heroRightCta")}
              <span aria-hidden>→</span>
            </Link>
            <div className="mt-8 inline-flex rounded-full bg-white/15 px-4 py-2 text-xs font-bold backdrop-blur-sm">
              {t("heroTeamBadge")}
            </div>
          </div>
        </div>
      </section>

      <div className="flex justify-center gap-2">
        <span className="h-2 w-8 rounded-full bg-[#0056d2]" />
        <span className="h-2 w-8 rounded-full bg-[#0056d2]" />
        <span className="h-2 w-2 rounded-full bg-[#d0d0d0]" />
      </div>

      <section className="grid gap-4 md:grid-cols-3">
        {[
          { title: t("ctaRow1Title"), desc: t("ctaRow1Desc") },
          { title: t("ctaRow2Title"), desc: t("ctaRow2Desc") },
          { title: t("ctaRow3Title"), desc: t("ctaRow3Desc") },
        ].map((card, i) => (
          <div
            key={i}
            className="flex min-h-[120px] items-start justify-between gap-4 rounded-xl bg-white p-6 shadow-sm ring-1 ring-[#e8eaed]"
          >
            <div>
              <h3 className="text-lg font-bold text-[#1c1d1f]">{card.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-[#6a6f73]">
                {card.desc}
              </p>
            </div>
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg border-2 border-[#0056d2] text-2xl text-[#0056d2]">
              {i === 0 ? "🎓" : i === 1 ? "📡" : "💻"}
            </div>
          </div>
        ))}
      </section>

      <section>
        <h2 className="text-center text-2xl font-bold text-[#1c1d1f] md:text-3xl">
          {t("partnersTitle")}
        </h2>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          {partnerLabels.map((label) => (
            <div
              key={label}
              className="rounded-full border border-[#e0e0e0] bg-white px-5 py-2.5 text-sm font-semibold text-[#1c1d1f] shadow-sm"
            >
              {label}
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-bold text-[#1c1d1f] md:text-3xl">
          {t("trendingTitle")}
        </h2>
        <div className="mt-8 grid gap-6 lg:grid-cols-3">
          {[
            t("trendCol1"),
            t("trendCol2"),
            t("trendCol3"),
          ].map((colTitle, colIdx) => (
            <div
              key={colTitle}
              className="rounded-2xl bg-[#e8eef5] p-5 ring-1 ring-[#dde5f0]"
            >
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-sm font-bold text-[#1c1d1f]">{colTitle}</h3>
                <span className="text-[#0056d2]">→</span>
              </div>
              <div className="space-y-3">
                {trendCols[colIdx].length === 0 ? (
                  <p className="text-sm text-[#6a6f73]">{t("statsCourses")}</p>
                ) : (
                  trendCols[colIdx].map((c, idx) => {
                    const rating = 4.6 + colIdx * 0.1 + idx * 0.05;
                    return (
                      <Link
                        key={c.id}
                        href={`/courses/${c.id}`}
                        className="flex gap-3 rounded-xl bg-white p-3 shadow-sm ring-1 ring-[#e8eaed] transition hover:shadow-md"
                      >
                        <div
                          className="h-16 w-16 shrink-0 rounded-lg bg-gradient-to-br from-[#0056d2] to-[#4a90d9]"
                          aria-hidden
                        />
                        <div className="min-w-0 flex-1">
                          <p className="text-[11px] font-semibold text-[#6a6f73]">
                            WD-EDU · {c.durationHours}h
                          </p>
                          <p className="line-clamp-2 text-sm font-bold text-[#1c1d1f]">
                            {c.title}
                          </p>
                          <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-[#6a6f73]">
                            <span>{t("programType")}</span>
                            <span>·</span>
                            <StarRow n={rating} />
                          </div>
                        </div>
                      </Link>
                    );
                  })
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-bold text-[#1c1d1f] md:text-3xl">
          {t("categoriesTitle")}
        </h2>
        <div className="mt-6 flex flex-wrap gap-3">
          {categories.map((c) => (
            <Link
              key={c.key}
              href={c.href}
              className="inline-flex items-center gap-2 rounded-full bg-[#e8eef5] px-4 py-2.5 text-sm font-semibold text-[#1c1d1f] transition hover:bg-[#d9e5f5]"
            >
              <span className="text-base opacity-80">{c.emoji}</span>
              {t(c.key)}
            </Link>
          ))}
        </div>
      </section>

      <section className="overflow-hidden rounded-2xl bg-gradient-to-r from-[#0056d2] to-[#4c1d95] p-8 text-white shadow-lg md:flex md:items-center md:justify-between md:p-12">
        <div className="max-w-xl">
          <h2 className="text-2xl font-bold md:text-3xl">
            {t("promoBannerTitle")}
          </h2>
          <Link
            href="/courses"
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-bold text-[#0056d2] transition hover:bg-[#eef5ff]"
          >
            {t("promoBannerCta")}
            <span aria-hidden>→</span>
          </Link>
        </div>
        <div className="relative mt-8 md:mt-0 md:w-[380px]">
          <div className="flex gap-3 overflow-x-auto pb-2 md:justify-end">
            {coursesWithAssignments.slice(0, 4).map((c) => (
              <Link
                key={c.id}
                href={`/courses/${c.id}`}
                className="w-[140px] shrink-0 rounded-xl bg-white p-3 text-[#1c1d1f] shadow-lg"
              >
                <div className="mb-2 h-16 rounded-lg bg-gradient-to-br from-indigo-200 to-blue-300" />
                <p className="text-[10px] font-semibold text-[#6a6f73]">WD-EDU</p>
                <p className="line-clamp-2 text-xs font-bold leading-snug">
                  {c.title}
                </p>
                <p className="mt-1 text-[10px] text-[#6a6f73]">
                  {t("programType")}
                </p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-8 rounded-2xl bg-[#0f172a] p-8 text-white md:grid-cols-2 md:items-center md:p-12">
        <div>
          <h2 className="text-2xl font-bold leading-tight md:text-3xl">
            {t("outcomeTitle")}
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-white/85">
            {t("outcomeSub")}
          </p>
          <Link
            href="/courses"
            className="mt-6 inline-flex text-sm font-bold text-[#7dd3fc] hover:underline"
          >
            {t("outcomeLink")}
            <span className="ml-1" aria-hidden>
              →
            </span>
          </Link>
        </div>
        <div className="flex justify-center">
          <div className="relative flex h-44 w-44 items-center justify-center rounded-full border-8 border-[#1e3a5f] bg-[#0c4a6e] shadow-inner">
            <svg className="absolute inset-0 h-full w-full -rotate-90" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="42"
                fill="none"
                stroke="#22d3ee"
                strokeWidth="8"
                strokeDasharray={`${0.9 * 264} 264`}
                strokeLinecap="round"
              />
            </svg>
            <span className="text-4xl font-bold tracking-tight">
              {t("outcomeStat")}
            </span>
          </div>
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-bold text-[#1c1d1f] md:text-3xl">
          {t("testimonialsTitle")}
        </h2>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { name: t("testimonial1Name"), text: t("testimonial1Text") },
            { name: t("testimonial2Name"), text: t("testimonial2Text") },
            { name: t("testimonial3Name"), text: t("testimonial3Text") },
            { name: t("testimonial4Name"), text: t("testimonial4Text") },
          ].map((x, i) => (
            <figure
              key={i}
              className="rounded-xl border border-[#e8eaed] bg-white p-5 shadow-sm"
            >
              <div className="flex items-center gap-3">
                <div
                  className="flex h-11 w-11 items-center justify-center rounded-full bg-[#e8eef5] text-sm font-bold text-[#0056d2]"
                  aria-hidden
                >
                  {x.name.charAt(0)}
                </div>
                <figcaption className="text-sm font-bold text-[#1c1d1f]">
                  {x.name}
                </figcaption>
              </div>
              <blockquote className="mt-4 text-sm leading-relaxed text-[#6a6f73]">
                {x.text}
              </blockquote>
            </figure>
          ))}
        </div>
      </section>

      <HomeFAQ title={t("faqTitle")} items={faqItems} />

      <section className="rounded-2xl border border-dashed border-[#cbd5e1] bg-white p-8 shadow-sm">
        <h2 className="text-lg font-bold text-[#1c1d1f]">{t("demoTitle")}</h2>
        <ul className="mt-4 space-y-2 text-sm text-[#6a6f73]">
          <li>{t("demoTeacher")}</li>
          <li>{t("demoStudent")}</li>
          <li>{t("demoPass")}</li>
        </ul>
      </section>
    </div>
  );
}
