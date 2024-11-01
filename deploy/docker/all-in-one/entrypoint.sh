#!/bin/bash

set -e

if [ "$STACK_RUN_MIGRATIONS" = "true" ]; then
  echo "Running migrations..."
  prisma migrate deploy --schema=./apps/backend/prisma/schema.prisma
else
  echo "Skipping migrations."
fi

if [ "$STACK_RUN_SEED_SCRIPT" = "true" ]; then
  echo "Running seed script..."
  cd apps/backend
  node seed-self-host.js
  cd ../..
else
  echo "Skipping seed script."
fi

# Start backend and dashboard in parallel
echo "Starting backend on port $BACKEND_PORT..."
PORT=8102 node apps/backend/server.js --port $BACKEND_PORT &

echo "Starting dashboard on port $DASHBOARD_PORT..."
PORT=8101 node apps/dashboard/server.js --port $DASHBOARD_PORT &

# Wait for both to finish
wait -n
