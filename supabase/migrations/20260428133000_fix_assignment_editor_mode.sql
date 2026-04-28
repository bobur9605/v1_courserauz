-- Backfill legacy console-style assignments that were mislabeled as HTML/CSS.
-- These tasks still run through stdout comparison and need JavaScript mode.

UPDATE "Assignment"
SET "language" = 'javascript'
WHERE COALESCE("language", 'javascript') <> 'javascript'
  AND (
    "starterCode" ~ '(^|\\n)\\s*(const|let|var)\\s+[A-Za-z_$][A-Za-z0-9_$]*'
    OR "starterCode" ~ '(^|\\n)\\s*function\\s+[A-Za-z_$][A-Za-z0-9_$]*\\s*[(]'
    OR "starterCode" LIKE '%console.log(%'
    OR "starterCode" LIKE '%=>%'
  );
