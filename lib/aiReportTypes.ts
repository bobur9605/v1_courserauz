import { z } from "zod";

export const aiReportSchema = z.object({
  comments: z.string().optional().default(""),
  issues: z.array(z.string()).optional().default([]),
  positives: z.array(z.string()).optional().default([]),
});

export type AiReport = z.infer<typeof aiReportSchema>;

export function parseAiReport(value: unknown): AiReport | null {
  if (value == null || typeof value !== "object") return null;
  const r = aiReportSchema.safeParse(value);
  return r.success ? r.data : null;
}
