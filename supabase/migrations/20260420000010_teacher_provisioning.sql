-- Teacher provisioning support (temporary password + forced change).

ALTER TABLE "User"
  ADD COLUMN IF NOT EXISTS "mustChangePassword" BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE "User"
  ADD COLUMN IF NOT EXISTS "tempPasswordIssuedAt" TIMESTAMPTZ;

