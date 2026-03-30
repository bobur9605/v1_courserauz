import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/routing";

export default async function NotFound() {
  const t = await getTranslations("nav");
  return (
    <div className="mx-auto max-w-lg rounded-xl border border-[#e0e0e0] bg-white p-10 text-center shadow-sm">
      <p className="text-6xl font-bold text-[#0056d2]">404</p>
      <h1 className="mt-4 text-xl font-bold text-[#1c1d1f]">
        {t("home")} — 404
      </h1>
      <Link
        href="/"
        className="mt-6 inline-block rounded-md bg-[#0056d2] px-5 py-2 text-sm font-semibold text-white"
      >
        {t("home")}
      </Link>
    </div>
  );
}
