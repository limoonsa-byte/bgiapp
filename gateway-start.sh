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

start_gateway_background() {
  node dist/index.js gateway run \
    --allow-unconfigured \
    --auth token \
    --token "$OPENCLAW_GATEWAY_TOKEN" \
    --bind lan \
    --port "$PORT_VALUE" &
  GATEWAY_PID=$!
}

stop_gateway_background() {
  if [ -n "${GATEWAY_PID:-}" ]; then
    kill -TERM "$GATEWAY_PID" 2>/dev/null || true
    wait "$GATEWAY_PID" 2>/dev/null || true
    unset GATEWAY_PID
    sleep 2
  fi
}

configure_gateway

# One-time ChatGPT/Codex OAuth bootstrap for Railway. `script` allocates the
# pseudo-TTY required by OpenClaw's device-code login while Railway logs remain
# readable. A temporary Gateway stays online so Railway health checks keep
# passing. The OAuth profile and completion marker live on the persistent
# /home/node/.openclaw volume.
if [ "${ORO_OPENAI_DEVICE_LOGIN:-0}" = "1" ] && [ ! -f "$OAUTH_MARKER" ]; then
  echo "[ORO] Starting temporary Gateway while waiting for ChatGPT device login"
  start_gateway_background
  sleep 5

  echo "[ORO] OPENAI_DEVICE_LOGIN_BEGIN"
  set +e
  script -qefc "node dist/index.js models auth login --provider openai --device-code --set-default" /dev/null
  LOGIN_STATUS=$?
  set -e

  if [ "$LOGIN_STATUS" -eq 0 ]; then
    touch "$OAUTH_MARKER"
    echo "[ORO] OPENAI_DEVICE_LOGIN_COMPLETE"
  else
    echo "[ORO] OPENAI_DEVICE_LOGIN_FAILED status=$LOGIN_STATUS" >&2
  fi

  stop_gateway_background
fi

echo "[ORO] Starting OpenClaw Gateway on port $PORT_VALUE"
exec node dist/index.js gateway run \
  --allow-unconfigured \
  --auth token \
  --token "$OPENCLAW_GATEWAY_TOKEN" \
  --bind lan \
  --port "$PORT_VALUE"
