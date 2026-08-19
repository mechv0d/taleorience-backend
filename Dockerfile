# syntax=docker/dockerfile:1

# ---------- build stage ----------
FROM node:22-slim AS build
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
ENV CI=true
RUN corepack enable
RUN apt-get update && apt-get install -y --no-install-recommends python3 make g++ \
    && rm -rf /var/lib/apt/lists/*
WORKDIR /app

COPY tsconfig.base.json tsconfig.json ./
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/domain/package.json packages/domain/package.json
COPY packages/contracts/package.json packages/contracts/package.json
COPY packages/application/package.json packages/application/package.json
COPY packages/infrastructure/package.json packages/infrastructure/package.json
COPY apps/api/package.json apps/api/package.json
RUN pnpm install --frozen-lockfile

COPY packages packages
COPY apps/api apps/api
COPY locales locales
RUN pnpm -r --if-present build

RUN pnpm --filter @taleorience/api --prod deploy --legacy /app/deploy

# ---------- runtime stage ----------
FROM node:22-slim AS runtime
ENV NODE_ENV=production
ENV PORT=4000
ENV APP_MODE=local
ENV AUTH_MODE=none
ENV DATABASE_URL=sqlite://./data/taleorience.db
ENV STORAGE_DRIVER=local
ENV STORAGE_ROOT=./storage
ENV LOCALES_ROOT=/app/locales
WORKDIR /app

COPY --from=build /app/deploy /app
COPY --from=build /app/locales /app/locales

RUN mkdir -p /app/data /app/storage

EXPOSE 4000
CMD ["node", "dist/main.js"]