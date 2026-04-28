-- Ensure there is always a SUPERADMIN account in the DB.
-- Uses pgcrypto bcrypt hashing inside Postgres.
--
-- IMPORTANT:
-- - This seeds a default password intended for initial bootstrap only.
-- - The app forces password change on first login via mustChangePassword=true.
-- - After first login, change the password immediately.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

INSERT INTO "User" ("id", "fullName", "email", "passwordHash", "role", "mustChangePassword")
SELECT
  gen_random_uuid()::text,
  'Demo Admin',
  'admin@wdedu.uz',
  crypt('demo1234', gen_salt('bf')),
  'SUPERADMIN',
  true
WHERE NOT EXISTS (
  SELECT 1 FROM "User" WHERE "email" = 'admin@wdedu.uz'
);

