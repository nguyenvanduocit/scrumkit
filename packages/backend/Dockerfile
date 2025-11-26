FROM oven/bun:1-alpine AS builder

WORKDIR /app

# Copy root workspace files
COPY package.json bun.lock* ./
COPY packages/models ./packages/models
COPY packages/backend ./packages/backend

# Install dependencies
RUN bun install

# Build backend
WORKDIR /app/packages/backend
RUN bun run build

# Production image
FROM oven/bun:1-alpine

WORKDIR /app

COPY --from=builder /app/packages/backend/dist ./dist
COPY --from=builder /app/packages/backend/package.json ./

EXPOSE 7001

HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:7001/ || exit 1

CMD ["bun", "run", "dist/index.js"]
