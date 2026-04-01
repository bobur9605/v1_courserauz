export type AssignmentEditorLanguage = "javascript" | "html" | "css";

export function inferAssignmentLanguageFromCourseTitle(
  courseTitle: string,
): AssignmentEditorLanguage {
  const t = courseTitle.toLowerCase();
  if (t.includes("html")) return "html";
  if (t.includes("css")) return "css";
  return "javascript";
}
