# WD-EDU — “Veb ilovalarni yaratish” learning platform

Next.js app with **Coursera-style UI**, **Uzbek / English / Russian**, Monaco code labs, and student / instructor roles. Data is stored in **Supabase Postgres** via **`@supabase/supabase-js`** (no Prisma).

## Prerequisites

- Node.js 20+
- A [Supabase](https://supabase.com) project

## Supabase setup

1. Create a project → **Project Settings → SQL Editor** (or **Database → Migrations**).
2. Run the SQL in `supabase/migrations/20260331000000_init.sql` once if tables do not exist yet.
3. Copy **Project Settings → API**:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role** → `SUPABASE_SERVICE_ROLE_KEY` (server-only; never commit or expose)

## Local setup

```bash
cp .env.example .env
```

Edit `.env` with the values above and a strong `JWT_SECRET` (no quotes in production env UIs).

```bash
npm install
npm run db:seed
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

**Demo logins** (after seed):

| Role     | Email              | Password   |
|----------|--------------------|------------|
| Teacher  | `teacher@wdedu.uz` | `demo1234` |
| Student  | `student@wdedu.uz` | `demo1234` |

## Deploy on Vercel

1. Import the repo; **Root directory** = `web` if the monorepo contains only `web` as the app.
2. **Environment variables** (Production + Preview):
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `JWT_SECRET`
3. Apply the SQL migration in Supabase if the database is new; optionally run `npm run db:seed` locally with production env to load demo data.

## Scripts

| Command           | Purpose                          |
|-------------------|----------------------------------|
| `npm run dev`     | Development server               |
| `npm run build`   | Production build                 |
| `npm run db:seed` | Seed demo users/courses (local)  |

## Tech stack

- Next.js (App Router), TypeScript, Tailwind CSS, next-intl  
- Supabase (Postgres + REST)  
- Monaco Editor, jose (JWT), bcryptjs  

## License

Educational / individual project use.
