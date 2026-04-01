import { getTranslations } from "next-intl/server";

export default async function AboutPage() {
  const t = await getTranslations("footer");

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-[#e0e0e0] bg-white p-8 shadow-sm">
        <h1 className="text-3xl font-bold text-[#1c1d1f]">{t("career1")}</h1>
        <p className="mt-3 max-w-3xl text-sm leading-relaxed text-[#4b5563]">
          {t("about")}
        </p>
        <p className="mt-2 text-sm text-[#4b5563]">{t("disclaimer")}</p>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-[#e0e0e0] bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-[#1c1d1f]">{t("skillsTitle")}</h2>
          <ul className="mt-3 space-y-1 text-sm text-[#4b5563]">
            <li>{t("skills1")}</li>
            <li>{t("skills2")}</li>
            <li>{t("skills3")}</li>
            <li>{t("skills4")}</li>
            <li>{t("skills5")}</li>
          </ul>
        </div>
        <div className="rounded-xl border border-[#e0e0e0] bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-[#1c1d1f]">{t("certTitle")}</h2>
          <ul className="mt-3 space-y-1 text-sm text-[#4b5563]">
            <li>{t("cert1")}</li>
            <li>{t("cert2")}</li>
            <li>{t("cert3")}</li>
            <li>{t("cert4")}</li>
          </ul>
        </div>
      </section>
    </div>
  );
}
