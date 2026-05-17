import OpenAI from "openai";
import { z } from "zod";
import type { AssignmentEditorLanguage } from "./assignmentMode";

const gradeSchema = z.object({
  passed: z.boolean(),
  score: z.number().min(0).max(100),
  feedback: z.string(),
});

export type AiGradeResult = z.infer<typeof gradeSchema>;

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

  const client = new OpenAI({ apiKey });
  const model = process.env.OPENAI_MODEL?.trim() || "gpt-4o-mini";
  const feedbackLanguage = LOCALE_NAMES[input.locale];

  const system = `You grade coding exercises for an online learning platform.
Return ONLY valid JSON with keys: passed (boolean), score (integer 0-100), feedback (string).
Write feedback in ${feedbackLanguage}.
Pass only when the student's work fully satisfies the instructions and matches the reference solution in meaning.
For HTML/CSS, equivalent markup passes (attribute order, extra whitespace, or harmless comments may differ).
For JavaScript, the program output must match the reference unless instructions allow equivalent answers.
Do not reveal the full reference solution in feedback. Give short, constructive hints when failing.
If there is a runtime error, passed must be false and score should be 0 or very low.`;

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

  const completion = await client.chat.completions.create({
    model,
    temperature: 0.2,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
  });

  const raw = completion.choices[0]?.message?.content;
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

  return {
    passed: result.data.passed,
    score: Math.round(result.data.score),
    feedback: result.data.feedback.trim(),
  };
}
