import { z } from "zod";
import type { AssignmentEditorLanguage } from "./assignmentMode";
import type { AiReport } from "./aiReportTypes";

const gradeSchema = z.object({
  passed: z.boolean(),
  score: z.number().min(0).max(100),
  feedback: z.string(),
  comments: z.string().optional().default(""),
  issues: z.array(z.string()).optional().default([]),
  positives: z.array(z.string()).optional().default([]),
});

export type AiGradeResult = {
  passed: boolean;
  score: number;
  feedback: string;
  report: AiReport;
};

export type GradeSubmissionInput = {
  title: string;
  instructions: string;
  expectedOutput: string;
  language: AssignmentEditorLanguage;
  code: string;
  /** Program output or submitted markup after running. */
  studentOutput: string;
  runtimeError?: string;
  locale: "uz" | "en" | "ru";
};

const LOCALE_NAMES: Record<"uz" | "en" | "ru", string> = {
  uz: "Uzbek",
  en: "English",
  ru: "Russian",
};

const MAX_CODE_CHARS = 12_000;
const MAX_OUTPUT_CHARS = 8_000;

function truncate(s: string, max: number) {
  if (s.length <= max) return s;
  return `${s.slice(0, max)}\n…[truncated]`;
}

export function isAiGradingConfigured() {
  return Boolean(process.env.OPENAI_API_KEY?.trim());
}

export async function gradeSubmissionWithAi(
  input: GradeSubmissionInput,
): Promise<AiGradeResult> {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not configured");
  }

  const model = process.env.OPENAI_MODEL?.trim() || "gpt-4o-mini";
  const feedbackLanguage = LOCALE_NAMES[input.locale];

  const system = `You grade coding exercises for an online learning platform.
Return ONLY valid JSON with these keys:
- passed (boolean): true only when the work fully satisfies the instructions and matches the reference in meaning.
- score (integer 0-100)
- feedback (string): one or two short sentences for a toast notification (same language as below).
- comments (string): a clear paragraph explaining what you checked and how the student did (for the result panel).
- issues (array of strings): each item is one specific problem or missing requirement (red flags). Use [] if none.
- positives (array of strings): each item is one specific thing done well (green flags). If passed is true, include at least one item.

Write all human-readable strings in ${feedbackLanguage}.
For HTML/CSS, equivalent markup passes (attribute order, whitespace, harmless comments may differ).
For JavaScript, program output must match the reference unless instructions allow equivalents.
Do not paste the full reference solution. Be constructive.
If there is a runtime error, passed must be false, score near 0, issues should mention the error, positives may be [].`;

  const user = `Assignment title: ${input.title}
Editor language: ${input.language}

Instructions:
${input.instructions}

Reference solution (internal — do not quote verbatim to the student):
${truncate(input.expectedOutput, MAX_OUTPUT_CHARS)}

Student code:
${truncate(input.code, MAX_CODE_CHARS)}

Student output / submitted content:
${truncate(input.studentOutput, MAX_OUTPUT_CHARS)}
${input.runtimeError ? `\nRuntime error:\n${input.runtimeError}` : ""}`;

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      temperature: 0.2,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
    }),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(
      `OpenAI API error ${res.status}${detail ? `: ${detail.slice(0, 200)}` : ""}`,
    );
  }

  const payload = (await res.json()) as {
    choices?: Array<{ message?: { content?: string | null } }>;
  };
  const raw = payload.choices?.[0]?.message?.content;
  if (!raw) {
    throw new Error("Empty response from OpenAI");
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error("Invalid JSON from OpenAI");
  }

  const result = gradeSchema.safeParse(parsed);
  if (!result.success) {
    throw new Error("OpenAI response failed validation");
  }

  const d = result.data;
  const fb = d.feedback.trim();
  const cm = (d.comments ?? "").trim() || fb;
  const report: AiReport = {
    comments: cm,
    issues: (d.issues ?? []).map((s) => s.trim()).filter(Boolean).slice(0, 12),
    positives: (d.positives ?? []).map((s) => s.trim()).filter(Boolean).slice(0, 12),
  };

  return {
    passed: d.passed,
    score: Math.round(d.score),
    feedback: fb,
    report,
  };
}
