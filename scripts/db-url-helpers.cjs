/** Shared helpers for DATABASE_URL / DIRECT_URL (normalize, vercel-build, postinstall). */

function isPostgresUrl(u) {
  return !!u && /^postgres(ql)?:\/\//i.test(String(u).trim());
}

/** Pooled / PgBouncer — migrate needs a direct (session) connection. */
function isLikelyPooledOrBouncer(u) {
  if (!u) return false;
  const lower = String(u).toLowerCase();
  return (
    lower.includes("pooler.supabase.com") ||
    lower.includes("pgbouncer=true") ||
    lower.includes("pgbouncer=1") ||
    /:6543(\/|\?|$)/.test(lower)
  );
}

module.exports = { isPostgresUrl, isLikelyPooledOrBouncer };
