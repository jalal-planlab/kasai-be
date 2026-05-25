#!/usr/bin/env bash

set -euo pipefail

IMAGE_NAME=${IMAGE_NAME:-kasai-backend}
CONTAINER_NAME=${CONTAINER_NAME:-kasai-backend-container}
PORT=${PORT:-7002}
ENV_FILE=".env"

# Read PORT from .env when present (keeps host mapping in sync with the app)
if [ -f "$ENV_FILE" ]; then
  while IFS='=' read -r key value || [ -n "$key" ]; do
    if [[ "$key" =~ ^#.* ]] || [[ -z "$key" ]]; then
      continue
    fi
    key=$(echo "$key" | xargs)
    value=$(echo "$value" | xargs)
    value="${value%\"}"
    value="${value#\"}"
    value="${value%\'}"
    value="${value#\'}"

    if [ "$key" = "PORT" ] && [ -n "$value" ]; then
      PORT="$value"
    fi
  done < "$ENV_FILE"
fi

echo "==> Building Docker image: ${IMAGE_NAME}"
docker build -t "${IMAGE_NAME}" .

echo "==> Stopping and removing any existing container: ${CONTAINER_NAME}"
if docker ps -a --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}\$"; then
  docker stop "${CONTAINER_NAME}" >/dev/null 2>&1 || true
  docker rm "${CONTAINER_NAME}" >/dev/null 2>&1 || true
fi

echo "==> Running container: ${CONTAINER_NAME} (host port ${PORT})"

if [ -f "$ENV_FILE" ]; then
  echo "    Using $ENV_FILE for container environment"
  docker run -d \
    --name "${CONTAINER_NAME}" \
    --env-file "$ENV_FILE" \
    -p "${PORT}:${PORT}" \
    "${IMAGE_NAME}"
else
  echo "    No $ENV_FILE found, running with defaults (PORT=${PORT})"
  docker run -d \
    --name "${CONTAINER_NAME}" \
    -e NODE_ENV=production \
    -e PORT="${PORT}" \
    -p "${PORT}:${PORT}" \
    "${IMAGE_NAME}"
fi

echo "==> Deployment complete. API available at http://localhost:${PORT}"
