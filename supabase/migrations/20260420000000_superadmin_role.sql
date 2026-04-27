-- Introduce SUPERADMIN role (rename from legacy ADMIN) and harden role values.

UPDATE "User"
SET "role" = 'SUPERADMIN'
WHERE "role" = 'ADMIN';

DO $$ BEGIN
  ALTER TABLE "User"
    ADD CONSTRAINT "User_role_allowed_check"
    CHECK ("role" IN ('STUDENT', 'TEACHER', 'SUPERADMIN'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

