-- Teacher profile fields shown in teacher workspace and admin panel.
ALTER TABLE "User"
  ADD COLUMN IF NOT EXISTS "age" INTEGER;

ALTER TABLE "User"
  ADD COLUMN IF NOT EXISTS "gender" TEXT;

ALTER TABLE "User"
  ADD COLUMN IF NOT EXISTS "profileImageUrl" TEXT;
