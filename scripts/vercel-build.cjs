const { execSync } = require("child_process");
require("./normalize-database-url.cjs");

const url = process.env.DATABASE_URL?.trim();
if (!url || !/^postgres(ql)?:\/\//i.test(url)) {
  console.error(
    "\n[x] Prisma needs a Postgres connection string starting with postgresql:// or postgres://\n",
  );
  console.error("Fix in Vercel → Project → Settings → Environment Variables:\n");
  console.error(
    "  • Set DATABASE_URL to your Postgres URL, OR\n",
  );
  console.error(
    "  • Add Vercel Postgres / Neon so POSTGRES_URL or POSTGRES_PRISMA_URL exists\n",
  );
  console.error(
    "    (this build script copies those into DATABASE_URL automatically).\n",
  );
  process.exit(1);
}

execSync("prisma generate && prisma migrate deploy && next build", {
  stdio: "inherit",
  env: process.env,
  shell: true,
});
