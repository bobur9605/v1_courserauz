-- Structured AI grading output for the student "Natija" panel (flags + comments).
ALTER TABLE "Result"
  ADD COLUMN IF NOT EXISTS "aiReport" JSONB;
