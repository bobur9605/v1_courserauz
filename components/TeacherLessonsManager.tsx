"use client";

import { useMemo, useState } from "react";
import { Link } from "@/i18n/routing";

type LessonRow = {
  id: string;
  title: string;
  content: string;
  order: number;
  isPublished: boolean;
  assignmentId: string | null;
};

export function TeacherLessonsManager({
  courseId,
  lessons,
}: {
  courseId: string;
  lessons: LessonRow[];
}) {
  const initial = useMemo(
    () => [...lessons].sort((a, b) => a.order - b.order),
    [lessons],
  );
  const [rows, setRows] = useState<LessonRow[]>(initial);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    title: "",
    content: "",
    assignmentTitle: "",
    assignmentInstructions: "",
    starterCode: "",
    expectedOutput: "",
  });

  async function persistOrder(next: LessonRow[]) {
    setBusy(true);
    setError(null);
    const res = await fetch(`/api/courses/${courseId}/lessons/reorder`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderedIds: next.map((r) => r.id) }),
    });
    setBusy(false);
    if (!res.ok) setError("Could not save lesson order.");
  }

  function move(idx: number, dir: -1 | 1) {
    const to = idx + dir;
    if (to < 0 || to >= rows.length) return;
    const next = [...rows];
    const temp = next[idx];
    next[idx] = next[to];
    next[to] = temp;
    setRows(next);
    void persistOrder(next);
  }

  async function createLesson() {
    setBusy(true);
    setError(null);
    const withAssignment =
      form.assignmentTitle.trim().length > 0 ||
      form.starterCode.trim().length > 0 ||
      form.expectedOutput.trim().length > 0;
    const res = await fetch(`/api/courses/${courseId}/lessons`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: form.title,
        content: form.content,
        assignmentTitle: withAssignment ? form.assignmentTitle : undefined,
        assignmentInstructions: withAssignment
          ? form.assignmentInstructions
          : undefined,
        starterCode: withAssignment ? form.starterCode : undefined,
        expectedOutput: withAssignment ? form.expectedOutput : undefined,
      }),
    });
    setBusy(false);
    if (!res.ok) {
      setError("Could not create lesson.");
      return;
    }
    const created = (await res.json()) as LessonRow;
    setRows((prev) => [...prev, created].sort((a, b) => a.order - b.order));
    setForm({
      title: "",
      content: "",
      assignmentTitle: "",
      assignmentInstructions: "",
      starterCode: "",
      expectedOutput: "",
    });
  }

  return (
    <div className="space-y-5">
      <div className="rounded-lg border border-[#e0e0e0] p-4">
        <h3 className="text-sm font-bold uppercase tracking-wide text-[#6a6f73]">
          Create lesson
        </h3>
        <div className="mt-3 grid gap-3">
          <input
            className="rounded-md border border-[#d1d5db] px-3 py-2 text-sm"
            value={form.title}
            onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
            placeholder="Lesson title"
          />
          <textarea
            className="min-h-[100px] rounded-md border border-[#d1d5db] px-3 py-2 text-sm"
            value={form.content}
            onChange={(e) => setForm((p) => ({ ...p, content: e.target.value }))}
            placeholder="Written lesson content"
          />
          <input
            className="rounded-md border border-[#d1d5db] px-3 py-2 text-sm"
            value={form.assignmentTitle}
            onChange={(e) =>
              setForm((p) => ({ ...p, assignmentTitle: e.target.value }))
            }
            placeholder="Coding task title (optional)"
          />
          <textarea
            className="min-h-[80px] rounded-md border border-[#d1d5db] px-3 py-2 text-sm"
            value={form.assignmentInstructions}
            onChange={(e) =>
              setForm((p) => ({ ...p, assignmentInstructions: e.target.value }))
            }
            placeholder="Coding task instructions"
          />
          <textarea
            className="min-h-[80px] rounded-md border border-[#d1d5db] px-3 py-2 font-mono text-sm"
            value={form.starterCode}
            onChange={(e) =>
              setForm((p) => ({ ...p, starterCode: e.target.value }))
            }
            placeholder="Starter code"
          />
          <textarea
            className="min-h-[80px] rounded-md border border-[#d1d5db] px-3 py-2 font-mono text-sm"
            value={form.expectedOutput}
            onChange={(e) =>
              setForm((p) => ({ ...p, expectedOutput: e.target.value }))
            }
            placeholder="Expected output"
          />
          <button
            type="button"
            disabled={busy || form.title.trim().length < 2}
            onClick={() => void createLesson()}
            className="w-fit rounded-md bg-[#0056d2] px-4 py-2 text-sm font-semibold text-white hover:bg-[#00419e] disabled:opacity-60"
          >
            Add lesson
          </button>
        </div>
      </div>

      <div className="divide-y divide-[#e0e0e0]">
        {rows.map((lesson, i) => (
          <div
            key={lesson.id}
            className="flex flex-wrap items-center justify-between gap-3 px-2 py-3"
          >
            <div>
              <p className="font-semibold text-[#1c1d1f]">
                {i + 1}. {lesson.title}
              </p>
              <p className="text-xs text-[#6a6f73]">
                {lesson.assignmentId ? "Includes coding task" : "Reading-only"}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                disabled={busy || i === 0}
                onClick={() => move(i, -1)}
                className="text-sm font-semibold text-[#6a6f73] disabled:opacity-50"
              >
                ↑
              </button>
              <button
                type="button"
                disabled={busy || i === rows.length - 1}
                onClick={() => move(i, 1)}
                className="text-sm font-semibold text-[#6a6f73] disabled:opacity-50"
              >
                ↓
              </button>
              <Link
                href={`/courses/${courseId}/lessons/${lesson.id}`}
                className="text-sm font-semibold text-[#0056d2] hover:underline"
              >
                Preview
              </Link>
            </div>
          </div>
        ))}
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
