"use client";

import { useRouter } from "@/i18n/routing";
import { useState } from "react";

type Props = {
  courseId: string;
  enrolled: boolean;
  labelJoin: string;
  labelEnrolled: string;
};

export function EnrollButton({
  courseId,
  enrolled: initial,
  labelJoin,
  labelEnrolled,
}: Props) {
  const [enrolled, setEnrolled] = useState(initial);
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  async function enroll() {
    setBusy(true);
    await fetch("/api/enroll", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ courseId }),
    });
    setEnrolled(true);
    setBusy(false);
    router.refresh();
  }

  if (enrolled) {
    return (
      <span className="inline-flex items-center rounded-md bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-800 ring-1 ring-emerald-200">
        {labelEnrolled}
      </span>
    );
  }

  return (
    <button
      type="button"
      disabled={busy}
      onClick={() => void enroll()}
      className="rounded-md bg-[#0056d2] px-4 py-2 text-sm font-semibold text-white shadow hover:bg-[#00419e] disabled:opacity-60"
    >
      {labelJoin}
    </button>
  );
}
