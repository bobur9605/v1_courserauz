"use client";

import { useTranslations } from "next-intl";
import { useCallback, useEffect, useState } from "react";

type Row = {
  id: string;
  title: string;
  mimeType: string;
  size: number;
  createdAt: string;
};

type Props = {
  courseId: string;
  canManage: boolean;
  onChanged?: () => void;
};

export function CourseResourcesList({
  courseId,
  canManage,
  onChanged,
}: Props) {
  const t = useTranslations("course");
  const [rows, setRows] = useState<Row[] | null>(null);
  const [err, setErr] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const load = useCallback(() => {
    void fetch(`/api/courses/${courseId}/resources`)
      .then((r) => {
        if (!r.ok) {
          return r.json().catch(() => null).then((payload) => {
            if (payload?.error === "schema_not_ready") {
              throw new Error(
                "Database setup for resources is incomplete. Run the latest Supabase migrations, then retry.",
              );
            }
            throw new Error("fail");
          });
        }
        return r.json() as Promise<Row[]>;
      })
      .then((data) => {
        setErr(false);
        setMessage(null);
        setRows(data);
      })
      .catch((error: unknown) => {
        setErr(!(error instanceof Error));
        setMessage(error instanceof Error ? error.message : null);
        setRows([]);
      });
  }, [courseId]);

  useEffect(() => {
    load();
  }, [load]);

  async function removeResource(id: string) {
    const res = await fetch(`/api/courses/${courseId}/resources/${id}`, {
      method: "DELETE",
    });
    if (!res.ok) return;
    load();
    onChanged?.();
  }

  if (err) return null;
  if (rows === null) {
    return (
      <p className="text-sm text-[#6a6f73]">{t("resourcesLoading")}</p>
    );
  }
  if (rows.length === 0 && !canManage) return null;

  return (
    <div className="rounded-xl border border-[#e0e0e0] bg-white p-6 shadow-sm">
      <h2 className="text-lg font-bold text-[#1c1d1f]">{t("resources")}</h2>
      {message ? (
        <p className="mt-2 text-sm text-red-600">{message}</p>
      ) : null}
      {rows.length === 0 ? (
        <p className="mt-2 text-sm text-[#6a6f73]">{t("noResources")}</p>
      ) : (
      <ul className="mt-4 divide-y divide-[#e0e0e0]">
        {rows.map((r) => (
          <li
            key={r.id}
            className="flex flex-wrap items-center justify-between gap-2 py-3 first:pt-0 last:pb-0"
          >
            <span className="font-medium text-[#1c1d1f]">{r.title}</span>
            <div className="flex items-center gap-2">
              <a
                href={`/api/courses/${courseId}/resources/${r.id}/file`}
                className="text-sm font-semibold text-[#0056d2] hover:underline"
              >
                {t("download")}
              </a>
              {canManage && (
                <button
                  type="button"
                  onClick={() => void removeResource(r.id)}
                  className="text-sm font-semibold text-red-600 hover:underline"
                >
                  {t("deleteResource")}
                </button>
              )}
            </div>
          </li>
        ))}
      </ul>
      )}
    </div>
  );
}
