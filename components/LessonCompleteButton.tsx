"use client";

import { useState } from "react";
import { useRouter } from "@/i18n/routing";

export function LessonCompleteButton({
  courseId,
  lessonId,
  completed,
}: {
  courseId: string;
  lessonId: string;
  completed: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function complete() {
    setBusy(true);
    await fetch(`/api/courses/${courseId}/lessons/${lessonId}/complete`, {
      method: "POST",
    });
    setBusy(false);
    router.refresh();
  }

  return (
    <button
      type="button"
      disabled={busy || completed}
      onClick={() => void complete()}
      className="rounded bg-[#0056d2] px-4 py-2 text-sm font-semibold text-white hover:bg-[#00419e] disabled:opacity-60"
    >
      {completed ? "Completed" : "Complete lesson"}
    </button>
  );
}
