# School Management System — PERN Edition

Full rewrite of the original Express + EJS + SQLite monolith into a
separated **P**ostgreSQL + **E**xpress + **R**eact + **N**ode stack.

```
pern-sms/
├── server/   REST API — Express + Prisma ORM (PostgreSQL) + JWT
└── client/   SPA — React 18 + Vite + Material UI
```

## Importing students (CSV)

On **Students**, use **Template** to download the column format, fill it (or start
from `samples/students-sample.csv` / `.xlsx` — 20 ready-made students), then
**Import CSV**. Rules:

- Required columns: `admission_number`, `first_name`, `last_name`. Optional:
  `class`, `parent_email`, `gender`, `date_of_birth`, `address`,
  `emergency_contact`, `emergency_phone`. Common header variants are accepted
  (`Adm No`, `Surname`, `DOB`, …).
- Classes named in the file are **created automatically** if they don't exist.
- Students whose admission number already exists are **skipped**, so re-importing
  the same file is safe. Problem rows are reported with their row number; good
  rows still import.
- Working in Excel? Edit the .xlsx, then **File → Save As → CSV (Comma delimited)**
  before importing.

## Prisma

The data layer uses **Prisma ORM** (`server/prisma/schema.prisma`, 30 models
mirroring the SQL tables). CRUD and auth use the Prisma model API; reporting
(merit list, markbook, analytics) uses parameterized `prisma.$queryRaw`.

- The client is generated in **`engineType = "client"`** mode with the
  **pg driver adapter** (`@prisma/adapter-pg`) — no Rust engine binaries to
  download, which makes installs fast and deploys portable.
- `npm install` runs `prisma generate` automatically (postinstall). To run it
  manually: `npm run generate`.
- Schema changes: edit `sql/schema.sql` **and** `prisma/schema.prisma`, run
  `npm run migrate`, then `npm run generate`. (`sql/schema.sql` remains the
  migration source of truth; Prisma introspection `npx prisma db pull` can
  regenerate the models from the database at any time.)

## Run locally

**1. Database** — any PostgreSQL 14+ (local, Docker, or a free Neon/Railway DB).

**2. API**
```bash
cd server
npm install
cp .env.example .env        # set DATABASE_URL + JWT_SECRET
npm run migrate             # applies sql/schema.sql (all 30 tables)
npm run seed                # admin user + current term + grading scale
npm run dev                 # http://localhost:4000
```
Default admin (change in `.env` **before** seeding): `admin@school.test` / `Admin@1234`.

**3. Client**
```bash
cd client
npm install
cp .env.example .env        # VITE_API_URL=http://localhost:4000
npm run dev                 # http://localhost:5173
```

## Deploy

**API + Postgres → Railway (or Render):**
1. Create a PostgreSQL service; copy its `DATABASE_URL`.
2. Create a service from the `server/` directory. Variables: `DATABASE_URL`,
   `JWT_SECRET` (long random string), `CORS_ORIGINS=https://your-frontend.vercel.app`.
   Remove `DATABASE_NO_SSL` (hosted Postgres uses SSL).
3. Pre-deploy command: `npm run migrate` — migrations then run on every deploy.
4. One-off after first deploy: `npm run seed`.

**Client → Vercel (or Netlify):**
1. Import repo, set root directory to `client/`.
2. Env var: `VITE_API_URL=https://your-api.up.railway.app`.
3. Build command `npm run build`, output `dist/`. Add a SPA rewrite (all → `/index.html`).

## Accounts & email verification

- **Staff** accounts are created by an admin under Users. **Parents and learners
  self-register** at `/register` (learners link via their admission number, parents
  are auto-linked to students sharing their email) — same rules as the original system.
- Every new account must **verify its email** before signing in. With no mail server
  configured, the API returns the verification link in the response (shown in the UI)
  so the flow works in development. For production set:
  `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `MAIL_FROM`, and
  `APP_URL` (your frontend URL, used to build verification links).
- Public registration can be disabled by an admin: settings key
  `allow_public_registration = false`.

## What's where (vs the original)

| Original (EJS view / route)       | PERN equivalent |
|---|---|
| login / logout / sessions          | JWT — `POST /api/auth/login`, client `AuthProvider` |
| change / forgot / reset password   | `/api/auth/change-password`, `/forgot-password`, `/reset-password/:token` |
| users, teachers, permissions       | `/r/users` + `teacher-profiles`, role checks ported to `server/src/auth.js` |
| classes, students, learning areas, class-learning-areas, class-teachers | config-driven CRUD pages (`/r/…`) |
| marks, markbook                    | Markbook page — grid entry, auto-grading from `grading_scales` |
| merit list (+ summary)             | Merit list page — ranked averages, class stats, pass rate |
| report card + comments             | Report cards page — per-learner, teacher comment editing, parent/learner restricted to own |
| attendance                         | Attendance page — per-class roll call, bulk save |
| fees + payments                    | Fees page — balances + record-payment dialog (`POST /api/fees/:id/pay`) |
| assignments + submissions + grading| `/r/assignments` + `/api/assignments/:id/submit|submissions|grade` |
| assessments, announcements, timetables, resources, schemes, lesson plans, notes, notifications | config-driven CRUD pages |
| analytics                          | Dashboard — totals, fees billed/collected, class sizes |
| settings, academic periods, grading scales | config-driven CRUD (management only) |

### Intentionally adapted
- **Sessions → JWT** (stateless; deploys anywhere without a session store).
- **Email delivery** (nodemailer) is deployment-specific; forgot-password returns the
  token in the response for now — wire your SMTP provider in `routes/auth.js`.
- **xlsx import/export** not ported yet (original used server-side xlsx); the data
  endpoints exist, so exports can be added client-side when needed.
