-- Backfill lesson-linked assignments that were created before teachers could
-- choose the editor language in the lesson flow.
--
-- Prefer explicit code-shape signals first, then fall back to the course title
-- for older seed data that still has generic HTML/CSS starter snippets.

UPDATE "Assignment" a
SET "language" = CASE
  WHEN a."starterCode" ~* '<!doctype\\s+html|<html\\b|<head\\b|<body\\b|<([a-z][a-z0-9-]*)[^>]*>'
    OR a."expectedOutput" ~* '<!doctype\\s+html|<html\\b|<head\\b|<body\\b|<([a-z][a-z0-9-]*)[^>]*>'
    THEN 'html'
  WHEN a."starterCode" ~ '(^|\\n)\\s*[@.#]?[A-Za-z][A-Za-z0-9_:-]*(\\s+[@.#]?[A-Za-z][A-Za-z0-9_:-]*)*\\s*\\{'
    OR a."expectedOutput" ~ '(^|\\n)\\s*[@.#]?[A-Za-z][A-Za-z0-9_:-]*(\\s+[@.#]?[A-Za-z][A-Za-z0-9_:-]*)*\\s*\\{'
    OR a."starterCode" ~* '(^|\\n)\\s*(color|background|font|margin|padding|display|border)\\s*:'
    THEN 'css'
  WHEN c."title" ILIKE '%html%' THEN 'html'
  WHEN c."title" ILIKE '%css%' THEN 'css'
  ELSE a."language"
END
FROM "Course" c
WHERE c."id" = a."courseId"
  AND a."lessonId" IS NOT NULL
  AND COALESCE(a."language", 'javascript') = 'javascript'
  AND NOT (
    a."starterCode" ~ '(^|\\n)\\s*(const|let|var)\\s+[A-Za-z_$][A-Za-z0-9_$]*'
    OR a."starterCode" ~ '(^|\\n)\\s*function\\s+[A-Za-z_$][A-Za-z0-9_$]*\\s*\\('
    OR a."starterCode" LIKE '%console.log(%'
    OR a."starterCode" LIKE '%=>%'
    OR a."starterCode" ~ '(^|\\n)\\s*//'
  );
