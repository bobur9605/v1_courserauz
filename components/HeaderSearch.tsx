"use client";

import { useRouter } from "@/i18n/routing";
import { useTranslations } from "next-intl";
import { useState } from "react";

export function HeaderSearch() {
  const t = useTranslations("header");
  const router = useRouter();
  const [q, setQ] = useState("");

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const query = q.trim();
    router.push({
      pathname: "/courses",
      query: query ? { q: query } : {},
    });
  }

  return (
    <form
      onSubmit={onSubmit}
      className="flex min-h-12 w-full items-center rounded-full border border-[#d9d9d9] bg-white pl-3 pr-1 shadow-inner transition focus-within:border-[#0056d2] focus-within:ring-2 focus-within:ring-[#0056d2]/20 sm:pl-4"
      role="search"
    >
      <input
        type="search"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder={t("searchPlaceholder")}
        className="min-h-11 min-w-0 flex-1 bg-transparent py-2 text-sm text-[#1c1d1f] outline-none placeholder:text-[#6a6f73]"
        aria-label={t("searchPlaceholder")}
      />
      <button
        type="submit"
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#0056d2] text-white shadow-sm transition hover:bg-[#00419e]"
        aria-label="Search"
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
        >
          <circle cx="11" cy="11" r="7" />
          <path d="M20 20l-4.3-4.3" />
        </svg>
      </button>
    </form>
  );
}
