import bcrypt from "bcryptjs";
import { createClient } from "@supabase/supabase-js";
import { newId } from "../lib/ids";

async function ensureUser(
  supabase: ReturnType<typeof createClient>,
  email: string,
  fullName: string,
  role: string,
  passwordHash: string,
) {
  const { data: existing } = await supabase
    .from("User")
    .select("id")
    .eq("email", email)
    .maybeSingle();
  if (existing) return existing.id;
  const id = newId();
  const { error } = await supabase.from("User").insert({
    id,
    email,
    fullName,
    role,
    passwordHash,
  });
  if (error) throw error;
  return id;
}

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !key) {
    console.error(
      "Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env",
    );
    process.exit(1);
  }
  const supabase = createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const password = await bcrypt.hash("demo1234", 10);
  await ensureUser(
    supabase,
    "teacher@lms.uz",
    "Demo O‘qituvchi",
    "ADMIN",
    password,
  );
  const studentId = await ensureUser(
    supabase,
    "student@lms.uz",
    "Demo Talaba",
    "STUDENT",
    password,
  );

  const { error: delErr } = await supabase
    .from("Course")
    .delete()
    .gte("durationHours", 0);
  if (delErr) throw delErr;

  const htmlId = newId();
  const cssId = newId();
  const jsId = newId();

  const { error: cErr } = await supabase.from("Course").insert([
    {
      id: htmlId,
      title: "HTML asoslari",
      description:
        "Semantik teglar, struktura va hujjat modeli. Veb sahifa skeletini qurish.",
      durationHours: 12,
      difficultyLevel: "beginner",
    },
    {
      id: cssId,
      title: "CSS va layout",
      description:
        "Flexbox, Grid, ranglar, tipografiya va moslashuvchan dizayn.",
      durationHours: 16,
      difficultyLevel: "beginner",
    },
    {
      id: jsId,
      title: "JavaScript (ES6+)",
      description:
        "O‘zgaruvchilar, funksiyalar, DOM, asinxron kod va zamonaviy JS.",
      durationHours: 24,
      difficultyLevel: "intermediate",
    },
  ]);
  if (cErr) throw cErr;

  const { error: aErr } = await supabase.from("Assignment").insert([
    {
      id: newId(),
      courseId: htmlId,
      title: "Birinchi HTML sahifa",
      instructions:
        "console.log yordamida 'Hello LMS' matnini chiqaring. Faqat bitta console.log.",
      starterCode: "// Write your code below\n",
      expectedOutput: "Hello LMS",
      order: 0,
    },
    {
      id: newId(),
      courseId: cssId,
      title: "Rang va shrift",
      instructions:
        "JavaScriptda ikkita sonni qo‘shing va natijani console.log bilan chiqaring: 21 + 21",
      starterCode: "// Output the sum of 21 and 21\n",
      expectedOutput: "42",
      order: 0,
    },
    {
      id: newId(),
      courseId: jsId,
      title: "Massivdagi yig‘indi",
      instructions:
        "Berilgan massiv elementlarini yig‘ing va yig‘indini console.log qiling.",
      starterCode:
        "const nums = [3, 5, 7];\n// Print the sum of nums using console.log\n",
      expectedOutput: "15",
      order: 0,
    },
  ]);
  if (aErr) throw aErr;

  const { error: enErr } = await supabase.from("Enrollment").insert([
    { id: newId(), userId: studentId, courseId: htmlId },
    { id: newId(), userId: studentId, courseId: cssId },
    { id: newId(), userId: studentId, courseId: jsId },
  ]);
  if (enErr) throw enErr;

  console.log("Seed OK. teacher@lms.uz / student@lms.uz — parol: demo1234");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
