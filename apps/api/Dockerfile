# === Build stage: mise + Go ===
FROM debian:13-slim AS build

RUN apt-get update \
    && apt-get -y --no-install-recommends install \
        curl git ca-certificates \
    && rm -rf /var/lib/apt/lists/*

ENV MISE_DATA_DIR="/mise" \
    MISE_INSTALL_PATH="/usr/local/bin/mise" \
    PATH="/mise/shims:$PATH"

RUN curl https://mise.run | sh

WORKDIR /app

# Single source of truth: install Go from the repo's .mise.toml
COPY .mise.toml /app/.mise.toml
RUN mise trust /app/.mise.toml && mise install go

# Module cache (cached unless go.mod changes)
COPY apps/api/go.mod /app/apps/api/
WORKDIR /app/apps/api
RUN go mod download

# Build the static binary
COPY apps/api /app/apps/api
RUN CGO_ENABLED=0 go build -ldflags="-s -w" -o /server .

# === Dev stage: minimal runtime with shell access (compose target) ===
FROM debian:13-slim AS dev
COPY --from=build /server /server
USER nobody
CMD ["/server"]

# === Production stage: distroless (default target) ===
FROM gcr.io/distroless/static-debian12
COPY --from=build /server /server
USER nonroot:nonroot
CMD ["/server"]
