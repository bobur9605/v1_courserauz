"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import type { AssignmentEditorLanguage } from "@/lib/assignmentMode";
import { youtubeWatchUrl } from "@/lib/youtube";

type LessonRow = {
  id: string;
  title: string;
  content: string;
  order: number;
  isPublished: boolean;
  assignmentId: string | null;
  youtubeVideoId: string | null;
};

export function TeacherLessonsManager({
  courseId,
  lessons,
}: {
  courseId: string;
  lessons: LessonRow[];
}) {
  const t = useTranslations("teacher");
  const initial = useMemo(
    () =>
      [...lessons]
        .sort((a, b) => a.order - b.order)
        .map((r) => ({ ...r, youtubeVideoId: r.youtubeVideoId ?? null })),
    [lessons],
  );
  const [rows, setRows] = useState<LessonRow[]>(initial);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const schemaHelp =
    "Database setup for lessons is incomplete. Run the latest Supabase migrations, then retry.";
  const [form, setForm] = useState({
    title: "",
    content: "",
    youtubeUrl: "",
    assignmentTitle: "",
    assignmentInstructions: "",
    starterCode: "",
    expectedOutput: "",
    language: "javascript" as AssignmentEditorLanguage,
  });
  const [videoEditId, setVideoEditId] = useState<string | null>(null);
  const [videoDraft, setVideoDraft] = useState("");

  async function persistOrder(next: LessonRow[]) {
    setBusy(true);
    setError(null);
    const res = await fetch(`/api/courses/${courseId}/lessons/reorder`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderedIds: next.map((r) => r.id) }),
    });
    setBusy(false);
    if (!res.ok) {
      const payload = (await res.json().catch(() => null)) as
        | { error?: string; message?: string }
        | null;
      setError(
        payload?.error === "schema_not_ready"
          ? schemaHelp
          : t("lessonOrderSaveError"),
      );
    }
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

  function openVideoEdit(lesson: LessonRow) {
    setVideoEditId(lesson.id);
    setVideoDraft(
      lesson.youtubeVideoId ? youtubeWatchUrl(lesson.youtubeVideoId) : "",
    );
  }

  function closeVideoEdit() {
    setVideoEditId(null);
    setVideoDraft("");
  }

  async function saveLessonVideo(lessonId: string) {
    setBusy(true);
    setError(null);
    const res = await fetch(`/api/courses/${courseId}/lessons/${lessonId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        youtubeUrl: videoDraft.trim() === "" ? null : videoDraft,
      }),
    });
    setBusy(false);
    if (!res.ok) {
      const payload = (await res.json().catch(() => null)) as
        | { error?: string }
        | null;
      setError(
        payload?.error === "invalid_youtube_url"
          ? t("youtubeInvalid")
          : t("lessonVideoSaveError"),
      );
      return;
    }
    const updated = (await res.json()) as LessonRow;
    setRows((prev) =>
      prev.map((r) =>
        r.id === lessonId
          ? { ...r, ...updated, youtubeVideoId: updated.youtubeVideoId ?? null }
          : r,
      ),
    );
    closeVideoEdit();
  }

  async function clearLessonVideo(lessonId: string) {
    setBusy(true);
    setError(null);
    const res = await fetch(`/api/courses/${courseId}/lessons/${lessonId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ youtubeUrl: null }),
    });
    setBusy(false);
    if (!res.ok) {
      setError(t("lessonVideoSaveError"));
      return;
    }
    const updated = (await res.json()) as LessonRow;
    setRows((prev) =>
      prev.map((r) =>
        r.id === lessonId
          ? { ...r, ...updated, youtubeVideoId: updated.youtubeVideoId ?? null }
          : r,
      ),
    );
    closeVideoEdit();
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
        youtubeUrl: form.youtubeUrl.trim() || undefined,
        assignmentTitle: withAssignment ? form.assignmentTitle : undefined,
        assignmentInstructions: withAssignment
          ? form.assignmentInstructions
          : undefined,
        starterCode: withAssignment ? form.starterCode : undefined,
        expectedOutput: withAssignment ? form.expectedOutput : undefined,
        language: withAssignment ? form.language : undefined,
      }),
    });
    setBusy(false);
    if (!res.ok) {
      const payload = (await res.json().catch(() => null)) as
        | { error?: string; message?: string }
        | null;
      if (payload?.error === "schema_not_ready") setError(schemaHelp);
      else if (payload?.error === "invalid_youtube_url")
        setError(t("youtubeInvalid"));
      else setError(t("lessonCreateError"));
      return;
    }
    const created = (await res.json()) as LessonRow;
    setRows((prev) =>
      [...prev, { ...created, youtubeVideoId: created.youtubeVideoId ?? null }].sort(
        (a, b) => a.order - b.order,
      ),
    );
    setForm({
      title: "",
      content: "",
      youtubeUrl: "",
      assignmentTitle: "",
      assignmentInstructions: "",
      starterCode: "",
      expectedOutput: "",
      language: "javascript",
    });
  }

  return (
    <div className="space-y-5">
      <div className="rounded-lg border border-[#e0e0e0] p-4">
        <h3 className="text-sm font-bold uppercase tracking-wide text-[#6a6f73]">
          {t("lessonCreateTitle")}
        </h3>
        <div className="mt-3 grid gap-3">
          <input
            className="rounded-md border border-[#d1d5db] px-3 py-2 text-sm"
            value={form.title}
            onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
            placeholder={t("lessonTitlePlaceholder")}
          />
          <textarea
            className="min-h-[100px] rounded-md border border-[#d1d5db] px-3 py-2 text-sm"
            value={form.content}
            onChange={(e) => setForm((p) => ({ ...p, content: e.target.value }))}
            placeholder={t("lessonContentPlaceholder")}
          />
          <input
            className="rounded-md border border-[#d1d5db] px-3 py-2 text-sm"
            value={form.youtubeUrl}
            onChange={(e) =>
              setForm((p) => ({ ...p, youtubeUrl: e.target.value }))
            }
            placeholder={t("youtubeUrlPlaceholder")}
          />
          <input
            className="rounded-md border border-[#d1d5db] px-3 py-2 text-sm"
            value={form.assignmentTitle}
            onChange={(e) =>
              setForm((p) => ({ ...p, assignmentTitle: e.target.value }))
            }
            placeholder={t("lessonCodingTitlePlaceholder")}
          />
          <textarea
            className="min-h-[80px] rounded-md border border-[#d1d5db] px-3 py-2 text-sm"
            value={form.assignmentInstructions}
            onChange={(e) =>
              setForm((p) => ({ ...p, assignmentInstructions: e.target.value }))
            }
            placeholder={t("lessonCodingInstructionsPlaceholder")}
          />
          <textarea
            className="min-h-[80px] rounded-md border border-[#d1d5db] px-3 py-2 font-mono text-sm"
            value={form.starterCode}
            onChange={(e) =>
              setForm((p) => ({ ...p, starterCode: e.target.value }))
            }
            placeholder={t("lessonStarterPlaceholder")}
          />
          <label className="grid gap-1 text-sm text-[#1c1d1f]">
            <span className="font-semibold">{t("lessonEditorLanguage")}</span>
            <select
              className="rounded-md border border-[#d1d5db] px-3 py-2 text-sm"
              value={form.language}
              onChange={(e) =>
                setForm((p) => ({
                  ...p,
                  language: e.target.value as AssignmentEditorLanguage,
                }))
              }
            >
              <option value="javascript">JavaScript</option>
              <option value="html">HTML</option>
              <option value="css">CSS</option>
            </select>
          </label>
          <textarea
            className="min-h-[80px] rounded-md border border-[#d1d5db] px-3 py-2 font-mono text-sm"
            value={form.expectedOutput}
            onChange={(e) =>
              setForm((p) => ({ ...p, expectedOutput: e.target.value }))
            }
            placeholder={t("lessonExpectedOutputPlaceholder")}
          />
          <button
            type="button"
            disabled={busy || form.title.trim().length < 2}
            onClick={() => void createLesson()}
            className="w-fit rounded-md bg-[#0056d2] px-4 py-2 text-sm font-semibold text-white hover:bg-[#00419e] disabled:opacity-60"
          >
            {t("lessonAddButton")}
          </button>
        </div>
      </div>

      <div className="divide-y divide-[#e0e0e0]">
        {rows.map((lesson, i) => (
          <div
            key={lesson.id}
            className="flex flex-wrap items-start justify-between gap-3 px-2 py-3"
          >
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-[#1c1d1f]">
                {i + 1}. {lesson.title}
              </p>
              <p className="text-xs text-[#6a6f73]">
                {lesson.assignmentId ? t("lessonRowCoding") : t("lessonRowReading")}
                {" · "}
                {lesson.youtubeVideoId
                  ? t("lessonRowVideoYes")
                  : t("lessonRowVideoNo")}
              </p>
              {videoEditId === lesson.id ? (
                <div className="mt-3 grid max-w-lg gap-2">
                  <input
                    className="rounded-md border border-[#d1d5db] px-3 py-2 text-sm"
                    value={videoDraft}
                    onChange={(e) => setVideoDraft(e.target.value)}
                    placeholder={t("youtubeUrlPlaceholder")}
                  />
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => void saveLessonVideo(lesson.id)}
                      className="rounded-md bg-[#0056d2] px-3 py-1.5 text-sm font-semibold text-white hover:bg-[#00419e] disabled:opacity-60"
                    >
                      {t("videoSave")}
                    </button>
                    {lesson.youtubeVideoId ? (
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => void clearLessonVideo(lesson.id)}
                        className="rounded-md border border-[#e0e0e0] px-3 py-1.5 text-sm font-semibold text-[#6a6f73] hover:bg-[#f5f7fa] disabled:opacity-60"
                      >
                        {t("videoRemove")}
                      </button>
                    ) : null}
                    <button
                      type="button"
                      disabled={busy}
                      onClick={closeVideoEdit}
                      className="text-sm font-semibold text-[#0056d2] hover:underline disabled:opacity-60"
                    >
                      {t("videoCancel")}
                    </button>
                  </div>
                </div>
              ) : null}
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                disabled={busy}
                onClick={() => openVideoEdit(lesson)}
                className="text-sm font-semibold text-[#0056d2] hover:underline disabled:opacity-60"
              >
                {lesson.youtubeVideoId ? t("videoEdit") : t("videoAttach")}
              </button>
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
                {t("lessonPreview")}
              </Link>
            </div>
          </div>
        ))}
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
