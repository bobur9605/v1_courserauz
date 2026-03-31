const { execSync } = require("child_process");
const { isLikelyPooledOrBouncer, isPostgresUrl } = require("./db-url-helpers.cjs");

require("./normalize-database-url.cjs");
const onVercel = process.env.VERCEL === "1";
const runMigrationsEnv = (process.env.RUN_PRISMA_MIGRATIONS || "").toLowerCase();
const shouldRunMigrations = (() => {
  // On Vercel we always run migrations to guarantee schema exists at runtime.
  if (onVercel) return true;
  if (runMigrationsEnv === "1" || runMigrationsEnv === "true" || runMigrationsEnv === "yes") {
    return true;
  }
  return false;
})();

const url = process.env.DATABASE_URL?.trim();
if (!url || !/^postgres(ql)?:\/\//i.test(url)) {
  console.error(
    "\n[x] Prisma needs a Postgres connection string starting with postgresql:// or postgres://\n",
  );
  console.error("Fix in Vercel → Project → Settings → Environment Variables:\n");
  console.error(
    "  • Do NOT set DATABASE_URL to localhost — use your hosted DB URL only.\n",
  );
  console.error(
    "  • Easiest: add **Vercel Postgres** (Storage) — POSTGRES_URL is picked up automatically.\n",
  );
  console.error(
    "  • Or set DATABASE_URL to Neon / Supabase / etc. (cloud hostname, not 127.0.0.1).\n",
  );
  process.exit(1);
}

if (onVercel) {
  const lower = url.toLowerCase();
  if (
    lower.includes("localhost") ||
    lower.includes("127.0.0.1") ||
    lower.includes("@0.0.0.0:")
  ) {
    console.error(
      "\n[x] DATABASE_URL still points to this machine (localhost).\n",
    );
    console.error(
      "    Remove the wrong DATABASE_URL in Vercel, or connect Vercel Postgres so POSTGRES_URL exists.\n",
    );
    process.exit(1);
  }
}

if (onVercel && !process.env.JWT_SECRET?.trim()) {
  console.error("\n[x] JWT_SECRET is missing.\n");
  console.error(
    "    Set JWT_SECRET in Vercel → Project → Settings → Environment Variables.\n",
  );
  process.exit(1);
}

const pooled = isLikelyPooledOrBouncer(url);
const direct = process.env.DIRECT_URL?.trim();
if (shouldRunMigrations && pooled && (!direct || !isPostgresUrl(direct))) {
  console.error(
    "\n[x] DATABASE_URL uses a pooler / PgBouncer — migrations need a direct (non-pooled) connection.\n",
  );
  console.error(
    "    • Neon on Vercel: ensure DATABASE_URL_UNPOOLED or POSTGRES_URL_NON_POOLING is set (integration often adds it).\n",
  );
  console.error(
    "    • Supabase: Database → Connection string → **Direct connection** (port 5432) as DIRECT_URL in Vercel.\n",
  );
  process.exit(1);
}

if (shouldRunMigrations && !process.env.DIRECT_URL?.trim()) {
  console.error(
    "\n[x] DIRECT_URL is missing. It should match DATABASE_URL unless you use a pooler (then use Supabase direct URI).\n",
  );
  process.exit(1);
}

if (!shouldRunMigrations) {
  console.warn(
    "\n[build] Skipping `prisma migrate deploy` during build (local/non-Vercel build).\n",
  );
}

const buildCommand = shouldRunMigrations
  ? "prisma generate && prisma migrate deploy && next build"
  : "prisma generate && next build";

execSync(buildCommand, {
  stdio: "inherit",
  env: process.env,
  shell: true,
});
