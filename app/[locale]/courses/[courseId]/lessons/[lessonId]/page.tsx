import { getTranslations } from "next-intl/server";
import { Link, redirect } from "@/i18n/routing";
import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSession } from "@/lib/auth";
import { AssignmentWorkspace } from "@/components/AssignmentWorkspace";
import { studentMayAccessLessonOrder } from "@/lib/lessonGatingServer";
import { LessonCompleteButton } from "@/components/LessonCompleteButton";
import { resolveAssignmentEditorLanguage } from "@/lib/assignmentMode";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ locale: string; courseId: string; lessonId: string }>;
};

export default async function LessonPage(props: Props) {
  const { locale, courseId, lessonId } = await props.params;
  const t = await getTranslations("assignment");
  const supabase = createAdminClient();

  const { data: lesson, error } = await supabase
    .from("Lesson")
    .select("id, title, content, order, assignmentId, courseId")
    .eq("id", lessonId)
    .eq("courseId", courseId)
    .maybeSingle();

  if (error || !lesson) notFound();

  const session = await getSession();
  if (session?.role === "STUDENT") {
    const { data: enrollment } = await supabase
      .from("Enrollment")
      .select("id")
      .eq("userId", session.sub)
      .eq("courseId", courseId)
      .maybeSingle();
    if (!enrollment) redirect({ href: `/courses/${courseId}`, locale });
    if (!(await studentMayAccessLessonOrder(session.sub, courseId, lesson.order))) {
      redirect({ href: `/courses/${courseId}?locked=1`, locale });
    }
  }

  const { data: courseRow } = await supabase
    .from("Course")
    .select("title")
    .eq("id", lesson.courseId)
    .maybeSingle();
  const courseTitle = courseRow?.title ?? "";

  const { data: assignment } = lesson.assignmentId
    ? await supabase
        .from("Assignment")
        .select("id, title, instructions, starterCode, expectedOutput, language")
        .eq("id", lesson.assignmentId)
        .maybeSingle()
    : { data: null };

  const { data: result } = session && assignment
    ? await supabase
        .from("Result")
        .select("submittedCode, score, passed, feedback")
        .eq("studentId", session.sub)
        .eq("assignmentId", assignment.id)
        .maybeSingle()
    : { data: null };
  const { data: completion } = session
    ? await supabase
        .from("LessonCompletion")
        .select("id")
        .eq("studentId", session?.sub)
        .eq("lessonId", lesson.id)
        .maybeSingle()
    : { data: null };

  return (
    <div className="space-y-8">
      <div>
        <Link
          href={`/courses/${courseId}`}
          className="text-sm font-semibold text-[#0056d2] hover:underline"
        >
          {t("back")}
        </Link>
        <h1 className="mt-3 text-2xl font-bold text-[#1c1d1f] md:text-3xl">
          {lesson.title}
        </h1>
        <p className="mt-2 text-sm text-[#6a6f73]">{courseTitle}</p>
      </div>

      <section className="rounded-xl border border-[#e0e0e0] bg-white p-6 shadow-sm">
        <h2 className="text-sm font-bold uppercase tracking-wide text-[#6a6f73]">
          Lesson material
        </h2>
        <p className="mt-3 whitespace-pre-wrap text-[#1c1d1f]">
          {lesson.content || "No material yet."}
        </p>
      </section>

      {assignment && (
        <section className="space-y-4 rounded-xl border border-[#e0e0e0] bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold text-[#1c1d1f]">{assignment.title}</h2>
          <p className="whitespace-pre-wrap text-[#1c1d1f]">
            {assignment.instructions}
          </p>
          {session ? (
            <AssignmentWorkspace
              assignmentId={assignment.id}
              starterCode={assignment.starterCode}
              expectedOutput={assignment.expectedOutput}
              initialCode={result?.submittedCode}
              existingScore={result?.score}
              existingPassed={result?.passed}
              existingFeedback={result?.feedback}
              editorLanguage={resolveAssignmentEditorLanguage(
                assignment.language,
                assignment.starterCode,
              )}
            />
          ) : (
            <p className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
              {t("needLogin")}
            </p>
          )}
        </section>
      )}

      {!assignment && session?.role === "STUDENT" && (
        <LessonCompleteButton
          courseId={courseId}
          lessonId={lesson.id}
          completed={!!completion}
        />
      )}
    </div>
  );
}
