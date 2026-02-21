# -------------------------
# Dependencies
# -------------------------
FROM node:20-bullseye-slim AS deps
WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma

RUN npm ci

# -------------------------
# Build
# -------------------------
FROM deps AS build
WORKDIR /app

COPY tsconfig*.json ./
COPY src ./src

RUN npm run prisma:generate
RUN npm run build
RUN npm run build:seed
RUN npm prune --omit=dev

# -------------------------
# Runtime
# -------------------------
FROM node:20-bullseye-slim AS runtime
WORKDIR /app

ENV NODE_ENV=production

# Instalar libssl necessária para Prisma
RUN apt-get update && apt-get install -y --no-install-recommends     libssl1.1     && rm -rf /var/lib/apt/lists/*

COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY prisma ./prisma

CMD ["node", "dist/main.js"]
