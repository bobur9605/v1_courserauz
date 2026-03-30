import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const password = await bcrypt.hash("demo1234", 10);

  const admin = await prisma.user.upsert({
    where: { email: "teacher@lms.uz" },
    update: {},
    create: {
      email: "teacher@lms.uz",
      fullName: "Demo O‘qituvchi",
      passwordHash: password,
      role: "ADMIN",
    },
  });

  const student = await prisma.user.upsert({
    where: { email: "student@lms.uz" },
    update: {},
    create: {
      email: "student@lms.uz",
      fullName: "Demo Talaba",
      passwordHash: password,
      role: "STUDENT",
    },
  });

  await prisma.course.deleteMany({});

  const htmlCourse = await prisma.course.create({
    data: {
      title: "HTML asoslari",
      description:
        "Semantik teglar, struktura va hujjat modeli. Veb sahifa skeletini qurish.",
      durationHours: 12,
      difficultyLevel: "beginner",
    },
  });

  const cssCourse = await prisma.course.create({
    data: {
      title: "CSS va layout",
      description:
        "Flexbox, Grid, ranglar, tipografiya va moslashuvchan dizayn.",
      durationHours: 16,
      difficultyLevel: "beginner",
    },
  });

  const jsCourse = await prisma.course.create({
    data: {
      title: "JavaScript (ES6+)",
      description:
        "O‘zgaruvchilar, funksiyalar, DOM, asinxron kod va zamonaviy JS.",
      durationHours: 24,
      difficultyLevel: "intermediate",
    },
  });

  await prisma.assignment.createMany({
    data: [
      {
        courseId: htmlCourse.id,
        title: "Birinchi HTML sahifa",
        instructions:
          "console.log yordamida 'Hello LMS' matnini chiqaring. Faqat bitta console.log.",
        starterCode: "// Write your code below\n",
        expectedOutput: "Hello LMS",
        order: 0,
      },
      {
        courseId: cssCourse.id,
        title: "Rang va shrift",
        instructions:
          "JavaScriptda ikkita sonni qo‘shing va natijani console.log bilan chiqaring: 21 + 21",
        starterCode: "// Output the sum of 21 and 21\n",
        expectedOutput: "42",
        order: 0,
      },
      {
        courseId: jsCourse.id,
        title: "Massivdagi yig‘indi",
        instructions:
          "Berilgan massiv elementlarini yig‘ing va yig‘indini console.log qiling.",
        starterCode:
          "const nums = [3, 5, 7];\n// Print the sum of nums using console.log\n",
        expectedOutput: "15",
        order: 0,
      },
    ],
  });

  await prisma.enrollment.createMany({
    data: [
      { userId: student.id, courseId: htmlCourse.id },
      { userId: student.id, courseId: cssCourse.id },
      { userId: student.id, courseId: jsCourse.id },
    ],
  });

  console.log("Seed OK. teacher@lms.uz / student@lms.uz — parol: demo1234");
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
