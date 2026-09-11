#!/bin/sh
set -eu

PORT_VALUE="${PORT:-18789}"
STATE_DIR="${OPENCLAW_STATE_DIR:-/home/node/.openclaw}"
WORKSPACE_DIR="${OPENCLAW_WORKSPACE_DIR:-$STATE_DIR/workspace}"
ORO_ORIGIN="${ORO_ALLOWED_ORIGIN:-https://oro-ai-office-rpg-live-lim-chihuns-projects.vercel.app}"
OAUTH_MARKER="$STATE_DIR/.oro-openai-oauth-complete"
OAUTH_LOG="$STATE_DIR/oro-openai-oauth.log"
OAUTH_FIFO="/tmp/oro-openai-oauth-in"
HELPER_PORT="${ORO_AUTH_HELPER_PORT:-18800}"

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

# One-time ChatGPT subscription OAuth bootstrap for Railway.
# The mobile helper exposes the OpenAI login URL and accepts the final
# localhost:1455 callback URL, then feeds it into OpenClaw's interactive OAuth
# prompt through a FIFO/PTTY. This avoids API-key billing and uses the user's
# ChatGPT/Codex subscription instead.
if [ "${ORO_OPENAI_OAUTH_LOGIN:-0}" = "1" ] && [ ! -f "$OAUTH_MARKER" ]; then
  echo "[ORO] Starting ChatGPT OAuth helper"
  rm -f "$OAUTH_FIFO" "$OAUTH_LOG"
  mkfifo "$OAUTH_FIFO"
  # Keep both ends open so the auth process can start before the user submits
  # the callback URL.
  exec 3<>"$OAUTH_FIFO"

  start_gateway_background
  sleep 4

  ORO_OAUTH_LOG="$OAUTH_LOG" \
  ORO_OAUTH_FIFO="$OAUTH_FIFO" \
  ORO_OAUTH_DONE="$OAUTH_MARKER" \
  ORO_AUTH_HELPER_PORT="$HELPER_PORT" \
  node /usr/local/bin/oro-oauth-helper.mjs &
  HELPER_PID=$!

  echo "[ORO] OPENAI_OAUTH_BEGIN"
  set +e
  script -qefc "node dist/index.js models auth login --provider openai --method oauth --set-default" "$OAUTH_LOG" <&3 >/dev/null 2>&1 &
  LOGIN_PID=$!
  wait "$LOGIN_PID"
  LOGIN_STATUS=$?
  set -e

  if [ "$LOGIN_STATUS" -eq 0 ]; then
    touch "$OAUTH_MARKER"
    echo "[ORO] OPENAI_OAUTH_COMPLETE"
  else
    echo "[ORO] OPENAI_OAUTH_FAILED status=$LOGIN_STATUS" >&2
  fi

  kill -TERM "$HELPER_PID" 2>/dev/null || true
  wait "$HELPER_PID" 2>/dev/null || true
  exec 3>&- 3<&-
  rm -f "$OAUTH_FIFO"
  stop_gateway_background
fi

echo "[ORO] Starting OpenClaw Gateway on port $PORT_VALUE"
exec node dist/index.js gateway run \
  --allow-unconfigured \
  --auth token \
  --token "$OPENCLAW_GATEWAY_TOKEN" \
  --bind lan \
  --port "$PORT_VALUE"
