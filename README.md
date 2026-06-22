# Portfolio Management Dashboard

Full-stack portfolio tracker: NestJS API + Angular SPA, bundled into a **single Docker container** with MongoDB, Redis, and Nginx all managed by Supervisor.

## Stack

| Layer    | Technology              |
|----------|-------------------------|
| Frontend | Angular 21 + TypeScript |
| Backend  | NestJS 11 + TypeScript  |
| Database | MongoDB 7               |
| Cache    | Redis 7                 |
| Server   | Nginx (reverse proxy)   |
| Runtime  | Node.js 22              |

---

## Clone This Repo

```bash
git clone https://github.com/hariprakash-rrm/manulife-task.git
cd manulife-task
```

## Next Steps

1. Start the full app with Docker:

```bash
docker compose up --build
```

2. Open the app at `http://localhost`.
3. If you need custom JWT values, set `JWT_SECRET` and `JWT_REFRESH_SECRET` before starting, or place them in a `.env` file in the project root.
4. For local development without Docker, start MongoDB + Redis with `docker compose -f docker-compose.dev.yml up -d`, then run the backend and frontend separately.

---

## Run with a single command

```bash
docker compose up --build
```

Open **http://localhost** — that's it.

- Frontend (Angular SPA): `http://localhost`
- API (proxied through Nginx): `http://localhost/api/`

> **JWT secrets** default to placeholder values. For production, set them before running:
> ```bash
> JWT_SECRET=your_secret JWT_REFRESH_SECRET=your_refresh_secret docker compose up --build
> ```
> Or create a `.env` file in the project root:
> ```
> JWT_SECRET=your_secret
> JWT_REFRESH_SECRET=your_refresh_secret
> ```

MongoDB data is persisted in a Docker named volume (`mongo-data`) and survives container restarts.

### Rate Limiting

The API is globally rate-limited via a `ThrottlerGuard` configured in `app.module.ts`:
- **Limit**: `200` requests
- **Window (TTL)**: `60` seconds (1 minute)

If a user exceeds 200 requests within a single minute, the API returns a `429 Too Many Requests` status code. The frontend intercepts this globally and displays a friendly toast error asking the user to wait until the next minute before trying again.

---

## What's inside the single container

```
┌──────────────────────────────────┐
│         Docker Container         │
│                                  │
│  Nginx :80                       │
│  ├── / → Angular static files    │
│  └── /api/ → NestJS :3000        │
│                                  │
│  NestJS (Node.js) :3000          │
│  MongoDB :27017 (127.0.0.1)      │
│  Redis   :6379  (127.0.0.1)      │
│                                  │
│  Supervisor manages all 4        │
└──────────────────────────────────┘
```

All processes are managed by **supervisord**. MongoDB starts first, then Redis, then NestJS (with auto-retry until Mongo is ready), then Nginx.

---

## Local Development (without Docker)

```bash
# 1 — Start MongoDB + Redis only
docker compose -f docker-compose.dev.yml up -d

# 2 — Backend (new terminal)
cd backend
npm install
npm run start:dev      # http://localhost:3000

# 3 — Frontend (new terminal)
cd frontend
npm install
npm start              # http://localhost:4200

# 4 — Unit Tests (new terminal)
cd frontend
npm run test           # Runs all 33 unit tests using Vitest
```

---

## Project Structure

```
portfolio-dashboard/
├── Dockerfile             Single-container multi-stage build
├── supervisord.conf       Process manager (MongoDB, Redis, NestJS, Nginx)
├── docker-compose.yml     One command: docker compose up --build
├── docker-compose.dev.yml Dev: DB + Redis only (local Node dev)
├── backend/               NestJS API
│   ├── src/
│   └── Dockerfile         (used by single-container build)
├── frontend/              Angular SPA
│   ├── src/
│   ├── nginx.conf         Nginx config (proxies /api/ → 127.0.0.1:3000)
│   └── Dockerfile         (used by single-container build)
└── .nvmrc                 Node 22
```

---

## Git Commit Convention

| Prefix | Purpose |
|--------|---------|
| `feat(scope): msg` | New feature |
| `fix(scope): msg`  | Bug fix |
| `test(scope): msg` | Tests |
| `chore: msg`       | Tooling / config |
| `docs: msg`        | Documentation |
