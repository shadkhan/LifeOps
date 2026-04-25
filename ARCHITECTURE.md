# Architecture — LifeOps MVP

## Overview

LifeOps is a full-stack Next.js application using PostgreSQL and Prisma. AI features are powered by OpenAI API through server-side services.

## Architecture Style

Use a modular monolith for MVP.

Reason:

- Faster development
- Easier debugging
- Good enough for personal-use MVP
- Can split services later

## Main Layers

### UI Layer

Location:

```txt
/src/components
/src/app
```

## Infrastructure Architecture

Local development uses Docker containers for PostgreSQL and Redis.

Production deployment uses:

- Hetzner VPS
- Docker Compose
- GitHub Actions
- PostgreSQL container
- Redis container
- Next.js web container

## Redis Usage

Redis will be used for:

- Background jobs later
- Reminder queues later
- Rate limiting later
- Caching AI responses later

For MVP, Redis can be configured but not heavily used.
