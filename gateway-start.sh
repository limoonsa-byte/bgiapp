#!/bin/sh
set -eu

PORT_VALUE="${PORT:-18789}"
STATE_DIR="${OPENCLAW_STATE_DIR:-/home/node/.openclaw}"
WORKSPACE_DIR="${OPENCLAW_WORKSPACE_DIR:-$STATE_DIR/workspace}"
ORO_ORIGIN="${ORO_ALLOWED_ORIGIN:-https://oro-ai-office-rpg-live-lim-chihuns-projects.vercel.app}"
OAUTH_MARKER="$STATE_DIR/.oro-openai-device-login-complete"

mkdir -p "$STATE_DIR" "$WORKSPACE_DIR"

if [ -z "${OPENCLAW_GATEWAY_TOKEN:-}" ]; then
  echo "OPENCLAW_GATEWAY_TOKEN is required" >&2
  exit 1
fi

configure_gateway() {
  node dist/index.js config set --batch-json "[{\"path\":\"gateway.mode\",\"value\":\"local\"},{\"path\":\"gateway.bind\",\"value\":\"lan\"},{\"path\":\"gateway.controlUi.allowedOrigins\",\"value\":[\"$ORO_ORIGIN\"]},{\"path\":\"agents.defaults.model.primary\",\"value\":\"openai/gpt-5.6-sol\"}]"
}

run_gateway() {
  node dist/index.js gateway run \
    --allow-unconfigured \
    --auth token \
    --token "$OPENCLAW_GATEWAY_TOKEN" \
    --bind lan \
    --port "$PORT_VALUE"
}

configure_gateway

# Railway has no one-off interactive shell in this integration. For the first
# ChatGPT/Codex sign-in, keep the Gateway alive for health checks while the
# official OpenClaw headless device-code login runs beside it. The successful
# login is persisted on the mounted /home/node/.openclaw volume and never runs
# again after the marker is written.
if [ "${ORO_OPENAI_DEVICE_LOGIN:-0}" = "1" ] && [ ! -f "$OAUTH_MARKER" ]; then
  echo "[ORO] Starting temporary Gateway while waiting for ChatGPT device login"
  run_gateway &
  GATEWAY_PID=$!
  sleep 4

  echo "[ORO] OPENAI_DEVICE_LOGIN_BEGIN"
  if node dist/index.js models auth login --provider openai --device-code --set-default; then
    touch "$OAUTH_MARKER"
    echo "[ORO] OPENAI_DEVICE_LOGIN_COMPLETE"
  else
    echo "[ORO] OPENAI_DEVICE_LOGIN_FAILED" >&2
  fi

  kill "$GATEWAY_PID" 2>/dev/null || true
  wait "$GATEWAY_PID" 2>/dev/null || true
fi

echo "[ORO] Starting OpenClaw Gateway on port $PORT_VALUE"
exec node dist/index.js gateway run \
  --allow-unconfigured \
  --auth token \
  --token "$OPENCLAW_GATEWAY_TOKEN" \
  --bind lan \
  --port "$PORT_VALUE"
