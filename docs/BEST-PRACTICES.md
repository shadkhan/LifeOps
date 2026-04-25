---

# 6. `BEST-PRACTICES.md`

```md
# Best Practices — LifeOps

## Product

- Build MVP first.
- Avoid feature creep.
- Every feature should support future self, goals, habits, tasks, notes, planning, or review.
- Prefer useful over fancy.

## Engineering

- Use TypeScript strictly.
- Use Zod validation.
- Keep AI prompts centralized.
- Keep database access server-side.
- Avoid large components.
- Reuse UI components.
- Add empty states.
- Add loading states.
- Add error states.

## AI

- AI should suggest, not decide.
- User should approve AI-generated tasks or habits.
- Use structured JSON outputs where possible.
- Keep prompts versioned.
- Avoid sending unnecessary data to AI.

## UX

- Dashboard should be the center.
- Make daily check-in fast.
- Make habit completion one-click.
- Make goal progress visible.
- Avoid overwhelming the user.

## Development

Build in this sequence:

1. Schema
2. Auth
3. CRUD modules
4. Dashboard
5. AI features
6. Reports
7. Polish
```

## DevOps

- Use Docker Compose for local services.
- Keep app, database, and Redis configuration environment-based.
- Do not hardcode database URLs.
- Use migrations for schema changes.
- Use GitHub Actions for lint, typecheck, test, build, and deploy.
- Keep production secrets only in GitHub Secrets and server `.env`.
