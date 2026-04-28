"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";

type Props = {
  courseId: string;
  onUploaded?: () => void;
};

export function ResourceUploadForm({ courseId, onUploaded }: Props) {
  const t = useTranslations("teacher");
  const tf = useTranslations("form");
  const [title, setTitle] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const schemaHelp =
    "Database setup for resources is incomplete. Run the latest Supabase migrations, then retry.";

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    const input = (e.target as HTMLFormElement).elements.namedItem(
      "file",
    ) as HTMLInputElement;
    const file = input?.files?.[0];
    if (!file) {
      setMsg(t("pickFile"));
      return;
    }
    setBusy(true);
    const fd = new FormData();
    fd.set("file", file);
    if (title.trim()) fd.set("title", title.trim());
    const res = await fetch(`/api/courses/${courseId}/resources`, {
      method: "POST",
      body: fd,
    });
    setBusy(false);
    if (!res.ok) {
      const payload = (await res.json().catch(() => null)) as
        | { error?: string; message?: string }
        | null;
      setMsg(payload?.error === "schema_not_ready" ? schemaHelp : t("uploadFailed"));
      return;
    }
    setTitle("");
    input.value = "";
    setMsg(t("uploadOk"));
    onUploaded?.();
  }

  return (
    <form
      onSubmit={(e) => void onSubmit(e)}
      className="space-y-3 rounded-xl border border-[#e0e0e0] bg-white p-4 shadow-sm"
    >
      <h3 className="font-bold text-[#1c1d1f]">{t("uploadResource")}</h3>
      <div>
        <label className="block text-sm font-semibold text-[#1c1d1f]">
          {tf("resourceTitle")}
        </label>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={t("optionalTitle")}
          className="mt-1 w-full rounded-md border border-[#e0e0e0] px-3 py-2 text-sm"
        />
      </div>
      <div>
        <label className="block text-sm font-semibold text-[#1c1d1f]">
          {t("file")}
        </label>
        <input
          required
          name="file"
          type="file"
          className="mt-1 w-full text-sm"
        />
      </div>
      {msg && <p className="text-sm text-[#0056d2]">{msg}</p>}
      <button
        type="submit"
        disabled={busy}
        className="rounded-md bg-[#0056d2] px-4 py-2 text-sm font-semibold text-white hover:bg-[#00419e] disabled:opacity-60"
      >
        {t("upload")}
      </button>
    </form>
  );
}
