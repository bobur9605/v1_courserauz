"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Link, useRouter } from "@/i18n/routing";
import { useTranslations } from "next-intl";

type AssignmentDto = {
  id: string;
  courseId: string;
  title: string;
  instructions: string;
  starterCode: string;
  expectedOutput: string;
  language?: "javascript" | "html" | "css";
};

export default function TeacherEditAssignmentPage() {
  const t = useTranslations("teacher");
  const tf = useTranslations("form");
  const router = useRouter();
  const params = useParams();
  const courseId = String(params.courseId ?? "");
  const assignmentId = String(params.assignmentId ?? "");

  const [loaded, setLoaded] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);

  const [title, setTitle] = useState("");
  const [instructions, setInstructions] = useState("");
  const [language, setLanguage] = useState<"javascript" | "html" | "css">(
    "javascript",
  );
  const [starterCode, setStarterCode] = useState("");
  const [expectedOutput, setExpectedOutput] = useState("");

  useEffect(() => {
    if (!assignmentId) return;
    void fetch(`/api/assignments/${assignmentId}`)
      .then((r) => r.json())
      .then((data: AssignmentDto) => {
        setTitle(data.title ?? "");
        setInstructions(data.instructions ?? "");
        setStarterCode(data.starterCode ?? "");
        setExpectedOutput(data.expectedOutput ?? "");
        setLanguage(data.language ?? "javascript");
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
  }, [assignmentId]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(false);
    const res = await fetch(`/api/assignments/${assignmentId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        instructions,
        starterCode,
        expectedOutput,
        language,
      }),
    });
    setBusy(false);
    if (!res.ok) {
      setError(true);
      return;
    }
    router.replace(`/teacher/courses/${courseId}`);
    router.refresh();
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <Link
          href={`/teacher/courses/${courseId}`}
          className="text-sm font-semibold text-[#0056d2] hover:underline"
        >
          ← {t("backToCourse")}
        </Link>
        <h1 className="mt-3 text-2xl font-bold text-[#1c1d1f]">Edit assignment</h1>
      </div>

      {!loaded ? (
        <p className="text-sm text-[#6a6f73]">Loading…</p>
      ) : (
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
              rows={4}
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              className="mt-1 w-full rounded-md border border-[#e0e0e0] px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold">{tf("assignmentLanguage")}</label>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value as typeof language)}
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
              rows={8}
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
          {error && <p className="text-sm text-red-600">Forbidden or invalid data.</p>}
          <button
            type="submit"
            disabled={busy || !assignmentId}
            className="w-full rounded-md bg-[#0056d2] py-3 text-sm font-semibold text-white hover:bg-[#00419e] disabled:opacity-60"
          >
            Save
          </button>
        </form>
      )}
    </div>
  );
}

