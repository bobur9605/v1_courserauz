"use client";

import { Link, useRouter } from "@/i18n/routing";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

type TeacherOpt = { id: string; fullName: string; email: string };

export default function NewCoursePage() {
  const t = useTranslations("admin");
  const tf = useTranslations("form");
  const tc = useTranslations("courses");
  const router = useRouter();
  const [teachers, setTeachers] = useState<TeacherOpt[]>([]);
  const [teacherId, setTeacherId] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [durationHours, setDurationHours] = useState("12");
  const [difficultyLevel, setDifficultyLevel] = useState("beginner");
  const [error, setError] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    void fetch("/api/teachers")
      .then((r) => r.json())
      .then((data: TeacherOpt[]) => {
        const list = Array.isArray(data) ? data : [];
        setTeachers(list);
        if (list[0]?.id) setTeacherId(list[0].id);
      });
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(false);
    const res = await fetch("/api/courses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        description,
        durationHours: Number(durationHours),
        difficultyLevel,
        teacherId,
      }),
    });
    setBusy(false);
    if (!res.ok) {
      setError(true);
      return;
    }
    const course = (await res.json()) as { id: string };
    router.replace(`/courses/${course.id}`);
    router.refresh();
  }

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div>
        <Link href="/admin" className="text-sm font-semibold text-[#0056d2] hover:underline">
          ← {t("title")}
        </Link>
        <h1 className="mt-3 text-2xl font-bold text-[#1c1d1f]">{t("newCourse")}</h1>
      </div>
      <form
        onSubmit={(e) => void onSubmit(e)}
        className="space-y-4 rounded-xl border border-[#e0e0e0] bg-white p-6 shadow-sm"
      >
        <div>
          <label className="block text-sm font-semibold">{tf("courseTitle")}</label>
          <input
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="mt-1 w-full rounded-md border border-[#e0e0e0] px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold">{tf("courseDesc")}</label>
          <textarea
            required
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="mt-1 w-full rounded-md border border-[#e0e0e0] px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold">{tf("duration")}</label>
          <input
            type="number"
            min={1}
            required
            value={durationHours}
            onChange={(e) => setDurationHours(e.target.value)}
            className="mt-1 w-full rounded-md border border-[#e0e0e0] px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold">{tf("difficulty")}</label>
          <select
            value={difficultyLevel}
            onChange={(e) => setDifficultyLevel(e.target.value)}
            className="mt-1 w-full rounded-md border border-[#e0e0e0] px-3 py-2 text-sm"
          >
            <option value="beginner">{tc("beginner")}</option>
            <option value="intermediate">{tc("intermediate")}</option>
            <option value="advanced">{tc("advanced")}</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-semibold">{tf("assignTeacher")}</label>
          <select
            required
            value={teacherId}
            onChange={(e) => setTeacherId(e.target.value)}
            className="mt-1 w-full rounded-md border border-[#e0e0e0] px-3 py-2 text-sm"
          >
            {teachers.map((u) => (
              <option key={u.id} value={u.id}>
                {u.fullName} ({u.email})
              </option>
            ))}
          </select>
          {teachers.length === 0 && (
            <p className="mt-1 text-xs text-amber-800">{t("noTeachers")}</p>
          )}
        </div>
        {error && (
          <p className="text-sm text-red-600">Forbidden or invalid data.</p>
        )}
        <button
          type="submit"
          disabled={busy || !teacherId}
          className="w-full rounded-md bg-[#0056d2] py-3 text-sm font-semibold text-white hover:bg-[#00419e] disabled:opacity-60"
        >
          {tf("create")}
        </button>
      </form>
    </div>
  );
}
