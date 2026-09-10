#!/bin/sh
set -eu

PORT_VALUE="${PORT:-18789}"
STATE_DIR="${OPENCLAW_STATE_DIR:-/home/node/.openclaw}"
CONFIG_PATH="${OPENCLAW_CONFIG_PATH:-$STATE_DIR/openclaw.json}"
WORKSPACE_DIR="${OPENCLAW_WORKSPACE_DIR:-$STATE_DIR/workspace}"
ORO_ORIGIN="${ORO_ALLOWED_ORIGIN:-https://oro-ai-office-rpg-live-lim-chihuns-projects.vercel.app}"

mkdir -p "$STATE_DIR" "$WORKSPACE_DIR"

if [ -z "${OPENCLAW_GATEWAY_TOKEN:-}" ]; then
  echo "OPENCLAW_GATEWAY_TOKEN is required" >&2
  exit 1
fi

if [ -z "${OPENAI_API_KEY:-}" ]; then
  echo "OPENAI_API_KEY is required for the initial AI provider setup" >&2
  exit 1
fi

if [ ! -s "$CONFIG_PATH" ]; then
  echo "[ORO] First boot: initializing OpenClaw"
  node dist/index.js onboard \
    --non-interactive \
    --accept-risk \
    --skip-health \
    --mode local \
    --auth-choice openai-api-key \
    --secret-input-mode ref \
    --gateway-auth token \
    --gateway-token-ref-env OPENCLAW_GATEWAY_TOKEN \
    --skip-channels \
    --no-install-daemon
fi

node dist/index.js config set --batch-json "[{\"path\":\"gateway.mode\",\"value\":\"local\"},{\"path\":\"gateway.bind\",\"value\":\"lan\"},{\"path\":\"gateway.controlUi.allowedOrigins\",\"value\":[\"$ORO_ORIGIN\"]}]"

echo "[ORO] Starting OpenClaw Gateway on port $PORT_VALUE"
exec node dist/index.js gateway --bind lan --port "$PORT_VALUE"
