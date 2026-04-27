"use client";

import { Link, useRouter } from "@/i18n/routing";
import { useTranslations } from "next-intl";
import { useParams } from "next/navigation";
import { useState } from "react";

export default function TeacherNewAssignmentPage() {
  const t = useTranslations("teacher");
  const tf = useTranslations("form");
  const router = useRouter();
  const params = useParams();
  const courseId = String(params.courseId ?? "");
  const [title, setTitle] = useState("");
  const [instructions, setInstructions] = useState("");
  const [language, setLanguage] = useState("javascript");
  const [starterCode, setStarterCode] = useState("// your code\n");
  const [expectedOutput, setExpectedOutput] = useState("");
  const [error, setError] = useState(false);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(false);
    const res = await fetch("/api/assignments/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        courseId,
        title,
        instructions,
        language,
        starterCode,
        expectedOutput,
      }),
    });
    setBusy(false);
    if (!res.ok) {
      setError(true);
      return;
    }
    const a = (await res.json()) as { id: string; courseId: string };
    router.replace(`/courses/${a.courseId}/assignment/${a.id}`);
    router.refresh();
  }

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div>
        <Link
          href={`/teacher/courses/${courseId}`}
          className="text-sm font-semibold text-[#0056d2] hover:underline"
        >
          ← {t("backToCourse")}
        </Link>
        <h1 className="mt-3 text-2xl font-bold text-[#1c1d1f]">{t("newAssignment")}</h1>
      </div>
      <form
        onSubmit={(e) => void onSubmit(e)}
        className="space-y-4 rounded-xl border border-[#e0e0e0] bg-white p-6 shadow-sm"
      >
        <div>
          <label className="block text-sm font-semibold">{tf("assignmentTitle")}</label>
          <input
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="mt-1 w-full rounded-md border border-[#e0e0e0] px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold">{tf("instructions")}</label>
          <textarea
            rows={3}
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
            className="mt-1 w-full rounded-md border border-[#e0e0e0] px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold">{tf("assignmentLanguage")}</label>
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="mt-1 w-full rounded-md border border-[#e0e0e0] px-3 py-2 text-sm"
          >
            <option value="javascript">JavaScript</option>
            <option value="html">HTML</option>
            <option value="css">CSS</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-semibold">{tf("starterCode")}</label>
          <textarea
            rows={5}
            value={starterCode}
            onChange={(e) => setStarterCode(e.target.value)}
            className="mt-1 w-full rounded-md border border-[#e0e0e0] px-3 py-2 font-mono text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold">{tf("expectedOutput")}</label>
          <input
            required
            value={expectedOutput}
            onChange={(e) => setExpectedOutput(e.target.value)}
            className="mt-1 w-full rounded-md border border-[#e0e0e0] px-3 py-2 text-sm"
          />
        </div>
        {error && (
          <p className="text-sm text-red-600">Forbidden or invalid data.</p>
        )}
        <button
          type="submit"
          disabled={busy || !courseId}
          className="w-full rounded-md bg-[#0056d2] py-3 text-sm font-semibold text-white hover:bg-[#00419e] disabled:opacity-60"
        >
          {tf("create")}
        </button>
      </form>
    </div>
  );
}
