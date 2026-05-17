import { NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSession } from "@/lib/auth";
import { normalizeMarkupOutput, normalizeOutput } from "@/lib/normalizeOutput";
import { runStudentCode } from "@/lib/runner";
import { newId } from "@/lib/ids";
import { bypassesLessonSequence } from "@/lib/lessonGating";
import { studentMayAccessLessonOrder } from "@/lib/lessonGatingServer";
import {
  resolveAssignmentEditorLanguage,
  usesJavaScriptRunner,
} from "@/lib/assignmentMode";
import {
  gradeSubmissionWithAi,
  isAiGradingConfigured,
} from "@/lib/aiGrader";

const schema = z.object({
  assignmentId: z.string().min(1),
  code: z.string(),
  locale: z.enum(["uz", "en", "ru"]).optional(),
});

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

  if (!isAiGradingConfigured()) {
    return NextResponse.json({ error: "grader_unavailable" }, { status: 503 });
  }

  try {
    const body = schema.parse(await req.json());
    const locale = body.locale ?? "en";
    const supabase = createAdminClient();
    const { data: assignment, error: aErr } = await supabase
      .from("Assignment")
      .select(
        "id, title, instructions, expectedOutput, courseId, order, language, lessonId, starterCode",
      )
      .eq("id", body.assignmentId)
      .maybeSingle();
    if (aErr || !assignment) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }
    const { data: courseRow } = await supabase
      .from("Course")
      .select("title")
      .eq("id", assignment.courseId)
      .maybeSingle();
    const courseTitle = courseRow?.title ?? "";
    const { data: lesson } = assignment.lessonId
      ? await supabase
          .from("Lesson")
          .select("id, order")
          .eq("id", assignment.lessonId)
          .maybeSingle()
      : { data: null };
    if (
      !bypassesLessonSequence(session) &&
      lesson &&
      !(await studentMayAccessLessonOrder(
        session.sub,
        assignment.courseId,
        lesson.order,
      ))
    ) {
      return NextResponse.json({ error: "sequence_locked" }, { status: 403 });
    }
    const editorLanguage = resolveAssignmentEditorLanguage(
      assignment.language,
      assignment.starterCode,
      assignment.expectedOutput,
      courseTitle,
    );
    const runAsJavaScript = usesJavaScriptRunner(
      assignment.language,
      assignment.starterCode,
      assignment.expectedOutput,
      courseTitle,
    );

    if (session.role === "STUDENT") {
      const { data: enrollment } = await supabase
        .from("Enrollment")
        .select("id")
        .eq("userId", session.sub)
        .eq("courseId", assignment.courseId)
        .maybeSingle();
      if (!enrollment) {
        return NextResponse.json({ error: "forbidden" }, { status: 403 });
      }
    }

    const execution =
      runAsJavaScript
        ? runStudentCode(body.code)
        : { ok: true, stdout: normalizeOutput(body.code), error: undefined };
    const { stdout, ok, error } = execution;
    const studentOutput = runAsJavaScript
      ? normalizeOutput(stdout)
      : normalizeMarkupOutput(stdout);

    let passed: boolean;
    let score: number;
    let feedback: string | null;

    if (!ok && error) {
      passed = false;
      score = 0;
      feedback = runtimeFeedback(locale, error);
    } else {
      const ai = await gradeSubmissionWithAi({
        title: assignment.title,
        instructions: assignment.instructions,
        expectedOutput: assignment.expectedOutput,
        language: editorLanguage,
        code: body.code,
        studentOutput,
        runtimeError: error,
        locale,
      });
      passed = ai.passed;
      score = ai.score;
      feedback = ai.passed ? null : ai.feedback;
    }

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
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    if (message.includes("OPENAI")) {
      return NextResponse.json({ error: "grader_unavailable" }, { status: 503 });
    }
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }
}
