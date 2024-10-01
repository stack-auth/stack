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

# copy over package.json files and install dependencies
COPY --from=pruner /app/out/json/ .
COPY --from=pruner /app/out/pnpm-lock.yaml .
COPY .gitignore .
COPY pnpm-workspace.yaml .
COPY turbo.json .
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile

# copy over the rest of the code for the build
COPY --from=pruner /app/out/full/ .

# docs are currently required for the NextJS backend build, but won't exist in the final image
COPY docs ./docs

# Required for NextJS build. Should be overridden at runtime.
# check=skip=SecretsUsedInArgOrEnv
ENV STACK_SERVER_SECRET=secret

# https://nextjs.org/docs/pages/api-reference/next-config-js/output
ENV NEXT_CONFIG_OUTPUT=standalone

# Build the backend NextJS app
RUN pnpm turbo run build --filter=@stackframe/stack-backend...

# Build the self-hosting seed script
RUN cd apps/backend && pnpm build:self-host-seed-script

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

# Copy built application
COPY --from=builder --chown=node:node /app/apps/backend/.next/standalone ./
COPY --from=builder --chown=node:node /app/apps/backend/.next/static ./apps/backend/.next/static
COPY --from=builder --chown=node:node /app/apps/backend/prisma ./apps/backend/prisma
COPY --from=builder --chown=node:node /app/apps/backend/dist/seed-self-host.js ./apps/backend

WORKDIR /app/apps/backend

ENV NODE_ENV=production

ENV PORT=8102
EXPOSE 8102

COPY ./deploy/docker/backend/entrypoint.sh .

USER node

ENTRYPOINT ["./entrypoint.sh"]

CMD ["node", "server.js"]
