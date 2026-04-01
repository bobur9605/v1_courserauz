import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/routing";
import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSession } from "@/lib/auth";
import { AssignmentWorkspace } from "@/components/AssignmentWorkspace";
import { localizeAssignment, localizeCourse } from "@/lib/sampleCurriculumI18n";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ locale: string; courseId: string; assignmentId: string }>;
};

export default async function AssignmentPage(props: Props) {
  const { locale, courseId, assignmentId } = await props.params;
  const t = await getTranslations("assignment");
  const supabase = createAdminClient();

  const { data: row, error } = await supabase
    .from("Assignment")
    .select(
      "id, title, instructions, starterCode, expectedOutput, courseId",
    )
    .eq("id", assignmentId)
    .eq("courseId", courseId)
    .maybeSingle();

  if (error || !row) notFound();

  const { data: courseRow } = await supabase
    .from("Course")
    .select("title")
    .eq("id", row.courseId)
    .maybeSingle();
  const localizedAssignment = localizeAssignment(locale, row);
  const localizedCourseTitle = courseRow
    ? localizeCourse(locale, { ...courseRow, description: "" }).title
    : "";

  const session = await getSession();
  const { data: result } = session
    ? await supabase
        .from("Result")
        .select("submittedCode, score, passed, feedback")
        .eq("studentId", session.sub)
        .eq("assignmentId", row.id)
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
          {localizedAssignment.title}
        </h1>
        <p className="mt-2 text-sm text-[#6a6f73]">{localizedCourseTitle}</p>
      </div>

      <section className="rounded-xl border border-[#e0e0e0] bg-white p-6 shadow-sm">
        <h2 className="text-sm font-bold uppercase tracking-wide text-[#6a6f73]">
          {t("instructions")}
        </h2>
        <p className="mt-3 whitespace-pre-wrap text-[#1c1d1f]">
          {localizedAssignment.instructions}
        </p>
      </section>

      {session ? (
        <AssignmentWorkspace
          assignmentId={row.id}
          starterCode={row.starterCode}
          expectedOutput={row.expectedOutput}
          initialCode={result?.submittedCode}
          existingScore={result?.score}
          existingPassed={result?.passed}
          existingFeedback={result?.feedback}
        />
      ) : (
        <p className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          {t("needLogin")}
        </p>
      )}
    </div>
  );
}
