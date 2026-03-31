const { execSync } = require("child_process");

const onVercel = process.env.VERCEL === "1";

if (onVercel) {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()) {
    console.error("\n[x] NEXT_PUBLIC_SUPABASE_URL is missing.\n");
    console.error(
      "    Set it in Vercel → Project → Settings → Environment Variables (Supabase Project URL).\n",
    );
    process.exit(1);
  }
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()) {
    console.error("\n[x] SUPABASE_SERVICE_ROLE_KEY is missing.\n");
    console.error(
      "    Supabase → Project Settings → API → service_role (server only, never expose to browser).\n",
    );
    process.exit(1);
  }
  if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim()) {
    console.error("\n[x] NEXT_PUBLIC_SUPABASE_ANON_KEY is missing.\n");
    console.error(
      "    Supabase → Project Settings → API → anon public key.\n",
    );
    process.exit(1);
  }
  if (!process.env.JWT_SECRET?.trim()) {
    console.error("\n[x] JWT_SECRET is missing.\n");
    process.exit(1);
  }
}

execSync("next build", {
  stdio: "inherit",
  env: process.env,
  shell: true,
});
