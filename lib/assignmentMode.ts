export type AssignmentEditorLanguage = "javascript" | "html" | "css";

const LEGACY_JS_TASK_PATTERNS = [
  /\bconsole\.log\s*\(/,
  /(?:^|\n)\s*(?:const|let|var)\s+[A-Za-z_$][\w$]*/,
  /(?:^|\n)\s*function\s+[A-Za-z_$][\w$]*\s*\(/,
  /=>/,
] as const;

const HTML_TASK_PATTERNS = [
  /<!doctype\s+html/i,
  /<html\b/i,
  /<head\b/i,
  /<body\b/i,
  /<([a-z][a-z0-9-]*)[^>]*>/i,
] as const;

const CSS_TASK_PATTERNS = [
  /(?:^|\n)\s*[@.#]?[A-Za-z][A-Za-z0-9_:-]*(?:\s+[@.#]?[A-Za-z][A-Za-z0-9_:-]*)*\s*\{/,
  /(?:^|\n)\s*(?:color|background|font|margin|padding|display|border)\s*:/i,
] as const;

function matchesAnyPattern(text: string, patterns: readonly RegExp[]) {
  return patterns.some((pattern) => pattern.test(text));
}

export function inferAssignmentLanguageFromContent(
  starterCode: string,
  expectedOutput = "",
): AssignmentEditorLanguage | null {
  // Prefer JavaScript when the editor source clearly uses JS syntax. Otherwise
  // exercises that embed HTML/CSS inside JS strings are misclassified as HTML/CSS
  // and the runner compares the whole file to expected output instead of executing code.
  if (matchesAnyPattern(starterCode, LEGACY_JS_TASK_PATTERNS)) {
    return "javascript";
  }
  const combined = `${starterCode}\n${expectedOutput}`;
  if (matchesAnyPattern(combined, HTML_TASK_PATTERNS)) return "html";
  if (matchesAnyPattern(combined, CSS_TASK_PATTERNS)) return "css";
  return null;
}

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
  expectedOutput = "",
) {
  if (language === "html" || language === "css") return false;
  if (language === "javascript") return true;
  const inferredLanguage = inferAssignmentLanguageFromContent(
    starterCode,
    expectedOutput,
  );
  if (inferredLanguage === "html" || inferredLanguage === "css") return false;
  return true;
}

export function resolveAssignmentEditorLanguage(
  language: AssignmentEditorLanguage | null | undefined,
  starterCode: string,
  expectedOutput = "",
): AssignmentEditorLanguage {
  if (language === "html" || language === "css") return language;
  if (language === "javascript") return "javascript";
  const inferredLanguage = inferAssignmentLanguageFromContent(
    starterCode,
    expectedOutput,
  );
  if (inferredLanguage) return inferredLanguage;
  return "javascript";
}

export function assignmentEditorFileName(language: AssignmentEditorLanguage) {
  if (language === "html") return "index.html";
  if (language === "css") return "styles.css";
  return "main.js";
}
