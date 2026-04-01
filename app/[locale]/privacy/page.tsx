import { getTranslations } from "next-intl/server";

export default async function PrivacyPage() {
  const t = await getTranslations("footer");

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-[#e0e0e0] bg-white p-8 shadow-sm">
        <h1 className="text-3xl font-bold text-[#1c1d1f]">{t("career4")}</h1>
        <p className="mt-3 text-sm leading-relaxed text-[#4b5563]">
          This sample privacy page explains how WD-EDU handles account details, course progress,
          and assignment submissions for educational use.
        </p>
      </section>

      <section className="rounded-xl border border-[#e0e0e0] bg-white p-6 shadow-sm">
        <ul className="space-y-2 text-sm text-[#4b5563]">
          <li>Only necessary profile and learning data are stored.</li>
          <li>Student submissions are retained for grading and feedback history.</li>
          <li>Administrative access is role-restricted and audited.</li>
        </ul>
      </section>
    </div>
  );
}
