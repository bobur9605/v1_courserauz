# LMS — “Veb ilovalarni yaratish” learning platform

Next.js 16 app with **Coursera-style UI**, **Uzbek / English / Russian**, **Prisma + PostgreSQL**, Monaco code labs, and student / instructor roles.

## Prerequisites

- Node.js 20+
- PostgreSQL (local Docker, install, or a cloud database)

## Local setup

```bash
cp .env.example .env
```

Edit `.env`:

1. **`DATABASE_URL`** — point at your Postgres database (create an empty DB, e.g. `lms`, first).
2. **`DIRECT_URL`** — set this equal to `DATABASE_URL` for local development.
3. **`JWT_SECRET`** — generate a random secret (do not use the sample from old tutorials):

   ```bash
   node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"
   ```

   Paste the output into `.env` as `JWT_SECRET=...` **without** quotes.

Then:

```bash
npm install
npx prisma migrate deploy
npx prisma db seed
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

**Demo logins** (after seed):

| Role     | Email              | Password   |
|----------|--------------------|------------|
| Teacher  | `teacher@lms.uz`   | `demo1234` |
| Student  | `student@lms.uz`   | `demo1234` |

## Environment variables

| Variable         | Required | Description |
|------------------|----------|-------------|
| `DATABASE_URL`   | Yes      | `postgresql://` or `postgres://` URL. |
| `DIRECT_URL`     | Yes\*    | Prisma migrations use this. Usually the same as `DATABASE_URL`; build scripts set it automatically when you are **not** on a pooler. |
| `JWT_SECRET`     | Yes      | Long random string for signing sessions. |
| `POSTGRES_URL`   | Optional | On Vercel, set automatically with Vercel Postgres; build scripts may map it to `DATABASE_URL`. |
| `DATABASE_URL_UNPOOLED` | Optional | Neon / some hosts: non-pooled URL for migrations; build maps it to `DIRECT_URL` when `DATABASE_URL` is pooled. |
| `POSTGRES_URL_NON_POOLING` | Optional | Same idea as above (Vercel Postgres naming). |
| `RUN_PRISMA_MIGRATIONS` | Optional | `1` to run `prisma migrate deploy` during `npm run build`. By default build skips migrations for safer serverless deploys. |

\* **Supabase transaction pooler** (`pooler.supabase.com`, port `6543`, or `pgbouncer=true`): keep `DATABASE_URL` as the pooler URL for the app, and add **`DIRECT_URL`** with Supabase’s **Database → Connection string → Direct connection** (port `5432`). Migrations cannot run reliably through the transaction pooler alone. **Neon** often sets `DATABASE_URL_UNPOOLED` automatically — no extra manual `DIRECT_URL` in that case.

### Common mistakes

- **Never** use `localhost` in `DATABASE_URL` on Vercel — the cloud cannot reach your laptop. Use **Vercel Postgres**, **Neon**, **Supabase**, or similar.
- In the Vercel dashboard, paste **`JWT_SECRET` without** surrounding `"` characters, or the quotes become part of the secret and logins break.

## Deploy on Vercel

1. Push this repo to GitHub and **Import** the project in Vercel.
2. Create **Vercel → Storage → Postgres** (or use Neon) and **connect** it to the project.
3. Under **Settings → Environment Variables** (Production / Preview):
   - Set **`JWT_SECRET`** to a **new** value from the `node -e ...` command above (never reuse your local `.env` in production if the repo is public).
   - Either leave **`DATABASE_URL`** unset if Vercel injects `POSTGRES_PRISMA_URL` / `POSTGRES_URL`, **or** set **`DATABASE_URL`** to the **hosted** connection string (host is **not** `localhost`).
   - With **Supabase pooler** in `DATABASE_URL`, add **`DIRECT_URL`** (direct `5432` URI from the Supabase dashboard) so `prisma migrate deploy` can run on Vercel.
   - Keep **`RUN_PRISMA_MIGRATIONS`** unset unless you explicitly want migrations during build and your `DIRECT_URL` is reachable from Vercel.
   - **Delete** any old `DATABASE_URL` that still points to `localhost`.
4. Redeploy. After the first successful deploy, **seed** the production DB once (from your machine with production `DATABASE_URL`, or Vercel CLI):

   ```bash
   npx prisma db seed
   ```

## Scripts

| Command              | Purpose                          |
|----------------------|----------------------------------|
| `npm run dev`        | Development server               |
| `npm run build`      | Production build (`prisma generate + next build`; add `RUN_PRISMA_MIGRATIONS=1` to include migrate) |
| `npm run db:migrate` | `prisma migrate deploy`          |
| `npm run db:seed`    | Seed demo data                   |

## Tech stack

- Next.js (App Router), TypeScript, Tailwind CSS, next-intl  
- Prisma ORM, PostgreSQL  
- Monaco Editor, jose (JWT), bcryptjs  

## License

Educational / individual project use.
