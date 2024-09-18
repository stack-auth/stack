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
RUN corepack prepare pnpm --activate
RUN pnpm add -g turbo


# Prune stage
FROM base AS pruner

COPY . .

# https://turbo.build/repo/docs/guides/tools/docker
RUN turbo prune --scope=@stackframe/stack-dashboard --docker


# Build stage
FROM base AS builder

# copy over pruned files and install dependencies
COPY .gitignore .
COPY --from=pruner /app/out/json/ .
COPY --from=pruner /app/out/pnpm-lock.yaml .
COPY pnpm-workspace.yaml .
COPY turbo.json .
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile

COPY --from=pruner /app/out/full/ .

# The following values are required for the NextJS build, but they can/should all be overridden at runtime.
ENV NEXT_PUBLIC_STACK_URL_DEPRECATED=http://localhost:8101
ENV NEXT_PUBLIC_STACK_URL=http://localhost:8102
ENV NEXT_PUBLIC_STACK_SVIX_SERVER_URL=http://localhost:8113
ENV NEXT_PUBLIC_STACK_PROJECT_ID=internal
ENV NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY=this-publishable-client-key-is-for-local-development-only
ENV STACK_SECRET_SERVER_KEY=this-secret-server-key-is-for-local-development-only

# https://nextjs.org/docs/pages/api-reference/next-config-js/output
ENV NEXT_CONFIG_OUTPUT=standalone

RUN pnpm turbo run build --filter=@stackframe/stack-dashboard...


# Final stage
FROM node:${NODE_VERSION}-slim

WORKDIR /app

# Install packages needed for deployment
RUN apt-get update && \
    apt-get upgrade -y && \
    apt-get install -y openssl && \
    rm -rf /var/lib/apt/lists

# Copy built application
COPY --from=builder --chown=node:node /app/apps/dashboard/.next/standalone ./
COPY --from=builder --chown=node:node /app/apps/dashboard/.next/static ./apps/dashboard/.next/static
COPY --from=builder --chown=node:node /app/apps/dashboard/public ./apps/dashboard/public

ENV NODE_ENV=production

ENV PORT=8101
EXPOSE 8101

USER node

CMD ["node", "apps/dashboard/server.js"]
