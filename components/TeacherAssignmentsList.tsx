"use client";

import { useMemo, useState } from "react";
import { Link } from "@/i18n/routing";

type Row = { id: string; title: string; order: number };

export function TeacherAssignmentsList({
  courseId,
  assignments,
}: {
  courseId: string;
  assignments: Row[];
}) {
  const initial = useMemo(
    () => [...assignments].sort((a, b) => a.order - b.order),
    [assignments],
  );
  const [rows, setRows] = useState<Row[]>(initial);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);

  async function persist(next: Row[]) {
    setBusy(true);
    setError(false);
    const res = await fetch(`/api/courses/${courseId}/assignments/reorder`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderedIds: next.map((r) => r.id) }),
    });
    setBusy(false);
    if (!res.ok) {
      setError(true);
    }
  }

  function move(idx: number, dir: -1 | 1) {
    const to = idx + dir;
    if (to < 0 || to >= rows.length) return;
    const next = [...rows];
    const tmp = next[idx];
    next[idx] = next[to];
    next[to] = tmp;
    setRows(next);
    void persist(next);
  }

  return (
    <div className="divide-y divide-[#e0e0e0]">
      {rows.map((a, i) => (
        <div
          key={a.id}
          className="flex flex-wrap items-center justify-between gap-2 px-6 py-3"
        >
          <span className="text-sm font-semibold text-[#1c1d1f]">
            {i + 1}. {a.title}
          </span>
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              disabled={busy || i === 0}
              onClick={() => move(i, -1)}
              className="text-sm font-semibold text-[#6a6f73] hover:text-[#1c1d1f] disabled:opacity-40"
              aria-label="Move up"
            >
              ↑
            </button>
            <button
              type="button"
              disabled={busy || i === rows.length - 1}
              onClick={() => move(i, 1)}
              className="text-sm font-semibold text-[#6a6f73] hover:text-[#1c1d1f] disabled:opacity-40"
              aria-label="Move down"
            >
              ↓
            </button>
            <Link
              href={`/teacher/courses/${courseId}/assignments/${a.id}/edit`}
              className="text-sm font-semibold text-[#0056d2] hover:underline"
            >
              Edit
            </Link>
            <Link
              href={`/courses/${courseId}/assignment/${a.id}`}
              className="text-sm font-semibold text-[#0056d2] hover:underline"
            >
              Open
            </Link>
          </div>
        </div>
      ))}
      {error && (
        <p className="px-6 py-3 text-sm text-red-600">
          Could not save order. Please refresh and try again.
        </p>
      )}
    </div>
  );
}

