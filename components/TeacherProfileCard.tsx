"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

type Props = {
  fullName: string;
  email: string;
  age: number | null;
  gender: string | null;
  profileImageUrl: string | null;
};

export default function TeacherProfileCard(props: Props) {
  const t = useTranslations("teacher");
  const tf = useTranslations("form");

  const initialNameParts = props.fullName.trim().split(/\s+/).filter(Boolean);
  const [firstName, setFirstName] = useState(initialNameParts[0] ?? "");
  const [lastName, setLastName] = useState(initialNameParts.slice(1).join(" "));
  const [age, setAge] = useState(props.age ? String(props.age) : "");
  const [gender, setGender] = useState(props.gender ?? "");
  const [profileImageUrl, setProfileImageUrl] = useState(props.profileImageUrl ?? "");
  const [newPassword, setNewPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  async function onUploadImage(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError(null);
    setSaved(false);

    const form = new FormData();
    form.append("file", file);
    const res = await fetch("/api/teacher/profile/image", {
      method: "POST",
      body: form,
    });
    setUploading(false);

    if (!res.ok) {
      setError(t("photoUploadError"));
      return;
    }
    const body = (await res.json()) as { url?: string };
    if (!body.url) {
      setError(t("photoUploadError"));
      return;
    }
    setProfileImageUrl(body.url);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setSaved(false);
    setError(null);

    const normalizedFullName = `${firstName.trim()} ${lastName.trim()}`.trim();
    const payload = {
      fullName: normalizedFullName,
      age: age.trim() === "" ? null : Number(age),
      gender: gender.trim() === "" ? null : gender,
      profileImageUrl: profileImageUrl.trim() === "" ? null : profileImageUrl.trim(),
      ...(newPassword.trim() ? { newPassword: newPassword.trim() } : {}),
    };

    const res = await fetch("/api/teacher/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    setBusy(false);
    if (res.status === 409) {
      setError(t("emailInUse"));
      return;
    }
    if (!res.ok) {
      setError(t("profileSaveError"));
      return;
    }

    setNewPassword("");
    setSaved(true);
  }

  const displayName = `${firstName.trim()} ${lastName.trim()}`.trim() || props.fullName;
  const photoFallback = displayName
    .split(" ")
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("")
    .slice(0, 2);

  return (
    <section className="rounded-xl border border-[#e0e0e0] bg-white p-6 shadow-sm">
      <h2 className="text-lg font-bold text-[#1c1d1f]">{t("profileTitle")}</h2>
      <p className="mt-1 text-sm text-[#6a6f73]">{t("profileSubtitle")}</p>

      <form onSubmit={(e) => void onSubmit(e)} className="mt-5 space-y-5">
        <div className="flex items-center gap-4">
          {profileImageUrl ? (
            <img
              src={profileImageUrl}
              alt={displayName}
              className="h-20 w-20 rounded-full border border-[#e0e0e0] object-cover"
            />
          ) : (
            <div className="flex h-20 w-20 items-center justify-center rounded-full border border-[#e0e0e0] bg-[#f5f7fa] text-xl font-semibold text-[#1c1d1f]">
              {photoFallback || "T"}
            </div>
          )}
          <div className="w-full">
            <label className="block text-sm font-semibold">{t("photoUrl")}</label>
            <input
              value={profileImageUrl}
              onChange={(e) => setProfileImageUrl(e.target.value)}
              placeholder="https://..."
              className="mt-1 w-full rounded-md border border-[#e0e0e0] px-3 py-2 text-sm"
            />
            <label className="mt-2 block text-sm font-semibold">{t("uploadPhoto")}</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => void onUploadImage(e)}
              className="mt-1 block w-full text-sm text-[#1c1d1f] file:mr-3 file:rounded-md file:border-0 file:bg-[#eef5ff] file:px-3 file:py-2 file:text-sm file:font-semibold file:text-[#0056d2] hover:file:bg-[#ddeaff]"
            />
            <p className="mt-1 text-xs text-[#6a6f73]">
              {uploading ? t("photoUploading") : t("photoUploadHint")}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className="block text-sm font-semibold">{t("firstName")}</label>
            <input
              required
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className="mt-1 w-full rounded-md border border-[#e0e0e0] px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold">{t("lastName")}</label>
            <input
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className="mt-1 w-full rounded-md border border-[#e0e0e0] px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold">{tf("email")}</label>
            <input
              type="email"
              value={props.email}
              readOnly
              disabled
              className="mt-1 w-full cursor-not-allowed rounded-md border border-[#e0e0e0] bg-[#f5f7fa] px-3 py-2 text-sm text-[#6a6f73]"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold">{tf("age")}</label>
            <input
              type="number"
              min={16}
              max={100}
              value={age}
              onChange={(e) => setAge(e.target.value)}
              className="mt-1 w-full rounded-md border border-[#e0e0e0] px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold">{tf("gender")}</label>
            <select
              value={gender}
              onChange={(e) => setGender(e.target.value)}
              className="mt-1 w-full rounded-md border border-[#e0e0e0] bg-white px-3 py-2 text-sm"
            >
              <option value="">{t("selectGender")}</option>
              <option value="male">{t("genderMale")}</option>
              <option value="female">{t("genderFemale")}</option>
              <option value="other">{t("genderOther")}</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold">{t("newPassword")}</label>
            <input
              type="password"
              minLength={6}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder={t("newPasswordPlaceholder")}
              className="mt-1 w-full rounded-md border border-[#e0e0e0] px-3 py-2 text-sm"
            />
          </div>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}
        {saved && <p className="text-sm text-emerald-700">{t("profileSaved")}</p>}

        <button
          type="submit"
          disabled={busy}
          className="rounded-md bg-[#0056d2] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#00419e] disabled:opacity-60"
        >
          {t("saveProfile")}
        </button>
      </form>
    </section>
  );
}
