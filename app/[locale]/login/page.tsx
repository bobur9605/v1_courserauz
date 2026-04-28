"use client";

import { Link } from "@/i18n/routing";
import { useTranslations } from "next-intl";
import { useState } from "react";

export default function LoginPage() {
  const t = useTranslations("auth");
  const tnav = useTranslations("nav");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);
  const [busy, setBusy] = useState(false);

  function localePrefixFromPathname(pathname: string) {
    const m = pathname.match(/^\/(uz|en|ru)(\/|$)/);
    return m ? `/${m[1]}` : "";
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(false);
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    setBusy(false);
    if (!res.ok) {
      setError(true);
      return;
    }
    const json: unknown = await res.json().catch(() => null);
    const role = (json as { role?: unknown } | null)?.role;
    const prefix = localePrefixFromPathname(window.location.pathname);
    if (role === "SUPERADMIN") {
      window.location.assign(`${prefix}/admin`);
      return;
    }
    if (role === "TEACHER") {
      window.location.assign(`${prefix}/teacher`);
      return;
    }
    window.location.assign(`${prefix}/dashboard`);
  }

  return (
    <div className="mx-auto max-w-md rounded-2xl border border-[#e0e0e0] bg-white p-8 shadow-sm">
      <h1 className="text-2xl font-bold text-[#1c1d1f]">{t("loginTitle")}</h1>
      <form className="mt-6 space-y-4" onSubmit={(e) => void onSubmit(e)}>
        <div>
          <label className="block text-sm font-semibold text-[#1c1d1f]">
            {t("email")}
          </label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 w-full rounded-md border border-[#e0e0e0] px-3 py-2 text-sm outline-none ring-[#0056d2] focus:ring-2"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-[#1c1d1f]">
            {t("password")}
          </label>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 w-full rounded-md border border-[#e0e0e0] px-3 py-2 text-sm outline-none ring-[#0056d2] focus:ring-2"
          />
        </div>
        {error && (
          <p className="text-sm font-medium text-red-600" role="alert">
            {t("error")}
          </p>
        )}
        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-md bg-[#0056d2] py-3 text-sm font-semibold text-white hover:bg-[#00419e] disabled:opacity-60"
        >
          {t("submitLogin")}
        </button>
      </form>
      <p className="mt-4 text-center text-sm text-[#6a6f73]">
        {t("noAccount")}{" "}
        <Link href="/register" className="font-semibold text-[#0056d2] hover:underline">
          {tnav("register")}
        </Link>
      </p>
    </div>
  );
}
