import { NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSession } from "@/lib/auth";
import { normalizeOutput, runStudentCode } from "@/lib/runner";
import { newId } from "@/lib/ids";
import { inferAssignmentLanguageFromCourseTitle } from "@/lib/assignmentMode";
import { bypassesAssignmentSequence } from "@/lib/assignmentGating";
import { studentMayAccessAssignmentOrder } from "@/lib/assignmentGatingServer";

const schema = z.object({
  assignmentId: z.string().min(1),
  code: z.string(),
  locale: z.enum(["uz", "en", "ru"]).optional(),
});

function mismatchFeedback(locale: "uz" | "en" | "ru", expected: string, got: string) {
  if (locale === "uz") {
    return `Kutilgan natija:\n${expected}\n\nSizning natijangiz:\n${got}`;
  }
  if (locale === "ru") {
    return `Ожидаемый результат:\n${expected}\n\nВаш результат:\n${got}`;
  }
  return `Expected output:\n${expected}\n\nYour output:\n${got}`;
}

function runtimeFeedback(locale: "uz" | "en" | "ru", error: string) {
  if (locale === "uz") return `Ishga tushirish xatosi:\n${error}`;
  if (locale === "ru") return `Ошибка выполнения:\n${error}`;
  return `Runtime error:\n${error}`;
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  try {
    const body = schema.parse(await req.json());
    const locale = body.locale ?? "en";
    const supabase = createAdminClient();
    const { data: assignment, error: aErr } = await supabase
      .from("Assignment")
      .select("id, expectedOutput, courseId, order")
      .eq("id", body.assignmentId)
      .maybeSingle();
    if (aErr || !assignment) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }
    if (
      !bypassesAssignmentSequence(session) &&
      !(await studentMayAccessAssignmentOrder(
        session.sub,
        assignment.courseId,
        assignment.order,
      ))
    ) {
      return NextResponse.json({ error: "sequence_locked" }, { status: 403 });
    }
    const { data: course } = await supabase
      .from("Course")
      .select("title")
      .eq("id", assignment.courseId)
      .maybeSingle();
    const language = inferAssignmentLanguageFromCourseTitle(course?.title ?? "");

    if (session.role === "STUDENT") {
      const { data: enrollment } = await supabase
        .from("Enrollment")
        .select("id")
        .eq("userId", session.sub)
        .eq("courseId", assignment.courseId)
        .maybeSingle();
      if (!enrollment) {
        const { error: enrollErr } = await supabase.from("Enrollment").insert({
          id: newId(),
          userId: session.sub,
          courseId: assignment.courseId,
        });
        if (enrollErr) {
          return NextResponse.json({ error: "forbidden" }, { status: 403 });
        }
      }
    }

    const execution =
      language === "javascript"
        ? runStudentCode(body.code)
        : { ok: true, stdout: normalizeOutput(body.code), error: undefined };
    const { stdout, ok, error } = execution;
    const expected = normalizeOutput(assignment.expectedOutput);
    const got = normalizeOutput(stdout);
    const passed = ok && got === expected;
    const score = passed ? 100 : ok ? 40 : 0;
    const feedback = passed
      ? null
      : error
        ? runtimeFeedback(locale, error)
        : mismatchFeedback(locale, expected, got);
    const now = new Date().toISOString();

    const { data: prior } = await supabase
      .from("Result")
      .select("id")
      .eq("studentId", session.sub)
      .eq("assignmentId", assignment.id)
      .maybeSingle();

    if (prior) {
      const { data: record, error: uErr } = await supabase
        .from("Result")
        .update({
          submittedCode: body.code,
          stdout,
          passed,
          score,
          feedback,
          updatedAt: now,
        })
        .eq("id", prior.id)
        .select("score, feedback")
        .single();
      if (uErr || !record) {
        return NextResponse.json({ error: "bad_request" }, { status: 400 });
      }
      return NextResponse.json({
        passed,
        score: record.score,
        stdout,
        error: error ?? null,
        feedback: record.feedback,
      });
    }

    const { data: record, error: iErr } = await supabase
      .from("Result")
      .insert({
        id: newId(),
        studentId: session.sub,
        assignmentId: assignment.id,
        submittedCode: body.code,
        stdout,
        passed,
        score,
        feedback,
        createdAt: now,
        updatedAt: now,
      })
      .select("score, feedback")
      .single();
    if (iErr || !record) {
      return NextResponse.json({ error: "bad_request" }, { status: 400 });
    }

    return NextResponse.json({
      passed,
      score: record.score,
      stdout,
      error: error ?? null,
      feedback: record.feedback,
    });
  } catch {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }
}
