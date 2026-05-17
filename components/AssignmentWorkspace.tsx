"use client";

import dynamic from "next/dynamic";
import { useRouter } from "@/i18n/routing";
import { useLocale, useTranslations } from "next-intl";
import { useCallback, useEffect, useMemo, useState } from "react";
import { normalizeOutput } from "@/lib/normalizeOutput";
import {
  assignmentEditorFileName,
  type AssignmentEditorLanguage,
} from "@/lib/assignmentMode";

function MonacoEditorLoading() {
  const t = useTranslations("assignment");
  return (
    <div className="flex h-[55vh] min-h-[320px] max-h-[500px] items-center justify-center bg-[#f9fafb] text-sm text-[#6a6f73]">
      {t("editorLoading")}
    </div>
  );
}

/** Default @monaco-editor/react loader (CDN) avoids Turbopack/webpack worker issues from bundling `monaco-editor`. */
const Monaco = dynamic(() => import("@monaco-editor/react").then((m) => m.default), {
  ssr: false,
  loading: () => <MonacoEditorLoading />,
});

type Props = {
  assignmentId: string;
  starterCode: string;
  initialCode?: string;
  /** Last saved program output (from Result.stdout) so Natija matches the last grade. */
  initialStdout?: string | null;
  existingScore?: number | null;
  existingFeedback?: string | null;
  editorLanguage?: AssignmentEditorLanguage;
};

export function AssignmentWorkspace({
  assignmentId,
  starterCode,
  initialCode,
  initialStdout,
  existingScore,
  existingFeedback,
  editorLanguage = "javascript",
}: Props) {
  const t = useTranslations("assignment");
  const locale = useLocale();
  const router = useRouter();
  const fileName = assignmentEditorFileName(editorLanguage);
  const helperText =
    editorLanguage === "javascript"
      ? t("consoleHint")
      : t("markupHint");
  const [code, setCode] = useState(initialCode ?? starterCode);
  const [output, setOutput] = useState(
    () => normalizeOutput(initialStdout ?? ""),
  );
  const [busy, setBusy] = useState(false);
  const [latestFeedback, setLatestFeedback] = useState<string | null>(
    existingFeedback ?? null,
  );
  const [latestScore, setLatestScore] = useState<number | null>(
    existingScore ?? null,
  );
  /** Transient toast after Run or Submit (success / failure / errors). */
  const [actionToast, setActionToast] = useState<{
    variant: "success" | "error";
    message: string;
  } | null>(null);

  useEffect(() => {
    if (!actionToast) return;
    const id = window.setTimeout(() => setActionToast(null), 4000);
    return () => window.clearTimeout(id);
  }, [actionToast]);

  const options = useMemo(
    () => ({
      minimap: { enabled: false },
      fontSize: 14,
      wordWrap: "on" as const,
      scrollBeyondLastLine: false,
      automaticLayout: true,
      lineNumbersMinChars: 3,
    }),
    [],
  );

  const runLocal = useCallback(() => {
    if (editorLanguage !== "javascript") {
      setOutput(normalizeOutput(code));
      setActionToast({ variant: "success", message: t("runDone") });
      return;
    }
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
      setActionToast({ variant: "success", message: t("runDone") });
    } catch (e: unknown) {
      const err = e instanceof Error ? e.message : String(e);
      setOutput(logs.join("\n"));
      setActionToast({ variant: "error", message: err });
    }
  }, [code, editorLanguage, t]);

  const submit = useCallback(async () => {
    setBusy(true);
    try {
      const res = await fetch("/api/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assignmentId, code, locale }),
      });
      const data = (await res.json()) as {
        passed?: boolean;
        score?: number;
        error?: string;
        stdout?: string;
        feedback?: string | null;
      };
      if (!res.ok) {
        let message = t("submitError");
        if (data.error === "unauthorized") message = t("needLogin");
        else if (data.error === "forbidden") message = t("needEnroll");
        else if (data.error === "not_found") message = t("notFound");
        else if (data.error === "sequence_locked") message = t("sequenceLocked");
        else if (data.error === "grader_unavailable") message = t("graderUnavailable");
        setActionToast({ variant: "error", message });
        setBusy(false);
        return;
      }
      setOutput(data.stdout ?? "");
      setLatestFeedback(data.feedback ?? null);
      setLatestScore(data.score ?? null);
      if (data.passed) {
        setActionToast({
          variant: "success",
          message: t("submitted", { score: String(data.score ?? 0) }),
        });
      } else {
        const failMessage = data.feedback?.trim() || t("fail");
        setActionToast({ variant: "error", message: failMessage });
      }
      router.refresh();
    } catch {
      setActionToast({ variant: "error", message: t("submitError") });
    }
    setBusy(false);
  }, [assignmentId, code, locale, router, t]);

  return (
    <div className="relative grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
      {actionToast ? (
        <div
          className="pointer-events-none fixed right-4 z-[60] flex max-w-[min(100vw-2rem,22rem)] justify-end sm:right-6"
          style={{
            top: "calc(var(--site-header-offset, 5.5rem) + 0.5rem)",
          }}
          role="status"
          aria-live="polite"
        >
          <div
            className={`pointer-events-auto rounded-lg border px-4 py-3 text-sm font-semibold shadow-lg ${
              actionToast.variant === "success"
                ? "border-emerald-200 bg-emerald-50 text-emerald-900"
                : "border-amber-200 bg-amber-50 text-amber-950"
            }`}
          >
            {actionToast.message}
          </div>
        </div>
      ) : null}
      <section className="flex flex-col gap-3">
        <div className="overflow-hidden rounded-xl border border-[#dfe3e8] bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#eceff3] bg-[#f9fafb] px-4 py-2.5">
          <div className="min-w-0">
            <h2 className="text-base font-bold text-[#1c1d1f]">{t("editor")}</h2>
            <p className="text-xs text-[#6a6f73]">{helperText}</p>
          </div>
          <span className="max-w-full rounded-md border border-[#d8dee6] bg-white px-2.5 py-1 text-[11px] font-semibold text-[#4b5563]">
            {fileName}
          </span>
        </div>

        <div className="h-[55vh] min-h-[320px] max-h-[500px] w-full">
          <Monaco
            height="55vh"
            width="100%"
            language={editorLanguage}
            theme="vs-light"
            value={code}
            onChange={(v) => setCode(v ?? "")}
            options={options}
            path={fileName}
          />
        </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 rounded-xl border border-[#dfe3e8] bg-[#fbfcfe] px-4 py-3 shadow-sm">
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
            {busy ? t("submitting") : t("submit")}
          </button>
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <div className="rounded-xl border border-[#dfe3e8] bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-[#6a6f73]">
            {t("output")}
          </p>
          <pre className="mt-2 min-h-[320px] whitespace-pre-wrap rounded-md bg-[#07112a] p-3 text-sm text-emerald-100">
            {output || "—"}
          </pre>
        </div>

        {(latestFeedback !== null || latestScore !== null) && (
          <div className="rounded-xl border border-[#dfe3e8] bg-white p-4 text-sm shadow-sm">
            <p className="font-semibold text-[#1c1d1f]">{t("teacherFeedback")}</p>
            <p className="mt-1 whitespace-pre-wrap text-[#6a6f73]">
              {latestFeedback?.trim()
                ? `${latestFeedback}${latestScore != null ? ` (${latestScore})` : ""}`
                : latestScore != null
                  ? t("submitted", { score: String(latestScore) })
                  : "—"}
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
