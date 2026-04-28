"use client";

import { useEffect, useRef, useState } from "react";
import { LogoutButton } from "@/components/LogoutButton";

type Props = {
  fullName: string;
  profileImageUrl?: string | null;
};

export function HeaderUserMenu({ fullName, profileImageUrl }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("click", onDocClick);
    return () => document.removeEventListener("click", onDocClick);
  }, []);

  const initial = (fullName.trim()[0] || "U").toUpperCase();
  const shortName = fullName.trim().split(/\s+/)[0] || fullName;

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex h-10 items-center gap-2 rounded-full border border-[#d9d9d9] bg-white px-2 pr-3 text-sm font-semibold text-[#1c1d1f] shadow-sm transition hover:bg-[#f5f9ff] focus:outline-none focus:ring-2 focus:ring-[#0056d2]/20"
        aria-label="Open user menu"
        aria-expanded={open}
        aria-haspopup="menu"
      >
        <span className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-[#eef5ff] text-sm font-bold text-[#0056d2]">
          {profileImageUrl ? (
            <img src={profileImageUrl} alt={fullName} className="h-full w-full object-cover" />
          ) : (
            initial
          )}
        </span>
        <span className="hidden max-w-[110px] truncate sm:inline">{shortName}</span>
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 min-w-[200px] rounded-lg border border-[#e0e0e0] bg-white p-3 shadow-lg">
          <p className="truncate text-sm font-semibold text-[#1c1d1f]">{fullName}</p>
          <div className="mt-2 border-t border-[#eef0f2] pt-2">
            <LogoutButton variant="coursera" />
          </div>
        </div>
      )}
    </div>
  );
}
