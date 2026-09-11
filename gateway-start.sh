#!/bin/sh
set -eu

PORT_VALUE="${PORT:-18789}"
ORO_ORIGIN="${ORO_ALLOWED_ORIGIN:-https://oro-ai-office-rpg-live-lim-chihuns-projects.vercel.app}"

if [ -z "${OPENCLAW_GATEWAY_TOKEN:-}" ]; then
  echo "OPENCLAW_GATEWAY_TOKEN is required" >&2
  exit 1
fi

# Keep Railway focused on one responsibility: run the official OpenClaw Gateway.
# Provider/model authentication is managed by OpenClaw itself, not by this wrapper.
node dist/index.js config set --batch-json "[{\"path\":\"gateway.mode\",\"value\":\"local\"},{\"path\":\"gateway.bind\",\"value\":\"lan\"},{\"path\":\"gateway.controlUi.allowedOrigins\",\"value\":[\"$ORO_ORIGIN\"]}]"

echo "[ORO] Starting official OpenClaw Gateway on port $PORT_VALUE"
exec node dist/index.js gateway run \
  --allow-unconfigured \
  --auth token \
  --token "$OPENCLAW_GATEWAY_TOKEN" \
  --bind lan \
  --port "$PORT_VALUE"
