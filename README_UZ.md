# WD-EDU — “Veb ilovalarni yaratish” o'quv platformasi

Next.js asosidagi ilova: **Coursera uslubidagi UI**, **O'zbek / Ingliz / Rus** tillari, Monaco code lab'lari va talaba / o'qituvchi rollari bilan. Ma'lumotlar **Supabase Postgres**da **`@supabase/supabase-js`** orqali saqlanadi (Prisma ishlatilmaydi).

## Talablar

- Node.js 20+
- [Supabase](https://supabase.com) loyihasi

## Supabase sozlamasi

1. Supabase'da loyiha yarating -> **Project Settings -> SQL Editor** (yoki **Database -> Migrations**).
2. Agar jadvallar hali yo'q bo'lsa, `supabase/migrations/20260331000000_init.sql` ichidagi SQL'ni bir marta ishga tushiring.
3. **Project Settings -> API** dan quyidagilarni oling:
   - **Project URL** -> `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** -> `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role** -> `SUPABASE_SERVICE_ROLE_KEY` (faqat server uchun; hech qachon commit qilmang va oshkor qilmang)

## Lokal ishga tushirish

```bash
cp .env.example .env
```

`.env` faylini yuqoridagi qiymatlar va kuchli `JWT_SECRET` bilan to'ldiring (production muhitda qo'shtirnoqsiz yozing).

```bash
npm install
npm run db:seed
npm run dev
```

[http://localhost:3000](http://localhost:3000) ni oching.

**Demo loginlar** (`seed`dan keyin):

| Rol | Email | Parol |
|-----|-------|-------|
| Superadmin | `admin@wdedu.uz` | `demo1234` |
| Teacher | `teacher@wdedu.uz` | `demo1234` |
| Student | `student@wdedu.uz` | `demo1234` |

## Vercel'ga deploy

1. Repo'ni import qiling; agar monorepo bo'lsa va ilova faqat `web`da tursa, **Root directory** = `web`.
2. **Environment variables** (Production + Preview):
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `JWT_SECRET`
3. Agar baza yangi bo'lsa, Supabase migration SQL'larini qo'llang; ixtiyoriy ravishda production env bilan lokalda `npm run db:seed` qilib demo ma'lumotlarni yuklang.

## Skriptlar

| Buyruq | Vazifasi |
|--------|----------|
| `npm run dev` | Development server |
| `npm run build` | Production build |
| `npm run db:seed` | Demo user/kurslarni seed qilish (lokal) |

## Texnologik stack

- Next.js (App Router), TypeScript, Tailwind CSS, next-intl
- Supabase (Postgres + REST)
- Monaco Editor, jose (JWT), bcryptjs

## Litsenziya

Ta'limiy / individual loyiha uchun foydalanish.
