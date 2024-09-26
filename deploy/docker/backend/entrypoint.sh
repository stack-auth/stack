#!/bin/bash

set -e

if [ "$STACK_SKIP_MIGRATIONS" != "true" ]; then
  echo "Running migrations..."
  prisma migrate deploy
else
  echo "Skipping migrations."
fi

if [ "$STACK_RUN_SEED_SCRIPT" = "true" ]; then
  echo "Running seed script..."
  node seed-self-host.js
else
  echo "Skipping seed script."
fi

# Run the main container command
exec "$@"
