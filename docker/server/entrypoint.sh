#!/bin/bash

set -e

export STACK_SEED_INTERNAL_PROJECT_PUBLISHABLE_CLIENT_KEY=$(openssl rand -base64 32)
export STACK_SEED_INTERNAL_PROJECT_SECRET_SERVER_KEY=$(openssl rand -base64 32)
export STACK_SEED_INTERNAL_PROJECT_SUPER_SECRET_ADMIN_KEY=$(openssl rand -base64 32)

export NEXT_PUBLIC_STACK_PROJECT_ID=internal
export NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY=${STACK_SEED_INTERNAL_PROJECT_PUBLISHABLE_CLIENT_KEY}
export STACK_SECRET_SERVER_KEY=${STACK_SEED_INTERNAL_PROJECT_SECRET_SERVER_KEY}
export STACK_SUPER_SECRET_ADMIN_KEY=${STACK_SEED_INTERNAL_PROJECT_SUPER_SECRET_ADMIN_KEY}

if [ "$STACK_SKIP_MIGRATIONS" = "true" ]; then
  echo "Skipping migrations."
else
  echo "Running migrations..."
  prisma migrate deploy --schema=./apps/backend/prisma/schema.prisma
fi

if [ "$STACK_SKIP_SEED_SCRIPT" = "true" ]; then
  echo "Skipping seed script."
else
  echo "Running seed script..."
  cd apps/backend
  node seed.js
  cd ../..
fi

# Start backend and dashboard in parallel
echo "Starting backend on port $BACKEND_PORT..."
PORT=$BACKEND_PORT HOSTNAME=0.0.0.0 node apps/backend/server.js &

echo "Starting dashboard on port $DASHBOARD_PORT..."
PORT=$DASHBOARD_PORT HOSTNAME=0.0.0.0 node apps/dashboard/server.js &

# Wait for both to finish
wait -n
