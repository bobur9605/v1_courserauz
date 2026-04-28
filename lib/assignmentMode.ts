export type AssignmentEditorLanguage = "javascript" | "html" | "css";

const LEGACY_JS_TASK_PATTERNS = [
  /\bconsole\.log\s*\(/,
  /(?:^|\n)\s*(?:const|let|var)\s+[A-Za-z_$][\w$]*/,
  /(?:^|\n)\s*function\s+[A-Za-z_$][\w$]*\s*\(/,
  /=>/,
  /(?:^|\n)\s*\/\/.+/,
] as const;

export function inferAssignmentLanguageFromCourseTitle(
  courseTitle: string,
): AssignmentEditorLanguage {
  const t = courseTitle.toLowerCase();
  if (t.includes("html")) return "html";
  if (t.includes("css")) return "css";
  return "javascript";
}

export function usesJavaScriptRunner(
  language: AssignmentEditorLanguage | null | undefined,
  starterCode: string,
) {
  if (!language || language === "javascript") return true;
  return LEGACY_JS_TASK_PATTERNS.some((pattern) => pattern.test(starterCode));
}

export function resolveAssignmentEditorLanguage(
  language: AssignmentEditorLanguage | null | undefined,
  starterCode: string,
): AssignmentEditorLanguage {
  return usesJavaScriptRunner(language, starterCode)
    ? "javascript"
    : (language ?? "javascript");
}

export function assignmentEditorFileName(language: AssignmentEditorLanguage) {
  if (language === "html") return "index.html";
  if (language === "css") return "styles.css";
  return "main.js";
}
