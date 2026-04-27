"use client";

import { useState } from "react";
import { Link } from "@/i18n/routing";
import { useTranslations } from "next-intl";

type CreatedTeacher = {
  id: string;
  email: string;
  fullName: string;
  tempPassword: string;
};

export default function NewTeacherPage() {
  const t = useTranslations("admin");
  const tf = useTranslations("form");

  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState<CreatedTeacher | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setCreated(null);

    const res = await fetch("/api/superadmin/teachers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, fullName }),
    });
    setBusy(false);

    if (res.status === 409) {
      setError(t("teacherEmailInUse"));
      return;
    }
    if (!res.ok) {
      setError(t("teacherCreateFailed"));
      return;
    }
    setCreated((await res.json()) as CreatedTeacher);
  }

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div>
        <Link href="/admin" className="text-sm font-semibold text-[#0056d2] hover:underline">
          ← {t("title")}
        </Link>
        <h1 className="mt-3 text-2xl font-bold text-[#1c1d1f]">{t("newTeacher")}</h1>
        <p className="mt-2 text-sm text-[#6a6f73]">{t("newTeacherHint")}</p>
      </div>

      <form
        onSubmit={(e) => void onSubmit(e)}
        className="space-y-4 rounded-xl border border-[#e0e0e0] bg-white p-6 shadow-sm"
      >
        <div>
          <label className="block text-sm font-semibold">{tf("fullName")}</label>
          <input
            required
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="mt-1 w-full rounded-md border border-[#e0e0e0] px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold">{tf("email")}</label>
          <input
            required
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 w-full rounded-md border border-[#e0e0e0] px-3 py-2 text-sm"
          />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-md bg-[#0056d2] py-3 text-sm font-semibold text-white hover:bg-[#00419e] disabled:opacity-60"
        >
          {t("createTeacher")}
        </button>
      </form>

      {created && (
        <section className="rounded-xl border border-emerald-200 bg-emerald-50 p-6">
          <h2 className="text-sm font-bold text-emerald-900">{t("teacherCreated")}</h2>
          <p className="mt-2 text-sm text-emerald-900">
            <span className="font-semibold">{created.fullName}</span> — {created.email}
          </p>
          <div className="mt-4 rounded-md border border-emerald-200 bg-white p-4">
            <p className="text-xs font-semibold uppercase text-emerald-800">
              {t("temporaryPassword")}
            </p>
            <p className="mt-1 font-mono text-sm text-[#1c1d1f]">{created.tempPassword}</p>
            <p className="mt-2 text-xs text-emerald-800">{t("temporaryPasswordHint")}</p>
          </div>
        </section>
      )}
    </div>
  );
}

