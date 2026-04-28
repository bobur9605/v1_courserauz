"use client";

import { Link } from "@/i18n/routing";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";

type Props = {
  loggedIn: boolean;
  role?: "SUPERADMIN" | "TEACHER" | "STUDENT";
};

export function ExploreNav({ loggedIn, role }: Props) {
  const t = useTranslations("header");
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const isTeacher = role === "TEACHER";
  const isSuperadmin = role === "SUPERADMIN";
  const canSeeStudentLinks = role === "STUDENT" || !loggedIn;

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("click", onDoc);
    return () => document.removeEventListener("click", onDoc);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1 rounded-sm px-1 py-2 text-sm font-bold text-[#1c1d1f] transition hover:text-[#0056d2]"
        aria-expanded={open}
        aria-haspopup="true"
      >
        {t("explore")}
        <svg
          width="12"
          height="12"
          viewBox="0 0 12 12"
          fill="currentColor"
          className={`opacity-70 transition ${open ? "rotate-180" : ""}`}
          aria-hidden
        >
          <path d="M6 8L1 3h10L6 8z" />
        </svg>
      </button>
      {open && (
        <div className="absolute left-0 top-full z-50 mt-1 w-[min(18rem,calc(100vw-2rem))] rounded-lg border border-[#e0e0e0] bg-white py-2 shadow-lg">
          <Link
            href="/courses"
            className="block px-4 py-2.5 text-sm font-semibold text-[#1c1d1f] hover:bg-[#f3f4f6]"
            onClick={() => setOpen(false)}
          >
            {t("exploreCatalog")}
          </Link>
          {loggedIn && !isTeacher && !isSuperadmin && (
            <Link
              href="/dashboard"
              className="block px-4 py-2.5 text-sm font-semibold text-[#1c1d1f] hover:bg-[#f3f4f6]"
              onClick={() => setOpen(false)}
            >
              {t("myDashboard")}
            </Link>
          )}
          {canSeeStudentLinks && (
            <Link
              href="/courses"
              className="block px-4 py-2.5 text-sm font-semibold text-[#1c1d1f] hover:bg-[#f3f4f6]"
              onClick={() => setOpen(false)}
            >
              {t("codeLabs")}
            </Link>
          )}
          {(isTeacher || isSuperadmin) && (
            <Link
              href="/teacher"
              className="block px-4 py-2.5 text-sm font-semibold text-[#0056d2] hover:bg-[#eef5ff]"
              onClick={() => setOpen(false)}
            >
              {t("teacherPanel")}
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
