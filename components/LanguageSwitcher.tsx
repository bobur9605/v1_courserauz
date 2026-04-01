"use client";

import { useLocale } from "next-intl";
import { usePathname, useRouter } from "@/i18n/routing";
import { useTransition } from "react";

const LOCALES = ["uz", "en", "ru"] as const;

const labels: Record<string, string> = {
  uz: "Uzbek (UZ)",
  en: "English (EN)",
  ru: "Russian (RU)",
};

export function LanguageSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [, start] = useTransition();

  function switchTo(next: string) {
    start(() => {
      router.replace(pathname, { locale: next });
    });
  }

  return (
    <div className="relative">
      <span className="pointer-events-none absolute inset-y-0 left-2 flex items-center text-[#6a6f73]">
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          aria-hidden
        >
          <circle cx="12" cy="12" r="9" />
          <path d="M3 12h18" />
          <path d="M12 3a15 15 0 0 1 0 18" />
          <path d="M12 3a15 15 0 0 0 0 18" />
        </svg>
      </span>
      <select
        value={locale}
        onChange={(e) => switchTo(e.target.value)}
        className="min-h-10 appearance-none rounded-lg border border-[#d9d9d9] bg-white py-2 pl-7 pr-8 text-xs font-semibold text-[#1c1d1f] shadow-sm outline-none transition hover:border-[#bfc4c9] focus:border-[#0056d2] focus:ring-2 focus:ring-[#0056d2]/20"
        aria-label="Language"
      >
        {LOCALES.map((code) => (
          <option key={code} value={code}>
            {labels[code]}
          </option>
        ))}
      </select>
      <span className="pointer-events-none absolute inset-y-0 right-2 flex items-center text-[#6a6f73]">
        <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor" aria-hidden>
          <path d="M6 8L1 3h10L6 8z" />
        </svg>
      </span>
    </div>
  );
}
