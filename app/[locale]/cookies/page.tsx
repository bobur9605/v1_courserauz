import { getTranslations } from "next-intl/server";

export default async function CookiesPage() {
  const t = await getTranslations("footer");

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-[#e0e0e0] bg-white p-8 shadow-sm">
        <h1 className="text-3xl font-bold text-[#1c1d1f]">{t("more3")}</h1>
        <p className="mt-3 text-sm leading-relaxed text-[#4b5563]">
          WD-EDU uses essential cookies for authentication, language preference, and secure session handling.
        </p>
      </section>

      <section className="rounded-xl border border-[#e0e0e0] bg-white p-6 shadow-sm">
        <ul className="space-y-2 text-sm text-[#4b5563]">
          <li>Session cookie keeps users signed in securely.</li>
          <li>Language settings improve user experience across locales.</li>
          <li>Security cookies help protect protected routes.</li>
        </ul>
      </section>
    </div>
  );
}
