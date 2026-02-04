# -------------------------
# Dependencies
# -------------------------
FROM node:20-bookworm-slim AS deps
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
FROM node:20-bookworm-slim AS runtime
WORKDIR /app

ENV NODE_ENV=production

COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY prisma ./prisma

CMD ["node", "dist/main.js"]
