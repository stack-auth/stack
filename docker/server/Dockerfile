ARG NODE_VERSION=22.9.0

# Base
FROM node:${NODE_VERSION} AS base

WORKDIR /app

RUN apt-get update && \
    apt-get upgrade -y && \
    rm -rf /var/lib/apt/lists

ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH

RUN corepack enable
RUN corepack prepare pnpm@10.0.0 --activate
RUN pnpm add -g turbo


# Prune stage
FROM base AS pruner

COPY . .

# https://turbo.build/repo/docs/guides/tools/docker
RUN turbo prune --scope=@stackframe/stack-backend --scope=@stackframe/stack-dashboard --docker


# Build stage
FROM base AS builder

# copy over package.json files and install dependencies
COPY --from=pruner /app/out/json/ .
COPY --from=pruner /app/out/pnpm-lock.yaml .
COPY .gitignore .
COPY pnpm-workspace.yaml .
COPY turbo.json .
RUN cat ./pnpm-lock.yaml
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile

# copy over the rest of the code for the build
COPY --from=pruner /app/out/full/ .

# docs are currently required for the NextJS backend build, but won't exist in the final image
COPY docs ./docs

# https://nextjs.org/docs/pages/api-reference/next-config-js/output
ENV NEXT_CONFIG_OUTPUT=standalone

# Build the backend NextJS app
RUN pnpm turbo run docker-build --filter=@stackframe/stack-backend... --filter=@stackframe/stack-dashboard...

# Build the self-host seed script
RUN cd apps/backend && pnpm build-self-host-seed-script

# Final image
FROM node:${NODE_VERSION}-slim

WORKDIR /app

# Install packages needed for deployment
RUN apt-get update && \
    apt-get upgrade -y && \
    apt-get install -y openssl && \
    rm -rf /var/lib/apt/lists

# Install Prisma CLI globally so we can run migrations on startup
RUN npm i -g prisma

# Copy built backend
COPY --from=builder --chown=node:node /app/apps/backend/.next/standalone ./
COPY --from=builder --chown=node:node /app/apps/backend/.next/static ./apps/backend/.next/static
COPY --from=builder --chown=node:node /app/apps/backend/prisma ./apps/backend/prisma
COPY --from=builder --chown=node:node /app/apps/backend/dist/seed.js ./apps/backend

# Copy built dashboard
COPY --from=builder --chown=node:node /app/apps/dashboard/.next/standalone ./
COPY --from=builder --chown=node:node /app/apps/dashboard/.next/static ./apps/dashboard/.next/static
COPY --from=builder --chown=node:node /app/apps/dashboard/public ./apps/dashboard/public

WORKDIR /app

# Define environment variables for both services
ENV NODE_ENV=production
ENV BACKEND_PORT=8102
ENV DASHBOARD_PORT=8101

USER node

# Set entrypoint to run both backend and dashboard
ENTRYPOINT ["/bin/bash", "-c", "\
  set -e; \
  \
  # Generate random keys at runtime \
  export STACK_SEED_INTERNAL_PROJECT_PUBLISHABLE_CLIENT_KEY=$(openssl rand -base64 32); \
  export STACK_SEED_INTERNAL_PROJECT_SECRET_SERVER_KEY=$(openssl rand -base64 32); \
  export STACK_SEED_INTERNAL_PROJECT_SUPER_SECRET_ADMIN_KEY=$(openssl rand -base64 32); \
  \
  # Set additional environment variables \
  export NEXT_PUBLIC_STACK_PROJECT_ID=internal; \
  export NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY=${STACK_SEED_INTERNAL_PROJECT_PUBLISHABLE_CLIENT_KEY}; \
  export STACK_SECRET_SERVER_KEY=${STACK_SEED_INTERNAL_PROJECT_SECRET_SERVER_KEY}; \
  export STACK_SUPER_SECRET_ADMIN_KEY=${STACK_SEED_INTERNAL_PROJECT_SUPER_SECRET_ADMIN_KEY}; \
  \
  # Run migrations unless skipped \
  if [ \"$STACK_SKIP_MIGRATIONS\" = \"true\" ]; then \
    echo \"Skipping migrations.\"; \
  else \
    echo \"Running migrations...\"; \
    prisma migrate deploy --schema=./apps/backend/prisma/schema.prisma; \
  fi; \
  \
  # Run seed script unless skipped \
  if [ \"$STACK_SKIP_SEED_SCRIPT\" = \"true\" ]; then \
    echo \"Skipping seed script.\"; \
  else \
    echo \"Running seed script...\"; \
    cd apps/backend; \
    node seed.js; \
    cd ../..; \
  fi; \
  \
  # Start the backend server in the background \
  echo \"Starting backend on port $BACKEND_PORT...\"; \
  PORT=$BACKEND_PORT HOSTNAME=0.0.0.0 node apps/backend/server.js & \
  \
  # Start the dashboard server in the background \
  echo \"Starting dashboard on port $DASHBOARD_PORT...\"; \
  PORT=$DASHBOARD_PORT HOSTNAME=0.0.0.0 node apps/dashboard/server.js & \
  \
  # Wait for any process to exit \
  wait -n \
"]
