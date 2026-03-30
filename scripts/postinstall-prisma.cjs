const { execSync } = require("child_process");
require("./normalize-database-url.cjs");

const url = process.env.DATABASE_URL?.trim();
if (!url || !/^postgres(ql)?:\/\//i.test(url)) {
  console.warn(
    "[prisma] Skipping postinstall `prisma generate` (no valid postgres URL yet).",
  );
  console.warn(
    "[prisma] Set DATABASE_URL or connect Vercel Postgres (POSTGRES_URL).",
  );
  process.exit(0);
}

if (!process.env.DIRECT_URL?.trim()) {
  console.warn(
    "[prisma] Skipping postinstall `prisma generate`: DIRECT_URL is missing.",
  );
  console.warn(
    "[prisma] With Supabase pooler (6543 / pooler host): set DIRECT_URL to the Dashboard → Direct connection URI (5432).",
  );
  console.warn(
    "[prisma] Or omit DATABASE_URL during install; Vercel build will run `prisma generate` with full env.",
  );
  process.exit(0);
}

execSync("prisma generate", { stdio: "inherit", env: process.env, shell: true });
