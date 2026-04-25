# Deployment — LifeOps

## Target

LifeOps will be deployed to a Hetzner VPS using Docker Compose and GitHub Actions.

## Production Services

- Next.js web app
- PostgreSQL
- Redis
- Reverse proxy: Caddy or Nginx

## Deployment Flow

```txt
Push to main
→ GitHub Actions runs checks
→ Build Docker image
→ SSH into Hetzner
→ Pull latest code/image
→ Run docker compose up -d
→ Run database migrations
```
