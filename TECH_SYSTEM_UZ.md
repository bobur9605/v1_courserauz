# WD-EDU loyihasi texnik tizimi (sodda izoh)

## 1) Loyiha nima qiladi?

WD-EDU bu Coursera uslubidagi onlayn ta'lim platformasi. Unda:
- talaba kurslarga yoziladi va darslarni ketma-ket o'qiydi;
- o'qituvchi kurs, dars, topshiriq va resurslarni boshqaradi;
- admin tizimni umumiy nazorat qiladi.

Interfeys 3 tilda ishlaydi: o'zbek, ingliz, rus.

## 2) Asosiy texnologiyalar

- **Frontend va Backend (bir loyihada):** Next.js 15 (App Router)
- **Til:** TypeScript
- **UI:** React 19 + Tailwind CSS 4
- **I18n (ko'p til):** next-intl
- **Ma'lumotlar bazasi:** Supabase Postgres
- **DB bilan ishlash:** `@supabase/supabase-js`
- **Autentifikatsiya va xavfsizlik:** JWT (`jose`), parol hashing (`bcryptjs`)
- **Kod topshiriqlari muhiti:** Monaco Editor

## 3) Arxitektura qanday ishlaydi?

Loyiha **full-stack Next.js** uslubida qurilgan:

- `app/[locale]/...` ichida sahifalar (UI) turadi.
- `app/api/...` ichida server route'lar (API endpointlar) turadi.
- `lib/...` ichida biznes mantiq, ruxsat tekshiruvlari va yordamchi funksiyalar bor.
- `supabase/migrations/...` bazadagi jadval va funksiyalarni yaratish/o'zgartirish SQL'lari.

Ya'ni, brauzer (frontend) so'rov yuboradi -> Next.js API route qabul qiladi -> Supabase bazaga yozadi/o'qiydi -> natija UI'ga qaytadi.

## 4) Rollar va ruxsatlar

Tizimda odatda 3 asosiy rol bor:
- **Superadmin**: kurslar/o'qituvchilarni boshqaradi.
- **Teacher**: o'z kurslari, darslari, topshiriqlarini yuritadi.
- **Student**: kursni o'qiydi, darslarni yakunlaydi, topshiriq topshiradi.

`lib/coursePermissions.ts`, `lib/lessonGating*.ts`, `lib/assignmentGating*.ts` kabi fayllar orqali kirish va ketma-ketlik nazorati qilinadi.

## 5) Ma'lumotlar oqimi (oddiy)

1. Foydalanuvchi login qiladi (`/api/auth/login`).
2. Token/rol asosida uning sahifalari ochiladi.
3. Kurslar (`/api/courses`) va darslar (`/api/courses/[id]/lessons`) API orqali olinadi.
4. Talaba darsni yakunlaganda completion endpoint ishlaydi.
5. O'qituvchi topshiriq/resurs qo'shganda tegishli API route'lar orqali bazaga yoziladi.

## 6) Muhit o'zgaruvchilari (env)

Majburiy kalitlar:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (faqat server tomonda)
- `JWT_SECRET`

## 7) Ishga tushirish

1. `.env.example` dan `.env` yaratiladi.
2. Kerakli env qiymatlar qo'yiladi.
3. `npm install`
4. `npm run db:seed`
5. `npm run dev`

Loyiha odatda `http://localhost:3000` da ochiladi.

## 8) Deploy

Asosan Vercel'ga deploy qilinadi:
- repo import qilinadi;
- env lar Vercel'da qo'yiladi;
- Supabase migration'lar ishlatiladi;
- kerak bo'lsa seed ma'lumotlari yuklanadi.

## 9) Xulosa

Bu tizim modern web stack'da yozilgan ta'lim platformasi:
- tez UI (React/Next.js),
- real relational DB (Supabase Postgres),
- rolga asoslangan xavfsizlik,
- ko'p tilli interfeys,
- o'qituvchi va talaba uchun alohida ish jarayoni.
