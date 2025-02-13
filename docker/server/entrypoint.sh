#!/bin/bash

set -e

export STACK_SEED_INTERNAL_PROJECT_PUBLISHABLE_CLIENT_KEY=$(openssl rand -base64 32)
export STACK_SEED_INTERNAL_PROJECT_SECRET_SERVER_KEY=$(openssl rand -base64 32)
export STACK_SEED_INTERNAL_PROJECT_SUPER_SECRET_ADMIN_KEY=$(openssl rand -base64 32)

export NEXT_PUBLIC_STACK_PROJECT_ID=internal
export NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY=${STACK_SEED_INTERNAL_PROJECT_PUBLISHABLE_CLIENT_KEY}
export STACK_SECRET_SERVER_KEY=${STACK_SEED_INTERNAL_PROJECT_SECRET_SERVER_KEY}
export STACK_SUPER_SECRET_ADMIN_KEY=${STACK_SEED_INTERNAL_PROJECT_SUPER_SECRET_ADMIN_KEY}

export NEXT_PUBLIC_CLIENT_STACK_DASHBOARD_URL=${NEXT_PUBLIC_STACK_DASHBOARD_URL}
export NEXT_PUBLIC_SERVER_STACK_DASHBOARD_URL="http://localhost:8101"
export NEXT_PUBLIC_CLIENT_STACK_API_URL=${NEXT_PUBLIC_STACK_API_URL}
export NEXT_PUBLIC_SERVER_STACK_API_URL="http://localhost:8102"

if [ -z "${NEXT_PUBLIC_STACK_SVIX_SERVER_URL}" ]; then
  export NEXT_PUBLIC_STACK_SVIX_SERVER_URL=${STACK_SVIX_SERVER_URL}
fi

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

# Replace env var sentinel in dashboard build output
declare -A replacements=(
  ["STACK_ENV_VAR_SENTINEL_USE_INLINE_ENV_VARS"]="true"
  ["STACK_ENV_VAR_SENTINEL_NEXT_PUBLIC_STACK_API_URL"]="${NEXT_PUBLIC_STACK_API_URL}"
  ["STACK_ENV_VAR_SENTINEL_NEXT_PUBLIC_CLIENT_STACK_API_URL"]="${NEXT_PUBLIC_CLIENT_STACK_API_URL}"
  ["STACK_ENV_VAR_SENTINEL_NEXT_PUBLIC_SERVER_STACK_API_URL"]="${NEXT_PUBLIC_SERVER_STACK_API_URL}"
  ["STACK_ENV_VAR_SENTINEL_NEXT_PUBLIC_STACK_DASHBOARD_URL"]="${NEXT_PUBLIC_STACK_DASHBOARD_URL}"
  ["STACK_ENV_VAR_SENTINEL_NEXT_PUBLIC_CLIENT_STACK_DASHBOARD_URL"]="${NEXT_PUBLIC_CLIENT_STACK_DASHBOARD_URL}"
  ["STACK_ENV_VAR_SENTINEL_NEXT_PUBLIC_SERVER_STACK_DASHBOARD_URL"]="${NEXT_PUBLIC_SERVER_STACK_DASHBOARD_URL}"
  ["STACK_ENV_VAR_SENTINEL_NEXT_PUBLIC_POSTHOG_KEY"]="${NEXT_PUBLIC_POSTHOG_KEY}"
  ["STACK_ENV_VAR_SENTINEL_NEXT_PUBLIC_STACK_SVIX_SERVER_URL"]="${NEXT_PUBLIC_STACK_SVIX_SERVER_URL}"
  ["STACK_ENV_VAR_SENTINEL_NEXT_PUBLIC_SENTRY_DSN"]="${NEXT_PUBLIC_SENTRY_DSN}"
  ["STACK_ENV_VAR_SENTINEL_NEXT_PUBLIC_VERSION_ALERTER_SEVERE_ONLY"]="${NEXT_PUBLIC_VERSION_ALERTER_SEVERE_ONLY}"
  ["STACK_ENV_VAR_SENTINEL_NEXT_PUBLIC_STACK_EMULATOR_ENABLED"]="${NEXT_PUBLIC_STACK_EMULATOR_ENABLED}"
  ["STACK_ENV_VAR_SENTINEL_NEXT_PUBLIC_STACK_EMULATOR_PROJECT_ID"]="${NEXT_PUBLIC_STACK_EMULATOR_PROJECT_ID}"
  ["STACK_ENV_VAR_SENTINEL_NEXT_PUBLIC_STACK_PROJECT_ID"]="${NEXT_PUBLIC_STACK_PROJECT_ID}"
  ["STACK_ENV_VAR_SENTINEL_NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY"]="${NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY}"
  ["STACK_ENV_VAR_SENTINEL_NEXT_PUBLIC_STACK_URL"]="${NEXT_PUBLIC_STACK_URL}"
)

# Check for any unhandled sentinel values
unhandled_sentinels=$(find /app/apps -type f -exec grep -l "STACK_ENV_VAR_SENTINEL" {} + | xargs grep -h "STACK_ENV_VAR_SENTINEL" | grep -o "STACK_ENV_VAR_SENTINEL[^\"']*" | tr -d '\\' | sort -u | grep -v "^STACK_ENV_VAR_SENTINEL$")

for sentinel in $unhandled_sentinels; do
  if [[ ! " ${!replacements[@]} " =~ " ${sentinel} " ]]; then
    echo "Error: Found unhandled sentinel value: ${sentinel}"
    exit 1
  fi
done

for key in "${!replacements[@]}"; do
  value="${replacements[$key]}"
  # Escape special characters in both key and value
  escaped_key=$(printf '%s\n' "$key" | sed 's/[[\.*^$/]/\\&/g')
  escaped_value=$(printf '%s\n' "$value" | sed 's/[[\.*^$/]/\\&/g')
  find /app/apps -type f -exec sed -i "s/$escaped_key/$escaped_value/g" {} +
done

# Start backend and dashboard in parallel
echo "Starting backend on port $BACKEND_PORT..."
PORT=$BACKEND_PORT HOSTNAME=0.0.0.0 node apps/backend/server.js &

echo "Starting dashboard on port $DASHBOARD_PORT..."
PORT=$DASHBOARD_PORT HOSTNAME=0.0.0.0 node apps/dashboard/server.js &

# Wait for both to finish
wait -n
