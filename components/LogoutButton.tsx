"use client";

import { useRouter } from "@/i18n/routing";
import { useTranslations } from "next-intl";

type Props = {
  variant?: "default" | "coursera";
};

export function LogoutButton({ variant = "coursera" }: Props) {
  const t = useTranslations("nav");
  const router = useRouter();

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.replace("/");
    router.refresh();
  }

  if (variant === "coursera") {
    return (
      <button
        type="button"
        onClick={() => void logout()}
        className="text-sm font-bold text-[#0056d2] hover:underline"
      >
        {t("logout")}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={() => void logout()}
      className="text-sm font-semibold text-[#0056d2] hover:underline"
    >
      {t("logout")}
    </button>
  );
}
