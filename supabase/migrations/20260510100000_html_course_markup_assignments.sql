-- HTML-titled courses: index.html editor + markup starters (not console.log).
-- Aligns DB with course-based editor resolution in lib/assignmentMode.ts

UPDATE "Assignment" a
SET "language" = 'html'
FROM "Course" c
WHERE c.id = a."courseId"
  AND c."title" ILIKE '%html%';

UPDATE "Assignment" a
SET
  "instructions" = 'In index.html, the file must contain only this single line (no doctype, no other tags): <html lang="en">',
  "starterCode" = '<html lang="en">' || chr(10)
FROM "Course" c
WHERE c.id = a."courseId"
  AND c."title" ILIKE '%html%'
  AND a."title" = 'HTML Document Skeleton';

UPDATE "Assignment" a
SET
  "instructions" = 'In index.html, type exactly one line: the semantic tags header, main, section, article, footer joined by '' > '' in that order.',
  "starterCode" = '<!-- Tags: header, main, section, article, footer — one line, separated by " > " -->' || chr(10)
FROM "Course" c
WHERE c.id = a."courseId"
  AND c."title" ILIKE '%html%'
  AND a."title" = 'Semantic Tags Order';

UPDATE "Assignment" a
SET
  "instructions" = 'In index.html, the file must contain only one character: the digit for how many field types are listed in the comment below.',
  "starterCode" = '<!-- text, email, password, checkbox, submit -->' || chr(10)
FROM "Course" c
WHERE c.id = a."courseId"
  AND c."title" ILIKE '%html%'
  AND a."title" = 'Form Fields Count';

UPDATE "Assignment" a
SET
  "instructions" = 'In index.html, add one line: a single <img /> with src="hero.png" and alt="Hero banner" exactly as shown in the expected output.',
  "starterCode" = '<!-- src: hero.png — alt: Hero banner -->' || chr(10)
FROM "Course" c
WHERE c.id = a."courseId"
  AND c."title" ILIKE '%html%'
  AND a."title" = 'Accessible Image Snippet';
