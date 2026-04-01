import { getTranslations } from "next-intl/server";

export default async function TermsPage() {
  const t = await getTranslations("footer");

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-[#e0e0e0] bg-white p-8 shadow-sm">
        <h1 className="text-3xl font-bold text-[#1c1d1f]">{t("more1")}</h1>
        <p className="mt-3 text-sm leading-relaxed text-[#4b5563]">
          These sample terms cover acceptable educational use of the WD-EDU platform.
        </p>
      </section>

      <section className="rounded-xl border border-[#e0e0e0] bg-white p-6 shadow-sm">
        <ul className="space-y-2 text-sm text-[#4b5563]">
          <li>Use the platform for academic learning and coursework only.</li>
          <li>Do not share account credentials with others.</li>
          <li>Respect instructor feedback and submission deadlines.</li>
        </ul>
      </section>
    </div>
  );
}
