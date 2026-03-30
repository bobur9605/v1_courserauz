"use client";

import { Link, useRouter } from "@/i18n/routing";
import { useTranslations } from "next-intl";
import { useState } from "react";

export default function LoginPage() {
  const t = useTranslations("auth");
  const tnav = useTranslations("nav");
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);
  const [busy, setBusy] = useState(false);

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
    const data = (await res.json()) as { role?: string };
    router.replace(data.role === "ADMIN" ? "/admin" : "/dashboard");
    router.refresh();
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
