"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { type SessionPayload } from "@/lib/auth";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { ExploreNav } from "@/components/ExploreNav";
import { HeaderSearch } from "@/components/HeaderSearch";
import { HeaderUserMenu } from "@/components/HeaderUserMenu";
import { LogoutButton } from "@/components/LogoutButton";

type Props = {
  session: SessionPayload | null;
};

function MenuIcon({ open }: { open: boolean }) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      aria-hidden
    >
      {open ? (
        <>
          <path d="M6 6l12 12" />
          <path d="M18 6L6 18" />
        </>
      ) : (
        <>
          <path d="M4 7h16" />
          <path d="M4 12h16" />
          <path d="M4 17h16" />
        </>
      )}
    </svg>
  );
}

export function ResponsiveSiteHeader({ session }: Props) {
  const t = useTranslations("nav");
  const th = useTranslations("header");
  const [mobileOpen, setMobileOpen] = useState(false);

  const dashboardHref =
    session?.role === "TEACHER" || session?.role === "SUPERADMIN"
      ? "/teacher"
      : "/dashboard";

  const mobileLinks = useMemo(() => {
    const links = [{ href: "/courses", label: th("exploreCatalog") }];

    if (session && session.role !== "TEACHER" && session.role !== "SUPERADMIN") {
      links.push({ href: "/dashboard", label: th("myDashboard") });
    }

    if (!session || session.role === "STUDENT") {
      links.push({ href: "/courses", label: th("codeLabs") });
    }

    if (session && (session.role === "TEACHER" || session.role === "SUPERADMIN")) {
      links.push({ href: "/teacher", label: th("teacherPanel") });
    }

    return links;
  }, [session, th]);

  useEffect(() => {
    if (!mobileOpen) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setMobileOpen(false);
      }
    }

    function onResize() {
      if (window.innerWidth >= 1024) {
        setMobileOpen(false);
      }
    }

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("resize", onResize);

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("resize", onResize);
    };
  }, [mobileOpen]);

  return (
    <header className="sticky top-0 z-50 border-b border-[#e0e0e0] bg-white/95 shadow-sm backdrop-blur">
      <div className="mx-auto max-w-[1344px] px-4 sm:px-6 lg:px-8">
        <div className="flex min-h-16 items-center gap-3 py-3 lg:hidden">
          <Link
            href="/"
            className="min-w-0 text-xl font-bold tracking-tight text-[#0056d2] lowercase"
            onClick={() => setMobileOpen(false)}
          >
            {th("brand")}
          </Link>

          <div className="ml-auto flex items-center gap-2">
            <div className="max-w-[132px]">
              <LanguageSwitcher />
            </div>
            <button
              type="button"
              onClick={() => setMobileOpen((value) => !value)}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#d9d9d9] text-[#1c1d1f] transition hover:bg-[#f5f7fa]"
              aria-expanded={mobileOpen}
              aria-controls="mobile-site-menu"
              aria-label={mobileOpen ? "Close navigation menu" : "Open navigation menu"}
            >
              <MenuIcon open={mobileOpen} />
            </button>
          </div>
        </div>

        <div className="pb-3 lg:hidden">
          <HeaderSearch />
        </div>

        <div className="hidden min-h-18 lg:grid lg:grid-cols-[auto_minmax(0,1fr)_auto] lg:items-center lg:gap-6 lg:py-3">
          <div className="flex min-w-0 items-center gap-5 xl:gap-6">
            <Link
              href="/"
              className="shrink-0 text-2xl font-bold tracking-tight text-[#0056d2] lowercase"
            >
              {th("brand")}
            </Link>
            <nav className="flex min-w-0 items-center gap-4 xl:gap-5">
              <ExploreNav loggedIn={!!session} role={session?.role} />
              <Link
                href="/courses"
                className="text-sm font-bold text-[#1c1d1f] transition hover:text-[#0056d2]"
              >
                {th("degrees")}
              </Link>
            </nav>
          </div>

          <div className="min-w-0">
            <div className="mx-auto w-full max-w-2xl">
              <HeaderSearch />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3">
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
              <HeaderUserMenu
                fullName={session.fullName}
                profileImageUrl={session.profileImageUrl}
                dashboardHref={dashboardHref}
              />
            )}
          </div>
        </div>
      </div>

      {mobileOpen && (
        <>
          <button
            type="button"
            className="fixed inset-0 top-0 z-40 bg-[#1c1d1f]/40 lg:hidden"
            aria-label="Close navigation menu overlay"
            onClick={() => setMobileOpen(false)}
          />
          <div
            id="mobile-site-menu"
            className="fixed inset-y-0 right-0 z-50 flex w-full max-w-sm flex-col overflow-y-auto border-l border-[#e0e0e0] bg-white px-5 pb-6 pt-5 shadow-2xl lg:hidden"
          >
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-[#6a6f73]">{th("explore")}</p>
                <p className="text-lg font-bold text-[#1c1d1f]">{th("brand")}</p>
              </div>
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#d9d9d9] text-[#1c1d1f]"
                aria-label="Close navigation menu"
              >
                <MenuIcon open />
              </button>
            </div>

            <nav className="mt-6 space-y-2">
              {mobileLinks.map((link) => (
                <Link
                  key={`${link.href}-${link.label}`}
                  href={link.href}
                  className="block rounded-xl px-4 py-3 text-sm font-semibold text-[#1c1d1f] transition hover:bg-[#f5f7fa]"
                  onClick={() => setMobileOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
              <Link
                href="/courses"
                className="block rounded-xl px-4 py-3 text-sm font-semibold text-[#1c1d1f] transition hover:bg-[#f5f7fa]"
                onClick={() => setMobileOpen(false)}
              >
                {th("degrees")}
              </Link>
            </nav>

            <div className="mt-6 rounded-2xl border border-[#e0e0e0] bg-[#f8fafc] p-4">
              {!session ? (
                <div className="space-y-3">
                  <Link
                    href="/login"
                    className="block rounded-lg border border-[#d9d9d9] bg-white px-4 py-3 text-center text-sm font-bold text-[#0056d2]"
                    onClick={() => setMobileOpen(false)}
                  >
                    {t("login")}
                  </Link>
                  <Link
                    href="/register"
                    className="block rounded-lg bg-[#0056d2] px-4 py-3 text-center text-sm font-bold text-white"
                    onClick={() => setMobileOpen(false)}
                  >
                    {th("joinFree")}
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <p className="text-base font-bold text-[#1c1d1f]">{session.fullName}</p>
                    <p className="text-sm text-[#6a6f73]">{session.email}</p>
                  </div>
                  <Link
                    href={dashboardHref}
                    className="block rounded-lg border border-[#d9d9d9] bg-white px-4 py-3 text-center text-sm font-semibold text-[#1c1d1f]"
                    onClick={() => setMobileOpen(false)}
                  >
                    {th("myDashboard")}
                  </Link>
                  <div className="text-center">
                    <LogoutButton variant="coursera" />
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </header>
  );
}
