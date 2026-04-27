"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/routing";

export default function ForceChangePasswordPage() {
  const t = useTranslations("auth");
  const router = useRouter();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(false);
    const res = await fetch("/api/auth/change-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPassword, newPassword }),
    });
    setBusy(false);
    if (!res.ok) {
      setError(true);
      return;
    }
    router.replace("/dashboard");
    router.refresh();
  }

  return (
    <div className="mx-auto max-w-md space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#1c1d1f]">{t("changePasswordTitle")}</h1>
        <p className="mt-2 text-sm text-[#6a6f73]">{t("changePasswordHint")}</p>
      </div>
      <form
        onSubmit={(e) => void onSubmit(e)}
        className="space-y-4 rounded-xl border border-[#e0e0e0] bg-white p-6 shadow-sm"
      >
        <div>
          <label className="block text-sm font-semibold">{t("password")}</label>
          <input
            required
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            className="mt-1 w-full rounded-md border border-[#e0e0e0] px-3 py-2 text-sm"
            placeholder={t("currentPasswordPlaceholder")}
          />
        </div>
        <div>
          <label className="block text-sm font-semibold">{t("newPasswordLabel")}</label>
          <input
            required
            type="password"
            minLength={6}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="mt-1 w-full rounded-md border border-[#e0e0e0] px-3 py-2 text-sm"
            placeholder={t("newPasswordPlaceholder")}
          />
        </div>
        {error && <p className="text-sm text-red-600">{t("changePasswordError")}</p>}
        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-md bg-[#0056d2] py-3 text-sm font-semibold text-white hover:bg-[#00419e] disabled:opacity-60"
        >
          {t("saveNewPassword")}
        </button>
      </form>
    </div>
  );
}

