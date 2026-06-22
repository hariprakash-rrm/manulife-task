# ── Stage 1: Build Angular frontend ───────────────────────────────────────────
FROM node:22-alpine AS fe-builder
WORKDIR /fe
COPY frontend/package*.json ./
RUN --mount=type=cache,target=/root/.npm npm ci
COPY frontend/ .
RUN npm run build

# ── Stage 2: Build NestJS backend ─────────────────────────────────────────────
FROM node:22-alpine AS be-builder
WORKDIR /be
COPY backend/package*.json ./
RUN --mount=type=cache,target=/root/.npm npm ci
COPY backend/ .
RUN npm run build

# ── Stage 3: Single production container ──────────────────────────────────────
FROM node:22-slim

# --- Nginx + Redis + Supervisor + curl/gnupg (for MongoDB) ---
RUN apt-get update && apt-get install -y --no-install-recommends \
    nginx redis-server supervisor curl ca-certificates gnupg \
    && rm -rf /var/lib/apt/lists/*

# --- MongoDB 7 ---
RUN curl -fsSL https://www.mongodb.org/static/pgp/server-7.0.asc \
    | gpg -o /usr/share/keyrings/mongodb-server-7.0.gpg --dearmor \
    && echo "deb [ signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg ] \
       https://repo.mongodb.org/apt/debian bookworm/mongodb-org/7.0 main" \
    | tee /etc/apt/sources.list.d/mongodb-org-7.0.list \
    && apt-get update && apt-get install -y --no-install-recommends mongodb-org \
    && rm -rf /var/lib/apt/lists/*

# --- Directories ---
RUN mkdir -p /data/db /var/log/mongodb /var/log/supervisor \
    && chown -R mongodb:mongodb /data/db /var/log/mongodb

# --- Frontend static files ---
COPY --from=fe-builder /fe/dist/frontend/browser /usr/share/nginx/html

# --- Nginx config (proxy /api/ → localhost:3000) ---
COPY frontend/nginx.conf /etc/nginx/conf.d/app.conf
RUN rm -f /etc/nginx/sites-enabled/default

# --- NestJS backend ---
WORKDIR /app
COPY --from=be-builder /be/dist ./dist
COPY backend/package*.json ./
RUN --mount=type=cache,target=/root/.npm npm ci --omit=dev

# --- Process supervisor ---
COPY supervisord.conf /etc/supervisor/conf.d/app.conf

# Default env — override JWT secrets for production
ENV JWT_SECRET=change_me_in_production \
    JWT_REFRESH_SECRET=change_me_refresh_in_production

EXPOSE 80
VOLUME ["/data/db"]

CMD ["/usr/bin/supervisord", "-n", "-c", "/etc/supervisor/supervisord.conf"]
