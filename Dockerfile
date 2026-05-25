###############################################################################
## Build (Node.js)
###############################################################################
FROM node:24 AS node

WORKDIR /app
COPY . .

WORKDIR /app/shhhare_app
RUN npm install
RUN npm run build

WORKDIR /app/shhhare_doc
RUN npm install
RUN npm run build

###############################################################################
## Build (Rust)
###############################################################################
FROM rust:1.95 AS rust

ARG GIT_HASH
ENV GIT_HASH=${GIT_HASH}

WORKDIR /app
COPY . .

WORKDIR /app/shhhare/static
COPY --from=node /app/shhhare/static .

WORKDIR /app/shhhare
RUN cargo build --release

###############################################################################
## Production
###############################################################################
FROM debian:stable-slim

RUN apt-get update \
    && apt-get install -y --no-install-recommends ca-certificates \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY --from=rust /app/shhhare/target/release/shhhare .

# Run the app
CMD ["/app/shhhare"]
