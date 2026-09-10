#!/bin/sh
set -eu

PORT_VALUE="${PORT:-18789}"
STATE_DIR="${OPENCLAW_STATE_DIR:-/home/node/.openclaw}"
WORKSPACE_DIR="${OPENCLAW_WORKSPACE_DIR:-$STATE_DIR/workspace}"
ORO_ORIGIN="${ORO_ALLOWED_ORIGIN:-https://oro-ai-office-rpg-live-lim-chihuns-projects.vercel.app}"

mkdir -p "$STATE_DIR" "$WORKSPACE_DIR"

if [ -z "${OPENCLAW_GATEWAY_TOKEN:-}" ]; then
  echo "OPENCLAW_GATEWAY_TOKEN is required" >&2
  exit 1
fi

# Keep the gateway bootable before model authentication is added. This lets us
# deploy first, then connect ChatGPT/OpenAI OAuth or an API key without rebuilding.
node dist/index.js config set --batch-json "[{\"path\":\"gateway.mode\",\"value\":\"local\"},{\"path\":\"gateway.bind\",\"value\":\"lan\"},{\"path\":\"gateway.controlUi.allowedOrigins\",\"value\":[\"$ORO_ORIGIN\"]}]"

echo "[ORO] Starting OpenClaw Gateway on port $PORT_VALUE"
exec node dist/index.js gateway run \
  --allow-unconfigured \
  --auth token \
  --token "$OPENCLAW_GATEWAY_TOKEN" \
  --bind lan \
  --port "$PORT_VALUE"
