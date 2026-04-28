import { NextResponse } from "next/server";

type MaybeSupabaseError = {
  code?: string;
  message?: string;
  details?: string;
  hint?: string;
} | null | undefined;

const SCHEMA_ERROR_CODES = new Set([
  "42P01", // undefined_table
  "42703", // undefined_column
  "42883", // undefined_function
  "23503", // foreign_key_violation caused by missing backfill/setup
]);

export function isSchemaNotReadyError(error: MaybeSupabaseError) {
  if (!error) return false;
  if (error.code && SCHEMA_ERROR_CODES.has(error.code)) return true;

  const text = `${error.message ?? ""} ${error.details ?? ""} ${error.hint ?? ""}`.toLowerCase();
  return (
    text.includes("could not find the table") ||
    text.includes("relation") && text.includes("does not exist") ||
    text.includes("column") && text.includes("does not exist")
  );
}

export function schemaNotReadyResponse(feature: string) {
  return NextResponse.json(
    {
      error: "schema_not_ready",
      message: `Database setup for ${feature} is incomplete. Run the latest Supabase migrations, then retry.`,
    },
    { status: 503 },
  );
}
