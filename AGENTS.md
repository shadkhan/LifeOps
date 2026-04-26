# AGENTS.md — LifeOps Codex Instructions

## Project Name

LifeOps

## Product Vision

LifeOps is an AI-powered personal operating system that helps the user connect future self, goals, habits, tasks, notes, daily planning, and weekly review into one intelligent dashboard.

The core idea:
LifeOps should not only track activity. It should help the user understand whether daily actions are building the future self they want.

## MVP Modules

Build only these modules first:

1. Future Self
2. Goals
3. Habits
4. Tasks
5. Notes
6. Dashboard
7. AI Daily Planner
8. Weekly Review

Do not build Content Studio, Media Library, Projects, Browser Extension, Mobile App, or advanced automation in MVP.

## Tech Stack

Use:

- Next.js App Router
- TypeScript
- Tailwind CSS
- PostgreSQL
- Prisma ORM
- NextAuth or Clerk for authentication
- OpenAI API for AI features
- Zod for validation
- React Hook Form for forms
- Shadcn UI where useful

## Code Quality Rules

- Use TypeScript everywhere.
- Avoid `any` unless absolutely necessary.
- Use server actions or API routes consistently.
- Keep business logic outside UI components.
- Use reusable components.
- Use clear folder naming.
- Add loading, empty, and error states.
- Validate all inputs with Zod.
- Never expose API keys on the client.
- Keep AI prompts centralized in `/lib/ai/prompts`.

## UI Style

The UI should feel like a modern personal operating system.

Design principles:

- Clean
- Calm
- Premium
- Minimal
- Dashboard-first
- Mobile responsive
- Not cluttered

Use:

- Cards
- Soft borders
- Good spacing
- Clear hierarchy
- Progress indicators
- Daily focus section

## Data Relationships

Important relationships:

- A Future Self has many Life Areas.
- A Life Area has many Goals.
- A Goal can have many Habits.
- A Goal can have many Tasks.
- A Habit has many Habit Logs.
- A Task may belong to a Goal.
- A Note may be linked to a Goal, Habit, Task, or Life Area.
- Weekly Review summarizes goals, habits, tasks, and notes.

## AI Features for MVP

Only build these AI features:

1. Generate habits from a goal
2. Plan my day
3. Generate weekly review
4. Summarize note
5. Suggest next actions for a goal

## AI Safety Rules

- Do not make medical, financial, or legal decisions for the user.
- AI should provide suggestions, not commands.
- User must approve generated habits/tasks before saving.
- Do not send private user data to third-party APIs unless needed for the feature.
- Keep AI prompts simple, transparent, and auditable.

## Folder Structure Target

```txt
/src
  /app
    /(auth)
    /(dashboard)
    /api
  /components
    /ui
    /dashboard
    /future-self
    /goals
    /habits
    /tasks
    /notes
    /ai
  /lib
    /auth
    /db
    /ai
    /validators
    /utils
  /server
    /actions
    /services
  /types
/prisma
  schema.prisma
/docs
  PRD.md
  ARCHITECTURE.md
  SECURITY.md
  BEST-PRACTICES.md
```

## Infrastructure

Use Docker for local infrastructure.

Required containers:

- PostgreSQL
- Redis

The app should run locally with:

```bash
docker compose up -d
pnpm dev
```

## Phase 2 AI Layer Rules

The AI layer must support:

- Future Self generation
- Goals from Future Self
- Goal breakdown
- Habits from Goal
- Habit suggestions
- Note summarization
- Task creation
- Idea expansion
- Daily planner
- Weekly review

AI must always follow review-before-save.

Never auto-save AI-generated goals, habits, tasks, or plans unless user explicitly confirms.

All AI output must be:

- JSON structured
- Parsed safely
- Validated with Zod
- Displayed to the user for review

AI calls must be server-side only.

Fallback behavior is required when no AI provider is available.
