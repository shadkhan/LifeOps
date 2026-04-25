# LifeOps

LifeOps is an AI-powered personal operating system for future self planning, goals, habits, tasks, notes, daily planning, and weekly reviews.

## Stack

- pnpm + Turborepo
- Next.js App Router
- TypeScript
- Tailwind CSS
- Prisma + PostgreSQL
- Redis
- Zod
- OpenAI-compatible AI provider abstraction
- Docker Compose for local infrastructure

## Local Setup

```bash
corepack enable
pnpm install
docker compose up -d
cp .env.example .env
pnpm db:generate
pnpm db:migrate
pnpm db:seed
pnpm dev
```

If `pnpm` is not available, use npm workspaces:

```bash
npm install
docker compose up -d
copy .env.example .env
npm run db:generate
npm run db:migrate
npm run db:seed
npm run dev
```

The web app runs at `http://localhost:3000`.

## Test Login

Local development includes a seeded admin user:

- Username: `admin`
- Password: `password123`

## AI Providers

Set `AI_PROVIDER` in `.env`:

- `openai`
- `groq`
- `together`
- `ollama`
- `fallback`

Provider-specific model and API key variables are documented in `.env.example`.

`AI_FALLBACK_ENABLED` defaults to `true`. When an external AI provider is missing, misconfigured, or temporarily unavailable, LifeOps returns conservative server-side fallback suggestions so the app continues to work. Set `AI_PROVIDER="fallback"` to run without an external AI API.

## Deployment

Production is designed for a Hetzner VPS using Docker Compose and GitHub Actions. Do not assume Vercel. Keep production secrets in GitHub Actions secrets and the server environment.

```bash
docker compose -f docker-compose.prod.yml up -d --build
```
