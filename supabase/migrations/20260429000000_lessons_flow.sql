-- Add first-class lessons and connect assignments to lessons.

CREATE TABLE IF NOT EXISTS "Lesson" (
    "id" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "assignmentId" TEXT,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL DEFAULT '',
    "order" INTEGER NOT NULL DEFAULT 0,
    "isPublished" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Lesson_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "LessonCompletion" (
    "id" TEXT NOT NULL,
    "lessonId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "LessonCompletion_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "Assignment"
  ADD COLUMN IF NOT EXISTS "lessonId" TEXT;

DO $$ BEGIN
 ALTER TABLE "Lesson" ADD CONSTRAINT "Lesson_courseId_fkey"
   FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
 ALTER TABLE "Lesson" ADD CONSTRAINT "Lesson_assignmentId_fkey"
   FOREIGN KEY ("assignmentId") REFERENCES "Assignment"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
 ALTER TABLE "LessonCompletion" ADD CONSTRAINT "LessonCompletion_lessonId_fkey"
   FOREIGN KEY ("lessonId") REFERENCES "Lesson"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
 ALTER TABLE "LessonCompletion" ADD CONSTRAINT "LessonCompletion_studentId_fkey"
   FOREIGN KEY ("studentId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
 ALTER TABLE "Assignment" ADD CONSTRAINT "Assignment_lessonId_fkey"
   FOREIGN KEY ("lessonId") REFERENCES "Lesson"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

CREATE UNIQUE INDEX IF NOT EXISTS "Lesson_courseId_order_key" ON "Lesson"("courseId", "order");
CREATE UNIQUE INDEX IF NOT EXISTS "Lesson_assignmentId_key" ON "Lesson"("assignmentId") WHERE "assignmentId" IS NOT NULL;
CREATE INDEX IF NOT EXISTS "Lesson_courseId_isPublished_idx" ON "Lesson"("courseId", "isPublished");
CREATE UNIQUE INDEX IF NOT EXISTS "LessonCompletion_lessonId_studentId_key" ON "LessonCompletion"("lessonId", "studentId");

-- Backfill lessons from existing assignments.
INSERT INTO "Lesson" (
  "id",
  "courseId",
  "assignmentId",
  "title",
  "content",
  "order",
  "isPublished",
  "createdAt",
  "updatedAt"
)
SELECT
  'les_' || substr(md5(a."id"), 1, 21),
  a."courseId",
  a."id",
  a."title",
  a."instructions",
  a."order",
  true,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
FROM "Assignment" a
LEFT JOIN "Lesson" l ON l."assignmentId" = a."id"
WHERE l."id" IS NULL;

UPDATE "Assignment" a
SET "lessonId" = l."id"
FROM "Lesson" l
WHERE l."assignmentId" = a."id"
  AND (a."lessonId" IS NULL OR a."lessonId" <> l."id");
