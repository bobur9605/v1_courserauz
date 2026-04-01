import { getTranslations } from "next-intl/server";

export default async function ResourcesPage() {
  const t = await getTranslations("footer");

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-[#e0e0e0] bg-white p-8 shadow-sm">
        <h1 className="text-3xl font-bold text-[#1c1d1f]">{t("career2")}</h1>
        <p className="mt-3 text-sm leading-relaxed text-[#4b5563]">
          {t("tag")}
        </p>
      </section>

      <section className="rounded-xl border border-[#e0e0e0] bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-[#1c1d1f]">{t("coursesTitle")}</h2>
        <ul className="mt-3 grid gap-2 text-sm text-[#4b5563] sm:grid-cols-2">
          <li>{t("courses1")}</li>
          <li>{t("courses2")}</li>
          <li>{t("courses3")}</li>
          <li>{t("courses4")}</li>
        </ul>
      </section>
    </div>
  );
}
