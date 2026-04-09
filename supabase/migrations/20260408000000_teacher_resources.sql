-- Course instructor + downloadable resources

ALTER TABLE "Course" ADD COLUMN IF NOT EXISTS "teacherId" TEXT;

DO $$ BEGIN
 ALTER TABLE "Course" ADD CONSTRAINT "Course_teacherId_fkey"
   FOREIGN KEY ("teacherId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

CREATE TABLE IF NOT EXISTS "CourseResource" (
    "id" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "storagePath" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL DEFAULT 'application/octet-stream',
    "size" INTEGER NOT NULL DEFAULT 0,
    "uploadedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CourseResource_pkey" PRIMARY KEY ("id")
);

DO $$ BEGIN
 ALTER TABLE "CourseResource" ADD CONSTRAINT "CourseResource_courseId_fkey"
   FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
 ALTER TABLE "CourseResource" ADD CONSTRAINT "CourseResource_uploadedBy_fkey"
   FOREIGN KEY ("uploadedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

CREATE INDEX IF NOT EXISTS "CourseResource_courseId_idx" ON "CourseResource"("courseId");

-- Private bucket; app uses service role for upload/download
DO $$
BEGIN
  INSERT INTO storage.buckets (id, name, public)
  VALUES ('course-resources', 'course-resources', false);
EXCEPTION WHEN unique_violation THEN NULL;
END $$;

UPDATE "Course"
SET "teacherId" = (
  SELECT "id" FROM "User" WHERE "role" = 'TEACHER' ORDER BY "createdAt" ASC LIMIT 1
)
WHERE "teacherId" IS NULL
  AND EXISTS (SELECT 1 FROM "User" WHERE "role" = 'TEACHER');
