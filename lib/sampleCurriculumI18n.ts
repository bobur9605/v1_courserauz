type Locale = "uz" | "en" | "ru";

type LocalePack = {
  courses: Record<string, { title: string; description: string }>;
  assignments: Record<
    string,
    { title: string; instructions: string; starterCode?: string }
  >;
};

const packs: Record<Locale, LocalePack> = {
  en: {
    courses: {},
    assignments: {},
  },
  uz: {
    courses: {
      "HTML Fundamentals": {
        title: "HTML asoslari",
        description:
          "Hujjat tuzilmasidan semantik belgilashgacha: sarlavhalar, bo'limlar, formalar, jadvallar va kirish imkoniyati.",
      },
      "CSS Fundamentals and Layout": {
        title: "CSS asoslari va joylashuv",
        description:
          "Selektorlar, cascade, spacing, tipografiya, responsive dizayn, Flexbox va Grid.",
      },
      "JavaScript Essentials (ES6+)": {
        title: "JavaScript asoslari (ES6+)",
        description:
          "Asosiy sintaksis, funksiyalar, massiv/obyektlar, sikllar, async tushunchalar va DOM yechimlari.",
      },
      "Git and REST Workflow Basics": {
        title: "Git va REST ish jarayoni asoslari",
        description:
          "Version control odatlari, commit strategiyasi, HTTP metodlar, JSON payloadlar va frontend-backend integratsiyasi.",
      },
    },
    assignments: {
      "HTML Document Skeleton": {
        title: "HTML hujjat skeleti",
        instructions:
          "Minimal HTML skeletini satr sifatida yarating va faqat ochilish teg satrini chiqaring: <html lang=\"en\">",
        starterCode:
          "const htmlDoc = `<!doctype html>\n<html lang=\"en\">\n<head>\n  <meta charset=\"UTF-8\" />\n</head>\n<body></body>\n</html>`;\n// Faqat ikkinchi satrni chiqaring\n",
      },
      "CSS Selector Specificity (basic)": {
        title: "CSS selektor xususiyligi (asosiy)",
        instructions:
          "Oddiy specificity hisoblang: ids*100 + classes*10 + elements. 1 id, 2 class, 3 element uchun natijani chiqaring.",
      },
      "Semantic Tags Order": {
        title: "Semantik teglar tartibi",
        instructions:
          "Quyidagi massivdan foydalanib, semantik teglarni aynan shu tartibda ' > ' bilan birlashtirib chiqaring.",
      },
      "Form Fields Count": {
        title: "Forma maydonlari soni",
        instructions:
          "Forma maydon turlari berilgan. Jami nechta maydon borligini chiqaring.",
      },
      "Accessible Image Snippet": {
        title: "Kirish imkoniyatli rasm tegi",
        instructions:
          "src='hero.png' va alt='Hero banner' bilan img tegini tuzing va aynan o'sha satrni chiqaring.",
      },
      "Box Model Width": {
        title: "Box model kengligi",
        instructions:
          "content=200, padding=20 (ikki tomon jami), border=4 (ikki tomon jami) bo'lsa, umumiy kenglikni chiqaring.",
      },
      "Flex Main Axis Direction": {
        title: "Flex asosiy o'qi yo'nalishi",
        instructions:
          "Agar flex-direction='column' bo'lsa, asosiy o'q uchun 'vertical' ni chiqaring.",
      },
      "Media Query Breakpoint Label": {
        title: "Media query breakpoint yorlig'i",
        instructions:
          "width=768 uchun breakpoint yorlig'ini chiqaring: mobile(<640), tablet(640-1023), desktop(>=1024).",
      },
      "Variables and Arithmetic": {
        title: "O'zgaruvchilar va arifmetika",
        instructions:
          "Savat jami qiymatini hisoblang: items=[120, 80, 50], discount=30. Yakuniy natijani chiqaring.",
      },
      "Function Return Value": {
        title: "Funksiya qaytaradigan qiymat",
        instructions:
          "double(n) funksiyasini yozing va double(21) natijasini chiqaring.",
      },
      "Array Filter and Length": {
        title: "Massivni filtrlash va uzunlik",
        instructions:
          "[3, 10, 17, 22, 9] dan >= 10 sonlarni filtrlang va sonini chiqaring.",
      },
      "Object Property Access": {
        title: "Obyekt xususiyatiga murojaat",
        instructions:
          "Berilgan user obyektidan foydalanib, 'Aziza (student)' ko'rinishida chiqaring.",
      },
      "Loop Sum": {
        title: "Sikl orqali yig'indi",
        instructions:
          "1 dan 5 gacha sonlarni sikl yordamida qo'shib, natijani chiqaring.",
      },
      "String Normalization": {
        title: "Matnni normallashtirish",
        instructions:
          "'  HeLLo  ' matnini trim va lowercase qilib, yakuniy qiymatni chiqaring.",
      },
      "HTTP Method Mapping": {
        title: "HTTP metod mosligi",
        instructions:
          "action='create' uchun mos HTTP metodini topib, chiqaring.",
      },
      "Status Code Category": {
        title: "Status kod toifasi",
        instructions:
          "status=201 bo'lsa, toifani chiqaring: informational/success/redirect/client-error/server-error.",
      },
      "Conventional Commit Prefix": {
        title: "Conventional Commit prefiksi",
        instructions:
          "changeType='bugfix' bo'lsa, conventional commit prefiksini chiqaring.",
      },
    },
  },
  ru: {
    courses: {
      "HTML Fundamentals": {
        title: "Основы HTML",
        description:
          "От структуры документа до семантической разметки: заголовки, секции, формы, таблицы и доступность.",
      },
      "CSS Fundamentals and Layout": {
        title: "Основы CSS и layout",
        description:
          "Селекторы, каскад, отступы, типографика, адаптивный дизайн, Flexbox и Grid.",
      },
      "JavaScript Essentials (ES6+)": {
        title: "Основы JavaScript (ES6+)",
        description:
          "Базовый синтаксис, функции, массивы/объекты, циклы, async-блоки и задачи с DOM.",
      },
      "Git and REST Workflow Basics": {
        title: "Основы Git и REST-процесса",
        description:
          "Практика контроля версий, стратегия коммитов, HTTP-методы, JSON и взаимодействие frontend-backend.",
      },
    },
    assignments: {
      "HTML Document Skeleton": {
        title: "Скелет HTML-документа",
        instructions:
          "Создайте строку с минимальным HTML-скелетом и выведите только строку с открывающим тегом: <html lang=\"en\">",
        starterCode:
          "const htmlDoc = `<!doctype html>\n<html lang=\"en\">\n<head>\n  <meta charset=\"UTF-8\" />\n</head>\n<body></body>\n</html>`;\n// Выведите только вторую строку\n",
      },
      "CSS Selector Specificity (basic)": {
        title: "Специфичность CSS-селектора (базовая)",
        instructions:
          "Посчитайте specificity как: ids*100 + classes*10 + elements. Для 1 id, 2 classes, 3 elements выведите результат.",
      },
    },
  },
};

function normalize(locale: string): Locale {
  if (locale === "ru") return "ru";
  if (locale === "en") return "en";
  return "uz";
}

export function localizeCourse<T extends { title: string; description: string }>(
  locale: string,
  course: T,
): T {
  const pack = packs[normalize(locale)].courses[course.title];
  if (!pack) return course;
  return { ...course, title: pack.title, description: pack.description };
}

export function localizeAssignment<T extends { title: string; instructions: string }>(
  locale: string,
  assignment: T,
): T {
  const pack = packs[normalize(locale)].assignments[assignment.title];
  if (!pack) return assignment;
  return {
    ...assignment,
    title: pack.title,
    instructions: pack.instructions,
    ...(pack.starterCode ? { starterCode: pack.starterCode } : {}),
  };
}
