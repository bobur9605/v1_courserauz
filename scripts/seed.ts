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
    "admin@wdedu.uz",
    "Demo Admin",
    "SUPERADMIN",
    password,
  );
  const teacherId = await ensureUser(
    supabase,
    "teacher@wdedu.uz",
    "Demo O‘qituvchi",
    "TEACHER",
    password,
  );
  const studentId = await ensureUser(
    supabase,
    "student@wdedu.uz",
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
  const gitRestId = newId();

  const { error: cErr } = await supabase.from("Course").insert([
    {
      id: htmlId,
      title: "HTML Fundamentals",
      description:
        "From document structure to semantic markup: headings, sections, forms, tables, and accessible page layout.",
      durationHours: 18,
      difficultyLevel: "beginner",
      teacherId,
    },
    {
      id: cssId,
      title: "CSS Fundamentals and Layout",
      description:
        "Selectors, cascade, spacing, typography, responsive design, Flexbox, and Grid for modern interfaces.",
      durationHours: 22,
      difficultyLevel: "beginner",
      teacherId,
    },
    {
      id: jsId,
      title: "JavaScript Essentials (ES6+)",
      description:
        "Core syntax, functions, arrays/objects, loops, async basics, and DOM-driven problem solving.",
      durationHours: 28,
      difficultyLevel: "intermediate",
      teacherId,
    },
    {
      id: gitRestId,
      title: "Git and REST Workflow Basics",
      description:
        "Version control habits, commit strategy, HTTP methods, JSON payloads, and frontend-backend interaction.",
      durationHours: 14,
      difficultyLevel: "beginner",
      teacherId,
    },
  ]);
  if (cErr) throw cErr;

  const assignments = [
    // HTML track (simulated in JS console tasks)
    {
      id: newId(),
      courseId: htmlId,
      title: "HTML Document Skeleton",
      instructions:
        "Create a string that represents a minimal HTML skeleton and print ONLY the opening tag line: <html lang=\"en\">",
      starterCode:
        "const htmlDoc = '<!doctype html>\\n<html lang=\"en\">\\n<head>\\n  <meta charset=\"UTF-8\" />\\n</head>\\n<body></body>\\n</html>';\n// Print only the second line\n",
      expectedOutput: '<html lang="en">',
      order: 0,
    },
    {
      id: newId(),
      courseId: htmlId,
      title: "Semantic Tags Order",
      instructions:
        "Use the array below and print semantic tags joined by ' > ' in the same order.",
      starterCode:
        "const tags = ['header', 'main', 'section', 'article', 'footer'];\n// Print: header > main > section > article > footer\n",
      expectedOutput: "header > main > section > article > footer",
      order: 1,
    },
    {
      id: newId(),
      courseId: htmlId,
      title: "Form Fields Count",
      instructions:
        "Given form field types, print how many fields exist.",
      starterCode:
        "const fields = ['text', 'email', 'password', 'checkbox', 'submit'];\n// Print the number of fields\n",
      expectedOutput: "5",
      order: 2,
    },
    {
      id: newId(),
      courseId: htmlId,
      title: "Accessible Image Snippet",
      instructions:
        "Build an image tag using src='hero.png' and alt='Hero banner'. Print it exactly.",
      starterCode:
        "const src = 'hero.png';\nconst alt = 'Hero banner';\n// Build and print: <img src=\"hero.png\" alt=\"Hero banner\" />\n",
      expectedOutput: '<img src="hero.png" alt="Hero banner" />',
      order: 3,
    },

    // CSS track
    {
      id: newId(),
      courseId: cssId,
      title: "CSS Selector Specificity (basic)",
      instructions:
        "Calculate simple specificity score as: ids*100 + classes*10 + elements. For 1 id, 2 classes, 3 elements, print score.",
      starterCode:
        "const ids = 1;\nconst classes = 2;\nconst elements = 3;\n// Print specificity score\n",
      expectedOutput: "123",
      order: 0,
    },
    {
      id: newId(),
      courseId: cssId,
      title: "Box Model Width",
      instructions:
        "Given content=200, padding=20 (both sides total), border=4 (both sides total), print total width.",
      starterCode:
        "const content = 200;\nconst paddingTotal = 20;\nconst borderTotal = 4;\n// Print total width\n",
      expectedOutput: "224",
      order: 1,
    },
    {
      id: newId(),
      courseId: cssId,
      title: "Flex Main Axis Direction",
      instructions:
        "If flex-direction is 'column', print main axis as 'vertical'.",
      starterCode:
        "const direction = 'column';\n// Print 'vertical' for column, 'horizontal' for row\n",
      expectedOutput: "vertical",
      order: 2,
    },
    {
      id: newId(),
      courseId: cssId,
      title: "Media Query Breakpoint Label",
      instructions:
        "For width=768, print breakpoint label: mobile(<640), tablet(640-1023), desktop(>=1024).",
      starterCode:
        "const width = 768;\n// Print breakpoint label\n",
      expectedOutput: "tablet",
      order: 3,
    },

    // JavaScript track
    {
      id: newId(),
      courseId: jsId,
      title: "Variables and Arithmetic",
      instructions:
        "Compute cart total: items=[120, 80, 50], discount=30. Print final total.",
      starterCode:
        "const items = [120, 80, 50];\nconst discount = 30;\n// Print final total\n",
      expectedOutput: "220",
      order: 0,
    },
    {
      id: newId(),
      courseId: jsId,
      title: "Function Return Value",
      instructions:
        "Write a function double(n) and print double(21).",
      starterCode:
        "// Define function double and print result for 21\n",
      expectedOutput: "42",
      order: 1,
    },
    {
      id: newId(),
      courseId: jsId,
      title: "Array Filter and Length",
      instructions:
        "From [3, 10, 17, 22, 9], filter numbers >= 10 and print count.",
      starterCode:
        "const nums = [3, 10, 17, 22, 9];\n// Filter >=10 and print count\n",
      expectedOutput: "3",
      order: 2,
    },
    {
      id: newId(),
      courseId: jsId,
      title: "Object Property Access",
      instructions:
        "Given user object, print full label as 'Aziza (student)'.",
      starterCode:
        "const user = { name: 'Aziza', role: 'student' };\n// Print: Aziza (student)\n",
      expectedOutput: "Aziza (student)",
      order: 3,
    },
    {
      id: newId(),
      courseId: jsId,
      title: "Loop Sum",
      instructions:
        "Use a loop to sum numbers 1 through 5 and print result.",
      starterCode:
        "// Sum numbers from 1 to 5 using a loop and print result\n",
      expectedOutput: "15",
      order: 4,
    },
    {
      id: newId(),
      courseId: jsId,
      title: "String Normalization",
      instructions:
        "Trim and lowercase text '  HeLLo  ' and print final value.",
      starterCode:
        "const raw = '  HeLLo  ';\n// Normalize and print\n",
      expectedOutput: "hello",
      order: 5,
    },

    // Git + REST track
    {
      id: newId(),
      courseId: gitRestId,
      title: "HTTP Method Mapping",
      instructions:
        "Map action='create' to HTTP method and print it.",
      starterCode:
        "const action = 'create';\n// Print HTTP method for create/read/update/delete\n",
      expectedOutput: "POST",
      order: 0,
    },
    {
      id: newId(),
      courseId: gitRestId,
      title: "Status Code Category",
      instructions:
        "For status=201, print category: informational/success/redirect/client-error/server-error.",
      starterCode:
        "const status = 201;\n// Print category\n",
      expectedOutput: "success",
      order: 1,
    },
    {
      id: newId(),
      courseId: gitRestId,
      title: "Conventional Commit Prefix",
      instructions:
        "For changeType='bugfix', print conventional commit prefix.",
      starterCode:
        "const changeType = 'bugfix';\n// Print prefix for feature/bugfix/docs/refactor\n",
      expectedOutput: "fix",
      order: 2,
    },
  ];

  const { error: aErr } = await supabase.from("Assignment").insert(assignments);
  if (aErr) throw aErr;

  const { error: enErr } = await supabase.from("Enrollment").insert([
    { id: newId(), userId: studentId, courseId: htmlId },
    { id: newId(), userId: studentId, courseId: cssId },
    { id: newId(), userId: studentId, courseId: jsId },
    { id: newId(), userId: studentId, courseId: gitRestId },
  ]);
  if (enErr) throw enErr;

  console.log(
    "Seed OK. admin@wdedu.uz / teacher@wdedu.uz / student@wdedu.uz — parol: demo1234",
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
