import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/routing";
import { getSession } from "@/lib/auth";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { UtilityBar } from "@/components/UtilityBar";
import { ExploreNav } from "@/components/ExploreNav";
import { HeaderSearch } from "@/components/HeaderSearch";
import { HeaderUserMenu } from "@/components/HeaderUserMenu";

export async function SiteHeader() {
  const session = await getSession();
  const t = await getTranslations("nav");
  const th = await getTranslations("header");

  return (
    <header className="sticky top-0 z-50 shadow-sm">
      <UtilityBar />
      <div className="border-b border-[#e0e0e0] bg-white">
        <div className="mx-auto flex max-w-[1344px] flex-wrap items-center gap-x-4 gap-y-3 px-4 py-2.5 lg:flex-nowrap lg:px-6">
          <div className="order-1 flex shrink-0 items-center gap-4 lg:gap-6">
            <Link
              href="/"
              className="text-2xl font-bold tracking-tight text-[#0056d2] lowercase"
            >
              {th("brand")}
            </Link>
            <div className="flex items-center gap-4 sm:gap-5">
              <ExploreNav
                loggedIn={!!session}
                isAdmin={session?.role === "ADMIN"}
              />
              <Link
                href="/courses"
                className="hidden text-sm font-bold text-[#1c1d1f] hover:text-[#0056d2] md:inline"
              >
                {th("degrees")}
              </Link>
            </div>
          </div>

          <div className="order-3 w-full lg:order-2 lg:flex-1 lg:px-4">
            <div className="mx-auto w-full max-w-2xl">
              <HeaderSearch />
            </div>
          </div>

          <div className="order-2 ml-auto flex shrink-0 items-center gap-3 sm:order-3 sm:ml-0">
            <LanguageSwitcher />
            {!session ? (
              <>
                <Link
                  href="/login"
                  className="text-sm font-bold text-[#0056d2] hover:underline"
                >
                  {t("login")}
                </Link>
                <Link
                  href="/register"
                  className="rounded-sm border-2 border-[#0056d2] bg-white px-4 py-2 text-sm font-bold text-[#0056d2] transition hover:bg-[#eef5ff]"
                >
                  {th("joinFree")}
                </Link>
              </>
            ) : (
              <div className="flex items-center gap-3">
                <HeaderUserMenu fullName={session.fullName} />
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
