const fs = require("fs");
const path = require("path");

/** Load `.env` for local `npm run build` (Vercel injects env vars itself). */
function loadDotEnv() {
  const envPath = path.join(process.cwd(), ".env");
  if (!fs.existsSync(envPath)) return;
  const text = fs.readFileSync(envPath, "utf8");
  for (const line of text.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let val = trimmed.slice(eq + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    if (process.env[key] === undefined) process.env[key] = val;
  }
}

loadDotEnv();

/**
 * Vercel Postgres / Neon often expose POSTGRES_URL or POSTGRES_PRISMA_URL.
 * Prisma expects DATABASE_URL=postgresql://... or postgres://...
 */
function normalize() {
  const current = process.env.DATABASE_URL?.trim();
  if (current && /^postgres(ql)?:\/\//i.test(current)) {
    return;
  }

  const candidates = [
    process.env.POSTGRES_PRISMA_URL,
    process.env.POSTGRES_URL,
    process.env.PRISMA_DATABASE_URL,
    process.env.NEON_DATABASE_URL,
  ];

  for (const c of candidates) {
    const v = c?.trim();
    if (v && /^postgres(ql)?:\/\//i.test(v)) {
      process.env.DATABASE_URL = v;
      return;
    }
  }
}

normalize();
