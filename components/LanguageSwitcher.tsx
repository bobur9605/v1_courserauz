"use client";

import { useLocale } from "next-intl";
import { usePathname, useRouter } from "@/i18n/routing";
import { useTransition } from "react";

const LOCALES = ["uz", "en", "ru"] as const;

const labels: Record<string, string> = {
  uz: "Oʻzb",
  en: "EN",
  ru: "RU",
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
    <div
      className="flex items-center gap-0 rounded-full border border-[#e0e0e0] bg-white p-0.5 text-[11px] font-bold shadow-sm"
      role="group"
      aria-label="Language"
    >
      {LOCALES.map((code) => (
        <button
          key={code}
          type="button"
          onClick={() => switchTo(code)}
          className={
            locale === code
              ? "rounded-full bg-[#0056d2] px-2 py-1 text-white"
              : "rounded-full px-2 py-1 text-[#1c1d1f] hover:bg-[#f3f4f6]"
          }
        >
          {labels[code]}
        </button>
      ))}
    </div>
  );
}
