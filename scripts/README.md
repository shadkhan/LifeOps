# LifeOps Local Runtime Scripts

These scripts make LifeOps easy to run as a daily local app without keeping a terminal tab occupied by `pnpm dev`.

They are intended for community developers who want a simple local “start, status, stop, restart” workflow.

## Why These Scripts Exist

The normal development command:

```bash
pnpm dev
```

is great for coding, but it usually runs on ports like `3000`, `3001`, or `3002`. That can get in the way when you are testing other Next.js, Vite, or local web apps.

These scripts run LifeOps in the background on a fixed non-standard port:

```txt
http://localhost:4317
```

This gives you a stable daily-use URL while keeping common dev ports free.

## Daily User Flow

### Start LifeOps

```bash
pnpm lifeops:start
```

This will:

- Start Docker infrastructure with `docker compose up -d`
- Generate the Prisma client
- Run database migrations
- Build the web app
- Start the production Next.js server in the background
- Store runtime logs and PID files in `.lifeops-runtime`

Open:

```txt
http://localhost:4317
```

### Check Status

```bash
pnpm lifeops:status
```

This shows:

- Whether the LifeOps app process is running
- The PID
- The local URL
- Whether port `4317` is in use
- Docker container status
- Recent app logs and errors

### Stop LifeOps App Only

```bash
pnpm lifeops:stop
```

This stops the background app process but keeps PostgreSQL and Redis running.

### Stop App And Infrastructure

```bash
pnpm lifeops:stop -- -StopInfra
```

This stops the app and also stops Docker infrastructure.

### Restart LifeOps

```bash
pnpm lifeops:restart
```

This stops the current background process and starts LifeOps again.

## Using A Different Port

If port `4317` is already in use:

```bash
pnpm lifeops:start -- -Port 4318
pnpm lifeops:status -- -Port 4318
```

## Faster Start After A Recent Build

If the app was already built and you only want to restart quickly:

```bash
pnpm lifeops:start -- -SkipBuild
```

Use the normal start command after code changes:

```bash
pnpm lifeops:start
```

## Runtime Files

The scripts write temporary runtime files to:

```txt
.lifeops-runtime/
```

Common files:

- `lifeops-app.pid`: background app process ID
- `lifeops-app.out.log`: app output logs
- `lifeops-app.err.log`: app error logs
- `lifeops-runner.ps1`: generated runner script used by the background process

This folder is ignored by Git.

## Troubleshooting

### App says it is not running

Run:

```bash
pnpm lifeops:status
```

If Docker is stopped, start again:

```bash
pnpm lifeops:start
```

### Port is already in use

Use a different port:

```bash
pnpm lifeops:start -- -Port 4318
```

### Old logs still show an error

Stop and restart:

```bash
pnpm lifeops:stop
pnpm lifeops:start
```

### Database changes are not applied

Run:

```bash
pnpm db:migrate
```

The normal `pnpm lifeops:start` command also runs migrations automatically.

## Script Files

- `lifeops-start.ps1`: starts Docker, prepares the database, builds the app, and runs LifeOps in the background
- `lifeops-status.ps1`: reports app, port, Docker, and log status
- `lifeops-stop.ps1`: stops the background app and optionally Docker infrastructure

