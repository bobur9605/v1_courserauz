const { execSync } = require("child_process");
require("./normalize-database-url.cjs");

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

if (process.env.VERCEL === "1") {
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

execSync("prisma generate && prisma migrate deploy && next build", {
  stdio: "inherit",
  env: process.env,
  shell: true,
});
