-- Make assignment/challenge behavior explicit and dynamic.

ALTER TABLE "Assignment"
  ADD COLUMN IF NOT EXISTS "language" TEXT NOT NULL DEFAULT 'javascript';

ALTER TABLE "Assignment"
  ADD COLUMN IF NOT EXISTS "graderType" TEXT NOT NULL DEFAULT 'stdout_exact';

ALTER TABLE "Assignment"
  ADD COLUMN IF NOT EXISTS "graderConfig" JSONB;

