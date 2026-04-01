import { getTranslations } from "next-intl/server";

export default async function ContactPage() {
  const t = await getTranslations("footer");

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-[#e0e0e0] bg-white p-8 shadow-sm">
        <h1 className="text-3xl font-bold text-[#1c1d1f]">{t("career3")}</h1>
        <p className="mt-3 text-sm leading-relaxed text-[#4b5563]">
          Use this sample contact page for academic communication and support requests.
          You can later replace this with real department contacts, email addresses, and office hours.
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-[#e0e0e0] bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-[#1c1d1f]">General Support</h2>
          <p className="mt-2 text-sm text-[#4b5563]">support@wdedu.uz</p>
        </div>
        <div className="rounded-xl border border-[#e0e0e0] bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-[#1c1d1f]">Instructor Team</h2>
          <p className="mt-2 text-sm text-[#4b5563]">instructors@wdedu.uz</p>
        </div>
      </section>
    </div>
  );
}
