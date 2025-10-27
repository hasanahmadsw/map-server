# ===============================
# Stage 1: Build the application
# ===============================
FROM node:22-alpine AS builder

WORKDIR /app

RUN corepack enable && corepack prepare pnpm@latest --activate

COPY package.json pnpm-lock.yaml ./

RUN pnpm install --frozen-lockfile

COPY . .

RUN NODE_OPTIONS="--max-old-space-size=4096" pnpm run build

# ===============================
# Stage 2: Production image
# ===============================
FROM node:22-alpine

WORKDIR /app

RUN npm install -g pnpm

COPY package.json pnpm-lock.yaml ./

RUN pnpm install --frozen-lockfile --prod

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/env ./env

ENV NODE_ENV=production
ENV NODE_OPTIONS=--experimental-global-webcrypto

EXPOSE 80

CMD ["node", "dist/main.js"]
