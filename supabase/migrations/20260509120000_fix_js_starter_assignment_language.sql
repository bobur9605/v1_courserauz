-- Assignments whose starter is clearly JavaScript were sometimes stored as
-- language 'html' because expectedOutput looks like markup. That forced
-- index.html mode and compared the whole editor to a single-line expected output.

UPDATE "Assignment"
SET "language" = 'javascript'
WHERE COALESCE("language", 'javascript') IN ('html', 'css')
  AND (
    "starterCode" ~ '(^|\n)\s*(const|let|var)\s+[A-Za-z_$][\w$]*'
    OR "starterCode" ~ '(^|\n)\s*function\s+[A-Za-z_$][\w$]*\s*\('
    OR "starterCode" LIKE '%console.log(%'
    OR "starterCode" LIKE '%=>%'
  );
