"use client";

import { useState } from "react";

type Item = { q: string; a: string };

export function HomeFAQ({ title, items }: { title: string; items: Item[] }) {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section className="rounded-2xl bg-white p-8 shadow-sm ring-1 ring-[#e8eaed]">
      <h2 className="text-2xl font-bold text-[#1c1d1f]">{title}</h2>
      <ul className="mt-6 divide-y divide-[#e0e0e0]">
        {items.map((item, i) => {
          const isOpen = open === i;
          return (
            <li key={i} className="py-1">
              <button
                type="button"
                onClick={() => setOpen(isOpen ? null : i)}
                className="flex w-full items-start gap-3 py-4 text-left"
              >
                <span
                  className={`mt-0.5 text-[#0056d2] transition ${isOpen ? "rotate-180" : ""}`}
                >
                  <svg width="14" height="14" viewBox="0 0 12 12" fill="currentColor">
                    <path d="M6 8L1 3h10L6 8z" />
                  </svg>
                </span>
                <span className="flex-1 text-base font-bold text-[#1c1d1f]">
                  {item.q}
                </span>
              </button>
              {isOpen && (
                <p className="border-t border-transparent pb-4 pl-8 text-sm leading-relaxed text-[#6a6f73]">
                  {item.a}
                </p>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
