"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/routing";
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

type EditFormState = {
  title: string;
  content: string;
  youtubeUrl: string;
  isPublished: boolean;
  assignmentTitle: string;
  assignmentInstructions: string;
  starterCode: string;
  expectedOutput: string;
  language: AssignmentEditorLanguage;
  clearCodingTask: boolean;
};

export function TeacherLessonsManager({
  courseId,
  lessons,
}: {
  courseId: string;
  lessons: LessonRow[];
}) {
  const t = useTranslations("teacher");
  const router = useRouter();
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
  const [editingLessonId, setEditingLessonId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<EditFormState | null>(null);

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

  function closeLessonEdit() {
    setEditingLessonId(null);
    setEditForm(null);
  }

  async function openLessonEdit(lessonId: string) {
    setError(null);
    setBusy(true);
    const res = await fetch(`/api/courses/${courseId}/lessons/${lessonId}`);
    setBusy(false);
    if (!res.ok) {
      setError(t("lessonEditLoadError"));
      return;
    }
    const data = (await res.json()) as {
      title: string;
      content: string | null;
      isPublished: boolean;
      youtubeVideoId: string | null;
      assignment: null | {
        title: string;
        instructions: string;
        starterCode: string;
        expectedOutput: string;
        language: string;
      };
    };
    closeVideoEdit();
    setEditingLessonId(lessonId);
    setEditForm({
      title: data.title,
      content: data.content ?? "",
      youtubeUrl: data.youtubeVideoId
        ? youtubeWatchUrl(data.youtubeVideoId)
        : "",
      isPublished: data.isPublished,
      assignmentTitle: data.assignment?.title ?? "",
      assignmentInstructions: data.assignment?.instructions ?? "",
      starterCode: data.assignment?.starterCode ?? "",
      expectedOutput: data.assignment?.expectedOutput ?? "",
      language: (data.assignment?.language as AssignmentEditorLanguage) ?? "javascript",
      clearCodingTask: false,
    });
  }

  async function saveLessonEdit(lessonId: string) {
    if (!editForm || editForm.title.trim().length < 2) return;
    setBusy(true);
    setError(null);
    const youtubeUrl =
      editForm.youtubeUrl.trim() === "" ? null : editForm.youtubeUrl.trim();
    const payload: Record<string, unknown> = {
      title: editForm.title.trim(),
      content: editForm.content,
      isPublished: editForm.isPublished,
      youtubeUrl,
    };
    if (editForm.clearCodingTask) {
      payload.clearCodingTask = true;
    } else {
      const withAssignment =
        editForm.assignmentTitle.trim().length > 0 ||
        editForm.starterCode.trim().length > 0 ||
        editForm.expectedOutput.trim().length > 0;
      if (withAssignment) {
        if (editForm.assignmentTitle.trim().length < 2) {
          setBusy(false);
          setError(t("lessonEditCodingTitleTooShort"));
          return;
        }
        payload.codingTask = {
          title: editForm.assignmentTitle.trim(),
          instructions: editForm.assignmentInstructions,
          starterCode: editForm.starterCode,
          expectedOutput: editForm.expectedOutput,
          language: editForm.language,
        };
      }
    }
    const res = await fetch(`/api/courses/${courseId}/lessons/${lessonId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    setBusy(false);
    if (!res.ok) {
      const payloadJson = (await res.json().catch(() => null)) as
        | { error?: string }
        | null;
      if (payloadJson?.error === "invalid_youtube_url") {
        setError(t("youtubeInvalid"));
      } else {
        setError(t("lessonUpdateError"));
      }
      return;
    }
    const updated = (await res.json()) as LessonRow;
    setRows((prev) =>
      [...prev.map((r) => (r.id === lessonId ? { ...r, ...updated, youtubeVideoId: updated.youtubeVideoId ?? null } : r))].sort(
        (a, b) => a.order - b.order,
      ),
    );
    closeLessonEdit();
    router.refresh();
  }

  async function deleteLesson(lessonId: string) {
    if (!window.confirm(t("lessonDeleteConfirm"))) return;
    setBusy(true);
    setError(null);
    const res = await fetch(`/api/courses/${courseId}/lessons/${lessonId}`, {
      method: "DELETE",
    });
    setBusy(false);
    if (!res.ok) {
      setError(t("lessonDeleteError"));
      return;
    }
    setRows((prev) => prev.filter((r) => r.id !== lessonId));
    if (editingLessonId === lessonId) closeLessonEdit();
    if (videoEditId === lessonId) closeVideoEdit();
    router.refresh();
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
              {editingLessonId === lesson.id && editForm ? (
                <div className="mt-4 w-full max-w-2xl space-y-3 rounded-lg border border-[#dfe3e8] bg-[#f9fafb] p-4">
                  <h4 className="text-xs font-bold uppercase tracking-wide text-[#6a6f73]">
                    {t("lessonEditTitle")}
                  </h4>
                  <input
                    className="w-full rounded-md border border-[#d1d5db] px-3 py-2 text-sm"
                    value={editForm.title}
                    onChange={(e) =>
                      setEditForm((p) => (p ? { ...p, title: e.target.value } : p))
                    }
                    placeholder={t("lessonTitlePlaceholder")}
                  />
                  <textarea
                    className="min-h-[100px] w-full rounded-md border border-[#d1d5db] px-3 py-2 text-sm"
                    value={editForm.content}
                    onChange={(e) =>
                      setEditForm((p) => (p ? { ...p, content: e.target.value } : p))
                    }
                    placeholder={t("lessonContentPlaceholder")}
                  />
                  <input
                    className="w-full rounded-md border border-[#d1d5db] px-3 py-2 text-sm"
                    value={editForm.youtubeUrl}
                    onChange={(e) =>
                      setEditForm((p) => (p ? { ...p, youtubeUrl: e.target.value } : p))
                    }
                    placeholder={t("youtubeUrlPlaceholder")}
                  />
                  <label className="flex cursor-pointer items-center gap-2 text-sm text-[#1c1d1f]">
                    <input
                      type="checkbox"
                      checked={editForm.isPublished}
                      onChange={(e) =>
                        setEditForm((p) =>
                          p ? { ...p, isPublished: e.target.checked } : p,
                        )
                      }
                      className="rounded border-[#d1d5db]"
                    />
                    {t("lessonPublishedLabel")}
                  </label>
                  {lesson.assignmentId ? (
                    <label className="flex cursor-pointer items-center gap-2 text-sm text-[#b45309]">
                      <input
                        type="checkbox"
                        checked={editForm.clearCodingTask}
                        onChange={(e) =>
                          setEditForm((p) =>
                            p ? { ...p, clearCodingTask: e.target.checked } : p,
                          )
                        }
                        className="rounded border-[#d1d5db]"
                      />
                      {t("lessonRemoveCodingTask")}
                    </label>
                  ) : null}
                  <div
                    className={
                      editForm.clearCodingTask ? "pointer-events-none opacity-50" : ""
                    }
                  >
                    <input
                      className="mb-2 w-full rounded-md border border-[#d1d5db] px-3 py-2 text-sm"
                      value={editForm.assignmentTitle}
                      onChange={(e) =>
                        setEditForm((p) =>
                          p ? { ...p, assignmentTitle: e.target.value } : p,
                        )
                      }
                      placeholder={t("lessonCodingTitlePlaceholder")}
                      disabled={editForm.clearCodingTask}
                    />
                    <textarea
                      className="mb-2 min-h-[80px] w-full rounded-md border border-[#d1d5db] px-3 py-2 text-sm"
                      value={editForm.assignmentInstructions}
                      onChange={(e) =>
                        setEditForm((p) =>
                          p ? { ...p, assignmentInstructions: e.target.value } : p,
                        )
                      }
                      placeholder={t("lessonCodingInstructionsPlaceholder")}
                      disabled={editForm.clearCodingTask}
                    />
                    <textarea
                      className="mb-2 min-h-[80px] w-full rounded-md border border-[#d1d5db] px-3 py-2 font-mono text-sm"
                      value={editForm.starterCode}
                      onChange={(e) =>
                        setEditForm((p) =>
                          p ? { ...p, starterCode: e.target.value } : p,
                        )
                      }
                      placeholder={t("lessonStarterPlaceholder")}
                      disabled={editForm.clearCodingTask}
                    />
                    <label className="mb-2 grid gap-1 text-sm text-[#1c1d1f]">
                      <span className="font-semibold">{t("lessonEditorLanguage")}</span>
                      <select
                        className="rounded-md border border-[#d1d5db] px-3 py-2 text-sm"
                        value={editForm.language}
                        onChange={(e) =>
                          setEditForm((p) =>
                            p
                              ? {
                                  ...p,
                                  language: e.target.value as AssignmentEditorLanguage,
                                }
                              : p,
                          )
                        }
                        disabled={editForm.clearCodingTask}
                      >
                        <option value="javascript">JavaScript</option>
                        <option value="html">HTML</option>
                        <option value="css">CSS</option>
                      </select>
                    </label>
                    <textarea
                      className="min-h-[80px] w-full rounded-md border border-[#d1d5db] px-3 py-2 font-mono text-sm"
                      value={editForm.expectedOutput}
                      onChange={(e) =>
                        setEditForm((p) =>
                          p ? { ...p, expectedOutput: e.target.value } : p,
                        )
                      }
                      placeholder={t("lessonExpectedOutputPlaceholder")}
                      disabled={editForm.clearCodingTask}
                    />
                  </div>
                  <div className="flex flex-wrap gap-2 pt-1">
                    <button
                      type="button"
                      disabled={busy || editForm.title.trim().length < 2}
                      onClick={() => void saveLessonEdit(lesson.id)}
                      className="rounded-md bg-[#0056d2] px-4 py-2 text-sm font-semibold text-white hover:bg-[#00419e] disabled:opacity-60"
                    >
                      {t("lessonSaveButton")}
                    </button>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={closeLessonEdit}
                      className="rounded-md border border-[#e0e0e0] px-4 py-2 text-sm font-semibold text-[#1c1d1f] hover:bg-white disabled:opacity-60"
                    >
                      {t("lessonCancelEdit")}
                    </button>
                  </div>
                </div>
              ) : null}
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                disabled={busy}
                onClick={() => {
                  closeLessonEdit();
                  openVideoEdit(lesson);
                }}
                className="text-sm font-semibold text-[#0056d2] hover:underline disabled:opacity-60"
              >
                {lesson.youtubeVideoId ? t("videoEdit") : t("videoAttach")}
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => {
                  closeVideoEdit();
                  void openLessonEdit(lesson.id);
                }}
                className="text-sm font-semibold text-[#0056d2] hover:underline disabled:opacity-60"
              >
                {t("lessonEditButton")}
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => void deleteLesson(lesson.id)}
                className="text-sm font-semibold text-red-600 hover:underline disabled:opacity-60"
              >
                {t("lessonDeleteButton")}
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
