import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/routing";

export async function Footer() {
  const t = await getTranslations("footer");

  const col = (title: string, links: { href: string; label: string }[]) => (
    <div>
      <h3 className="mb-4 text-sm font-bold text-[#1c1d1f]">{title}</h3>
      <ul className="space-y-2.5">
        {links.map((l) => (
          <li key={l.href + l.label}>
            <Link
              href={l.href}
              className="text-sm text-[#1c1d1f] hover:text-[#0056d2] hover:underline"
            >
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );

  return (
    <footer className="mt-auto border-t border-[#e0e0e0] bg-[#f5f7f8]">
      <div className="mx-auto max-w-[1344px] px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          {col(t("skillsTitle"), [
            { href: "/courses", label: t("skills1") },
            { href: "/courses", label: t("skills2") },
            { href: "/courses", label: t("skills3") },
            { href: "/courses", label: t("skills4") },
            { href: "/courses", label: t("skills5") },
          ])}
          {col(t("certTitle"), [
            { href: "/courses", label: t("cert1") },
            { href: "/courses", label: t("cert2") },
            { href: "/dashboard", label: t("cert3") },
            { href: "/dashboard", label: t("cert4") },
          ])}
          {col(t("coursesTitle"), [
            { href: "/courses", label: t("courses1") },
            { href: "/dashboard", label: t("courses2") },
            { href: "/register", label: t("courses3") },
            { href: "/login", label: t("courses4") },
          ])}
          {col(t("careerTitle"), [
            { href: "/about", label: t("career1") },
            { href: "/resources", label: t("career2") },
            { href: "/contact", label: t("career3") },
            { href: "/privacy", label: t("career4") },
          ])}
        </div>

        <p className="mt-10 max-w-3xl text-xs leading-relaxed text-[#6a6f73]">
          {t("disclaimer")}
        </p>

        <div className="mt-10 grid gap-8 border-t border-[#e0e0e0] pt-10 sm:grid-cols-3">
          {col(t("bottomBrand"), [
            { href: "/about", label: t("about") },
            { href: "/resources", label: t("tag") },
          ])}
          {col(t("bottomCommunity"), [
            { href: "/register", label: t("community1") },
            { href: "/admin", label: t("community2") },
            { href: "/courses", label: t("community3") },
          ])}
          {col(t("bottomMore"), [
            { href: "/terms", label: t("more1") },
            { href: "/privacy", label: t("more2") },
            { href: "/cookies", label: t("more3") },
            { href: "/support", label: t("more4") },
          ])}
        </div>

        <div className="mt-10 flex flex-col gap-4 border-t border-[#e0e0e0] pt-8 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-[#6a6f73]">{t("rights")}</p>
          <div className="flex flex-wrap gap-2">
            <span className="rounded border border-[#1c1d1f] bg-[#1c1d1f] px-3 py-1.5 text-[10px] font-semibold text-white">
              App Store
            </span>
            <span className="rounded border border-[#1c1d1f] px-3 py-1.5 text-[10px] font-semibold text-[#1c1d1f]">
              Google Play
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
