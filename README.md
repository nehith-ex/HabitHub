# HabitHub

HabitHub is a personal habit tracker built on the existing project stack: React + Vite, Express 5, Prisma 5, and PostgreSQL. The client and server remain separate folders. The client includes a cleaner navy-and-teal dashboard, category filters, habit creation/editing, daily check-ins with optional reflections, archiving, calendar history, and a persistent light/dark theme toggle.

## Requirements

- Node.js 20 or newer and npm.
- PostgreSQL running locally.
- A PostgreSQL database named `habithub`.

The API currently uses the seeded demo user (ID `1`) through the `x-user-id` header. This is a development-only stand-in, not authentication.

## Configure the API

Open a terminal in `server` and copy the safe example environment file:

```powershell
Copy-Item .env.example .env
```

Open `server/.env` and set `DATABASE_URL` to your own PostgreSQL connection string. Example format:

```text
postgresql://postgres:<URL_ENCODED_PASSWORD>@localhost:5432/habithub?schema=public
```

Replace the placeholder with your database password. If the password contains URL-reserved characters, percent-encode them (for example, `@` becomes `%40`). Keep `.env` private; it is ignored by Git and is not included in the ZIP. The other expected local settings are `PORT=5000`, `CLIENT_URL=http://localhost:5173`, and `NODE_ENV=development`.

If the database does not exist yet, create `habithub` in pgAdmin or run `createdb -U postgres habithub` from a PostgreSQL command prompt.

Install and prepare the server:

```powershell
cd server
npm install
npm run db:generate
```

The uploaded project already includes the initial migration. Apply migrations with:

```powershell
npm run db:deploy
```

For a brand-new development database where you want Prisma to create/manage migrations, use `npm run db:migrate` instead. Seed the demo account and sample habits with:

```powershell
npm run db:seed
```

The seed script is safe to rerun: it reuses matching habits and skips duplicate check-ins.

## Run HabitHub locally

Use **two terminals**. Start the API in terminal 1:

```powershell
cd server
npm run dev
```

The API listens at `http://localhost:5000`. Check `http://localhost:5000/api/v1/health`; a working API returns `{"data":{"status":"ok"}}`.

Start the client in terminal 2:

```powershell
cd client
npm install
npm run dev
```

Open `http://localhost:5173`. The client defaults to `http://localhost:5000/api/v1`. If your API uses another address, copy `client/.env.example` to `client/.env`, update `VITE_API_BASE_URL`, then restart Vite.

If the API is not available, the interface enters **Local preview** mode and saves demonstration changes only in that browser's local storage. Those local-preview changes are not sent to PostgreSQL. Start the API to use the database-backed app.

## Build the client

```powershell
cd client
npm run build
```

The production static files are written to `client/dist`.

## API routes

All routes are rooted at `/api/v1`:

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/health` | API health response |
| GET | `/habits` | List active habits (supports `category`, `q`, `sort`, `order`, `page`, `limit`, and `archived`) |
| POST | `/habits` | Create a habit |
| GET | `/habits/:id` | Retrieve a habit |
| PATCH | `/habits/:id` | Edit or archive/restore a habit |
| DELETE | `/habits/:id` | Permanently delete a habit |
| GET | `/check-ins?from=YYYY-MM-DD&to=YYYY-MM-DD` | Read completion history for a date range |
| PUT | `/check-ins/habits/:id` | Create/update one habit's check-in for a date; accepts optional `note` |
| DELETE | `/check-ins/habits/:id/:date` | Remove a habit's check-in for a date |

`CheckIn` is unique for each habit/date pair. Category values are `health`, `study`, `fitness`, `mindfulness`, and `other`; frequency values are `daily` and `weekly`.
