"use client";

import dynamic from "next/dynamic";
import { useRouter } from "@/i18n/routing";
import { useTranslations } from "next-intl";
import { useCallback, useMemo, useState } from "react";

const Monaco = dynamic(() => import("@monaco-editor/react"), { ssr: false });

type Props = {
  assignmentId: string;
  starterCode: string;
  expectedOutput: string;
  initialCode?: string;
  existingScore?: number | null;
  existingPassed?: boolean;
  existingFeedback?: string | null;
};

export function AssignmentWorkspace({
  assignmentId,
  starterCode,
  expectedOutput,
  initialCode,
  existingScore,
  existingPassed,
  existingFeedback,
}: Props) {
  const t = useTranslations("assignment");
  const router = useRouter();
  const [code, setCode] = useState(initialCode ?? starterCode);
  const [output, setOutput] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [lastPass, setLastPass] = useState<boolean | null>(
    existingPassed ?? null,
  );

  const options = useMemo(
    () => ({
      minimap: { enabled: false },
      fontSize: 14,
      wordWrap: "off" as const,
      scrollBeyondLastLine: false,
      automaticLayout: true,
      lineNumbersMinChars: 3,
    }),
    [],
  );

  const runLocal = useCallback(() => {
    setMsg(null);
    const logs: string[] = [];
    const sandbox = {
      console: {
        log: (...args: unknown[]) =>
          logs.push(args.map((a) => String(a)).join(" ")),
      },
    };
    try {
      const fn = new Function(
        "console",
        `"use strict";\n${code}\n`,
      ) as (c: typeof sandbox.console) => void;
      fn(sandbox.console);
      const text = logs.join("\n").trim();
      setOutput(text);
      setLastPass(text.trim() === expectedOutput.trim());
    } catch (e: unknown) {
      const err = e instanceof Error ? e.message : String(e);
      setOutput(logs.join("\n"));
      setMsg(err);
      setLastPass(false);
    }
  }, [code, expectedOutput]);

  const submit = useCallback(async () => {
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch("/api/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assignmentId, code }),
      });
      const data = (await res.json()) as {
        passed?: boolean;
        score?: number;
        error?: string;
        stdout?: string;
        feedback?: string | null;
      };
      if (!res.ok) {
        if (data.error === "unauthorized") {
          setMsg(t("needLogin"));
        } else if (data.error === "forbidden") {
          setMsg(t("needEnroll"));
        } else if (data.error === "not_found") {
          setMsg(t("notFound"));
        } else {
          setMsg(t("submitError"));
        }
        setBusy(false);
        return;
      }
      setOutput(data.stdout ?? "");
      setLastPass(!!data.passed);
      setMsg(
        t("submitted", { score: String(data.score ?? 0) }) +
          (data.feedback ? ` — ${data.feedback}` : ""),
      );
      router.refresh();
    } catch {
      setMsg(t("submitError"));
    }
    setBusy(false);
  }, [assignmentId, code, router, t]);

  return (
    <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
      <section className="overflow-hidden rounded-xl border border-[#dfe3e8] bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-[#eceff3] bg-[#f9fafb] px-4 py-2.5">
          <div>
            <h2 className="text-base font-bold text-[#1c1d1f]">{t("editor")}</h2>
            <p className="text-xs text-[#6a6f73]">{t("consoleHint")}</p>
          </div>
          <span className="rounded-md border border-[#d8dee6] bg-white px-2.5 py-1 text-[11px] font-semibold text-[#4b5563]">
            main.js
          </span>
        </div>

        <div className="h-[500px]">
          <Monaco
            height="100%"
            defaultLanguage="javascript"
            theme="vs-light"
            value={code}
            onChange={(v) => setCode(v ?? "")}
            options={options}
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 border-t border-[#eceff3] bg-[#fbfcfe] px-4 py-3">
          <button
            type="button"
            onClick={runLocal}
            className="rounded-md bg-white px-4 py-2 text-sm font-semibold text-[#0056d2] ring-1 ring-[#0056d2] transition hover:bg-[#eef5ff]"
          >
            {t("run")}
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => void submit()}
            className="rounded-md bg-[#0056d2] px-4 py-2 text-sm font-semibold text-white shadow transition hover:bg-[#00419e] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {t("submit")}
          </button>
          {msg && (
            <p className="ml-auto text-sm font-medium text-[#0056d2]" role="status">
              {msg}
            </p>
          )}
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <div className="rounded-xl border border-[#dfe3e8] bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-[#6a6f73]">
            {t("expected")}
          </p>
          <pre className="mt-2 min-h-[92px] whitespace-pre-wrap rounded-md bg-[#f5f7fa] p-3 text-sm text-[#111827]">
            {expectedOutput}
          </pre>
        </div>

        <div className="rounded-xl border border-[#dfe3e8] bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-[#6a6f73]">
            {t("output")}
          </p>
          <pre className="mt-2 min-h-[220px] whitespace-pre-wrap rounded-md bg-[#07112a] p-3 text-sm text-emerald-100">
            {output || "—"}
          </pre>
        </div>

        {lastPass !== null && (
          <div
            className={`rounded-lg border px-4 py-3 text-sm font-semibold ${
              lastPass
                ? "border-emerald-200 bg-emerald-50 text-emerald-900"
                : "border-amber-200 bg-amber-50 text-amber-900"
            }`}
          >
            {lastPass ? t("pass") : t("fail")}
          </div>
        )}

        {(existingFeedback || existingScore !== undefined) && (
          <div className="rounded-xl border border-[#dfe3e8] bg-white p-4 text-sm shadow-sm">
            <p className="font-semibold text-[#1c1d1f]">{t("teacherFeedback")}</p>
            <p className="mt-1 text-[#6a6f73]">
              {existingFeedback || "—"}
              {existingScore != null ? ` (${existingScore})` : ""}
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
