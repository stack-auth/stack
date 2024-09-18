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
RUN turbo prune --scope=@stackframe/stack-backend --docker


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
COPY docs ./docs

# Required for NextJS build. Should be overridden at runtime.
ENV STACK_SERVER_SECRET=secret

RUN pnpm turbo run build --filter=@stackframe/stack-backend...

# Final stage
FROM node:${NODE_VERSION}-slim

WORKDIR /app

# Install packages needed for deployment
RUN apt-get update && \
    apt-get upgrade -y && \
    apt-get install -y openssl && \
    rm -rf /var/lib/apt/lists

ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH

RUN corepack enable
RUN corepack prepare pnpm --activate
RUN pnpm add -g turbo

# Copy built application
COPY --from=builder --chown=node:node /app .

WORKDIR /app/apps/backend

ENV NODE_ENV=production

ENV PORT=8102
EXPOSE 8102

COPY ./deploy/docker/backend/entrypoint.sh .

USER node

ENTRYPOINT ["./entrypoint.sh"]

CMD ["pnpm", "start"]
