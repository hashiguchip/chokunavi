FROM debian:13-slim

RUN apt-get update \
    && apt-get -y --no-install-recommends install \
        curl git ca-certificates \
    && rm -rf /var/lib/apt/lists/*

ENV MISE_DATA_DIR="/mise" \
    MISE_INSTALL_PATH="/usr/local/bin/mise" \
    PATH="/mise/shims:$PATH"

RUN curl https://mise.run | sh

WORKDIR /app

# Single source of truth: install Node from the repo's .mise.toml
COPY .mise.toml /app/.mise.toml
RUN mise trust /app/.mise.toml && mise install node

# Install npm deps (cached unless package*.json changes)
COPY apps/web/package.json apps/web/package-lock.json /app/
RUN npm ci

# App source (compose bind-mounts ./apps/web/src over /app/src for hot reload)
COPY apps/web /app/

CMD ["npm", "run", "dev"]
