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

execSync("prisma generate", { stdio: "inherit", env: process.env, shell: true });
