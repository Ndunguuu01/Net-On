# ============================================
# Net-On API — Production Dockerfile
# ============================================
# Multi-stage build for minimal production image
# ============================================

# --- Stage 1: Build ---
FROM node:22-alpine AS builder

WORKDIR /app

# Copy workspace root files
COPY package.json package-lock.json turbo.json ./
COPY tsconfig.base.json ./

# Copy package manifests for all workspaces
COPY apps/api/package.json ./apps/api/
COPY packages/shared/package.json ./packages/shared/
COPY packages/types/package.json ./packages/types/
COPY packages/config/package.json ./packages/config/

# Install dependencies
RUN npm ci --workspace=apps/api --include-workspace-root

# Copy source code
COPY apps/api/ ./apps/api/
COPY packages/ ./packages/

# Generate Prisma client
RUN npx prisma generate --schema=apps/api/prisma/schema.prisma

# Build the API
RUN npm run build --workspace=apps/api

# --- Stage 2: Production ---
FROM node:22-alpine AS production

WORKDIR /app

ENV NODE_ENV=production

# Install security updates
RUN apk update && apk upgrade && apk add --no-cache dumb-init

# Copy built artifacts
COPY --from=builder /app/apps/api/dist ./dist
COPY --from=builder /app/apps/api/prisma ./prisma
COPY --from=builder /app/apps/api/package.json ./
COPY --from=builder /app/node_modules ./node_modules

# Create non-root user
RUN addgroup -g 1001 -S neton && \
    adduser -S neton -u 1001 -G neton

USER neton

EXPOSE 3001

# Use dumb-init to handle PID 1 properly
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/main.js"]
