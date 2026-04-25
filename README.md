# LifeOps

LifeOps is an AI-powered personal operating system for future self planning, goals, habits, tasks, notes, daily planning, and weekly reviews.

## MVP Modules

- Future Self and Life Areas
- Goals
- Habits and Habit Logs
- Tasks
- Notes
- Dashboard
- AI Daily Planner
- Weekly Review
- Admin settings

## Stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- Prisma ORM
- PostgreSQL
- Redis
- NextAuth
- Zod
- Server-side AI clients for OpenAI, Anthropic, and Groq

## Local Setup

1. Install dependencies.

```bash
npm install
```

2. Create the environment file.

```bash
copy .env.example .env
```

On macOS/Linux:

```bash
cp .env.example .env
```

3. Start local infrastructure.

```bash
docker compose up -d
```

4. Generate Prisma Client, run migrations, and seed data.

```bash
npm run db:generate
npm run db:migrate
npm run db:seed
```

5. Start the app.

```bash
npm run dev
```

The app runs at:

```txt
http://localhost:3000
```

## Test Login

Seed data creates a local admin user:

```txt
Username: admin
Password: password123
```

## Seed Data

`npm run db:seed` creates realistic example data for the admin user:

- Future Self profile
- Life Areas
- Active Goals
- Habits and recent Habit Logs
- Tasks for today, overdue, and completed states
- Notes
- Daily Plan
- Weekly Review
- Default global AI settings

The seed script resets only the seeded admin user's related records.

## AI Settings

Open `/admin` to choose the global AI provider and model.

Supported providers:

- Groq
- OpenAI
- Anthropic

API keys must stay in `.env` and are only read server-side:

```txt
GROQ_API_KEY=
OPENAI_API_KEY=
ANTHROPIC_API_KEY=
```

AI calls are never automatic. They run only from explicit user actions such as Generate Habits, Plan My Day, or Generate Weekly Review.

## Scripts

```bash
npm run dev
npm run build
npm run typecheck
npm test
npm run db:generate
npm run db:migrate
npm run db:seed
npm run db:studio
```

## Quality Checks

Run before pushing:

```bash
npm run typecheck --workspace @lifeops/web
npm run typecheck --workspace @lifeops/shared
npm run typecheck --workspace @lifeops/db
npm test
```

## Security Notes

- Do not commit `.env`.
- Do not expose AI keys to client components.
- All application data must be scoped to the authenticated user.
- AI features should send only the context needed for the requested action.
- PostgreSQL and Redis are intended for local Docker or private production networks.
