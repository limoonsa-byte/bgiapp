FROM ghcr.io/openclaw/openclaw:latest

USER root
RUN apt-get update \
    && apt-get install -y --no-install-recommends util-linux \
    && rm -rf /var/lib/apt/lists/*
COPY gateway-start.sh /usr/local/bin/oro-openclaw-start
COPY oauth-helper.mjs /usr/local/bin/oro-oauth-helper.mjs
RUN chmod +x /usr/local/bin/oro-openclaw-start

USER node
ENV HOME=/home/node \
    OPENCLAW_HOME=/home/node \
    OPENCLAW_STATE_DIR=/home/node/.openclaw \
    OPENCLAW_CONFIG_PATH=/home/node/.openclaw/openclaw.json \
    OPENCLAW_WORKSPACE_DIR=/home/node/.openclaw/workspace

EXPOSE 18789
ENTRYPOINT ["/usr/local/bin/oro-openclaw-start"]
