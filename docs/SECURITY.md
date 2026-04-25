---

# 5. `SECURITY.md`

````md
# Security — LifeOps

## Principles

LifeOps stores sensitive personal life data. Security and privacy are core requirements.

## Rules

- Never expose API keys to the browser.
- All OpenAI calls must happen server-side.
- Every database query must be scoped to the authenticated user.
- Validate all user input with Zod.
- Do not log private journal, notes, or goal content in production.
- Use environment variables for secrets.
- Use HTTPS in production.
- Use least-privilege database credentials.

## AI Privacy

Before sending data to AI:

- Send only required context.
- Avoid sending unnecessary private notes.
- Prefer summaries where possible.
- Let user trigger AI actions explicitly.

## Authentication

Use a trusted auth provider such as:

- Clerk
- NextAuth
- Supabase Auth

## Authorization

Every record must belong to a user.

Required pattern:

```ts
where: {
  id,
  userId: session.user.id
}
```
````

## Deployment Security

- Never commit `.env` files.
- Use GitHub Actions secrets for production environment variables.
- Use SSH keys for Hetzner deployment.
- Restrict database and Redis ports from public internet.
- PostgreSQL and Redis should only be accessible inside the Docker network.
- Use firewall rules on Hetzner.
- Use HTTPS with a reverse proxy such as Caddy, Nginx, or Traefik.
- Rotate secrets if exposed.
