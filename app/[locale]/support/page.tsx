import { getTranslations } from "next-intl/server";

export default async function SupportPage() {
  const t = await getTranslations("footer");

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-[#e0e0e0] bg-white p-8 shadow-sm">
        <h1 className="text-3xl font-bold text-[#1c1d1f]">{t("more4")}</h1>
        <p className="mt-3 text-sm leading-relaxed text-[#4b5563]">
          This support page includes sample guidance for login, assignment submissions, and dashboard access.
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <div className="rounded-xl border border-[#e0e0e0] bg-white p-5 shadow-sm">
          <h2 className="text-base font-semibold text-[#1c1d1f]">Account Help</h2>
          <p className="mt-2 text-sm text-[#4b5563]">Reset credentials and session troubleshooting.</p>
        </div>
        <div className="rounded-xl border border-[#e0e0e0] bg-white p-5 shadow-sm">
          <h2 className="text-base font-semibold text-[#1c1d1f]">Course Help</h2>
          <p className="mt-2 text-sm text-[#4b5563]">Enrollment, module flow, and assignment navigation.</p>
        </div>
        <div className="rounded-xl border border-[#e0e0e0] bg-white p-5 shadow-sm">
          <h2 className="text-base font-semibold text-[#1c1d1f]">Technical Help</h2>
          <p className="mt-2 text-sm text-[#4b5563]">Editor/runtime output and browser compatibility checks.</p>
        </div>
      </section>
    </div>
  );
}
