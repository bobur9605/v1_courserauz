import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/routing";

export async function UtilityBar() {
  const t = await getTranslations("utility");
  const linkClass =
    "px-3 py-2.5 text-xs font-semibold text-white/90 transition hover:text-white";
  const activeClass =
    "border-b-[3px] border-white text-white font-bold";

  return (
    <div className="bg-[#1c1d1f]">
      <div className="mx-auto flex max-w-[1344px] items-center px-4 lg:px-6">
        <nav className="flex flex-wrap" aria-label="Audience">
          <Link
            href="/"
            className={`${linkClass} ${activeClass}`}
          >
            {t("individuals")}
          </Link>
          <Link href="/courses" className={linkClass}>
            {t("businesses")}
          </Link>
          <Link href="/courses" className={linkClass}>
            {t("universities")}
          </Link>
          <Link href="/courses" className={linkClass}>
            {t("government")}
          </Link>
        </nav>
      </div>
    </div>
  );
}
