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

/** True when the stored starter is a console/JS exercise (even on “HTML” courses). */
export function starterCodeIsJavaScriptTask(starterCode: string) {
  return matchesAnyPattern(starterCode, LEGACY_JS_TASK_PATTERNS);
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
  courseTitle = "",
) {
  return (
    resolveAssignmentEditorLanguage(
      language,
      starterCode,
      expectedOutput,
      courseTitle,
    ) === "javascript"
  );
}

/**
 * Resolves Monaco language + runner mode. HTML-titled courses use index.html so
 * learners write markup; explicit Assignment.language still overrides when set.
 */
export function resolveAssignmentEditorLanguage(
  language: AssignmentEditorLanguage | null | undefined,
  starterCode: string,
  expectedOutput = "",
  courseTitle = "",
): AssignmentEditorLanguage {
  if (language === "html" || language === "css") return language;
  if (language === "javascript") return "javascript";

  if (
    courseTitle.trim() &&
    inferAssignmentLanguageFromCourseTitle(courseTitle) === "html"
  ) {
    return "html";
  }

  if (starterCodeIsJavaScriptTask(starterCode)) return "javascript";

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
