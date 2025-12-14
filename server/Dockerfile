# Build stage
FROM node:20-alpine AS builder

# Install pnpm with specific version
RUN corepack enable && corepack prepare pnpm@9.4.0 --activate

WORKDIR /usr/src

# Copy package files
COPY package.json pnpm-lock.yaml ./
COPY prisma ./prisma/

# Set up production schema and migrations
RUN cp prisma/schema.prod.prisma prisma/schema.prisma && \
    if [ -d "prisma/migrations-prod" ]; then \
    mkdir -p prisma/migrations && \
    cp -r prisma/migrations-prod/* prisma/migrations/; \
    fi

# Install dependencies with force flag to handle lockfile
RUN pnpm install --frozen-lockfile

# Copy source code (excluding files in .dockerignore)
COPY . .

# Generate Prisma Client
RUN pnpm prisma generate

# Build application
RUN pnpm build

# Production stage
FROM node:20-alpine AS runner

# Install dependencies required for Prisma
RUN apk add --no-cache \
    openssl \
    libc6-compat \
    curl

# Install pnpm with specific version
RUN corepack enable && corepack prepare pnpm@9.4.0 --activate

WORKDIR /usr/src

# Copy necessary files from builder
COPY --from=builder /usr/src/package.json ./
COPY --from=builder /usr/src/pnpm-lock.yaml ./
COPY --from=builder /usr/src/.next ./.next
COPY --from=builder /usr/src/public ./public
COPY --from=builder /usr/src/prompts ./prompts
COPY --from=builder /usr/src/messages ./messages
COPY --from=builder /usr/src/prisma ./prisma
COPY --from=builder /usr/src/node_modules ./node_modules
COPY --from=builder /usr/src/scripts/docker-entrypoint.sh /usr/local/bin/

# Ensure we use the production schema and migrations
RUN cp prisma/schema.prod.prisma prisma/schema.prisma && \
    if [ -d "prisma/migrations-prod" ]; then \
    mkdir -p prisma/migrations && \
    cp -r prisma/migrations-prod/* prisma/migrations/; \
    fi

# Generate Prisma Client
RUN pnpm prisma generate

# Copy and setup entrypoint script with explicit Unix line endings
RUN chmod +x /usr/local/bin/docker-entrypoint.sh && \
    sed -i 's/\r$//' /usr/local/bin/docker-entrypoint.sh

# Expose port
EXPOSE 3000

# Set only the required NODE_ENV
ENV NODE_ENV=production

# Add health check configuration
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:3000/api/health || exit 1

# Run the entrypoint script
CMD ["/usr/local/bin/docker-entrypoint.sh"]
